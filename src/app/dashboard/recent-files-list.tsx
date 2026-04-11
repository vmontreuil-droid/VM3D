'use client'

import { useState } from 'react'
import Link from 'next/link'

type FileItem = {
  id: number | string
  file_name: string
  file_type?: string | null
  created_at?: string | null
  project_id?: number | string | null
  projects?: {
    title?: string | null
    status?: string | null
  } | null
}

type Props = {
  files: FileItem[]
}

function getFileTypeLabel(fileType?: string | null) {
  if (fileType === 'client_upload') return 'Upload'
  if (fileType === 'final_file') return 'Oplevering'
  return 'Bestand'
}

function getStatusLabel(status?: string | null) {
  switch (status) {
    case 'ingediend':
      return 'Ingediend'
    case 'in_behandeling':
      return 'In behandeling'
    case 'klaar_voor_betaling':
      return 'Klaar voor betaling'
    case 'afgerond':
      return 'Afgerond'
    default:
      return 'Onbekend'
  }
}

function getStatusClass(status?: string | null) {
  switch (status) {
    case 'ingediend':
      return 'bg-blue-500/15 text-blue-300'
    case 'in_behandeling':
      return 'bg-yellow-500/15 text-yellow-300'
    case 'klaar_voor_betaling':
      return 'bg-orange-500/15 text-orange-300'
    case 'afgerond':
      return 'bg-green-500/15 text-green-300'
    default:
      return 'bg-gray-500/15 text-gray-300'
  }
}

export default function RecentFilesList({ files }: Props) {
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest')

  let sortedFiles = [...files]
  if (sortBy === 'newest') {
    sortedFiles.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime()
      const dateB = new Date(b.created_at || 0).getTime()
      return dateB - dateA
    })
  } else {
    sortedFiles.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime()
      const dateB = new Date(b.created_at || 0).getTime()
      return dateA - dateB
    })
  }

  return (
    <section className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
      <div className="border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
              Recente activiteit
            </p>
            <h2 className="mt-2 text-lg font-semibold text-[var(--text-main)]">
              Recente bestanden
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] text-[var(--text-muted)]">ITEMS</p>
              <p className="text-lg font-semibold text-[var(--text-main)]">
                {sortedFiles.length}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy('newest')}
                className={sortBy === 'newest' ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
              >
                Nieuwst
              </button>
              <button
                onClick={() => setSortBy('oldest')}
                className={sortBy === 'oldest' ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
              >
                Oudst
              </button>
            </div>
          </div>
        </div>
      </div>

      {sortedFiles.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-[var(--text-soft)]">
          Geen recente bestanden
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[900px] lg:min-w-full">
            <div className="grid border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-5 py-3 gap-4 grid-cols-[2fr_1fr_1fr_1fr_80px] text-[10px] font-semibold uppercase text-[var(--text-muted)]">
              <div>Bestand</div>
              <div>Type</div>
              <div>Status</div>
              <div>Datum</div>
              <div className="text-center">Actie</div>
            </div>

            {sortedFiles.map((file) => (
              <div
                key={file.id}
                className="grid px-5 py-3 gap-4 grid-cols-[2fr_1fr_1fr_1fr_80px] items-center border-b border-[var(--border-soft)] transition hover:bg-[var(--bg-card-2)]"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--text-main)]">
                    {file.file_name}
                  </p>
                  <p className="truncate text-xs text-[var(--text-soft)]">
                    {file.projects?.title || 'Onbekend'}
                  </p>
                </div>

                <span className="text-xs font-medium text-[var(--text-soft)]">
                  {getFileTypeLabel(file.file_type)}
                </span>

                <span
                  className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold w-fit ${getStatusClass(
                    file.projects?.status
                  )}`}
                >
                  {getStatusLabel(file.projects?.status)}
                </span>

                <span className="text-xs text-[var(--text-soft)]">
                  {file.created_at
                    ? new Date(file.created_at).toLocaleDateString('nl-BE')
                    : '—'}
                </span>

                {file.project_id ? (
                  <Link
                    href={`/dashboard/projects/${file.project_id}`}
                    className="btn-secondary btn-sm justify-self-center"
                  >
                    Open
                  </Link>
                ) : (
                  <span className="text-center text-xs text-[var(--text-muted)]">—</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}