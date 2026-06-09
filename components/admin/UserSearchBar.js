'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'

export default function UserSearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [isPending, startTransition] = useTransition()

  function handleSearch(e) {
    const value = e.target.value
    setQuery(value)
    
    startTransition(() => {
      if (value.trim()) {
        router.push(`/admin/users?q=${encodeURIComponent(value)}`)
      } else {
        router.push('/admin/users')
      }
    })
  }

  return (
    <div className="relative w-full max-w-sm sm:max-w-md">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <svg className="w-5 h-5 text-[#1E120C]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        type="text"
        value={query}
        onChange={handleSearch}
        placeholder="Search by email, name, or ID..."
        className="w-full pl-11 pr-10 py-3 bg-[#FAF6F0] border border-[#1E120C]/10 rounded-xl text-sm font-medium text-[#1E120C] placeholder:text-[#1E120C]/40 focus:outline-none focus:border-[#1E120C]/30 focus:ring-4 focus:ring-[#E05A00]/10 transition-all shadow-sm"
      />
      {isPending && (
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
          <div className="w-4 h-4 border-2 border-[#E05A00] border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  )
}
