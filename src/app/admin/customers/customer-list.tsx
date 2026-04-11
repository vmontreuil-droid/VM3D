'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

type CustomerItem = {
  id: string
  full_name?: string | null
  company_name?: string | null
  email?: string | null
  vat_number?: string | null
  city?: string | null
  phone?: string | null
  created_at?: string | null
  project_count?: number
  last_project_at?: string | null
}

type SortKey =
  | 'name'
  | 'vat_number'
  | 'city'
  | 'email'
  | 'project_count'
  | 'last_project_at'

type SortDirection = 'asc' | 'desc'

type Props = {
  customers: CustomerItem[]
  hideResultsUntilSearch?: boolean
  embedded?: boolean
}

function getCustomerName(customer: CustomerItem) {
  return (
    customer.company_name ||
    customer.full_name ||
    customer.email ||
    'Onbekende klant'
  )
}

function getSortableValue(customer: CustomerItem, key: SortKey) {
  switch (key) {
    case 'name':
      return getCustomerName(customer).toLowerCase()
    case 'vat_number':
      return (customer.vat_number || '').toLowerCase()
    case 'city':
      return (customer.city || '').toLowerCase()
    case 'email':
      return (customer.email || '').toLowerCase()
    case 'project_count':
      return customer.project_count || 0
    case 'last_project_at':
      return customer.last_project_at
        ? new Date(customer.last_project_at).getTime()
        : 0
    default:
      return ''
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

export default function CustomerList({
  customers,
  hideResultsUntilSearch = false,
  embedded = false,
}: Props) {
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDirection(key === 'last_project_at' || key === 'project_count' ? 'desc' : 'asc')
    }
    setCurrentPage(1)
  }

  function resetFilters() {
    setSearch('')
    setCurrentPage(1)
    setSortKey('name')
    setSortDirection('asc')
  }

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase()

    const filtered = customers.filter((customer) => {
      const values = [
        getCustomerName(customer),
        customer.vat_number || '',
        customer.city || '',
        customer.email || '',
        customer.phone || '',
      ]
        .join(' ')
        .toLowerCase()

      return values.includes(q)
    })

    const sorted = [...filtered].sort((a, b) => {
      const aValue = getSortableValue(a, sortKey)
      const bValue = getSortableValue(b, sortKey)

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
      }

      const aText = String(aValue)
      const bText = String(bValue)

      return sortDirection === 'asc'
        ? aText.localeCompare(bText)
        : bText.localeCompare(aText)
    })

    return sorted
  }, [customers, search, sortKey, sortDirection])

  const shouldShowResults = !hideResultsUntilSearch || search.trim() !== ''
  const visibleCustomers = shouldShowResults ? filteredCustomers : []

  const totalPages = 1
  const safeCurrentPage = 1
  const paginatedCustomers = visibleCustomers

  const visibleFrom = visibleCustomers.length === 0 ? 0 : 1
  const visibleTo = visibleCustomers.length

  return (
    <section
      className={
        embedded
          ? 'space-y-3'
          : 'overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm'
      }
    >
      <div
        className={
          embedded
            ? 'space-y-3'
            : 'border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-4 sm:px-5'
        }
      >
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                {embedded ? 'Snelle zoekopdracht' : 'Overzicht'}
              </p>
              <h2 className="mt-1 text-[13px] font-semibold leading-5 text-[var(--text-main)]">
                {embedded ? 'Klanten' : 'Alle klanten'}
              </h2>
              <p className="mt-0.5 text-[11px] leading-4 text-[var(--text-soft)]">
                {embedded
                  ? 'Zoek rechtstreeks op klantnaam, btw, stad of e-mail.'
                  : 'Zoek, sorteer en open klantfiches met directe acties per klant.'}
              </p>
            </div>

            {embedded ? null : (
              <div className="card-mini text-center">
                <p className="text-xs text-[var(--text-muted)]">Resultaten</p>
                <p className="text-lg font-semibold text-[var(--text-main)]">
                  {visibleCustomers.length}
                </p>
              </div>
            )}
          </div>

          <div className={`grid gap-2 ${embedded ? 'md:grid-cols-[1fr_auto]' : 'lg:grid-cols-[1.4fr_260px]'}`}>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Zoek klant, btw, stad, mail..."
              className="input-dark h-9 w-full px-3 py-1.5 text-[12px]"
            />

            {embedded ? (
              shouldShowResults ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="group relative flex h-9 items-center overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 text-[10px] font-medium text-[var(--text-main)] transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)]/80"
                >
                  <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
                  <span className="pr-2">Reset</span>
                </button>
              ) : null
            ) : (
              <div className={`rounded-lg border border-[var(--border-soft)] px-2.5 py-1.5 text-[10px] text-[var(--text-soft)] ${embedded ? 'bg-[var(--bg-main)]' : 'bg-[var(--bg-card)]'}`}>
                {visibleCustomers.length} klant{visibleCustomers.length !== 1 ? 'en' : ''} gevonden
              </div>
            )}
          </div>
        </div>
      </div>

      {shouldShowResults ? (
        <>
          <div className="hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead className="bg-[var(--bg-card-2)] text-left">
              <tr className="border-b border-[var(--border-soft)]">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  <button onClick={() => handleSort('name')} className="inline-flex items-center gap-1">
                    Klant
                    <span>↕</span>
                  </button>
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  <button onClick={() => handleSort('vat_number')} className="inline-flex items-center gap-1">
                    BTW
                    <span>↕</span>
                  </button>
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  <button onClick={() => handleSort('city')} className="inline-flex items-center gap-1">
                    Stad
                    <span>↕</span>
                  </button>
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  <button onClick={() => handleSort('email')} className="inline-flex items-center gap-1">
                    Contact
                    <span>↕</span>
                  </button>
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  <button onClick={() => handleSort('project_count')} className="inline-flex items-center gap-1">
                    Werven
                    <span>↕</span>
                  </button>
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  <button onClick={() => handleSort('last_project_at')} className="inline-flex items-center gap-1">
                    Laatste activiteit
                    <span>↕</span>
                  </button>
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  Acties
                </th>
              </tr>
            </thead>

            <tbody>
              {paginatedCustomers.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-8 text-sm text-[var(--text-soft)]"
                  >
                    Geen klanten gevonden voor deze filters.
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b border-[var(--border-soft)] transition hover:bg-[var(--bg-card-2)]"
                  >
                    <td className="px-5 py-4 align-top">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--text-main)]">
                          {getCustomerName(customer)}
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-4 align-top text-sm text-[var(--text-main)]">
                      {customer.vat_number || '—'}
                    </td>

                    <td className="px-5 py-4 align-top text-sm text-[var(--text-main)]">
                      {customer.city || '—'}
                    </td>

                    <td className="px-5 py-4 align-top">
                      <div className="space-y-1">
                        <p className="text-sm text-[var(--text-main)]">
                          {customer.email || '—'}
                        </p>
                        <p className="text-xs text-[var(--text-soft)]">
                          {customer.phone || '—'}
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-4 align-top">
                      <span className="badge-neutral px-3 py-1 text-xs font-semibold">
                        {customer.project_count || 0}
                      </span>
                    </td>

                    <td className="px-5 py-4 align-top text-sm text-[var(--text-main)]">
                      {formatDate(customer.last_project_at)}
                    </td>

                    <td className="px-5 py-4 align-top">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/admin/customers/${customer.id}`}
                          className="btn-secondary btn-sm"
                        >
                          Open
                        </Link>

                        <Link
                          href={`/admin/customers/${customer.id}/edit`}
                          className="btn-secondary btn-sm"
                        >
                          Bewerk
                        </Link>

                        <Link
                          href={`/admin/projects/new?customer=${customer.id}`}
                          className="btn-primary btn-sm"
                        >
                          Nieuwe werf
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-3 p-4 lg:hidden">
        {paginatedCustomers.length === 0 ? (
          <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-5 text-sm text-[var(--text-soft)]">
            Geen klanten gevonden voor deze filters.
          </div>
        ) : (
          paginatedCustomers.map((customer) => (
            <div
              key={customer.id}
              className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--text-main)]">
                    {getCustomerName(customer)}
                  </p>
                </div>

                <span className="badge-neutral px-3 py-1 text-xs font-semibold">
                  {customer.project_count || 0} werven
                </span>
              </div>

              <div className="mt-4 grid gap-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-muted)]">Email</span>
                  <span className="truncate text-[var(--text-main)]">
                    {customer.email || '—'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-muted)]">BTW</span>
                  <span className="text-[var(--text-main)]">
                    {customer.vat_number || '—'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-muted)]">Stad</span>
                  <span className="text-[var(--text-main)]">
                    {customer.city || '—'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-muted)]">Laatste activiteit</span>
                  <span className="text-[var(--text-main)]">
                    {formatDate(customer.last_project_at)}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/admin/customers/${customer.id}`}
                  className="btn-secondary btn-sm"
                >
                  Open
                </Link>

                <Link
                  href={`/admin/customers/${customer.id}/edit`}
                  className="btn-secondary btn-sm"
                >
                  Bewerk
                </Link>

                <Link
                  href={`/admin/projects/new?customer=${customer.id}`}
                  className="btn-primary btn-sm"
                >
                  Nieuwe werf
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

        </>
      ) : null}

    </section>
  )
}