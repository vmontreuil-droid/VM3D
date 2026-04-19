'use client'

import Link from 'next/link'
import { useState, useMemo } from 'react'
import {
  ArrowLeft, FileText, PlusCircle, Send, CheckCircle2, XCircle,
  Clock, Euro, AlertTriangle, Search, X,
  ChevronRight, Target, CalendarClock, Ban, CreditCard,
} from 'lucide-react'
import AppShell from '@/components/app-shell'
import { useT } from '@/i18n/context'

type Factuur = {
  id: number
  factuur_number: string
  subject: string | null
  status: string
  total: number
  customer_name: string | null
  created_at: string
  due_date: string | null
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  concept:      { label: 'Concept',      color: 'text-zinc-300',    bg: 'bg-zinc-500/15',    border: 'border-zinc-500/20',    icon: FileText },
  verstuurd:    { label: 'Verstuurd',    color: 'text-amber-300',   bg: 'bg-amber-500/15',   border: 'border-amber-500/20',   icon: Send },
  betaald:      { label: 'Betaald',      color: 'text-emerald-300', bg: 'bg-emerald-500/15', border: 'border-emerald-500/20', icon: CheckCircle2 },
  vervallen:    { label: 'Vervallen',    color: 'text-red-300',     bg: 'bg-red-500/15',     border: 'border-red-500/20',     icon: XCircle },
  gecrediteerd: { label: 'Gecrediteerd', color: 'text-purple-300',  bg: 'bg-purple-500/15',  border: 'border-purple-500/20',  icon: Ban },
}

const STATUS_FILTERS = ['alle', 'concept', 'verstuurd', 'betaald', 'vervallen', 'gecrediteerd']

function fmt(n: number) {
  return new Intl.NumberFormat('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('nl-BE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status]
  if (!cfg) return <span className="rounded-full border border-zinc-500/20 bg-zinc-500/15 px-2 py-0.5 text-[10px] font-semibold text-zinc-300">{status}</span>
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cfg.bg} ${cfg.border} ${cfg.color}`}>
      <Icon className="h-2.5 w-2.5" />
      {cfg.label}
    </span>
  )
}

function StatCard({ label, value, sub, color, icon: Icon, gradient }: {
  label: string; value: string | number; sub?: string; color: string; icon: any; gradient: string
}) {
  const iconBg = color.includes('var(') ? 'bg-[var(--accent)]/12' : color.replace('text-', 'bg-').replace('300', '500/12').replace('400', '500/12')
  return (
    <div className={`overflow-hidden rounded-xl border border-[var(--border-soft)] px-3 py-2.5 ${gradient}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">{label}</p>
          <p className={`mt-0.5 text-xl font-bold ${color}`}>{value}</p>
          {sub && <p className="mt-0.5 text-[10px] text-[var(--text-soft)]">{sub}</p>}
        </div>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
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
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 shrink-0 text-right text-xs font-semibold text-[var(--text-main)]">{count}</span>
      <span className="w-8 shrink-0 text-right text-[10px] text-[var(--text-muted)]">{pct}%</span>
    </div>
  )
}

export default function FacturenPageClient({ facturen }: { facturen: Factuur[] }) {
  const { t } = useT()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('alle')

  /* ── Stats ── */
  const total        = facturen.length
  const conceptC     = facturen.filter(f => f.status === 'concept').length
  const verstuurdC   = facturen.filter(f => f.status === 'verstuurd').length
  const betaaldC     = facturen.filter(f => f.status === 'betaald').length
  const vervallenC   = facturen.filter(f => f.status === 'vervallen').length
  const gecrediteerdC = facturen.filter(f => f.status === 'gecrediteerd').length

  const totalBedrag    = facturen.reduce((s, f) => s + (f.total || 0), 0)
  const betaaldBedrag  = facturen.filter(f => f.status === 'betaald').reduce((s, f) => s + (f.total || 0), 0)
  const openBedrag     = facturen.filter(f => f.status === 'verstuurd').reduce((s, f) => s + (f.total || 0), 0)
  const vervallenBedrag = facturen.filter(f => f.status === 'vervallen').reduce((s, f) => s + (f.total || 0), 0)
  const gemBedrag      = total > 0 ? totalBedrag / total : 0
  const betaalRatio    = total > 0 ? Math.round((betaaldC / total) * 100) : 0

  /* ── Bijna vervallen (verstuurd, due ≤7 days) ── */
  const almostDue = useMemo(() =>
    facturen
      .filter(f => f.status === 'verstuurd')
      .filter(f => { const d = daysUntil(f.due_date); return d !== null && d <= 7 })
      .sort((a, b) => (daysUntil(a.due_date) ?? 99) - (daysUntil(b.due_date) ?? 99)),
  [facturen])

  /* ── Filtered list ── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return facturen.filter(f => {
      const matchStatus = statusFilter === 'alle' || f.status === statusFilter
      const matchSearch = !q ||
        f.factuur_number?.toLowerCase().includes(q) ||
        f.customer_name?.toLowerCase().includes(q) ||
        f.subject?.toLowerCase().includes(q)
      return matchStatus && matchSearch
    })
  }, [facturen, search, statusFilter])

  return (
    <AppShell isAdmin>
      <div className="space-y-3">

        {/* ═══ BANNER ═══ */}
        <section className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
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
                  Facturenbeheer
                </h1>
                <p className="mt-1 max-w-xl text-sm text-[var(--text-soft)]">
                  Volledig overzicht van alle facturen, betalingen, openstaande bedragen en vervaldata.
                </p>
              </div>
              <Link
                href="/admin/facturen/new"
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20 xl:mt-1"
              >
                <PlusCircle className="h-4 w-4" />
                Nieuwe factuur
              </Link>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-2 px-4 py-3 sm:grid-cols-5 sm:px-6">
            <StatCard label="Totaal"        value={total}         color="text-[var(--accent)]" icon={CreditCard}   gradient="bg-[linear-gradient(135deg,rgba(242,140,58,0.07),transparent)]" />
            <StatCard label="Verstuurd"     value={verstuurdC}    color="text-amber-400"        icon={Send}         gradient="bg-[linear-gradient(135deg,rgba(245,158,11,0.07),transparent)]" />
            <StatCard label="Betaald"       value={betaaldC}      color="text-emerald-400"      icon={CheckCircle2} gradient="bg-[linear-gradient(135deg,rgba(16,185,129,0.07),transparent)]" />
            <StatCard label="Vervallen"     value={vervallenC}    color="text-red-400"          icon={XCircle}      gradient="bg-[linear-gradient(135deg,rgba(239,68,68,0.07),transparent)]" />
            <StatCard label="Gecrediteerd"  value={gecrediteerdC} color="text-purple-400"       icon={Ban}          gradient="bg-[linear-gradient(135deg,rgba(168,85,247,0.07),transparent)]" />
          </div>
        </section>

        {/* ═══ FINANCIEEL + BETAALRATIO ═══ */}
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
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Totaal gefactureerd</p>
                <p className="mt-1 text-xl font-bold text-[var(--text-main)]">€{fmt(totalBedrag)}</p>
                <p className="mt-0.5 text-[10px] text-[var(--text-soft)]">{total} factuur{total !== 1 ? 'en' : ''}</p>
              </div>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Betaald</p>
                <p className="mt-1 text-xl font-bold text-emerald-400">€{fmt(betaaldBedrag)}</p>
                <p className="mt-0.5 text-[10px] text-emerald-300/60">{betaaldC} betaald</p>
              </div>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Openstaand</p>
                <p className="mt-1 text-xl font-bold text-amber-400">€{fmt(openBedrag)}</p>
                <p className="mt-0.5 text-[10px] text-amber-300/60">{verstuurdC} verstuurd</p>
              </div>
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Vervallen</p>
                <p className="mt-1 text-xl font-bold text-red-400">€{fmt(vervallenBedrag)}</p>
                <p className="mt-0.5 text-[10px] text-red-300/60">{vervallenC} factuur{vervallenC !== 1 ? 'en' : ''}</p>
              </div>
            </div>
          </div>

          {/* Betaalratio + pipeline */}
          <div className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card-2)]">
            <div className="border-b border-[var(--border-soft)] px-4 py-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-[var(--accent)]" />
                <h2 className="text-sm font-semibold text-[var(--text-main)]">Betalingsstatus</h2>
              </div>
            </div>
            <div className="p-4">
              {/* Betaalratio ring */}
              <div className="mb-4 flex items-center gap-4">
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
                  <svg className="absolute inset-0 -rotate-90" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="22" fill="none" stroke="var(--border-soft)" strokeWidth="5" />
                    <circle
                      cx="28" cy="28" r="22"
                      fill="none" stroke="rgb(16,185,129)" strokeWidth="5"
                      strokeDasharray={`${betaalRatio * 1.382} 138.2`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="text-base font-bold text-emerald-400">{betaalRatio}%</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-main)]">Betaalratio</p>
                  <p className="text-xs text-[var(--text-soft)]">{betaaldC} van {total} facturen betaald</p>
                  {vervallenC > 0 && (
                    <p className="mt-0.5 text-[10px] text-red-400">{vervallenC} vervallen</p>
                  )}
                </div>
              </div>
              {/* Pipeline bars */}
              <div className="space-y-2.5">
                <PipelineBar label="Verstuurd"    count={verstuurdC}    total={total} color="bg-amber-400" />
                <PipelineBar label="Betaald"      count={betaaldC}      total={total} color="bg-emerald-400" />
                <PipelineBar label="Vervallen"    count={vervallenC}    total={total} color="bg-red-400" />
                <PipelineBar label="Gecrediteerd" count={gecrediteerdC} total={total} color="bg-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* ═══ BIJNA VERVALLEN ═══ */}
        {almostDue.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-red-500/30 bg-red-500/5">
            <div className="flex items-center gap-2 border-b border-red-500/20 px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <h2 className="text-sm font-semibold text-red-300">
                {almostDue.length} factuur{almostDue.length !== 1 ? 'en' : ''} vervalt binnenkort
              </h2>
              <span className="ml-auto text-[10px] text-red-300/60">binnen 7 dagen</span>
            </div>
            <div className="divide-y divide-red-500/10">
              {almostDue.map(f => {
                const days = daysUntil(f.due_date)
                return (
                  <Link
                    key={f.id}
                    href={`/admin/facturen/${f.id}`}
                    className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-red-500/10"
                  >
                    <CalendarClock className="h-4 w-4 shrink-0 text-red-400" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[var(--text-main)]">
                        {f.factuur_number}
                        {f.customer_name && <span className="ml-1.5 font-normal text-[var(--text-soft)]">— {f.customer_name}</span>}
                      </p>
                      {f.subject && <p className="truncate text-[10px] text-[var(--text-soft)]">{f.subject}</p>}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-bold text-[var(--text-main)]">€{fmt(f.total || 0)}</p>
                      <p className={`text-[10px] font-semibold ${days !== null && days < 0 ? 'text-red-400' : days !== null && days <= 2 ? 'text-red-300' : 'text-amber-300'}`}>
                        {days === null ? '—'
                          : days < 0 ? `${Math.abs(days)} dag${Math.abs(days) !== 1 ? 'en' : ''} over`
                          : days === 0 ? 'Vervalt vandaag'
                          : `Nog ${days} dag${days !== 1 ? 'en' : ''}`}
                      </p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-red-400/60" />
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* ═══ FACTUREN TABEL ═══ */}
        <div className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card-2)]">
          {/* Header + zoek/filter */}
          <div className="flex flex-col gap-3 border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-3 sm:flex-row sm:items-center sm:px-5">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/12">
                <CreditCard className="h-4 w-4 text-[var(--accent)]" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-[var(--text-main)]">Alle facturen</h2>
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
              <CreditCard className="h-9 w-9 text-[var(--text-muted)]" />
              <p className="text-sm font-semibold text-[var(--text-main)]">
                {total === 0 ? 'Nog geen facturen' : 'Geen facturen gevonden'}
              </p>
              <p className="text-xs text-[var(--text-soft)]">
                {total === 0
                  ? 'Facturen worden aangemaakt vanuit een goedgekeurde offerte.'
                  : 'Pas de zoekopdracht of het filter aan.'}
              </p>
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
                      <th className="px-3 py-2.5 text-left text-[9px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Vervaldatum</th>
                      <th className="px-3 py-2.5 text-right text-[9px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Bedrag</th>
                      <th className="px-4 py-2.5 text-left text-[9px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Aangemaakt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-soft)]">
                    {filtered.map(f => {
                      const days = daysUntil(f.due_date)
                      const urgent = days !== null && days <= 7 && f.status === 'verstuurd'
                      return (
                        <tr
                          key={f.id}
                          className={`group transition hover:bg-[var(--bg-card)] ${urgent ? 'bg-red-500/[0.03]' : ''}`}
                        >
                          <td className="px-4 py-3">
                            <Link href={`/admin/facturen/${f.id}`} className="flex items-center gap-2">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-card-2)] text-[var(--text-muted)] group-hover:bg-[var(--accent)]/10 group-hover:text-[var(--accent)]">
                                <CreditCard className="h-3.5 w-3.5" />
                              </span>
                              <span className="text-xs font-semibold text-[var(--text-main)] hover:text-[var(--accent)]">
                                {f.factuur_number}
                              </span>
                            </Link>
                          </td>
                          <td className="px-3 py-3">
                            <span className="text-xs text-[var(--text-soft)]">{f.customer_name ?? '—'}</span>
                          </td>
                          <td className="max-w-[180px] px-3 py-3">
                            <span className="block truncate text-xs text-[var(--text-soft)]">{f.subject ?? '—'}</span>
                          </td>
                          <td className="px-3 py-3">
                            <StatusBadge status={f.status} />
                          </td>
                          <td className="px-3 py-3">
                            {f.due_date ? (
                              <span className={`text-xs font-medium ${
                                days !== null && days < 0 ? 'text-red-400'
                                : days !== null && days <= 7 ? 'text-amber-400'
                                : 'text-[var(--text-soft)]'
                              }`}>
                                {fmtDate(f.due_date)}
                                {days !== null && days >= 0 && days <= 7 && (
                                  <span className="ml-1 text-[9px]">({days === 0 ? 'vandaag' : `${days}d`})</span>
                                )}
                                {days !== null && days < 0 && (
                                  <span className="ml-1 text-[9px]">(vervallen)</span>
                                )}
                              </span>
                            ) : (
                              <span className="text-xs text-[var(--text-muted)]">—</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <span className="text-sm font-bold text-[var(--text-main)]">€{fmt(f.total || 0)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs text-[var(--text-muted)]">{fmtDate(f.created_at)}</span>
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
                {filtered.map(f => {
                  const days = daysUntil(f.due_date)
                  return (
                    <Link
                      key={f.id}
                      href={`/admin/facturen/${f.id}`}
                      className="flex items-center gap-3 px-4 py-3 transition hover:bg-[var(--bg-card)]"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-card)] text-[var(--text-muted)]">
                        <CreditCard className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-[var(--text-main)]">{f.factuur_number}</p>
                          <StatusBadge status={f.status} />
                        </div>
                        <p className="mt-0.5 truncate text-xs text-[var(--text-soft)]">
                          {f.customer_name ?? '—'}{f.subject ? ` — ${f.subject}` : ''}
                        </p>
                        {f.due_date && days !== null && days <= 7 && f.status === 'verstuurd' && (
                          <p className="mt-0.5 text-[10px] text-red-400">
                            {days < 0 ? `Vervallen (${Math.abs(days)} dag${Math.abs(days) !== 1 ? 'en' : ''} geleden)` : days === 0 ? 'Vervalt vandaag' : `Vervalt over ${days} dag${days !== 1 ? 'en' : ''}`}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold text-[var(--text-main)]">€{fmt(f.total || 0)}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">{fmtDate(f.created_at)}</p>
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
