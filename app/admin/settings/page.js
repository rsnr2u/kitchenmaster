import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import SettingsManager from '@/components/admin/SettingsManager'

export const metadata = {
  title: 'Global Settings | Admin Dashboard',
}

export default async function AdminSettingsPage() {
  // Use the service role to ensure reliable access to settings
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: settings, error } = await supabaseAdmin
    .from('site_settings')
    .select('*')
    .eq('id', 1)
    .single()

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-10">
      
      {/* Header */}
      <header>
        <span className="inline-block px-3 py-1 bg-[#1E120C] text-white text-xs font-bold tracking-widest uppercase rounded-full mb-4">
          Configuration
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-[#1E120C] tracking-tight">
          Global Settings
        </h1>
      </header>

      {/* Settings UI */}
      <SettingsManager initialSettings={settings || {}} />

    </div>
  )
}
