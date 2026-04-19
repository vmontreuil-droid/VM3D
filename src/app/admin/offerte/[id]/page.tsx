import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import OfferteDetailClient from './offerte-detail-client'
import { sendTicketNotificationEmail } from '@/lib/ticket-notifications'

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

async function replyMessageAction(offerteId: number, message: string) {
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

  if (!message.trim()) return

  const adminSupabase = createAdminClient()

  await adminSupabase.from('offerte_messages').insert({
    offerte_id:  offerteId,
    sender_type: 'admin',
    sender_name: 'MV3D.CLOUD',
    message:     message.trim(),
    read_at:     new Date().toISOString(),
  })

  // Stuur email naar klant
  const { data: offerte } = await adminSupabase
    .from('offertes')
    .select('offerte_number, subject, customer_id')
    .eq('id', offerteId)
    .single()

  if (offerte?.customer_id) {
    const { data: customerProfile } = await adminSupabase
      .from('profiles')
      .select('email, company_name, full_name')
      .eq('id', offerte.customer_id)
      .single()

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const { data: offerteWithToken } = await adminSupabase
      .from('offertes')
      .select('signature_token')
      .eq('id', offerteId)
      .single()

    const signLink = offerteWithToken?.signature_token
      ? `${siteUrl.replace(/\/$/, '')}/offerte/sign/${offerteWithToken.signature_token}`
      : null

    const klant = customerProfile?.company_name || customerProfile?.full_name || ''

    if (customerProfile?.email) {
      await sendTicketNotificationEmail({
        to:      [customerProfile.email],
        subject: `Antwoord op uw vraag — offerte ${offerte.offerte_number}`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
            <div style="background:#f7941d;height:4px;border-radius:4px 4px 0 0"></div>
            <div style="padding:24px;background:#fff;border:1px solid #fde8c8;border-top:none;border-radius:0 0 8px 8px">
              <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#f7941d;text-transform:uppercase">MV3D.CLOUD</p>
              <h2 style="margin:0 0 12px;font-size:16px;color:#0f172a">
                Antwoord op uw vraag — ${offerte.offerte_number}
              </h2>
              ${klant ? `<p style="font-size:13px;color:#475569;margin:0 0 12px">Beste ${klant},</p>` : ''}
              <div style="background:#fff9f0;border-left:3px solid #f7941d;padding:12px 16px;border-radius:0 4px 4px 0;margin:0 0 16px">
                <p style="font-size:14px;color:#1e293b;margin:0;line-height:1.6">${message.trim().replace(/\n/g, '<br>')}</p>
              </div>
              ${signLink ? `<p style="margin:0 0 8px;font-size:13px;color:#64748b">U kunt de offerte bekijken en goedkeuren via:</p>
              <a href="${signLink}" style="display:inline-block;background:#f7941d;color:#fff;font-weight:700;font-size:13px;padding:10px 20px;border-radius:999px;text-decoration:none">Offerte bekijken</a>` : ''}
              <p style="margin-top:20px;font-size:12px;color:#94a3b8">
                Vragen? Contacteer ons via <a href="mailto:facturatie@mv3d.be" style="color:#f7941d">facturatie@mv3d.be</a>
              </p>
            </div>
          </div>
        `,
        text: `Antwoord op uw vraag over offerte ${offerte.offerte_number}:\n\n${message.trim()}${signLink ? `\n\nBekijk de offerte: ${signLink}` : ''}`,
      })
    }
  }

  revalidatePath(`/admin/offerte/${offerteId}`)
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

  // Berichten ophalen
  const { data: messages } = await adminSupabase
    .from('offerte_messages')
    .select('*')
    .eq('offerte_id', offerte.id)
    .order('created_at', { ascending: true })

  // Klant berichten markeren als gelezen
  await adminSupabase
    .from('offerte_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('offerte_id', offerte.id)
    .eq('sender_type', 'customer')
    .is('read_at', null)

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
      messages={messages || []}
      onStatusChange={updateOfferteStatusAction.bind(null, offerte.id)}
      onGenerateSignLink={generateSignLinkAction.bind(null, offerte.id)}
      onReplyMessage={replyMessageAction.bind(null, offerte.id)}
    />
  )
}
