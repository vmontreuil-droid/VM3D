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
      <div className="space-y-2 sm:space-y-3">
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
                  {t.platform.dashboard}
                </Link>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                  Adminportaal
                </p>
                <h1 className="mt-1 text-xl font-semibold text-[var(--text-main)] sm:text-2xl">
                  {t.offertesPage.management}
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-[var(--text-soft)]">
                  {t.offertesPage.overview}
                </p>
              </div>
              <div className="w-full xl:ml-auto xl:max-w-[820px]">
                <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(245,140,55,0.08),rgba(245,140,55,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">{t.offertesPage.total}</p>
                        <p className="mt-1 text-lg font-semibold text-[var(--accent)]">{totalCount}</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)]/10">
                        <FileText className="h-4.5 w-4.5 text-[var(--accent)]" />
                      </div>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(245,158,11,0.08),rgba(245,158,11,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">{t.offertesPage.sent}</p>
                        <p className="mt-1 text-lg font-semibold text-amber-400">{verstuurdCount}</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400/10">
                        <Send className="h-4.5 w-4.5 text-amber-400" />
                      </div>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(76,175,80,0.08),rgba(76,175,80,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">{t.offertesPage.approved}</p>
                        <p className="mt-1 text-lg font-semibold text-green-500">{goedgekeurdCount}</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10">
                        <CheckCircle2 className="h-4.5 w-4.5 text-green-500" />
                      </div>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(14,165,233,0.08),rgba(14,165,233,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">{t.offertesPage.conversion}</p>
                        <p className="mt-1 text-lg font-semibold text-sky-400">{conversie}%</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-400/10">
                        <Euro className="h-4.5 w-4.5 text-sky-400" />
                      </div>
                    </div>
                  </div>
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
        </section>

        {/* Nieuwe offerte actie */}
        <div className="flex justify-end">
          <Link
            href="/admin/offerte/new"
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            {t.offertesPage.newOfferte}
          </Link>
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
