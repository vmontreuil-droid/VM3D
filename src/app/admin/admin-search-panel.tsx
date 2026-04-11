'use client'

import Link from 'next/link'
import { Edit, Eye, PlusCircle, Ticket } from 'lucide-react'
import { useMemo, useState } from 'react'

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
  title?: string | null
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

function getCustomerName(customer: CustomerItem) {
  return (
    customer.company_name ||
    customer.full_name ||
    customer.email ||
    'Onbekende klant'
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

function formatDate(value?: string | null) {
  if (!value) return '—'

  try {
    return new Date(value).toLocaleDateString('nl-BE')
  } catch {
    return '—'
  }
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
      return 'badge-info'
    case 'in_behandeling':
      return 'badge-warning'
    case 'klaar_voor_betaling':
      return 'badge-warning'
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
  const [customerSearch, setCustomerSearch] = useState('')
  const [projectSearch, setProjectSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase()
    if (!q) return []

    return customers.filter((customer) => {
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
  }, [customers, customerSearch])

  const filteredProjects = useMemo(() => {
    const q = projectSearch.trim().toLowerCase()
    if (!q) return []

    return projects.filter((project) => {
      const haystack = [
        project.title,
        project.description,
        project.address,
        project.status,
        getProjectCustomerName(project),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      const matchesSearch = haystack.includes(q)
      const matchesStatus = statusFilter === '' || project.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [projects, projectSearch, statusFilter])

  function resetCustomerSearch() {
    setCustomerSearch('')
  }

  function resetProjectSearch() {
    setProjectSearch('')
    setStatusFilter('')
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
      <div className="grid gap-4 px-4 py-3 sm:px-5 lg:grid-cols-2">
        <div className="space-y-2.5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Snelle zoekopdracht
            </p>
            <h3 className="mt-1 text-[13px] font-semibold leading-5 text-[var(--text-main)]">
              Klanten
            </h3>
            <p className="mt-0.5 text-[11px] leading-4 text-[var(--text-soft)]">
              Zoek rechtstreeks op klantnaam, btw, stad of e-mail.
            </p>
          </div>

          <div className="grid gap-2 md:grid-cols-[1fr_auto]">
            <input
              type="text"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              placeholder="Zoek klant, btw, stad, mail..."
              className="input-dark h-9 w-full px-3 py-1.5 text-[12px]"
            />

            {customerSearch.trim() ? (
              <button
                type="button"
                onClick={resetCustomerSearch}
                className="group relative flex h-9 items-center overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 text-[10px] font-medium text-[var(--text-main)] transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)]/80"
              >
                <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
                <span className="pr-2">Reset</span>
              </button>
            ) : (
              <div className="hidden md:block" />
            )}
          </div>
        </div>

        <div className="space-y-2.5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Snelle zoekopdracht
            </p>
            <h3 className="mt-1 text-[13px] font-semibold leading-5 text-[var(--text-main)]">
              Werven
            </h3>
            <p className="mt-0.5 text-[11px] leading-4 text-[var(--text-soft)]">
              Zoek en filter op project, klant of locatie.
            </p>
          </div>

          <div className="grid gap-2 md:grid-cols-[1fr_auto]">
            <input
              type="text"
              value={projectSearch}
              onChange={(e) => setProjectSearch(e.target.value)}
              placeholder="Zoek project, klant of locatie..."
              className="input-dark h-9 w-full px-3 py-1.5 text-[12px]"
            />

            {projectSearch.trim() ? (
              <button
                type="button"
                onClick={resetProjectSearch}
                className="group relative flex h-9 items-center overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 text-[10px] font-medium text-[var(--text-main)] transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)]/80"
              >
                <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
                <span className="pr-2">Reset</span>
              </button>
            ) : (
              <div className="hidden md:block" />
            )}
          </div>

          {projectSearch.trim() ? (
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
          ) : null}
        </div>
      </div>

      {(customerSearch.trim() || projectSearch.trim()) ? (
        <div className="space-y-3 border-t border-[var(--border-soft)] px-4 py-3.5 sm:px-5">
          {customerSearch.trim() ? (
            <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)]">
              <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-3.5 py-2.5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                    Resultaten
                  </p>
                  <h4 className="mt-0.5 text-[12px] font-semibold leading-5 text-[var(--text-main)]">
                    Klanten
                  </h4>
                </div>
                <p className="text-[10px] text-[var(--text-soft)]">
                  {filteredCustomers.length} gevonden
                </p>
              </div>

              {filteredCustomers.length === 0 ? (
                <div className="px-3.5 py-4 text-[12px] text-[var(--text-soft)]">
                  Geen klanten gevonden voor deze zoekopdracht.
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
                          {getCustomerName(customer)}
                        </p>
                        <p className="mt-0.5 text-[11px] text-[var(--text-soft)]">
                          {[customer.phone, customer.email, customer.city]
                            .filter(Boolean)
                            .join(' · ') || 'Geen extra gegevens'}
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
                          <span className="pr-1">Open</span>
                          <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-sky-400/80" />
                        </Link>
                        <Link
                          href={`/admin/customers/${customer.id}/edit`}
                          className={getActionButtonClass('neutral')}
                        >
                          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white/5 text-[var(--text-soft)]">
                            <Edit className="h-3 w-3" />
                          </span>
                          <span className="pr-1">Bewerk</span>
                          <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-white/25" />
                        </Link>
                        <Link
                          href={`/admin/projects/new?customer=${customer.id}`}
                          className={getActionButtonClass('orange')}
                        >
                          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--accent)]/12 text-amber-100">
                            <PlusCircle className="h-3 w-3" />
                          </span>
                          <span className="pr-1">Nieuwe werf</span>
                          <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/85" />
                        </Link>
                        <Link
                          href={`/admin/tickets?customer=${customer.id}`}
                          className={getActionButtonClass('green')}
                        >
                          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500/12 text-emerald-200">
                            <Ticket className="h-3 w-3" />
                          </span>
                          <span className="pr-1">Ticket</span>
                          <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-emerald-400/80" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {projectSearch.trim() ? (
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
                  {filteredProjects.length} gevonden
                </p>
              </div>

              {filteredProjects.length === 0 ? (
                <div className="px-3.5 py-4 text-[12px] text-[var(--text-soft)]">
                  Geen werven gevonden voor deze zoekopdracht.
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
                          {project.title || '—'}
                        </p>
                        <p className="mt-0.5 text-[11px] text-[var(--text-soft)]">
                          {[project.address, getProjectCustomerName(project), formatDate(project.created_at)]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                        <div className="mt-1.5">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusClass(
                              project.status
                            )}`}
                          >
                            {getStatusLabel(project.status)}
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
                          <span className="pr-1">Open</span>
                          <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-sky-400/80" />
                        </Link>
                        <Link
                          href={`/admin/projects/${project.id}/edit`}
                          className={getActionButtonClass('neutral')}
                        >
                          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white/5 text-[var(--text-soft)]">
                            <Edit className="h-3 w-3" />
                          </span>
                          <span className="pr-1">Bewerk</span>
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
