'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { Play, Square, Clock, Trash2, Loader2 } from 'lucide-react'

export type TimeEntry = {
  id: number
  description: string
  started_at: string
  ended_at: string | null
  duration_seconds: number | null
  billable: boolean
}

type Props = {
  projectId: number
  entries: TimeEntry[]
  onStart: (description: string) => Promise<void>
  onStop: (entryId: number) => Promise<void>
  onDelete: (entryId: number) => Promise<void>
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

export default function TimeTracker({ projectId, entries, onStart, onStop, onDelete }: Props) {
  const [description, setDescription] = useState('')
  const [isPending, startTransition] = useTransition()

  // Find running entry (no ended_at)
  const runningEntry = entries.find((e) => !e.ended_at)

  // Live elapsed timer
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

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

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [runningEntry])

  function handleStart() {
    const desc = description.trim()
    if (!desc) return
    startTransition(async () => {
      await onStart(desc)
      setDescription('')
    })
  }

  function handleStop() {
    if (!runningEntry) return
    startTransition(() => onStop(runningEntry.id))
  }

  function handleDelete(id: number) {
    startTransition(() => onDelete(id))
  }

  // Total billable seconds from completed entries
  const totalSeconds = entries
    .filter((e) => e.ended_at && e.billable)
    .reduce((sum, e) => sum + (e.duration_seconds ?? 0), 0)

  return (
    <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-[var(--text-main)]">Tijdregistratie</h3>
        {totalSeconds > 0 && (
          <span className="text-[10px] font-medium text-[var(--text-soft)]">
            Totaal: {formatDuration(totalSeconds)}
          </span>
        )}
      </div>

      {/* Active timer display */}
      {runningEntry ? (
        <div className="flex items-center gap-2 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/8 px-3 py-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold text-[var(--text-main)]">
              {runningEntry.description}
            </p>
            <p className="font-mono text-lg font-bold tabular-nums text-[var(--accent)]">
              {formatDuration(elapsed)}
            </p>
          </div>
          <button
            type="button"
            onClick={handleStop}
            disabled={isPending}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/20 text-red-400 transition hover:bg-red-500/30 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
          </button>
        </div>
      ) : (
        /* Start new timer */
        <div className="flex gap-2">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleStart() } }}
            placeholder="Werkzaamheid beschrijven..."
            className="input-dark flex-1 px-3 py-2 text-[12px]"
          />
          <button
            type="button"
            onClick={handleStart}
            disabled={isPending || !description.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 transition hover:bg-emerald-500/30 disabled:opacity-40"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          </button>
        </div>
      )}

      {/* Completed entries list */}
      {entries.filter((e) => e.ended_at).length > 0 && (
        <div className="space-y-1">
          {entries
            .filter((e) => e.ended_at)
            .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
            .slice(0, 2)
            .map((entry) => (
              <div
                key={entry.id}
                className="group flex items-center gap-2 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-2.5 py-1.5"
              >
                <Clock className="h-3 w-3 shrink-0 text-[var(--accent)]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-medium text-[var(--text-main)]">
                    {entry.description}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    {formatDate(entry.started_at)} · {formatDuration(entry.duration_seconds ?? 0)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(entry.id)}
                  className="flex h-6 w-6 items-center justify-center rounded text-[var(--text-muted)] opacity-0 transition hover:bg-red-500/15 hover:text-red-400 group-hover:opacity-100"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
