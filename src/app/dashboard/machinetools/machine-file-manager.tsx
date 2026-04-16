'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Folder,
  FolderOpen,
  File,
  Upload,
  HardDrive,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  FolderPlus,
  Download,
  Trash2,
  AlertCircle,
  Loader2,
  WifiOff,
} from 'lucide-react'

type FileItem = {
  name: string
  path: string
  is_dir: boolean
  size: number | null
  modified: string
  extension: string | null
  children?: FileItem[]
}

type Props = {
  machineId?: number
  machineName?: string
}

function formatSize(bytes: number | null): string {
  if (bytes === null || bytes === undefined) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileIcon({ item, open }: { item: FileItem; open?: boolean }) {
  if (item.is_dir) {
    return open ? (
      <FolderOpen className="h-4 w-4 text-emerald-400 shrink-0" />
    ) : (
      <Folder className="h-4 w-4 text-emerald-400/70 shrink-0" />
    )
  }
  const ext = item.extension
  const color =
    ext === '.xml' ? 'text-blue-400' :
    ext === '.dxf' || ext === '.dwg' ? 'text-orange-400' :
    ext === '.csv' ? 'text-green-400' :
    ext === '.cfg' || ext === '.ini' ? 'text-yellow-400' :
    ext === '.pdf' ? 'text-red-400' :
    'text-[var(--text-muted)]'
  return <File className={`h-4 w-4 ${color} shrink-0`} />
}

function TreeNode({
  item,
  depth = 0,
  selectedPath,
  onSelect,
  expandedPaths,
  onToggleExpand,
}: {
  item: FileItem
  depth?: number
  selectedPath: string | null
  onSelect: (item: FileItem) => void
  expandedPaths: Set<string>
  onToggleExpand: (path: string) => void
}) {
  const isExpanded = expandedPaths.has(item.path)
  const isSelected = selectedPath === item.path

  return (
    <div>
      <button
        className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-xs transition hover:bg-[var(--bg-card-2)] ${
          isSelected ? 'bg-emerald-500/10 text-emerald-300' : 'text-[var(--text-soft)]'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => {
          onSelect(item)
          if (item.is_dir) onToggleExpand(item.path)
        }}
      >
        {item.is_dir ? (
          isExpanded ? (
            <ChevronDown className="h-3 w-3 shrink-0 text-[var(--text-muted)]" />
          ) : (
            <ChevronRight className="h-3 w-3 shrink-0 text-[var(--text-muted)]" />
          )
        ) : (
          <span className="w-3" />
        )}
        <FileIcon item={item} open={isExpanded} />
        <span className="truncate">{item.name}</span>
        {!item.is_dir && item.size !== null && (
          <span className="ml-auto shrink-0 text-[10px] text-[var(--text-muted)]">
            {formatSize(item.size)}
          </span>
        )}
      </button>
      {item.is_dir && isExpanded && item.children?.map((child) => (
        <TreeNode
          key={child.path}
          item={child}
          depth={depth + 1}
          selectedPath={selectedPath}
          onSelect={onSelect}
          expandedPaths={expandedPaths}
          onToggleExpand={onToggleExpand}
        />
      ))}
    </div>
  )
}

export default function MachineFileManager({ machineId, machineName }: Props) {
  const [tree, setTree] = useState<FileItem[]>([])
  const [selectedItem, setSelectedItem] = useState<FileItem | null>(null)
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [error, setError] = useState('')
  const [agentOnline, setAgentOnline] = useState<boolean | null>(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [showNewFolder, setShowNewFolder] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const apiBase = machineId ? `/api/machines/${machineId}/files` : null

  // Check agent health
  const checkHealth = useCallback(async () => {
    if (!apiBase) return
    try {
      const res = await fetch(`${apiBase}?action=health`)
      setAgentOnline(res.ok)
    } catch {
      setAgentOnline(false)
    }
  }, [apiBase])

  // Load file tree
  const loadTree = useCallback(async () => {
    if (!apiBase) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${apiBase}?action=tree&depth=3`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Laden mislukt' }))
        setError(data.error || 'Laden mislukt')
        return
      }
      const data = await res.json()
      setTree(data.tree || [])
      setAgentOnline(true)
    } catch {
      setError('Machine agent niet bereikbaar')
      setAgentOnline(false)
    } finally {
      setLoading(false)
    }
  }, [apiBase])

  // Load tree when machine changes
  useEffect(() => {
    if (machineId) {
      setTree([])
      setSelectedItem(null)
      setExpandedPaths(new Set())
      setError('')
      checkHealth()
      loadTree()
    } else {
      setAgentOnline(null)
      setTree([])
    }
  }, [machineId, checkHealth, loadTree])

  const handleSelect = useCallback((item: FileItem) => {
    setSelectedItem(item)
  }, [])

  const handleToggleExpand = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }, [])

  // Upload files
  const handleUpload = useCallback(() => {
    if (!selectedItem?.is_dir) return
    fileInputRef.current?.click()
  }, [selectedItem])

  const handleFileSelected = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length || !apiBase || !selectedItem) return

    setUploading(true)
    setUploadProgress(`0 / ${files.length} bestanden...`)
    setError('')

    let uploaded = 0
    for (const file of Array.from(files)) {
      try {
        const formData = new FormData()
        formData.append('files', file)
        formData.append('path', selectedItem.path)

        const res = await fetch(apiBase, {
          method: 'POST',
          body: formData,
        })

        if (res.ok) {
          uploaded++
          setUploadProgress(`${uploaded} / ${files.length} bestanden...`)
        } else {
          const data = await res.json().catch(() => ({ error: 'Upload mislukt' }))
          setError(data.error || `Upload mislukt: ${file.name}`)
        }
      } catch {
        setError(`Fout bij uploaden: ${file.name}`)
      }
    }

    setUploading(false)
    setUploadProgress('')
    e.target.value = ''

    // Reload tree to show new files
    if (uploaded > 0) loadTree()
  }, [apiBase, selectedItem, loadTree])

  // Create new folder
  const handleCreateFolder = useCallback(async () => {
    if (!apiBase || !newFolderName.trim()) return
    const parentPath = selectedItem?.is_dir ? selectedItem.path : ''
    const fullPath = parentPath ? `${parentPath}/${newFolderName.trim()}` : newFolderName.trim()

    try {
      const res = await fetch(apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: fullPath }),
      })
      if (res.ok) {
        setNewFolderName('')
        setShowNewFolder(false)
        loadTree()
      } else {
        const data = await res.json().catch(() => ({ error: 'Aanmaken mislukt' }))
        setError(data.error || 'Map aanmaken mislukt')
      }
    } catch {
      setError('Map aanmaken mislukt')
    }
  }, [apiBase, newFolderName, selectedItem, loadTree])

  // Download file
  const handleDownload = useCallback(async () => {
    if (!apiBase || !selectedItem || selectedItem.is_dir) return
    try {
      const res = await fetch(`${apiBase}?action=download&path=${encodeURIComponent(selectedItem.path)}`)
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = selectedItem.name
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('Download mislukt')
    }
  }, [apiBase, selectedItem])

  // Delete file
  const handleDelete = useCallback(async () => {
    if (!apiBase || !selectedItem || selectedItem.is_dir) return
    if (!confirm(`Bestand "${selectedItem.name}" verwijderen van de machine?`)) return

    try {
      const res = await fetch(apiBase, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: selectedItem.path }),
      })
      if (res.ok) {
        setSelectedItem(null)
        loadTree()
      } else {
        const data = await res.json().catch(() => ({ error: 'Verwijderen mislukt' }))
        setError(data.error)
      }
    } catch {
      setError('Verwijderen mislukt')
    }
  }, [apiBase, selectedItem, loadTree])

  const selectedIsFolder = selectedItem?.is_dir === true

  // No machine selected
  if (!machineId) {
    return (
      <section className="flex h-full flex-col overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
        <div className="flex items-center gap-2 border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-2">
          <HardDrive className="h-4 w-4 text-[var(--text-muted)]" />
          <span className="text-xs font-semibold text-[var(--text-main)]">Machineschijf</span>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-xs text-[var(--text-muted)] text-center">
            Selecteer een machine om de bestanden te bekijken
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="relative flex h-full flex-col overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-2">
        <div className="flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-semibold text-[var(--text-main)]">Machineschijf</span>
          {agentOnline === true && (
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" title="Agent online" />
          )}
          {agentOnline === false && (
            <span title="Agent offline"><WifiOff className="h-3 w-3 text-red-400" /></span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => loadTree()}
            disabled={loading}
            className="rounded-lg p-1.5 text-[var(--text-soft)] hover:bg-[var(--bg-card-2)] hover:text-[var(--text-main)] transition disabled:opacity-40"
            title="Vernieuwen"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowNewFolder(!showNewFolder)}
            disabled={!agentOnline}
            className="rounded-lg p-1.5 text-[var(--text-soft)] hover:bg-[var(--bg-card-2)] hover:text-[var(--text-main)] transition disabled:opacity-40"
            title="Nieuwe map"
          >
            <FolderPlus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading || !selectedIsFolder || !agentOnline}
            className="flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2.5 py-1.5 text-[10px] font-medium text-emerald-400 hover:bg-emerald-500/25 transition disabled:opacity-40 disabled:cursor-not-allowed"
            title={selectedIsFolder ? 'Bestanden uploaden naar geselecteerde map' : 'Selecteer eerst een map'}
          >
            <Upload className="h-3 w-3" />
            Upload
          </button>
        </div>
      </div>

      {/* New folder input */}
      {showNewFolder && (
        <div className="border-b border-[var(--border-soft)] bg-[var(--bg-card-2)]/50 px-3 py-2 flex gap-2">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            placeholder="Nieuwe mapnaam..."
            className="flex-1 rounded-md border border-[var(--border-soft)] bg-[var(--bg-main)] px-2 py-1 text-xs text-[var(--text-main)] placeholder:text-[var(--text-muted)]"
            autoFocus
          />
          <button
            onClick={handleCreateFolder}
            disabled={!newFolderName.trim()}
            className="rounded-md bg-emerald-500/15 px-2 py-1 text-[10px] font-medium text-emerald-400 hover:bg-emerald-500/25 disabled:opacity-40"
          >
            Aanmaken
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 border-b border-red-500/20 bg-red-500/10 px-3 py-2">
          <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
          <p className="text-[10px] text-red-400 truncate">{error}</p>
          <button onClick={() => setError('')} className="ml-auto text-[10px] text-red-400/60 hover:text-red-400">✕</button>
        </div>
      )}

      {/* Tree view */}
      <div className="flex-1 overflow-y-auto px-2 py-2 min-h-[300px]">
        {loading && tree.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
          </div>
        ) : agentOnline === false ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <WifiOff className="h-8 w-8 text-[var(--text-muted)] opacity-30" />
            <div>
              <p className="text-xs text-[var(--text-soft)]">Machine agent niet bereikbaar</p>
              <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                Zorg dat machine-agent.py draait op de machine
              </p>
            </div>
            <button
              onClick={() => { checkHealth(); loadTree(); }}
              className="rounded-md bg-emerald-500/15 px-3 py-1 text-[10px] font-medium text-emerald-400 hover:bg-emerald-500/25"
            >
              Opnieuw proberen
            </button>
          </div>
        ) : tree.length === 0 && !loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-xs text-[var(--text-muted)]">Geen bestanden gevonden</p>
          </div>
        ) : (
          tree.map((item) => (
            <TreeNode
              key={item.path}
              item={item}
              depth={0}
              selectedPath={selectedItem?.path ?? null}
              onSelect={handleSelect}
              expandedPaths={expandedPaths}
              onToggleExpand={handleToggleExpand}
            />
          ))
        )}
      </div>

      {/* Status bar */}
      <div className="border-t border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-2">
        {selectedItem ? (
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-[10px] text-[var(--text-muted)]">{selectedItem.path}</span>
            <div className="flex items-center gap-1 shrink-0">
              {!selectedItem.is_dir && (
                <>
                  <button
                    onClick={handleDownload}
                    className="rounded p-1 text-[var(--text-muted)] hover:text-emerald-400 transition"
                    title="Downloaden"
                  >
                    <Download className="h-3 w-3" />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="rounded p-1 text-[var(--text-muted)] hover:text-red-400 transition"
                    title="Verwijderen"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </>
              )}
              <span className="text-[10px] text-[var(--text-muted)]">
                {selectedItem.is_dir
                  ? `${selectedItem.children?.length || 0} items`
                  : formatSize(selectedItem.size)}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-[10px] text-[var(--text-muted)]">
            {machineName ? `📂 ${machineName}` : 'Selecteer een map of bestand'}
          </p>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".xml,.dxf,.dwg,.csv,.cfg,.ini,.txt,.pdf,.zip,.rar"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* Upload overlay */}
      {uploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl z-10">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
            <p className="text-xs text-emerald-300">
              {uploadProgress || 'Verzenden naar machine...'}
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
