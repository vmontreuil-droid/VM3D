import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import OfferteDetailClient from './offerte-detail-client'

async function updateOfferteStatusAction(offerteId: number, newStatus: string) {
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

  const { error } = await adminSupabase
    .from('offertes')
    .update({ status: newStatus })
    .eq('id', offerteId)

  if (error) {
    console.error('updateOfferteStatusAction error:', error)
    redirect(`/admin/offerte/${offerteId}?error=status`)
  }

  // Cascade to linked project
  const { data: offerte } = await adminSupabase
    .from('offertes')
    .select('project_id')
    .eq('id', offerteId)
    .single()

  if (offerte?.project_id) {
    let projectStatus: string | null = null
    if (newStatus === 'verstuurd') projectStatus = 'offerte_verstuurd'
    else if (newStatus === 'goedgekeurd') projectStatus = 'in_behandeling'

    if (projectStatus) {
      await adminSupabase
        .from('projects')
        .update({ status: projectStatus })
        .eq('id', offerte.project_id)
    }
  }

  revalidatePath(`/admin/offerte/${offerteId}`)
  redirect(`/admin/offerte/${offerteId}`)
}

export default async function OfferteDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

  // Offerte ophalen
  const { data: offerte } = await adminSupabase
    .from('offertes')
    .select('*')
    .eq('id', Number(id))
    .single()

  if (!offerte) redirect('/admin/offerte')

  // Offerte regels
  const { data: lines } = await adminSupabase
    .from('offerte_lines')
    .select('*')
    .eq('offerte_id', offerte.id)
    .order('position')

  // Klantgegevens
  let customer = null
  if (offerte.customer_id) {
    const { data } = await adminSupabase
      .from('profiles')
      .select('company_name, full_name, email, phone, vat_number, street, house_number, bus, postal_code, city, country, iban, bic, logo_url')
      .eq('id', offerte.customer_id)
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
    <OfferteDetailClient
      offerte={offerte}
      lines={lines || []}
      customer={customer}
      company={company}
      onStatusChange={updateOfferteStatusAction.bind(null, offerte.id)}
    />
  )
}
