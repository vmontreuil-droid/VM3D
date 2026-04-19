'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import AppShell from '@/components/app-shell'
import { ArrowLeft, FileText, Clock, MessageSquare, CheckSquare, Square } from 'lucide-react'

type TimeEntry = {
  id: number
  description: string
  started_at: string
  duration_seconds: number | null
}

type AdminNote = {
  id: number
  content: string
  created_at: string
}

type Props = {
  offerte: any
  lines: any[]
  timeEntries: TimeEntry[]
  adminNotes: AdminNote[]
  customerName: string
  error?: string
  onSubmit: (formData: FormData) => Promise<void>
  defaultDueDate: string
}

function fmt(n: number) {
  return n.toFixed(2).replace('.', ',')
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('nl-BE')
}

function fmtDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}u ${m.toString().padStart(2, '0')}m`
}

export default function FromOfferteClient({
  offerte, lines, timeEntries, adminNotes, customerName, error, onSubmit, defaultDueDate,
}: Props) {
  const [selectedEntries, setSelectedEntries] = useState<Set<number>>(new Set())
  const [selectedNotes, setSelectedNotes] = useState<Set<number>>(new Set())
  const [hourlyRate, setHourlyRate] = useState(85)

  const vatRate = parseFloat((offerte.vat_rate || '21%').replace('%', '')) / 100

  const timeSub = useMemo(() => {
    let sub = 0
    for (const id of selectedEntries) {
      const entry = timeEntries.find(e => e.id === id)
      if (entry) sub += ((entry.duration_seconds || 0) / 3600) * hourlyRate
    }
    return sub
  }, [selectedEntries, hourlyRate, timeEntries])

  const offerteSub = Number(offerte.subtotal) || 0
  const offerteVat = Number(offerte.vat_amount) || 0
  const timeVat = timeSub * vatRate
  const totalSub = offerteSub + timeSub
  const totalVat = offerteVat + timeVat
  const grandTotal = totalSub + totalVat

  function toggleEntry(id: number) {
    setSelectedEntries(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function toggleNote(id: number) {
    setSelectedNotes(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  return (
    <AppShell isAdmin>
      <form action={onSubmit} className="space-y-4">
        {/* Hidden state */}
        <input type="hidden" name="offerte_id" value={offerte.id} />
        {Array.from(selectedEntries).map(id => (
          <input key={id} type="hidden" name="time_entry_ids" value={id} />
        ))}
        {Array.from(selectedNotes).map(id => (
          <input key={id} type="hidden" name="note_ids" value={id} />
        ))}

        {/* Back */}
        <Link
          href={`/admin/offerte/${offerte.id}`}
          className="group relative inline-flex overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-3 text-left transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)]/80"
        >
          <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
          <span className="flex items-start gap-2.5 pr-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
              <ArrowLeft className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold leading-5 text-[var(--text-main)]">Offerte {offerte.offerte_number}</span>
              <span className="block text-[11px] leading-4 text-[var(--text-soft)]">Terug naar offertedetail</span>
            </span>
          </span>
        </Link>

        {error === 'save' && (
          <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            Er ging iets mis bij het aanmaken van de factuur.
          </div>
        )}

        {/* Source offerte */}
        <div className="overflow-hidden rounded-[18px] border border-[var(--border-soft)] bg-[var(--bg-card-2)]/80 shadow-sm">
          <div className="flex items-start gap-3 border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-3.5 sm:px-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/12 text-[var(--accent)]">
              <FileText className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-main)]">Factuur opmaken vanuit offerte</h2>
              <p className="mt-0.5 text-xs text-[var(--text-soft)]">
                Regels van {offerte.offerte_number} worden overgenomen. Voeg optioneel tijdsregistraties of opmerkingen toe.
              </p>
            </div>
          </div>

          <div className="space-y-4 px-4 py-4 sm:px-5">
            <div className="rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Bronofferte</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                <div>
                  <p className="text-[10px] text-[var(--text-muted)]">Offertenummer</p>
                  <p className="text-sm font-semibold text-[var(--text-main)]">{offerte.offerte_number}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--text-muted)]">Klant</p>
                  <p className="text-sm font-semibold text-[var(--text-main)]">{customerName}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--text-muted)]">Onderwerp</p>
                  <p className="text-sm text-[var(--text-main)]">{offerte.subject || '—'}</p>
                </div>
              </div>
            </div>

            {lines.length > 0 && (
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Regels overgenomen van offerte
                </p>
                <div className="space-y-1">
                  {lines.map((line: any) => (
                    <div key={line.id} className="flex items-center justify-between rounded-lg bg-[var(--bg-card)] px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-[var(--text-main)]">{line.description}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">
                          {line.quantity} × €{Number(line.unit_price).toFixed(2)} · {line.vat_rate} BTW
                        </p>
                      </div>
                      <p className="ml-3 text-sm font-semibold text-[var(--text-main)]">
                        €{Number(line.line_total).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Time entries */}
        {timeEntries.length > 0 && (
          <div className="overflow-hidden rounded-[18px] border border-[var(--border-soft)] bg-[var(--bg-card-2)]/80 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-3.5 sm:px-5">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/12 text-amber-400">
                  <Clock className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-[var(--text-main)]">Tijdsregistraties</h2>
                  <p className="text-xs text-[var(--text-soft)]">Kies welke registraties op de factuur komen</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Uurtarief</span>
                <span className="text-xs text-[var(--text-soft)]">€</span>
                <input
                  type="number"
                  name="hourly_rate"
                  value={hourlyRate}
                  onChange={e => setHourlyRate(Number(e.target.value) || 0)}
                  min="0"
                  step="5"
                  className="w-16 bg-transparent text-right text-sm font-semibold text-[var(--text-main)] outline-none"
                />
                <span className="text-xs text-[var(--text-soft)]">/u</span>
              </div>
            </div>

            <div className="divide-y divide-[var(--border-soft)]">
              {timeEntries.map(entry => {
                const isSelected = selectedEntries.has(entry.id)
                const seconds = entry.duration_seconds || 0
                const hours = seconds / 3600
                const lineTotal = hours * hourlyRate
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => toggleEntry(entry.id)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition sm:px-5 ${isSelected ? 'bg-amber-500/5' : 'hover:bg-[var(--bg-card)]/40'}`}
                  >
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center ${isSelected ? 'text-amber-400' : 'text-[var(--text-muted)]'}`}>
                      {isSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-[var(--text-main)]">
                        {entry.description || 'Geen beschrijving'}
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)]">
                        {fmtDate(entry.started_at)} · {fmtDuration(seconds)} ({hours.toFixed(2)}u)
                      </p>
                    </div>
                    <p className={`ml-2 shrink-0 text-sm font-semibold ${isSelected ? 'text-amber-400' : 'text-[var(--text-soft)]'}`}>
                      €{fmt(lineTotal)}
                    </p>
                  </button>
                )
              })}
            </div>

            {selectedEntries.size > 0 && (
              <div className="border-t border-amber-500/20 bg-amber-500/5 px-4 py-2.5 sm:px-5">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-amber-400">
                    {selectedEntries.size} registratie{selectedEntries.size !== 1 ? 's' : ''} geselecteerd
                  </span>
                  <span className="font-bold text-amber-400">+€{fmt(timeSub)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Admin notes */}
        {adminNotes.length > 0 && (
          <div className="overflow-hidden rounded-[18px] border border-[var(--border-soft)] bg-[var(--bg-card-2)]/80 shadow-sm">
            <div className="flex items-start gap-3 border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-3.5 sm:px-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/12 text-blue-400">
                <MessageSquare className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-[var(--text-main)]">Opmerkingen</h2>
                <p className="mt-0.5 text-xs text-[var(--text-soft)]">
                  Geselecteerde opmerkingen worden aan de factuurnotities toegevoegd
                </p>
              </div>
            </div>

            <div className="divide-y divide-[var(--border-soft)]">
              {adminNotes.map(note => {
                const isSelected = selectedNotes.has(note.id)
                return (
                  <button
                    key={note.id}
                    type="button"
                    onClick={() => toggleNote(note.id)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition sm:px-5 ${isSelected ? 'bg-blue-500/5' : 'hover:bg-[var(--bg-card)]/40'}`}
                  >
                    <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center ${isSelected ? 'text-blue-400' : 'text-[var(--text-muted)]'}`}>
                      {isSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm text-[var(--text-main)]">{note.content}</p>
                      <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">{fmtDate(note.created_at)}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Totals + options */}
        <div className="overflow-hidden rounded-[18px] border border-[var(--border-soft)] bg-[var(--bg-card-2)]/80 shadow-sm">
          <div className="border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-3.5 sm:px-5">
            <h2 className="text-sm font-semibold text-[var(--text-main)]">Factuurdetails</h2>
          </div>
          <div className="space-y-4 px-4 py-4 sm:px-5">
            <div className="flex justify-end">
              <div className="w-full max-w-xs space-y-2 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-soft)]">Offerte subtotaal</span>
                  <span className="font-semibold text-[var(--text-main)]">€{fmt(offerteSub)}</span>
                </div>
                {timeSub > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-amber-400">Tijdsregistraties</span>
                    <span className="font-semibold text-amber-400">+€{fmt(timeSub)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-soft)]">Subtotaal</span>
                  <span className="font-semibold text-[var(--text-main)]">€{fmt(totalSub)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-soft)]">BTW ({offerte.vat_rate || '21%'})</span>
                  <span className="font-semibold text-[var(--text-main)]">€{fmt(totalVat)}</span>
                </div>
                <div className="border-t border-[var(--border-soft)] pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[var(--accent)]">Totaal</span>
                    <span className="text-lg font-bold text-[var(--accent)]">€{fmt(grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Vervaldatum
                </label>
                <input
                  name="due_date"
                  type="date"
                  defaultValue={defaultDueDate}
                  className="input-dark w-full px-3 py-2.5 text-sm"
                  style={{ colorScheme: 'dark' as const }}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Opmerkingen
                </label>
                <textarea
                  name="notes"
                  className="input-dark min-h-[80px] w-full resize-none px-3 py-2.5 text-sm"
                  placeholder="Extra opmerkingen voor de factuur..."
                  defaultValue={offerte.notes || ''}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="group relative inline-flex overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-3 text-left transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)]/80"
          >
            <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
            <span className="flex items-start gap-2.5 pr-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
                <FileText className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold leading-5 text-[var(--text-main)]">Factuur aanmaken</span>
                <span className="block text-[11px] leading-4 text-[var(--text-soft)]">Opslaan als concept factuur</span>
              </span>
            </span>
          </button>
        </div>
      </form>
    </AppShell>
  )
}
