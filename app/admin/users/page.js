import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import Link from 'next/link'
import UserManageMenu from '@/components/admin/UserManageMenu'
import UserSearchBar from '@/components/admin/UserSearchBar'

export const metadata = {
  title: 'User Management | Admin Dashboard',
}

export default async function AdminUsersPage({ searchParams }) {
  const { q } = await searchParams
  const query = q?.toLowerCase() || ''

  // Create an admin client using the service role key to access auth.admin APIs securely
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers()

  // Filter users based on search query
  const filteredUsers = (users || []).filter(user => {
    if (!query) return true
    const emailMatch = user.email?.toLowerCase().includes(query)
    const nameMatch = user.user_metadata?.full_name?.toLowerCase().includes(query)
    const idMatch = user.id.toLowerCase().includes(query)
    return emailMatch || nameMatch || idMatch
  })

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      {/* Header */}
      <header className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <span className="inline-block px-3 py-1 bg-[#1E120C] text-white text-xs font-bold tracking-widest uppercase rounded-full mb-4">
            Administration
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-[#1E120C] tracking-tight">
            User Management
          </h1>
        </div>
        <UserSearchBar />
      </header>

      {/* Users Table */}
      <section className="bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-xl shadow-[#1E120C]/5 border border-[#1E120C]/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1E120C]/10 text-xs uppercase tracking-widest text-[#1E120C]/50">
                <th className="pb-4 font-bold px-4">User</th>
                <th className="pb-4 font-bold px-4">Email</th>
                <th className="pb-4 font-bold px-4">Joined</th>
                <th className="pb-4 font-bold px-4">Last Sign-In</th>
                <th className="pb-4 font-bold px-4">Status</th>
                <th className="pb-4 font-bold px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredUsers.map((user) => {
                const avatarUrl = user.user_metadata?.avatar_url
                const fullName = user.user_metadata?.full_name || 'User'
                const firstName = fullName.split(' ')[0]

                return (
                  <tr key={user.id} className="border-b border-[#1E120C]/5 hover:bg-[#FAF6F0] transition-colors">
                    
                    {/* User Avatar & ID */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {avatarUrl ? (
                          <img 
                            src={avatarUrl} 
                            alt={fullName} 
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-[#E05A00]/20" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#1E120C] text-[#FAF6F0] flex items-center justify-center font-bold text-sm ring-2 ring-[#E05A00]/20">
                            {firstName[0]?.toUpperCase() || 'U'}
                          </div>
                        )}
                        <span className="font-mono text-xs text-[#1E120C]/40 truncate w-24" title={user.id}>
                          {user.id.substring(0, 8)}...
                        </span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-4 px-4 font-bold text-[#1E120C]">
                      {user.email}
                    </td>

                    {/* Created At */}
                    <td className="py-4 px-4 text-[#1E120C]/60 whitespace-nowrap">
                      {new Date(user.created_at).toLocaleDateString(undefined, {
                        year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </td>

                    {/* Last Sign In */}
                    <td className="py-4 px-4 text-[#1E120C]/60 whitespace-nowrap">
                      {user.last_sign_in_at 
                        ? new Date(user.last_sign_in_at).toLocaleString(undefined, { 
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                          })
                        : 'Never'}
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-4">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-green-100 text-green-700">
                        Active
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link 
                          href={`/admin/users/${user.id}`}
                          className="px-4 py-2 text-xs font-bold text-[#1E120C] bg-black/5 hover:bg-black/10 rounded-full transition-colors"
                        >
                          View Activity
                        </Link>
                        {user.email !== 'rsnr4u@gmail.com' ? (
                          <UserManageMenu userId={user.id} />
                        ) : (
                          <span className="px-4 py-2 text-xs font-bold text-gray-400 bg-gray-50 rounded-full cursor-not-allowed">
                            Protected
                          </span>
                        )}
                      </div>
                    </td>

                  </tr>
                )
              })}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-12 text-center">
                    <div className="w-16 h-16 bg-[#FAF6F0] text-[#1E120C]/20 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                      🔍
                    </div>
                    <h3 className="text-xl font-bold text-[#1E120C] mb-2">No users found</h3>
                    <p className="text-[#1E120C]/50 font-medium">Try adjusting your search query.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
