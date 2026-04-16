'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Clock, Play, Square, Trash2, Loader2 } from 'lucide-react'

type ProjectOption = { id: string; label: string }

type TimeEntry = {
  id: number
  project_id: number
  description: string
  started_at: string
  ended_at: string | null
  duration_seconds: number | null
  billable: boolean
  projects?: {
    name?: string | null
    address?: string | null
    profiles?: { company_name?: string | null; full_name?: string | null } | null
  } | null
}

type Props = {
  projects: ProjectOption[]
}

function formatDuration(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('nl-BE', { day: '2-digit', month: '2-digit' }) +
    ' ' + d.toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })
}

function entryLabel(entry: TimeEntry) {
  const p = entry.projects
  const customer = p?.profiles?.company_name || p?.profiles?.full_name || ''
  const project = p?.name || ''
  if (customer && project) return `${customer} — ${project}`
  return customer || project || `Werf #${entry.project_id}`
}

export default function DashboardTimeWidget({ projects }: Props) {
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  // New timer form
  const [projectId, setProjectId] = useState('')
  const [projectQuery, setProjectQuery] = useState('')
  const [description, setDescription] = useState('')

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

  useEffect(() => { void fetchEntries() }, [fetchEntries])

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

  function handleProjectInput(value: string) {
    setProjectQuery(value)
    const normalized = value.trim().toLowerCase()
    const match = projects.find((p) => p.label.toLowerCase() === normalized)
    const partials = normalized ? projects.filter((p) => p.label.toLowerCase().includes(normalized)) : []
    setProjectId(match?.id ?? (partials.length === 1 ? partials[0].id : ''))
  }

  async function startTimer() {
    if (!projectId || !description.trim() || busy) return
    setBusy(true)
    try {
      await fetch('/api/admin/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', project_id: projectId, description: description.trim() }),
      })
      setDescription('')
      setProjectQuery('')
      setProjectId('')
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

  // Total today
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todaySeconds = entries
    .filter((e) => e.ended_at && new Date(e.started_at) >= todayStart)
    .reduce((s, e) => s + (e.duration_seconds ?? 0), 0)

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-[var(--border-soft)] px-3 py-2">
        <Clock className="h-3.5 w-3.5 text-emerald-400" />
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Tijdregistratie</h3>
        {todaySeconds > 0 && (
          <span className="ml-auto text-[10px] font-medium text-emerald-400">
            Vandaag: {formatDuration(todaySeconds)}
          </span>
        )}
      </div>

      {/* Running timer */}
      {runningEntry && (
        <div className="flex items-center gap-2 border-b border-[var(--accent)]/30 bg-[var(--accent)]/6 px-3 py-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold text-[var(--text-main)]">{runningEntry.description}</p>
            <p className="text-[9px] text-[var(--text-soft)]">{entryLabel(runningEntry)}</p>
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
          <input
            type="text"
            value={projectQuery}
            onChange={(e) => handleProjectInput(e.target.value)}
            list="time-project-options"
            placeholder="Kies werf..."
            className="input-dark h-7 w-full px-2 text-[11px]"
          />
          <datalist id="time-project-options">
            {projects.map((p) => <option key={p.id} value={p.label} />)}
          </datalist>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void startTimer() } }}
              placeholder="Werkzaamheid..."
              className="input-dark flex-1 h-7 px-2 text-[11px]"
            />
            <button
              type="button"
              onClick={() => void startTimer()}
              disabled={!projectId || !description.trim() || busy}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-400 transition hover:bg-emerald-500/30 disabled:opacity-40"
            >
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
            </button>
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
          <p className="px-3 py-4 text-center text-[11px] text-[var(--text-muted)]">Nog geen registraties.</p>
        ) : (
          <div className="divide-y divide-[var(--border-soft)]">
            {entries.filter((e) => e.ended_at).slice(0, 6).map((entry) => (
              <div key={entry.id} className="group flex items-start gap-2 px-3 py-1.5">
                <Clock className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400/60" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-medium text-[var(--text-main)]">{entry.description}</p>
                  <p className="text-[9px] text-[var(--text-muted)]">
                    {entryLabel(entry)} · {formatDate(entry.started_at)} · {formatDuration(entry.duration_seconds ?? 0)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void deleteEntry(entry.id)}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[var(--text-muted)] opacity-0 transition hover:bg-red-500/15 hover:text-red-400 group-hover:opacity-100"
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
