'use client'

/**
 * BottomNav — Mobile-Only Fixed Bottom Navigation Bar
 *
 * Locked to the bottom of the viewport with inline style position:fixed
 * so it can NEVER be displaced by parent layout flow.
 * Visible only on screens < md (768px). Hidden on desktop via md:hidden.
 * Auto-hides on /admin routes.
 */

import Link        from 'next/link'
import { usePathname } from 'next/navigation'

// ─── Tab Config ───────────────────────────────────────────────────────────────
const TABS = [
  {
    label: 'Home',
    href:  '/',
    exact: true,
    iconOutline: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        className="w-[26px] h-[26px]" aria-hidden="true"
      >
        <path d="M3 12L12 3l9 9" />
        <path d="M9 21V12h6v9" />
        <rect x="3" y="12" width="18" height="9" rx="0" fill="none" />
      </svg>
    ),
    iconSolid: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
        className="w-[26px] h-[26px]" aria-hidden="true"
      >
        <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
        <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
      </svg>
    ),
  },
  {
    label: 'AI Chef',
    href:  '/ai-chef',
    exact: false,
    iconOutline: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        className="w-[26px] h-[26px]" aria-hidden="true"
      >
        <path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
        <path d="M18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
      </svg>
    ),
    iconSolid: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
        className="w-[26px] h-[26px]" aria-hidden="true"
      >
        <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5Z" clipRule="evenodd" />
      </svg>
    ),
  },
]

// ─── Component ────────────────────────────────────────────────────────────────
export default function BottomNav() {
  const pathname = usePathname()

  // Hide on admin routes
  if (pathname?.startsWith('/admin')) return null

  return (
    <>
      {/*
        Inline style guarantees position:fixed regardless of any parent CSS.
        Tailwind classes handle everything else.
      */}
      <nav
        aria-label="Mobile bottom navigation"
        className="md:hidden"
        style={{
          position:  'fixed',
          bottom:    0,
          left:      0,
          right:     0,
          zIndex:    9999,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* Glass card */}
        <div
          className="bg-white/90 backdrop-blur-xl border-t border-black/5"
          style={{ boxShadow: '0 -4px 10px rgba(0,0,0,0.05)' }}
        >
          <ul className="grid grid-cols-2 h-16">
            {TABS.map((tab) => {
              const isActive = tab.exact
                ? pathname === tab.href
                : pathname?.startsWith(tab.href)

              return (
                <li key={tab.href} className="flex">
                  <Link
                    href={tab.href}
                    id={`bottom-nav-${tab.label.toLowerCase().replace(/\s+/g, '-')}`}
                    aria-current={isActive ? 'page' : undefined}
                    className="flex flex-col items-center justify-center gap-1 w-full h-full relative transition-all duration-150 active:scale-95"
                  >
                    {/* Icon */}
                    <span className={isActive ? 'text-[#E05A00]' : 'text-[#1E120C]/35'}>
                      {isActive ? tab.iconSolid : tab.iconOutline}
                    </span>

                    {/* Label */}
                    <span className={`text-[11px] font-bold tracking-wide leading-none ${
                      isActive ? 'text-[#E05A00]' : 'text-[#1E120C]/40'
                    }`}>
                      {tab.label}
                    </span>

                    {/* Active pill indicator */}
                    {isActive && (
                      <span
                        className="absolute top-0 left-1/2 -translate-x-1/2 h-[3px] w-8 rounded-b-full bg-[#E05A00]"
                        aria-hidden="true"
                      />
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </nav>
    </>
  )
}
