import Link from 'next/link'
import { redirect } from 'next/navigation'
import AppShell from '@/components/app-shell'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import CustomerList from './customer-list'
import CustomersMap from '@/components/customers/customers-map'

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
  let projectsError: any = null

  if (customerIds.length > 0) {
    const { data: projects, error: pError } = await adminSupabase
      .from('projects')
      .select('id, user_id, created_at, status')
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
      }
    }
  }

  const customersWithMeta = safeCustomers.map((customer: any) => ({
    ...customer,
    project_count: projectCounts.get(String(customer.id)) ?? 0,
    last_project_at: latestProjectDates.get(String(customer.id)) ?? null,
  }))

  const totalCustomers = customersWithMeta.length
  const customersWithVat = customersWithMeta.filter(
    (customer: any) => customer.vat_number
  ).length
  const customersWithEmail = customersWithMeta.filter(
    (customer: any) => customer.email
  ).length
  const customersWithProjects = customersWithMeta.filter(
    (customer: any) => customer.project_count > 0
  ).length

  const latestCustomer = customersWithMeta[0] ?? null
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

  const hasLoadError = Boolean(error || projectsError)

  return (
    <AppShell isAdmin>
      <div className="space-y-3 sm:space-y-4 lg:space-y-5">
        <section className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
          <div className="relative border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-5 sm:px-5">
            <div className="absolute inset-0 opacity-30">
              <div className="h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(242,140,58,0.18),transparent_35%),radial-gradient(circle_at_left,rgba(255,255,255,0.05),transparent_25%)]" />
            </div>

            <div className="relative flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href="/admin" className="btn-secondary">
                    ← Admin
                  </Link>

                  <Link href="/admin/customers/new" className="btn-primary">
                    + Nieuwe klant
                  </Link>

                  <Link href="/admin/projects/new" className="btn-secondary">
                    + Nieuw project
                  </Link>

                  {latestCustomer ? (
                    <Link
                      href={`/admin/customers/${latestCustomer.id}`}
                      className="btn-secondary"
                    >
                      Laatste klant
                    </Link>
                  ) : null}
                </div>

                <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                  Klantenbeheer
                </p>

                <h1 className="mt-2 text-2xl font-semibold text-[var(--text-main)] sm:text-3xl">
                  Klanten
                </h1>

                <p className="mt-2.5 max-w-3xl text-sm leading-6 text-[var(--text-soft)]">
                  Overzicht van alle klanten met snelle toegang tot fiche,
                  bewerking en projectopvolging.
                </p>
              </div>

              <div className="flex w-full flex-col gap-4 xl:w-auto">
                <div className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)]/80 shadow-sm backdrop-blur">
                  <div className="flex items-center gap-4 px-4 py-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)] text-xl font-bold text-white shadow-sm">
                      KL
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                        Module
                      </p>
                      <p className="mt-1 truncate text-sm font-semibold text-[var(--text-main)]">
                        Klantenbeheer
                      </p>
                      <p className="mt-1 text-xs text-[var(--text-soft)]">
                        Fiches, relaties en opvolging
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 xl:w-auto xl:grid-cols-4">
                  <div className="card-mini text-center">
                    <p className="text-xs text-[var(--text-muted)]">Totaal</p>
                    <p className="text-lg font-semibold text-[var(--text-main)]">
                      {totalCustomers}
                    </p>
                  </div>

                  <div className="card-mini text-center">
                    <p className="text-xs text-[var(--text-muted)]">Met btw</p>
                    <p className="text-lg font-semibold text-[var(--text-main)]">
                      {customersWithVat}
                    </p>
                  </div>

                  <div className="card-mini text-center">
                    <p className="text-xs text-[var(--text-muted)]">Met e-mail</p>
                    <p className="text-lg font-semibold text-[var(--text-main)]">
                      {customersWithEmail}
                    </p>
                  </div>

                  <div className="card-mini text-center">
                    <p className="text-xs text-[var(--text-muted)]">Met projecten</p>
                    <p className="text-lg font-semibold text-[var(--text-main)]">
                      {customersWithProjects}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 px-4 py-4 sm:px-5 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Snelle info
              </p>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">Laatste klant</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {latestCustomerLabel}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-soft)]">
                    {latestCustomer?.city || latestCustomer?.email || '—'}
                  </p>
                </div>

                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">Meeste projecten</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {mostActiveCustomerLabel}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-soft)]">
                    {mostActiveCustomer?.project_count ?? 0} project(en)
                  </p>
                </div>

                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">
                    Recentste projectactiviteit
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {latestCustomer?.last_project_at
                      ? new Date(
                          latestCustomer.last_project_at
                        ).toLocaleDateString('nl-BE')
                      : '—'}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-soft)]">
                    Laatste activiteit bij recente klant
                  </p>
                </div>

                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">
                    Gemiddelde koppeling
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {averageProjectsPerCustomer}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-soft)]">
                    Projecten per klant
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Quick actions
              </p>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Link
                  href="/admin/customers/new"
                  className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-4 transition hover:border-[var(--accent)]/40 hover:bg-[var(--bg-card)]/80"
                >
                  <p className="text-sm font-semibold text-[var(--text-main)]">
                    Nieuwe klant
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-soft)]">
                    Maak meteen een nieuwe klantfiche aan.
                  </p>
                </Link>

                <Link
                  href="/admin/projects/new"
                  className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-4 transition hover:border-[var(--accent)]/40 hover:bg-[var(--bg-card)]/80"
                >
                  <p className="text-sm font-semibold text-[var(--text-main)]">
                    Nieuw project
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-soft)]">
                    Start snel een dossier voor een klant.
                  </p>
                </Link>

                <Link
                  href="/admin"
                  className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-4 transition hover:border-[var(--accent)]/40 hover:bg-[var(--bg-card)]/80"
                >
                  <p className="text-sm font-semibold text-[var(--text-main)]">
                    Naar projecten
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-soft)]">
                    Open het centrale projectenoverzicht.
                  </p>
                </Link>

                {latestCustomer ? (
                  <Link
                    href={`/admin/customers/${latestCustomer.id}`}
                    className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-4 transition hover:border-[var(--accent)]/40 hover:bg-[var(--bg-card)]/80"
                  >
                    <p className="text-sm font-semibold text-[var(--text-main)]">
                      Open recente klant
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-soft)]">
                      Ga direct naar de laatste klantenfiche.
                    </p>
                  </Link>
                ) : (
                  <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-4">
                    <p className="text-sm font-semibold text-[var(--text-main)]">
                      Nog geen klanten
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-soft)]">
                      Zodra klanten bestaan, verschijnt hier een snelle link.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {hasLoadError && (
          <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            Klanten of projectkoppelingen konden niet volledig geladen worden.
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
          <div className="border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-5 sm:px-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
              Kaart
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--text-main)]">
              Klanten geografisch
            </h2>
            <p className="mt-2 text-sm text-[var(--text-soft)]">
              Overzicht van klantlocaties over heel België.
            </p>
          </div>
          <div className="p-4 sm:p-5">
            <CustomersMap 
              locations={[
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
              ]}
            />
          </div>
        </section>

        <CustomerList customers={customersWithMeta} />
      </div>
    </AppShell>
  )
}