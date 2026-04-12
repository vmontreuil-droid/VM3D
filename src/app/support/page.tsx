import { redirect } from 'next/navigation'
import { Mail, AlertCircle, CheckCircle } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTicketNotificationEmail } from '@/lib/ticket-notifications'

async function createPublicSupportTicket(formData: FormData) {
  'use server'

  const visitorName = String(formData.get('name') || '').trim()
  const visitorEmail = String(formData.get('email') || '').trim()
  const title = String(formData.get('title') || '').trim()
  const description = String(formData.get('description') || '').trim()
  const priority = String(formData.get('priority') || 'normaal').trim()

  // Validation
  if (!visitorName) {
    redirect('/support?error=name')
  }
  if (!visitorEmail || !visitorEmail.includes('@')) {
    redirect('/support?error=email')
  }
  if (!title) {
    redirect('/support?error=title')
  }

  const adminSupabase = createAdminClient()

  const insertPayload = {
    title,
    description: description || null,
    visitor_name: visitorName,
    visitor_email: visitorEmail,
    customer_id: null, // Guest ticket
    created_by: null,
    project_id: null,
    priority,
    status: 'nieuw',
    last_reply_at: new Date().toISOString(),
  }

  let { data, error } = await adminSupabase
    .from('tickets')
    .insert(insertPayload)
    .select('id, title')
    .single()

  // Backward compatibility if the visitor columns are not migrated yet.
  if (error && /visitor_(name|email)/i.test(String(error.message || ''))) {
    const fallbackPayload = {
      title,
      description: description || null,
      customer_id: null,
      created_by: null,
      project_id: null,
      priority,
      status: 'nieuw',
      last_reply_at: new Date().toISOString(),
    }

    const retryResult = await adminSupabase
      .from('tickets')
      .insert(fallbackPayload)
      .select('id, title')
      .single()

    data = retryResult.data
    error = retryResult.error
  }

  if (error || !data) {
    console.error('createPublicSupportTicket error:', error)
    redirect('/support?error=save')
  }

  // Send notification to admins
  const { data: admins } = await adminSupabase
    .from('profiles')
    .select('email')
    .eq('role', 'admin')

  const adminEmails = Array.from(
    new Set((admins ?? []).map((item: any) => String(item.email || '').trim()).filter(Boolean))
  )

  if (adminEmails.length > 0) {
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://mv3d.be')
    const detailUrl = `${baseUrl.replace(/\/$/, '')}/admin/tickets/${data.id}`

    await sendTicketNotificationEmail({
      to: adminEmails,
      subject: `Nieuw support ticket #${data.id} van ${visitorName}`,
      text: `Er werd een nieuw support ticket ingediend door ${visitorName} (${visitorEmail}).\n\nTicket #${data.id}: ${data.title || 'zonder titel'}\nBekijk: ${detailUrl}`,
      html: `<p>Er werd een nieuw support ticket ingediend door <strong>${visitorName}</strong> (${visitorEmail}).</p><p>Ticket <strong>#${data.id}</strong>: ${data.title || 'zonder titel'}</p><p><a href="${detailUrl}">Open ticket</a></p>`,
    })
  }

  // Send confirmation to visitor
  try {
    await sendTicketNotificationEmail({
      to: [visitorEmail],
      subject: `Support ticket ontvangen #${data.id}`,
      text: `Dank u voor uw ondersteuningsverzoek.\n\nWe hebben uw ticket ontvangen met nummer #${data.id}.\nOnze team zal zo spoedig mogelijk contact met u opnemen.\n\nTitel: ${data.title}`,
      html: `<p>Dank u voor uw ondersteuningsverzoek.</p><p>We hebben uw ticket ontvangen met nummer <strong>#${data.id}</strong>.</p><p>Ons team zal zo spoedig mogelijk contact met u opnemen.</p><p><strong>Titel:</strong> ${data.title}</p>`,
    })
  } catch (emailError) {
    console.error('Failed to send confirmation email:', emailError)
  }

  redirect(`/support?submitted=1&ticket=${data.id}`)
}

type Props = {
  searchParams?: Promise<{ error?: string; submitted?: string; ticket?: string }>
}

export default async function SupportPage({ searchParams }: Props) {
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const submitted = resolvedSearchParams.submitted === '1'
  const ticketId = resolvedSearchParams.ticket

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)]">
      <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6 lg:py-8">
        <section className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
          <div className="relative border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-5 sm:px-5">
            <div className="absolute inset-0 opacity-30">
              <div className="h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(242,140,58,0.18),transparent_35%),radial-gradient(circle_at_left,rgba(255,255,255,0.05),transparent_25%)]" />
            </div>

            <div className="relative">
              <img
                src="/mv3d-logo.svg"
                alt="MV3D logo"
                className="mb-3 h-auto w-full max-w-[170px]"
              />
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                Supportportaal
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-[var(--text-main)] sm:text-3xl">Support</h1>
              <p className="mt-2.5 max-w-2xl text-sm leading-6 text-[var(--text-soft)]">
                Heb je vragen of problemen? Stuur je verzoek door en we nemen snel contact op.
              </p>
            </div>
          </div>

          <div className="space-y-4 px-4 py-4 sm:px-5">
            {submitted && ticketId ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-200">Ticket ontvangen</p>
                      <p className="mt-1 text-sm text-emerald-200/90">
                        Je supportverzoek is succesvol ingediend met ticket #{ticketId}.
                      </p>
                    </div>
                  </div>
                </div>

                <form action="" method="GET" className="flex justify-end">
                  <button
                    type="submit"
                    className="group relative inline-flex h-9 items-center gap-1.5 overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 text-xs font-semibold text-[var(--text-main)] transition hover:border-[var(--accent)]/45 hover:bg-[var(--bg-card)]/80"
                  >
                    <span className="pr-1">Nieuw ticket indienen</span>
                    <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
                  </button>
                </form>
              </div>
            ) : (
              <form action={createPublicSupportTicket} method="POST" className="space-y-4">
                {resolvedSearchParams.error && (
                  <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />
                      <p className="text-sm text-red-200">
                        {resolvedSearchParams.error === 'name' && 'Vul alstublieft je naam in.'}
                        {resolvedSearchParams.error === 'email' && 'Voer een geldig e-mailadres in.'}
                        {resolvedSearchParams.error === 'title' && 'Vul alstublieft een onderwerp in.'}
                        {resolvedSearchParams.error === 'save' &&
                          'Je verzoek kon niet worden opgeslagen. Probeer het later opnieuw.'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <label htmlFor="name" className="text-[11px] font-medium text-[var(--text-soft)]">
                      Volledige naam *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      placeholder="Jan Jansen"
                      className="input-dark h-9 w-full px-3 py-1.5 text-[12px]"
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <label htmlFor="email" className="text-[11px] font-medium text-[var(--text-soft)]">
                      E-mailadres *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      placeholder="jan@voorbeeld.nl"
                      className="input-dark h-9 w-full px-3 py-1.5 text-[12px]"
                    />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <label htmlFor="title" className="text-[11px] font-medium text-[var(--text-soft)]">
                    Onderwerp *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    placeholder="Beschrijf je probleem in het kort"
                    className="input-dark h-9 w-full px-3 py-1.5 text-[12px]"
                  />
                </div>

                <div className="grid gap-1.5">
                  <label htmlFor="description" className="text-[11px] font-medium text-[var(--text-soft)]">
                    Beschrijving
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={5}
                    placeholder="Geef alstublieft meer details over je probleem..."
                    className="input-dark min-h-[120px] w-full resize-none px-3 py-2 text-[12px]"
                  />
                </div>

                <div className="grid gap-1.5 sm:max-w-[280px]">
                  <label htmlFor="priority" className="text-[11px] font-medium text-[var(--text-soft)]">
                    Urgentie
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    defaultValue="normaal"
                    className="input-dark h-9 w-full px-3 py-1.5 text-[12px]"
                  >
                    <option value="laag">Laag</option>
                    <option value="normaal">Normaal</option>
                    <option value="hoog">Hoog</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <p className="text-[11px] text-[var(--text-muted)]">* Verplichte velden</p>

                  <button
                    type="submit"
                    className="group relative inline-flex h-9 items-center gap-1.5 overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 text-xs font-semibold text-[var(--text-main)] transition hover:border-[var(--accent)]/45 hover:bg-[var(--bg-card)]/80"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--accent)]/12 text-[var(--accent)]">
                      <Mail className="h-3 w-3" />
                    </span>
                    <span className="pr-1">Ticket indienen</span>
                    <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
