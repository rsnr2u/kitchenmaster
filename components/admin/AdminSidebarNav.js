'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AdminSidebarNav() {
  const pathname = usePathname()

  const links = [
    { href: '/admin', icon: '📊', label: 'Dashboard', exact: true },
    { href: '/admin/brands', icon: '💎', label: 'Brand Sponsorships' },
    { href: '/admin/users', icon: '👥', label: 'User Management' },
    { href: '/admin/settings', icon: '⚙️', label: 'Settings' },
  ]

  return (
    <nav className="flex-1 overflow-y-auto p-6 space-y-2">
      {links.map((link) => {
        const isActive = link.exact 
          ? pathname === link.href 
          : pathname?.startsWith(link.href) && link.href !== '#'

        return (
          <Link 
            key={link.label}
            href={link.href}
            className={`flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-colors ${
              isActive 
                ? 'bg-white/10 text-white shadow-inner' 
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="text-xl">{link.icon}</span>
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
