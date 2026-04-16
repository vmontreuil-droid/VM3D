'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  Download,
  FileCode2,
  Send,
  CheckCircle2,
} from 'lucide-react'
import AppShell from '@/components/app-shell'
import { downloadPDF } from '@/lib/document-pdf'
import { downloadUBL } from '@/lib/document-ubl'
import { generateOGM } from '@/lib/ogm'
import type { DocumentData, CompanyInfo, DocumentLine } from '@/lib/document-types'

const sectionClass =
  'overflow-hidden rounded-[18px] border border-[var(--border-soft)] bg-[var(--bg-card-2)]/80 shadow-sm'

function statusBadge(status: string) {
  const map: Record<string, { label: string; color: string }> = {
    concept: { label: 'Concept', color: 'bg-zinc-500/15 text-zinc-300' },
    verstuurd: { label: 'Verstuurd', color: 'bg-amber-500/15 text-amber-300' },
    betaald: { label: 'Betaald', color: 'bg-emerald-500/15 text-emerald-300' },
    vervallen: { label: 'Vervallen', color: 'bg-red-500/15 text-red-300' },
    gecrediteerd: { label: 'Gecrediteerd', color: 'bg-purple-500/15 text-purple-300' },
  }
  const s = map[status] ?? { label: status, color: 'bg-zinc-500/15 text-zinc-300' }
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${s.color}`}>
      {s.label}
    </span>
  )
}

function fmt(n: number): string {
  return n.toFixed(2).replace('.', ',')
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('nl-BE')
}

type Props = {
  factuur: any
  lines: any[]
  customer: any
  company: any
  onStatusChange: (newStatus: string) => Promise<void>
}

export default function FactuurDetailClient({ factuur, lines, customer, company, onStatusChange }: Props) {
  function buildDocData(): DocumentData {
    const emptyCompany: CompanyInfo = {
      company_name: null, full_name: null, email: null, phone: null,
      vat_number: null, street: null, house_number: null, bus: null,
      postal_code: null, city: null, country: null, iban: null, bic: null, logo_url: null,
    }
    return {
      id: factuur.id,
      type: 'factuur',
      number: factuur.factuur_number,
      status: factuur.status,
      subject: factuur.subject,
      description: factuur.description,
      created_at: factuur.created_at,
      due_date: factuur.due_date,
      payment_terms: factuur.payment_terms,
      notes: factuur.notes,
      currency: factuur.currency || 'EUR',
      subtotal: Number(factuur.subtotal) || 0,
      vat_amount: Number(factuur.vat_amount) || 0,
      total: Number(factuur.total) || 0,
      lines: (lines || []).map((l: any): DocumentLine => ({
        position: l.position,
        description: l.description,
        quantity: Number(l.quantity),
        unit: l.unit || 'stuk',
        unit_price: Number(l.unit_price),
        vat_rate: l.vat_rate || '21%',
        line_total: Number(l.line_total),
      })),
      customer: customer ? { ...emptyCompany, ...customer } : emptyCompany,
      company: company ? { ...emptyCompany, ...company } : emptyCompany,
    }
  }

  const isPaid = factuur.status === 'betaald'
  const isOverdue = factuur.status === 'vervallen' || (
    factuur.status === 'verstuurd' && factuur.due_date && new Date(factuur.due_date) < new Date()
  )
  const ogm = generateOGM(factuur.id)

  return (
    <AppShell isAdmin>
      <div className="space-y-4">
        {/* Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/facturen"
            className="group relative inline-flex overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-3 text-left transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)]/80"
          >
            <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
            <span className="flex items-start gap-2.5 pr-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
                <ArrowLeft className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold leading-5 text-[var(--text-main)]">Facturen</span>
                <span className="block text-[11px] leading-4 text-[var(--text-soft)]">Terug naar overzicht</span>
              </span>
            </span>
          </Link>
        </div>

        {/* Document Header */}
        <div className={sectionClass}>
          <div className="relative border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-5 sm:px-5">
            <div className="absolute inset-0 opacity-30">
              <div className="h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(242,140,58,0.18),transparent_35%)]" />
            </div>
            <div className="relative flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Factuur</p>
                <h1 className="mt-2 flex items-center gap-3 text-2xl font-semibold text-[var(--text-main)]">
                  {factuur.factuur_number}
                  {statusBadge(factuur.status)}
                </h1>
                {factuur.subject && (
                  <p className="mt-1 text-sm text-[var(--text-soft)]">{factuur.subject}</p>
                )}
              </div>
              {/* Download knoppen */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => downloadPDF(buildDocData())}
                  className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3.5 py-2 text-xs font-semibold text-[var(--text-main)] transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)]/80"
                >
                  <Download className="h-3.5 w-3.5" />
                  PDF
                </button>
                <button
                  onClick={() => downloadUBL(buildDocData())}
                  className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3.5 py-2 text-xs font-semibold text-[var(--text-main)] transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)]/80"
                >
                  <FileCode2 className="h-3.5 w-3.5" />
                  UBL / Peppol XML
                </button>
                {factuur.status === 'concept' && (
                  <button
                    onClick={() => onStatusChange('verstuurd')}
                    className="inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-400 transition hover:bg-amber-500/20"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Versturen
                  </button>
                )}
                {factuur.status === 'verstuurd' && (
                  <button
                    onClick={() => onStatusChange('betaald')}
                    className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/20"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Markeer als betaald
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Meta info */}
          <div className="grid gap-3 border-b border-[var(--border-soft)] px-4 py-4 sm:grid-cols-2 lg:grid-cols-4 sm:px-5">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Klant</p>
              <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                {customer?.company_name || customer?.full_name || 'Onbekend'}
              </p>
              {customer?.email && <p className="text-xs text-[var(--text-soft)]">{customer.email}</p>}
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Factuurdatum</p>
              <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">{fmtDate(factuur.created_at)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Vervaldatum</p>
              <p className={`mt-1 text-sm font-semibold ${isOverdue ? 'text-red-400' : 'text-[var(--text-main)]'}`}>
                {fmtDate(factuur.due_date)}
                {isOverdue && !isPaid && <span className="ml-1.5 text-[10px]">⚠ Vervallen</span>}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Totaal</p>
              <p className="mt-1 text-sm font-bold text-[var(--accent)]">€{fmt(Number(factuur.total) || 0)}</p>
            </div>
          </div>

          {/* Linked offerte */}
          {factuur.offerte_id && (
            <div className="border-b border-[var(--border-soft)] px-4 py-2.5 sm:px-5">
              <p className="text-xs text-[var(--text-soft)]">
                Gekoppeld aan offerte:{' '}
                <Link href={`/admin/offerte/${factuur.offerte_id}`} className="font-semibold text-[var(--accent)] hover:underline">
                  bekijk offerte
                </Link>
              </p>
            </div>
          )}

          {/* Description */}
          {factuur.description && (
            <div className="border-b border-[var(--border-soft)] px-4 py-3 sm:px-5">
              <p className="text-xs text-[var(--text-soft)]">{factuur.description}</p>
            </div>
          )}

          {/* Line items table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border-soft)] bg-[var(--bg-card)]/50 text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                  <th className="px-4 py-2.5 sm:px-5">#</th>
                  <th className="px-2 py-2.5">Omschrijving</th>
                  <th className="px-2 py-2.5 text-right">Aantal</th>
                  <th className="px-2 py-2.5">Eenh.</th>
                  <th className="px-2 py-2.5 text-right">Prijs</th>
                  <th className="px-2 py-2.5 text-right">BTW</th>
                  <th className="px-4 py-2.5 text-right sm:px-5">Totaal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-soft)]">
                {(lines || []).map((line: any, i: number) => (
                  <tr key={line.id || i} className="text-sm">
                    <td className="px-4 py-2.5 text-[var(--text-muted)] sm:px-5">{i + 1}</td>
                    <td className="px-2 py-2.5 text-[var(--text-main)]">{line.description}</td>
                    <td className="px-2 py-2.5 text-right text-[var(--text-soft)]">{line.quantity}</td>
                    <td className="px-2 py-2.5 text-[var(--text-soft)]">{line.unit}</td>
                    <td className="px-2 py-2.5 text-right text-[var(--text-soft)]">€{fmt(Number(line.unit_price))}</td>
                    <td className="px-2 py-2.5 text-right text-[var(--text-soft)]">{line.vat_rate}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-[var(--text-main)] sm:px-5">€{fmt(Number(line.line_total))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="border-t border-[var(--border-soft)] px-4 py-4 sm:px-5">
            <div className="ml-auto max-w-xs space-y-1.5">
              <div className="flex justify-between text-sm text-[var(--text-soft)]">
                <span>Subtotaal</span>
                <span>€{fmt(Number(factuur.subtotal) || 0)}</span>
              </div>
              <div className="flex justify-between text-sm text-[var(--text-soft)]">
                <span>BTW</span>
                <span>€{fmt(Number(factuur.vat_amount) || 0)}</span>
              </div>
              <div className="flex justify-between border-t border-[var(--border-soft)] pt-1.5 text-base font-bold text-[var(--text-main)]">
                <span>Totaal</span>
                <span>€{fmt(Number(factuur.total) || 0)}</span>
              </div>
            </div>
          </div>

          {/* Gestructureerde mededeling */}
          <div className="border-t border-[var(--border-soft)] bg-sky-500/5 px-4 py-3.5 sm:px-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Gestructureerde mededeling</p>
                <p className="mt-1 font-mono text-lg font-bold tracking-wider text-sky-300">{ogm}</p>
                <p className="mt-0.5 text-[11px] text-[var(--text-soft)]">De klant vermeldt deze code bij betaling</p>
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(ogm) }}
                className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-300 transition hover:bg-sky-500/20"
              >
                Kopieer
              </button>
            </div>
          </div>

          {/* Payment info */}
          {isPaid && factuur.paid_at && (
            <div className="border-t border-emerald-500/20 bg-emerald-500/5 px-4 py-3 sm:px-5">
              <p className="text-xs font-semibold text-emerald-400">
                Betaald op {fmtDate(factuur.paid_at)}
              </p>
            </div>
          )}

          {/* Notes / payment terms */}
          {(factuur.payment_terms || factuur.notes) && (
            <div className="border-t border-[var(--border-soft)] px-4 py-3 sm:px-5">
              {factuur.payment_terms && (
                <p className="text-xs text-[var(--text-soft)]">
                  <span className="font-semibold text-[var(--text-main)]">Betalingsvoorwaarden:</span> {factuur.payment_terms}
                </p>
              )}
              {factuur.notes && (
                <p className="mt-1 text-xs text-[var(--text-soft)]">
                  <span className="font-semibold text-[var(--text-main)]">Opmerkingen:</span> {factuur.notes}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
