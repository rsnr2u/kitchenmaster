'use client'

import { useRef, useState } from 'react'
import { addBrandRule, deleteBrandRule } from '@/app/admin/actions'

export default function BrandManager({ initialRules }) {
  const formRef = useRef(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  async function handleAdd(formData) {
    setErrorMsg('')
    setIsSubmitting(true)
    
    const { error, success } = await addBrandRule(formData)
    
    if (error) {
      setErrorMsg(error)
    } else if (success) {
      formRef.current?.reset()
    }
    
    setIsSubmitting(false)
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to deactivate this brand rule?')) return
    
    setDeletingId(id)
    const { error } = await deleteBrandRule(id)
    
    if (error) {
      alert(error)
    }
    setDeletingId(null)
  }

  return (
    <section className="bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-xl shadow-[#1E120C]/5 border border-[#1E120C]/5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
        <div>
          <h2 className="text-2xl font-black text-[#1E120C] tracking-tight">
            Brand Rules Management
          </h2>
          <p className="text-[#1E120C]/60 text-sm mt-1 font-medium">
            Automate sponsorship injection across all recipe ingredients.
          </p>
        </div>
      </div>

      {/* ── Add New Rule Form ──────────────────────────────────────────────── */}
      <form ref={formRef} action={handleAdd} className="bg-[#FAF6F0]/50 rounded-[2rem] p-6 sm:p-8 border border-[#1E120C]/5 mb-12">
        <h3 className="text-sm font-bold text-[#1E120C]/50 uppercase tracking-widest mb-6">Create New Rule</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="search_keyword" className="block text-xs font-bold text-[#1E120C] uppercase tracking-wider mb-2">Search Keyword *</label>
            <input 
              required
              id="search_keyword"
              name="search_keyword" 
              type="text" 
              placeholder="e.g. oil or నూనె" 
              className="w-full px-5 py-4 rounded-xl border border-[#1E120C]/10 bg-white text-[#1E120C] font-medium focus:outline-none focus:ring-2 focus:ring-[#E05A00]/50 transition-all shadow-sm"
            />
          </div>
          <div>
            <label htmlFor="brand_name" className="block text-xs font-bold text-[#1E120C] uppercase tracking-wider mb-2">Brand Name *</label>
            <input 
              required
              id="brand_name"
              name="brand_name" 
              type="text" 
              placeholder="e.g. Fortune" 
              className="w-full px-5 py-4 rounded-xl border border-[#1E120C]/10 bg-white text-[#1E120C] font-medium focus:outline-none focus:ring-2 focus:ring-[#E05A00]/50 transition-all shadow-sm"
            />
          </div>
          <div>
            <label htmlFor="brand_logo_url" className="block text-xs font-bold text-[#1E120C] uppercase tracking-wider mb-2">Logo URL</label>
            <input 
              id="brand_logo_url"
              name="brand_logo_url" 
              type="url" 
              placeholder="https://.../logo.png" 
              className="w-full px-5 py-4 rounded-xl border border-[#1E120C]/10 bg-white text-[#1E120C] font-medium focus:outline-none focus:ring-2 focus:ring-[#E05A00]/50 transition-all shadow-sm"
            />
          </div>
          <div>
            <label htmlFor="affiliate_url" className="block text-xs font-bold text-[#1E120C] uppercase tracking-wider mb-2">Affiliate Link URL</label>
            <input 
              id="affiliate_url"
              name="affiliate_url" 
              type="url" 
              placeholder="https://..." 
              className="w-full px-5 py-4 rounded-xl border border-[#1E120C]/10 bg-white text-[#1E120C] font-medium focus:outline-none focus:ring-2 focus:ring-[#E05A00]/50 transition-all shadow-sm"
            />
          </div>
        </div>

        {errorMsg && <p className="text-red-600 text-sm font-bold mb-4">{errorMsg}</p>}

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full sm:w-auto px-8 py-4 rounded-xl font-black text-sm tracking-widest uppercase transition-all duration-300 active:scale-95 bg-[#E05A00] text-white shadow-[0_8px_20px_rgba(224,90,0,0.3)] hover:bg-[#c24e00] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Saving...</>
          ) : (
            '➕ Add Brand Rule'
          )}
        </button>
      </form>

      {/* ── Active Rules Table ─────────────────────────────────────────────── */}
      <h3 className="text-sm font-bold text-[#1E120C]/50 uppercase tracking-widest mb-6">Active Sponsorships</h3>
      
      <div className="overflow-x-auto rounded-2xl border border-[#1E120C]/10">
        <table className="w-full text-left border-collapse bg-white">
          <thead className="bg-[#FAF6F0]">
            <tr className="text-xs uppercase tracking-widest text-[#1E120C]/50 border-b border-[#1E120C]/10">
              <th className="py-4 font-bold px-6">Brand</th>
              <th className="py-4 font-bold px-6">Keyword Trigger</th>
              <th className="py-4 font-bold px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-[#1E120C]/5">
            {initialRules.map((rule) => (
              <tr key={rule.id} className="hover:bg-gray-50 transition-colors group">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-4">
                    {/* Error fallback handled natively by Next.js or standard img */}
                    <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                      {rule.brand_logo_url ? (
                        <img 
                          src={rule.brand_logo_url} 
                          alt={rule.brand_name} 
                          className="w-full h-full object-contain p-1"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-400" style={{ display: rule.brand_logo_url ? 'none' : 'flex' }}>
                        💎
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-[#1E120C] text-base">{rule.brand_name}</p>
                      {rule.affiliate_url && (
                        <a href={rule.affiliate_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                          View Link ↗
                        </a>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full font-mono">
                    "{rule.search_keyword}"
                  </span>
                </td>
                <td className="py-4 px-6 text-right">
                  <button 
                    onClick={() => handleDelete(rule.id)}
                    disabled={deletingId === rule.id}
                    className="px-4 py-2 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {deletingId === rule.id ? 'Deleting...' : 'Deactivate'}
                  </button>
                </td>
              </tr>
            ))}
            {initialRules.length === 0 && (
              <tr>
                <td colSpan="3" className="py-12 text-center text-[#1E120C]/50 font-medium">
                  No active brand rules. Add one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
