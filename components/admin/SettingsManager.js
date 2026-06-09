'use client'

import { useState, useTransition } from 'react'
import { saveSettingsAction } from '@/app/admin/actions'

export default function SettingsManager({ initialSettings }) {
  const [activeTab, setActiveTab] = useState('general')
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState('')

  async function handleSave(formData) {
    setMessage('')
    startTransition(async () => {
      try {
        const result = await saveSettingsAction(formData)
        if (result?.error) {
          setMessage(`❌ ${result.error}`)
        } else {
          setMessage('✅ Settings saved successfully!')
          setTimeout(() => setMessage(''), 3000)
        }
      } catch (err) {
        setMessage(`❌ ${err.message}`)
      }
    })
  }

  return (
    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-[#1E120C]/5 border border-[#1E120C]/5 overflow-hidden">
      
      {/* Tabs */}
      <div className="flex border-b border-[#1E120C]/5">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex-1 py-5 font-bold text-sm transition-colors ${
            activeTab === 'general'
              ? 'text-[#E05A00] border-b-2 border-[#E05A00] bg-[#FAF6F0]'
              : 'text-[#1E120C]/50 hover:bg-[#FAF6F0] hover:text-[#1E120C]'
          }`}
        >
          <span className="mr-2">📋</span> General Settings
        </button>
        <button
          onClick={() => setActiveTab('seo')}
          className={`flex-1 py-5 font-bold text-sm transition-colors ${
            activeTab === 'seo'
              ? 'text-[#E05A00] border-b-2 border-[#E05A00] bg-[#FAF6F0]'
              : 'text-[#1E120C]/50 hover:bg-[#FAF6F0] hover:text-[#1E120C]'
          }`}
        >
          <span className="mr-2">🔍</span> SEO Configuration
        </button>
      </div>

      {/* Forms */}
      <form action={handleSave} className="p-8 sm:p-12">
        <div className={activeTab === 'general' ? 'space-y-6 block' : 'hidden'}>
          <div>
            <label className="block text-sm font-bold text-[#1E120C] mb-2 uppercase tracking-widest">Site Name</label>
            <input 
              name="site_name" 
              type="text" 
              defaultValue={initialSettings?.site_name}
              placeholder="KitchenMaster"
              className="w-full bg-[#FAF6F0] border border-[#1E120C]/10 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#E05A00] focus:ring-2 focus:ring-[#E05A00]/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#1E120C] mb-2 uppercase tracking-widest">Domain URL</label>
            <input 
              name="site_url" 
              type="url" 
              defaultValue={initialSettings?.site_url}
              placeholder="https://kitchenmaster.com"
              className="w-full bg-[#FAF6F0] border border-[#1E120C]/10 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#E05A00] focus:ring-2 focus:ring-[#E05A00]/20 transition-all font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#1E120C] mb-2 uppercase tracking-widest">Support Email</label>
            <input 
              name="support_email" 
              type="email" 
              defaultValue={initialSettings?.support_email}
              placeholder="support@kitchenmaster.com"
              className="w-full bg-[#FAF6F0] border border-[#1E120C]/10 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#E05A00] focus:ring-2 focus:ring-[#E05A00]/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#1E120C] mb-2 uppercase tracking-widest">Currency Code</label>
            <input 
              name="currency" 
              type="text" 
              defaultValue={initialSettings?.currency || 'USD'}
              placeholder="USD"
              className="w-full bg-[#FAF6F0] border border-[#1E120C]/10 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#E05A00] focus:ring-2 focus:ring-[#E05A00]/20 transition-all"
            />
          </div>
          <div className="flex items-center gap-4 p-4 border border-red-100 bg-red-50 rounded-xl">
            <input 
              name="maintenance_mode" 
              type="checkbox" 
              value="true"
              defaultChecked={initialSettings?.maintenance_mode}
              className="w-5 h-5 accent-red-600 rounded cursor-pointer"
            />
            <div>
              <p className="font-bold text-red-800 text-sm">Maintenance Mode</p>
              <p className="text-xs text-red-600/80">Enabling this will block all public users from accessing the site.</p>
            </div>
          </div>
        </div>

        <div className={activeTab === 'seo' ? 'space-y-6 block' : 'hidden'}>
          <div>
            <label className="block text-sm font-bold text-[#1E120C] mb-2 uppercase tracking-widest">Global Meta Title</label>
            <input 
              name="meta_title" 
              type="text" 
              defaultValue={initialSettings?.meta_title}
              placeholder="KitchenMaster - Smart Cooking Guide"
              className="w-full bg-[#FAF6F0] border border-[#1E120C]/10 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#E05A00] focus:ring-2 focus:ring-[#E05A00]/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#1E120C] mb-2 uppercase tracking-widest">Global Meta Description</label>
            <textarea 
              name="meta_description" 
              rows="3"
              defaultValue={initialSettings?.meta_description}
              placeholder="Step-by-step authentic Telugu cooking recipes..."
              className="w-full bg-[#FAF6F0] border border-[#1E120C]/10 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#E05A00] focus:ring-2 focus:ring-[#E05A00]/20 transition-all resize-none"
            ></textarea>
          </div>
          <div>
            <label className="block text-sm font-bold text-[#1E120C] mb-2 uppercase tracking-widest">Target Keywords (Comma Separated)</label>
            <input 
              name="target_keywords" 
              type="text" 
              defaultValue={initialSettings?.target_keywords}
              placeholder="recipes, cooking, ai chef, telugu"
              className="w-full bg-[#FAF6F0] border border-[#1E120C]/10 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#E05A00] focus:ring-2 focus:ring-[#E05A00]/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#1E120C] mb-2 uppercase tracking-widest">Google Analytics ID</label>
            <input 
              name="ga_id" 
              type="text" 
              defaultValue={initialSettings?.ga_id}
              placeholder="G-XXXXXXXXXX"
              className="w-full bg-[#FAF6F0] border border-[#1E120C]/10 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#E05A00] focus:ring-2 focus:ring-[#E05A00]/20 transition-all font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#1E120C] mb-2 uppercase tracking-widest">Open Graph (OG) Image URL</label>
            <input 
              name="og_image_url" 
              type="url" 
              defaultValue={initialSettings?.og_image_url}
              placeholder="https://yourdomain.com/og-image.jpg"
              className="w-full bg-[#FAF6F0] border border-[#1E120C]/10 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#E05A00] focus:ring-2 focus:ring-[#E05A00]/20 transition-all"
            />
          </div>

          <hr className="border-[#1E120C]/5 my-8" />

          {/* Sitemap Info Block */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-sm font-bold text-[#1E120C] uppercase tracking-widest">Sitemap Information</h3>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-widest rounded-full">
                ⚡ Dynamically Generated via Supabase Engine
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input 
                type="text" 
                readOnly
                value={`${initialSettings?.site_url ? initialSettings.site_url.replace(/\/$/, '') : 'https://yourdomain.com'}/sitemap.xml`}
                className="w-full bg-gray-50 border border-[#1E120C]/5 rounded-xl px-4 py-3 text-sm font-mono text-[#1E120C]/50 focus:outline-none cursor-text select-all"
                onClick={(e) => e.target.select()}
              />
              <button 
                type="button"
                onClick={(e) => {
                  navigator.clipboard.writeText(`${initialSettings?.site_url ? initialSettings.site_url.replace(/\/$/, '') : 'https://yourdomain.com'}/sitemap.xml`)
                  const btn = e.currentTarget
                  const originalText = btn.innerText
                  btn.innerText = 'Copied!'
                  setTimeout(() => btn.innerText = originalText, 2000)
                }}
                className="px-6 py-3 bg-[#1E120C] text-white text-sm font-bold rounded-xl whitespace-nowrap hover:bg-black transition-colors"
              >
                Copy Link
              </button>
            </div>
            <p className="mt-2 text-xs text-[#1E120C]/40 font-medium">
              Submit this URL to Google Search Console to ensure your latest recipe pages are indexed automatically.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-10 pt-8 border-t border-[#1E120C]/5 flex items-center justify-between">
          <p className="text-sm font-bold text-[#1E120C]/50">{message}</p>
          <button 
            type="submit"
            disabled={isPending}
            className="px-8 py-3 bg-[#E05A00] hover:bg-[#c95100] text-white rounded-full font-black tracking-wide shadow-lg shadow-[#E05A00]/20 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}
