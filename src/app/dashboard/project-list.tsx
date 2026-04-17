'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { FolderOpen, HardHat } from 'lucide-react'
import { useT } from '@/i18n/context'

type Project = {
  id: string | number
  name: string | null
  description?: string | null
  address?: string | null
  status?: string | null
  price?: number | null
  currency?: string | null
  created_at?: string | null
  profiles?: {
    full_name?: string | null
    company_name?: string | null
    email?: string | null
  } | null
}

type ProjectFile = {
  id: number | string
  project_id?: number | string | null
  file_type?: string | null
}

type Props = {
  projects: Project[]
  files?: ProjectFile[]
  title?: string
  description?: string
  showCustomerColumn?: boolean
  showAdminActions?: boolean
  hideResultsUntilSearch?: boolean
  embedded?: boolean
}

type SortKey =
  | 'name'
  | 'customer'
  | 'address'
  | 'status'
  | 'price'
  | 'created_at'

type SortDirection = 'asc' | 'desc'

function getStatusLabel(status: string | null | undefined, t?: any) {
  if (t) {
    const key = status as string
    return t.status?.[key] ?? t.status?.onbekend ?? status ?? 'Unknown'
  }
  switch (status) {
    case 'offerte_aangevraagd':
      return 'Offerte aangevraagd'
    case 'offerte_verstuurd':
      return 'Offerte verstuurd'
    case 'in_behandeling':
      return 'In behandeling'
    case 'facturatie':
      return 'Facturatie'
    case 'factuur_verstuurd':
      return 'Factuur verstuurd'
    case 'afgerond':
      return 'Afgerond'
    case 'ingediend':
      return 'Ingediend'
    case 'klaar_voor_betaling':
      return 'Klaar voor betaling'
    default:
      return 'Onbekend'
  }
}

function getStatusClass(status: string | null | undefined) {
  switch (status) {
    case 'offerte_aangevraagd':
    case 'ingediend':
      return 'badge-info'
    case 'offerte_verstuurd':
      return 'badge-warning'
    case 'in_behandeling':
      return 'badge-warning'
    case 'facturatie':
    case 'klaar_voor_betaling':
      return 'badge-warning'
    case 'factuur_verstuurd':
      return 'badge-info'
    case 'afgerond':
      return 'badge-success'
    default:
      return 'badge-neutral'
  }
}

function getCustomerName(project: Project) {
  return (
    project.profiles?.company_name ||
    project.profiles?.full_name ||
    project.profiles?.email ||
    '—'
  )
}

export default function ProjectList({
  projects,
  files = [],
  title = 'Werven',
  description = 'Overzicht van je werven.',
  showCustomerColumn = false,
  showAdminActions = false,
  hideResultsUntilSearch = false,
  embedded = false,
}: Props) {
  const { t } = useT()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)

  const isAdminView = showCustomerColumn || showAdminActions

  const fileStatsByProject = useMemo(() => {
    const stats = new Map<string, { uploads: number; finals: number }>()

    for (const file of files) {
      const key = String(file.project_id ?? '')
      if (!key) continue

      const current = stats.get(key) ?? { uploads: 0, finals: 0 }

      if (file.file_type === 'client_upload') current.uploads += 1
      if (file.file_type === 'final_file') current.finals += 1

      stats.set(key, current)
    }

    return stats
  }, [files])

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortKey(key)
    setSortDirection(key === 'created_at' ? 'desc' : 'asc')
  }

  function sortIndicator(key: SortKey) {
    if (sortKey !== key) return '↕'
    return sortDirection === 'asc' ? '↑' : '↓'
  }

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const haystack = [
        project.name,
        project.description,
        project.address,
        project.status,
        getCustomerName(project),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      const matchesSearch =
        search.trim() === '' || haystack.includes(search.toLowerCase())

      const matchesStatus =
        statusFilter.trim() === '' || project.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [projects, search, statusFilter])

  const shouldShowResults = !hideResultsUntilSearch || search.trim() !== ''
  const visibleProjects = shouldShowResults ? filteredProjects : []

  const sortedProjects = useMemo(() => {
    const list = [...visibleProjects]

    list.sort((a, b) => {
      let comparison = 0

      if (sortKey === 'name') {
        comparison = (a.name || '').localeCompare(b.name || '', 'nl', {
          sensitivity: 'base',
        })
      }

      if (sortKey === 'customer') {
        comparison = getCustomerName(a).localeCompare(getCustomerName(b), 'nl', {
          sensitivity: 'base',
        })
      }

      if (sortKey === 'address') {
        comparison = (a.address || '').localeCompare(b.address || '', 'nl', {
          sensitivity: 'base',
        })
      }

      if (sortKey === 'status') {
        comparison = getStatusLabel(a.status, t).localeCompare(
          getStatusLabel(b.status, t),
          'nl',
          { sensitivity: 'base' }
        )
      }

      if (sortKey === 'price') {
        comparison = (a.price || 0) - (b.price || 0)
      }

      if (sortKey === 'created_at') {
        const aDate = a.created_at ? new Date(a.created_at).getTime() : 0
        const bDate = b.created_at ? new Date(b.created_at).getTime() : 0
        comparison = aDate - bDate
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })

    return list
  }, [visibleProjects, sortKey, sortDirection])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, sortKey, sortDirection])

  const PAGE_SIZE = 10
  const totalPages = Math.max(1, Math.ceil(sortedProjects.length / PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedProjects = sortedProjects.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE
  )

  function renderPageNumbers() {
    const pages: number[] = []

    let from = Math.max(1, safeCurrentPage - 2)
    let to = Math.min(totalPages, from + 4)

    if (to - from < 4) {
      from = Math.max(1, to - 4)
    }

    for (let i = from; i <= to; i++) {
      pages.push(i)
    }

    return pages
  }

  function resetFilters() {
    setSearch('')
    setStatusFilter('')
    setSortKey('created_at')
    setSortDirection('desc')
    setCurrentPage(1)
  }

  return (
    <section className={embedded ? 'space-y-2.5' : 'space-y-4'}>
      <div
        className={
          embedded
            ? 'space-y-3'
            : 'rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-4 shadow-sm'
        }
      >
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-[13px] font-semibold leading-5 text-[var(--text-main)]">
              {embedded ? 'Werven' : title}
            </h2>
            <p className="mt-0.5 text-[11px] leading-4 text-[var(--text-soft)]">
              {embedded ? 'Zoek en filter op project, klant of locatie.' : description}
            </p>
          </div>

          {embedded ? null : (
            <div className="flex items-center gap-3">
              <div className="text-[10px] text-[var(--text-muted)]">
                {visibleProjects.length} resultaat
                {visibleProjects.length !== 1 ? 'en' : ''}
              </div>

              <button
                type="button"
                onClick={resetFilters}
                className="group relative overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-2.5 py-1.5 text-[10px] font-medium text-[var(--text-main)] transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)]/80"
              >
                <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
                <span className="pr-2">Reset</span>
              </button>
            </div>
          )}
        </div>

        {embedded ? (
          <div className="mt-2.5 space-y-2">
            <div className="grid gap-2 md:grid-cols-[1fr_auto]">
              <input
                type="text"
                placeholder={
                  isAdminView
                    ? 'Zoek werf, klant of locatie...'
                    : 'Zoek werf of locatie...'
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-dark h-9 w-full px-3 py-1.5 text-[13px]"
              />

              {shouldShowResults ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="group relative flex h-9 items-center overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 text-[10px] font-medium text-[var(--text-main)] transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)]/80"
                >
                  <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
                  <span className="pr-2">Reset</span>
                </button>
              ) : null}
            </div>

            {shouldShowResults ? (
              <div className="grid gap-2 md:grid-cols-[1fr]">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input-dark h-9 w-full px-3 py-1.5 text-[12px]"
                >
                  <option value="">Alle statussen</option>
                  <option value="ingediend">Ingediend</option>
                  <option value="in_behandeling">In behandeling</option>
                  <option value="klaar_voor_betaling">Klaar voor betaling</option>
                  <option value="afgerond">Afgerond</option>
                </select>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mt-2.5 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            <input
              type="text"
              placeholder={
                isAdminView
                  ? 'Zoek project, klant of locatie...'
                  : 'Zoek project of locatie...'
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-dark h-9 w-full px-3 py-1.5 text-[13px]"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-dark h-9 w-full px-3 py-1.5 text-[12px]"
            >
              <option value="">Alle statussen</option>
              <option value="ingediend">Ingediend</option>
              <option value="in_behandeling">In behandeling</option>
              <option value="klaar_voor_betaling">Klaar voor betaling</option>
              <option value="afgerond">Afgerond</option>
            </select>

            {!isAdminView ? (
              <select
                value={`${sortKey}-${sortDirection}`}
                onChange={(e) => {
                  const [key, direction] = e.target.value.split('-') as [
                    SortKey,
                    SortDirection
                  ]
                  setSortKey(key)
                  setSortDirection(direction)
                }}
                className="input-dark h-9 w-full px-3 py-1.5 text-[12px]"
              >
                <option value="created_at-desc">Nieuwste eerst</option>
                <option value="created_at-asc">Oudste eerst</option>
                <option value="name-asc">Titel A-Z</option>
                <option value="name-desc">Titel Z-A</option>
                <option value="address-asc">Locatie A-Z</option>
                <option value="status-asc">Status A-Z</option>
                <option value="price-desc">Prijs hoog-laag</option>
                <option value="price-asc">Prijs laag-hoog</option>
              </select>
            ) : (
              <div />
            )}
          </div>
        )}
      </div>

      {shouldShowResults ? (
        isAdminView ? (
        <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
          <div className="overflow-x-auto">
            <div
              className={`min-w-[1100px] ${
                showCustomerColumn ? 'lg:min-w-[1320px]' : 'lg:min-w-[1180px]'
              }`}
            >
              <div
                className={`grid gap-4 border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-5 py-4 ${
                  showCustomerColumn
                    ? 'grid-cols-[1.4fr_1.2fr_1.2fr_1fr_1fr_1fr_230px]'
                    : 'grid-cols-[1.6fr_1.4fr_1fr_1fr_1fr_220px]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-2 text-left text-sm font-semibold text-[var(--text-soft)] transition hover:text-[var(--text-main)]"
                >
                  Project <span>{sortIndicator('name')}</span>
                </button>

                {showCustomerColumn && (
                  <button
                    type="button"
                    onClick={() => handleSort('customer')}
                    className="flex items-center gap-2 text-left text-sm font-semibold text-[var(--text-soft)] transition hover:text-[var(--text-main)]"
                  >
                    Klant <span>{sortIndicator('customer')}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleSort('address')}
                  className="flex items-center gap-2 text-left text-sm font-semibold text-[var(--text-soft)] transition hover:text-[var(--text-main)]"
                >
                  Locatie <span>{sortIndicator('address')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSort('status')}
                  className="flex items-center gap-2 text-left text-sm font-semibold text-[var(--text-soft)] transition hover:text-[var(--text-main)]"
                >
                  Status <span>{sortIndicator('status')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSort('price')}
                  className="flex items-center gap-2 text-left text-sm font-semibold text-[var(--text-soft)] transition hover:text-[var(--text-main)]"
                >
                  Prijs <span>{sortIndicator('price')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSort('created_at')}
                  className="flex items-center gap-2 text-left text-sm font-semibold text-[var(--text-soft)] transition hover:text-[var(--text-main)]"
                >
                  Datum <span>{sortIndicator('created_at')}</span>
                </button>

                <div className="text-sm font-semibold text-[var(--text-soft)]">
                  Acties
                </div>
              </div>

              {paginatedProjects.length === 0 ? (
                <div className="px-5 py-8 text-sm text-[var(--text-soft)]">
                  Geen werven gevonden voor deze filters.
                </div>
              ) : (
                <div className="divide-y divide-[var(--border-soft)]">
                  {paginatedProjects.map((project) => (
                    <div
                      key={project.id}
                      className={`grid gap-4 px-5 py-5 items-center ${
                        showCustomerColumn
                          ? 'grid-cols-[1.4fr_1.2fr_1.2fr_1fr_1fr_1fr_230px]'
                          : 'grid-cols-[1.6fr_1.4fr_1fr_1fr_1fr_220px]'
                      }`}
                    >
                      <div className="min-w-0 flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent)]/10">
                          <HardHat className="h-4.5 w-4.5 text-[var(--accent)]" />
                        </span>
                        <div>
                          <p className="truncate font-semibold text-[var(--text-main)]">
                            {project.name || '—'}
                          </p>
                          <p className="mt-1 text-xs text-[var(--text-muted)] line-clamp-1">
                            {project.description || 'Geen beschrijving'}
                          </p>
                        </div>
                      </div>

                      {showCustomerColumn && (
                        <div className="min-w-0 text-sm text-[var(--text-soft)]">
                          <p className="truncate">{getCustomerName(project)}</p>
                        </div>
                      )}

                      <div className="min-w-0 text-sm text-[var(--text-soft)]">
                        <p className="truncate">{project.address || '—'}</p>
                      </div>

                      <div>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                            project.status
                          )}`}
                        >
                          {getStatusLabel(project.status)}
                        </span>
                      </div>

                      <div className="text-sm text-[var(--text-soft)]">
                        {project.price != null
                          ? `${project.price} ${project.currency || 'EUR'}`
                          : '—'}
                      </div>

                      <div className="text-sm text-[var(--text-soft)]">
                        {project.created_at
                          ? new Date(project.created_at).toLocaleDateString('nl-BE')
                          : '—'}
                      </div>

                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <Link
                          href={
                            showAdminActions
                              ? `/admin/projects/${project.id}`
                              : `/dashboard/projects/${project.id}`
                          }
                          className="btn-secondary btn-sm"
                        >
                          Open
                        </Link>

                        {showAdminActions && (
                          <Link
                            href={`/admin/projects/${project.id}/edit`}
                            className="btn-secondary btn-sm"
                          >
                            Bewerk
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      ) : paginatedProjects.length === 0 ? (
        <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-5 py-8 text-sm text-[var(--text-soft)] shadow-sm">
          Geen werven gevonden voor deze filters.
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
            <div className="overflow-x-auto">
              <div className="min-w-[1000px] lg:min-w-full">
                <div className="grid gap-3 border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-5 py-3 grid-cols-[1.5fr_1.2fr_0.9fr_0.9fr_0.8fr_0.8fr_100px] text-[10px] font-semibold uppercase text-[var(--text-soft)]">
                  <button
                    type="button"
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1 text-left transition hover:text-[var(--text-main)]"
                  >
                    Project <span>{sortIndicator('name')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSort('address')}
                    className="flex items-center gap-1 text-left transition hover:text-[var(--text-main)]"
                  >
                    Locatie <span>{sortIndicator('address')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSort('status')}
                    className="flex items-center gap-1 text-left transition hover:text-[var(--text-main)]"
                  >
                    Status <span>{sortIndicator('status')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSort('price')}
                    className="flex items-center gap-1 text-left transition hover:text-[var(--text-main)]"
                  >
                    Prijs <span>{sortIndicator('price')}</span>
                  </button>

                  <div>Datum</div>
                  <div className="text-center">Uploads</div>
                  <div className="text-center">Oplevering</div>
                </div>

                {paginatedProjects.map((project) => {
                  const stats = fileStatsByProject.get(String(project.id)) ?? {
                    uploads: 0,
                    finals: 0,
                  }

                  return (
                    <div
                      key={project.id}
                      className="grid gap-3 border-b border-[var(--border-soft)] px-5 py-3 grid-cols-[1.5fr_1.2fr_0.9fr_0.9fr_0.8fr_0.8fr_100px] items-center transition hover:bg-[var(--bg-card-2)]"
                    >
                      <Link
                        href={`/dashboard/projects/${project.id}`}
                        className="min-w-0 flex items-center gap-2 text-sm font-semibold text-white transition hover:text-[var(--accent)]"
                      >
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--accent)]/10">
                          <HardHat className="h-4 w-4 text-[var(--accent)]" />
                        </span>
                        <span className="truncate">{project.name || '—'}</span>
                      </Link>

                      <div className="min-w-0 text-xs text-[var(--text-soft)]">
                        <p className="truncate">{project.address || '—'}</p>
                      </div>

                      <div>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusClass(
                            project.status
                          )}`}
                        >
                          {getStatusLabel(project.status, t)}
                        </span>
                      </div>

                      <div className="text-xs text-[var(--text-soft)]">
                        {project.price != null
                          ? `${project.price} ${project.currency || 'EUR'}`
                          : '—'}
                      </div>

                      <div className="text-xs text-[var(--text-soft)]">
                        {project.created_at
                          ? new Date(project.created_at).toLocaleDateString('nl-BE')
                          : '—'}
                      </div>

                      <div className="text-center text-xs text-[var(--text-soft)]">
                        {stats.uploads}
                      </div>

                      <div className="text-center text-sm text-[var(--text-soft)]">
                        {stats.finals}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

        </>
      )
      ) : null}

      {shouldShowResults && totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-2.5 shadow-sm">
          <p className="text-xs text-[var(--text-soft)]">
            {sortedProjects.length} werven — pagina {safeCurrentPage} van {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage <= 1}
              className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-soft)] transition hover:text-[var(--text-main)] disabled:opacity-40"
            >
              ‹ Vorige
            </button>
            {renderPageNumbers().map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                  page === safeCurrentPage
                    ? 'border border-[var(--accent)]/60 bg-[var(--accent)]/15 text-[var(--accent)]'
                    : 'border border-[var(--border-soft)] bg-[var(--bg-card-2)] text-[var(--text-soft)] hover:text-[var(--text-main)]'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage >= totalPages}
              className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-soft)] transition hover:text-[var(--text-main)] disabled:opacity-40"
            >
              Volgende ›
            </button>
          </div>
        </div>
      )}
    </section>
  )
}