'use client'

import Link from 'next/link'
import { useState, useMemo } from 'react'
import {
  ArrowLeft, FileText, PlusCircle, Send, CheckCircle2, XCircle,
  Clock, Euro, TrendingUp, AlertTriangle, Search, X,
  ChevronRight, Target, Percent, BarChart2, CalendarClock,
  Loader2, Ban,
} from 'lucide-react'
import AppShell from '@/components/app-shell'
import { useT } from '@/i18n/context'

type Offerte = {
  id: number
  offerte_number: string
  subject: string | null
  status: string
  total: number
  customer_name: string | null
  created_at: string
  valid_until: string | null
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  concept:        { label: 'Concept',          color: 'text-zinc-300',   bg: 'bg-zinc-500/15 border-zinc-500/20',    icon: FileText },
  verstuurd:      { label: 'Verstuurd',         color: 'text-amber-300',  bg: 'bg-amber-500/15 border-amber-500/20',  icon: Send },
  wacht_op_klant: { label: 'Wacht op klant',    color: 'text-blue-300',   bg: 'bg-blue-500/15 border-blue-500/20',    icon: Clock },
  goedgekeurd:    { label: 'Goedgekeurd',       color: 'text-emerald-300',bg: 'bg-emerald-500/15 border-emerald-500/20', icon: CheckCircle2 },
  afgekeurd:      { label: 'Afgekeurd',         color: 'text-red-300',    bg: 'bg-red-500/15 border-red-500/20',      icon: XCircle },
  verlopen:       { label: 'Verlopen',          color: 'text-purple-300', bg: 'bg-purple-500/15 border-purple-500/20', icon: Ban },
}

function fmt(n: number) {
  return new Intl.NumberFormat('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('nl-BE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / 86400000)
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status]
  if (!cfg) return <span className="rounded-full border border-zinc-500/20 bg-zinc-500/15 px-2 py-0.5 text-[10px] font-semibold text-zinc-300">{status}</span>
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cfg.bg} ${cfg.color}`}>
      <Icon className="h-2.5 w-2.5" />
      {cfg.label}
    </span>
  )
}

function StatCard({
  label, value, sub, color, icon: Icon, gradient,
}: {
  label: string; value: string | number; sub?: string
  color: string; icon: any; gradient: string
}) {
  return (
    <div className={`overflow-hidden rounded-xl border border-[var(--border-soft)] px-3 py-2.5 ${gradient}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">{label}</p>
          <p className={`mt-0.5 text-xl font-bold ${color}`}>{value}</p>
          {sub && <p className="mt-0.5 text-[10px] text-[var(--text-soft)]">{sub}</p>}
        </div>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${color.replace('text-', 'bg-').replace('300', '500/12').replace('400', '500/12')}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </div>
    </div>
  )
}

function PipelineBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 text-xs text-[var(--text-soft)]">{label}</span>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-[var(--bg-card)]">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 shrink-0 text-right text-xs font-semibold text-[var(--text-main)]">{count}</span>
      <span className="w-8 shrink-0 text-right text-[10px] text-[var(--text-muted)]">{pct}%</span>
    </div>
  )
}

const STATUS_FILTERS = ['alle', 'concept', 'verstuurd', 'wacht_op_klant', 'goedgekeurd', 'afgekeurd', 'verlopen']

export default function OffertesPageClient({ offertes }: { offertes: Offerte[] }) {
  const { t } = useT()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('alle')

  /* ── Stats ── */
  const total       = offertes.length
  const conceptC    = offertes.filter(o => o.status === 'concept').length
  const verstuurdC  = offertes.filter(o => o.status === 'verstuurd').length
  const wachtC      = offertes.filter(o => o.status === 'wacht_op_klant').length
  const goedC       = offertes.filter(o => o.status === 'goedgekeurd').length
  const afgekeurdC  = offertes.filter(o => o.status === 'afgekeurd').length
  const verlopenC   = offertes.filter(o => o.status === 'verlopen').length

  const totalBedrag = offertes.reduce((s, o) => s + (o.total || 0), 0)
  const goedBedrag  = offertes.filter(o => o.status === 'goedgekeurd').reduce((s, o) => s + (o.total || 0), 0)
  const openBedrag  = offertes.filter(o => ['verstuurd', 'wacht_op_klant'].includes(o.status)).reduce((s, o) => s + (o.total || 0), 0)
  const gemBedrag   = total > 0 ? totalBedrag / total : 0
  const conversie   = total > 0 ? Math.round((goedC / total) * 100) : 0
  const actief      = verstuurdC + wachtC

  /* ── Expiring soon (≤14 days, still open) ── */
  const expiringSoon = useMemo(() =>
    offertes
      .filter(o => ['verstuurd', 'wacht_op_klant', 'concept'].includes(o.status))
      .filter(o => {
        const d = daysUntil(o.valid_until)
        return d !== null && d >= 0 && d <= 14
      })
      .sort((a, b) => (daysUntil(a.valid_until) ?? 99) - (daysUntil(b.valid_until) ?? 99)),
  [offertes])

  /* ── Filtered list ── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return offertes.filter(o => {
      const matchStatus = statusFilter === 'alle' || o.status === statusFilter
      const matchSearch = !q ||
        o.offerte_number?.toLowerCase().includes(q) ||
        o.customer_name?.toLowerCase().includes(q) ||
        o.subject?.toLowerCase().includes(q)
      return matchStatus && matchSearch
    })
  }, [offertes, search, statusFilter])

  return (
    <AppShell isAdmin>
      <div className="space-y-3">

        {/* ═══ BANNER ═══ */}
        <section className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
          {/* Header */}
          <div className="relative border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-4 sm:px-6">
            <div className="absolute inset-0 opacity-40 pointer-events-none">
              <div className="h-full w-full bg-[radial-gradient(ellipse_at_top_right,rgba(242,140,58,0.22),transparent_40%),radial-gradient(ellipse_at_bottom_left,rgba(14,165,233,0.08),transparent_40%)]" />
            </div>
            <div className="relative flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-soft)] transition hover:text-[var(--accent)]"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Dashboard
                </Link>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                  Adminportaal
                </p>
                <h1 className="mt-1 text-2xl font-bold text-[var(--text-main)]">
                  Offertebeheer
                </h1>
                <p className="mt-1 max-w-xl text-sm text-[var(--text-soft)]">
                  Volledig overzicht van alle offertes, conversie, openstaande bedragen en verlooptermijnen.
                </p>
              </div>
              <Link
                href="/admin/offerte/new"
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20 xl:mt-1"
              >
                <PlusCircle className="h-4 w-4" />
                Nieuwe offerte
              </Link>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-2 px-4 py-3 sm:grid-cols-6 sm:px-6">
            <StatCard label="Totaal"         value={total}       color="text-[var(--accent)]" icon={FileText}     gradient="bg-[linear-gradient(135deg,rgba(242,140,58,0.07),transparent)]" />
            <StatCard label="Concept"        value={conceptC}    color="text-zinc-300"        icon={FileText}     gradient="bg-[var(--bg-card)]" />
            <StatCard label="Verstuurd"      value={verstuurdC}  color="text-amber-400"       icon={Send}         gradient="bg-[linear-gradient(135deg,rgba(245,158,11,0.07),transparent)]" />
            <StatCard label="Wacht op klant" value={wachtC}      color="text-blue-400"        icon={Clock}        gradient="bg-[linear-gradient(135deg,rgba(14,165,233,0.07),transparent)]" />
            <StatCard label="Goedgekeurd"    value={goedC}       color="text-emerald-400"     icon={CheckCircle2} gradient="bg-[linear-gradient(135deg,rgba(16,185,129,0.07),transparent)]" />
            <StatCard label="Afgekeurd"      value={afgekeurdC}  color="text-red-400"         icon={XCircle}      gradient="bg-[linear-gradient(135deg,rgba(239,68,68,0.07),transparent)]" />
          </div>
        </section>

        {/* ═══ FINANCIEEL + CONVERSIE ═══ */}
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1.2fr]">

          {/* Financiële KPI's */}
          <div className="col-span-1 overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] lg:col-span-2">
            <div className="border-b border-[var(--border-soft)] px-4 py-3">
              <div className="flex items-center gap-2">
                <Euro className="h-4 w-4 text-[var(--accent)]" />
                <h2 className="text-sm font-semibold text-[var(--text-main)]">Financieel overzicht</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4">
              <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-3">
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Totale waarde</p>
                <p className="mt-1 text-xl font-bold text-[var(--text-main)]">€{fmt(totalBedrag)}</p>
                <p className="mt-0.5 text-[10px] text-[var(--text-soft)]">{total} offerte{total !== 1 ? 's' : ''}</p>
              </div>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Goedgekeurd</p>
                <p className="mt-1 text-xl font-bold text-emerald-400">€{fmt(goedBedrag)}</p>
                <p className="mt-0.5 text-[10px] text-emerald-300/60">{goedC} goedgekeurd</p>
              </div>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Openstaand</p>
                <p className="mt-1 text-xl font-bold text-amber-400">€{fmt(openBedrag)}</p>
                <p className="mt-0.5 text-[10px] text-amber-300/60">{actief} actief</p>
              </div>
              <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3">
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Gem. bedrag</p>
                <p className="mt-1 text-xl font-bold text-sky-400">€{fmt(gemBedrag)}</p>
                <p className="mt-0.5 text-[10px] text-sky-300/60">per offerte</p>
              </div>
            </div>
          </div>

          {/* Conversie + pipeline */}
          <div className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card-2)]">
            <div className="border-b border-[var(--border-soft)] px-4 py-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-[var(--accent)]" />
                <h2 className="text-sm font-semibold text-[var(--text-main)]">Pipeline & conversie</h2>
              </div>
            </div>
            <div className="p-4">
              {/* Conversie ring */}
              <div className="mb-4 flex items-center gap-4">
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
                  <svg className="absolute inset-0 -rotate-90" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="22" fill="none" stroke="var(--border-soft)" strokeWidth="5" />
                    <circle
                      cx="28" cy="28" r="22"
                      fill="none" stroke="rgb(16,185,129)" strokeWidth="5"
                      strokeDasharray={`${conversie * 1.382} 138.2`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="text-base font-bold text-emerald-400">{conversie}%</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-main)]">Conversieratio</p>
                  <p className="text-xs text-[var(--text-soft)]">{goedC} van {total} offertes goedgekeurd</p>
                  {afgekeurdC > 0 && (
                    <p className="mt-0.5 text-[10px] text-red-400">{afgekeurdC} afgekeurd</p>
                  )}
                </div>
              </div>
              {/* Pipeline bars */}
              <div className="space-y-2.5">
                <PipelineBar label="Verstuurd"   count={verstuurdC} total={total} color="bg-amber-400" />
                <PipelineBar label="Wacht klant" count={wachtC}     total={total} color="bg-blue-400" />
                <PipelineBar label="Goedgekeurd" count={goedC}      total={total} color="bg-emerald-400" />
                <PipelineBar label="Afgekeurd"   count={afgekeurdC} total={total} color="bg-red-400" />
                <PipelineBar label="Verlopen"    count={verlopenC}  total={total} color="bg-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* ═══ BIJNA VERLOPEN ═══ */}
        {expiringSoon.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-amber-500/30 bg-amber-500/5">
            <div className="flex items-center gap-2 border-b border-amber-500/20 px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-amber-300">
                {expiringSoon.length} offerte{expiringSoon.length !== 1 ? 's' : ''} verloopt binnenkort
              </h2>
              <span className="ml-auto text-[10px] text-amber-300/60">binnen 14 dagen</span>
            </div>
            <div className="divide-y divide-amber-500/10">
              {expiringSoon.map(o => {
                const days = daysUntil(o.valid_until)
                return (
                  <Link
                    key={o.id}
                    href={`/admin/offerte/${o.id}`}
                    className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-amber-500/10"
                  >
                    <CalendarClock className="h-4 w-4 shrink-0 text-amber-400" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[var(--text-main)]">
                        {o.offerte_number}
                        {o.customer_name && <span className="ml-1.5 font-normal text-[var(--text-soft)]">— {o.customer_name}</span>}
                      </p>
                      {o.subject && <p className="truncate text-[10px] text-[var(--text-soft)]">{o.subject}</p>}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-bold text-[var(--text-main)]">€{fmt(o.total || 0)}</p>
                      <p className={`text-[10px] font-semibold ${days === 0 ? 'text-red-400' : days && days <= 3 ? 'text-red-300' : 'text-amber-300'}`}>
                        {days === 0 ? 'Verloopt vandaag' : `Nog ${days} dag${days !== 1 ? 'en' : ''}`}
                      </p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-amber-400/60" />
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* ═══ OFFERTES TABEL ═══ */}
        <div className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card-2)]">
          {/* Tabel header + zoek/filter */}
          <div className="flex flex-col gap-3 border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-3 sm:flex-row sm:items-center sm:px-5">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/12">
                <FileText className="h-4 w-4 text-[var(--accent)]" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-[var(--text-main)]">Alle offertes</h2>
                <p className="text-[10px] text-[var(--text-soft)]">{filtered.length} van {total}</p>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:justify-end">
              {/* Zoekbalk */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Zoek op nummer, klant, onderwerp…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="h-8 w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] pl-8 pr-7 text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent)] sm:w-64"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)]">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Status filter */}
              <div className="flex flex-wrap gap-1">
                {STATUS_FILTERS.map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`rounded-lg border px-2.5 py-1 text-[10px] font-semibold transition ${
                      statusFilter === s
                        ? 'border-[var(--accent)]/60 bg-[var(--accent)]/15 text-[var(--accent)]'
                        : 'border-[var(--border-soft)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    {s === 'alle' ? 'Alle' : STATUS_CONFIG[s]?.label ?? s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Lege staat */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-5 py-14 text-center">
              <FileText className="h-9 w-9 text-[var(--text-muted)]" />
              <p className="text-sm font-semibold text-[var(--text-main)]">
                {total === 0 ? 'Nog geen offertes' : 'Geen offertes gevonden'}
              </p>
              <p className="text-xs text-[var(--text-soft)]">
                {total === 0
                  ? 'Maak een nieuwe offerte aan om te beginnen.'
                  : 'Pas de zoekopdracht of het filter aan.'}
              </p>
              {total === 0 && (
                <Link
                  href="/admin/offerte/new"
                  className="mt-1 inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  Eerste offerte aanmaken
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Desktop tabel */}
              <div className="hidden md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border-soft)] bg-[var(--bg-card)]">
                      <th className="px-4 py-2.5 text-left text-[9px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Nummer</th>
                      <th className="px-3 py-2.5 text-left text-[9px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Klant</th>
                      <th className="px-3 py-2.5 text-left text-[9px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Onderwerp</th>
                      <th className="px-3 py-2.5 text-left text-[9px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Status</th>
                      <th className="px-3 py-2.5 text-left text-[9px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Geldig tot</th>
                      <th className="px-3 py-2.5 text-right text-[9px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Bedrag</th>
                      <th className="px-4 py-2.5 text-left text-[9px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Aangemaakt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-soft)]">
                    {filtered.map(o => {
                      const days = daysUntil(o.valid_until)
                      const expiring = days !== null && days >= 0 && days <= 7 && ['verstuurd', 'wacht_op_klant', 'concept'].includes(o.status)
                      return (
                        <tr
                          key={o.id}
                          className={`group transition hover:bg-[var(--bg-card)] ${expiring ? 'bg-amber-500/[0.03]' : ''}`}
                        >
                          <td className="px-4 py-3">
                            <Link href={`/admin/offerte/${o.id}`} className="flex items-center gap-2">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-card-2)] text-[var(--text-muted)] group-hover:bg-[var(--accent)]/10 group-hover:text-[var(--accent)]">
                                <FileText className="h-3.5 w-3.5" />
                              </span>
                              <span className="text-xs font-semibold text-[var(--text-main)] hover:text-[var(--accent)]">
                                {o.offerte_number}
                              </span>
                            </Link>
                          </td>
                          <td className="px-3 py-3">
                            <span className="text-xs text-[var(--text-soft)]">
                              {o.customer_name ?? '—'}
                            </span>
                          </td>
                          <td className="max-w-[180px] px-3 py-3">
                            <span className="block truncate text-xs text-[var(--text-soft)]">
                              {o.subject ?? '—'}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <StatusBadge status={o.status} />
                          </td>
                          <td className="px-3 py-3">
                            {o.valid_until ? (
                              <span className={`text-xs font-medium ${
                                days !== null && days < 0 ? 'text-red-400'
                                : days !== null && days <= 7 ? 'text-amber-400'
                                : 'text-[var(--text-soft)]'
                              }`}>
                                {fmtDate(o.valid_until)}
                                {days !== null && days >= 0 && days <= 14 && (
                                  <span className="ml-1 text-[9px]">
                                    ({days === 0 ? 'vandaag' : `${days}d`})
                                  </span>
                                )}
                                {days !== null && days < 0 && (
                                  <span className="ml-1 text-[9px]">(verlopen)</span>
                                )}
                              </span>
                            ) : (
                              <span className="text-xs text-[var(--text-muted)]">—</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <span className="text-sm font-bold text-[var(--text-main)]">
                              €{fmt(o.total || 0)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs text-[var(--text-muted)]">
                                {fmtDate(o.created_at)}
                              </span>
                              <ChevronRight className="h-3.5 w-3.5 text-[var(--text-muted)] opacity-0 transition group-hover:opacity-100" />
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile kaarten */}
              <div className="divide-y divide-[var(--border-soft)] md:hidden">
                {filtered.map(o => {
                  const days = daysUntil(o.valid_until)
                  return (
                    <Link
                      key={o.id}
                      href={`/admin/offerte/${o.id}`}
                      className="flex items-center gap-3 px-4 py-3 transition hover:bg-[var(--bg-card)]"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-card)] text-[var(--text-muted)]">
                        <FileText className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-[var(--text-main)]">{o.offerte_number}</p>
                          <StatusBadge status={o.status} />
                        </div>
                        <p className="mt-0.5 truncate text-xs text-[var(--text-soft)]">
                          {o.customer_name ?? '—'}{o.subject ? ` — ${o.subject}` : ''}
                        </p>
                        {o.valid_until && days !== null && days <= 14 && days >= 0 && (
                          <p className="mt-0.5 text-[10px] text-amber-400">
                            Verloopt over {days === 0 ? 'vandaag' : `${days} dag${days !== 1 ? 'en' : ''}`}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold text-[var(--text-main)]">€{fmt(o.total || 0)}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">{fmtDate(o.created_at)}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  )
}
