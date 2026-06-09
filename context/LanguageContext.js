'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { DICTIONARY } from '@/lib/i18n/dictionary'

export const LANGUAGES = [
  { code: 'TE', label: 'తెలుగు',   englishLabel: 'Telugu',   flag: '🇮🇳', dir: 'ltr' },
  { code: 'EN', label: 'English',   englishLabel: 'English',   flag: '🇬🇧', dir: 'ltr' },
  { code: 'HI', label: 'हिन्दी',   englishLabel: 'Hindi',    flag: '🇮🇳', dir: 'ltr' },
  { code: 'TA', label: 'தமிழ்',    englishLabel: 'Tamil',    flag: '🇮🇳', dir: 'ltr' },
  { code: 'KN', label: 'ಕನ್ನಡ',    englishLabel: 'Kannada',  flag: '🇮🇳', dir: 'ltr' },
  { code: 'ES', label: 'Español',   englishLabel: 'Spanish',  flag: '🇪🇸', dir: 'ltr' },
  { code: 'AR', label: 'العربية',   englishLabel: 'Arabic',   flag: '🇸🇦', dir: 'rtl' },
  { code: 'FR', label: 'Français',  englishLabel: 'French',   flag: '🇫🇷', dir: 'ltr' },
]

const DEFAULT_LANG = 'TE'
const STORAGE_KEY  = 'km_language'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [currentLanguage, setCurrentLanguageState] = useState(DEFAULT_LANG)
  const [isLanguageSelected, setIsLanguageSelected] = useState(false)
  const [isLanguageLoading, setIsLanguageLoading] = useState(true)

  // Rehydrate from localStorage on first client render
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored && LANGUAGES.some((l) => l.code === stored.toUpperCase())) {
        setCurrentLanguageState(stored.toUpperCase())
        setIsLanguageSelected(true)
      }
    } catch {
      // localStorage may be blocked
    } finally {
      setIsLanguageLoading(false)
    }
  }, [])

  // Persist choice + update <html dir> for RTL languages (Arabic)
  function setLanguage(code) {
    const uppercaseCode = String(code).toUpperCase()
    setCurrentLanguageState(uppercaseCode)
    setIsLanguageSelected(true)
    try {
      localStorage.setItem(STORAGE_KEY, uppercaseCode)
    } catch { /* ignore */ }
    const meta = LANGUAGES.find((l) => l.code === uppercaseCode)
    if (meta) {
      document.documentElement.setAttribute('dir', meta.dir)
    }
  }

  const langMeta = LANGUAGES.find((l) => l.code === currentLanguage) ?? LANGUAGES[0]

  // Translation helper function
  const t = useCallback((key) => {
    // 1. Check current language
    if (DICTIONARY[currentLanguage] && DICTIONARY[currentLanguage][key]) {
      return DICTIONARY[currentLanguage][key]
    }
    // 2. Fallback to English
    if (DICTIONARY['EN'] && DICTIONARY['EN'][key]) {
      return DICTIONARY['EN'][key]
    }
    // 3. Fallback to the key itself
    return key
  }, [currentLanguage])

  return (
    <LanguageContext.Provider value={{ 
      currentLanguage, 
      setLanguage, 
      langMeta, 
      LANGUAGES, 
      t,
      isLanguageSelected,
      isLanguageLoading
    }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    throw new Error('useLanguage must be used inside <LanguageProvider>')
  }
  return ctx
}
