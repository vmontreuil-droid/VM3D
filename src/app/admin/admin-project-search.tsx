'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { getStatusClass, getStatusLabel, getStatusIcon } from '@/lib/status'
import {
  ArrowUpDown,
  Check,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  FileText,
  UploadCloud,
  Wallet,
} from 'lucide-react'

type Project = {
  id: number
  name: string
  description: string | null
  address: string | null
  status: string
  price: number | null
  currency: string | null
  created_at?: string | null
  klantEmail?: string | null
  paid?: boolean | null
  userId?: string | null
}

type ProjectFile = {
  id: number
  project_id: number
  file_type?: string | null
}

type Props = {
  projects: Project[]
  projectFiles: ProjectFile[]
  adminUserId: string
  hideResultsUntilSearch?: boolean
}

type SortKey =
  | 'title'
  | 'address'
  | 'status'
  | 'price'
  | 'created_at'
  | 'klantEmail'
type SortDirection = 'asc' | 'desc'

function getStatusIconComponent(iconName: string) {
  switch (iconName) {
    case 'FileText':
      return <FileText className="h-3 w-3" />
    case 'Clock':
      return <Clock className="h-3 w-3" />
    case 'CheckCircle':
      return <CheckCircle className="h-3 w-3" />
    case 'Check':
      return <Check className="h-3 w-3" />
    default:
      return <FileText className="h-3 w-3" />
  }
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleDateString('nl-BE')
  } catch {
    return '—'
  }
}

function formatPrice(value: number | null, currency?: string | null) {
  if (value === null || value === undefined) return 'Nog niet bepaald'
  return `${value} ${currency || 'EUR'}`
}

function getActionButtonClass() {
  const shared =
    'group relative inline-flex h-8 items-center gap-1.5 overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-2.5 text-[10px] font-semibold text-[var(--text-main)] transition hover:-translate-y-px'

  return `${shared} hover:border-[var(--accent)]/45 hover:bg-[var(--bg-card)]/80`
}

export default function AdminProjectSearch({
  projects,
  projectFiles,
  hideResultsUntilSearch = false,
}: Props) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [addressFilter, setAddressFilter] = useState('')
  const [clientFilter, setClientFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('title')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  const fileCountByProject = useMemo(() => {
    const map = new Map<number, number>()

    for (const file of projectFiles) {
      map.set(file.project_id, (map.get(file.project_id) || 0) + 1)
    }

    return map
  }, [projectFiles])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortKey(key)
    setSortDirection(key === 'created_at' ? 'desc' : 'asc')
  }

  const filteredAndSortedProjects = useMemo(() => {
    const filtered = projects.filter((project) => {
      const matchesSearch =
        search.trim() === '' ||
        project.name?.toLowerCase().includes(search.toLowerCase()) ||
        project.description?.toLowerCase().includes(search.toLowerCase()) ||
        project.address?.toLowerCase().includes(search.toLowerCase()) ||
        project.klantEmail?.toLowerCase().includes(search.toLowerCase())

      const matchesStatus =
        statusFilter === '' || project.status === statusFilter

      const matchesAddress =
        addressFilter.trim() === '' ||
        project.address?.toLowerCase().includes(addressFilter.toLowerCase())

      const matchesClient =
        clientFilter.trim() === '' ||
        project.klantEmail?.toLowerCase().includes(clientFilter.toLowerCase())

      const matchesPayment =
        paymentFilter === '' ||
        (paymentFilter === 'paid' && !!project.paid) ||
        (paymentFilter === 'unpaid' && !project.paid)

      const priceValue =
        project.price !== null && project.price !== undefined
          ? Number(project.price)
          : null

      const matchesMinPrice =
        minPrice === '' ||
        (priceValue !== null && priceValue >= Number(minPrice))

      const matchesMaxPrice =
        maxPrice === '' ||
        (priceValue !== null && priceValue <= Number(maxPrice))

      return (
        matchesSearch &&
        matchesStatus &&
        matchesAddress &&
        matchesClient &&
        matchesPayment &&
        matchesMinPrice &&
        matchesMaxPrice
      )
    })

    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0

      if (sortKey === 'title') {
        comparison = (a.name || '').localeCompare(b.name || '', 'nl', {
          sensitivity: 'base',
        })
      }

      if (sortKey === 'address') {
        comparison = (a.address || '').localeCompare(b.address || '', 'nl', {
          sensitivity: 'base',
        })
      }

      if (sortKey === 'status') {
        comparison = getStatusLabel(a.status).localeCompare(
          getStatusLabel(b.status),
          'nl',
          { sensitivity: 'base' }
        )
      }

      if (sortKey === 'klantEmail') {
        comparison = (a.klantEmail || '').localeCompare(
          b.klantEmail || '',
          'nl',
          { sensitivity: 'base' }
        )
      }

      if (sortKey === 'price') {
        const aPrice =
          a.price !== null && a.price !== undefined ? Number(a.price) : -1
        const bPrice =
          b.price !== null && b.price !== undefined ? Number(b.price) : -1
        comparison = aPrice - bPrice
      }

      if (sortKey === 'created_at') {
        const aDate = a.created_at ? new Date(a.created_at).getTime() : 0
        const bDate = b.created_at ? new Date(b.created_at).getTime() : 0
        comparison = aDate - bDate
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })

    return sorted
  }, [
    projects,
    search,
    statusFilter,
    addressFilter,
    clientFilter,
    paymentFilter,
    minPrice,
    maxPrice,
    sortKey,
    sortDirection,
  ])

  useEffect(() => {
    setCurrentPage(1)
  }, [
    search,
    statusFilter,
    addressFilter,
    clientFilter,
    paymentFilter,
    minPrice,
    maxPrice,
    sortKey,
    sortDirection,
    rowsPerPage,
  ])

  const shouldShowResults = !hideResultsUntilSearch || search.trim() !== ''
  const visibleProjects = shouldShowResults ? filteredAndSortedProjects : []

  const totalPages = Math.max(
    1,
    Math.ceil(visibleProjects.length / rowsPerPage)
  )

  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const paginatedProjects = visibleProjects.slice(startIndex, endIndex)

  const resetFilters = () => {
    setSearch('')
    setStatusFilter('')
    setAddressFilter('')
    setClientFilter('')
    setPaymentFilter('')
    setMinPrice('')
    setMaxPrice('')
    setSortKey('title')
    setSortDirection('asc')
    setRowsPerPage(10)
    setCurrentPage(1)
  }

  const renderPageNumbers = () => {
    const pages: number[] = []

    let start = Math.max(1, safeCurrentPage - 2)
    let end = Math.min(totalPages, start + 4)

    if (end - start < 4) {
      start = Math.max(1, end - 4)
    }

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    return pages
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
      <div className="border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                Wervenlijst
              </p>
              <h2 className="mt-1 text-[13px] font-semibold leading-5 text-[var(--text-main)]">
                Alle werven
              </h2>
              <p className="mt-0.5 text-[11px] leading-4 text-[var(--text-soft)]">
                Zoek, filter en open werfdossiers in dezelfde compacte stijl als
                het klantenoverzicht.
              </p>
            </div>

            <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2 text-right">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                Resultaten
              </p>
              <p className="mt-1 text-base font-semibold text-[var(--text-main)]">
                {visibleProjects.length}
              </p>
            </div>
          </div>

          <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_210px_150px_auto]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Zoek werf, locatie, status..."
              className="input-dark h-9 w-full px-3 py-1.5 text-[12px]"
            />

            <select
              value={sortKey}
              onChange={(e) => handleSort(e.target.value as SortKey)}
              className="input-dark h-9 w-full px-3 py-1.5 text-[12px]"
            >
              <option value="title">Sorteer op naam</option>
              <option value="address">Sorteer op locatie</option>
              <option value="status">Sorteer op status</option>
              <option value="price">Sorteer op prijs</option>
              <option value="created_at">Sorteer op datum</option>
            </select>

            <button
              type="button"
              onClick={() =>
                setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
              }
              className="btn-secondary btn-sm w-full"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              <span>{sortDirection === 'asc' ? 'Oplopend' : 'Aflopend'}</span>
            </button>

            <button
              type="button"
              onClick={resetFilters}
              className="btn-secondary btn-sm w-full"
            >
              Reset
            </button>
          </div>

        </div>
      </div>

      {shouldShowResults ? (
        <div className="p-4 sm:p-5">
          <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)]">
          <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-3.5 py-2.5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                Resultaten
              </p>
              <h4 className="mt-0.5 text-[12px] font-semibold leading-5 text-[var(--text-main)]">
                Werven
              </h4>
            </div>
            <p className="text-[10px] text-[var(--text-soft)]">
              {paginatedProjects.length} op deze pagina
            </p>
          </div>

          {paginatedProjects.length === 0 ? (
            <div className="px-3.5 py-4 text-[12px] text-[var(--text-soft)]">
              Geen werven gevonden voor deze filters.
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-soft)]">
              {paginatedProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex flex-col gap-2.5 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-[13px] font-semibold text-[var(--text-main)]">
                        {project.name}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusClass(
                          project.status
                        )}`}
                      >
                        {getStatusIconComponent(getStatusIcon(project.status))}
                        {getStatusLabel(project.status)}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          project.paid ? 'badge-success' : 'badge-warning'
                        }`}
                      >
                        {project.paid ? 'Betaald' : 'Openstaand'}
                      </span>
                      <span className="badge-neutral px-2 py-0.5 text-[10px] font-semibold">
                        {fileCountByProject.get(project.id) || 0} files
                      </span>
                    </div>

                    <p className="mt-0.5 text-[11px] text-[var(--text-soft)]">
                      {[project.description, project.address]
                        .filter(Boolean)
                        .join(' · ') || 'Geen extra gegevens'}
                    </p>

                    <div className="mt-1.5 flex flex-wrap gap-1.5 text-[10px] text-[var(--text-soft)]">
                      <span className="rounded-full border border-[var(--border-soft)] bg-[var(--bg-card)] px-2 py-0.5">
                        Bestanden: {fileCountByProject.get(project.id) || 0}
                      </span>
                      <span className="rounded-full border border-[var(--border-soft)] bg-[var(--bg-card)] px-2 py-0.5">
                        Prijs: {formatPrice(project.price, project.currency)}
                      </span>
                      <span className="rounded-full border border-[var(--border-soft)] bg-[var(--bg-card)] px-2 py-0.5">
                        Datum: {formatDate(project.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 sm:justify-end">
                    <Link
                      href={`/admin/projects/${project.id}`}
                      className={getActionButtonClass()}
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--accent)]/12 text-[var(--accent)]">
                        <Eye className="h-3 w-3" />
                      </span>
                      <span className="pr-1">Open</span>
                      <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
                    </Link>

                    <Link
                      href={`/admin/projects/${project.id}/edit`}
                      className={getActionButtonClass()}
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--accent)]/12 text-[var(--accent)]">
                        <Edit className="h-3 w-3" />
                      </span>
                      <span className="pr-1">Bewerk</span>
                      <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
                    </Link>

                    <Link
                      href={`/admin/projects/${project.id}`}
                      className={getActionButtonClass()}
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--accent)]/12 text-[var(--accent)]">
                        <UploadCloud className="h-3 w-3" />
                      </span>
                      <span className="pr-1">Bestanden</span>
                      <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/85" />
                    </Link>

                    <Link
                      href={`/admin/projects/${project.id}`}
                      className={getActionButtonClass()}
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--accent)]/12 text-[var(--accent)]">
                        <Wallet className="h-3 w-3" />
                      </span>
                      <span className="pr-1">Facturatie</span>
                      <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
                    </Link>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

          {visibleProjects.length > 0 ? (
            <div className="mt-3 flex flex-col gap-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-[11px] text-[var(--text-soft)]">
                Pagina {safeCurrentPage} van {totalPages}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={safeCurrentPage === 1}
                  className="btn-page"
                >
                  Vorige
                </button>

                {renderPageNumbers().map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={page === safeCurrentPage ? 'btn-page-active' : 'btn-page'}
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
                  className="btn-page"
                >
                  Volgende
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}