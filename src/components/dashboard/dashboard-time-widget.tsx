'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Clock, Play, Square, Trash2, Loader2, Building2, FolderOpen, Construction, Link2, X } from 'lucide-react'
import { useT } from '@/i18n/context'

type Kind = 'customer' | 'project' | 'machine'

type TimeEntry = {
  id: number
  project_id: number | null
  linked_customer_id: string | null
  linked_machine_id: number | null
  description: string
  started_at: string
  ended_at: string | null
  duration_seconds: number | null
  billable: boolean
  target_kind?: Kind | null
  target_label?: string | null
}

type TargetOption = { id: string | number; label: string }
type Targets = { customers: TargetOption[]; projects: TargetOption[]; machines: TargetOption[] }

const kindIcon: Record<Kind, typeof Building2> = {
  customer: Building2,
  project: FolderOpen,
  machine: Construction,
}

const kindClass: Record<Kind, string> = {
  customer: 'bg-purple-500/15 text-purple-400',
  project: 'bg-[var(--accent)]/15 text-[var(--accent)]',
  machine: 'bg-orange-500/15 text-orange-400',
}

function formatDuration(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatDate(iso: string, locale: string) {
  const d = new Date(iso)
  const loc = locale === 'fr' ? 'fr-BE' : locale === 'en' ? 'en-US' : 'nl-BE'
  return d.toLocaleDateString(loc, { day: '2-digit', month: '2-digit' }) +
    ' ' + d.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' })
}

export default function DashboardTimeWidget({ hideHeader = false }: { hideHeader?: boolean } = {}) {
  const { t, locale } = useT()
  const tt = t.timeWidget
  const kindLabels: Record<Kind, string> = {
    customer: tt.linkCustomer,
    project: tt.linkProject,
    machine: tt.linkMachine,
  }
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  // Form
  const [description, setDescription] = useState('')
  const [targets, setTargets] = useState<Targets | null>(null)
  const [kind, setKind] = useState<Kind | null>(null)
  const [targetId, setTargetId] = useState<string | number | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [search, setSearch] = useState('')
  const pickerRef = useRef<HTMLDivElement | null>(null)

  // Live elapsed
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const runningEntry = entries.find((e) => !e.ended_at)

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/time-entries')
      if (res.ok) {
        const data = await res.json()
        setEntries(data.entries ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchTargets = useCallback(async () => {
    if (targets) return
    const res = await fetch('/api/admin/notes/targets')
    if (res.ok) {
      const data = await res.json()
      setTargets({
        customers: data.customers ?? [],
        projects: data.projects ?? [],
        machines: data.machines ?? [],
      })
    }
  }, [targets])

  useEffect(() => { void fetchEntries() }, [fetchEntries])

  useEffect(() => {
    if (!pickerOpen) return
    void fetchTargets()
    function onClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false)
      }
    }
    window.addEventListener('mousedown', onClick)
    return () => window.removeEventListener('mousedown', onClick)
  }, [pickerOpen, fetchTargets])

  // Live timer
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (runningEntry) {
      const start = new Date(runningEntry.started_at).getTime()
      const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000))
      tick()
      intervalRef.current = setInterval(tick, 1000)
    } else {
      setElapsed(0)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [runningEntry])

  const currentList: TargetOption[] = useMemo(() => {
    if (!kind || !targets) return []
    const list = kind === 'customer' ? targets.customers : kind === 'project' ? targets.projects : targets.machines
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter((o) => o.label.toLowerCase().includes(q))
  }, [kind, targets, search])

  const selectedLabel = useMemo(() => {
    if (!kind || targetId == null || !targets) return null
    const list = kind === 'customer' ? targets.customers : kind === 'project' ? targets.projects : targets.machines
    return list.find((o) => String(o.id) === String(targetId))?.label ?? null
  }, [kind, targetId, targets])

  function clearTarget() {
    setKind(null)
    setTargetId(null)
    setSearch('')
  }

  async function startTimer() {
    if (!kind || !targetId || !description.trim() || busy) return
    setBusy(true)
    try {
      await fetch('/api/admin/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          description: description.trim(),
          target_kind: kind,
          target_id: targetId,
        }),
      })
      setDescription('')
      clearTarget()
      await fetchEntries()
    } finally {
      setBusy(false)
    }
  }

  async function stopTimer(entryId: number) {
    if (busy) return
    setBusy(true)
    try {
      await fetch('/api/admin/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop', entry_id: entryId }),
      })
      await fetchEntries()
    } finally {
      setBusy(false)
    }
  }

  async function deleteEntry(entryId: number) {
    setEntries((prev) => prev.filter((e) => e.id !== entryId))
    await fetch('/api/admin/time-entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', entry_id: entryId }),
    })
  }

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todaySeconds = entries
    .filter((e) => e.ended_at && new Date(e.started_at) >= todayStart)
    .reduce((s, e) => s + (e.duration_seconds ?? 0), 0)

  return (
    <div className="flex h-full flex-col">
      {!hideHeader && (
        <div className="flex items-center gap-2 border-b border-[var(--border-soft)] px-3 py-2">
          <Clock className="h-3.5 w-3.5 text-emerald-400" />
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{tt.title}</h3>
          {todaySeconds > 0 && (
            <span className="ml-auto text-[10px] font-medium text-emerald-400">
              {tt.today}: {formatDuration(todaySeconds)}
            </span>
          )}
        </div>
      )}
      {hideHeader && todaySeconds > 0 && (
        <div className="border-b border-[var(--border-soft)] px-3 py-1 text-right text-[10px] font-medium text-emerald-400">
          {tt.today}: {formatDuration(todaySeconds)}
        </div>
      )}

      {/* Running timer */}
      {runningEntry && (
        <div className="flex items-center gap-2 border-b border-[var(--accent)]/30 bg-[var(--accent)]/6 px-3 py-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold text-[var(--text-main)]">{runningEntry.description}</p>
            <p className="truncate text-[9px] text-[var(--text-soft)]">{runningEntry.target_label || 'â€”'}</p>
          </div>
          <span className="font-mono text-sm font-bold tabular-nums text-[var(--accent)]">
            {formatDuration(elapsed)}
          </span>
          <button
            type="button"
            onClick={() => void stopTimer(runningEntry.id)}
            disabled={busy}
            className="flex h-6 w-6 items-center justify-center rounded-md bg-red-500/20 text-red-400 transition hover:bg-red-500/30 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Square className="h-3 w-3" />}
          </button>
        </div>
      )}

      {/* Start new timer */}
      {!runningEntry && (
        <div className="space-y-1.5 border-b border-[var(--border-soft)] px-3 py-2">
          <div className="flex gap-1.5">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void startTimer() } }}
              placeholder={tt.descriptionPlaceholder}
              className="input-dark h-7 flex-1 px-2 text-[11px]"
            />
            <button
              type="button"
              onClick={() => void startTimer()}
              disabled={!kind || !targetId || !description.trim() || busy}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-400 transition hover:bg-emerald-500/30 disabled:opacity-40"
            >
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
            </button>
          </div>

          {/* Target picker */}
          <div className="relative" ref={pickerRef}>
            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
              <span className="text-[var(--text-muted)]">{tt.linkLabel}:</span>
              {(['customer', 'project', 'machine'] as Kind[]).map((k) => {
                const Icon = kindIcon[k]
                const active = kind === k
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      if (active) {
                        clearTarget()
                        setPickerOpen(false)
                      } else {
                        setKind(k)
                        setTargetId(null)
                        setSearch('')
                        setPickerOpen(true)
                      }
                    }}
                    className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-semibold transition ${
                      active ? kindClass[k] : 'bg-white/5 text-[var(--text-soft)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    <Icon className="h-2.5 w-2.5" />
                    {kindLabels[k]}
                  </button>
                )
              })}
              {selectedLabel && kind && (
                <span className={`ml-1 inline-flex max-w-[60%] items-center gap-1 truncate rounded-md px-1.5 py-0.5 text-[10px] ${kindClass[kind]}`}>
                  <Link2 className="h-2.5 w-2.5 shrink-0" />
                  <span className="truncate">{selectedLabel}</span>
                  <button type="button" onClick={clearTarget} className="ml-0.5 shrink-0 opacity-70 hover:opacity-100">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              )}
            </div>

            {pickerOpen && kind && (
              <div className="mt-1.5 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)]/60 p-1.5">
                <input
                  type="text"
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={tt.searchPlaceholder}
                  className="input-dark mb-1 w-full px-2 py-1 text-[11px]"
                />
                <div className="max-h-32 overflow-y-auto">
                  {!targets ? (
                    <div className="flex justify-center py-3">
                      <Loader2 className="h-3 w-3 animate-spin text-[var(--text-muted)]" />
                    </div>
                  ) : currentList.length === 0 ? (
                    <p className="py-2 text-center text-[10px] text-[var(--text-muted)]">â€”</p>
                  ) : (
                    <ul className="space-y-0.5">
                      {currentList.slice(0, 50).map((o) => (
                        <li key={o.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setTargetId(o.id)
                              setPickerOpen(false)
                            }}
                            className="w-full truncate rounded px-2 py-1 text-left text-[11px] text-[var(--text-main)] hover:bg-[var(--bg-card-2)]"
                          >
                            {o.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent entries */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-4 w-4 animate-spin text-[var(--text-muted)]" />
          </div>
        ) : entries.filter((e) => e.ended_at).length === 0 ? (
          <p className="px-3 py-4 text-center text-[11px] text-[var(--text-muted)]">{tt.noEntries}</p>
        ) : (
          <div className="divide-y divide-[var(--border-soft)]">
            {entries.filter((e) => e.ended_at).slice(0, 6).map((entry) => {
              const k = entry.target_kind
              const Icon = k ? kindIcon[k] : null
              return (
                <div key={entry.id} className="group flex items-start gap-2 px-3 py-1.5">
                  <Clock className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400/60" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-medium text-[var(--text-main)]">{entry.description}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1">
                      {k && entry.target_label && Icon && (
                        <span className={`inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[9px] font-semibold ${kindClass[k]}`}>
                          <Icon className="h-2.5 w-2.5" />
                          <span className="max-w-[140px] truncate">{entry.target_label}</span>
                        </span>
                      )}
                      <p className="text-[9px] text-[var(--text-muted)]">
                        {formatDate(entry.started_at, locale)} · {formatDuration(entry.duration_seconds ?? 0)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void deleteEntry(entry.id)}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[var(--text-muted)] opacity-0 transition hover:bg-red-500/15 hover:text-red-400 group-hover:opacity-100"
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
