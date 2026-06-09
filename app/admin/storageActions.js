'use server'

import { requireAdmin } from './actions'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Server Action: Uploads an image file to the Supabase storage bucket "brand-logos".
 * Requires admin authentication.
 * 
 * @param {FormData} formData - Must contain 'file' (the File object to upload)
 * @returns {Promise<{ publicUrl?: string, error?: string }>}
 */
export async function uploadBrandLogo(formData) {
  // 1. Secure the route
  await requireAdmin()

  const file = formData.get('file')
  if (!file || typeof file === 'string') {
    return { error: 'No valid image file provided.' }
  }

  // 2. Initialize Supabase Admin Client
  // Using the Service Role key to ensure we can write to the bucket securely
  // regardless of public RLS insert policies.
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // 3. Generate a secure, unique file path to prevent overwrites
  const fileExtension = file.name.split('.').pop()
  const uniqueId = Date.now().toString() + '-' + Math.round(Math.random() * 1000)
  const filePath = `${uniqueId}.${fileExtension}`

  // 4. Upload the file to the 'brand-logos' bucket
  const { data, error } = await supabaseAdmin.storage
    .from('brand-logos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    console.error('[Storage Action] uploadBrandLogo error:', error.message)
    return { error: 'Failed to upload image to storage.' }
  }

  // 5. Retrieve the absolute public URL
  const { data: publicUrlData } = supabaseAdmin.storage
    .from('brand-logos')
    .getPublicUrl(filePath)

  return { publicUrl: publicUrlData.publicUrl }
}
