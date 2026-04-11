import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, FolderOpen, PlusCircle, Ticket } from 'lucide-react'
import AppShell from '@/components/app-shell'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getTicketPriorityClass,
  getTicketPriorityLabel,
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
} | null) {
  if (!customer) return 'Ongekende klant'
  return customer.company_name || customer.full_name || customer.email || 'Ongekende klant'
}

export default async function AdminTicketsPage({ searchParams }: Props) {
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
      .select('id, title, address')
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
                  Adminportaal
                </p>

                <h1 className="mt-2 text-2xl font-semibold text-[var(--text-main)] sm:text-3xl">
                  Tickets
                </h1>

                <p className="mt-2.5 max-w-3xl text-sm leading-6 text-[var(--text-soft)]">
                  Volg supportvragen, prioriteiten en statusupdates op in een centraal overzicht.
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
                          Dashboard
                        </span>
                        <span className="block text-[11px] leading-4 text-[var(--text-soft)]">
                          Terug naar adminoverzicht
                        </span>
                      </span>
                    </div>
                  </Link>
                </div>
              </div>

              <div className="w-full xl:ml-auto xl:max-w-[640px]">
                <div className="grid w-full gap-2 sm:grid-cols-4">
                  <div className="overflow-hidden rounded-xl border border-sky-500/30 bg-[linear-gradient(135deg,rgba(14,165,233,0.10),rgba(14,165,233,0.03))] px-3 py-2.5">
                    <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Totaal</p>
                    <p className="mt-1 text-lg font-semibold text-sky-300">{safeTickets.length}</p>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-amber-500/30 bg-[linear-gradient(135deg,rgba(245,158,11,0.10),rgba(245,158,11,0.03))] px-3 py-2.5">
                    <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Open</p>
                    <p className="mt-1 text-lg font-semibold text-amber-300">{openCount}</p>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-violet-500/30 bg-[linear-gradient(135deg,rgba(168,85,247,0.10),rgba(168,85,247,0.03))] px-3 py-2.5">
                    <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Wacht op klant</p>
                    <p className="mt-1 text-lg font-semibold text-violet-300">{waitingCount}</p>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-emerald-500/30 bg-[linear-gradient(135deg,rgba(16,185,129,0.10),rgba(16,185,129,0.03))] px-3 py-2.5">
                    <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Afgerond</p>
                    <p className="mt-1 text-lg font-semibold text-emerald-300">{doneCount}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 px-4 py-4 sm:px-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-[var(--text-soft)]">
                {error ? 'Kon tickets niet laden.' : `${safeTickets.length} ticket(s) gevonden`}
              </p>

              <Link href="/admin/tickets/new" className="btn-primary">
                <PlusCircle className="h-4 w-4" />
                Nieuw ticket
              </Link>
            </div>

            <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)]">
              {safeTickets.length === 0 ? (
                <div className="px-4 py-5 text-sm text-[var(--text-soft)]">
                  Nog geen tickets gevonden.
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

                    return (
                      <div
                        key={ticket.id}
                        className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold text-[var(--text-main)]">
                              #{ticket.id} · {ticket.title || 'Zonder titel'}
                            </p>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getTicketStatusClass(ticket.status)}`}>
                              {getTicketStatusLabel(ticket.status)}
                            </span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getTicketPriorityClass(ticket.priority)}`}>
                              {getTicketPriorityLabel(ticket.priority)}
                            </span>
                          </div>

                          <p className="mt-1 text-xs text-[var(--text-soft)]">
                            Klant: {getCustomerLabel(customer)}
                            {project
                              ? ` · Werf: ${project.title || project.address || `#${project.id}`}`
                              : ''}
                          </p>
                        </div>

                        <Link
                          href={`/admin/tickets/${ticket.id}`}
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
