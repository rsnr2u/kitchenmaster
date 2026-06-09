/**
 * utils/supabase/client.js
 *
 * Browser-side Supabase client — use inside Client Components ("use client").
 * Uses @supabase/ssr createBrowserClient which handles cookie-based auth
 * automatically, keeping sessions in sync with the server.
 *
 * Usage:
 *   import { createClient } from '@/utils/supabase/client'
 *   const supabase = createClient()
 */

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
