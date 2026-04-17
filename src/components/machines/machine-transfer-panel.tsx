'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { FolderPlus, Upload, CheckCircle2, Clock, AlertCircle, Folder } from 'lucide-react'

type Transfer = {
  id: number
  file_name: string
  status: string
  created_at: string
  synced_at: string | null
  subfolder?: string | null
}

type Props = {
  machineId: number
  guidanceSystem: string | null
}

const ACCEPTED =
  '.xml,.dxf,.dwg,.csv,.cfg,.ini,.txt,.pdf,.zip,.rar,.gc3,.tp3,.svd,.dsz,.cal,.man,.dc,.prj,.ttm,.vcl,.yml,.yaml'

export default function MachineTransferPanel({ machineId, guidanceSystem }: Props) {
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [werven, setWerven] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedWerf, setSelectedWerf] = useState('')
  const [newWerfName, setNewWerfName] = useState('')
  const [creatingWerf, setCreatingWerf] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const isUnicontrol = (guidanceSystem || '').toUpperCase() === 'UNICONTROL'

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/machines/${machineId}/transfer`)
      if (res.ok) {
        const data = await res.json()
        setTransfers(data.transfers || [])
        setWerven(data.werven || [])
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [machineId])

  useEffect(() => {
    load()
  }, [load])

  async function handleCreateWerf() {
    if (!newWerfName.trim()) return
    setCreatingWerf(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/machines/${machineId}/werf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newWerfName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMsg({ ok: false, text: data.error || 'Werf aanmaken mislukt.' })
      } else {
        setWerven((prev) => (prev.includes(data.werf) ? prev : [...prev, data.werf]))
        setSelectedWerf(data.werf)
        setNewWerfName('')
        setMsg({ ok: true, text: `Werf "${data.werf}" aangemaakt en klaar om te syncen.` })
        load()
      }
    } catch (err) {
      setMsg({
        ok: false,
        text: err instanceof Error ? err.message : 'Onbekende fout.',
      })
    } finally {
      setCreatingWerf(false)
    }
  }

  async function handleUpload(files: FileList | null) {
    if (!files || !files.length) return
    setUploading(true)
    setMsg(null)
    const fd = new FormData()
    for (const f of Array.from(files)) fd.append('files', f)
    if (selectedWerf) fd.append('subfolder', selectedWerf)
    try {
      const res = await fetch(`/api/machines/${machineId}/transfer`, {
        method: 'POST',
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) {
        setMsg({ ok: false, text: data.error || 'Upload mislukt.' })
      } else {
        setMsg({
          ok: true,
          text: `${data.uploaded || 0} bestand(en) verstuurd${selectedWerf ? ` naar werf "${selectedWerf}"` : ''}.`,
        })
        load()
      }
    } catch (err) {
      setMsg({
        ok: false,
        text: err instanceof Error ? err.message : 'Upload mislukt.',
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <section className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-4 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-[var(--text-main)]">
          Werf &amp; bestanden versturen
        </h2>
        <p className="mt-0.5 text-[11px] text-[var(--text-soft)]">
          {isUnicontrol ? (
            <>
              Maak een nieuwe werf aan (genereert automatisch{' '}
              <code className="rounded bg-black/30 px-1 font-mono">Project.yml</code>{' '}
              voor Unicontrol) en stuur CAD / guidance-bestanden naar de machine.
              De tablet synct elke 30s.
            </>
          ) : (
            <>
              Stuur bestanden naar de machine. De tablet downloadt ze
              automatisch elke 30s.
              {guidanceSystem ? (
                <>
                  {' '}
                  (Werf aanmaken is voorlopig enkel beschikbaar voor
                  UNICONTROL.)
                </>
              ) : null}
            </>
          )}
        </p>
      </div>

      {/* Werf management (Unicontrol only) */}
      {isUnicontrol && (
        <div className="space-y-2 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-3">
          <p className="text-[11px] font-semibold text-[var(--text-soft)]">
            Werven op deze machine
          </p>
          {werven.length === 0 ? (
            <p className="text-[11px] text-[var(--text-muted)]">
              Nog geen werven aangemaakt.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {werven.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setSelectedWerf(selectedWerf === w ? '' : w)}
                  className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition ${
                    selectedWerf === w
                      ? 'border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]'
                      : 'border-[var(--border-soft)] bg-[var(--bg-card)] text-[var(--text-main)] hover:border-[var(--accent)]/50'
                  }`}
                >
                  <Folder className="h-3 w-3" />
                  {w}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <input
              type="text"
              value={newWerfName}
              onChange={(e) => setNewWerfName(e.target.value)}
              placeholder="Nieuwe werfnaam..."
              className="flex-1 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2 text-xs"
            />
            <button
              type="button"
              onClick={handleCreateWerf}
              disabled={creatingWerf || !newWerfName.trim()}
              className="inline-flex items-center gap-1 rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-50"
            >
              <FolderPlus className="h-3 w-3" />
              {creatingWerf ? 'Aanmaken...' : 'Aanmaken'}
            </button>
          </div>
        </div>
      )}

      {/* File upload */}
      <div className="space-y-2 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-3">
        <p className="text-[11px] font-semibold text-[var(--text-soft)]">
          Bestanden versturen
          {selectedWerf ? (
            <span className="ml-1 text-[var(--accent)]">
              → naar werf &quot;{selectedWerf}&quot;
            </span>
          ) : (
            <span className="ml-1 text-[var(--text-muted)]">
              → hoofdprojectmap
            </span>
          )}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED}
          onChange={(e) => handleUpload(e.target.files)}
          disabled={uploading}
          className="block w-full text-xs text-[var(--text-soft)] file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--accent)] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:brightness-110 disabled:opacity-50"
        />
        <p className="text-[10px] text-[var(--text-muted)]">
          Ondersteund: xml, dxf, dwg, csv, cfg, ttm, gc3, tp3, svd, zip, pdf...
        </p>
      </div>

      {msg && (
        <p
          className={`rounded-lg border p-2 text-xs ${
            msg.ok
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : 'border-red-500/30 bg-red-500/10 text-red-400'
          }`}
        >
          {msg.text}
        </p>
      )}

      {/* Recent transfers */}
      <div>
        <p className="text-[11px] font-semibold text-[var(--text-soft)]">
          Recente transfers
        </p>
        <div className="mt-1 max-h-52 overflow-y-auto rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)]">
          {loading ? (
            <p className="p-3 text-[11px] text-[var(--text-muted)]">Laden...</p>
          ) : transfers.length === 0 ? (
            <p className="p-3 text-[11px] text-[var(--text-muted)]">
              Nog geen transfers.
            </p>
          ) : (
            <table className="w-full text-[11px]">
              <tbody>
                {transfers.slice(0, 20).map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-[var(--border-soft)] last:border-0"
                  >
                    <td className="px-2 py-1.5">
                      <div className="truncate font-medium text-[var(--text-main)]">
                        {t.file_name}
                      </div>
                      {t.subfolder && (
                        <div className="truncate text-[10px] text-[var(--text-muted)]">
                          {t.subfolder}
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      {t.status === 'synced' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" /> Gesynct
                        </span>
                      ) : t.status === 'failed' ? (
                        <span className="inline-flex items-center gap-1 text-red-400">
                          <AlertCircle className="h-3 w-3" /> Mislukt
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-yellow-400">
                          <Clock className="h-3 w-3" /> In wacht
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={load}
        disabled={loading}
        className="w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-1.5 text-[11px] font-semibold text-[var(--text-main)] hover:bg-[var(--bg-card)] disabled:opacity-50"
      >
        <Upload className="mr-1 inline h-3 w-3" />
        Vernieuwen
      </button>
    </section>
  )
}
