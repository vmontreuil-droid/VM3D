'use client'

import Link from 'next/link'
import { Edit, Eye, PlusCircle, Ticket } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useT } from '@/i18n/context'
import { getStatusLabel as getStatusLabelLib } from '@/lib/status'

type CustomerItem = {
  id: string
  full_name?: string | null
  company_name?: string | null
  email?: string | null
  vat_number?: string | null
  city?: string | null
  phone?: string | null
  project_count?: number
  last_project_at?: string | null
}

type ProjectItem = {
  id: string | number
  name?: string | null
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

type Props = {
  customers: CustomerItem[]
  projects: ProjectItem[]
}

function getCustomerName(customer: CustomerItem, fallback: string) {
  return (
    customer.company_name ||
    customer.full_name ||
    customer.email ||
    fallback
  )
}

function getProjectCustomerName(project: ProjectItem) {
  return (
    project.profiles?.company_name ||
    project.profiles?.full_name ||
    project.profiles?.email ||
    '—'
  )
}

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return '—'

  const loc = locale === 'fr' ? 'fr-BE' : locale === 'en' ? 'en-US' : 'nl-BE'
  try {
    return new Date(value).toLocaleDateString(loc)
  } catch {
    return '—'
  }
}

function getStatusClass(status?: string | null) {
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

export default function AdminSearchPanel({ customers, projects }: Props) {
  const { t, locale } = useT()
  const unknownCustomerLabel = t.adminSearchPanel.unknownCustomer
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const query = search.trim().toLowerCase()

  const filteredCustomers = useMemo(() => {
    if (!query) return []

    return customers.filter((customer) => {
      const values = [
        getCustomerName(customer, unknownCustomerLabel),
        customer.vat_number || '',
        customer.city || '',
        customer.email || '',
        customer.phone || '',
      ]
        .join(' ')
        .toLowerCase()

      return values.includes(query)
    })
  }, [customers, query, unknownCustomerLabel])

  const filteredProjects = useMemo(() => {
    if (!query) return []

    return projects.filter((project) => {
      const haystack = [
        project.name,
        project.description,
        project.address,
        project.status,
        getProjectCustomerName(project),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      const matchesSearch = haystack.includes(query)
      const matchesStatus = statusFilter === '' || project.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [projects, query, statusFilter])

  function resetSearch() {
    setSearch('')
    setStatusFilter('')
  }

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
      <div className="space-y-2.5 border-b border-[var(--border-soft)] px-4 py-3 sm:px-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              {t.adminSearchPanel.quickSearch}
            </p>
            <h3 className="mt-1 text-[13px] font-semibold leading-5 text-[var(--text-main)]">
              {t.adminSearchPanel.customers} &amp; {t.adminSearchPanel.sites}
            </h3>
            <p className="mt-0.5 text-[11px] leading-4 text-[var(--text-soft)]">
              {t.adminSearchPanel.combinedSearchDesc}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="badge badge-info text-[10px] font-semibold px-2 py-0.5">
              {customers.length} {t.adminSearchPanel.customers.toLowerCase()}
            </span>
            <span className="badge badge-info text-[10px] font-semibold px-2 py-0.5">
              {projects.length} {t.adminSearchPanel.sites.toLowerCase()}
            </span>
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-[1fr_auto]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.adminSearchPanel.combinedSearchPlaceholder}
            className="input-dark h-9 w-full px-3 py-1.5 text-[12px]"
          />

          {search.trim() ? (
            <button
              type="button"
              onClick={resetSearch}
              className="group relative flex h-9 items-center overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 text-[10px] font-medium text-[var(--text-main)] transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)]/80"
            >
              <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
              <span className="pr-2">{t.adminSearchPanel.reset}</span>
            </button>
          ) : (
            <div className="hidden md:block" />
          )}
        </div>

        {query ? (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-dark h-9 w-full px-3 py-1.5 text-[12px]"
          >
            <option value="">{t.adminSearchPanel.allStatuses}</option>
            <option value="ingediend">{getStatusLabelLib('ingediend', t)}</option>
            <option value="in_behandeling">{getStatusLabelLib('in_behandeling', t)}</option>
            <option value="klaar_voor_betaling">{getStatusLabelLib('klaar_voor_betaling', t)}</option>
            <option value="afgerond">{getStatusLabelLib('afgerond', t)}</option>
          </select>
        ) : null}
      </div>

      {query ? (
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3.5 sm:px-5">
          {filteredCustomers.length > 0 || query ? (
            <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)]">
              <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-3.5 py-2.5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                    {t.adminSearchPanel.results}
                  </p>
                  <h4 className="mt-0.5 text-[12px] font-semibold leading-5 text-[var(--text-main)]">
                    {t.adminSearchPanel.customers}
                  </h4>
                </div>
                <p className="text-[10px] text-[var(--text-soft)]">
                  {filteredCustomers.length} {t.adminSearchPanel.found}
                </p>
              </div>

              {filteredCustomers.length === 0 ? (
                <div className="px-3.5 py-4 text-[12px] text-[var(--text-soft)]">
                  {t.adminSearchPanel.noCustomersFound}
                </div>
              ) : (
                <div className="divide-y divide-[var(--border-soft)]">
                  {filteredCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      className="flex flex-col gap-2.5 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-[var(--text-main)]">
                          {getCustomerName(customer, unknownCustomerLabel)}
                        </p>
                        <p className="mt-0.5 text-[11px] text-[var(--text-soft)]">
                          {[customer.phone, customer.email, customer.city]
                            .filter(Boolean)
                            .join(' · ') || t.adminSearchPanel.noExtraData}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1.5 sm:justify-end">
                        <Link
                          href={`/admin/customers/${customer.id}`}
                          className={getActionButtonClass('blue')}
                        >
                          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-sky-500/12 text-sky-300">
                            <Eye className="h-3 w-3" />
                          </span>
                          <span className="pr-1">{t.adminSearchPanel.open}</span>
                          <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-sky-400/80" />
                        </Link>
                        <Link
                          href={`/admin/customers/${customer.id}/edit`}
                          className={getActionButtonClass('neutral')}
                        >
                          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white/5 text-[var(--text-soft)]">
                            <Edit className="h-3 w-3" />
                          </span>
                          <span className="pr-1">{t.adminSearchPanel.edit}</span>
                          <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-white/25" />
                        </Link>
                        <Link
                          href={`/admin/projects/new?customer=${customer.id}`}
                          className={getActionButtonClass('orange')}
                        >
                          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--accent)]/12 text-amber-100">
                            <PlusCircle className="h-3 w-3" />
                          </span>
                          <span className="pr-1">{t.adminSearchPanel.newSite}</span>
                          <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/85" />
                        </Link>
                        <Link
                          href={`/admin/tickets?customer=${customer.id}`}
                          className={getActionButtonClass('green')}
                        >
                          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500/12 text-emerald-200">
                            <Ticket className="h-3 w-3" />
                          </span>
                          <span className="pr-1">{t.adminSearchPanel.ticket}</span>
                          <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-emerald-400/80" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {filteredProjects.length > 0 || query ? (
            <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)]">
              <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-3.5 py-2.5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                    {t.adminSearchPanel.results}
                  </p>
                  <h4 className="mt-0.5 text-[12px] font-semibold leading-5 text-[var(--text-main)]">
                    {t.adminSearchPanel.sites}
                  </h4>
                </div>
                <p className="text-[10px] text-[var(--text-soft)]">
                  {filteredProjects.length} {t.adminSearchPanel.found}
                </p>
              </div>

              {filteredProjects.length === 0 ? (
                <div className="px-3.5 py-4 text-[12px] text-[var(--text-soft)]">
                  {t.adminSearchPanel.noSitesFound}
                </div>
              ) : (
                <div className="divide-y divide-[var(--border-soft)]">
                  {filteredProjects.map((project) => (
                    <div
                      key={String(project.id)}
                      className="flex flex-col gap-2.5 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-[var(--text-main)]">
                          {project.name || '—'}
                        </p>
                        <p className="mt-0.5 text-[11px] text-[var(--text-soft)]">
                          {[project.address, getProjectCustomerName(project), formatDate(project.created_at, locale)]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                        <div className="mt-1.5">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusClass(
                              project.status
                            )}`}
                          >
                            {getStatusLabelLib(project.status ?? '', t)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 sm:justify-end">
                        <Link
                          href={`/admin/projects/${project.id}`}
                          className={getActionButtonClass('blue')}
                        >
                          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-sky-500/12 text-sky-300">
                            <Eye className="h-3 w-3" />
                          </span>
                          <span className="pr-1">{t.adminSearchPanel.open}</span>
                          <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-sky-400/80" />
                        </Link>
                        <Link
                          href={`/admin/projects/${project.id}/edit`}
                          className={getActionButtonClass('neutral')}
                        >
                          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white/5 text-[var(--text-soft)]">
                            <Edit className="h-3 w-3" />
                          </span>
                          <span className="pr-1">{t.adminSearchPanel.edit}</span>
                          <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-white/25" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
