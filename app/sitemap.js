import { getRecipeList } from '@/lib/supabase'

// ─── ISR Configuration ───────────────────────────────────────────────────────
export const revalidate = 86400 // Revalidate sitemap every 24 hours

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  // ── 1. Static Routes ──────────────────────────────────────────────────────
  const staticRoutes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/ai-chef`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ]

  // ── 2. Dynamic Recipe Routes ──────────────────────────────────────────────
  const { recipes, error } = await getRecipeList()
  const recipeRoutes = []

  if (!error && recipes) {
    recipes.forEach((name) => {
      recipeRoutes.push({
        url: `${baseUrl}/recipe/${encodeURIComponent(name)}`,
        lastModified: new Date(),
        changeFrequency: 'daily', // Daily to ensure fast crawling of new generated content
        priority: 0.9,
      })
    })
  }

  return [...staticRoutes, ...recipeRoutes]
}
