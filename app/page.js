/**
 * app/page.js — KitchenMaster Homepage
 *
 * Rendering Strategy: Incremental Static Regeneration (ISR)
 *   - Statically generated at build time and re-validated every 3600 seconds
 *     (1 hour) in the background (stale-while-revalidate).
 *   - Pre-rendered HTML is served directly from Vercel's CDN → best possible
 *     Google Lighthouse scores and Core Web Vitals for SEO.
 *
 * Architecture:
 *   This Server Component fetches the recipe list and passes it to
 *   <RecipeGrid> (a Client Component) which handles the live search filter.
 *   The search bar does NOT require a server round-trip — it filters the
 *   pre-loaded array in the browser.
 *
 * Data Flow:
 *   getRecipeList() → lib/supabase.js → public.recipe_ingredients
 */

import { getRecipeList } from '@/lib/supabase'
import RecipeGrid from '@/components/RecipeGrid'

import HomeUIClient from '@/components/HomeUIClient'

// ─── ISR: Revalidate cached page every 1 hour (3600 s) ───────────────────────
export const revalidate = 3600

// ─── SEO Metadata ───────────────────────────────────────────────────────────
export const metadata = {
  title: 'KitchenMaster — Your Smart Telugu Cooking Guide',
  description:
    'Discover authentic Telugu recipes with step-by-step instructions and smart ' +
    'serving size adjustments. Cook smarter with KitchenMaster.',
  keywords: [
    'Telugu recipes', 'Andhra cooking', 'Indian recipes',
    'step-by-step cooking', 'kitchen guide', 'పులిహోర', 'గుత్తి వంకాయ',
  ],
  openGraph: {
    title: 'KitchenMaster — Your Smart Telugu Cooking Guide',
    description: 'Discover authentic Telugu recipes with smart serving size adjustments.',
    type: 'website',
    url: process.env.NEXT_PUBLIC_SITE_URL,
  },
}

// ─── Page Component (Server Component — no "use client") ────────────────────
export default async function HomePage() {
  const { recipes, error } = await getRecipeList()

  return (
    <HomeUIClient recipesCount={recipes.length}>
      <RecipeGrid recipes={recipes} error={error} />
    </HomeUIClient>
  )
}
