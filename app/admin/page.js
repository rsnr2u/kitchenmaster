import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getRecipeList } from '@/lib/supabase'

export const metadata = {
  title: 'Admin Dashboard',
  robots: { index: false, follow: false },
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Security guardrail has been moved to app/admin/layout.js

  // ─── 2. Parallel Data Fetching ───────────────────────────────────────────
  const [
    { recipes, error: recipeError },
    { count: liveCount, error: liveError },
    { data: activities, error: activityError }
  ] = await Promise.all([
    getRecipeList(),
    supabase
      .from('user_cooking_activity')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'cooking'),
    supabase
      .from('user_cooking_activity')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
  ])

  const totalRecipes = recipes?.length || 0
  const activeSessions = liveCount || 0
  
  // Calculated mock metric: $0.03 saved per cached recipe generated
  const costSaved = (totalRecipes * 0.03).toFixed(2)

  return (
    <div className="max-w-6xl mx-auto space-y-12 p-4 md:p-8">
      
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <span className="inline-block px-3 py-1 bg-[#1E120C] text-white text-xs font-bold tracking-widest uppercase rounded-full mb-4">
              Control Center
            </span>
            <h1 className="text-4xl sm:text-5xl font-black text-[#1E120C] tracking-tight">
              Admin Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl shadow-sm border border-[#1E120C]/5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm font-bold text-[#1E120C]">{user.email}</span>
          </div>
        </header>

        {/* ─── High-Level Metrics Row ──────────────────────────────────────── */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-[#1E120C]/5 border border-[#1E120C]/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#E05A00] rounded-full blur-[80px] opacity-10"></div>
            <p className="text-sm font-bold text-[#1E120C]/50 uppercase tracking-widest mb-2">Registered Recipes</p>
            <p className="text-5xl font-black text-[#1E120C]">{totalRecipes}</p>
          </div>
          
          {/* Card 2 */}
          <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-[#1E120C]/5 border border-[#1E120C]/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-[80px] opacity-10"></div>
            <p className="text-sm font-bold text-[#1E120C]/50 uppercase tracking-widest mb-2">Live Cooking Sessions</p>
            <p className="text-5xl font-black text-[#1E120C] flex items-center gap-4">
              {activeSessions}
              {activeSessions > 0 && <span className="flex w-3 h-3 bg-blue-500 rounded-full animate-ping"></span>}
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-[#1E120C] rounded-[2rem] p-8 shadow-xl relative overflow-hidden text-white">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#E05A00] rounded-full blur-[60px] opacity-30"></div>
            <p className="text-sm font-bold text-white/50 uppercase tracking-widest mb-2">AI API Cost Saved</p>
            <p className="text-5xl font-black text-[#E05A00]">${costSaved}</p>
          </div>
        </section>

        {/* ─── Live Activity Monitor ───────────────────────────────────────── */}
        <section className="bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-xl shadow-[#1E120C]/5 border border-[#1E120C]/5">
          <h2 className="text-2xl font-black text-[#1E120C] tracking-tight mb-8">
            Live Activity Monitor
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1E120C]/10 text-xs uppercase tracking-widest text-[#1E120C]/50">
                  <th className="pb-4 font-bold px-4">Time</th>
                  <th className="pb-4 font-bold px-4">User ID</th>
                  <th className="pb-4 font-bold px-4">Recipe</th>
                  <th className="pb-4 font-bold px-4">Serving</th>
                  <th className="pb-4 font-bold px-4">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {(activities || []).map((row) => (
                  <tr key={row.id} className="border-b border-[#1E120C]/5 hover:bg-[#FAF6F0] transition-colors">
                    <td className="py-4 px-4 text-[#1E120C]/60 whitespace-nowrap">
                      {new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-4 px-4 font-mono text-xs text-[#1E120C]/50 truncate max-w-[120px]">
                      {row.user_id}
                    </td>
                    <td className="py-4 px-4 font-bold text-[#1E120C]">
                      {row.recipe_name}
                    </td>
                    <td className="py-4 px-4 text-[#1E120C]">
                      {row.members_count} pax
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        row.status === 'cooking' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!activities || activities.length === 0) && (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-[#1E120C]/50 font-medium">
                      No recent cooking activity.
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
