'use client'

import { useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'

export default function LanguageGateway({ children }) {
  const { isLanguageSelected, isLanguageLoading, setLanguage } = useLanguage()
  const [fadingOut, setFadingOut] = useState(false)

  function handleSelect(code) {
    setFadingOut(true)
    setTimeout(() => {
      setLanguage(code)
    }, 500) // matches fade out duration
  }

  return (
    <>
      {/* 
        Always render children so Next.js Server-Side Rendering (SSR) 
        can output the full HTML for SEO crawlers. 
      */}
      {children}
      
      {/* Initial Loading Overlay to prevent flash of content during hydration */}
      {isLanguageLoading && (
        <div className="fixed inset-0 z-[100] bg-[#FAF6F0] flex items-center justify-center">
          <div className="w-12 h-12 bg-[#1E120C] text-[#FAF6F0] rounded-2xl flex items-center justify-center font-black text-2xl animate-pulse shadow-2xl">
            K
          </div>
        </div>
      )}

      {/* Premium Language Selection Overlay */}
      {!isLanguageLoading && !isLanguageSelected && (
        <div 
          className={`fixed inset-0 z-[100] bg-[#FAF6F0]/80 backdrop-blur-xl flex flex-col items-center justify-center p-6 transition-opacity duration-500 ease-in-out ${fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        >
          {/* Luxury card */}
          <div className="bg-white rounded-[3rem] shadow-2xl shadow-[#1E120C]/10 border border-[#1E120C]/5 p-10 sm:p-16 max-w-3xl w-full text-center relative overflow-hidden transform transition-all">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#E05A00] rounded-full blur-[100px] opacity-10 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#1E120C] rounded-full blur-[100px] opacity-5 pointer-events-none"></div>
            
            <div className="w-16 h-16 mx-auto bg-[#1E120C] text-[#FAF6F0] rounded-2xl flex items-center justify-center font-black text-3xl shadow-xl mb-10 relative z-10">
              K
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-[#1E120C] tracking-tight mb-4 relative z-10">
              Welcome to KitchenMaster
            </h1>
            <h2 className="text-xl sm:text-3xl font-bold text-[#1E120C]/60 mb-12 relative z-10">
              కిచెన్ మాస్టర్కి స్వాగతం
            </h2>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 relative z-10">
              <button 
                onClick={() => handleSelect('EN')}
                className="w-full sm:w-auto px-8 py-5 rounded-full bg-white border-2 border-[#1E120C]/10 hover:border-[#E05A00] hover:shadow-xl hover:shadow-[#E05A00]/20 text-[#1E120C] font-black text-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
              >
                <span className="text-2xl">🇬🇧</span> English
              </button>
              
              <button 
                onClick={() => handleSelect('TE')}
                className="w-full sm:w-auto px-8 py-5 rounded-full bg-[#1E120C] border-2 border-[#1E120C] hover:bg-[#2c1d13] shadow-[0_8px_30px_rgba(30,18,12,0.3)] text-white font-black text-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
              >
                <span className="text-2xl">🇮🇳</span> తెలుగు
              </button>

              <button 
                onClick={() => handleSelect('HI')}
                className="w-full sm:w-auto px-8 py-5 rounded-full bg-white border-2 border-[#1E120C]/10 hover:border-[#E05A00] hover:shadow-xl hover:shadow-[#E05A00]/20 text-[#1E120C] font-black text-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
              >
                <span className="text-2xl">🇮🇳</span> हिन्दी
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
