'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { FolderPlus, Upload, CheckCircle2, Clock, AlertCircle, Folder, Tablet, RefreshCw, FileIcon, ChevronRight, ChevronDown, Download, FileArchive } from 'lucide-react'

type Transfer = {
  id: number
  file_name: string
  status: string
  created_at: string
  synced_at: string | null
  subfolder?: string | null
}

type TabletListing = {
  root?: string
  // New flat format (preferred)
  files?: { path: string; size: number }[]
  // Legacy grouped format (kept for backward compat)
  werven?: { name: string; files: { name: string; size: number }[] }[]
}

type TreeNode = {
  name: string
  size?: number
  isFile: boolean
  children?: Record<string, TreeNode>
  fileCount?: number
}

function buildTree(files: { path: string; size: number }[]): TreeNode {
  const root: TreeNode = { name: '', isFile: false, children: {}, fileCount: 0 }
  for (const f of files) {
    const parts = f.path.split('/').filter(Boolean)
    let cur = root
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const last = i === parts.length - 1
      cur.children = cur.children || {}
      if (!cur.children[part]) {
        cur.children[part] = last
          ? { name: part, isFile: true, size: f.size }
          : { name: part, isFile: false, children: {}, fileCount: 0 }
      }
      if (!last) {
        cur = cur.children[part]
        cur.fileCount = (cur.fileCount || 0) + 1
      }
    }
  }
  return root
}

type Props = {
  machineId: number
  guidanceSystem: string | null
}

const ACCEPTED =
  '.xml,.dxf,.dwg,.csv,.cfg,.ini,.txt,.pdf,.zip,.rar,.gc3,.tp3,.svd,.dsz,.cal,.man,.dc,.prj,.ttm,.vcl,.yml,.yaml'

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

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
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const [importing, setImporting] = useState(false)

  const [tabletListing, setTabletListing] = useState<TabletListing | null>(null)
  const [tabletListingAt, setTabletListingAt] = useState<string | null>(null)
  const [loadingTablet, setLoadingTablet] = useState(false)

  const isUnicontrol = (guidanceSystem || '').toUpperCase() === 'UNICONTROL'

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/machines/${machineId}/transfer`)
      if (res.ok) {
        const data = await res.json()
        setTransfers(data.transfers || [])
        const wList: string[] = data.werven || []
        setWerven(wList)
        // Auto-select latest werf if none selected yet
        setSelectedWerf((cur) => {
          if (cur && wList.includes(cur)) return cur
          if (wList.length > 0) return wList[0]
          return ''
        })
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

  const loadTabletListing = useCallback(async () => {
    setLoadingTablet(true)
    try {
      const res = await fetch(`/api/machines/${machineId}/listing`)
      if (res.ok) {
        const data = await res.json()
        setTabletListing(data.listing || null)
        setTabletListingAt(data.listing_at || null)
      }
    } catch {
      /* ignore */
    } finally {
      setLoadingTablet(false)
    }
  }, [machineId])

  useEffect(() => {
    loadTabletListing()
  }, [loadTabletListing])

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

  async function handleImportZip(files: FileList | null) {
    const zipFile = files && files[0]
    if (!zipFile) return
    setImporting(true)
    setMsg(null)
    const fd = new FormData()
    fd.append('file', zipFile)
    try {
      const res = await fetch(`/api/machines/${machineId}/werf/import`, {
        method: 'POST',
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) {
        setMsg({ ok: false, text: data.error || 'Import mislukt.' })
      } else {
        setMsg({
          ok: true,
          text: `Werf "${data.werf}" geïmporteerd (${data.uploaded} bestand(en)).`,
        })
        setSelectedWerf(data.werf)
        load()
      }
    } catch (err) {
      setMsg({
        ok: false,
        text: err instanceof Error ? err.message : 'Import mislukt.',
      })
    } finally {
      setImporting(false)
      if (importInputRef.current) importInputRef.current.value = ''
    }
  }

  function handleExportWerf(werf: string) {
    window.open(
      `/api/machines/${machineId}/werf/${encodeURIComponent(werf)}/export`,
      '_blank',
    )
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
                <div
                  key={w}
                  className={`group inline-flex items-center gap-0.5 rounded-lg border text-[11px] font-medium transition ${
                    selectedWerf === w
                      ? 'border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]'
                      : 'border-[var(--border-soft)] bg-[var(--bg-card)] text-[var(--text-main)] hover:border-[var(--accent)]/50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedWerf(selectedWerf === w ? '' : w)}
                    className="inline-flex items-center gap-1 pl-2 py-1"
                  >
                    <Folder className="h-3 w-3" />
                    {w}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportWerf(w)}
                    title="Exporteer werf als .zip"
                    className="px-1.5 py-1 text-[var(--text-muted)] opacity-60 hover:text-[var(--accent)] hover:opacity-100"
                  >
                    <Download className="h-3 w-3" />
                  </button>
                </div>
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

          <div className="flex items-center gap-2 pt-1">
            <input
              ref={importInputRef}
              type="file"
              accept=".zip"
              onChange={(e) => handleImportZip(e.target.files)}
              disabled={importing}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => importInputRef.current?.click()}
              disabled={importing}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2 text-xs font-semibold text-[var(--text-main)] hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50"
            >
              <FileArchive className="h-3 w-3" />
              {importing ? 'Importeren...' : 'Werf importeren (.zip)'}
            </button>
            <span className="text-[10px] text-[var(--text-muted)]">
              Bestanden uit het zip-bestand worden in een nieuwe werf geplaatst.
            </span>
          </div>
        </div>
      )}

      {/* File upload */}
      <div className="space-y-2 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-3">
        <p className="text-[11px] font-semibold text-[var(--text-soft)]">
          Bestanden versturen
        </p>

        <div
          className={`rounded-lg border px-3 py-2 text-[11px] ${
            selectedWerf
              ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400'
              : isUnicontrol
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                : 'border-[var(--border-soft)] text-[var(--text-soft)]'
          }`}
        >
          <span className="font-semibold">Doelmap op machine:</span>{' '}
          {selectedWerf ? (
            <code className="rounded bg-black/30 px-1 font-mono">
              {(isUnicontrol ? '/sdcard/Unicontrol/Projects/' : '.../') + selectedWerf + '/'}
            </code>
          ) : isUnicontrol ? (
            <>
              <span>
                ⚠ Geen werf geselecteerd — maak eerst een werf aan of kies er
                één hierboven. Bestanden zouden anders naast de
                Project.yml-mappen belanden.
              </span>
            </>
          ) : (
            <code className="rounded bg-black/30 px-1 font-mono">hoofdprojectmap</code>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED}
          onChange={(e) => handleUpload(e.target.files)}
          disabled={uploading || (isUnicontrol && !selectedWerf)}
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

      {/* Tablet listing — live contents of the crane tablet */}
      <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--text-soft)]">
            <Tablet className="h-3.5 w-3.5" /> Op de tablet in de kraan
          </p>
          <button
            type="button"
            onClick={loadTabletListing}
            disabled={loadingTablet}
            className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-2 py-1 text-[10px] font-semibold text-[var(--text-main)] hover:bg-[var(--bg-card-2)] disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${loadingTablet ? 'animate-spin' : ''}`} />
            Ververs
          </button>
        </div>
        {tabletListingAt && (
          <p className="text-[10px] text-[var(--text-muted)]">
            Laatst gerapporteerd:{' '}
            {new Date(tabletListingAt).toLocaleString()}
          </p>
        )}
        {tabletListing?.root && (
          <p className="text-[10px] text-[var(--text-muted)]">
            Map:{' '}
            <code className="rounded bg-black/30 px-1 font-mono">
              {tabletListing.root}
            </code>
          </p>
        )}
        {!tabletListing ? (
          <p className="text-[11px] text-[var(--text-muted)]">
            Nog geen melding ontvangen van de tablet. Dit vult zichzelf na de
            volgende sync (±30s).
          </p>
        ) : (() => {
            // Build tree from either flat files[] or legacy werven[]
            let flatFiles: { path: string; size: number }[] = []
            if (tabletListing.files && Array.isArray(tabletListing.files)) {
              flatFiles = tabletListing.files
            } else if (tabletListing.werven) {
              for (const w of tabletListing.werven) {
                for (const f of w.files || []) {
                  flatFiles.push({
                    path: w.name ? `${w.name}/${f.name}` : f.name,
                    size: f.size,
                  })
                }
              }
            }
            if (flatFiles.length === 0) {
              return (
                <p className="text-[11px] text-[var(--text-muted)]">
                  De tablet rapporteert geen bestanden in deze map.
                </p>
              )
            }
            const tree = buildTree(flatFiles)
            const totalSize = flatFiles.reduce((a, b) => a + b.size, 0)
            return (
              <>
                <p className="text-[10px] text-[var(--text-muted)]">
                  {flatFiles.length} bestand(en) — {formatBytes(totalSize)}
                </p>
                <div className="max-h-80 overflow-y-auto rounded border border-[var(--border-soft)] bg-[var(--bg-card)]">
                  <TreeView
                    node={tree}
                    depth={0}
                    selectedWerf={selectedWerf}
                  />
                </div>
              </>
            )
          })()}
      </div>

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

function TreeView({
  node,
  depth,
  selectedWerf,
}: {
  node: TreeNode
  depth: number
  selectedWerf: string
}) {
  const children = node.children ? Object.values(node.children) : []
  // Sort: folders first, then files, alphabetical
  children.sort((a, b) => {
    if (a.isFile !== b.isFile) return a.isFile ? 1 : -1
    return a.name.localeCompare(b.name)
  })
  return (
    <ul className="text-[11px]">
      {children.map((child) => (
        <TreeItem
          key={child.name}
          node={child}
          depth={depth}
          selectedWerf={selectedWerf}
        />
      ))}
    </ul>
  )
}

function TreeItem({
  node,
  depth,
  selectedWerf,
}: {
  node: TreeNode
  depth: number
  selectedWerf: string
}) {
  const [open, setOpen] = useState(
    depth === 0 && (!selectedWerf || node.name === selectedWerf),
  )
  const indent = { paddingLeft: `${depth * 12 + 6}px` }

  if (node.isFile) {
    return (
      <li
        className="flex items-center justify-between border-t border-[var(--border-soft)]/50 py-0.5 hover:bg-[var(--bg-card-2)]"
        style={indent}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <FileIcon className="h-3 w-3 shrink-0 text-[var(--text-muted)]" />
          <span className="truncate text-[var(--text-soft)]">{node.name}</span>
        </span>
        <span className="ml-2 shrink-0 pr-2 text-[10px] text-[var(--text-muted)]">
          {formatBytes(node.size || 0)}
        </span>
      </li>
    )
  }

  const childCount = node.children ? Object.keys(node.children).length : 0
  return (
    <li className="border-t border-[var(--border-soft)]/50 first:border-t-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-1.5 py-1 text-left hover:bg-[var(--bg-card-2)]"
        style={indent}
      >
        {open ? (
          <ChevronDown className="h-3 w-3 shrink-0 text-[var(--text-muted)]" />
        ) : (
          <ChevronRight className="h-3 w-3 shrink-0 text-[var(--text-muted)]" />
        )}
        <Folder className="h-3 w-3 shrink-0 text-[var(--accent)]" />
        <span className="truncate font-medium text-[var(--text-main)]">
          {node.name}
        </span>
        <span className="ml-auto mr-2 rounded bg-[var(--bg-card-2)] px-1.5 py-0.5 text-[9px] text-[var(--text-muted)]">
          {childCount}
        </span>
      </button>
      {open && node.children && (
        <TreeView
          node={node}
          depth={depth + 1}
          selectedWerf={selectedWerf}
        />
      )}
    </li>
  )
}
