'use client'

import { useState, useEffect } from 'react'
import { Monitor, ExternalLink, Copy, Check, MonitorSmartphone, FileDown, AlertCircle } from 'lucide-react'

type Props = {
  rustdeskId?: string | null
  rustdeskPassword?: string | null
  machineName?: string
  isOnline?: boolean
}

export default function RemoteViewer({ rustdeskId, rustdeskPassword, machineName, isOnline }: Props) {
  const [copied, setCopied] = useState<'id' | 'pw' | null>(null)
  const [launched, setLaunched] = useState(false)

  // Reset launched state when machine changes
  useEffect(() => {
    setLaunched(false)
  }, [rustdeskId])

  const copyToClipboard = async (text: string, type: 'id' | 'pw') => {
    await navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const launchRustDesk = () => {
    if (!rustdeskId) return
    window.open(`rustdesk://${rustdeskId}`, '_blank')
    setLaunched(true)
  }

  // No machine selected
  if (!machineName) {
    return (
      <section className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
        <div className="border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-2">
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4 text-[var(--text-muted)]" />
            <span className="text-xs font-semibold text-[var(--text-main)]">Remote Scherm</span>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-[var(--text-muted)]">
          <MonitorSmartphone className="h-16 w-16 opacity-20" />
          <p className="text-sm text-[var(--text-soft)]">Selecteer een machine om te verbinden</p>
        </div>
      </section>
    )
  }

  // No RustDesk configured
  if (!rustdeskId) {
    return (
      <section className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
        <div className="border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-2">
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4 text-[var(--text-muted)]" />
            <span className="text-xs font-semibold text-[var(--text-main)]">Remote Scherm</span>
            <span className="ml-auto text-[10px] text-yellow-400">Niet geconfigureerd</span>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-[var(--text-muted)]">
          <AlertCircle className="h-12 w-12 text-yellow-400/30" />
          <div className="text-center px-6">
            <p className="text-sm font-medium text-[var(--text-soft)]">{machineName}</p>
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              RustDesk is nog niet ingesteld op deze machine.
            </p>
            <div className="mt-4 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-3 text-left">
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Setup in 2 minuten:</p>
              <ol className="mt-2 space-y-1.5 text-xs text-[var(--text-soft)]">
                <li>1. Installeer <strong>RustDesk</strong> op de tablet/PC vanuit Play Store of <a href="https://rustdesk.com/download" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline">rustdesk.com</a></li>
                <li>2. Open RustDesk → noteer het <strong>ID</strong> en <strong>wachtwoord</strong></li>
                <li>3. Vul het ID en wachtwoord in bij deze machine (Admin → Machines)</li>
              </ol>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
      {/* Header */}
      <div className="border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-2">
        <div className="flex items-center gap-2">
          <Monitor className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-semibold text-[var(--text-main)]">Remote Scherm</span>
          <span className={`ml-auto text-[10px] font-medium ${isOnline ? 'text-emerald-400' : 'text-[var(--text-muted)]'}`}>
            {isOnline ? '● Online' : '○ Offline'}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Machine name */}
        <div className="text-center">
          <p className="text-sm font-semibold text-[var(--text-main)]">{machineName}</p>
        </div>

        {/* RustDesk ID */}
        <div className="space-y-3">
          <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">RustDesk ID</span>
              <button
                onClick={() => copyToClipboard(rustdeskId, 'id')}
                className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 transition"
              >
                {copied === 'id' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied === 'id' ? 'Gekopieerd!' : 'Kopieer'}
              </button>
            </div>
            <p className="mt-1 font-mono text-lg font-bold text-emerald-400 tracking-wider">{rustdeskId}</p>
          </div>

          {rustdeskPassword && (
            <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Wachtwoord</span>
                <button
                  onClick={() => copyToClipboard(rustdeskPassword, 'pw')}
                  className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 transition"
                >
                  {copied === 'pw' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied === 'pw' ? 'Gekopieerd!' : 'Kopieer'}
                </button>
              </div>
              <p className="mt-1 font-mono text-lg font-bold text-[var(--text-main)] tracking-wider">{rustdeskPassword}</p>
            </div>
          )}
        </div>

        {/* Connect button */}
        <button
          onClick={launchRustDesk}
          className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/25 transition border border-emerald-500/20"
        >
          <ExternalLink className="h-5 w-5" />
          {launched ? 'RustDesk opnieuw openen' : 'Scherm overnemen via RustDesk'}
        </button>

        {launched && (
          <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/15 p-3">
            <p className="text-xs text-emerald-400 font-medium">RustDesk wordt geopend...</p>
            <p className="mt-1 text-[10px] text-[var(--text-muted)]">
              Als het wachtwoord gevraagd wordt, gebruik het wachtwoord hierboven.
            </p>
          </div>
        )}

        {/* Download links */}
        <div className="border-t border-[var(--border-soft)] pt-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
            RustDesk nog niet geïnstalleerd?
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href="https://rustdesk.com/download"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-[var(--border-soft)] px-3 py-1.5 text-[10px] font-medium text-[var(--text-soft)] hover:bg-[var(--bg-card-2)] transition"
            >
              <FileDown className="h-3.5 w-3.5" />
              Windows / Mac
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=com.carriez.flutter_hbb"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-[var(--border-soft)] px-3 py-1.5 text-[10px] font-medium text-[var(--text-soft)] hover:bg-[var(--bg-card-2)] transition"
            >
              <FileDown className="h-3.5 w-3.5" />
              Android (Play Store)
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
