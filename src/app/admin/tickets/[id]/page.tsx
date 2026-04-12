import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, MessageSquarePlus, Save } from 'lucide-react'
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

type Props = {
  params: Promise<{ id: string }>
  searchParams?: Promise<{
    created?: string
    updated?: string
    message?: string
    error?: string
  }>
}

function getCustomerLabel(customer: {
  company_name?: string | null
  full_name?: string | null
  email?: string | null
} | null, ticket?: { visitor_name?: string | null; visitor_email?: string | null } | null) {
  if (!customer) {
    return ticket?.visitor_name || ticket?.visitor_email || 'Ongekende klant'
  }
  return customer.company_name || customer.full_name || customer.email || 'Ongekende klant'
}

async function updateTicket(formData: FormData) {
  'use server'

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (currentProfile?.role !== 'admin') {
    redirect('/dashboard')
  }

  const id = Number(String(formData.get('id') || '0'))
  if (!Number.isFinite(id) || id <= 0) {
    redirect('/admin/tickets?error=invalid_id')
  }

  const status = String(formData.get('status') || 'nieuw')
  const priority = String(formData.get('priority') || 'normaal')
  const assignedToRaw = String(formData.get('assigned_to') || '').trim()
  const dueDateRaw = String(formData.get('due_date') || '').trim()

  const adminSupabase = createAdminClient()

  const { data: existingTicket } = await adminSupabase
    .from('tickets')
    .select('id, title, status, customer_id')
    .eq('id', id)
    .maybeSingle()

  const { error } = await adminSupabase
    .from('tickets')
    .update({
      status,
      priority,
      assigned_to: assignedToRaw || null,
      due_date: dueDateRaw || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('updateTicket error:', error)
    redirect(`/admin/tickets/${id}?error=update`)
  }

  const statusChanged = existingTicket?.status && existingTicket.status !== status
  if (statusChanged && existingTicket?.customer_id) {
    const { data: customerProfile } = await adminSupabase
      .from('profiles')
      .select('email, full_name, company_name')
      .eq('id', existingTicket.customer_id)
      .maybeSingle()

    if (customerProfile?.email) {
      const detailUrl = getTicketPublicUrl(`/dashboard/tickets/${id}`)
      const customerLabel =
        customerProfile.company_name || customerProfile.full_name || customerProfile.email
      const newStatus = getTicketStatusLabel(status)

      await sendTicketNotificationEmail({
        to: [customerProfile.email],
        subject: `Ticket #${id} statusupdate: ${newStatus}`,
        text: `Beste ${customerLabel},\n\nDe status van ticket #${id} (${existingTicket.title || 'zonder titel'}) werd gewijzigd naar ${newStatus}.\n\nBekijk het ticket: ${detailUrl}`,
        html: `<p>Beste ${customerLabel},</p><p>De status van ticket <strong>#${id}</strong> (${existingTicket.title || 'zonder titel'}) werd gewijzigd naar <strong>${newStatus}</strong>.</p><p><a href="${detailUrl}">Bekijk ticket</a></p>`,
      })
    }
  }

  redirect(`/admin/tickets/${id}?updated=1`)
}

async function addTicketMessage(formData: FormData) {
  'use server'

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (currentProfile?.role !== 'admin') {
    redirect('/dashboard')
  }

  const ticketId = Number(String(formData.get('ticket_id') || '0'))
  const message = String(formData.get('message') || '').trim()
  const isInternal = String(formData.get('is_internal') || '1') === '1'

  if (!Number.isFinite(ticketId) || ticketId <= 0) {
    redirect('/admin/tickets?error=invalid_id')
  }

  if (!message) {
    redirect(`/admin/tickets/${ticketId}?error=empty_message`)
  }

  const adminSupabase = createAdminClient()

  const { data: ticket } = await adminSupabase
    .from('tickets')
    .select('id, title, customer_id')
    .eq('id', ticketId)
    .maybeSingle()

  const { error } = await adminSupabase.from('ticket_messages').insert({
    ticket_id: ticketId,
    author_id: user.id,
    message,
    is_internal: isInternal,
  })

  if (error) {
    console.error('addTicketMessage error:', error)
    redirect(`/admin/tickets/${ticketId}?error=message`)
  }

  await adminSupabase
    .from('tickets')
    .update({
      last_reply_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', ticketId)

  if (!isInternal && ticket?.customer_id) {
    const { data: customerProfile } = await adminSupabase
      .from('profiles')
      .select('email, full_name, company_name')
      .eq('id', ticket.customer_id)
      .maybeSingle()

    if (customerProfile?.email) {
      const detailUrl = getTicketPublicUrl(`/dashboard/tickets/${ticketId}`)
      const customerLabel =
        customerProfile.company_name || customerProfile.full_name || customerProfile.email

      await sendTicketNotificationEmail({
        to: [customerProfile.email],
        subject: `Nieuw antwoord op ticket #${ticketId}`,
        text: `Beste ${customerLabel},\n\nEr staat een nieuw antwoord klaar op ticket #${ticketId} (${ticket.title || 'zonder titel'}).\n\nBekijk het ticket: ${detailUrl}`,
        html: `<p>Beste ${customerLabel},</p><p>Er staat een nieuw antwoord klaar op ticket <strong>#${ticketId}</strong> (${ticket.title || 'zonder titel'}).</p><p><a href="${detailUrl}">Bekijk ticket</a></p>`,
      })
    }
  }

  redirect(`/admin/tickets/${ticketId}?message=1`)
}

export default async function AdminTicketDetailPage({ params, searchParams }: Props) {
  const resolvedParams = await params
  const resolvedSearchParams = searchParams ? await searchParams : {}

  const id = Number(resolvedParams.id)
  if (!Number.isFinite(id) || id <= 0) {
    redirect('/admin/tickets?error=invalid_id')
  }

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

  const adminSupabase = createAdminClient()

  const { data: ticket } = await adminSupabase
    .from('tickets')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (!ticket) {
    redirect('/admin/tickets?error=not_found')
  }

  const [customerRes, projectRes, assigneesRes, messagesRes] = await Promise.all([
    ticket.customer_id
      ? adminSupabase
          .from('profiles')
          .select('id, full_name, company_name, email')
          .eq('id', ticket.customer_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    ticket.project_id
      ? adminSupabase
          .from('projects')
          .select('id, title, address')
          .eq('id', ticket.project_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    adminSupabase
      .from('profiles')
      .select('id, full_name, company_name, email')
      .eq('role', 'admin')
      .order('full_name', { ascending: true }),
    adminSupabase
      .from('ticket_messages')
      .select('id, message, is_internal, created_at, author_id')
      .eq('ticket_id', ticket.id)
      .order('created_at', { ascending: true }),
  ])

  const customer = customerRes.data
  const project = projectRes.data
  const assignees = assigneesRes.data ?? []
  const messages = messagesRes.data ?? []

  const authorIds = Array.from(new Set(messages.map((item: any) => item.author_id).filter(Boolean)))
  let authorMap = new Map<string, any>()

  if (authorIds.length > 0) {
    const { data: authors } = await adminSupabase
      .from('profiles')
      .select('id, full_name, company_name, email')
      .in('id', authorIds)

    authorMap = new Map((authors ?? []).map((item: any) => [item.id, item]))
  }

  const showCreated = resolvedSearchParams.created === '1'
  const showUpdated = resolvedSearchParams.updated === '1'
  const showMessage = resolvedSearchParams.message === '1'
  const hasError = Boolean(resolvedSearchParams.error)

  return (
    <AppShell isAdmin>
      <div className="space-y-3 sm:space-y-4 lg:space-y-5">
        {(showCreated || showUpdated || showMessage || hasError) && (
          <section className="space-y-1">
            {showCreated && (
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                Ticket aangemaakt.
              </div>
            )}
            {showUpdated && (
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                Ticket bijgewerkt.
              </div>
            )}
            {showMessage && (
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                Bericht toegevoegd.
              </div>
            )}
            {hasError && (
              <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                Bewerking mislukt ({resolvedSearchParams.error}).
              </div>
            )}
          </section>
        )}

        <section className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
          <div className="border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-4 sm:px-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
              Adminportaal
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-[var(--text-main)] sm:text-3xl">
              Ticket #{ticket.id}
            </h1>
            <p className="mt-2 text-sm text-[var(--text-soft)]">{ticket.title || 'Zonder titel'}</p>

            <div className="mt-3 max-w-[280px]">
              <Link
                href="/admin/tickets"
                className="group relative block overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2.5 transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)]/80"
              >
                <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
                <div className="flex items-start gap-2.5 pr-2">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold leading-5 text-[var(--text-main)]">
                      Tickets
                    </span>
                    <span className="block text-[11px] leading-4 text-[var(--text-soft)]">
                      Terug naar ticketsoverzicht
                    </span>
                  </span>
                </div>
              </Link>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getTicketStatusClass(ticket.status)}`}>
                {getTicketStatusLabel(ticket.status)}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getTicketPriorityClass(ticket.priority)}`}>
                {getTicketPriorityLabel(ticket.priority)}
              </span>
            </div>
          </div>

          <div className="grid gap-3 px-4 py-4 sm:px-5 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-3">
              <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Koppelingen
                </p>
                <p className="mt-2 text-sm text-[var(--text-soft)]">
                  Klant: <span className="text-[var(--text-main)]">{getCustomerLabel(customer, ticket)}</span>
                </p>
                {ticket?.visitor_email && !ticket?.customer_id ? (
                  <p className="mt-1 text-sm text-[var(--text-soft)]">
                    Contact: <span className="text-[var(--text-main)]">{ticket.visitor_email}</span>
                  </p>
                ) : null}
                <p className="mt-1 text-sm text-[var(--text-soft)]">
                  Werf:{' '}
                  <span className="text-[var(--text-main)]">
                    {project ? project.title || project.address || `#${project.id}` : 'Niet gekoppeld'}
                  </span>
                </p>
                <p className="mt-1 text-sm text-[var(--text-soft)]">
                  Aangemaakt: {new Date(ticket.created_at).toLocaleString('nl-BE')}
                </p>
                <p className="mt-1 text-sm text-[var(--text-soft)]">
                  Laatste update: {new Date(ticket.updated_at).toLocaleString('nl-BE')}
                </p>
              </div>

              <form action={updateTicket} className="space-y-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-3">
                <input type="hidden" name="id" value={ticket.id} />

                <div className="grid gap-2">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    Status
                  </label>
                  <select name="status" defaultValue={ticket.status || 'nieuw'} className="input-dark w-full px-3 py-2 text-sm">
                    <option value="nieuw">Nieuw</option>
                    <option value="in_behandeling">In behandeling</option>
                    <option value="wacht_op_klant">Wacht op klant</option>
                    <option value="afgerond">Afgerond</option>
                    <option value="gesloten">Gesloten</option>
                  </select>
                </div>

                <div className="grid gap-2">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    Prioriteit
                  </label>
                  <select name="priority" defaultValue={ticket.priority || 'normaal'} className="input-dark w-full px-3 py-2 text-sm">
                    <option value="laag">Laag</option>
                    <option value="normaal">Normaal</option>
                    <option value="hoog">Hoog</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="grid gap-2">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    Toegewezen admin
                  </label>
                  <select
                    name="assigned_to"
                    defaultValue={ticket.assigned_to || ''}
                    className="input-dark w-full px-3 py-2 text-sm"
                  >
                    <option value="">Niet toegewezen</option>
                    {assignees.map((assignee: any) => (
                      <option key={assignee.id} value={assignee.id}>
                        {assignee.full_name || assignee.company_name || assignee.email || assignee.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    Vervaldatum
                  </label>
                  <input
                    name="due_date"
                    type="date"
                    defaultValue={ticket.due_date ? String(ticket.due_date).slice(0, 10) : ''}
                    className="input-dark w-full px-3 py-2 text-sm"
                  />
                </div>

                <div className="flex justify-end">
                  <button type="submit" className="btn-primary">
                    <Save className="h-4 w-4" />
                    Opslaan
                  </button>
                </div>
              </form>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Beschrijving
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--text-soft)]">
                  {ticket.description || 'Geen beschrijving opgegeven.'}
                </p>
              </div>

              <form action={addTicketMessage} className="space-y-2 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-3">
                <input type="hidden" name="ticket_id" value={ticket.id} />
                <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Nieuw bericht
                </label>
                <textarea
                  name="message"
                  required
                  className="input-dark min-h-[90px] w-full resize-none px-3 py-2 text-sm"
                  placeholder="Plaats hier een opvolgnotitie"
                />
                <label className="inline-flex items-center gap-2 text-xs text-[var(--text-soft)]">
                  <input
                    type="checkbox"
                    name="is_internal"
                    value="1"
                    defaultChecked
                    className="h-4 w-4 rounded border-[var(--border-soft)] bg-[var(--bg-card)]"
                  />
                  Interne notitie (niet zichtbaar voor klant)
                </label>
                <div className="flex justify-end">
                  <button type="submit" className="btn-secondary">
                    <MessageSquarePlus className="h-4 w-4" />
                    Bericht toevoegen
                  </button>
                </div>
              </form>

              <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)]">
                <div className="border-b border-[var(--border-soft)] px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    Historiek
                  </p>
                </div>
                {messages.length === 0 ? (
                  <p className="px-3 py-3 text-sm text-[var(--text-soft)]">Nog geen notities.</p>
                ) : (
                  <div className="divide-y divide-[var(--border-soft)]">
                    {messages.map((item: any) => {
                      const author = item.author_id ? authorMap.get(item.author_id) : null
                      const authorLabel =
                        author?.full_name ||
                        author?.company_name ||
                        author?.email ||
                        (item.author_id ? 'Onbekende gebruiker' : 'Systeem')

                      return (
                        <div key={item.id} className="px-3 py-2.5">
                          <p className="text-xs text-[var(--text-muted)]">
                            {new Date(item.created_at).toLocaleString('nl-BE')} · {authorLabel}
                          </p>
                          <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                            {item.is_internal ? 'Intern' : 'Zichtbaar voor klant'}
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--text-main)]">
                            {item.message}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  )
}
