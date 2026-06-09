/**
 * lib/supabase.js
 *
 * Lightweight, singleton Supabase client for general-purpose queries.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  When to use THIS file vs utils/supabase/*                              │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │  lib/supabase.js          → Simple reads on PUBLIC tables (no auth).    │
 * │                             Uses the anon key. Safe in Server Components│
 * │                             that only need public recipe data.           │
 * │                                                                          │
 * │  utils/supabase/server.js → Authenticated server queries. Reads the     │
 * │                             user's JWT from cookies → respects RLS.     │
 * │                             Required for user-specific data.            │
 * │                                                                          │
 * │  utils/supabase/client.js → Use inside "use client" components for      │
 * │                             interactive, session-aware operations.       │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * Usage:
 *   import { supabase } from '@/lib/supabase'
 *   const { data, error } = await supabase.from('recipe_ingredients').select('*')
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[KitchenMaster] Missing Supabase environment variables.\n' +
    'Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local'
  )
}

// Singleton pattern — prevents multiple GoTrueClient instances during hot reload in dev.
// In Next.js, module-level variables persist across requests on the server,
// so this is safe and efficient.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Disable automatic session persistence — this client is for public data only.
    // Authenticated actions should use utils/supabase/server.js or client.js.
    persistSession: false,
    autoRefreshToken: false,
  },
})

// ─────────────────────────────────────────────────────────────────────────────
// Typed query helpers for KitchenMaster tables
// These keep data-fetching logic out of page components and make it reusable.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch all unique recipe names from the recipe_ingredients table.
 * Returns an array of strings sorted alphabetically.
 *
 * @returns {Promise<{ recipes: string[], error: object|null }>}
 */
export async function getRecipeList() {
  const { data, error } = await supabase
    .from('recipe_ingredients')
    .select('recipe_name')
    .order('recipe_name', { ascending: true })

  if (error) return { recipes: [], error }

  // Deduplicate — recipe_name is repeated per ingredient row
  const recipes = [...new Set(data.map((row) => row.recipe_name))]

  return { recipes, error: null }
}

/**
 * Fetch all active brand rules for programmatic injection.
 */
export async function getActiveBrandRules() {
  const { data, error } = await supabase
    .from('automatic_brand_rules')
    .select('*')
  
  return { data: data || [], error }
}

/**
 * Fetch all ingredients for a specific recipe, and dynamically inject active brand promotion rules.
 *
 * @param {string} recipeName
 * @returns {Promise<{ data: object[]|null, error: object|null }>}
 */
export async function getRecipeIngredients(recipeName) {
  const [ingResult, rulesResult] = await Promise.all([
    supabase
      .from('recipe_ingredients')
      .select('ingredient_name, base_quantity_g, brand_promotion_logo')
      .eq('recipe_name', recipeName)
      .order('ingredient_name', { ascending: true }),
    getActiveBrandRules()
  ])

  const error = ingResult.error || rulesResult.error
  let data = ingResult.data

  // ── Brand Ad Engine Injection ──
  if (data && rulesResult.data && rulesResult.data.length > 0) {
    data = data.map(ing => {
      // Find the first rule where the ingredient name includes the search keyword (case-insensitive)
      const matchedRule = rulesResult.data.find(rule => 
        ing.ingredient_name.toLowerCase().includes(rule.search_keyword.toLowerCase())
      )

      if (matchedRule) {
        return {
          ...ing,
          // Override or set the brand promotion assets dynamically
          brand_promotion_logo: matchedRule.brand_logo_url || ing.brand_promotion_logo,
          affiliate_url: matchedRule.affiliate_url,
          brand_name: matchedRule.brand_name
        }
      }
      return ing
    })
  }

  return { data, error }
}

/**
 * Fetch all preparation steps for a specific recipe, ordered by step number.
 *
 * @param {string} recipeName
 * @returns {Promise<{ data: object[]|null, error: object|null }>}
 */
export async function getRecipeSteps(recipeName) {
  const { data, error } = await supabase
    .from('recipe_preparation_steps')
    .select('step_no, instruction_te, base_duration_minutes')
    .eq('recipe_name', recipeName)
    .order('step_no', { ascending: true })

  return { data, error }
}
