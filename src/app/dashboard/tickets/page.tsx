import Link from 'next/link'
import { redirect } from 'next/navigation'
import { FolderOpen, PlusCircle } from 'lucide-react'
import AppShell from '@/components/app-shell'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getTicketPriorityClass,
  getTicketPriorityLabel,
  getTicketStatusClass,
  getTicketStatusLabel,
} from '@/lib/tickets'
import { getTicketPublicUrl, sendTicketNotificationEmail } from '@/lib/ticket-notifications'

async function createCustomerTicket(formData: FormData) {
  'use server'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const title = String(formData.get('title') || '').trim()
  const description = String(formData.get('description') || '').trim()
  const projectIdRaw = String(formData.get('project_id') || '').trim()
  const priority = String(formData.get('priority') || 'normaal').trim()

  if (!title) {
    redirect('/dashboard/tickets?error=title')
  }

  const adminSupabase = createAdminClient()

  const insertPayload = {
    title,
    description: description || null,
    customer_id: user.id,
    created_by: user.id,
    project_id: projectIdRaw ? Number(projectIdRaw) : null,
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
    console.error('createCustomerTicket error:', error)
    redirect('/dashboard/tickets?error=save')
  }

  const { data: admins } = await adminSupabase
    .from('profiles')
    .select('email')
    .eq('role', 'admin')

  const adminEmails = Array.from(
    new Set((admins ?? []).map((item: any) => String(item.email || '').trim()).filter(Boolean))
  )

  if (adminEmails.length > 0) {
    const detailUrl = getTicketPublicUrl(`/admin/tickets/${data.id}`)
    const requester = user.email || 'klant'

    await sendTicketNotificationEmail({
      to: adminEmails,
      subject: `Nieuw klantticket #${data.id}`,
      text: `Er werd een nieuw ticket aangemaakt door ${requester}.\n\nTicket #${data.id}: ${data.title || 'zonder titel'}\nBekijk: ${detailUrl}`,
      html: `<p>Er werd een nieuw ticket aangemaakt door <strong>${requester}</strong>.</p><p>Ticket <strong>#${data.id}</strong>: ${data.title || 'zonder titel'}</p><p><a href="${detailUrl}">Open ticket</a></p>`,
    })
  }

  redirect(`/dashboard/tickets/${data.id}?created=1`)
}

type Props = {
  searchParams?: Promise<{ error?: string }>
}

export default async function DashboardTicketsPage({ searchParams }: Props) {
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, company_name')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'
  if (isAdmin) {
    redirect('/admin/tickets')
  }

  const adminSupabase = createAdminClient()

  const [{ data: tickets }, { data: projects }] = await Promise.all([
    adminSupabase
      .from('tickets')
      .select('*')
      .eq('customer_id', user.id)
      .order('updated_at', { ascending: false }),
    adminSupabase
      .from('projects')
      .select('id, title, address')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(200),
  ])

  const safeTickets = tickets ?? []
  const projectMap = new Map((projects ?? []).map((item: any) => [item.id, item]))
  const titleError = resolvedSearchParams.error === 'title'
  const saveError = resolvedSearchParams.error === 'save'

  return (
    <AppShell isAdmin={isAdmin}>
      <div className="space-y-4">
        {(titleError || saveError) && (
          <section className="space-y-1">
            {titleError && (
              <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                Geef een titel op voor je ticket.
              </div>
            )}
            {saveError && (
              <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                Ticket kon niet opgeslagen worden.
              </div>
            )}
          </section>
        )}

        <section className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
          <div className="border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-4 sm:px-5">
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/dashboard" className="btn-secondary">
                ← Terug naar dashboard
              </Link>
            </div>

            <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
              Support
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-[var(--text-main)]">
              Tickets
            </h1>
            <p className="mt-2 text-sm text-[var(--text-soft)]">
              Dien nieuwe supportvragen in en volg alle antwoorden op per ticket.
            </p>
          </div>

          <div className="grid gap-3 px-4 py-4 sm:px-5 xl:grid-cols-[0.92fr_1.08fr]">
            <form action={createCustomerTicket} className="space-y-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Nieuw ticket
              </p>

              <div className="grid gap-2">
                <label className="text-xs font-medium text-[var(--text-soft)]">Titel</label>
                <input
                  name="title"
                  required
                  type="text"
                  className="input-dark w-full px-3 py-2 text-sm"
                  placeholder="Bijv. Upload mislukt"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-xs font-medium text-[var(--text-soft)]">Beschrijving</label>
                <textarea
                  name="description"
                  className="input-dark min-h-[110px] w-full resize-none px-3 py-2 text-sm"
                  placeholder="Omschrijf je vraag of probleem"
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-xs font-medium text-[var(--text-soft)]">Werf (optioneel)</label>
                  <select name="project_id" defaultValue="" className="input-dark w-full px-3 py-2 text-sm">
                    <option value="">Geen werf koppelen</option>
                    {(projects ?? []).map((project: any) => (
                      <option key={project.id} value={project.id}>
                        #{project.id} · {project.title || project.address || 'Zonder titel'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2">
                  <label className="text-xs font-medium text-[var(--text-soft)]">Prioriteit</label>
                  <select name="priority" defaultValue="normaal" className="input-dark w-full px-3 py-2 text-sm">
                    <option value="laag">Laag</option>
                    <option value="normaal">Normaal</option>
                    <option value="hoog">Hoog</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <button type="submit" className="btn-primary">
                  <PlusCircle className="h-4 w-4" />
                  Ticket aanmaken
                </button>
              </div>
            </form>

            <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)]">
              <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Mijn tickets
                </p>
                <p className="text-xs text-[var(--text-soft)]">{safeTickets.length} totaal</p>
              </div>

              {safeTickets.length === 0 ? (
                <p className="px-3 py-4 text-sm text-[var(--text-soft)]">Nog geen tickets.</p>
              ) : (
                <div className="divide-y divide-[var(--border-soft)]">
                  {safeTickets.map((ticket: any) => {
                    const linkedProject = ticket.project_id ? projectMap.get(ticket.project_id) : null

                    return (
                      <div key={ticket.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[var(--text-main)]">
                            #{ticket.id} · {ticket.title || 'Zonder titel'}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getTicketStatusClass(ticket.status)}`}>
                              {getTicketStatusLabel(ticket.status)}
                            </span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getTicketPriorityClass(ticket.priority)}`}>
                              {getTicketPriorityLabel(ticket.priority)}
                            </span>
                          </div>
                          {linkedProject ? (
                            <p className="mt-1 text-xs text-[var(--text-soft)]">
                              Werf: {linkedProject.title || linkedProject.address || `#${linkedProject.id}`}
                            </p>
                          ) : null}
                        </div>

                        <Link
                          href={`/dashboard/tickets/${ticket.id}`}
                          className="group relative inline-flex h-8 items-center gap-1.5 overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-2.5 text-[10px] font-semibold text-[var(--text-main)] transition hover:border-sky-400/45 hover:bg-[var(--bg-card)]/80"
                        >
                          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-sky-500/12 text-sky-300">
                            <FolderOpen className="h-3 w-3" />
                          </span>
                          <span className="pr-1">Open</span>
                          <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-sky-400/80" />
                        </Link>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  )
}
