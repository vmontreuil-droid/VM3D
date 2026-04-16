import { createClient, SupabaseClient } from '@supabase/supabase-js'

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Supabase admin configuratie ontbreekt.')
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/** Resolve a logo_url (path or legacy full URL) to a signed URL */
export async function getLogoSignedUrl(admin: SupabaseClient, logoUrl: string | null | undefined): Promise<string | undefined> {
  if (!logoUrl || !logoUrl.includes('customer-logos/')) return undefined
  const storagePath = logoUrl.includes('/storage/v1/')
    ? logoUrl.split('/storage/v1/object/public/project-files/').pop()!
    : logoUrl
  const { data } = await admin.storage.from('project-files').createSignedUrl(storagePath, 3600)
  return data?.signedUrl || undefined
}