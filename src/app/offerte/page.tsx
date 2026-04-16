import { redirect } from 'next/navigation'
import { AlertCircle, CheckCircle, Calendar, PartyPopper } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTicketNotificationEmail } from '@/lib/ticket-notifications'
import { uploadTicketFiles } from '@/lib/ticket-uploads'
import Logo from '@/components/logo'
import TopoBackground from '@/components/topo-background'
import FileUploadZone from '@/components/file-upload-zone'
import SubmitButton from './submit-button'

async function createOfferteRequest(formData: FormData) {
  'use server'

  const visitorName = String(formData.get('name') || '').trim()
  const visitorEmail = String(formData.get('email') || '').trim()
  const phone = String(formData.get('phone') || '').trim()
  const vatNumber = String(formData.get('vat') || '').trim()
  const service = String(formData.get('service') || '').trim()
  const uitvoeringsdatum = String(formData.get('uitvoeringsdatum') || '').trim()
  const title = String(formData.get('title') || '').trim()
  const description = String(formData.get('description') || '').trim()

  // Validation
  if (!visitorName) redirect('/offerte?error=name')
  if (!visitorEmail || !visitorEmail.includes('@')) redirect('/offerte?error=email')
  if (!phone) redirect('/offerte?error=phone')
  if (!vatNumber) redirect('/offerte?error=vat')
  if (!title) redirect('/offerte?error=title')

  const adminSupabase = createAdminClient()

  const fullDescription = [
    description,
    `\n---\nDienst: ${service || 'Niet opgegeven'}`,
    `Uitvoeringsdatum: ${uitvoeringsdatum || 'Niet opgegeven'}`,
    `BTW-nummer: ${vatNumber || 'Niet opgegeven'}`,
    `Telefoon: ${phone}`,
  ].join('\n')

  const insertPayload = {
    title: `[OFFERTE] ${title}`,
    description: fullDescription,
    visitor_name: visitorName,
    visitor_email: visitorEmail,
    customer_id: null,
    created_by: null,
    project_id: null,
    priority: 'normaal',
    status: 'nieuw',
    last_reply_at: new Date().toISOString(),
  }

  let { data, error } = await adminSupabase
    .from('tickets')
    .insert(insertPayload)
    .select('id, title')
    .single()

  if (error && /visitor_(name|email)/i.test(String(error.message || ''))) {
    const fallbackPayload = {
      title: `[OFFERTE] ${title}`,
      description: fullDescription,
      customer_id: null,
      created_by: null,
      project_id: null,
      priority: 'normaal',
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
    console.error('createOfferteRequest error:', error)
    redirect('/offerte?error=save')
  }

  // Upload attached files
  const { uploaded: uploadedFiles } = await uploadTicketFiles(formData, data.id)

  // Notify admins
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
      subject: `Nieuwe offerte aanvraag #${data.id} van ${visitorName}`,
      text: `Er werd een nieuwe offerte aanvraag ingediend door ${visitorName} (${visitorEmail}).\n\nTel: ${phone}\nBTW: ${vatNumber || 'n.v.t.'}\nDienst: ${service || 'n.v.t.'}\nUitvoeringsdatum: ${uitvoeringsdatum || 'n.v.t.'}${uploadedFiles.length > 0 ? `\nBijlagen: ${uploadedFiles.join(', ')}` : ''}\n\nTicket #${data.id}: ${title}\nBekijk: ${detailUrl}`,
      html: `<p>Er werd een nieuwe offerte aanvraag ingediend door <strong>${visitorName}</strong> (${visitorEmail}).</p><p>Tel: ${phone}<br/>BTW: ${vatNumber || 'n.v.t.'}<br/>Dienst: ${service || 'n.v.t.'}<br/>Uitvoeringsdatum: ${uitvoeringsdatum || 'n.v.t.'}${uploadedFiles.length > 0 ? `<br/>📎 Bijlagen: ${uploadedFiles.join(', ')}` : ''}</p><p>Ticket <strong>#${data.id}</strong>: ${title}</p><p><a href="${detailUrl}">Open ticket</a></p>`,
    })
  }

  // Confirmation to visitor
  try {
    await sendTicketNotificationEmail({
      to: [visitorEmail],
      subject: `Offerte aanvraag ontvangen #${data.id}`,
      text: `Dank u voor uw offerte aanvraag.\n\nWe hebben uw aanvraag ontvangen met nummer #${data.id}.\nOns team zal zo spoedig mogelijk contact met u opnemen.\n\nTitel: ${title}`,
      html: `<p>Dank u voor uw offerte aanvraag.</p><p>We hebben uw aanvraag ontvangen met nummer <strong>#${data.id}</strong>.</p><p>Ons team zal zo spoedig mogelijk contact met u opnemen.</p><p><strong>Titel:</strong> ${title}</p>`,
    })
  } catch (emailError) {
    console.error('Failed to send confirmation email:', emailError)
  }

  redirect(`/offerte?submitted=1&ticket=${data.id}`)
}

type Props = {
  searchParams?: Promise<{ error?: string; submitted?: string; ticket?: string }>
}

export default async function OffertePage({ searchParams }: Props) {
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const submitted = resolvedSearchParams.submitted === '1'
  const ticketId = resolvedSearchParams.ticket

  return (
    <div className="relative min-h-screen bg-[var(--bg-main)] text-[var(--text-main)]">
      <TopoBackground />
      <div className="relative z-10 mx-auto max-w-4xl px-4 py-5 sm:px-6 lg:py-8">
        <section className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
          {/* Header */}
          <div className="relative border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-5 sm:px-5">
            <div className="absolute inset-0 opacity-30">
              <div className="h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(242,140,58,0.18),transparent_35%),radial-gradient(circle_at_left,rgba(255,255,255,0.05),transparent_25%)]" />
            </div>
            <div className="relative">
              <Logo size="lg" variant="dark" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                Offerteportaal
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-[var(--text-main)] sm:text-3xl">
                Offerte Aanvragen
              </h1>
              <p className="mt-2.5 max-w-2xl text-sm leading-6 text-[var(--text-soft)]">
                Vraag een vrijblijvende offerte aan voor 3D ontwerp, opmeting of machinebesturing. Upload uw plannen ter controle en wij bezorgen u een voorstel op maat.
              </p>
            </div>
          </div>

          <div className="space-y-4 px-4 py-4 sm:px-5">
            {submitted && ticketId ? (
              <div className="space-y-5">
                <div className="flex flex-col items-center gap-4 py-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 ring-4 ring-emerald-500/10">
                    <CheckCircle className="h-8 w-8 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-emerald-300">Aanvraag verstuurd!</h2>
                    <p className="mt-1.5 text-sm text-[var(--text-soft)]">
                      Uw offerte aanvraag is succesvol ingediend met referentie <span className="font-semibold text-[var(--accent)]">#{ticketId}</span>.
                    </p>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                      U ontvangt een bevestiging per e-mail. We nemen zo snel mogelijk contact met u op.
                    </p>
                  </div>
                </div>

                <div className="flex justify-center">
                  <a
                    href="/offerte"
                    className="group relative inline-flex h-9 items-center gap-1.5 overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 text-xs font-semibold text-[var(--text-main)] transition hover:border-[var(--accent)]/45 hover:bg-[var(--bg-card)]/80"
                  >
                    <span className="pr-1">Nieuwe aanvraag indienen</span>
                    <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
                  </a>
                </div>
              </div>
            ) : (
              <form action={createOfferteRequest} method="POST" className="space-y-4">
                {resolvedSearchParams.error && (
                  <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />
                      <p className="text-sm text-red-200">
                        {resolvedSearchParams.error === 'name' && 'Vul alstublieft uw naam in.'}
                        {resolvedSearchParams.error === 'email' && 'Voer een geldig e-mailadres in.'}
                        {resolvedSearchParams.error === 'phone' && 'Vul alstublieft uw telefoonnummer in.'}
                        {resolvedSearchParams.error === 'vat' && 'Vul alstublieft uw BTW-nummer in.'}
                        {resolvedSearchParams.error === 'title' && 'Vul alstublieft een onderwerp in.'}
                        {resolvedSearchParams.error === 'save' && 'Uw aanvraag kon niet worden opgeslagen. Probeer het later opnieuw.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Naam + Email */}
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
                      placeholder="jan@voorbeeld.be"
                      className="input-dark h-9 w-full px-3 py-1.5 text-[12px]"
                    />
                  </div>
                </div>

                {/* Telefoon + BTW */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <label htmlFor="phone" className="text-[11px] font-medium text-[var(--text-soft)]">
                      Telefoonnummer *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      required
                      placeholder="+32 470 12 34 56"
                      className="input-dark h-9 w-full px-3 py-1.5 text-[12px]"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <label htmlFor="vat" className="text-[11px] font-medium text-[var(--text-soft)]">
                      BTW-nummer *
                    </label>
                    <input
                      type="text"
                      id="vat"
                      name="vat"
                      required
                      placeholder="BE 0123.456.789"
                      className="input-dark h-9 w-full px-3 py-1.5 text-[12px]"
                    />
                  </div>
                </div>

                {/* Dienst selectie */}
                <div className="grid gap-1.5">
                  <label htmlFor="service" className="text-[11px] font-medium text-[var(--text-soft)]">
                    Welke dienst interesseert u?
                  </label>
                  <select
                    id="service"
                    name="service"
                    defaultValue=""
                    className="input-dark h-9 w-full px-3 py-1.5 text-[12px]"
                  >
                    <option value="" disabled>Kies een dienst...</option>
                    <option value="3D Ontwerp">3D Ontwerp (machinebesturingsplan)</option>
                    <option value="3D Opmeting">3D Opmeting</option>
                    <option value="Plancontrole">Plancontrole (bestaand bestand controleren)</option>
                    <option value="Bestandsconversie">Bestandsconversie (ander merk → uw machine)</option>
                    <option value="Werfbeheer">Werfbeheer &amp; Cloud Setup</option>
                    <option value="Machine Control">Machine Control Installatie</option>
                    <option value="Advies">Advies &amp; Consultancy</option>
                    <option value="Andere">Andere</option>
                  </select>
                </div>

                {/* Uitvoeringsdatum */}
                <div className="grid gap-1.5 sm:max-w-[280px]">
                  <label htmlFor="uitvoeringsdatum" className="text-[11px] font-medium text-[var(--text-soft)]">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-[var(--accent)]" />
                      Gewenste uitvoeringsdatum
                    </span>
                  </label>
                  <input
                    type="date"
                    id="uitvoeringsdatum"
                    name="uitvoeringsdatum"
                    className="input-dark h-9 w-full px-3 py-1.5 text-[12px]"
                  />
                  <p className="text-[10px] text-[var(--text-muted)]">
                    Hoe vroeger u bestelt vóór de uitvoeringsdatum, hoe voordeliger.
                  </p>
                </div>

                {/* Onderwerp */}
                <div className="grid gap-1.5">
                  <label htmlFor="title" className="text-[11px] font-medium text-[var(--text-soft)]">
                    Onderwerp *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    placeholder="Bv. 3D plan voor werf Antwerpen"
                    className="input-dark h-9 w-full px-3 py-1.5 text-[12px]"
                  />
                </div>

                {/* Beschrijving */}
                <div className="grid gap-1.5">
                  <label htmlFor="description" className="text-[11px] font-medium text-[var(--text-soft)]">
                    Beschrijving
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    placeholder="Beschrijf uw project of aanvraag in meer detail..."
                    className="input-dark min-h-[100px] w-full resize-none px-3 py-2 text-[12px]"
                  />
                </div>

                {/* File upload zone */}
                <FileUploadZone accept=".dxf,.dwg,.xml,.pdf,.zip,.rar,.csv,.xlsx" />

                {/* Submit */}
                <div className="flex items-center justify-between gap-3 pt-1">
                  <p className="text-[11px] text-[var(--text-muted)]">* Verplichte velden</p>

                  <SubmitButton />
                </div>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
