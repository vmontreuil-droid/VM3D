import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, MessageSquarePlus } from 'lucide-react'
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
    message?: string
    error?: string
  }>
}

async function addCustomerMessage(formData: FormData) {
  'use server'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const ticketId = Number(String(formData.get('ticket_id') || '0'))
  const message = String(formData.get('message') || '').trim()

  if (!Number.isFinite(ticketId) || ticketId <= 0) {
    redirect('/dashboard/tickets?error=invalid_id')
  }

  if (!message) {
    redirect(`/dashboard/tickets/${ticketId}?error=empty_message`)
  }

  const adminSupabase = createAdminClient()

  const { data: ticket } = await adminSupabase
    .from('tickets')
    .select('id, title, customer_id, assigned_to')
    .eq('id', ticketId)
    .eq('customer_id', user.id)
    .maybeSingle()

  if (!ticket) {
    redirect('/dashboard/tickets?error=not_found')
  }

  const { error } = await adminSupabase.from('ticket_messages').insert({
    ticket_id: ticket.id,
    author_id: user.id,
    message,
    is_internal: false,
  })

  if (error) {
    console.error('addCustomerMessage error:', error)
    redirect(`/dashboard/tickets/${ticket.id}?error=message`)
  }

  await adminSupabase
    .from('tickets')
    .update({
      last_reply_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', ticket.id)

  let adminRecipients: string[] = []

  if (ticket.assigned_to) {
    const { data: assignedAdmin } = await adminSupabase
      .from('profiles')
      .select('email')
      .eq('id', ticket.assigned_to)
      .maybeSingle()

    if (assignedAdmin?.email) {
      adminRecipients = [assignedAdmin.email]
    }
  }

  if (adminRecipients.length === 0) {
    const { data: admins } = await adminSupabase
      .from('profiles')
      .select('email')
      .eq('role', 'admin')

    adminRecipients = Array.from(
      new Set((admins ?? []).map((item: any) => String(item.email || '').trim()).filter(Boolean))
    )
  }

  if (adminRecipients.length > 0) {
    const detailUrl = getTicketPublicUrl(`/admin/tickets/${ticket.id}`)
    const sender = user.email || 'klant'

    await sendTicketNotificationEmail({
      to: adminRecipients,
      subject: `Klantantwoord op ticket #${ticket.id}`,
      text: `${sender} reageerde op ticket #${ticket.id} (${ticket.title || 'zonder titel'}).\n\nBekijk: ${detailUrl}`,
      html: `<p><strong>${sender}</strong> reageerde op ticket <strong>#${ticket.id}</strong> (${ticket.title || 'zonder titel'}).</p><p><a href="${detailUrl}">Open ticket</a></p>`,
    })
  }

  redirect(`/dashboard/tickets/${ticket.id}?message=1`)
}

export default async function DashboardTicketDetailPage({ params, searchParams }: Props) {
  const resolvedParams = await params
  const resolvedSearchParams = searchParams ? await searchParams : {}

  const id = Number(resolvedParams.id)
  if (!Number.isFinite(id) || id <= 0) {
    redirect('/dashboard/tickets?error=invalid_id')
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

  if (profile?.role === 'admin') {
    redirect(`/admin/tickets/${id}`)
  }

  const adminSupabase = createAdminClient()

  const { data: ticket } = await adminSupabase
    .from('tickets')
    .select('*')
    .eq('id', id)
    .eq('customer_id', user.id)
    .maybeSingle()

  if (!ticket) {
    redirect('/dashboard/tickets?error=not_found')
  }

  const [projectRes, messagesRes] = await Promise.all([
    ticket.project_id
      ? adminSupabase
          .from('projects')
          .select('id, title, address')
          .eq('id', ticket.project_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    adminSupabase
      .from('ticket_messages')
      .select('id, message, is_internal, created_at, author_id')
      .eq('ticket_id', ticket.id)
      .eq('is_internal', false)
      .order('created_at', { ascending: true }),
  ])

  const messages = messagesRes.data ?? []
  const authorIds = Array.from(new Set(messages.map((item: any) => item.author_id).filter(Boolean)))
  let authorMap = new Map<string, any>()

  if (authorIds.length > 0) {
    const { data: authors } = await adminSupabase
      .from('profiles')
      .select('id, full_name, company_name, email, role')
      .in('id', authorIds)

    authorMap = new Map((authors ?? []).map((item: any) => [item.id, item]))
  }

  const showCreated = resolvedSearchParams.created === '1'
  const showMessage = resolvedSearchParams.message === '1'
  const hasError = Boolean(resolvedSearchParams.error)

  return (
    <AppShell isAdmin={false}>
      <div className="space-y-4">
        {(showCreated || showMessage || hasError) && (
          <section className="space-y-1">
            {showCreated && (
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                Ticket aangemaakt.
              </div>
            )}
            {showMessage && (
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                Bericht verzonden.
              </div>
            )}
            {hasError && (
              <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                Bewerking mislukt ({resolvedSearchParams.error}).
              </div>
            )}
          </section>
        )}

        <section className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
          <div className="border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-4 sm:px-5">
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/dashboard/tickets" className="btn-secondary">
                <ArrowLeft className="h-4 w-4" />
                Terug naar tickets
              </Link>
            </div>

            <h1 className="mt-3 text-2xl font-semibold text-[var(--text-main)] sm:text-3xl">
              Ticket #{ticket.id}
            </h1>
            <p className="mt-1 text-sm text-[var(--text-soft)]">{ticket.title || 'Zonder titel'}</p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getTicketStatusClass(ticket.status)}`}>
                {getTicketStatusLabel(ticket.status)}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getTicketPriorityClass(ticket.priority)}`}>
                {getTicketPriorityLabel(ticket.priority)}
              </span>
            </div>
          </div>

          <div className="grid gap-3 px-4 py-4 sm:px-5 xl:grid-cols-[0.96fr_1.04fr]">
            <div className="space-y-3">
              <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Ticketinfo
                </p>
                <p className="mt-2 text-sm text-[var(--text-soft)]">
                  Aangemaakt: {new Date(ticket.created_at).toLocaleString('nl-BE')}
                </p>
                <p className="mt-1 text-sm text-[var(--text-soft)]">
                  Laatste update: {new Date(ticket.updated_at).toLocaleString('nl-BE')}
                </p>
                <p className="mt-1 text-sm text-[var(--text-soft)]">
                  Werf:{' '}
                  <span className="text-[var(--text-main)]">
                    {projectRes.data
                      ? projectRes.data.title || projectRes.data.address || `#${projectRes.data.id}`
                      : 'Niet gekoppeld'}
                  </span>
                </p>
              </div>

              <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Beschrijving
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--text-soft)]">
                  {ticket.description || 'Geen beschrijving opgegeven.'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <form action={addCustomerMessage} className="space-y-2 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-3">
                <input type="hidden" name="ticket_id" value={ticket.id} />
                <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Nieuw bericht
                </label>
                <textarea
                  name="message"
                  required
                  className="input-dark min-h-[90px] w-full resize-none px-3 py-2 text-sm"
                  placeholder="Typ hier je reactie of extra uitleg"
                />
                <div className="flex justify-end">
                  <button type="submit" className="btn-primary">
                    <MessageSquarePlus className="h-4 w-4" />
                    Bericht verzenden
                  </button>
                </div>
              </form>

              <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)]">
                <div className="border-b border-[var(--border-soft)] px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    Gesprek
                  </p>
                </div>

                {messages.length === 0 ? (
                  <p className="px-3 py-3 text-sm text-[var(--text-soft)]">Nog geen berichten.</p>
                ) : (
                  <div className="divide-y divide-[var(--border-soft)]">
                    {messages.map((item: any) => {
                      const author = item.author_id ? authorMap.get(item.author_id) : null
                      const roleLabel = author?.role === 'admin' ? 'Admin' : 'Klant'
                      const authorLabel =
                        author?.full_name || author?.company_name || author?.email || roleLabel

                      return (
                        <div key={item.id} className="px-3 py-2.5">
                          <p className="text-xs text-[var(--text-muted)]">
                            {new Date(item.created_at).toLocaleString('nl-BE')} · {authorLabel}
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
