/**
 * app/api/gemini/route.js — AI Recipe Generation & DB Caching Layer
 *
 * Handles both:
 *   1. Recipe Name lookup (e.g. "kanda bachali" or "కంద బచ్చలి కూర")
 *   2. Ingredients overlap matching (e.g. ["tomato", "onion"])
 *
 * Uses a hybrid lookup approach:
 *   - Matches recipe name first in the database.
 *   - Matches ingredients list second using overlap scoring.
 *   - Falls back to Google Gemini AI (gemini-2.5-flash) if cache miss occurs.
 *   - Auto-persists new recipes to Supabase (safe check-then-insert pattern).
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// ─── Constants ────────────────────────────────────────────────────────────────
const MODEL_NAME         = 'gemini-2.5-flash'
const CACHE_MIN_OVERLAP  = 0.5   // 50% threshold for ingredient match
const DEFAULT_QUANTITY_G = 100   // fallback quantity

// ════════════════════════════════════════════════════════════════════════════
// SECTION 1 — DB Helpers (Safe reads with Anon Key)
// ════════════════════════════════════════════════════════════════════════════

function createAnonClient() {
  return createSupabaseJsClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

function createServiceRoleClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    console.warn('[Gemini] SUPABASE_SERVICE_ROLE_KEY not set — DB write skipped.')
    return null
  }
  return createSupabaseJsClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceKey,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

/**
 * Searches the DB for a recipe that significantly overlaps with the user's
 * ingredient list. Returns the best-matching recipe name, or null on miss.
 */
async function findCachedRecipeName(db, ingredients) {
  try {
    const orFilter = ingredients
      .map((ing) => `ingredient_name.ilike.%${ing.replace(/[%_]/g, '\\$&')}%`)
      .join(',')

    const { data, error } = await db
      .from('recipe_ingredients')
      .select('recipe_name, ingredient_name')
      .or(orFilter)

    if (error || !data || data.length === 0) return null

    const coverageMap = new Map()

    for (const row of data) {
      if (!coverageMap.has(row.recipe_name)) {
        coverageMap.set(row.recipe_name, new Set())
      }
      for (const ing of ingredients) {
        if (row.ingredient_name.toLowerCase().includes(ing.toLowerCase()) ||
            ing.toLowerCase().includes(row.ingredient_name.toLowerCase())) {
          coverageMap.get(row.recipe_name).add(ing)
        }
      }
    }

    let bestRecipe  = null
    let bestCount   = 0
    for (const [recipeName, matched] of coverageMap.entries()) {
      if (matched.size > bestCount) {
        bestCount  = matched.size
        bestRecipe = recipeName
      }
    }

    const threshold = Math.ceil(ingredients.length * CACHE_MIN_OVERLAP)
    if (bestCount >= threshold) {
      console.log(`[Gemini] Cache HIT: "${bestRecipe}" covers ${bestCount}/${ingredients.length} ingredients.`)
      return bestRecipe
    }

    console.log(`[Gemini] Cache MISS: best match covered only ${bestCount}/${ingredients.length} ingredients.`)
    return null
  } catch (err) {
    console.warn('[Gemini] Cache lookup threw unexpectedly:', err.message)
    return null
  }
}

/**
 * Fetches ingredients and preparation steps for a given recipe name.
 */
async function fetchRecipeFromDB(db, recipeName) {
  const [{ data: ingRows, error: ingErr }, { data: stepRows, error: stepErr }] =
    await Promise.all([
      db
        .from('recipe_ingredients')
        .select('ingredient_name, base_quantity_g')
        .eq('recipe_name', recipeName)
        .order('ingredient_name', { ascending: true }),
      db
        .from('recipe_preparation_steps')
        .select('step_no, instruction_te')
        .eq('recipe_name', recipeName)
        .order('step_no', { ascending: true }),
    ])

  if (ingErr || stepErr || !ingRows || ingRows.length === 0) return null

  const ingredients = ingRows.map(
    (r) => `${r.ingredient_name} — ${r.base_quantity_g} g`
  )
  const steps = (stepRows ?? []).map((r) => r.instruction_te)

  return { recipe_name: recipeName, ingredients, steps }
}

// ════════════════════════════════════════════════════════════════════════════
// SECTION 2 — Safe DB Writes (with Service Role Key)
// ════════════════════════════════════════════════════════════════════════════

function parseIngredientString(ingredientStr) {
  const parts = ingredientStr.split(/\s*[-–:]\s*/)
  const name   = (parts[0] ?? ingredientStr).trim()

  let quantity_g = DEFAULT_QUANTITY_G
  if (parts[1]) {
    const num = parseFloat(parts[1].replace(/[^\d.]/g, ''))
    if (!isNaN(num) && num > 0 && num <= 5000) {
      quantity_g = num
    }
  }

  return { name: name || ingredientStr, quantity_g }
}

async function persistRecipeToDB(recipeName, ingredientStrings, steps) {
  try {
    const db = createServiceRoleClient()
    if (!db) return

    // Safe check-then-insert pattern (prevents unique constraint violations)
    const { data: existing, error: existErr } = await db
      .from('recipe_ingredients')
      .select('recipe_name')
      .eq('recipe_name', recipeName)
      .limit(1)

    if (existErr) {
      console.warn('[Gemini] Failed to check for existing recipe:', existErr.message)
      return
    }

    if (existing && existing.length > 0) {
      console.log(`[Gemini] Recipe "${recipeName}" already exists in DB — skipping write.`)
      return
    }

    // ── 1. Ingest ingredients ───────────────────────────────────────────────
    const ingredientRows = ingredientStrings.map((str) => {
      const { name, quantity_g } = parseIngredientString(str)
      return {
        recipe_name:           recipeName,
        ingredient_name:       name,
        base_quantity_g:       quantity_g,
        brand_promotion_logo:  null,
      }
    })

    const { error: ingErr } = await db
      .from('recipe_ingredients')
      .insert(ingredientRows)

    if (ingErr) {
      console.warn('[Gemini] Ingredient insert failed:', ingErr.message)
    } else {
      console.log(`[Gemini] Persisted ${ingredientRows.length} ingredient(s) for "${recipeName}".`)
    }

    // ── 2. Ingest steps ─────────────────────────────────────────────────────
    const stepRows = steps.map((instruction, idx) => ({
      recipe_name:          recipeName,
      step_no:              idx + 1,
      instruction_te:       instruction,
      base_duration_minutes: 0,
    }))

    const { error: stepErr } = await db
      .from('recipe_preparation_steps')
      .insert(stepRows)

    if (stepErr) {
      console.warn('[Gemini] Steps insert failed:', stepErr.message)
    } else {
      console.log(`[Gemini] Persisted ${stepRows.length} step(s) for "${recipeName}".`)
    }
  } catch (err) {
    console.warn('[Gemini] persistRecipeToDB threw unexpectedly:', err.message)
  }
}

// ════════════════════════════════════════════════════════════════════════════
// SECTION 3 — Route Handler (POST /api/gemini)
// ════════════════════════════════════════════════════════════════════════════

export async function POST(request) {
  try {
    // ── Step 1: Parse request ────────────────────────────────────────────────
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 })
    }

    const { ingredients, language, selectedLanguage } = body

    if (!ingredients) {
      return NextResponse.json({ error: 'Please provide ingredients or a recipe name.' }, { status: 400 })
    }

    // Support both array of strings and raw string input
    const isArray = Array.isArray(ingredients)
    const rawInputStr = isArray ? ingredients.join(', ') : String(ingredients).trim()
    const ingredientList = isArray
      ? ingredients.map(i => String(i).trim()).filter(Boolean)
      : rawInputStr.split(/[,、，\n]/).map((s) => s.trim()).filter(Boolean)

    if (!rawInputStr) {
      return NextResponse.json({ error: 'Input cannot be empty.' }, { status: 400 })
    }

    // Map language code (selectedLanguage) or language name
    const langMap = {
      'TE': 'Telugu',
      'EN': 'English',
      'HI': 'Hindi',
      'TA': 'Tamil',
      'KN': 'Kannada',
      'ES': 'Spanish',
      'AR': 'Arabic',
      'FR': 'French',
    }
    const targetLang = langMap[String(selectedLanguage || '').toUpperCase()] || language || 'Telugu'

    const db = createAnonClient()

    // ── Step 2: Caching Layer ────────────────────────────────────────────────
    // Check A: Is it a recipe name (exact or partial matching)?
    const cleanSearch = rawInputStr.replace(/[^\w\s\u0C00-\u0C7F]/gi, '').trim()
    if (cleanSearch.length > 2) {
      const { data: nameMatches, error: nameError } = await db
        .from('recipe_ingredients')
        .select('recipe_name')
        .ilike('recipe_name', `%${cleanSearch}%`)
        .limit(1)

      if (!nameError && nameMatches && nameMatches.length > 0) {
        const matchedName = nameMatches[0].recipe_name
        const cached = await fetchRecipeFromDB(db, matchedName)
        if (cached) {
          console.log(`[Gemini] Cache HIT on Recipe Name: "${matchedName}" matching "${cleanSearch}"`)
          return NextResponse.json({ ...cached, source: 'cache' }, { status: 200 })
        }
      }
    }

    // Check B: Is it a list of ingredients (overlap scoring)?
    if (ingredientList.length > 0) {
      const cachedRecipeName = await findCachedRecipeName(db, ingredientList)
      if (cachedRecipeName) {
        const cached = await fetchRecipeFromDB(db, cachedRecipeName)
        if (cached) {
          return NextResponse.json({ ...cached, source: 'cache' }, { status: 200 })
        }
      }
    }

    // ── Step 3: Validate Gemini Key ──────────────────────────────────────────
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error('[Gemini] GEMINI_API_KEY is not set.')
      return NextResponse.json(
        { error: 'AI service is not configured. Please contact support.' },
        { status: 503 }
      )
    }

    // ── Step 4: AI Call (Fallback & Smart Parsing) ───────────────────────────
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: {
        temperature:     0.7,
        topP:            0.9,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      },
    })

    const prompt = `You are an expert South Indian Chef. A user has entered the following input in their kitchen app: "${rawInputStr}".
    
    This input could be either a list of available ingredients (e.g., "tomato, onion") OR a specific recipe name they want to cook (e.g., "కంద బచ్చలి కూర" or "kanda bachali").
    
    Analyze the input:
    1. If it's a recipe name, generate the exact authentic recipe for that item.
    2. If it's a list of ingredients, suggest a single traditional recipe that can be made primarily using those items.
    
    You MUST return the output STRICTLY in the following JSON structure. Do not include any chat formatting, no markdown code blocks like \`\`\`json, and no trailing characters.
    
    CRUCIAL RULES FOR INGREDIENT QUANTITIES (1 PERSON SERVING):
    - Salt (ఉప్పు) MUST be strictly between 3g and 6g max per person.
    - Spices/Turmeric (పసుపు) MUST be between 0.5g and 1.5g max per person.
    - Curry leaves/Mustard seeds (కరివేపాకు, ఆవాలు) MUST be between 1g and 3g max per person.
    - Rice/Primary Grain (అన్నం/బియ్యం) should be around 80g to 100g (uncooked) or 150g to 200g (cooked) max per person.
    
    Carefully review the gram values in your generated JSON. If you output more than 6g of salt or 2g of turmeric for a 1-person portion, the user's health is at risk. Validate the mathematical logic before replying. Do not hallucinate or output random numbers.

    CRUCIAL: All text content inside the values (recipe_name, ingredients array items, and steps array items) MUST be completely written and translated in "${targetLang}" language.

    JSON Structure:
    {
      "recipe_name": "Name of the dish in ${targetLang}",
      "ingredients": [
        "Ingredient 1 with base quantity for 1 person in ${targetLang} (e.g., Onion - 100g)",
        "Ingredient 2 with base quantity for 1 person in ${targetLang} (e.g., Turmeric - 2g)"
      ],
      "steps": [
        "Step 1 description in ${targetLang}",
        "Step 2 description in ${targetLang}"
      ]
    }`

    let rawText
    try {
      const result = await model.generateContent(prompt)
      rawText = result.response.text().trim()
    } catch (err) {
      console.error('[Gemini] generateContent failed:', err.message)
      return NextResponse.json(
        { error: 'AI service is temporarily unavailable. Please try again.' },
        { status: 502 }
      )
    }

    // ── Step 5: Parse and Sanitize JSON ──────────────────────────────────────
    let cleaned = rawText
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```$/, '').trim()
    }

    let recipe
    try {
      recipe = JSON.parse(cleaned)
    } catch {
      console.error('[Gemini] Failed to parse model output as JSON:', cleaned.substring(0, 300))
      return NextResponse.json(
        { error: 'AI returned an unexpected format. Please try again.' },
        { status: 500 }
      )
    }

    if (
      typeof recipe.recipe_name !== 'string' ||
      !Array.isArray(recipe.ingredients) ||
      !Array.isArray(recipe.steps)
    ) {
      console.error('[Gemini] Parsed JSON missing required fields:', recipe)
      return NextResponse.json(
        { error: 'AI returned incomplete recipe data. Please try again.' },
        { status: 500 }
      )
    }

    // ── Step 6: Background auto-save to database ─────────────────────────────
    // Fire-and-forget; does not block the API response
    persistRecipeToDB(
      recipe.recipe_name,
      recipe.ingredients,
      recipe.steps
    ).catch((err) => {
      console.warn('[Gemini] Unhandled error in background persistRecipeToDB:', err.message)
    })

    // ── Step 7: Return Response ──────────────────────────────────────────────
    return NextResponse.json(
      {
        recipe_name:  recipe.recipe_name,
        ingredients:  recipe.ingredients,
        steps:        recipe.steps,
        source:       'ai',
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Gemini Route Error:', error)
    return NextResponse.json(
      { error: 'An unexpected server error occurred.' },
      { status: 500 }
    )
  }
}
