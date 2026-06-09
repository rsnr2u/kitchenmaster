/**
 * app/layout.js — Root Layout
 *
 * Applied to every page in the application.
 * Imports global Tailwind styles, loads fonts, mounts the persistent <Navbar>,
 * and wraps the entire tree in <LanguageProvider> so every Client Component
 * can read and update the global language preference via useLanguage().
 *
 * Architecture:
 *   layout.js is a Server Component, but it renders Client Component children
 *   (<LanguageProvider>, <Navbar>) without any special wiring — Next.js handles
 *   the Server→Client boundary automatically.
 */

import './globals.css'
import Navbar             from '@/components/Navbar'
import BottomNav          from '@/components/BottomNav'
import { LanguageProvider } from '@/context/LanguageContext'
import LanguageGateway      from '@/components/LanguageGateway'

export const metadata = {
  title: {
    default:  'KitchenMaster — Smart Cooking Guide',
    template: '%s | KitchenMaster - Smart Cooking Guide',
  },
  description: 'Step-by-step authentic Telugu cooking recipes with smart serving size adjustments and dynamic AI timers.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://kitchenmaster-ai.vercel.app'),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'KitchenMaster — Smart Cooking Guide',
    description: 'Step-by-step authentic Telugu cooking recipes with smart serving size adjustments and dynamic AI timers.',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://kitchenmaster-ai.vercel.app',
    siteName: 'KitchenMaster',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KitchenMaster — Smart Cooking Guide',
    description: 'Step-by-step authentic Telugu cooking recipes with smart serving size adjustments and dynamic AI timers.',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Telugu:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        {/*
          LanguageProvider must wrap Navbar + children so both can share
          the same language state without prop-drilling.
        */}
        <LanguageProvider>
          <LanguageGateway>
            <Navbar />
            {/* pb-24 on mobile creates clearance so BottomNav never covers content */}
            <main className="pb-24 md:pb-0">
              {children}
            </main>
            <BottomNav />
          </LanguageGateway>
        </LanguageProvider>
      </body>
    </html>
  )
}
