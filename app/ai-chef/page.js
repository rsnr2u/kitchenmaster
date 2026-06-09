'use client'

import { useState, useRef } from 'react'
import { useLanguage } from '@/context/LanguageContext'

const QUICK_CHIPS = [
  'టొమాటో', 'ఉల్లిపాయ', 'అల్లం', 'వెల్లుల్లి', 'అన్నం',
  'పప్పు', 'ఆవాలు', 'కారం', 'పసుపు', 'కొత్తిమీర',
  'నూనె', 'ఆకుకూర', 'వంకాయ', 'మిర్చి', 'కొబ్బరి',
]

const LOADING_MESSAGES = [
  'మీ వంటను రూపొందిస్తున్నాను... 🍳',
  'తెలుగు వంటకాన్ని సృష్టిస్తున్నాను... 🌶️',
  'సరుకులను పరిశీలిస్తున్నాను... 🥦',
  'రుచికరమైన recipe తయారు చేస్తున్నాను... ✨',
]

export default function AIChefPage() {
  const [inputText, setInputText]         = useState('')
  const [selectedChips, setSelectedChips] = useState(new Set())
  const [status, setStatus]               = useState('idle')
  const [recipe, setRecipe]               = useState(null)
  const [recipeSource, setRecipeSource]   = useState(null)  // 'cache' | 'ai'
  const [errorMsg, setErrorMsg]           = useState('')
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0)
  const timerRef = useRef(null)

  const { currentLanguage, langMeta, t } = useLanguage()

  function getIngredients() {
    const typed = inputText.split(/[,、，\n]/).map((s) => s.trim()).filter(Boolean)
    return [...new Set([...typed, ...Array.from(selectedChips)])]
  }

  function toggleChip(chip) {
    setSelectedChips((prev) => {
      const next = new Set(prev)
      next.has(chip) ? next.delete(chip) : next.add(chip)
      return next
    })
  }

  function startLoadingCycle() {
    setLoadingMsgIdx(0)
    timerRef.current = setInterval(() => {
      setLoadingMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length)
    }, 1800)
  }

  function stopLoadingCycle() {
    clearInterval(timerRef.current)
  }

  async function handleGenerate() {
    const ingredients = getIngredients()
    if (!ingredients.length) return
    setStatus('loading'); setRecipe(null); setErrorMsg('')
    startLoadingCycle()
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients, selectedLanguage: currentLanguage, language: langMeta.englishLabel }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Unknown error from AI service.')
      setRecipe(data); setRecipeSource(data.source ?? 'ai'); setStatus('success')
    } catch (err) {
      setErrorMsg(err.message); setStatus('error')
    } finally {
      stopLoadingCycle()
    }
  }

  function handleReset() {
    setStatus('idle'); setRecipe(null); setRecipeSource(null); setErrorMsg('')
    setInputText(''); setSelectedChips(new Set())
  }

  const ingredients = getIngredients()
  const canGenerate = ingredients.length > 0 && status !== 'loading'

  return (
    <main className="min-h-screen bg-[#FAF6F0] selection:bg-[#E05A00]/20 selection:text-[#1E120C]">

      {/* Hero Header */}
      <header className="py-20 text-center">
        <div className="relative max-w-3xl mx-auto px-6">
          <span className="inline-block mb-4 px-4 py-1.5 rounded-full bg-white shadow-sm text-xs font-bold tracking-widest uppercase border border-[#1E120C]/10 text-[#E05A00]">
            Gemini Intelligence
          </span>
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight mb-6 text-[#1E120C]">
            {t('ai.title')}
          </h1>
          <p className="text-xl text-[#1E120C]/70 max-w-xl mx-auto font-medium">
            {t('ai.subtitle')}
          </p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-24 space-y-12">

        {/* INPUT PANEL */}
        {(status === 'idle' || status === 'error') && (
          <section className="bg-white rounded-[2.5rem] shadow-2xl shadow-[#1E120C]/5 border border-[#1E120C]/5 p-8 sm:p-12">
            <div className="mb-8">
              <label htmlFor="ingredients-input" className="block text-sm font-bold text-[#1E120C] uppercase tracking-wider mb-4">
                Your Canvas
              </label>
              <textarea
                id="ingredients-input"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t('ai.placeholder')}
                rows={4}
                className="w-full px-6 py-5 rounded-2xl border-0 bg-[#FAF6F0] text-[#1E120C] text-xl font-medium placeholder-[#1E120C]/30 resize-none focus:outline-none focus:ring-4 focus:ring-[#E05A00]/20 transition-all shadow-inner"
                lang="te" dir="auto"
                style={{ 
                  backgroundImage: 'repeating-linear-gradient(transparent, transparent 39px, rgba(30,18,12,0.05) 40px)',
                  lineHeight: '40px'
                }}
              />
            </div>

            <div className="mb-10">
              <p className="text-xs font-bold text-[#1E120C]/50 uppercase tracking-widest mb-4">Quick Palette</p>
              <div className="flex flex-wrap gap-3">
                {QUICK_CHIPS.map((chip) => {
                  const sel = selectedChips.has(chip)
                  return (
                    <button
                      key={chip} type="button" onClick={() => toggleChip(chip)} lang="te"
                      className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 active:scale-90 ${
                        sel 
                          ? 'bg-[#1E120C] text-white shadow-md scale-105' 
                          : 'bg-[#FAF6F0] text-[#1E120C]/70 hover:bg-white hover:text-[#1E120C] hover:shadow-sm hover:scale-105'
                      }`}
                    >
                      {chip}
                    </button>
                  )
                })}
              </div>
            </div>

            {ingredients.length > 0 && (
              <div className="bg-[#FAF6F0] rounded-2xl px-6 py-4 border border-[#1E120C]/5 mb-10">
                <p className="text-xs font-bold text-[#1E120C]/50 uppercase tracking-widest mb-2">
                  Selected Elements ({ingredients.length})
                </p>
                <p className="text-lg text-[#1E120C] font-medium leading-relaxed" lang="te">
                  {ingredients.join(' · ')}
                </p>
              </div>
            )}

            {status === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-2xl px-6 py-4 mb-10">
                <p className="text-sm font-bold text-red-700">⚠️ Error during generation</p>
                <p className="text-sm text-red-600 mt-1">{errorMsg}</p>
              </div>
            )}

            <button
              id="generate-recipe-btn" onClick={handleGenerate} disabled={!canGenerate}
              className={`w-full py-5 rounded-2xl font-black text-lg tracking-widest uppercase transition-all duration-300 active:scale-95 ${
                canGenerate 
                  ? 'bg-[#E05A00] text-white shadow-[0_8px_30px_rgba(224,90,0,0.3)] hover:bg-[#c24e00] hover:-translate-y-1' 
                  : 'bg-[#FAF6F0] text-[#1E120C]/20 cursor-not-allowed'
              }`}
            >
              {status === 'error' ? 'Retry Generation' : t('ai.button')}
            </button>
          </section>
        )}

        {/* LOADING STATE */}
        {status === 'loading' && (
          <section className="bg-white rounded-[2.5rem] shadow-2xl shadow-[#1E120C]/5 border border-[#1E120C]/5 p-16 text-center">
            <div className="relative mx-auto w-32 h-32 mb-12">
              <div className="absolute inset-0 rounded-full border-[3px] border-[#E05A00]/20 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
              <div className="absolute inset-2 rounded-full border-[3px] border-[#E05A00]/40 animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
              <div className="absolute inset-4 rounded-full bg-[#E05A00]/10 flex items-center justify-center animate-pulse">
                <span className="text-5xl" role="img" aria-label="cooking">✨</span>
              </div>
            </div>
            
            <p className="text-3xl font-black text-[#1E120C] tracking-tight mb-4">
              {t('ai.loading')}
            </p>
            <p className="text-xl text-[#E05A00] font-medium" lang="te" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
              {LOADING_MESSAGES[loadingMsgIdx]}
            </p>
          </section>
        )}

        {/* SUCCESS STATE */}
        {status === 'success' && recipe && (
          <section className="space-y-8 animate-[fadeInUp_0.5s_ease-out]">
            <div className="bg-[#1E120C] rounded-[2.5rem] p-12 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#E05A00] rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <span className="text-sm font-bold uppercase tracking-widest text-white/50">
                  {langMeta.flag} {langMeta.englishLabel} Edition
                </span>
                {recipeSource === 'cache' && (
                  <span className="px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs font-bold tracking-widest border border-white/20">
                    From Cache
                  </span>
                )}
              </div>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight relative z-10 text-white">
                {recipe.recipe_name}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Ingredients column */}
              <div className="md:col-span-1 bg-white rounded-[2rem] shadow-xl shadow-[#1E120C]/5 p-8 border border-[#1E120C]/5">
                <h3 className="text-sm font-bold text-[#1E120C]/50 uppercase tracking-widest mb-6">
                  Ingredients
                </h3>
                <ul className="space-y-4">
                  {recipe.ingredients.map((ing, i) => (
                    <li key={i} className="flex items-center gap-3 text-[#1E120C] font-medium">
                      <div className="w-2 h-2 rounded-full bg-[#E05A00] flex-shrink-0"></div>
                      <span className="leading-snug">{ing}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Steps column */}
              <div className="md:col-span-2 bg-white rounded-[2rem] shadow-xl shadow-[#1E120C]/5 p-8 sm:p-12 border border-[#1E120C]/5">
                <h3 className="text-sm font-bold text-[#1E120C]/50 uppercase tracking-widest mb-8">
                  The Process
                </h3>
                <ol className="space-y-8">
                  {recipe.steps.map((step, i) => (
                    <li key={i} className="flex gap-6 group">
                      <div className="flex-shrink-0 text-3xl font-black text-[#1E120C]/10 group-hover:text-[#E05A00] transition-colors mt-1">
                        {(i + 1).toString().padStart(2, '0')}
                      </div>
                      <p className="text-[#1E120C]/80 leading-relaxed text-lg font-medium">{step}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button id="try-again-btn" onClick={handleReset} className="flex-1 py-5 rounded-2xl font-black text-sm uppercase tracking-widest bg-white border-2 border-[#1E120C]/10 text-[#1E120C] hover:bg-[#FAF6F0] transition-all active:scale-95">
                Adjust Ingredients
              </button>
              <button id="new-recipe-btn" onClick={handleReset} className="flex-1 py-5 rounded-2xl font-black text-sm uppercase tracking-widest bg-[#E05A00] text-white shadow-[0_8px_30px_rgba(224,90,0,0.3)] hover:bg-[#c24e00] hover:-translate-y-1 transition-all active:scale-95">
                New Masterpiece
              </button>
            </div>
          </section>
        )}

      </div>

      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  )
}
