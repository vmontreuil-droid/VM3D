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

  const { data, error } = await adminSupabase
    .from('tickets')
    .insert(insertPayload)
    .select('id, title')
    .single()

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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl px-6 py-8">
          <h1 className="text-3xl font-bold text-white">Support</h1>
          <p className="mt-2 text-slate-400">
            Heb je vragen of problemen? We helpen je graag verder.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-2xl px-6 py-12">
        {submitted && ticketId ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-6">
              <div className="flex items-start gap-4">
                <CheckCircle className="mt-1 flex-shrink-0 text-emerald-400" size={24} />
                <div>
                  <h2 className="text-lg font-semibold text-emerald-400">Ticket ontvangen!</h2>
                  <p className="mt-1 text-emerald-300/80">
                    Uw ondersteuningsverzoek is succesvol ingediend.
                  </p>
                  <p className="mt-3 text-sm text-emerald-300/60">
                    Ticket nummer: <strong className="text-emerald-300">#{ticketId}</strong>
                  </p>
                  <p className="mt-2 text-sm text-emerald-300/60">
                    We zullen binnenkort contact met u opnemen.
                  </p>
                </div>
              </div>
            </div>
            <form action="" method="GET">
              <button
                type="submit"
                className="w-full rounded-lg bg-slate-700 px-6 py-3 font-medium text-white transition-colors hover:bg-slate-600"
              >
                Nieuw ticket indienen
              </button>
            </form>
          </div>
        ) : (
          <form action={createPublicSupportTicket} method="POST" className="space-y-6">
            {/* Error Messages */}
            {resolvedSearchParams.error && (
              <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 flex-shrink-0 text-red-400" size={20} />
                  <p className="text-sm text-red-300">
                    {resolvedSearchParams.error === 'name' && 'Vul alstublieft je naam in.'}
                    {resolvedSearchParams.error === 'email' && 'Voer een geldig e-mailadres in.'}
                    {resolvedSearchParams.error === 'title' && 'Vul alstublieft een onderwerp in.'}
                    {resolvedSearchParams.error === 'save' && 'Je verzoek kon niet worden opgeslagen. Probeer het later opnieuw.'}
                  </p>
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-300">
                  Volledig naam *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-800/50 px-4 py-2 text-white placeholder-slate-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Jan Jansen"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                  E-mailadres *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-800/50 px-4 py-2 text-white placeholder-slate-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="jan@voorbeeld.nl"
                />
              </div>

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-slate-300">
                  Onderwerp *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-800/50 px-4 py-2 text-white placeholder-slate-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Beschrijf je probleem in het kort"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-300">
                  Beschrijving
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={5}
                  className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-800/50 px-4 py-2 text-white placeholder-slate-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Geef alstublieft meer details over je probleem..."
                />
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-slate-300">
                  Urgentie
                </label>
                <select
                  id="priority"
                  name="priority"
                  className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-800/50 px-4 py-2 text-white transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="laag">Laag</option>
                  <option value="normaal" selected>
                    Normaal
                  </option>
                  <option value="hoog">Hoog</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              <Mail className="mr-2 inline" size={20} />
              Ticket indienen
            </button>

            <p className="text-center text-xs text-slate-500">
              * Verplichte velden
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
