import { createClient } from '@/utils/supabase/server'
import BrandManager from '@/components/admin/BrandManager'

export const metadata = {
  title: 'Brand Sponsorships | Admin Dashboard',
}

export default async function AdminBrandsPage() {
  const supabase = await createClient()

  // Fetch all active brand rules
  const { data: brandRules, error: brandError } = await supabase
    .from('automatic_brand_rules')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      {/* Header */}
      <header className="mb-10">
        <span className="inline-block px-3 py-1 bg-[#1E120C] text-white text-xs font-bold tracking-widest uppercase rounded-full mb-4">
          Monetization
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-[#1E120C] tracking-tight">
          Brand Sponsorships
        </h1>
      </header>

      {/* Brand Manager UI */}
      <BrandManager initialRules={brandRules || []} />
    </div>
  )
}
