import Link from 'next/link'
import { redirect } from 'next/navigation'
import AppShell from '@/components/app-shell'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import CustomerList from './customer-list'
import CustomersMap from '@/components/customers/customers-map'
import {
  ArrowLeft,
  BadgeCheck,
  BarChart3,
  CircleDollarSign,
  FolderOpen,
  MapPin,
  PlusCircle,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react'

export default async function AdminCustomersPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role, full_name, company_name')
    .eq('id', user.id)
    .single()

  if (currentProfile?.role !== 'admin') {
    redirect('/dashboard')
  }

  const adminSupabase = createAdminClient()

  const { data: customers, error } = await adminSupabase
    .from('profiles')
    .select('*')
    .neq('role', 'admin')
    .order('company_name', { ascending: true })

  const safeCustomers = customers ?? []

  const customerIds = safeCustomers
    .map((customer: any) => customer.id)
    .filter(Boolean)

  let projectCounts = new Map<string, number>()
  let latestProjectDates = new Map<string, string | null>()
  let invoiceReadyCount = 0
  let unpaidProjectsCount = 0
  let paidProjectsCount = 0
  let totalQuotedAmount = 0
  let paidRevenueAmount = 0
  let projectsError: any = null

  if (customerIds.length > 0) {
    const { data: projects, error: pError } = await adminSupabase
      .from('projects')
      .select('*')
      .in('user_id', customerIds)

    projectsError = pError

    if (projects) {
      for (const project of projects) {
        const key = String(project.user_id)
        projectCounts.set(key, (projectCounts.get(key) ?? 0) + 1)

        const currentLatest = latestProjectDates.get(key)
        if (!currentLatest) {
          latestProjectDates.set(key, project.created_at ?? null)
        } else if (
          project.created_at &&
          new Date(project.created_at).getTime() >
            new Date(currentLatest).getTime()
        ) {
          latestProjectDates.set(key, project.created_at)
        }

        const priceValue = Number(project.price)
        const hasPrice =
          project.price !== null &&
          project.price !== undefined &&
          Number.isFinite(priceValue) &&
          priceValue > 0
        const isPaid = Boolean(project.is_paid ?? project.paid)
        const isBillingRelevant =
          hasPrice || project.status === 'facturatie' || project.status === 'factuur_verstuurd' || isPaid

        if (isBillingRelevant) {
          if (hasPrice) {
            totalQuotedAmount += priceValue
          }

          invoiceReadyCount += 1

          if (isPaid) {
            paidProjectsCount += 1
            if (hasPrice) {
              paidRevenueAmount += priceValue
            }
          } else {
            unpaidProjectsCount += 1
          }
        }
      }
    }
  }

  const customersWithMeta = safeCustomers.map((customer: any) => ({
    ...customer,
    project_count: projectCounts.get(String(customer.id)) ?? 0,
    last_project_at: latestProjectDates.get(String(customer.id)) ?? null,
  }))

  const totalCustomers = customersWithMeta.length
  const totalCustomerProjects = customersWithMeta.reduce(
    (sum: number, customer: any) => sum + (customer.project_count || 0),
    0
  )
  const activeCustomers = customersWithMeta.filter(
    (customer: any) => customer.is_active !== false
  ).length
  const customersWithVat = customersWithMeta.filter(
    (customer: any) => customer.vat_number
  ).length
  const formattedQuotedAmount = new Intl.NumberFormat('nl-BE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(totalQuotedAmount)
  const formattedPaidRevenue = new Intl.NumberFormat('nl-BE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(paidRevenueAmount)

  const latestCustomer =
    [...customersWithMeta].sort(
      (a: any, b: any) =>
        new Date(b.created_at ?? 0).getTime() -
        new Date(a.created_at ?? 0).getTime()
    )[0] ?? null

  const latestCustomerLabel =
    latestCustomer?.company_name ||
    latestCustomer?.full_name ||
    latestCustomer?.email ||
    '—'

  const mostActiveCustomer =
    [...customersWithMeta].sort(
      (a: any, b: any) => (b.project_count || 0) - (a.project_count || 0)
    )[0] ?? null

  const mostActiveCustomerLabel =
    mostActiveCustomer?.company_name ||
    mostActiveCustomer?.full_name ||
    mostActiveCustomer?.email ||
    '—'

  const averageProjectsPerCustomer =
    totalCustomers > 0
      ? (
          customersWithMeta.reduce(
            (sum: number, customer: any) => sum + (customer.project_count || 0),
            0
          ) / totalCustomers
        ).toFixed(1)
      : '0.0'

  const customerLocations = customersWithMeta
    .map((customer: any) => {
      const latitude = Number(customer.latitude)
      const longitude = Number(customer.longitude)

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null
      }

      return {
        name:
          customer.company_name ||
          customer.full_name ||
          customer.city ||
          customer.email ||
          'Klant',
        latitude,
        longitude,
      }
    })
    .filter(Boolean) as { name: string; latitude: number; longitude: number }[]

  const mapLocations =
    customerLocations.length > 0
      ? customerLocations
      : [
          { name: 'Antwerpen', latitude: 51.2195, longitude: 4.4025 },
          { name: 'Brussel', latitude: 50.8503, longitude: 4.3517 },
          { name: 'Gent', latitude: 51.0543, longitude: 3.7196 },
          { name: 'Charleroi', latitude: 50.4108, longitude: 4.4446 },
          { name: 'Liège', latitude: 50.6292, longitude: 5.5693 },
          { name: 'Leuven', latitude: 50.8798, longitude: 4.7005 },
          { name: 'Mons', latitude: 50.4501, longitude: 3.9557 },
          { name: 'Tournai', latitude: 50.6041, longitude: 3.3891 },
          { name: 'Ypres', latitude: 50.8769, longitude: 2.8849 },
          { name: 'Hasselt', latitude: 50.9309, longitude: 5.3345 },
        ]

  const hasLoadError = Boolean(error || projectsError)

  return (
    <AppShell isAdmin>
      <div className="space-y-2">
        <section className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
          <div className="relative border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-3 sm:px-5">
            <div className="absolute inset-0 opacity-30">
              <div className="h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(242,140,58,0.18),transparent_35%),radial-gradient(circle_at_left,rgba(255,255,255,0.05),transparent_25%)]" />
            </div>

            <div className="relative flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-semibold text-[var(--text-main)] sm:text-2xl">
                  Klantenbeheer
                </h1>
              </div>

              <div className="w-full xl:ml-auto xl:max-w-[820px]">
                <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(245,140,55,0.08),rgba(245,140,55,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Klanten</p>
                        <p className="mt-1 text-lg font-semibold text-[var(--accent)]">{totalCustomers}</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)]/10">
                        <Users className="h-4.5 w-4.5 text-[var(--accent)]" />
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(245,140,55,0.08),rgba(245,140,55,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Werven</p>
                        <p className="mt-1 text-lg font-semibold text-[var(--accent)]">{totalCustomerProjects}</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)]/10">
                        <FolderOpen className="h-4.5 w-4.5 text-[var(--accent)]" />
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(76,175,80,0.08),rgba(76,175,80,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Actief</p>
                        <p className="mt-1 text-lg font-semibold text-green-500">{activeCustomers}</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10">
                        <UserCheck className="h-4.5 w-4.5 text-green-500" />
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(33,150,243,0.08),rgba(33,150,243,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Met btw</p>
                        <p className="mt-1 text-lg font-semibold text-blue-500">{customersWithVat}</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                        <BadgeCheck className="h-4.5 w-4.5 text-blue-500" />
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(156,39,176,0.08),rgba(156,39,176,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Facturatie</p>
                        <p className="mt-1 text-lg font-semibold text-purple-500">{invoiceReadyCount}</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10">
                        <Wallet className="h-4.5 w-4.5 text-purple-500" />
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(245,158,11,0.08),rgba(245,158,11,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Openstaand</p>
                        <p className="mt-1 text-lg font-semibold text-amber-400">{unpaidProjectsCount}</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400/10">
                        <Wallet className="h-4.5 w-4.5 text-amber-400" />
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(6,182,212,0.08),rgba(6,182,212,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Betaald</p>
                        <p className="mt-1 text-lg font-semibold text-cyan-400">{paidProjectsCount}</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-400/10">
                        <BadgeCheck className="h-4.5 w-4.5 text-cyan-400" />
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(236,72,153,0.08),rgba(236,72,153,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Omzet</p>
                        <p className="mt-1 text-sm font-semibold text-pink-400">{formattedPaidRevenue}</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-pink-400/10">
                        <CircleDollarSign className="h-4.5 w-4.5 text-pink-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid items-stretch gap-2 px-4 py-3 sm:px-5 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card-2)]">
              <div className="border-b border-[var(--border-soft)] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Klantenkaart
                </p>
                <p className="mt-1 text-xs text-[var(--text-soft)]">
                  Visueel overzicht van alle klantlocaties en spreiding.
                </p>
              </div>

              <div id="klantenkaart" className="min-h-[180px] flex-1 sm:min-h-[220px] xl:min-h-0">
                <CustomersMap locations={mapLocations} height="100%" />
              </div>
            </div>

            <div className="flex h-full flex-col rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Sneltoetsen
                </p>
                <p className="mt-1 text-xs text-[var(--text-soft)]">
                  Snelle toegang tot de belangrijkste klantacties.
                </p>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <Link
                  href="/admin/customers/new"
                  className="group relative overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-3 transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)]/80"
                >
                  <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
                  <div className="flex items-start gap-2.5 pr-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
                      <PlusCircle className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold leading-5 text-[var(--text-main)]">
                        Nieuwe klant
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-4 text-[var(--text-soft)]">
                        Maak meteen een nieuwe klantfiche aan.
                      </span>
                    </span>
                  </div>
                </Link>

                <Link
                  href="/admin/customers/statistics"
                  className="group relative overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-3 transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)]/80"
                >
                  <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
                  <div className="flex items-start gap-2.5 pr-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
                      <BarChart3 className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold leading-5 text-[var(--text-main)]">
                        Statistieken
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-4 text-[var(--text-soft)]">
                        Bekijk groei, spreiding en activiteit.
                      </span>
                    </span>
                  </div>
                </Link>

                <Link
                  href="#klantenkaart"
                  className="group relative overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-3 transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)]/80"
                >
                  <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
                  <div className="flex items-start gap-2.5 pr-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold leading-5 text-[var(--text-main)]">
                        Klantenkaart
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-4 text-[var(--text-soft)]">
                        Spring direct naar alle zichtbare locaties.
                      </span>
                    </span>
                  </div>
                </Link>

                {latestCustomer ? (
                  <Link
                    href={`/admin/customers/${latestCustomer.id}`}
                    className="group relative overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-3 transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)]/80"
                  >
                    <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
                    <div className="flex items-start gap-2.5 pr-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
                        <Users className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[13px] font-semibold leading-5 text-[var(--text-main)]">
                          Recente klant
                        </span>
                        <span className="mt-0.5 block truncate text-[11px] leading-4 text-[var(--text-soft)]">
                          {latestCustomerLabel}
                        </span>
                      </span>
                    </div>
                  </Link>
                ) : (
                  <Link
                    href="/admin"
                    className="group relative overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-3 transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)]/80"
                  >
                    <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
                    <div className="flex items-start gap-2.5 pr-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
                        <Users className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[13px] font-semibold leading-5 text-[var(--text-main)]">
                          Klantenoverzicht
                        </span>
                        <span className="mt-0.5 block text-[11px] leading-4 text-[var(--text-soft)]">
                          Er zijn nog geen recente klantfiches beschikbaar.
                        </span>
                      </span>
                    </div>
                  </Link>
                )}
              </div>

              <div className="mt-2 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-3.5 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  Snelle info
                </p>
                <div className="mt-1.5 grid gap-2 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Top klant</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                      {mostActiveCustomerLabel}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-soft)]">
                      {mostActiveCustomer?.project_count ?? 0} werf(en)
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Gemiddeld</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                      {averageProjectsPerCustomer}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-soft)]">
                      Werven per klant
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Facturatie</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                      {formattedQuotedAmount}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-soft)]">
                      {invoiceReadyCount} dossier(s), {unpaidProjectsCount} openstaand
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {hasLoadError && (
          <section className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm text-red-200 shadow-sm">
            Klanten of projectkoppelingen konden niet volledig geladen worden.
          </section>
        )}

        <CustomerList customers={customersWithMeta} hideResultsUntilSearch />
      </div>
    </AppShell>
  )
}