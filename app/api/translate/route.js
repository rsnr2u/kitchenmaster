/**
 * app/api/translate/route.js — Batch Translation via Gemini AI
 *
 * POST /api/translate
 *
 * Translates an array of culinary text strings from Telugu into the
 * requested target language using Gemini 1.5 Flash.
 *
 * Request body (JSON):
 *   {
 *     "texts":           ["అన్నం", "ఉప్పు కొంచెం"],   // array of strings to translate
 *     "target_language": "English"                     // full language name in English
 *   }
 *
 * Response (JSON):
 *   {
 *     "translations": ["Rice", "A pinch of salt"]     // same-length array, same order
 *   }
 *
 * Error response:
 *   { "error": "human-readable message" }
 *
 * Design choices:
 *   - Batches ALL strings into a single Gemini call (not one call per string).
 *     This keeps API costs minimal and latency low (~500ms for a full recipe).
 *   - Returns a JSON array in STRICT positional correspondence to the input.
 *   - Uses a JSON-mode-style prompt so stripping markdown is always safe.
 *   - Culinary terminology is explicitly preserved (e.g. "tadka" stays "tadka").
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse }        from 'next/server'

const MODEL_NAME = 'gemini-2.5-flash'

// ─── Prompt builder ───────────────────────────────────────────────────────────
function buildTranslationPrompt(texts, targetLanguage) {
  const numbered = texts.map((t, i) => `${i + 1}. ${t}`).join('\n')

  return `You are a professional culinary translator specialised in Indian cooking terminology.

Translate the following ${texts.length} cooking-related text item(s) from Telugu into ${targetLanguage}.

Rules (CRITICAL — follow exactly):
1. Return ONLY a valid JSON object in this shape: {"translations": ["...", "...", ...]}
2. The "translations" array MUST have exactly ${texts.length} element(s) — one per input item.
3. Preserve the same order as the input (translation[0] = translation of item 1, etc.).
4. Keep culinary measurements and quantities as-is (e.g., "1 cup", "2 tbsp").
5. Preserve culturally specific cooking terms naturally (tadka, tempering, etc.).
6. Do NOT wrap the JSON in markdown code fences (\`\`\`json).
7. Do NOT add any explanation, preamble, or trailing text outside the JSON.

Input items to translate:
${numbered}

Respond with only the JSON object:`
}

// ─── Strip markdown fences ────────────────────────────────────────────────────
function stripFences(raw) {
  return raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function POST(request) {
  // ── 1. Parse & validate ────────────────────────────────────────────────────
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 })
  }

  const { texts, target_language } = body

  if (!Array.isArray(texts) || texts.length === 0) {
    return NextResponse.json({ error: 'texts must be a non-empty array.' }, { status: 400 })
  }
  if (!target_language || typeof target_language !== 'string') {
    return NextResponse.json({ error: 'target_language is required.' }, { status: 400 })
  }

  // If already Telugu (source), skip the API call entirely
  if (target_language.toLowerCase() === 'telugu') {
    return NextResponse.json({ translations: texts }, { status: 200 })
  }

  // Cap input at 100 strings to avoid runaway costs
  const cappedTexts = texts.slice(0, 100).map((t) => String(t).trim())

  // ── 2. Initialise Gemini ───────────────────────────────────────────────────
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Translation service is not configured.' },
      { status: 503 }
    )
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      temperature:     0.2,   // low temp for accurate translation (not creative)
      topP:            0.8,
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
    },
  })

  // ── 3. Call Gemini (with retries for 503s) ─────────────────────────────────
  let rawText
  let retries = 3
  let delay = 1000

  while (retries > 0) {
    try {
      const result = await model.generateContent(
        buildTranslationPrompt(cappedTexts, target_language)
      )
      rawText = result.response.text()
      break // success
    } catch (err) {
      console.warn(`[translate] Gemini call failed. Retries left: ${retries - 1}. Error:`, err.message)
      retries--
      if (retries === 0) {
        return NextResponse.json(
          { error: 'Translation service is temporarily unavailable due to high demand.' },
          { status: 502 }
        )
      }
      await new Promise(r => setTimeout(r, delay))
      delay *= 2 // exponential backoff
    }
  }

  // ── 4. Parse & validate JSON ──────────────────────────────────────────────
  const cleaned = stripFences(rawText)
  let parsed
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    console.error('[translate] Failed to parse Gemini output:', cleaned)
    return NextResponse.json(
      { error: 'Translator returned an unexpected format.' },
      { status: 500 }
    )
  }

  if (
    !Array.isArray(parsed.translations) ||
    parsed.translations.length !== cappedTexts.length
  ) {
    console.error('[translate] Translation count mismatch:', parsed)
    // Fallback: return originals rather than crashing
    return NextResponse.json({ translations: cappedTexts }, { status: 200 })
  }

  // ── 5. Return ─────────────────────────────────────────────────────────────
  return NextResponse.json({ translations: parsed.translations }, { status: 200 })
}
