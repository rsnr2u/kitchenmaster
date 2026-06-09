'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

/**
 * Validates that the current user is the authorized admin.
 * Throws an error if unauthorized.
 */
async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== 'rsnr4u@gmail.com') {
    throw new Error('Unauthorized')
  }
  return supabase
}

/**
 * Server Action: Adds a new brand rule to the database.
 */
export async function addBrandRule(formData) {
  const supabase = await requireAdmin()

  const search_keyword = formData.get('search_keyword')?.toString().trim()
  const brand_name = formData.get('brand_name')?.toString().trim()
  const brand_logo_url = formData.get('brand_logo_url')?.toString().trim()
  const affiliate_url = formData.get('affiliate_url')?.toString().trim()

  if (!search_keyword || !brand_name) {
    return { error: 'Search keyword and brand name are required.' }
  }

  const { error } = await supabase
    .from('automatic_brand_rules')
    .insert({
      search_keyword,
      brand_name,
      brand_logo_url: brand_logo_url || null,
      affiliate_url: affiliate_url || null,
    })

  if (error) {
    console.error('[Admin Action] addBrandRule error:', error.message)
    return { error: 'Failed to add rule to the database.' }
  }

  // Revalidate the admin dashboard so the table updates instantly
  revalidatePath('/admin')
  return { success: true }
}

/**
 * Server Action: Deletes a brand rule by ID.
 */
export async function deleteBrandRule(ruleId) {
  const supabase = await requireAdmin()

  const { error } = await supabase
    .from('automatic_brand_rules')
    .delete()
    .eq('id', ruleId)

  if (error) {
    console.error('[Admin Action] deleteBrandRule error:', error.message)
    return { error: 'Failed to delete rule.' }
  }

  revalidatePath('/admin')
  return { success: true }
}

/**
 * Server Action: Deletes a user permanently via Supabase Auth Admin.
 */
export async function deleteUserAction(userId) {
  await requireAdmin()

  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
  
  if (error) {
    console.error('[Admin Action] deleteUserAction error:', error.message)
    throw new Error(error.message)
  }
  
  revalidatePath('/admin/users')
  return { success: true }
}

/**
 * Server Action: Saves Global Settings via Supabase Admin Upsert
 */
export async function saveSettingsAction(formData) {
  await requireAdmin()

  const site_name = formData.get('site_name')?.toString().trim()
  const site_url = formData.get('site_url')?.toString().trim()
  const support_email = formData.get('support_email')?.toString().trim()
  const currency = formData.get('currency')?.toString().trim()
  const maintenance_mode = formData.get('maintenance_mode') === 'true'
  const meta_title = formData.get('meta_title')?.toString().trim()
  const meta_description = formData.get('meta_description')?.toString().trim()
  const target_keywords = formData.get('target_keywords')?.toString().trim()
  const ga_id = formData.get('ga_id')?.toString().trim()
  const og_image_url = formData.get('og_image_url')?.toString().trim()

  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  
  const { error } = await supabaseAdmin
    .from('site_settings')
    .upsert({
      id: '1', // Singleton pattern
      site_name,
      site_url,
      support_email,
      currency,
      maintenance_mode,
      meta_title,
      meta_description,
      target_keywords,
      ga_id,
      og_image_url,
      updated_at: new Date().toISOString()
    })
  
  if (error) {
    console.error('[Admin Action] saveSettingsAction error:', error.message)
    return { error: 'Failed to save settings to the database.' }
  }
  
  revalidatePath('/admin/settings')
  return { success: true }
}
