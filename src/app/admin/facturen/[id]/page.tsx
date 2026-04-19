import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import FactuurDetailClient from './factuur-detail-client'

async function updateFactuurStatusAction(factuurId: number, newStatus: string) {
  'use server'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const adminSupabase = createAdminClient()

  const updateData: Record<string, unknown> = { status: newStatus }
  if (newStatus === 'betaald') {
    updateData.paid_at = new Date().toISOString()
  }
  if (newStatus === 'gecrediteerd') {
    updateData.credited_at = new Date().toISOString()
  }

  const { error } = await adminSupabase
    .from('facturen')
    .update(updateData)
    .eq('id', factuurId)

  if (error) {
    console.error('updateFactuurStatusAction error:', error)
    redirect(`/admin/facturen/${factuurId}?error=status`)
  }

  // Cascade to linked project
  const { data: factuur } = await adminSupabase
    .from('facturen')
    .select('project_id')
    .eq('id', factuurId)
    .single()

  if (factuur?.project_id) {
    let projectStatus: string | null = null
    if (newStatus === 'verstuurd') projectStatus = 'factuur_verstuurd'
    else if (newStatus === 'betaald') projectStatus = 'afgerond'

    if (projectStatus) {
      await adminSupabase
        .from('projects')
        .update({ status: projectStatus })
        .eq('id', factuur.project_id)
    }
  }

  revalidatePath(`/admin/facturen/${factuurId}`)
  redirect(`/admin/facturen/${factuurId}`)
}

export default async function FactuurDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const adminSupabase = createAdminClient()

  // Factuur ophalen
  const { data: factuur } = await adminSupabase
    .from('facturen')
    .select('*')
    .eq('id', Number(id))
    .single()

  if (!factuur) redirect('/admin/facturen')

  // Factuur regels
  const { data: lines } = await adminSupabase
    .from('factuur_lines')
    .select('*')
    .eq('factuur_id', factuur.id)
    .order('position')

  // Klantgegevens
  let customer = null
  if (factuur.customer_id) {
    const { data } = await adminSupabase
      .from('profiles')
      .select('company_name, full_name, email, phone, vat_number, street, house_number, bus, postal_code, city, country, iban, bic, logo_url')
      .eq('id', factuur.customer_id)
      .single()
    customer = data
  }

  // Bedrijfsgegevens (admin profiel)
  const { data: company } = await adminSupabase
    .from('profiles')
    .select('company_name, full_name, email, phone, vat_number, street, house_number, bus, postal_code, city, country, iban, bic, logo_url')
    .eq('id', user.id)
    .single()

  return (
    <FactuurDetailClient
      factuur={factuur}
      lines={lines || []}
      customer={customer}
      company={company}
      onStatusChange={updateFactuurStatusAction.bind(null, factuur.id)}
    />
  )
}
