'use client'

/**
 * components/RecipeGrid.js — Client Component for recipe search + display
 *
 * Receives the full recipe list from the Server Component (page.js) and
 * provides a live search bar that filters results in-browser without any
 * server round-trips — keeping the ISR cache fully intact.
 *
 * Props:
 *   @param {string[]}    recipes  — Array of unique recipe names from DB
 *   @param {object|null} error    — Supabase error object, if any
 */

import { useState, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'

// Mapping of Telugu recipe names → food emojis for visual richness.
// Falls back to 🍳 for any unrecognised recipe.
const RECIPE_EMOJI_MAP = {
  'పులిహోర': '🍋',
  'గుత్తి వంకాయ కూర': '🍆',
}

function getEmoji(name) {
  return RECIPE_EMOJI_MAP[name] ?? '🍳'
}

export default function RecipeGrid({ recipes, error }) {
  const [query, setQuery] = useState('')
  const { currentLanguage, langMeta, t } = useLanguage()
  
  const [translating, setTranslating] = useState(false)
  const [translationError, setTransErr] = useState(false)
  const [translatedMap, setTranslatedMap] = useState({})
  const cacheRef = useRef(new Map())

  useEffect(() => {
    if (currentLanguage === 'TE' || !recipes || recipes.length === 0) {
      setTranslatedMap({})
      setTransErr(false)
      return
    }

    if (cacheRef.current.has(currentLanguage)) {
      setTranslatedMap(cacheRef.current.get(currentLanguage))
      setTransErr(false)
      return
    }

    let cancelled = false
    setTranslating(true)
    setTransErr(false)

    async function translate() {
      try {
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texts: recipes, target_language: langMeta.englishLabel }),
        })
        if (!res.ok) throw new Error('Translation API error')
        const { translations } = await res.json()
        
        if (!cancelled) {
          const newMap = {}
          recipes.forEach((r, idx) => {
            newMap[r] = translations[idx] || r
          })
          cacheRef.current.set(currentLanguage, newMap)
          setTranslatedMap(newMap)
        }
      } catch (err) {
        console.warn('[RecipeGrid] Translation failed:', err)
        if (!cancelled) setTransErr(true)
      } finally {
        if (!cancelled) setTranslating(false)
      }
    }
    translate()
    return () => { cancelled = true }
  }, [currentLanguage, langMeta.englishLabel, recipes])

  // Memoised filter — checks both original Telugu name and translated name
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return recipes
    return recipes.filter((name) => {
      const display = translatedMap[name] || name
      return name.toLowerCase().includes(q) || display.toLowerCase().includes(q)
    })
  }, [query, recipes, translatedMap])

  return (
    <>
      {/* ── Section heading + live search bar ──────────────────────────────── */}
      <div className="flex flex-col items-center justify-center gap-6 mb-16 text-center">
        <div>
          <h2 className="text-3xl font-black text-[#1E120C] tracking-tight">
            {t('grid.title')}
          </h2>
          <p className="text-sm text-[#1E120C]/60 mt-2 font-medium">
            {t('grid.explore').replace('{visible}', filtered.length).replace('{total}', recipes.length)}
          </p>
        </div>

        {/* Search bar */}
        <div className="relative w-full max-w-xl group">
          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-5 flex items-center text-[#1E120C]/40 pointer-events-none group-focus-within:text-[#E05A00] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            id="recipe-search"
            type="search"
            placeholder={t('grid.search_placeholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search recipes"
            className="w-full pl-14 pr-12 py-4 rounded-3xl border-0 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-[#1E120C] placeholder-[#1E120C]/30 text-lg font-medium focus:outline-none focus:ring-4 focus:ring-[#E05A00]/20 transition-all duration-300"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              aria-label={t('grid.clear_search')}
              className="absolute inset-y-0 right-4 flex items-center justify-center text-[#1E120C]/40 hover:text-[#E05A00] hover:bg-orange-50 rounded-full w-10 h-10 my-auto transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Error State ─────────────────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 mb-8 shadow-sm">
          <p className="font-bold text-lg mb-1">⚠️ Could not load recipes.</p>
          <p className="text-sm font-medium">Please check your database connection.</p>
          <code className="block mt-3 text-xs font-mono bg-red-100/50 px-4 py-2 rounded-xl text-red-800">
            {error.message}
          </code>
        </div>
      )}

      {/* ── Empty State (no recipes in DB) ──────────────────────────────────── */}
      {!error && recipes.length === 0 && (
        <div className="text-center text-[#1E120C]/50 py-24 bg-white rounded-[2rem] shadow-sm border border-[#1E120C]/5">
          <p className="text-6xl mb-6">🥣</p>
          <p className="text-xl font-black text-[#1E120C]">{t('grid.no_recipes')}</p>
          <p className="text-base mt-2 max-w-sm mx-auto font-medium">
            {t('grid.no_recipes_sub')}
          </p>
        </div>
      )}

      {/* ── No Search Results ────────────────────────────────────────────────── */}
      {!error && recipes.length > 0 && filtered.length === 0 && (
        <div className="text-center text-[#1E120C]/50 py-24 bg-white rounded-[2rem] shadow-sm border border-[#1E120C]/5">
          <p className="text-5xl mb-6">🔎</p>
          <p className="text-xl font-black text-[#1E120C]">{t('grid.no_matches')} &ldquo;{query}&rdquo;</p>
          <button
            onClick={() => setQuery('')}
            className="mt-6 px-6 py-2.5 bg-[#FAF6F0] text-[#1E120C] rounded-full text-sm font-bold hover:bg-[#E05A00] hover:text-white transition-all"
          >
            {t('grid.clear_search')}
          </button>
        </div>
      )}

      {/* ── Translation Error Warning ────────────────────────────────────────── */}
      {translationError && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-2xl p-4 mb-8 shadow-sm flex items-center justify-between gap-4 text-sm font-medium">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <p>
              AI translation is currently busy. Some titles are showing in original Telugu.
            </p>
          </div>
          <button
            onClick={() => { cacheRef.current.delete(currentLanguage); setTransErr(false) }}
            className="px-4 py-1.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-900 rounded-full text-xs font-bold transition-colors shrink-0"
          >
            Retry Translation
          </button>
        </div>
      )}

      {/* ── Recipe Cards Grid ────────────────────────────────────────────────── */}
      {filtered.length > 0 && (
        <ul
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10"
          aria-label="Recipe list"
        >
          {filtered.map((recipeName) => (
            <li key={recipeName}>
              <Link
                href={`/recipe/${encodeURIComponent(recipeName)}`}
                id={`recipe-card-${encodeURIComponent(recipeName)}`}
                className="group flex flex-col bg-white rounded-[2rem] shadow-2xl shadow-[#1E120C]/5 hover:shadow-2xl hover:shadow-[#E05A00]/10 hover:scale-[1.03] transition-all duration-500 overflow-hidden h-full border border-white"
              >
                <div className="p-8 flex flex-col flex-1 relative bg-gradient-to-br from-white to-[#FAF6F0]/80">
                  {/* Micro-badge */}
                  <div className="absolute top-6 right-6 px-3.5 py-1.5 bg-white rounded-full text-xs font-black text-[#1E120C]/70 shadow-sm border border-[#1E120C]/5 uppercase tracking-widest">
                    {t('grid.prep_time')}
                  </div>

                  {/* Emoji with subtle hover zoom */}
                  <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border border-[#1E120C]/5 flex items-center justify-center text-4xl mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                    {getEmoji(recipeName)}
                  </div>

                  {/* Recipe name */}
                  <h3
                    lang={currentLanguage}
                    className="text-2xl font-black text-[#1E120C] leading-tight mb-8 flex-1 group-hover:text-[#E05A00] transition-colors"
                  >
                    {translating ? (
                      <span className="inline-block w-3/4 h-8 bg-[#1E120C]/10 rounded animate-pulse" />
                    ) : (
                      translatedMap[recipeName] || recipeName
                    )}
                  </h3>

                  {/* CTA */}
                  <div className="mt-auto flex items-center justify-between border-t border-[#1E120C]/5 pt-6">
                    <span className="text-xs font-black text-[#1E120C]/40 uppercase tracking-widest group-hover:text-[#E05A00] transition-colors">
                      {t('grid.view_recipe')}
                    </span>
                    <span className="w-10 h-10 rounded-full bg-[#FAF6F0] flex items-center justify-center group-hover:bg-[#E05A00] group-hover:text-white text-[#1E120C] transition-all shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
