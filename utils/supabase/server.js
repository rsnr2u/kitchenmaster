/**
 * utils/supabase/server.js
 *
 * Server-side Supabase client — use inside:
 *   - Server Components
 *   - Route Handlers (app/api/...)
 *   - Server Actions
 *
 * Uses @supabase/ssr createServerClient which reads/writes cookies via the
 * Next.js `cookies()` API to maintain the authenticated user session.
 * Respects Supabase Row Level Security (RLS) using the user's JWT.
 *
 * Usage:
 *   import { createClient } from '@/utils/supabase/server'
 *   const supabase = await createClient()
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method is called from a Server Component.
            // Cookies can only be mutated from Server Actions or Route Handlers.
            // This error is safe to ignore if the session is refreshed via middleware.
          }
        },
      },
    }
  )
}
