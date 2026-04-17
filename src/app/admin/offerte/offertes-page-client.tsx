'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  FileText,
  PlusCircle,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Euro,
} from 'lucide-react'
import AppShell from '@/components/app-shell'
import { useT } from '@/i18n/context'

const sectionClass =
  'overflow-hidden rounded-[18px] border border-[var(--border-soft)] bg-[var(--bg-card-2)]/80 shadow-sm'

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

function statusBadge(status: string, t: any) {
  const map: Record<string, { labelKey: string; color: string }> = {
    concept: { labelKey: 'statusConcept', color: 'bg-zinc-500/15 text-zinc-300' },
    verstuurd: { labelKey: 'statusSent', color: 'bg-amber-500/15 text-amber-300' },
    wacht_op_klant: { labelKey: 'statusWaiting', color: 'bg-blue-500/15 text-blue-300' },
    goedgekeurd: { labelKey: 'statusApproved', color: 'bg-emerald-500/15 text-emerald-300' },
    afgekeurd: { labelKey: 'statusRejected', color: 'bg-red-500/15 text-red-300' },
    verlopen: { labelKey: 'statusExpired', color: 'bg-purple-500/15 text-purple-300' },
  }
  const s = map[status]
  const label = s ? (t.offertesPage as any)[s.labelKey] : status
  const color = s?.color ?? 'bg-zinc-500/15 text-zinc-300'
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${color}`}>
      {label}
    </span>
  )
}

export default function OffertesPageClient({ offertes }: { offertes: Offerte[] }) {
  const { t } = useT()
  const totalCount = offertes.length
  const verstuurdCount = offertes.filter((o) => o.status === 'verstuurd').length
  const goedgekeurdCount = offertes.filter((o) => o.status === 'goedgekeurd').length
  const afgekeurdCount = offertes.filter((o) => o.status === 'afgekeurd').length
  const conceptCount = offertes.filter((o) => o.status === 'concept').length
  const wachtCount = offertes.filter((o) => o.status === 'wacht_op_klant').length

  const totalBedrag = offertes.reduce((sum, o) => sum + (o.total || 0), 0)
  const goedgekeurdBedrag = offertes.filter((o) => o.status === 'goedgekeurd').reduce((sum, o) => sum + (o.total || 0), 0)
  const openBedrag = offertes.filter((o) => ['verstuurd', 'wacht_op_klant'].includes(o.status)).reduce((sum, o) => sum + (o.total || 0), 0)
  const conversie = totalCount > 0 ? Math.round((goedgekeurdCount / totalCount) * 100) : 0

  return (
    <AppShell isAdmin>
      <div className="space-y-4">
        {/* Navigation + new */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/offerte/new"
            className="group relative inline-flex overflow-hidden rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-left transition hover:bg-emerald-500/20"
          >
            <span className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                <PlusCircle className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold leading-5 text-emerald-300">{t.offertesPage.newOfferte}</span>
                <span className="block text-[11px] leading-4 text-emerald-400/60">{t.offertesPage.createOfferte}</span>
              </span>
            </span>
          </Link>
        </div>

        {/* Banner */}
        <div className={sectionClass}>
          <div className="relative border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-5 sm:px-5">
            <div className="absolute inset-0 opacity-30">
              <div className="h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(58,140,242,0.18),transparent_35%)]" />
            </div>
            <div className="relative flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">{t.offertesPage.offertes}</p>
                <h1 className="mt-2 text-2xl font-semibold text-[var(--text-main)]">{t.offertesPage.management}</h1>
                <p className="mt-1 text-sm text-[var(--text-soft)]">{t.offertesPage.overview}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)]/60 px-3 py-2.5">
                  <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">{t.offertesPage.total}</p>
                  <p className="mt-1 text-lg font-semibold text-[var(--text-main)]">{totalCount}</p>
                </div>
                <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)]/60 px-3 py-2.5">
                  <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">{t.offertesPage.sent}</p>
                  <p className="mt-1 text-lg font-semibold text-amber-400">{verstuurdCount}</p>
                </div>
                <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)]/60 px-3 py-2.5">
                  <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">{t.offertesPage.approved}</p>
                  <p className="mt-1 text-lg font-semibold text-emerald-400">{goedgekeurdCount}</p>
                </div>
                <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)]/60 px-3 py-2.5">
                  <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">{t.offertesPage.conversion}</p>
                  <p className="mt-1 text-lg font-semibold text-sky-400">{conversie}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Financieel blok */}
          <div className="grid gap-3 px-4 py-4 sm:grid-cols-3 sm:px-5">
            <div className="flex items-center gap-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/12 text-[var(--accent)]">
                <Euro className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{t.offertesPage.totalValue}</p>
                <p className="text-sm font-bold text-[var(--text-main)]">€{totalBedrag.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{t.offertesPage.approved}</p>
                <p className="text-sm font-bold text-emerald-400">€{goedgekeurdBedrag.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/12 text-amber-400">
                <Clock className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{t.offertesPage.outstanding}</p>
                <p className="text-sm font-bold text-amber-400">€{openBedrag.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Offertelijst */}
        <div className={sectionClass}>
          <div className="flex items-center justify-between border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-3.5 sm:px-5">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/12 text-[var(--accent)]">
                <FileText className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-[var(--text-main)]">{t.offertesPage.allOffertes}</h2>
                <p className="mt-0.5 text-xs text-[var(--text-soft)]">{totalCount} {t.offertesPage.offertesTotal}</p>
              </div>
            </div>
          </div>

          {offertes.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <FileText className="mx-auto h-8 w-8 text-[var(--text-muted)]" />
              <p className="mt-3 text-sm font-semibold text-[var(--text-main)]">{t.offertesPage.noOffertes}</p>
              <p className="mt-1 text-xs text-[var(--text-soft)]">{t.offertesPage.createToStart}</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-soft)]">
              {offertes.map((o) => (
                <Link
                  key={o.id}
                  href={`/admin/offerte/${o.id}`}
                  className="flex items-center gap-4 px-4 py-3 transition hover:bg-[var(--bg-card)] sm:px-5"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-card-2)] text-[var(--text-muted)]">
                    <FileText className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-[var(--text-main)]">{o.offerte_number}</p>
                      {statusBadge(o.status, t)}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-[var(--text-soft)]">
                      {o.customer_name || t.offertesPage.unknownCustomer}
                      {o.subject ? ` — ${o.subject}` : ''}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-[var(--text-main)]">€{(o.total || 0).toFixed(2)}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      {o.created_at ? new Date(o.created_at).toLocaleDateString('nl-BE') : ''}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
