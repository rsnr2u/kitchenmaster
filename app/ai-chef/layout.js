/**
 * app/ai-chef/layout.js — AI Chef route metadata
 *
 * Provides per-route SEO metadata for the /ai-chef page.
 * This is a Server Component (no "use client") — metadata export only works
 * in Server Components or layout files.
 */

export const metadata = {
  title: 'AI Chef — Generate Telugu Recipes with Gemini',
  description:
    'Tell our AI Chef what ingredients you have and get an authentic Telugu recipe ' +
    'instantly — powered by Google Gemini AI.',
  keywords: ['AI recipe generator', 'Telugu recipes AI', 'Gemini chef', 'వంటకం AI'],
  openGraph: {
    title: 'AI Chef | KitchenMaster',
    description: 'Generate authentic Telugu recipes from your ingredients using Google Gemini AI.',
    type: 'website',
  },
}

export default function AIChefLayout({ children }) {
  return children
}
