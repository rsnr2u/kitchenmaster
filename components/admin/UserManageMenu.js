'use client'

import { useState } from 'react'
import { deleteUserAction } from '@/app/admin/actions'

export default function UserManageMenu({ userId }) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!window.confirm('Are you absolutely sure you want to permanently delete this user account? This action cannot be undone.')) return
    
    setLoading(true)
    try {
      await deleteUserAction(userId)
    } catch (e) {
      alert(e.message || 'Failed to delete user.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button 
      onClick={handleDelete}
      disabled={loading}
      className="px-4 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-full transition-colors disabled:opacity-50"
    >
      {loading ? 'Deleting...' : 'Delete'}
    </button>
  )
}
