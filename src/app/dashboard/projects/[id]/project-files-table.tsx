'use client'

import { useEffect, useMemo, useState } from 'react'
import RecentFileDownloadButton from '../../recent-file-download-button'
import RecentFileViewButton from '../../recent-file-view-button'
import RecentFileDeleteButton from '../../recent-file-delete-button'

type FileItem = {
  id: number
  file_name: string
  file_path: string
  file_type: string | null
  created_at: string | null
  file_size?: number | null
}

type SortKey = 'file_name' | 'file_type' | 'created_at' | 'file_size'
type SortDirection = 'asc' | 'desc'

function getExtension(fileName: string) {
  const parts = fileName.split('.')
  if (parts.length < 2) return 'FILE'
  return parts.pop()?.toUpperCase() || 'FILE'
}

function getFileIcon(extension: string) {
  const ext = extension.toLowerCase()

  if (['pdf'].includes(ext)) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/15 text-red-400">
        <span className="text-[10px] font-bold">PDF</span>
      </div>
    )
  }

  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/15 text-purple-400">
        🖼️
      </div>
    )
  }

  if (['dwg', 'dxf'].includes(ext)) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400">
        📐
      </div>
    )
  }

  if (['xls', 'xlsx', 'csv'].includes(ext)) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-500/15 text-green-400">
        📊
      </div>
    )
  }

  if (['doc', 'docx', 'txt', 'rtf'].includes(ext)) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
        📄
      </div>
    )
  }

  if (['zip', 'rar', '7z'].includes(ext)) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
        📦
      </div>
    )
  }

  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-500/15 text-slate-300">
      📁
    </div>
  )
}

function formatFileSize(size?: number | null) {
  if (!size) return 'Onbekend'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export default function ProjectFilesTable({
  title,
  subtitle,
  files,
  allowDelete = false,
  paid = true,
  lockMessage = 'Download beschikbaar na betaling',
}: {
  title: string
  subtitle: string
  files: FileItem[]
  allowDelete?: boolean
  paid?: boolean
  lockMessage?: string
}) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [rowsPerPage, setRowsPerPage] = useState(5)
  const [currentPage, setCurrentPage] = useState(1)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortKey(key)
    setSortDirection(key === 'created_at' ? 'desc' : 'asc')
  }

  const filteredAndSortedFiles = useMemo(() => {
    const filtered = files.filter((file) => {
      const term = search.trim().toLowerCase()
      if (!term) return true

      const extension = getExtension(file.file_name).toLowerCase()

      return (
        (file.file_name || '').toLowerCase().includes(term) ||
        extension.includes(term)
      )
    })

    return [...filtered].sort((a, b) => {
      let comparison = 0

      if (sortKey === 'file_name') {
        comparison = (a.file_name || '').localeCompare(b.file_name || '', 'nl', {
          sensitivity: 'base',
        })
      }

      if (sortKey === 'file_type') {
        comparison = getExtension(a.file_name).localeCompare(
          getExtension(b.file_name),
          'nl',
          { sensitivity: 'base' }
        )
      }

      if (sortKey === 'created_at') {
        const aDate = a.created_at ? new Date(a.created_at).getTime() : 0
        const bDate = b.created_at ? new Date(b.created_at).getTime() : 0
        comparison = aDate - bDate
      }

      if (sortKey === 'file_size') {
        const aSize = a.file_size ?? -1
        const bSize = b.file_size ?? -1
        comparison = aSize - bSize
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [files, search, sortKey, sortDirection])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, sortKey, sortDirection, rowsPerPage])

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAndSortedFiles.length / rowsPerPage)
  )

  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * rowsPerPage
  const paginatedFiles = filteredAndSortedFiles.slice(
    startIndex,
    startIndex + rowsPerPage
  )

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return '↕'
    return sortDirection === 'asc' ? '↑' : '↓'
  }

  const headerButtonClass =
    'flex items-center gap-2 text-left text-sm font-semibold text-[var(--text-soft)] transition hover:text-[var(--text-main)]'

  const renderPageNumbers = () => {
    const pages: number[] = []
    let start = Math.max(1, safeCurrentPage - 2)
    let end = Math.min(totalPages, start + 4)

    if (end - start < 4) {
      start = Math.max(1, end - 4)
    }

    for (let i = start; i <= end; i++) pages.push(i)
    return pages
  }

  return (
    <section className="mt-6">
      <div className="mb-4 rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--text-main)]">
              {title}
            </h2>
            <p className="mt-2 text-sm text-[var(--text-soft)]">{subtitle}</p>
          </div>

          <div className="flex w-full max-w-md items-center gap-3">
            <input
              type="text"
              placeholder="Zoek op bestandsnaam of type"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-dark w-full px-4 py-3 text-sm"
            />

            <select
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
              className="input-dark px-4 py-3 text-sm"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
        <div className="hidden grid-cols-[2fr_1.1fr_1fr_1fr_320px] gap-4 border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-5 py-4 md:grid">
          <button
            type="button"
            onClick={() => handleSort('file_name')}
            className={headerButtonClass}
          >
            <span>Bestand</span>
            <span>{sortIndicator('file_name')}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSort('file_type')}
            className={headerButtonClass}
          >
            <span>Type</span>
            <span>{sortIndicator('file_type')}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSort('file_size')}
            className={headerButtonClass}
          >
            <span>Grootte</span>
            <span>{sortIndicator('file_size')}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSort('created_at')}
            className={headerButtonClass}
          >
            <span>Datum</span>
            <span>{sortIndicator('created_at')}</span>
          </button>

          <div className="text-sm font-semibold text-[var(--text-soft)]">
            Acties
          </div>
        </div>

        {paginatedFiles.length === 0 ? (
          <div className="px-5 py-6 text-sm text-[var(--text-soft)]">
            Geen bestanden gevonden.
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-soft)]">
            {paginatedFiles.map((file) => {
              const extension = getExtension(file.file_name)

              return (
                <div
                  key={file.id}
                  className="grid gap-4 px-5 py-5 md:grid-cols-[2fr_1.1fr_1fr_1fr_320px] md:items-center"
                >
                  <div>
                    <p className="font-medium text-[var(--text-main)]">
                      {file.file_name}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {getFileIcon(extension)}
                    <span className="text-sm font-medium text-[var(--text-main)]">
                      {extension}
                    </span>
                  </div>

                  <div className="text-sm text-[var(--text-soft)]">
                    {formatFileSize(file.file_size)}
                  </div>

                  <div className="text-sm text-[var(--text-soft)]">
                    {file.created_at
                      ? new Date(file.created_at).toLocaleDateString('nl-BE')
                      : 'Onbekend'}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {paid ? (
                      <>
                        <RecentFileViewButton filePath={file.file_path} />
                        <RecentFileDownloadButton
                          filePath={file.file_path}
                          fileName={file.file_name}
                        />
                      </>
                    ) : (
                      <div className="inline-flex rounded-xl border border-amber-900 bg-[var(--warning-bg)] px-4 py-2 text-sm font-medium text-[var(--warning-text)]">
                        {lockMessage}
                      </div>
                    )}

                    {allowDelete && (
                      <RecentFileDeleteButton
                        fileId={file.id}
                        filePath={file.file_path}
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="flex flex-col gap-4 border-t border-[var(--border-soft)] bg-[var(--bg-card-2)] px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-[var(--text-soft)]">
            Pagina {safeCurrentPage} van {totalPages}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={safeCurrentPage === 1}
              className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-2 text-sm font-medium text-[var(--text-main)] transition hover:bg-[#2a3745] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Vorige
            </button>

            {renderPageNumbers().map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  page === safeCurrentPage
                    ? 'bg-[var(--accent)] text-white'
                    : 'border border-[var(--border-soft)] bg-[var(--bg-card)] text-[var(--text-main)] hover:bg-[#2a3745]'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={safeCurrentPage === totalPages}
              className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-2 text-sm font-medium text-[var(--text-main)] transition hover:bg-[#2a3745] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Volgende
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}