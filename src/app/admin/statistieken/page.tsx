import { ArrowLeft, Users, FolderOpen, Receipt, Ticket, TrendingUp, Clock, BarChart3, CheckCircle2, FileText, Euro } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/app-shell'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStatusLabel } from '@/lib/status'

export default async function StatistiekenPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const adminSupabase = createAdminClient()

  // --- Fetch all data ---
  const [
    { data: projects },
    { data: customers },
    { data: offertes },
    { data: facturen },
    { data: tickets },
    { data: timeEntries },
    { data: projectFiles },
  ] = await Promise.all([
    adminSupabase.from('projects').select('id, status, created_at, user_id, name, address, price'),
    adminSupabase.from('profiles').select('id, role, created_at, company_name, full_name').eq('role', 'user'),
    adminSupabase.from('offertes').select('id, status, total, created_at'),
    adminSupabase.from('facturen').select('id, status, total, created_at'),
    adminSupabase.from('tickets').select('id, status, priority, created_at'),
    adminSupabase.from('time_entries').select('id, duration_seconds, started_at, ended_at, billable'),
    adminSupabase.from('project_files').select('id, file_type, created_at'),
  ])

  const safeProjects = projects ?? []
  const safeCustomers = customers ?? []
  const safeOffertes = offertes ?? []
  const safeFacturen = facturen ?? []
  const safeTickets = tickets ?? []
  const safeTimeEntries = timeEntries ?? []
  const safeFiles = projectFiles ?? []

  // --- Project status breakdown ---
  const statusOrder = ['offerte_aangevraagd', 'offerte_verstuurd', 'in_behandeling', 'facturatie', 'factuur_verstuurd', 'afgerond']
  const statusCounts = statusOrder.map((s) => ({
    status: s,
    label: getStatusLabel(s),
    count: safeProjects.filter((p: any) => p.status === s).length,
  }))
  // Include legacy statuses
  const legacyIngediend = safeProjects.filter((p: any) => p.status === 'ingediend').length
  if (legacyIngediend > 0) statusCounts[0].count += legacyIngediend
  const legacyKlaar = safeProjects.filter((p: any) => p.status === 'klaar_voor_betaling').length
  if (legacyKlaar > 0) statusCounts[3].count += legacyKlaar

  const statusColors = [
    'text-slate-300 bg-slate-500/10 border-slate-500/20',
    'text-amber-300 bg-amber-500/10 border-amber-500/20',
    'text-blue-300 bg-blue-500/10 border-blue-500/20',
    'text-purple-300 bg-purple-500/10 border-purple-500/20',
    'text-amber-300 bg-amber-500/10 border-amber-500/20',
    'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
  ]

  // --- Offerte stats ---
  const offerteTotaal = safeOffertes.length
  const offerteVerstuurd = safeOffertes.filter((o: any) => o.status === 'verstuurd' || o.status === 'geaccepteerd').length
  const offerteOmzet = safeOffertes
    .filter((o: any) => o.status === 'geaccepteerd')
    .reduce((s: number, o: any) => s + (Number(o.total) || 0), 0)

  // --- Facturen stats ---
  const factuurTotaal = safeFacturen.length
  const factuurBetaald = safeFacturen.filter((f: any) => f.status === 'betaald').length
  const factuurVerstuurd = safeFacturen.filter((f: any) => f.status === 'verstuurd').length
  const factuurVervallen = safeFacturen.filter((f: any) => f.status === 'vervallen').length
  const factuurOmzetBetaald = safeFacturen
    .filter((f: any) => f.status === 'betaald')
    .reduce((s: number, f: any) => s + (Number(f.total) || 0), 0)
  const factuurOpenstaand = safeFacturen
    .filter((f: any) => f.status === 'verstuurd')
    .reduce((s: number, f: any) => s + (Number(f.total) || 0), 0)

  // --- Ticket stats ---
  const ticketTotaal = safeTickets.length
  const ticketOpen = safeTickets.filter((t: any) => t.status === 'nieuw' || t.status === 'in_behandeling').length
  const ticketHigh = safeTickets.filter((t: any) => t.priority === 'hoog' || t.priority === 'urgent').length

  // --- Time stats ---
  const completedEntries = safeTimeEntries.filter((e: any) => e.ended_at)
  const totalBillableSeconds = completedEntries
    .filter((e: any) => e.billable)
    .reduce((s: number, e: any) => s + (e.duration_seconds ?? 0), 0)
  const totalHours = Math.floor(totalBillableSeconds / 3600)
  const totalMinutes = Math.floor((totalBillableSeconds % 3600) / 60)

  // Today
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todaySeconds = completedEntries
    .filter((e: any) => new Date(e.started_at) >= todayStart)
    .reduce((s: number, e: any) => s + (e.duration_seconds ?? 0), 0)
  const todayH = Math.floor(todaySeconds / 3600)
  const todayM = Math.floor((todaySeconds % 3600) / 60)

  // This week
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1) // Monday
  weekStart.setHours(0, 0, 0, 0)
  const weekSeconds = completedEntries
    .filter((e: any) => new Date(e.started_at) >= weekStart)
    .reduce((s: number, e: any) => s + (e.duration_seconds ?? 0), 0)
  const weekH = Math.floor(weekSeconds / 3600)
  const weekM = Math.floor((weekSeconds % 3600) / 60)

  // --- File stats ---
  const clientUploads = safeFiles.filter((f: any) => f.file_type === 'client_upload').length
  const finalFiles = safeFiles.filter((f: any) => f.file_type === 'final_file').length

  // --- Monthly new projects (last 6 months) ---
  const monthLabels: string[] = []
  const monthCounts: number[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthLabels.push(d.toLocaleDateString('nl-BE', { month: 'short' }))
    monthCounts.push(
      safeProjects.filter((p: any) => p.created_at?.startsWith(key)).length
    )
  }
  const monthMax = Math.max(...monthCounts, 1)

  // --- Monthly revenue (last 6 months) ---
  const revenueMonths: number[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    revenueMonths.push(
      safeFacturen
        .filter((f: any) => f.status === 'betaald' && f.created_at?.startsWith(key))
        .reduce((s: number, f: any) => s + (Number(f.total) || 0), 0)
    )
  }
  const revenueMax = Math.max(...revenueMonths, 1)

  // --- Top customers by project count ---
  const customerProjectMap = new Map<string, number>()
  for (const p of safeProjects) {
    if (p.user_id) customerProjectMap.set(p.user_id, (customerProjectMap.get(p.user_id) ?? 0) + 1)
  }
  const topCustomers = safeCustomers
    .map((c: any) => ({ name: c.company_name || c.full_name || 'Onbekend', count: customerProjectMap.get(c.id) ?? 0 }))
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 5)

  function formatCurrency(val: number) {
    return new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' }).format(val)
  }

  return (
    <AppShell isAdmin>
      <div className="space-y-3 sm:space-y-4">
        {/* Banner */}
        <section className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
          <div className="relative border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-3 sm:px-5">
            <div className="absolute inset-0 opacity-30">
              <div className="h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(242,140,58,0.18),transparent_35%),radial-gradient(circle_at_left,rgba(255,255,255,0.05),transparent_25%)]" />
            </div>
            <div className="relative flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0 flex-1">
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-soft)] transition hover:text-[var(--accent)]"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Dashboard
                </Link>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                  Adminportaal
                </p>
                <h1 className="mt-1 text-xl font-semibold text-[var(--text-main)] sm:text-2xl">
                  Statistieken
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-[var(--text-soft)]">
                  Volledig overzicht van klanten, werven, omzet, tickets en tijdregistratie.
                </p>
              </div>
              <div className="w-full xl:ml-auto xl:max-w-[820px]">
                <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(245,140,55,0.08),rgba(245,140,55,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Klanten</p>
                        <p className="mt-1 text-lg font-semibold text-[var(--accent)]">{safeCustomers.length}</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)]/10">
                        <Users className="h-4.5 w-4.5 text-[var(--accent)]" />
                      </div>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(245,140,55,0.08),rgba(245,140,55,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Werven</p>
                        <p className="mt-1 text-lg font-semibold text-[var(--accent)]">{safeProjects.length}</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)]/10">
                        <FolderOpen className="h-4.5 w-4.5 text-[var(--accent)]" />
                      </div>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(76,175,80,0.08),rgba(76,175,80,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Betaald</p>
                        <p className="mt-1 text-lg font-semibold text-green-500">{formatCurrency(factuurOmzetBetaald)}</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10">
                        <Euro className="h-4.5 w-4.5 text-green-500" />
                      </div>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(14,165,233,0.08),rgba(14,165,233,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Uren totaal</p>
                        <p className="mt-1 text-lg font-semibold text-sky-400">{totalHours}u {totalMinutes}m</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-400/10">
                        <Clock className="h-4.5 w-4.5 text-sky-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Row 1: Werven per status + Nieuwe werven chart */}
        <div className="grid gap-3 xl:grid-cols-2">
          {/* Status breakdown */}
          <section className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
            <div className="border-b border-[var(--border-soft)] px-4 py-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Werven per status</h2>
            </div>
            <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3">
              {statusCounts.map((item, i) => (
                <div key={item.status} className={`rounded-xl border px-3 py-2.5 ${statusColors[i]}`}>
                  <p className="text-[10px] font-medium opacity-80">{item.label}</p>
                  <p className="mt-1 text-xl font-bold">{item.count}</p>
                </div>
              ))}
            </div>
          </section>

          {/* New projects per month chart */}
          <section className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
            <div className="border-b border-[var(--border-soft)] px-4 py-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Nieuwe werven per maand</h2>
            </div>
            <div className="flex items-end gap-2 px-4 py-4" style={{ height: 180 }}>
              {monthCounts.map((count, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] font-semibold text-[var(--accent)]">{count}</span>
                  <div
                    className="w-full max-w-[32px] rounded-t-md bg-[var(--accent)]/25"
                    style={{ height: `${Math.max((count / monthMax) * 100, 4)}%` }}
                  />
                  <span className="text-[9px] text-[var(--text-muted)]">{monthLabels[i]}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Row 2: Omzet + Facturen */}
        <div className="grid gap-3 xl:grid-cols-2">
          {/* Revenue per month chart */}
          <section className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
            <div className="border-b border-[var(--border-soft)] px-4 py-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Omzet per maand (betaald)</h2>
            </div>
            <div className="flex items-end gap-2 px-4 py-4" style={{ height: 180 }}>
              {revenueMonths.map((amount, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[9px] font-semibold text-emerald-400">
                    {amount > 0 ? `€${Math.round(amount)}` : '—'}
                  </span>
                  <div
                    className="w-full max-w-[32px] rounded-t-md bg-emerald-400/25"
                    style={{ height: `${Math.max((amount / revenueMax) * 100, 4)}%` }}
                  />
                  <span className="text-[9px] text-[var(--text-muted)]">{monthLabels[i]}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Facturen overview */}
          <section className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
            <div className="border-b border-[var(--border-soft)] px-4 py-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Facturen overzicht</h2>
            </div>
            <div className="grid grid-cols-2 gap-2 p-3">
              <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-2.5">
                <p className="text-[10px] text-[var(--text-muted)]">Totaal</p>
                <p className="mt-1 text-xl font-bold text-[var(--text-main)]">{factuurTotaal}</p>
              </div>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5">
                <p className="text-[10px] text-emerald-400">Betaald</p>
                <p className="mt-1 text-xl font-bold text-emerald-300">{factuurBetaald}</p>
                <p className="mt-0.5 text-[10px] text-emerald-400/70">{formatCurrency(factuurOmzetBetaald)}</p>
              </div>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2.5">
                <p className="text-[10px] text-amber-400">Verstuurd</p>
                <p className="mt-1 text-xl font-bold text-amber-300">{factuurVerstuurd}</p>
                <p className="mt-0.5 text-[10px] text-amber-400/70">{formatCurrency(factuurOpenstaand)}</p>
              </div>
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5">
                <p className="text-[10px] text-red-400">Vervallen</p>
                <p className="mt-1 text-xl font-bold text-red-300">{factuurVervallen}</p>
              </div>
            </div>
          </section>
        </div>

        {/* Row 3: Offertes + Tickets */}
        <div className="grid gap-3 xl:grid-cols-2">
          {/* Offertes */}
          <section className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
            <div className="border-b border-[var(--border-soft)] px-4 py-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Offertes</h2>
            </div>
            <div className="grid grid-cols-3 gap-2 p-3">
              <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-2.5">
                <p className="text-[10px] text-[var(--text-muted)]">Totaal</p>
                <p className="mt-1 text-xl font-bold text-[var(--text-main)]">{offerteTotaal}</p>
              </div>
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2.5">
                <p className="text-[10px] text-blue-400">Verstuurd</p>
                <p className="mt-1 text-xl font-bold text-blue-300">{offerteVerstuurd}</p>
              </div>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5">
                <p className="text-[10px] text-emerald-400">Omzet (geaccepteerd)</p>
                <p className="mt-1 text-lg font-bold text-emerald-300">{formatCurrency(offerteOmzet)}</p>
              </div>
            </div>
          </section>

          {/* Tickets */}
          <section className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
            <div className="border-b border-[var(--border-soft)] px-4 py-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Tickets</h2>
            </div>
            <div className="grid grid-cols-3 gap-2 p-3">
              <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-2.5">
                <p className="text-[10px] text-[var(--text-muted)]">Totaal</p>
                <p className="mt-1 text-xl font-bold text-[var(--text-main)]">{ticketTotaal}</p>
              </div>
              <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 px-3 py-2.5">
                <p className="text-[10px] text-sky-400">Open</p>
                <p className="mt-1 text-xl font-bold text-sky-300">{ticketOpen}</p>
              </div>
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5">
                <p className="text-[10px] text-red-400">Hoog/Urgent</p>
                <p className="mt-1 text-xl font-bold text-red-300">{ticketHigh}</p>
              </div>
            </div>
          </section>
        </div>

        {/* Row 4: Tijdregistratie + Top klanten + Bestanden */}
        <div className="grid gap-3 xl:grid-cols-3">
          {/* Tijdregistratie */}
          <section className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
            <div className="border-b border-[var(--border-soft)] px-4 py-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Tijdregistratie</h2>
            </div>
            <div className="space-y-2 p-3">
              <div className="flex items-center justify-between rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-2.5">
                <div>
                  <p className="text-[10px] text-[var(--text-muted)]">Vandaag</p>
                  <p className="mt-0.5 text-lg font-bold text-[var(--text-main)]">{todayH}u {todayM}m</p>
                </div>
                <Clock className="h-5 w-5 text-sky-400" />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-2.5">
                <div>
                  <p className="text-[10px] text-[var(--text-muted)]">Deze week</p>
                  <p className="mt-0.5 text-lg font-bold text-[var(--text-main)]">{weekH}u {weekM}m</p>
                </div>
                <BarChart3 className="h-5 w-5 text-amber-400" />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-2.5">
                <div>
                  <p className="text-[10px] text-[var(--text-muted)]">Totaal (factureerbaar)</p>
                  <p className="mt-0.5 text-lg font-bold text-[var(--text-main)]">{totalHours}u {totalMinutes}m</p>
                </div>
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              </div>
              <p className="text-[10px] text-[var(--text-muted)]">{completedEntries.length} registraties totaal</p>
            </div>
          </section>

          {/* Top klanten */}
          <section className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
            <div className="border-b border-[var(--border-soft)] px-4 py-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Top klanten</h2>
            </div>
            <div className="divide-y divide-[var(--border-soft)]">
              {topCustomers.map((c: any, i: number) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 text-[11px] font-bold text-[var(--accent)]">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-[var(--text-main)]">
                    {c.name}
                  </span>
                  <span className="rounded-full border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-soft)]">
                    {c.count} {c.count === 1 ? 'werf' : 'werven'}
                  </span>
                </div>
              ))}
              {topCustomers.length === 0 && (
                <p className="px-4 py-4 text-center text-[11px] text-[var(--text-muted)]">Geen klanten gevonden.</p>
              )}
            </div>
          </section>

          {/* Bestanden */}
          <section className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
            <div className="border-b border-[var(--border-soft)] px-4 py-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Bestanden</h2>
            </div>
            <div className="space-y-2 p-3">
              <div className="flex items-center justify-between rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-2.5">
                <div>
                  <p className="text-[10px] text-[var(--text-muted)]">Totaal bestanden</p>
                  <p className="mt-0.5 text-lg font-bold text-[var(--text-main)]">{safeFiles.length}</p>
                </div>
                <FileText className="h-5 w-5 text-[var(--accent)]" />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2.5">
                <div>
                  <p className="text-[10px] text-blue-400">Klantbestanden</p>
                  <p className="mt-0.5 text-lg font-bold text-blue-300">{clientUploads}</p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-blue-400" />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-purple-500/20 bg-purple-500/10 px-3 py-2.5">
                <div>
                  <p className="text-[10px] text-purple-400">Opleverbestanden</p>
                  <p className="mt-0.5 text-lg font-bold text-purple-300">{finalFiles}</p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-purple-400" />
              </div>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  )
}
