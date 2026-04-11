'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { getStatusClass, getStatusLabel, getStatusIcon } from '@/lib/status'
import { FileText, Clock, CheckCircle, Check } from 'lucide-react'

type Project = {
  id: number
  title: string
  description: string | null
  address: string | null
  status: string
  price: number | null
  currency: string | null
  created_at?: string | null
  klantEmail?: string | null
  paid?: boolean | null
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

export default function AdminProjectSearch({
  projects,
  projectFiles,
}: Props) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [addressFilter, setAddressFilter] = useState('')
  const [clientFilter, setClientFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
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
        project.title?.toLowerCase().includes(search.toLowerCase()) ||
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
        comparison = (a.title || '').localeCompare(b.title || '', 'nl', {
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

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAndSortedProjects.length / rowsPerPage)
  )

  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const paginatedProjects = filteredAndSortedProjects.slice(startIndex, endIndex)

  const resetFilters = () => {
    setSearch('')
    setStatusFilter('')
    setAddressFilter('')
    setClientFilter('')
    setPaymentFilter('')
    setMinPrice('')
    setMaxPrice('')
    setSortKey('created_at')
    setSortDirection('desc')
    setRowsPerPage(10)
    setCurrentPage(1)
  }

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

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    return pages
  }

  return (
    <section className="mt-8">
      <div className="mb-6 rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--text-main)]">
              Wervenoverzicht
            </h2>
            <p className="mt-2 text-sm text-[var(--text-soft)]">
              Zoek, filter, sorteer en blader door alle werven.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm text-[var(--text-muted)]">
              {filteredAndSortedProjects.length} resultaat
              {filteredAndSortedProjects.length !== 1 ? 'en' : ''}
            </div>

            <button
              type="button"
              onClick={resetFilters}
              className="btn-secondary px-4 py-2 text-sm"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-7">
          <input
            type="text"
            placeholder="Zoek werf"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-3 text-sm text-[var(--text-main)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-3 text-sm text-[var(--text-main)] outline-none transition focus:border-[var(--accent)]"
          >
            <option value="">Alle statussen</option>
            <option value="ingediend">Ingediend</option>
            <option value="in_behandeling">In behandeling</option>
            <option value="klaar_voor_betaling">Klaar voor betaling</option>
            <option value="afgerond">Afgerond</option>
          </select>

          <input
            type="text"
            placeholder="Filter op locatie"
            value={addressFilter}
            onChange={(e) => setAddressFilter(e.target.value)}
            className="w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-3 text-sm text-[var(--text-main)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
          />

          <input
            type="text"
            placeholder="Filter op klant"
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-3 text-sm text-[var(--text-main)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
          />

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-3 text-sm text-[var(--text-main)] outline-none transition focus:border-[var(--accent)]"
          >
            <option value="">Betaling: alles</option>
            <option value="paid">Betaald</option>
            <option value="unpaid">Openstaand</option>
          </select>

          <input
            type="number"
            placeholder="Min prijs"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-3 text-sm text-[var(--text-main)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
          />

          <input
            type="number"
            placeholder="Max prijs"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-3 text-sm text-[var(--text-main)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="text-sm text-[var(--text-soft)]">Rijen per pagina</label>

          <select
            value={rowsPerPage}
            onChange={(e) => setRowsPerPage(Number(e.target.value))}
            className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-2 text-sm text-[var(--text-main)] outline-none transition focus:border-[var(--accent)]"
          >
            <option value={5}>5 rijen</option>
            <option value={10}>10 rijen</option>
            <option value={20}>20 rijen</option>
            <option value={50}>50 rijen</option>
            <option value={100}>100 rijen</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
        <div className="hidden grid-cols-[1.8fr_1.5fr_1.1fr_1fr_1fr_100px_140px] gap-4 border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-5 py-4 md:grid">
          <button
            type="button"
            onClick={() => handleSort('title')}
            className={headerButtonClass}
          >
            <span>Werf</span>
            <span>{sortIndicator('title')}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSort('klantEmail')}
            className={headerButtonClass}
          >
            <span>Klant</span>
            <span>{sortIndicator('klantEmail')}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSort('status')}
            className={headerButtonClass}
          >
            <span>Status</span>
            <span>{sortIndicator('status')}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSort('price')}
            className={headerButtonClass}
          >
            <span>Prijs</span>
            <span>{sortIndicator('price')}</span>
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
            Files
          </div>

          <div className="text-sm font-semibold text-[var(--text-soft)]">
            Actie
          </div>
        </div>

        {paginatedProjects.length === 0 ? (
          <div className="px-5 py-6 text-sm text-[var(--text-soft)]">
            Geen werven gevonden voor deze filters.
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-soft)]">
            {paginatedProjects.map((project) => (
              <div
                key={project.id}
                className="grid gap-4 px-5 py-5 md:grid-cols-[1.8fr_1.5fr_1.1fr_1fr_1fr_100px_140px] md:items-center"
              >
                <div>
                  <p className="font-semibold text-[var(--text-main)]">
                    {project.title}
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-soft)]">
                    {project.description || 'Geen beschrijving'}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {project.address || 'Geen locatie'}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-[var(--text-main)]">
                    {project.klantEmail || 'Onbekend'}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {project.paid ? 'Betaald' : 'Openstaand'}
                  </p>
                </div>

                <div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                      project.status
                    )}`}
                  >
                    {getStatusIconComponent(getStatusIcon(project.status))}
                    {getStatusLabel(project.status)}
                  </span>
                </div>

                <div className="text-sm font-medium text-[var(--text-main)]">
                  {project.price !== null && project.price !== undefined
                    ? `${project.price} ${project.currency || 'EUR'}`
                    : 'Nog niet bepaald'}
                </div>

                <div className="text-sm text-[var(--text-soft)]">
                  {project.created_at
                    ? new Date(project.created_at).toLocaleDateString('nl-BE')
                    : 'Onbekend'}
                </div>

                <div className="text-sm text-[var(--text-soft)]">
                  {fileCountByProject.get(project.id) || 0}
                </div>

                <div>
                  <Link
                    href={`/admin/projects/${project.id}`}
                    className="btn-primary px-4 py-2 text-sm"
                  >
                    Open
                  </Link>
                </div>
              </div>
            ))}
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
      </div>
    </section>
  )
}