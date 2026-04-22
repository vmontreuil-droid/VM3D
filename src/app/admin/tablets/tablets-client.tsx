'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, Wifi, WifiOff, FolderOpen, Smartphone, ChevronRight, X } from 'lucide-react'
import { useT } from '@/i18n/context'

type ListingFile = { path: string; size: number }
type Listing = { root?: string; files?: ListingFile[] }

type Machine = {
  id: number
  name: string
  brand: string
  model: string
  guidance_system: string | null
  connection_code: string
  is_online: boolean
  last_seen_at: string | null
  last_listing: Listing | null
  last_listing_at: string | null
}

type Hit = {
  machine: Machine
  file: ListingFile
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} kB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function formatTimeAgo(iso: string | null, locale: string): string {
  if (!iso) return '—'
  const ms = Date.now() - new Date(iso).getTime()
  if (ms < 60_000) return locale === 'en' ? 'just now' : locale === 'fr' ? 'à l\'instant' : 'recent'
  const min = Math.floor(ms / 60_000)
  if (min < 60) return `${min}m`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}u`
  const d = Math.floor(h / 24)
  return `${d}d`
}

export default function TabletsClient({ machines }: { machines: Machine[] }) {
  const { t, locale } = useT()
  const tt = t.adminTablets
  const [query, setQuery] = useState('')

  const trimmed = query.trim().toLowerCase()

  const hits: Hit[] = useMemo(() => {
    if (!trimmed) return []
    const out: Hit[] = []
    for (const m of machines) {
      const files = m.last_listing?.files
      if (!Array.isArray(files)) continue
      for (const f of files) {
        if (f.path.toLowerCase().includes(trimmed)) {
          out.push({ machine: m, file: f })
          if (out.length >= 200) break
        }
      }
      if (out.length >= 200) break
    }
    return out
  }, [machines, trimmed])

  return (
    <div className="space-y-4">
      {/* Cross-tablet search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={tt.searchPlaceholder}
          className="w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] py-2.5 pl-9 pr-9 text-sm text-[var(--text-main)] outline-none transition focus:border-[var(--accent)]/50"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--bg-card)] hover:text-[var(--text-main)]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Search results */}
      {trimmed && (
        <section className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card-2)]">
          <header className="flex items-center justify-between border-b border-[var(--border-soft)] px-4 py-2.5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              {tt.searchResults}
            </h2>
            <span className="text-[11px] text-[var(--text-soft)]">
              {tt.foundCount.replace('{n}', String(hits.length))}
            </span>
          </header>
          {hits.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-[var(--text-soft)]">
              {tt.noHits}
            </p>
          ) : (
            <ul className="max-h-[480px] divide-y divide-[var(--border-soft)] overflow-y-auto">
              {hits.map((h, i) => (
                <li key={i}>
                  <Link
                    href={`/admin/machines/${h.machine.id}`}
                    className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-[var(--bg-card)]"
                  >
                    <FolderOpen className="h-4 w-4 shrink-0 text-[var(--accent)]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-xs text-[var(--text-main)]">
                        {h.file.path}
                      </p>
                      <p className="truncate text-[10px] text-[var(--text-soft)]">
                        {h.machine.brand} {h.machine.model} · {h.machine.name} · {formatBytes(h.file.size)}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Machine cards */}
      {!trimmed && (
        <section>
          <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            {tt.allTablets}
          </h2>
          {machines.length === 0 ? (
            <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-8 text-center text-sm text-[var(--text-soft)]">
              {tt.noMachines}
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {machines.map(m => {
                const files = m.last_listing?.files
                const fileCount = Array.isArray(files) ? files.length : 0
                return (
                  <Link
                    key={m.id}
                    href={`/admin/machines/${m.id}`}
                    className="group flex flex-col gap-2 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-4 transition hover:border-[var(--accent)]/40 hover:bg-[var(--bg-card)]/80"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
                          <Smartphone className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[var(--text-main)]">
                            {m.brand} {m.model}
                          </p>
                          <p className="truncate text-[11px] text-[var(--text-soft)]">
                            {m.name}
                          </p>
                        </div>
                      </div>
                      <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        m.is_online ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-500/15 text-zinc-400'
                      }`}>
                        {m.is_online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                        {m.is_online ? tt.online : tt.offline}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                      <span>{tt.fileCount.replace('{n}', String(fileCount))}</span>
                      {m.last_listing_at && (
                        <span>{tt.synced} {formatTimeAgo(m.last_listing_at, locale)}</span>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
