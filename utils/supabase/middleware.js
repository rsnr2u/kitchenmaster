/**
 * utils/supabase/middleware.js
 *
 * Supabase session refresh helper for Next.js Middleware.
 * Called by the root middleware.js to silently refresh expired Auth tokens
 * on every request, keeping the user session alive across page navigations.
 *
 * IMPORTANT: This must be called from middleware.js — not from components.
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function updateSession(request) {
  // Start with a passthrough response; the Supabase client may mutate its cookies.
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Mirror cookies onto both the request (for downstream server reads)
          // and the response (so the browser receives the refreshed token).
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh the session — do NOT remove this call.
  // It is required for the server client to stay in sync with the browser session.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // --- Optional: Protect routes that require authentication ---
  // Uncomment and adjust the paths below when you add auth-gated pages.
  //
  // const { pathname } = request.nextUrl
  // const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/cook')
  // if (!user && isProtectedRoute) {
  //   const loginUrl = request.nextUrl.clone()
  //   loginUrl.pathname = '/login'
  //   return NextResponse.redirect(loginUrl)
  // }

  return supabaseResponse
}
