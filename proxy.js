/**
 * proxy.js  (project root)
 *
 * Next.js 16+ Proxy — replaces the old middleware.js convention.
 * Runs on every matched request before rendering.
 * Delegates Supabase session refresh so server-side auth state stays current.
 *
 * The `config.matcher` excludes static assets to avoid unnecessary overhead.
 */

import { updateSession } from './utils/supabase/middleware'

// Next.js 16 requires either a default export or a named "proxy" export.
export async function proxy(request) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     *   - _next/static  (static files)
     *   - _next/image   (Next.js image optimisation)
     *   - favicon.ico, sitemap.xml, robots.txt (SEO / crawlers)
     *   - Any path ending in a common static file extension
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
