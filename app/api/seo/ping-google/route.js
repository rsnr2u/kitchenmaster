import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'

// ─── Constants ──────────────────────────────────────────────────────────────
const WEBHOOK_SECRET = process.env.SUPABASE_WEBHOOK_SECRET
const SITE_URL_FALLBACK = (process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com').replace(/\/$/, '')
const LOG_PREFIX = '[SEO/IndexingAPI]'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Structured logger that emits JSON-serialisable log lines.
 * Vercel/Cloud log aggregators parse these automatically.
 */
function log(level, message, meta = {}) {
  const entry = {
    level,
    service: 'ping-google',
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  }
  if (level === 'error') {
    console.error(JSON.stringify(entry))
  } else {
    console.log(JSON.stringify(entry))
  }
}

/**
 * Validates the optional shared secret header sent by Supabase Webhooks.
 * Returns true if no secret is configured (open endpoint — development mode).
 */
function isAuthorized(request) {
  if (!WEBHOOK_SECRET) {
    // Secret not configured — allow but warn (useful in local dev)
    log('warn', 'SUPABASE_WEBHOOK_SECRET is not set. Endpoint is unauthenticated.')
    return true
  }
  const authHeader = request.headers.get('authorization') || ''
  return authHeader === `Bearer ${WEBHOOK_SECRET}`
}

/**
 * Extracts the recipe identifier from every known Supabase webhook shape:
 *   • payload.record.slug          (table has a `slug` column)
 *   • payload.record.recipe_name   (table uses recipe_name as PK)
 *   • payload.slug / payload.recipe_name  (flattened custom payload)
 */
function extractSlug(payload) {
  return (
    payload?.record?.slug ||
    payload?.record?.recipe_name ||
    payload?.new?.slug ||           // Supabase v2 uses `new` for UPDATE events
    payload?.new?.recipe_name ||
    payload?.slug ||
    payload?.recipe_name ||
    null
  )
}

/**
 * Safely encodes a raw slug value into a URL-safe path segment.
 * Decodes first to prevent double-encoding when the DB value is already encoded.
 */
function encodeSlug(raw) {
  try {
    return encodeURIComponent(decodeURIComponent(raw))
  } catch {
    // If decodeURIComponent throws (malformed %), encode as-is
    return encodeURIComponent(raw)
  }
}

/**
 * Fetches the live site_url from the singleton site_settings row.
 * Falls back gracefully to the env variable so the function always returns a string.
 */
async function resolveSiteUrl() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const { data, error } = await supabase
      .from('site_settings')
      .select('site_url')
      .eq('id', '1')
      .single()

    if (error) {
      log('warn', 'Could not fetch site_url from DB, using env fallback.', { dbError: error.message })
      return SITE_URL_FALLBACK
    }

    const dbUrl = data?.site_url?.replace(/\/$/, '')
    if (dbUrl && dbUrl.startsWith('http')) {
      return dbUrl
    }

    log('warn', 'site_url in DB is blank or invalid, using env fallback.', { dbValue: data?.site_url })
    return SITE_URL_FALLBACK
  } catch (err) {
    log('error', 'Unexpected error resolving site URL.', { error: err.message })
    return SITE_URL_FALLBACK
  }
}

/**
 * Builds a Google Indexing API client from the service-account JSON stored in env.
 * Throws a descriptive error if the credentials are missing or malformed.
 */
function buildIndexingClient() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!raw) {
    throw new MissingCredentialsError(
      'GOOGLE_SERVICE_ACCOUNT_JSON is not set. Add the service account key JSON to your environment variables.'
    )
  }

  let credentials
  try {
    credentials = JSON.parse(raw)
  } catch {
    throw new Error(
      'GOOGLE_SERVICE_ACCOUNT_JSON is set but contains invalid JSON. Re-paste the service account key.'
    )
  }

  if (!credentials.client_email || !credentials.private_key) {
    throw new Error(
      'Service account JSON is missing required fields: client_email or private_key.'
    )
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/indexing'],
  })

  return google.indexing({ version: 'v3', auth })
}

// ─── Custom Error Types ───────────────────────────────────────────────────────

class MissingCredentialsError extends Error {
  constructor(message) {
    super(message)
    this.name = 'MissingCredentialsError'
  }
}

// ─── Route Handler ────────────────────────────────────────────────────────────

/**
 * POST /api/seo/ping-google
 *
 * Designed to be called by a Supabase Database Webhook on INSERT / UPDATE
 * events on the `recipes` table.  Also accepts manual POST requests for
 * on-demand re-indexing with a `{ "url": "https://..." }` body.
 *
 * Webhook payload format (standard Supabase):
 * {
 *   "type": "INSERT",
 *   "table": "recipes",
 *   "record": { "slug": "butter-chicken", ... },
 *   "schema": "public",
 *   "old_record": null
 * }
 */
export async function POST(request) {
  const requestId = crypto.randomUUID()
  log('info', 'Received indexing ping request.', { requestId })

  // ── 1. Authorization ──────────────────────────────────────────────────────
  if (!isAuthorized(request)) {
    log('warn', 'Unauthorized request rejected.', { requestId })
    return NextResponse.json(
      { success: false, error: 'Unauthorized. Provide a valid Bearer token.' },
      { status: 401 }
    )
  }

  // ── 2. Parse Body ─────────────────────────────────────────────────────────
  let payload
  try {
    payload = await request.json()
  } catch {
    log('error', 'Failed to parse request body as JSON.', { requestId })
    return NextResponse.json(
      { success: false, error: 'Request body must be valid JSON.' },
      { status: 400 }
    )
  }

  log('info', 'Payload received.', { requestId, eventType: payload?.type, table: payload?.table })

  // ── 3. Resolve Target URL ─────────────────────────────────────────────────
  let targetUrl

  // Allow direct URL override for manual/on-demand pings
  if (payload?.url && typeof payload.url === 'string' && payload.url.startsWith('http')) {
    targetUrl = payload.url
    log('info', 'Using direct URL override from payload.', { requestId, targetUrl })
  } else {
    const rawSlug = extractSlug(payload)

    if (!rawSlug) {
      log('warn', 'No valid recipe slug found in payload.', { requestId, payload })
      return NextResponse.json(
        {
          success: false,
          requestId,
          error: 'No valid recipe identifier found. Expected payload.record.slug, payload.record.recipe_name, or a direct payload.url.',
          receivedPayloadKeys: payload ? Object.keys(payload) : [],
        },
        { status: 400 }
      )
    }

    const encodedSlug = encodeSlug(rawSlug)
    const baseUrl = await resolveSiteUrl()
    targetUrl = `${baseUrl}/recipe/${encodedSlug}`

    log('info', 'Constructed target URL from slug.', { requestId, rawSlug, encodedSlug, targetUrl })
  }

  // ── 4. Build Google Indexing Client ───────────────────────────────────────
  let indexingClient
  try {
    indexingClient = buildIndexingClient()
  } catch (err) {
    if (err instanceof MissingCredentialsError) {
      // Return 200 so Supabase webhook does NOT retry infinitely.
      // The operator needs to configure credentials — retrying won't fix it.
      log('warn', err.message, { requestId })
      return NextResponse.json(
        {
          success: false,
          requestId,
          skipped: true,
          reason: 'credentials_missing',
          message: err.message,
          targetUrl,
        },
        { status: 200 }
      )
    }
    // Malformed JSON — surface the error clearly
    log('error', 'Failed to build Google Indexing client.', { requestId, error: err.message })
    return NextResponse.json(
      { success: false, requestId, error: err.message },
      { status: 500 }
    )
  }

  // ── 5. Submit URL to Google Indexing API ──────────────────────────────────
  const notificationType = payload?.type === 'DELETE' ? 'URL_DELETED' : 'URL_UPDATED'

  try {
    log('info', 'Submitting URL to Google Indexing API.', { requestId, targetUrl, notificationType })

    const { data: googleResponse } = await indexingClient.urlNotifications.publish({
      requestBody: {
        url: targetUrl,
        type: notificationType,
      },
    })

    log('info', 'Google Indexing API responded successfully.', {
      requestId,
      targetUrl,
      latestUpdate: googleResponse?.urlNotificationMetadata?.latestUpdate,
    })

    // ── 6. Success Response ────────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      requestId,
      targetUrl,
      notificationType,
      googleResponse: {
        url: googleResponse?.urlNotificationMetadata?.url,
        latestUpdate: googleResponse?.urlNotificationMetadata?.latestUpdate,
      },
    })

  } catch (err) {
    // ── Google API Error Handling ──────────────────────────────────────────
    const statusCode = err?.response?.status || err?.code
    const googleMessage = err?.response?.data?.error?.message || err?.message

    log('error', 'Google Indexing API call failed.', {
      requestId,
      targetUrl,
      statusCode,
      googleError: googleMessage,
    })

    // 403 = Not owner/verified. Misconfiguration, not a transient error.
    // 429 = Rate limited. Safe to return 500 so Supabase can retry later.
    const httpStatus = statusCode === 403 ? 200 : 500

    return NextResponse.json(
      {
        success: false,
        requestId,
        targetUrl,
        error: googleMessage,
        googleStatusCode: statusCode,
        // Hint for 403 errors to guide operator action
        ...(statusCode === 403 && {
          hint: 'The service account does not have permission. Ensure it is added as an Owner in Google Search Console for this property.',
        }),
      },
      { status: httpStatus }
    )
  }
}

// ─── GET: Health Check ────────────────────────────────────────────────────────

/**
 * GET /api/seo/ping-google
 *
 * Lightweight health-check endpoint for verifying route is live.
 * Also reports credential and site URL configuration status.
 */
export async function GET() {
  const credentialsConfigured = !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  const secretConfigured = !!WEBHOOK_SECRET
  const resolvedSiteUrl = await resolveSiteUrl()

  return NextResponse.json({
    status: 'ok',
    endpoint: 'Google Indexing API Automation',
    configuration: {
      credentialsConfigured,
      webhookSecretConfigured: secretConfigured,
      resolvedSiteUrl,
    },
    usage: {
      method: 'POST',
      webhookBody: 'Standard Supabase webhook payload (payload.record.slug or payload.record.recipe_name)',
      manualBody: '{ "url": "https://yourdomain.com/recipe/butter-chicken" }',
    },
  })
}
