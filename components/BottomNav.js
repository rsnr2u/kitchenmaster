'use client'

/**
 * BottomNav — Mobile-Only Fixed Bottom Navigation
 *
 * Visible only on screens smaller than `md` (768px).
 * Renders two tabs: Home (/) and AI Chef (/ai-chef).
 * Active tab is highlighted with the brand accent colour.
 * A safe-area inset is applied so the bar clears the iOS home indicator.
 */

import Link      from 'next/link'
import { usePathname } from 'next/navigation'

// ─── Tab Definitions ──────────────────────────────────────────────────────────
const TABS = [
  {
    label: 'Home',
    href:  '/',
    // House icon — Heroicons outline style (24×24 viewBox)
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        className="w-6 h-6"
      >
        <path d="M3 12L12 3l9 9" />
        <path d="M9 21V12h6v9" />
        <path d="M3 12v9h18V12" />
      </svg>
    ),
    iconActive: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
        className="w-6 h-6"
      >
        <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
        <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
      </svg>
    ),
  },
  {
    label: 'AI Chef',
    href:  '/ai-chef',
    // Sparkles / wand icon — represents AI
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        className="w-6 h-6"
      >
        <path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
        <path d="M18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
      </svg>
    ),
    iconActive: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
        className="w-6 h-6"
      >
        <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5Z" clipRule="evenodd" />
      </svg>
    ),
  },
]

// ─── Component ────────────────────────────────────────────────────────────────
export default function BottomNav() {
  const pathname = usePathname()

  // Hide on admin routes — operators don't need the mobile nav
  if (pathname?.startsWith('/admin')) return null

  return (
    <nav
      aria-label="Mobile navigation"
      className={[
        // Visibility: mobile only
        'md:hidden',
        // Positioning: fixed to bottom, full width, on top of everything
        'fixed bottom-0 left-0 right-0 z-50',
        // Appearance
        'bg-white border-t border-[#1E120C]/8',
        // Layered shadow for depth
        'shadow-[0_-4px_24px_rgba(30,18,12,0.08)]',
        // iOS safe-area clearance
        'pb-[env(safe-area-inset-bottom)]',
      ].join(' ')}
    >
      <ul className="flex items-stretch h-16">
        {TABS.map((tab) => {
          const isActive =
            tab.href === '/'
              ? pathname === '/'
              : pathname?.startsWith(tab.href)

          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                id={`bottom-nav-${tab.label.toLowerCase().replace(/\s+/g, '-')}`}
                className={[
                  'flex flex-col items-center justify-center gap-0.5 h-full w-full',
                  'transition-all duration-150 active:scale-95',
                  isActive
                    ? 'text-[#E05A00]'
                    : 'text-[#1E120C]/40 hover:text-[#1E120C]/70',
                ].join(' ')}
              >
                {/* Icon */}
                <span className="transition-transform duration-150">
                  {isActive ? tab.iconActive : tab.icon}
                </span>

                {/* Label */}
                <span className={[
                  'text-[10px] font-bold tracking-wide leading-none',
                  isActive ? 'text-[#E05A00]' : '',
                ].join(' ')}>
                  {tab.label}
                </span>

                {/* Active indicator dot */}
                {isActive && (
                  <span className="absolute bottom-[calc(env(safe-area-inset-bottom)+2px)] w-1 h-1 rounded-full bg-[#E05A00]" />
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
