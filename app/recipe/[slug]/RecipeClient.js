'use client'

import { useState, useEffect, useRef } from 'react'
import CountdownTimer from '@/components/recipe/CountdownTimer'
import { useLanguage } from '@/context/LanguageContext'

function formatQuantity(grams) {
  if (grams >= 1000) return `${(grams / 1000).toFixed(2)} kg`
  if (grams < 1)     return `${Math.round(grams * 1000)} mg`
  return `${Number.isInteger(grams) ? grams : grams.toFixed(1)} g`
}

function Shimmer({ width = 'w-32' }) {
  return <span className={`inline-block ${width} h-4 rounded bg-gray-200 animate-pulse`} aria-hidden="true" />
}

function BrandImage({ src, alt }) {
  const [error, setError] = useState(false)
  if (!src || error) {
    return <span className="w-8 h-8 rounded-full bg-amber-100 flex-shrink-0 flex items-center justify-center text-amber-500 text-xs shadow-sm" aria-hidden="true">🌿</span>
  }
  return (
    <img 
      src={src} 
      alt={alt || ''} 
      width={32} height={32}
      className="w-8 h-8 object-contain rounded flex-shrink-0 bg-white" 
      loading="lazy"
      onError={() => setError(true)}
    />
  )
}

export default function RecipeClient({ recipeName, ingredients, steps }) {
  const [members, setMembers] = useState(1)
  const decrement = () => setMembers((m) => Math.max(1, m - 1))
  const increment = () => setMembers((m) => Math.min(20, m + 1))

  const { currentLanguage, langMeta, t } = useLanguage()
  const [translating, setTranslating]   = useState(false)
  const [translatedTitle, setTranslatedTitle] = useState(null)
  const [translatedIng, setTI]          = useState(null)
  const [translatedSteps, setTS]        = useState(null)
  const [translationError, setTransErr] = useState(false)
  const cacheRef = useRef(new Map())

  useEffect(() => {
    if (currentLanguage === 'TE') {
      setTranslatedTitle(null); setTI(null); setTS(null); setTransErr(false)
      return
    }
    if (cacheRef.current.has(currentLanguage)) {
      const c = cacheRef.current.get(currentLanguage)
      setTranslatedTitle(c.title); setTI(c.ingredients); setTS(c.steps); setTransErr(false)
      return
    }
    let cancelled = false
    setTranslating(true)
    setTransErr(false)

    async function translate() {
      try {
        const ingTexts  = ingredients.map((i) => i.ingredient_name)
        const stepTexts = steps.map((s) => s.instruction_te)
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texts: [recipeName, ...ingTexts, ...stepTexts], target_language: langMeta.englishLabel }),
        })
        if (!res.ok) throw new Error('Translation API error')
        const { translations } = await res.json()
        if (!cancelled) {
          const tTitle = translations[0]
          const tI = translations.slice(1, 1 + ingTexts.length)
          const tS = translations.slice(1 + ingTexts.length)
           cacheRef.current.set(currentLanguage, { title: tTitle, ingredients: tI, steps: tS })
          setTranslatedTitle(tTitle)
          setTI(tI); setTS(tS)
        }
      } catch (err) {
        console.warn('[RecipeClient] Translation failed:', err.message)
        if (!cancelled) setTransErr(true)
      } finally {
        if (!cancelled) setTranslating(false)
      }
    }
    translate()
    return () => { cancelled = true }
  }, [currentLanguage, langMeta.englishLabel, ingredients, steps])

  const displayTitle   = translating ? null : (translatedTitle ?? recipeName)
  const displayIngName = (i) => translating ? null : (translatedIng?.[i] ?? ingredients[i].ingredient_name)
  const displayStep    = (i) => translating ? null : (translatedSteps?.[i] ?? steps[i].instruction_te)

  return (
    <>
      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden bg-[#1E120C] text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#E05A00] rounded-full blur-[100px] opacity-20 pointer-events-none"></div>

        <div className="relative max-w-5xl mx-auto px-6 py-14">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-white/50 hover:text-white
                       text-sm font-bold tracking-widest uppercase mb-8 transition-colors group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            {t('recipe.back')}
          </a>

          {/* Recipe title */}
          <h1
            lang={currentLanguage}
            className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight drop-shadow-sm mb-6"
          >
            {displayTitle === null ? <Shimmer width="w-2/3" /> : displayTitle}
          </h1>

          {/* Stat badges */}
          <div className="flex flex-wrap gap-3">
            <span className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm
                             border border-white/10 text-xs font-bold uppercase tracking-widest">
              🥦 {ingredients.length} {t('recipe.ingredients_badge')}
            </span>
            <span className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm
                             border border-white/10 text-xs font-bold uppercase tracking-widest">
              👣 {steps.length} {t('recipe.steps_badge')}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

      {translationError && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 flex items-center gap-3 text-sm text-yellow-800">
          <span>⚠️</span>
          <span>
            Translation unavailable — showing original Telugu.
            <button
              onClick={() => { cacheRef.current.delete(currentLanguage); setTransErr(false) }}
              className="ml-2 underline font-semibold hover:no-underline"
            >
              Retry
            </button>
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

        {/* LEFT — Ingredients */}
        <section aria-labelledby="ingredients-heading">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h2 id="ingredients-heading" className="text-xl font-bold text-gray-800">
              {t('recipe.ingredients_title')}
            </h2>
            <fieldset className="flex items-center gap-2 bg-white border border-amber-200 rounded-full px-3 py-2 shadow-sm" aria-label="Adjust serving size">
              <legend className="sr-only">Serving size</legend>
              <button
                id="scaler-decrement" type="button" onClick={decrement}
                aria-label="Decrease serving size" disabled={members <= 1}
                className="w-8 h-8 rounded-full bg-orange-100 hover:bg-orange-200 text-orange-700 font-bold text-lg leading-none flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >−</button>
              <select
                id="scaler-select" value={members}
                onChange={(e) => setMembers(Number(e.target.value))}
                aria-label="Number of people"
                className="text-sm font-semibold text-gray-700 tabular-nums bg-transparent border-none focus:outline-none cursor-pointer w-28 text-center"
              >
                {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n} {n === 1 ? t('recipe.person') : t('recipe.people')}</option>
                ))}
              </select>
              <button
                id="scaler-increment" type="button" onClick={increment}
                aria-label="Increase serving size" disabled={members >= 20}
                className="w-8 h-8 rounded-full bg-orange-100 hover:bg-orange-200 text-orange-700 font-bold text-lg leading-none flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >+</button>
            </fieldset>
          </div>

          <ul className="space-y-3" aria-label="Ingredient list">
            {ingredients.map((ing, idx) => {
              const name = displayIngName(idx)
              return (
                <li key={ing.ingredient_name} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-amber-100 shadow-sm hover:border-orange-200 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <BrandImage src={ing.brand_promotion_logo} alt={ing.brand_name} />
                    <span className="text-gray-700 font-medium truncate">
                      {name === null ? <Shimmer width="w-28" /> : (
                        ing.affiliate_url ? (
                          <a 
                            href={ing.affiliate_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[#E05A00] hover:underline font-bold flex items-center gap-1.5"
                            title={`Buy from ${ing.brand_name || 'partner'}`}
                          >
                            <span lang={currentLanguage}>{name}</span>
                            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                          </a>
                        ) : (
                          <span lang={currentLanguage}>{name}</span>
                        )
                      )}
                    </span>
                  </div>
                  <span className="text-orange-600 font-semibold text-sm ml-4 flex-shrink-0 tabular-nums">
                    {formatQuantity(ing.base_quantity_g * members)}
                  </span>
                </li>
              )
            })}
          </ul>
          <p className="mt-4 text-xs text-gray-400 text-right">
            {t('recipe.scaled_for').replace('{members}', members).replace('{noun}', members === 1 ? t('recipe.person') : t('recipe.people'))}
          </p>
        </section>

        {/* RIGHT — Steps */}
        <section aria-labelledby="steps-heading">
          <h2 id="steps-heading" className="text-xl font-bold text-gray-800 mb-6 flex items-center flex-wrap gap-2">
            <span>{t('recipe.cooking_steps_title')}</span>
            {translating && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                {t('recipe.translating')}
              </span>
            )}
          </h2>

          {steps.length === 0 ? (
            <div className="bg-white rounded-2xl border border-amber-100 p-8 text-center text-gray-500">
              <p className="text-3xl mb-3">📋</p>
              <p className="font-medium">{t('recipe.no_steps')}</p>
            </div>
          ) : (
            <ol className="space-y-5" aria-label="Cooking steps">
              {steps.map((step, idx) => {
                const instruction = displayStep(idx)
                return (
                  <li key={step.step_no} className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5 hover:border-orange-200 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-orange-500 text-white font-bold text-sm flex items-center justify-center shadow-sm" aria-label={`Step ${step.step_no}`}>
                        {step.step_no}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-700 leading-relaxed text-base" lang={currentLanguage}>
                          {instruction === null
                            ? <><Shimmer width="w-full" /><Shimmer width="w-3/4" /></>
                            : instruction}
                        </p>
                        {step.base_duration_minutes > 0 && (
                          <CountdownTimer minutes={step.base_duration_minutes} stepNo={step.step_no} />
                        )}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </section>

      </div>
      </div>
    </>
  )
}
