'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  FileText,
  Download,
  FileCode2,
  Receipt,
  Send,
  CheckCircle2,
  XCircle,
  Link2,
  Copy,
  PenLine,
  MessageCircle,
} from 'lucide-react'
import { useRef, useState } from 'react'
import AppShell from '@/components/app-shell'
import { downloadPDF } from '@/lib/document-pdf'
import { downloadUBL } from '@/lib/document-ubl'
import type { DocumentData, CompanyInfo, DocumentLine } from '@/lib/document-types'

const sectionClass =
  'overflow-hidden rounded-[18px] border border-[var(--border-soft)] bg-[var(--bg-card-2)]/80 shadow-sm'

function statusBadge(status: string) {
  const map: Record<string, { label: string; color: string }> = {
    concept: { label: 'Concept', color: 'bg-zinc-500/15 text-zinc-300' },
    verstuurd: { label: 'Verstuurd', color: 'bg-amber-500/15 text-amber-300' },
    wacht_op_klant: { label: 'Wacht op klant', color: 'bg-blue-500/15 text-blue-300' },
    goedgekeurd: { label: 'Goedgekeurd', color: 'bg-emerald-500/15 text-emerald-300' },
    afgekeurd: { label: 'Afgekeurd', color: 'bg-red-500/15 text-red-300' },
    verlopen: { label: 'Verlopen', color: 'bg-purple-500/15 text-purple-300' },
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
  offerte: any
  lines: any[]
  customer: any
  company: any
  signLink: string | null
  messages: any[]
  onStatusChange: (newStatus: string) => Promise<void>
  onGenerateSignLink: () => Promise<void>
  onReplyMessage: (message: string) => Promise<void>
}

export default function OfferteDetailClient({ offerte, lines, customer, company, signLink, messages, onStatusChange, onGenerateSignLink, onReplyMessage }: Props) {
  const [copied, setCopied] = useState(false)
  const [reply, setReply]   = useState('')
  const [sending, setSending] = useState(false)
  const replyRef = useRef<HTMLTextAreaElement>(null)

  async function handleReply() {
    if (!reply.trim()) return
    setSending(true)
    await onReplyMessage(reply.trim())
    setReply('')
    setSending(false)
  }

  async function copySignLink() {
    if (!signLink) return
    await navigator.clipboard.writeText(signLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  function buildDocData(): DocumentData {
    const emptyCompany: CompanyInfo = {
      company_name: null, full_name: null, email: null, phone: null,
      vat_number: null, street: null, house_number: null, bus: null,
      postal_code: null, city: null, country: null, iban: null, bic: null, logo_url: null,
    }
    return {
      type: 'offerte',
      number: offerte.offerte_number,
      status: offerte.status,
      subject: offerte.subject,
      description: offerte.description,
      created_at: offerte.created_at,
      valid_until: offerte.valid_until,
      payment_terms: offerte.payment_terms,
      notes: offerte.notes,
      currency: offerte.currency || 'EUR',
      subtotal: Number(offerte.subtotal) || 0,
      vat_amount: Number(offerte.vat_amount) || 0,
      total: Number(offerte.total) || 0,
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
      sign_link: signLink,
    }
  }

  return (
    <AppShell isAdmin>
      <div className="space-y-4">
        {/* Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/offerte"
            className="group relative inline-flex overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-3 text-left transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)]/80"
          >
            <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
            <span className="flex items-start gap-2.5 pr-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
                <ArrowLeft className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold leading-5 text-[var(--text-main)]">Offertes</span>
                <span className="block text-[11px] leading-4 text-[var(--text-soft)]">Terug naar overzicht</span>
              </span>
            </span>
          </Link>
        </div>

        {/* Document Header */}
        <div className={sectionClass}>
          <div className="relative border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-5 sm:px-5">
            <div className="absolute inset-0 opacity-30">
              <div className="h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(58,140,242,0.18),transparent_35%)]" />
            </div>
            <div className="relative flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Offerte</p>
                <h1 className="mt-2 flex items-center gap-3 text-2xl font-semibold text-[var(--text-main)]">
                  {offerte.offerte_number}
                  {statusBadge(offerte.status)}
                </h1>
                {offerte.subject && (
                  <p className="mt-1 text-sm text-[var(--text-soft)]">{offerte.subject}</p>
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
                {/* Sign link */}
                {!offerte.signed_at && !['afgekeurd', 'verlopen', 'goedgekeurd'].includes(offerte.status) && (
                  signLink ? (
                    <button
                      onClick={copySignLink}
                      className="inline-flex items-center gap-2 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3.5 py-2 text-xs font-semibold text-purple-400 transition hover:bg-purple-500/20"
                    >
                      {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? 'Gekopieerd!' : 'Kopieer signeerlink'}
                    </button>
                  ) : (
                    <button
                      onClick={() => onGenerateSignLink()}
                      className="inline-flex items-center gap-2 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3.5 py-2 text-xs font-semibold text-purple-400 transition hover:bg-purple-500/20"
                    >
                      <Link2 className="h-3.5 w-3.5" />
                      Genereer signeerlink
                    </button>
                  )
                )}
                {offerte.signed_at && (
                  <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-400">
                    <PenLine className="h-3.5 w-3.5" />
                    Ondertekend door {offerte.signer_name || 'klant'}
                  </span>
                )}
                {offerte.status === 'goedgekeurd' && (
                  <Link
                    href={`/admin/facturen/from-offerte/${offerte.id}`}
                    className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/20"
                  >
                    <Receipt className="h-3.5 w-3.5" />
                    Factuur opmaken
                  </Link>
                )}
                {offerte.status === 'concept' && (
                  <button
                    onClick={() => onStatusChange('verstuurd')}
                    className="inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-400 transition hover:bg-amber-500/20"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Markeer als verstuurd
                  </button>
                )}
                {(offerte.status === 'verstuurd' || offerte.status === 'wacht_op_klant') && (
                  <>
                    <button
                      onClick={() => onStatusChange('goedgekeurd')}
                      className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/20"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Goedkeuren
                    </button>
                    <button
                      onClick={() => onStatusChange('afgekeurd')}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/20"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Afkeuren
                    </button>
                  </>
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
              <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Datum</p>
              <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">{fmtDate(offerte.created_at)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Geldig tot</p>
              <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">{fmtDate(offerte.valid_until)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Totaal</p>
              <p className="mt-1 text-sm font-bold text-[var(--accent)]">€{fmt(Number(offerte.total) || 0)}</p>
            </div>
          </div>

          {/* Description */}
          {offerte.description && (
            <div className="border-b border-[var(--border-soft)] px-4 py-3 sm:px-5">
              <p className="text-xs text-[var(--text-soft)]">{offerte.description}</p>
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
                <span>€{fmt(Number(offerte.subtotal) || 0)}</span>
              </div>
              <div className="flex justify-between text-sm text-[var(--text-soft)]">
                <span>BTW</span>
                <span>€{fmt(Number(offerte.vat_amount) || 0)}</span>
              </div>
              <div className="flex justify-between border-t border-[var(--border-soft)] pt-1.5 text-base font-bold text-[var(--text-main)]">
                <span>Totaal</span>
                <span>€{fmt(Number(offerte.total) || 0)}</span>
              </div>
            </div>
          </div>

          {/* Notes / payment terms */}
          {(offerte.payment_terms || offerte.notes) && (
            <div className="border-t border-[var(--border-soft)] px-4 py-3 sm:px-5">
              {offerte.payment_terms && (
                <p className="text-xs text-[var(--text-soft)]">
                  <span className="font-semibold text-[var(--text-main)]">Betalingsvoorwaarden:</span> {offerte.payment_terms}
                </p>
              )}
              {offerte.notes && (
                <p className="mt-1 text-xs text-[var(--text-soft)]">
                  <span className="font-semibold text-[var(--text-main)]">Opmerkingen:</span> {offerte.notes}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Q&A berichten */}
        <div className="overflow-hidden rounded-[18px] border border-[var(--border-soft)] bg-[var(--bg-card-2)]/80 shadow-sm">
          <div className="flex items-center gap-3 border-b border-[var(--border-soft)] px-4 py-3.5 sm:px-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--accent)]/12 text-[var(--accent)]">
              <MessageCircle className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-main)]">Berichten</h2>
              <p className="text-xs text-[var(--text-soft)]">
                {messages.length === 0 ? 'Nog geen berichten' : `${messages.length} bericht${messages.length !== 1 ? 'en' : ''}`}
              </p>
            </div>
          </div>

          {messages.length > 0 && (
            <div className="divide-y divide-[var(--border-soft)]">
              {messages.map((msg: any) => {
                const isAdmin = msg.sender_type === 'admin'
                return (
                  <div key={msg.id} className={`px-4 py-3 sm:px-5 ${isAdmin ? 'bg-[var(--accent)]/4' : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                        isAdmin
                          ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                          : 'bg-blue-500/12 text-blue-400'
                      }`}>
                        {isAdmin ? 'AD' : 'KL'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[var(--text-main)]">
                            {msg.sender_name || (isAdmin ? 'MV3D.CLOUD' : 'Klant')}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)]">
                            {new Date(msg.created_at).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {!isAdmin && !msg.read_at && (
                            <span className="rounded-full bg-blue-500/12 px-1.5 py-0.5 text-[9px] font-semibold text-blue-400">Nieuw</span>
                          )}
                        </div>
                        <p className="mt-0.5 whitespace-pre-wrap text-sm text-[var(--text-soft)]">{msg.message}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Reply form */}
          <div className="border-t border-[var(--border-soft)] p-4 sm:p-5">
            <p className="mb-2 text-xs font-semibold text-[var(--text-muted)]">Antwoord versturen naar klant</p>
            <textarea
              ref={replyRef}
              value={reply}
              onChange={e => setReply(e.target.value)}
              rows={3}
              placeholder="Typ uw antwoord…"
              className="w-full resize-none rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2.5 text-sm text-[var(--text-main)] outline-none transition focus:border-[var(--accent)]/50 focus:ring-2 focus:ring-[var(--accent)]/10 placeholder:text-[var(--text-muted)]"
            />
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={handleReply}
                disabled={!reply.trim() || sending}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {sending ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                Verstuur antwoord
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
