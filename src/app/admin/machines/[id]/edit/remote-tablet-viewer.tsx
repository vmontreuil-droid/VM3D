'use client'

import { useMemo, useState } from 'react'
import { Monitor, ExternalLink, AlertCircle, Maximize2, Minimize2, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { useT } from '@/i18n/context'

type Props = {
  tunnelUrl: string | null | undefined
  tunnelSeenAt: string | null | undefined
  isOnline: boolean | undefined
  connectionCode: string
}

function formatTimeAgo(iso: string | null | undefined, locale: string): string {
  if (!iso) return ''
  const ms = Date.now() - new Date(iso).getTime()
  if (ms < 60_000) return 'recent'
  const min = Math.floor(ms / 60_000)
  if (min < 60) return `${min}m`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}u`
  const d = Math.floor(h / 24)
  return `${d}d`
}

export default function RemoteTabletViewer({ tunnelUrl, tunnelSeenAt, isOnline, connectionCode }: Props) {
  const { t, locale } = useT()
  const tt = t.adminMachines
  const [fullscreen, setFullscreen] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  // noVNC URL — websockify serveert /vnc.html en /websockify op dezelfde poort
  const iframeSrc = useMemo(() => {
    if (!tunnelUrl) return null
    const base = tunnelUrl.replace(/\/$/, '')
    const params = new URLSearchParams({
      autoconnect: 'true',
      resize: 'scale',
      reconnect: 'true',
      reconnect_delay: '2000',
      view_only: 'false',
      show_dot: 'true',
      bell: 'off',
      path: 'websockify',
    })
    return `${base}/vnc.html?${params.toString()}`
  }, [tunnelUrl])

  const lastSeen = formatTimeAgo(tunnelSeenAt, locale)

  // Geen tunnel-URL bekend — toon setup-instructies
  if (!tunnelUrl || !iframeSrc) {
    return (
      <section className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
        <header className="flex items-center gap-2 border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-2.5">
          <Monitor className="h-4 w-4 text-[var(--text-muted)]" />
          <h2 className="text-sm font-semibold text-[var(--text-main)]">{tt.remoteViewTitle}</h2>
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
            {tt.remoteNotConfigured}
          </span>
        </header>
        <div className="grid gap-4 p-5 sm:grid-cols-[auto_1fr] sm:items-start">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--text-main)]">{tt.remoteNoTunnelTitle}</p>
            <p className="mt-1 text-xs text-[var(--text-soft)]">{tt.remoteNoTunnelDesc}</p>
            <div className="mt-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-3 text-xs">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">
                {tt.remoteSetupTitle}
              </p>
              <ol className="mt-2 space-y-1.5 list-decimal pl-4 text-[var(--text-soft)]">
                <li>{tt.remoteStep1}</li>
                <li>
                  {tt.remoteStep2Pre}{' '}
                  <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-emerald-400">
                    {connectionCode}
                  </code>{' '}
                  {tt.remoteStep2Post}
                </li>
                <li>{tt.remoteStep3}</li>
                <li>{tt.remoteStep4}</li>
              </ol>
              <p className="mt-3 text-[10px] text-[var(--text-muted)]">
                {tt.remoteSetupHint}
              </p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Tunnel beschikbaar — toon iframe
  return (
    <section
      className={`overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm ${
        fullscreen ? 'fixed inset-2 z-[60]' : 'relative'
      }`}
    >
      <header className="flex items-center gap-2 border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-2.5">
        <Monitor className="h-4 w-4 text-emerald-400" />
        <h2 className="text-sm font-semibold text-[var(--text-main)]">{tt.remoteViewTitle}</h2>
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
          isOnline ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-500/15 text-zinc-400'
        }`}>
          {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {isOnline ? tt.online : tt.offline}
        </span>
        {lastSeen && (
          <span className="text-[10px] text-[var(--text-muted)]">{tt.remoteLastSeen}: {lastSeen}</span>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setReloadKey(k => k + 1)}
            title={tt.remoteReload}
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] text-[var(--text-soft)] transition hover:border-[var(--accent)]/40 hover:text-[var(--text-main)]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setFullscreen(f => !f)}
            title={fullscreen ? tt.remoteExitFullscreen : tt.remoteFullscreen}
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] text-[var(--text-soft)] transition hover:border-[var(--accent)]/40 hover:text-[var(--text-main)]"
          >
            {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
          <a
            href={iframeSrc}
            target="_blank"
            rel="noopener noreferrer"
            title={tt.remoteOpenInNewTab}
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] text-[var(--text-soft)] transition hover:border-[var(--accent)]/40 hover:text-[var(--text-main)]"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </header>

      <div className={`relative bg-black ${fullscreen ? 'h-[calc(100%-44px)]' : 'aspect-[16/10]'}`}>
        <iframe
          key={reloadKey}
          src={iframeSrc}
          title={tt.remoteViewTitle}
          className="h-full w-full border-0"
          allow="clipboard-read; clipboard-write; fullscreen"
        />
      </div>
    </section>
  )
}
