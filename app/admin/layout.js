import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import AdminLogoutButton from '@/components/admin/AdminLogoutButton'
import AdminSidebarNav from '@/components/admin/AdminSidebarNav'

export const metadata = {
  title: 'Admin Dashboard',
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // ─── Security Guardrail (Moved to Layout) ──────────────────────────────────
  if (!user || user.email !== 'rsnr4u@gmail.com') {
    return (
      <main className="min-h-screen bg-[#FAF6F0] flex items-center justify-center p-6">
        <div className="bg-white rounded-[2.5rem] p-12 text-center shadow-xl border border-[#1E120C]/5 max-w-md w-full">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl mx-auto flex items-center justify-center text-3xl font-black mb-6">
            !
          </div>
          <h1 className="text-3xl font-black text-[#1E120C] tracking-tight mb-4">
            Access Denied
          </h1>
          <p className="text-[#1E120C]/60 font-medium mb-8">
            You must be signed in with an authorised administrator account to view the Control Center.
          </p>
        </div>
      </main>
    )
  }

  return (
    <div className="h-screen bg-[#FAF6F0] flex flex-col md:flex-row overflow-hidden">
      
      {/* ─── Left Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="w-full md:w-72 bg-[#1E120C] text-white flex flex-col flex-shrink-0 h-screen border-r border-[#1E120C]/10 shadow-2xl z-20">
        
        {/* Brand Header */}
        <div className="p-8 border-b border-white/10 flex-shrink-0">
          <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
            <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <span className="text-[#E05A00]">🍳</span> KitchenMaster
            </h2>
            <p className="text-xs font-bold uppercase tracking-widest text-white/50 mt-1 ml-9">
              Control Center
            </p>
          </Link>
        </div>

        {/* Navigation Menu */}
        <AdminSidebarNav />

        {/* User Profile Footer */}
        <div className="p-6 border-t border-white/10 flex-shrink-0">
          <div className="flex items-center justify-between gap-3 bg-black/20 p-3 rounded-xl">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-[#E05A00] flex items-center justify-center font-bold text-lg flex-shrink-0">
                A
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">Admin</p>
                <p className="text-xs text-white/50 truncate">{user.email}</p>
              </div>
            </div>
            <AdminLogoutButton />
          </div>
        </div>
      </aside>

      {/* ─── Right Viewport ────────────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
        {children}
      </main>

    </div>
  )
}
