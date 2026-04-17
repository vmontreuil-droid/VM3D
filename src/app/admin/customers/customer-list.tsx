'use client'

import Link from 'next/link'
import { ArrowUpDown, Edit, Eye } from 'lucide-react'
import { useMemo, useState } from 'react'
import AdminCustomerActions from './admin-customer-actions'
import { useT } from '@/i18n/context'

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
  is_active?: boolean | null
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

function getCustomerName(customer: CustomerItem, fallback = 'Onbekende klant') {
  return (
    customer.company_name ||
    customer.full_name ||
    customer.email ||
    fallback
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

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return '—'
  try {
    const loc = locale === 'fr' ? 'fr-BE' : locale === 'en' ? 'en-US' : 'nl-BE'
    return new Date(value).toLocaleDateString(loc)
  } catch {
    return '—'
  }
}

function getActionButtonClass(tone: 'neutral' | 'blue' | 'orange' | 'green') {
  const shared =
    'group relative inline-flex h-8 items-center gap-1.5 overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-2.5 text-[10px] font-semibold text-[var(--text-main)] transition hover:-translate-y-px'

  switch (tone) {
    case 'blue':
      return `${shared} hover:border-sky-400/45 hover:bg-[var(--bg-card)]/80`
    case 'orange':
      return `${shared} hover:border-[var(--accent)]/45 hover:bg-[var(--bg-card)]/80`
    case 'green':
      return `${shared} hover:border-emerald-400/45 hover:bg-[var(--bg-card)]/80`
    default:
      return `${shared} hover:border-white/15 hover:bg-[var(--bg-card)]/80`
  }
}

export default function CustomerList({
  customers,
  hideResultsUntilSearch = false,
  embedded = false,
}: Props) {
  const { t, locale } = useT()
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
                {embedded ? t.customerList.quickSearch : t.customerList.customerListTitle}
              </p>
              <h2 className="mt-1 text-[13px] font-semibold leading-5 text-[var(--text-main)]">
                {embedded ? t.customerList.customers : t.customerList.allCustomers}
              </h2>
              <p className="mt-0.5 text-[11px] leading-4 text-[var(--text-soft)]">
                {t.customerList.searchDesc}
              </p>
            </div>

            {embedded ? null : (
              <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2 text-right">
                <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  {t.customerList.results}
                </p>
                <p className="mt-1 text-base font-semibold text-[var(--text-main)]">
                  {visibleCustomers.length}
                </p>
              </div>
            )}
          </div>

          <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_210px_150px_auto]">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              placeholder={t.customerList.searchPlaceholder}
              className="input-dark h-9 w-full px-3 py-1.5 text-[12px]"
            />

            <select
              value={sortKey}
              onChange={(e) => handleSort(e.target.value as SortKey)}
              className="input-dark h-9 w-full px-3 py-1.5 text-[12px]"
            >
              <option value="name">{t.customerList.sortByName}</option>
              <option value="city">{t.customerList.sortByCity}</option>
              <option value="email">{t.customerList.sortByEmail}</option>
              <option value="vat_number">{t.customerList.sortByVat}</option>
              <option value="project_count">{t.customerList.sortBySites}</option>
              <option value="last_project_at">{t.customerList.sortByActivity}</option>
            </select>

            <button
              type="button"
              onClick={() => {
                setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
                setCurrentPage(1)
              }}
              className="btn-secondary btn-sm w-full"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              <span>{sortDirection === 'asc' ? t.customerList.asc : t.customerList.desc}</span>
            </button>

            <button
              type="button"
              onClick={resetFilters}
              className="btn-secondary btn-sm w-full"
            >
              {t.customerList.reset}
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
                  {t.customerList.results}
                </p>
                <h4 className="mt-0.5 text-[12px] font-semibold leading-5 text-[var(--text-main)]">
                  {t.customerList.customers}
                </h4>
              </div>
              <p className="text-[10px] text-[var(--text-soft)]">
                {visibleCustomers.length} {t.customerList.found}
              </p>
            </div>

            {visibleCustomers.length === 0 ? (
              <div className="px-3.5 py-4 text-[12px] text-[var(--text-soft)]">
                {t.customerList.noCustomersFound}
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-soft)]">
                {visibleCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="flex flex-col gap-2.5 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-[13px] font-semibold text-[var(--text-main)]">
                          {getCustomerName(customer, t.customerList.unknownCustomer)}
                        </p>
                        <span className="badge-neutral px-2 py-0.5 text-[10px] font-semibold">
                          {customer.project_count || 0} {t.customerList.sites}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            customer.is_active === false ? 'badge-warning' : 'badge-success'
                          }`}
                        >
                          {customer.is_active === false ? t.customerList.inactive : t.customerList.active}
                        </span>
                      </div>

                      <p className="mt-0.5 text-[11px] text-[var(--text-soft)]">
                        {[customer.phone, customer.email, customer.city]
                          .filter(Boolean)
                          .join(' · ') || t.customerList.noExtraData}
                      </p>

                      <div className="mt-1.5 flex flex-wrap gap-1.5 text-[10px] text-[var(--text-soft)]">
                        <span className="rounded-full border border-[var(--border-soft)] bg-[var(--bg-card)] px-2 py-0.5">
                          {t.customerList.vat}: {customer.vat_number || '—'}
                        </span>
                        <span className="rounded-full border border-[var(--border-soft)] bg-[var(--bg-card)] px-2 py-0.5">
                          {t.customerList.lastActivity}: {formatDate(customer.last_project_at, locale)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 sm:justify-end">
                      <Link
                        href={`/admin/customers/${customer.id}`}
                        className={getActionButtonClass('blue')}
                      >
                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-sky-500/12 text-sky-300">
                          <Eye className="h-3 w-3" />
                        </span>
                        <span className="pr-1">{t.customerList.open}</span>
                        <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-sky-400/80" />
                      </Link>

                      <Link
                        href={`/admin/customers/${customer.id}/edit`}
                        className={getActionButtonClass('neutral')}
                      >
                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white/5 text-[var(--text-soft)]">
                          <Edit className="h-3 w-3" />
                        </span>
                        <span className="pr-1">{t.customerList.edit}</span>
                        <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-white/25" />
                      </Link>

                      <AdminCustomerActions
                        customerId={customer.id}
                        customerName={getCustomerName(customer, t.customerList.unknownCustomer)}
                        currentActive={customer.is_active}
                        compact
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}

    </section>
  )
}