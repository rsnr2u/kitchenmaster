'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useLanguage, LANGUAGES } from '@/context/LanguageContext'

export default function Navbar() {
  const [user, setUser]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const pathname                = usePathname()
  const langRef                 = useRef(null)
  const { currentLanguage, setLanguage, langMeta, t } = useLanguage()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    function handleClick(e) {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleSignIn() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(window.location.pathname)}`,
      },
    })
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setMenuOpen(false)
  }

  const avatarUrl = user?.user_metadata?.avatar_url
  const fullName  = user?.user_metadata?.full_name ?? user?.email ?? 'User'
  const firstName = fullName.split(' ')[0]

  if (pathname?.startsWith('/admin')) {
    return null
  }

  return (
    <nav
      className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-xl border-b border-[#1E120C]/5 shadow-sm transition-all"
      aria-label="Main navigation"
    >
      <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between gap-4">

        {/* Brand logo */}
        <Link
          href="/"
          id="navbar-logo"
          className="flex items-center gap-3 group flex-shrink-0"
        >
          <div className="w-10 h-10 bg-[#1E120C] text-[#FAF6F0] rounded-xl flex items-center justify-center font-black text-xl shadow-lg group-hover:bg-[#E05A00] transition-colors duration-300">
            K
          </div>
          <span className="hidden sm:inline font-black text-[#1E120C] text-xl tracking-tight">KitchenMaster<span className="text-[#E05A00]">.</span></span>
        </Link>

        {/* Centre nav links — desktop only; replaced by BottomNav on mobile */}
        <nav className="hidden md:flex items-center gap-2 bg-[#FAF6F0]/80 p-1.5 rounded-full border border-[#1E120C]/5 shadow-inner" aria-label="Primary navigation">
          <Link
            href="/"
            id="nav-home"
            className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
              pathname === '/'
                ? 'bg-[#1E120C] text-white shadow-md'
                : 'text-[#1E120C]/60 hover:text-[#1E120C] hover:bg-[#1E120C]/5'
            }`}
          >
            Home
          </Link>
          <Link
            href="/ai-chef"
            id="nav-ai-chef"
            className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
              pathname === '/ai-chef'
                ? 'bg-[#1E120C] text-white shadow-md'
                : 'text-[#1E120C]/60 hover:text-[#1E120C] hover:bg-[#1E120C]/5'
            }`}
          >
            {t('nav.ai_chef')}
          </Link>
        </nav>

        {/* Right side: language + auth */}
        <div className="flex items-center gap-4">

          {/* LANGUAGE SELECTOR */}
          <div ref={langRef} className="relative">
            <button
              id="language-selector-btn"
              onClick={() => setLangOpen((o) => !o)}
              aria-label="Select language"
              aria-expanded={langOpen}
              aria-haspopup="listbox"
              className="flex items-center gap-2 px-3 py-2 rounded-full bg-white border border-[#1E120C]/10 hover:border-[#1E120C]/20 hover:shadow-sm text-sm font-bold text-[#1E120C] transition-all"
            >
              <span className="text-base leading-none">{langMeta.flag}</span>
              <span className="hidden sm:inline text-xs tracking-wider">{langMeta.code.toUpperCase()}</span>
              <svg
                className={`w-3.5 h-3.5 text-[#1E120C]/40 transition-transform duration-300 ${langOpen ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {langOpen && (
              <div
                className="absolute right-0 mt-3 w-56 z-30 bg-white rounded-3xl shadow-2xl border border-[#1E120C]/5 overflow-hidden py-2"
                role="listbox"
                aria-label="Language options"
              >
                <p className="px-4 pt-2 pb-3 text-xs font-bold text-[#1E120C]/40 uppercase tracking-widest">
                  Select Language
                </p>
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    role="option"
                    aria-selected={currentLanguage === lang.code}
                    id={`lang-option-${lang.code}`}
                    onClick={() => { setLanguage(lang.code); setLangOpen(false) }}
                    className={`w-full flex items-center gap-4 px-4 py-3 text-sm transition-all text-left ${
                      currentLanguage === lang.code
                        ? 'bg-[#FAF6F0] text-[#1E120C] font-black'
                        : 'text-[#1E120C]/70 hover:bg-gray-50 hover:text-[#1E120C] font-semibold'
                    }`}
                  >
                    <span className="text-xl leading-none flex-shrink-0">{lang.flag}</span>
                    <div className="min-w-0">
                      <div className="truncate">{lang.label}</div>
                      <div className="text-xs text-[#1E120C]/40 truncate font-medium">{lang.englishLabel}</div>
                    </div>
                    {currentLanguage === lang.code && (
                      <svg className="ml-auto w-4 h-4 text-[#E05A00] flex-shrink-0"
                           fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" clipRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414L8.414 15l-5.121-5.121a1 1 0 011.414-1.414L8.414 12.172l6.879-6.879a1 1 0 011.414 0z"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div className="w-10 h-10 rounded-full bg-[#1E120C]/5 animate-pulse" aria-hidden="true" />
          )}

          {/* GUEST — Sign In */}
          {!loading && !user && (
            <button
              id="signin-google-btn"
              onClick={handleSignIn}
              className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-[#1E120C] text-white shadow-[0_4px_14px_0_rgba(30,18,12,0.2)] hover:shadow-[0_6px_20px_rgba(30,18,12,0.23)] hover:bg-[#2c1d13] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 text-sm font-bold"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4 flex-shrink-0 bg-white rounded-full p-[2px]" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.1 0 5.6 1.1 7.5 2.8l5.6-5.6C33.5 3.7 29.1 2 24 2 14.9 2 7.2 7.7 4.2 15.6l6.5 5C12.3 14.5 17.6 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.4c-.5 2.8-2.1 5.2-4.5 6.8l7 5.4c4.1-3.8 6.2-9.4 6.2-16.2z"/>
                <path fill="#FBBC05" d="M10.7 28.6A14.3 14.3 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6l-6.5-5C2.5 17 2 20.4 2 24s.5 7 1.8 10.1l6.9-5.5z"/>
                <path fill="#34A853" d="M24 46c5.1 0 9.5-1.7 12.7-4.6l-7-5.4c-1.7 1.1-3.9 1.8-5.7 1.8-6.4 0-11.7-4.3-13.3-10.1l-6.9 5.5C7.2 40.3 14.9 46 24 46z"/>
              </svg>
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}

          {/* LOGGED IN — Avatar dropdown */}
          {!loading && user && (
            <div className="relative">
              <button
                id="user-menu-btn"
                onClick={() => setMenuOpen((o) => !o)}
                aria-label={`User menu for ${fullName}`}
                aria-expanded={menuOpen}
                aria-haspopup="true"
                className="flex items-center gap-3 px-2 py-1.5 rounded-full bg-white border border-[#1E120C]/10 hover:border-[#1E120C]/20 hover:shadow-sm transition-all cursor-pointer group"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={fullName} width={32} height={32}
                       className="w-8 h-8 rounded-full object-cover ring-2 ring-transparent group-hover:ring-[#E05A00]/20 transition-all"
                       referrerPolicy="no-referrer" />
                ) : (
                  <span className="w-8 h-8 rounded-full bg-[#1E120C] flex items-center justify-center text-[#FAF6F0] text-xs font-bold ring-2 ring-transparent group-hover:ring-[#E05A00]/20 transition-all">
                    {firstName[0]?.toUpperCase()}
                  </span>
                )}
                <span className="hidden sm:inline text-sm font-bold text-[#1E120C] max-w-[90px] truncate">
                  {firstName}
                </span>
                <div className="pr-2">
                  <svg
                    className={`w-4 h-4 text-[#1E120C]/40 transition-transform duration-300 ${menuOpen ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden="true" />
                  <div
                    className="absolute right-0 mt-3 w-64 z-20 bg-white rounded-3xl shadow-2xl border border-[#1E120C]/5 overflow-hidden"
                    role="menu" aria-label="User menu"
                  >
                    <div className="px-5 py-4 bg-[#FAF6F0]/50 border-b border-[#1E120C]/5">
                      <p className="text-xs text-[#1E120C]/50 font-bold uppercase tracking-widest mb-1">Signed in as</p>
                      <p className="text-base font-black text-[#1E120C] truncate">{fullName}</p>
                      <p className="text-sm text-[#1E120C]/60 truncate font-medium">{user.email}</p>
                    </div>
                    <div className="p-2">
                      <button
                        id="signout-btn"
                        role="menuitem"
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-red-600 hover:bg-red-50 transition-colors text-left"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </nav>
  )
}
