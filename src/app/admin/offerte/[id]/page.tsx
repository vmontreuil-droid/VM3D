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
      await adminSupabase.from('projects').update({ status: projectStatus }).eq('id', offerte.project_id)
    }
  }

  revalidatePath(`/admin/offerte/${offerteId}`)
  redirect(`/admin/offerte/${offerteId}`)
}

async function generateSignLinkAction(offerteId: number) {
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
  const token = crypto.randomUUID()

  await adminSupabase
    .from('offertes')
    .update({ signature_token: token })
    .eq('id', offerteId)

  revalidatePath(`/admin/offerte/${offerteId}`)
  redirect(`/admin/offerte/${offerteId}`)
}

export default async function OfferteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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

  const { data: offerte } = await adminSupabase
    .from('offertes')
    .select('*')
    .eq('id', Number(id))
    .single()
  if (!offerte) redirect('/admin/offerte')

  const { data: lines } = await adminSupabase
    .from('offerte_lines')
    .select('*')
    .eq('offerte_id', offerte.id)
    .order('position')

  let customer = null
  if (offerte.customer_id) {
    const { data } = await adminSupabase
      .from('profiles')
      .select('company_name, full_name, email, phone, vat_number, street, house_number, bus, postal_code, city, country, iban, bic, logo_url')
      .eq('id', offerte.customer_id)
      .single()
    customer = data
  }

  const { data: company } = await adminSupabase
    .from('profiles')
    .select('company_name, full_name, email, phone, vat_number, street, house_number, bus, postal_code, city, country, iban, bic, logo_url')
    .eq('id', user.id)
    .single()

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:3000'
  const signLink = offerte.signature_token
    ? `${siteUrl.replace(/\/$/, '')}/offerte/sign/${offerte.signature_token}`
    : null

  return (
    <OfferteDetailClient
      offerte={offerte}
      lines={lines || []}
      customer={customer}
      company={company}
      signLink={signLink}
      onStatusChange={updateOfferteStatusAction.bind(null, offerte.id)}
      onGenerateSignLink={generateSignLinkAction.bind(null, offerte.id)}
    />
  )
}
