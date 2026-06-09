import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const metadata = {
  title: 'User Activity Profile | Admin Dashboard',
}

export default async function UserActivityPage({ params }) {
  const { id } = await params

  // 1. Fetch user profile via Admin API
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(id)
  
  if (userError || !user) {
    notFound()
  }

  // 2. Fetch cooking activity via standard server client
  const supabase = await createClient()
  const { data: activities, error: activityError } = await supabase
    .from('user_cooking_activity')
    .select('*')
    .eq('user_id', id)
    .order('created_at', { ascending: false })

  const totalCooked = activities?.length || 0
  const avatarUrl = user.user_metadata?.avatar_url
  const fullName = user.user_metadata?.full_name || 'User'
  const firstName = fullName.split(' ')[0]

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-12">
      
      {/* ─── Navigation & Header ────────────────────────────────────────────── */}
      <header>
        <Link 
          href="/admin/users"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#1E120C]/50 hover:text-[#E05A00] transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to User Management
        </Link>

        <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-xl shadow-[#1E120C]/5 border border-[#1E120C]/5 flex flex-col sm:flex-row sm:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={fullName} 
                className="w-24 h-24 rounded-full object-cover ring-4 ring-[#E05A00]/10" 
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-[#1E120C] text-[#FAF6F0] flex items-center justify-center font-black text-4xl ring-4 ring-[#E05A00]/10">
                {firstName[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-black text-[#1E120C] tracking-tight mb-1">
                {fullName}
              </h1>
              <p className="text-[#1E120C]/60 font-medium mb-3">{user.email}</p>
              <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-bold uppercase tracking-widest rounded-full">
                Active Account
              </span>
            </div>
          </div>

          <div className="bg-[#FAF6F0] rounded-2xl p-6 text-center min-w-[140px] border border-[#1E120C]/5">
            <p className="text-xs font-bold text-[#1E120C]/50 uppercase tracking-widest mb-1">Total Cooked</p>
            <p className="text-4xl font-black text-[#E05A00]">{totalCooked}</p>
          </div>
        </div>
      </header>

      {/* ─── Activity Timeline ─────────────────────────────────────────────── */}
      <section>
        <h2 className="text-2xl font-black text-[#1E120C] tracking-tight mb-8 flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-[#1E120C] text-white flex items-center justify-center text-sm">🍳</span>
          Activity Log
        </h2>

        <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-xl shadow-[#1E120C]/5 border border-[#1E120C]/5">
          {activities && activities.length > 0 ? (
            <div className="relative border-l-2 border-[#1E120C]/5 ml-4 sm:ml-6 space-y-10 py-4">
              {activities.map((activity, index) => (
                <div key={activity.id} className="relative pl-8 sm:pl-12">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-4 border-[#E05A00] shadow-sm"></div>
                  
                  <div className="bg-[#FAF6F0] rounded-2xl p-6 border border-[#1E120C]/5 transition-transform hover:-translate-y-1 hover:shadow-md">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                      <div>
                        <p className="text-sm font-bold text-[#1E120C]/50 mb-1">
                          {new Date(activity.created_at).toLocaleString(undefined, {
                            weekday: 'long', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                        <h3 className="text-xl font-black text-[#1E120C]">
                          {activity.recipe_name}
                        </h3>
                      </div>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap ${
                        activity.status === 'cooking' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {activity.status === 'cooking' ? 'Cooking Session' : activity.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-6 pt-4 border-t border-[#1E120C]/5">
                      <div className="flex items-center gap-2">
                        <span className="text-[#1E120C]/40">👥</span>
                        <span className="text-sm font-bold text-[#1E120C]">
                          {activity.members_count} Servings
                        </span>
                      </div>
                      {activity.recipe_id && (
                        <Link 
                          href={`/recipe/${activity.recipe_id}`} 
                          className="text-sm font-bold text-[#E05A00] hover:underline"
                        >
                          View Recipe →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[#FAF6F0] text-[#1E120C]/20 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                📝
              </div>
              <h3 className="text-xl font-bold text-[#1E120C] mb-2">No Activity Yet</h3>
              <p className="text-[#1E120C]/50">This user hasn't started any cooking sessions.</p>
            </div>
          )}
        </div>
      </section>

    </div>
  )
}
