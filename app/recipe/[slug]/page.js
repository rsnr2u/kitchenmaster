/**
 * app/recipe/[slug]/page.js — Dynamic Recipe Detail Page
 *
 * Rendering Strategy: Incremental Static Regeneration (ISR)
 *   - generateStaticParams() pre-renders every known recipe at build time.
 *   - export const revalidate = 3600 re-bakes stale pages in the background
 *     every 1 hour — zero live server compute for most visitors.
 *   - dynamicParams = true allows new recipes added to the DB to be rendered
 *     on first visit then cached automatically (no rebuild needed).
 *
 * Architecture:
 *   This file is a pure Server Component. All interactive logic (serving
 *   size scaler, countdown timers) lives in RecipeClient.js ("use client").
 *   Data is fetched here on the server and passed down as serialisable props.
 *
 * Auth & Activity Tracking:
 *   - Uses utils/supabase/server.js (cookie-based) to read the session.
 *   - If a user is logged in, inserts a row into public.user_cooking_activity
 *     with status = 'cooking' when they open this page.
 *   - Guests (no session) are silently skipped — no error, no crash.
 *   - The insert is fire-and-forget: even if it fails, the page still renders.
 *
 * Slug convention:
 *   The slug is the URL-encoded recipe_name from the database.
 *   e.g. "పులిహోర" → "/recipe/%E0%B0%AA%E0%B1%81%E0%B0%B2%E0%B0%BF%E0%B0%B9%E0%B1%8B%E0%B0%B0"
 */

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getRecipeList, getRecipeIngredients, getRecipeSteps } from '@/lib/supabase'
import { createClient } from '@/utils/supabase/server'
import RecipeClient from './RecipeClient'

// ─── ISR Configuration ───────────────────────────────────────────────────────
export const revalidate = 3600      // Revalidate cached page every 1 hour
export const dynamicParams = true   // Allow on-demand rendering for new recipes

// ─── Static Path Generation ──────────────────────────────────────────────────
// Called at build time — pre-renders a static page for every known recipe.
// New recipes are handled dynamically via dynamicParams = true.
export async function generateStaticParams() {
  const { recipes, error } = await getRecipeList()
  if (error || !recipes.length) return []

  return recipes.map((name) => ({
    slug: encodeURIComponent(name),
  }))
}

// ─── Dynamic SEO Metadata ─────────────────────────────────────────────────────
// Called per-recipe at render time — each page gets unique, indexable metadata.
export async function generateMetadata({ params }) {
  // In Next.js 15+, params is a Promise — await for forward compatibility.
  const { slug } = await params
  const recipeName = decodeURIComponent(slug)

  const title = `How to make authentic ${recipeName} step-by-step in Telugu & English`
  const description = `Learn how to cook authentic ${recipeName} perfectly every time. Interactive step-by-step cooking instructions with smart serving sizes and AI timers.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/recipe/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    }
  }
}

// ─── Activity Logger (server-side, auth-aware) ────────────────────────────────
/**
 * Inserts a row into public.user_cooking_activity when an authenticated user
 * opens this page. Silently skips for guests (user === null).
 *
 * @param {string} recipeName  — The recipe the user is viewing
 * @param {number} membersCount — Initial serving count (default 1 at page load)
 */
async function logCookingActivity(recipeName, membersCount = 1) {
  try {
    // Use the authenticated server client — reads the user JWT from cookies.
    const supabase = await createClient()

    // getUser() is the secure way to read the session server-side.
    // It returns null.user for unauthenticated requests — never throws.
    const { data: { user } } = await supabase.auth.getUser()

    // ── Guest safety gate ─────────────────────────────────────────────────
    // Do NOT insert if the user is not logged in.
    if (!user) return

    // ── Insert activity record ─────────────────────────────────────────────
    const { error } = await supabase
      .from('user_cooking_activity')
      .insert({
        user_id:       user.id,       // UUID from Supabase Auth
        recipe_name:   recipeName,
        members_count: membersCount,  // 1 at initial page load
        status:        'cooking',     // initial status
      })

    if (error) {
      // Log the error server-side but don't surface it to the user.
      // Common causes: RLS policy blocks the insert, table doesn't exist yet.
      console.warn('[KitchenMaster] Activity tracking insert failed:', error.message)
    }
  } catch (err) {
    // Safety net — the page must never crash due to tracking failures.
    console.warn('[KitchenMaster] Activity tracking threw unexpectedly:', err.message)
  }
}

// ─── Page Component ───────────────────────────────────────────────────────────
export default async function RecipePage({ params }) {
  const { slug } = await params
  const recipeName = decodeURIComponent(slug)

  // ── Parallel data fetch + activity log ─────────────────────────────────────
  // All three operations fire simultaneously (Promise.all):
  //   1. Fetch ingredients
  //   2. Fetch preparation steps
  //   3. Log cooking activity (no-op for guests)
  // This minimises server-side latency even with the extra tracking call.
  const [
    { data: ingredients, error: ingError },
    { data: steps, error: stepError },
  ] = await Promise.all([
    getRecipeIngredients(recipeName),
    getRecipeSteps(recipeName),
    logCookingActivity(recipeName, 1), // fire-and-forget; result is not used
  ])

  // 404 if the recipe doesn't exist or returned no ingredients
  if (ingError || !ingredients || ingredients.length === 0) {
    notFound()
  }

  const stepList = steps ?? []

  // ─── JSON-LD Structured Data Schema ───────────────────────────────────────
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipeName,
    description: `How to make authentic ${recipeName} step-by-step.`,
    author: {
      '@type': 'Organization',
      name: 'KitchenMaster'
    },
    recipeIngredient: ingredients.map(i => `${i.base_quantity_g}g ${i.ingredient_name}`),
    recipeInstructions: stepList.map(s => ({
      '@type': 'HowToStep',
      text: s.instruction_te
    })),
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      
      {/* ── SEO Schema Injection ───────────────────────────────────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Interactive Recipe Body (Client Component) ─────────────────────── */}
      <RecipeClient
        recipeName={recipeName}
        ingredients={ingredients}
        steps={stepList}
      />

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#1E120C]/10 text-center py-12 text-sm text-[#1E120C]/50 mt-10">
        <p className="font-bold uppercase tracking-wider text-xs mb-2">KitchenMaster</p>
        <p>© {new Date().getFullYear()} — Made for the modern epicurean.</p>
      </footer>
    </main>
  )
}
