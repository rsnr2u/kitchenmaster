/**
 * app/auth/callback/route.js — Supabase OAuth Callback Handler
 *
 * After Google redirects the user back to KitchenMaster, Supabase appends a
 * one-time `code` parameter to the URL. This Route Handler:
 *
 *   1. Exchanges that `code` for a real Supabase session (access + refresh tokens).
 *   2. Stores the tokens in secure, HttpOnly cookies via the SSR client.
 *   3. Redirects the user back to the page they came from (or the homepage).
 *
 * Redirect URI to configure in Supabase Dashboard:
 *   Authentication → URL Configuration → Redirect URLs
 *   Add: http://localhost:3000/auth/callback   (dev)
 *        https://yourdomain.com/auth/callback  (prod)
 *
 * Also set "Site URL" to your production domain in the same settings page.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code  = searchParams.get('code')
  // `next` lets us redirect the user back to the page they were on before login.
  const next  = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Successful login — redirect to the page they came from (or homepage).
      // `origin` is the scheme + host (e.g. http://localhost:3000).
      return NextResponse.redirect(`${origin}${next}`)
    }

    // Exchange failed (expired code, reuse attempt, etc.)
    console.error('[auth/callback] exchangeCodeForSession error:', error.message)
  }

  // Fallback: redirect to an error page or homepage.
  // In production, you'd want a dedicated /auth/error page.
  return NextResponse.redirect(`${origin}/?auth_error=1`)
}
