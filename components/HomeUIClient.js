'use client'

import { useLanguage } from '@/context/LanguageContext'

export default function HomeUIClient({ children, recipesCount }) {
  const { t } = useLanguage()

  return (
    <main className="min-h-screen bg-[#FAF6F0] text-[#1E120C]">
      {/* ── Hero Section ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-32 pb-24 flex flex-col items-center justify-center text-center px-6">
        {/* Decorative elements for 'editorial' feel */}
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none mix-blend-overlay"></div>
        
        <span className="inline-block mb-8 px-5 py-2 rounded-full bg-white/60 backdrop-blur-md text-xs font-bold tracking-widest uppercase border border-[#1E120C]/10 text-[#1E120C] shadow-sm">
          {t('home.hero.badge')}
        </span>

        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-6 text-[#1E120C] drop-shadow-sm">
          {t('home.hero.title')}
        </h1>

        <p className="text-xl sm:text-2xl text-[#1E120C]/70 max-w-2xl mx-auto leading-relaxed mb-12 font-medium">
          {t('home.hero.subtitle')}
        </p>

        {/* Stat pills styled elegantly */}
        <div className="flex flex-wrap justify-center gap-6">
          <div className="px-6 py-3 rounded-full bg-white/80 backdrop-blur-md border border-[#1E120C]/5 text-sm font-bold text-[#1E120C] shadow-sm">
            {recipesCount} {t('home.hero.stat1')}
          </div>
          <div className="px-6 py-3 rounded-full bg-white/80 backdrop-blur-md border border-[#1E120C]/5 text-sm font-bold text-[#1E120C] shadow-sm">
            {t('home.hero.stat2')}
          </div>
          <div className="px-6 py-3 rounded-full bg-white/80 backdrop-blur-md border border-[#1E120C]/5 text-sm font-bold text-[#1E120C] shadow-sm">
            {t('home.hero.stat3')}
          </div>
        </div>
      </section>

      {/* ── Recipe Grid ─────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        {children}
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#1E120C]/10 text-center py-12 text-sm text-[#1E120C]/50 mt-10">
        <p className="font-bold uppercase tracking-wider text-xs mb-2">{t('footer.kitchenmaster')}</p>
        <p>© {new Date().getFullYear()} {t('footer.made_for')}</p>
      </footer>
    </main>
  )
}
