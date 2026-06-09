/**
 * app/offline/page.js — PWA Offline Fallback Page
 *
 * Served by the service worker when the user has no internet connection
 * and tries to visit a page that isn't cached yet.
 */

export const metadata = {
  title: 'You\'re Offline | KitchenMaster AI',
  description: 'No internet connection detected.',
  robots: { index: false, follow: false },
}

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center text-center px-6">
      {/* Icon */}
      <div className="w-24 h-24 rounded-3xl bg-[#1E120C] flex items-center justify-center mb-8 shadow-2xl">
        <span className="text-5xl font-black text-white">K</span>
      </div>

      {/* Offline icon */}
      <div className="w-16 h-16 rounded-full bg-[#E05A00]/10 flex items-center justify-center mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
          stroke="#E05A00" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          className="w-8 h-8"
        >
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
          <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" strokeWidth="2.5" />
        </svg>
      </div>

      <h1 className="text-3xl font-black text-[#1E120C] tracking-tight mb-3">
        You&apos;re Offline
      </h1>
      <p className="text-[#1E120C]/60 font-medium max-w-xs leading-relaxed mb-8">
        No internet connection. Previously visited recipes are still available from your cache.
      </p>

      {/* CTA */}
      <a
        href="/"
        className="inline-flex items-center gap-2 px-8 py-3 bg-[#1E120C] text-white font-bold rounded-full shadow-lg hover:bg-[#2c1d13] transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path fillRule="evenodd" d="M9.293 2.293a1 1 0 0 1 1.414 0l7 7A1 1 0 0 1 17 11h-1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6H3a1 1 0 0 1-.707-1.707l7-7Z" clipRule="evenodd" />
        </svg>
        Go to Home
      </a>

      <p className="mt-8 text-xs text-[#1E120C]/30 font-medium">
        KitchenMaster AI — Authentic Telugu Recipes
      </p>
    </div>
  )
}
