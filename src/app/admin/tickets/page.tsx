import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, FolderOpen, PlusCircle, Ticket } from 'lucide-react'
import AppShell from '@/components/app-shell'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'
import { locales, defaultLocale, COOKIE_NAME, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import {
  getTicketAgeHours,
  getTicketPriorityClass,
  getTicketPriorityLabel,
  getTicketSlaClass,
  getTicketSlaLabel,
  getTicketSlaState,
  getTicketSlaTargetHours,
  getTicketStatusClass,
  getTicketStatusLabel,
} from '@/lib/tickets'

type Props = {
  searchParams?: Promise<{
    customer?: string
    status?: string
  }>
}

function getCustomerLabel(customer: {
  company_name?: string | null
  full_name?: string | null
  email?: string | null
} | null, ticket: { visitor_name?: string | null; visitor_email?: string | null } | null | undefined, fallback: string) {
  if (!customer) {
    return ticket?.visitor_name || ticket?.visitor_email || fallback
  }
  return customer.company_name || customer.full_name || customer.email || fallback
}

function formatDayLabel(value: Date, locale: string) {
  const loc = locale === 'fr' ? 'fr-BE' : locale === 'en' ? 'en-US' : 'nl-BE'
  return value.toLocaleDateString(loc, { day: '2-digit', month: '2-digit' })
}

export default async function AdminTicketsPage({ searchParams }: Props) {
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const cookieStore = await cookies()
  const raw = cookieStore.get(COOKIE_NAME)?.value ?? defaultLocale
  const locale: Locale = (locales as readonly string[]).includes(raw) ? (raw as Locale) : defaultLocale
  const t = getDictionary(locale)
  const tt = t.adminTickets
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

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  const adminSupabase = createAdminClient()

  let ticketsQuery = adminSupabase
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false })

  if (resolvedSearchParams.customer) {
    ticketsQuery = ticketsQuery.eq('customer_id', resolvedSearchParams.customer)
  }

  if (resolvedSearchParams.status) {
    ticketsQuery = ticketsQuery.eq('status', resolvedSearchParams.status)
  }

  const { data: tickets, error } = await ticketsQuery

  const safeTickets = tickets ?? []
  const customerIds = Array.from(
    new Set(safeTickets.map((ticket: any) => ticket.customer_id).filter(Boolean))
  )
  const projectIds = Array.from(
    new Set(safeTickets.map((ticket: any) => ticket.project_id).filter(Boolean))
  )

  let customerMap = new Map<string, any>()
  let projectMap = new Map<number, any>()

  if (customerIds.length > 0) {
    const { data: customers } = await adminSupabase
      .from('profiles')
      .select('id, full_name, company_name, email')
      .in('id', customerIds)

    customerMap = new Map((customers ?? []).map((item: any) => [item.id, item]))
  }

  if (projectIds.length > 0) {
    const { data: projects } = await adminSupabase
      .from('projects')
      .select('id, name, address')
      .in('id', projectIds)

    projectMap = new Map((projects ?? []).map((item: any) => [item.id, item]))
  }

  const openCount = safeTickets.filter(
    (ticket: any) => ticket.status === 'nieuw' || ticket.status === 'in_behandeling'
  ).length
  const waitingCount = safeTickets.filter(
    (ticket: any) => ticket.status === 'wacht_op_klant'
  ).length
  const doneCount = safeTickets.filter(
    (ticket: any) => ticket.status === 'afgerond' || ticket.status === 'gesloten'
  ).length
  const now = new Date()

  const slaStates = safeTickets.map((ticket: any) =>
    getTicketSlaState({
      status: ticket.status,
      priority: ticket.priority,
      createdAt: ticket.created_at,
      now,
    })
  )

  const urgentOpenCount = safeTickets.filter(
    (ticket: any) =>
      (ticket.status === 'nieuw' || ticket.status === 'in_behandeling') && ticket.priority === 'urgent'
  ).length

  const overdueCount = slaStates.filter((state) => state === 'overdue').length
  const slaRiskCount = slaStates.filter((state) => state === 'at_risk').length
  const pausedCount = slaStates.filter((state) => state === 'paused').length

  const closedTicketsWithDurations = safeTickets.filter((ticket: any) => {
    if (!(ticket.status === 'afgerond' || ticket.status === 'gesloten')) return false
    if (!ticket.created_at || !ticket.updated_at) return false
    return true
  })

  const avgResolutionHours =
    closedTicketsWithDurations.length > 0
      ? Math.round(
          closedTicketsWithDurations.reduce((sum: number, ticket: any) => {
            const created = new Date(ticket.created_at).getTime()
            const updated = new Date(ticket.updated_at).getTime()
            const hours = Math.max((updated - created) / (1000 * 60 * 60), 0)
            return sum + hours
          }, 0) / closedTicketsWithDurations.length
        )
      : 0

  const oldestOpenAgeDays = safeTickets
    .filter((ticket: any) => ticket.status === 'nieuw' || ticket.status === 'in_behandeling')
    .reduce((maxAge: number, ticket: any) => {
      const ageHours = getTicketAgeHours(ticket.created_at, now)
      const ageDays = Math.floor(ageHours / 24)
      return Math.max(maxAge, ageDays)
    }, 0)

  const statusCounts = {
    nieuw: safeTickets.filter((ticket: any) => ticket.status === 'nieuw').length,
    in_behandeling: safeTickets.filter((ticket: any) => ticket.status === 'in_behandeling').length,
    wacht_op_klant: safeTickets.filter((ticket: any) => ticket.status === 'wacht_op_klant').length,
    afgerond: safeTickets.filter((ticket: any) => ticket.status === 'afgerond').length,
    gesloten: safeTickets.filter((ticket: any) => ticket.status === 'gesloten').length,
  }

  const priorityCounts = {
    laag: safeTickets.filter((ticket: any) => ticket.priority === 'laag').length,
    normaal: safeTickets.filter((ticket: any) => ticket.priority === 'normaal').length,
    hoog: safeTickets.filter((ticket: any) => ticket.priority === 'hoog').length,
    urgent: safeTickets.filter((ticket: any) => ticket.priority === 'urgent').length,
  }

  const trendStart = new Date(now)
  trendStart.setDate(trendStart.getDate() - 13)
  trendStart.setHours(0, 0, 0, 0)

  const createdPerDay = new Map<string, number>()
  for (const ticket of safeTickets) {
    if (!ticket.created_at) continue
    const createdAt = new Date(ticket.created_at)
    if (createdAt < trendStart) continue
    const key = createdAt.toISOString().slice(0, 10)
    createdPerDay.set(key, (createdPerDay.get(key) ?? 0) + 1)
  }

  const trendDays = Array.from({ length: 14 }).map((_, index) => {
    const day = new Date(trendStart)
    day.setDate(trendStart.getDate() + index)
    const key = day.toISOString().slice(0, 10)
    const count = createdPerDay.get(key) ?? 0
    return {
      key,
      label: formatDayLabel(day, locale),
      count,
    }
  })

  const maxTrendCount = Math.max(...trendDays.map((item) => item.count), 1)

  const ticketIds = safeTickets.map((ticket: any) => ticket.id)
  let recentMessages: any[] = []

  if (ticketIds.length > 0) {
    const { data: messageRows } = await adminSupabase
      .from('ticket_messages')
      .select('id, ticket_id, created_at, is_internal, author_id, message')
      .in('ticket_id', ticketIds)
      .order('created_at', { ascending: false })
      .limit(120)

    recentMessages = messageRows ?? []
  }

  const authorIds = Array.from(new Set(recentMessages.map((msg: any) => msg.author_id).filter(Boolean)))
  let authorMap = new Map<string, any>()

  if (authorIds.length > 0) {
    const { data: authors } = await adminSupabase
      .from('profiles')
      .select('id, full_name, company_name, email')
      .in('id', authorIds)

    authorMap = new Map((authors ?? []).map((item: any) => [item.id, item]))
  }

  const ticketById = new Map(safeTickets.map((ticket: any) => [ticket.id, ticket]))

  const recentActivity = [
    ...safeTickets
      .filter((ticket: any) => ticket.created_at)
      .map((ticket: any) => ({
        id: `create-${ticket.id}`,
        type: 'created' as const,
        date: ticket.created_at,
        ticketId: ticket.id,
        title: ticket.title || tt.noTitle,
        detail: tt.ticketCreated,
      })),
    ...recentMessages.map((message: any) => {
      const author = message.author_id ? authorMap.get(message.author_id) : null
      const authorLabel =
        author?.full_name || author?.company_name || author?.email || (message.is_internal ? tt.adminLabel : tt.customerLabel)

      return {
        id: `msg-${message.id}`,
        type: 'message' as const,
        date: message.created_at,
        ticketId: message.ticket_id,
        title: ticketById.get(message.ticket_id)?.title || tt.noTitle,
        detail: `${message.is_internal ? tt.internalNote : tt.reply} ${tt.by} ${authorLabel}`,
      }
    }),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 12)

  return (
    <AppShell isAdmin>
      <div className="space-y-3 sm:space-y-4 lg:space-y-5">
        <section className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
          <div className="relative border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-5 sm:px-5">
            <div className="absolute inset-0 opacity-30">
              <div className="h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(242,140,58,0.18),transparent_35%),radial-gradient(circle_at_left,rgba(255,255,255,0.05),transparent_25%)]" />
            </div>

            <div className="relative flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0 flex-1">
                <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                  {tt.adminPortal}
                </p>

                <h1 className="mt-2 text-2xl font-semibold text-[var(--text-main)] sm:text-3xl">
                  {tt.tickets}
                </h1>

                <p className="mt-2.5 max-w-3xl text-sm leading-6 text-[var(--text-soft)]">
                  {tt.ticketsDesc}
                </p>

                <div className="mt-4 max-w-[260px]">
                  <Link
                    href="/admin"
                    className="group relative block overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2.5 transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)]/80"
                  >
                    <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
                    <div className="flex items-start gap-2.5 pr-2">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
                        <ArrowLeft className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[13px] font-semibold leading-5 text-[var(--text-main)]">
                          {tt.dashboard}
                        </span>
                        <span className="block text-[11px] leading-4 text-[var(--text-soft)]">
                          {tt.backToAdmin}
                        </span>
                      </span>
                    </div>
                  </Link>
                </div>
              </div>

              <div className="w-full xl:ml-auto xl:max-w-[640px]">
                <div className="grid w-full gap-2 sm:grid-cols-4">
                  <div className="overflow-hidden rounded-xl border border-sky-500/30 bg-[linear-gradient(135deg,rgba(14,165,233,0.10),rgba(14,165,233,0.03))] px-3 py-2.5">
                    <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">{tt.total}</p>
                    <p className="mt-1 text-lg font-semibold text-sky-300">{safeTickets.length}</p>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-amber-500/30 bg-[linear-gradient(135deg,rgba(245,158,11,0.10),rgba(245,158,11,0.03))] px-3 py-2.5">
                    <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">{tt.open}</p>
                    <p className="mt-1 text-lg font-semibold text-amber-300">{openCount}</p>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-violet-500/30 bg-[linear-gradient(135deg,rgba(168,85,247,0.10),rgba(168,85,247,0.03))] px-3 py-2.5">
                    <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">{tt.waitingCustomer}</p>
                    <p className="mt-1 text-lg font-semibold text-violet-300">{waitingCount}</p>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-emerald-500/30 bg-[linear-gradient(135deg,rgba(16,185,129,0.10),rgba(16,185,129,0.03))] px-3 py-2.5">
                    <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">{tt.done}</p>
                    <p className="mt-1 text-lg font-semibold text-emerald-300">{doneCount}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 px-4 py-4 sm:px-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-[var(--text-soft)]">
                {error ? tt.cantLoad : tt.ticketsFound.replace('{count}', String(safeTickets.length))}
              </p>

              <Link
                href="/admin/tickets/new"
                className="group relative inline-flex h-9 items-center gap-1.5 overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 text-xs font-semibold text-[var(--text-main)] transition hover:border-[var(--accent)]/45 hover:bg-[var(--bg-card)]/80"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--accent)]/12 text-[var(--accent)]">
                  <PlusCircle className="h-3 w-3" />
                </span>
                <span className="pr-1">{tt.newTicket}</span>
                <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
              </Link>
            </div>

            <div className="grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-3">
                <div className="grid gap-2 sm:grid-cols-5">
                  <div className="rounded-xl border border-amber-500/30 bg-[linear-gradient(135deg,rgba(245,158,11,0.10),rgba(245,158,11,0.03))] px-3 py-2.5">
                    <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">{tt.urgentOpen}</p>
                    <p className="mt-1 text-lg font-semibold text-amber-300">{urgentOpenCount}</p>
                  </div>
                  <div className="rounded-xl border border-red-500/30 bg-[linear-gradient(135deg,rgba(239,68,68,0.10),rgba(239,68,68,0.03))] px-3 py-2.5">
                    <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">{tt.overdue}</p>
                    <p className="mt-1 text-lg font-semibold text-red-300">{overdueCount}</p>
                  </div>
                  <div className="rounded-xl border border-orange-500/30 bg-[linear-gradient(135deg,rgba(249,115,22,0.10),rgba(249,115,22,0.03))] px-3 py-2.5">
                    <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">{tt.slaRisk}</p>
                    <p className="mt-1 text-lg font-semibold text-orange-300">{slaRiskCount}</p>
                  </div>
                  <div className="rounded-xl border border-emerald-500/30 bg-[linear-gradient(135deg,rgba(16,185,129,0.10),rgba(16,185,129,0.03))] px-3 py-2.5">
                    <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">{tt.avgResolveTime}</p>
                    <p className="mt-1 text-lg font-semibold text-emerald-300">{avgResolutionHours}{tt.hoursShort}</p>
                  </div>
                  <div className="rounded-xl border border-sky-500/30 bg-[linear-gradient(135deg,rgba(14,165,233,0.10),rgba(14,165,233,0.03))] px-3 py-2.5">
                    <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">{tt.oldestOpen}</p>
                    <p className="mt-1 text-lg font-semibold text-sky-300">{oldestOpenAgeDays}{tt.daysShort}</p>
                  </div>
                  <div className="rounded-xl border border-violet-500/30 bg-[linear-gradient(135deg,rgba(168,85,247,0.10),rgba(168,85,247,0.03))] px-3 py-2.5">
                    <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">{tt.completionRate}</p>
                    <p className="mt-1 text-lg font-semibold text-violet-300">
                      {safeTickets.length > 0 ? Math.round((doneCount / safeTickets.length) * 100) : 0}%
                    </p>
                  </div>
                  <div className="rounded-xl border border-zinc-500/30 bg-[linear-gradient(135deg,rgba(113,113,122,0.10),rgba(113,113,122,0.03))] px-3 py-2.5">
                    <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">{tt.paused}</p>
                    <p className="mt-1 text-lg font-semibold text-zinc-300">{pausedCount}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      {tt.trendLast14}
                    </p>
                    <p className="text-[10px] text-[var(--text-soft)]">{tt.newTicketsPerDay}</p>
                  </div>

                  <div className="mt-3 grid grid-cols-7 gap-1.5 sm:grid-cols-14">
                    {trendDays.map((day) => (
                      <div key={day.key} className="space-y-1">
                        <div className="h-16 rounded-md border border-[var(--border-soft)] bg-[var(--bg-card)] p-1">
                          <div
                            className="w-full rounded-sm bg-[var(--accent)]/75"
                            style={{
                              height: `${Math.max((day.count / maxTrendCount) * 100, day.count > 0 ? 12 : 2)}%`,
                              marginTop: 'auto',
                            }}
                          />
                        </div>
                        <p className="text-center text-[9px] text-[var(--text-muted)]">{day.label}</p>
                        <p className="text-center text-[10px] font-semibold text-[var(--text-main)]">{day.count}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{tt.statusDistribution}</p>
                    <div className="mt-2 space-y-1.5 text-xs text-[var(--text-soft)]">
                      <p>{tt.statusNew}: <span className="font-semibold text-[var(--text-main)]">{statusCounts.nieuw}</span></p>
                      <p>{tt.statusInProgress}: <span className="font-semibold text-[var(--text-main)]">{statusCounts.in_behandeling}</span></p>
                      <p>{tt.statusWaitingCustomer}: <span className="font-semibold text-[var(--text-main)]">{statusCounts.wacht_op_klant}</span></p>
                      <p>{tt.statusDone}: <span className="font-semibold text-[var(--text-main)]">{statusCounts.afgerond}</span></p>
                      <p>{tt.statusClosed}: <span className="font-semibold text-[var(--text-main)]">{statusCounts.gesloten}</span></p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{tt.priorityDistribution}</p>
                    <div className="mt-2 space-y-1.5 text-xs text-[var(--text-soft)]">
                      <p>{tt.priorityLow}: <span className="font-semibold text-[var(--text-main)]">{priorityCounts.laag}</span></p>
                      <p>{tt.priorityNormal}: <span className="font-semibold text-[var(--text-main)]">{priorityCounts.normaal}</span></p>
                      <p>{tt.priorityHigh}: <span className="font-semibold text-[var(--text-main)]">{priorityCounts.hoog}</span></p>
                      <p>{tt.priorityUrgent}: <span className="font-semibold text-[var(--text-main)]">{priorityCounts.urgent}</span></p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{tt.timeline}</p>
                <p className="mt-1 text-[11px] text-[var(--text-soft)]">{tt.recentActivity}</p>

                {recentActivity.length === 0 ? (
                  <p className="mt-3 text-sm text-[var(--text-soft)]">{tt.noActivity}</p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-[var(--text-main)]">
                              #{activity.ticketId} · {activity.title}
                            </p>
                            <p className="mt-0.5 text-[11px] text-[var(--text-soft)]">{activity.detail}</p>
                          </div>
                          <span className="shrink-0 text-[10px] text-[var(--text-muted)]">
                            {new Date(activity.date).toLocaleString(locale === 'fr' ? 'fr-BE' : locale === 'en' ? 'en-US' : 'nl-BE', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)]">
              {safeTickets.length === 0 ? (
                <div className="px-4 py-5 text-sm text-[var(--text-soft)]">
                  {tt.noTicketsFound}
                </div>
              ) : (
                <div className="divide-y divide-[var(--border-soft)]">
                  {safeTickets.map((ticket: any) => {
                    const customer = ticket.customer_id
                      ? customerMap.get(ticket.customer_id) ?? null
                      : null
                    const project = ticket.project_id
                      ? projectMap.get(ticket.project_id) ?? null
                      : null
                    const slaState = getTicketSlaState({
                      status: ticket.status,
                      priority: ticket.priority,
                      createdAt: ticket.created_at,
                      now,
                    })
                    const slaTargetHours = getTicketSlaTargetHours(ticket.priority)

                    return (
                      <div
                        key={ticket.id}
                        className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold text-[var(--text-main)]">
                              #{ticket.id} · {ticket.title || tt.noTitle}
                            </p>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getTicketStatusClass(ticket.status)}`}>
                              {getTicketStatusLabel(ticket.status, t)}
                            </span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getTicketPriorityClass(ticket.priority)}`}>
                              {getTicketPriorityLabel(ticket.priority, t)}
                            </span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getTicketSlaClass(slaState)}`}>
                              {getTicketSlaLabel(slaState, t)}
                            </span>
                          </div>

                          <p className="mt-1 text-xs text-[var(--text-soft)]">
                            {tt.customer}: {getCustomerLabel(customer, ticket, tt.unknownCustomer)}
                            {project
                              ? ` · ${tt.site}: ${project.name || project.address || `#${project.id}`}`
                              : ''}
                            {` · ${tt.slaTarget}: ${slaTargetHours}${tt.hoursShort}`}
                          </p>
                        </div>

                        <Link
                          href={`/admin/tickets/${ticket.id}`}
                          className="group relative inline-flex h-8 items-center gap-1.5 overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-2.5 text-[10px] font-semibold text-[var(--text-main)] transition hover:border-sky-400/45 hover:bg-[var(--bg-card)]/80"
                        >
                          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-sky-500/12 text-sky-300">
                            <FolderOpen className="h-3 w-3" />
                          </span>
                          <span className="pr-1">{tt.open}</span>
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
