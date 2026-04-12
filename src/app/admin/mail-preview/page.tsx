import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import AppShell from '@/components/app-shell'
import { createClient } from '@/lib/supabase/server'
import { buildBrandedTicketEmailContent, getTicketPublicUrl } from '@/lib/ticket-notifications'

function buildSamples() {
  const adminSample = buildBrandedTicketEmailContent({
    subject: 'Nieuw support ticket #123 van Jan Jansen',
    text: `Er werd een nieuw support ticket ingediend door Jan Jansen (jan@voorbeeld.nl).\n\nTicket #123: Printer op werf werkt niet\nBekijk: ${getTicketPublicUrl('/admin/tickets/123')}`,
    html: `<p>Er werd een nieuw support ticket ingediend door <strong>Jan Jansen</strong> (jan@voorbeeld.nl).</p><p>Ticket <strong>#123</strong>: Printer op werf werkt niet</p><p><a href="${getTicketPublicUrl('/admin/tickets/123')}">Open ticket</a></p>`,
  })

  const customerSample = buildBrandedTicketEmailContent({
    subject: 'Support ticket ontvangen #123',
    text: `Dank u voor uw ondersteuningsverzoek.\n\nWe hebben uw ticket ontvangen met nummer #123.\nOns team zal zo spoedig mogelijk contact met u opnemen.\n\nTitel: Printer op werf werkt niet`,
    html: '<p>Dank u voor uw ondersteuningsverzoek.</p><p>We hebben uw ticket ontvangen met nummer <strong>#123</strong>.</p><p>Ons team zal zo spoedig mogelijk contact met u opnemen.</p><p><strong>Titel:</strong> Printer op werf werkt niet</p>',
  })

  return [
    { id: 'admin', title: 'Admin notificatie', sample: adminSample },
    { id: 'customer', title: 'Klant bevestiging', sample: customerSample },
  ]
}

export default async function AdminMailPreviewPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  const samples = buildSamples()

  return (
    <AppShell isAdmin>
      <div className="space-y-3 sm:space-y-4 lg:space-y-5">
        <section className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
          <div className="relative border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-5 sm:px-5">
            <div className="absolute inset-0 opacity-30">
              <div className="h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(242,140,58,0.18),transparent_35%),radial-gradient(circle_at_left,rgba(255,255,255,0.05),transparent_25%)]" />
            </div>

            <div className="relative">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                Adminportaal
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-[var(--text-main)] sm:text-3xl">
                Mail preview
              </h1>
              <p className="mt-2.5 max-w-3xl text-sm leading-6 text-[var(--text-soft)]">
                Voorbeeld van ticketmails zoals ze effectief worden opgebouwd met MV3D branding.
              </p>

              <div className="mt-4 max-w-[260px]">
                <Link
                  href="/admin"
                  className="group relative inline-flex h-9 items-center gap-1.5 overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 text-xs font-semibold text-[var(--text-main)] transition hover:border-[var(--accent)]/45 hover:bg-[var(--bg-card)]/80"
                >
                  <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--accent)]/12 text-[var(--accent)]">
                    <ArrowLeft className="h-3 w-3" />
                  </span>
                  <span className="pr-1">Dashboard</span>
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-3 px-4 py-4 sm:px-5 lg:grid-cols-2">
            {samples.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)]"
              >
                <div className="border-b border-[var(--border-soft)] px-3.5 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-soft)]">
                    Onderwerp: {item.sample.subject}
                  </p>
                </div>

                <div className="space-y-3 p-3.5">
                  <div className="rounded-lg border border-[var(--border-soft)] bg-white p-3">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      HTML preview
                    </p>
                    <div
                      className="prose prose-sm max-w-none text-slate-800"
                      dangerouslySetInnerHTML={{ __html: item.sample.html }}
                    />
                  </div>

                  <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] p-3">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                      Plain text
                    </p>
                    <pre className="whitespace-pre-wrap text-xs leading-5 text-[var(--text-soft)]">
                      {item.sample.text}
                    </pre>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  )
}
