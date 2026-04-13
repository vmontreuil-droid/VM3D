import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Eye, FolderOpen, Ticket, UploadCloud, Download, UserRound, ArrowLeft, Activity } from 'lucide-react'
import AppShell from '@/components/app-shell'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import ProjectsMap from '@/components/projects/projects-map'
import { getStatusClass, getStatusLabel } from '@/lib/status'
import {
  getTicketPriorityClass,
  getTicketPriorityLabel,
  getTicketStatusClass,
  getTicketStatusLabel,
} from '@/lib/tickets'

type Props = {
  searchParams?: Promise<{ customer?: string }>
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Onbekend'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Onbekend'

  return new Intl.DateTimeFormat('nl-BE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export default async function AdminCustomerPreviewPage({ searchParams }: Props) {
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const selectedCustomerId = String(resolvedSearchParams.customer || '').trim()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (currentProfile?.role !== 'admin') {
    redirect('/dashboard')
  }

  const adminSupabase = createAdminClient()

  const { data: customers } = await adminSupabase
    .from('profiles')
    .select('id, full_name, company_name, email, created_at')
    .neq('role', 'admin')
    .order('company_name', { ascending: true })

  const safeCustomers = customers ?? []
  const effectiveCustomerId = selectedCustomerId || String(safeCustomers[0]?.id || '')

  const selectedCustomer = safeCustomers.find(
    (item: any) => String(item.id) === effectiveCustomerId
  )

  let projects: any[] = []
  let tickets: any[] = []
  let files: any[] = []

  if (selectedCustomer) {
    const [{ data: projectsData }, { data: ticketsData }] = await Promise.all([
      adminSupabase
        .from('projects')
        .select('id, title, address, status, created_at, latitude, longitude')
        .eq('user_id', selectedCustomer.id)
        .order('created_at', { ascending: false })
        .limit(12),
      adminSupabase
        .from('tickets')
        .select('id, title, status, priority, updated_at, created_at')
        .eq('customer_id', selectedCustomer.id)
        .order('updated_at', { ascending: false })
        .limit(12),
    ])

    projects = projectsData ?? []
    tickets = ticketsData ?? []

    const projectIds = projects.map((item) => item.id)

    if (projectIds.length > 0) {
      const { data: filesData } = await adminSupabase
        .from('project_files')
        .select('id, file_type, created_at, project_id')
        .in('project_id', projectIds)
        .order('created_at', { ascending: false })
        .limit(30)

      files = filesData ?? []
    }
  }

  const uploadsCount = files.filter((item) => item.file_type === 'client_upload').length
  const finalFilesCount = files.filter((item) => item.file_type === 'final_file').length
  const activeProjectsCount = projects.filter(
    (item) => item.status === 'in_behandeling' || item.status === 'klaar_voor_betaling'
  ).length
  const customerDisplayName =
    selectedCustomer?.company_name || selectedCustomer?.full_name || selectedCustomer?.email || 'Klant'
  const introText = selectedCustomer?.company_name
    ? `Welkom in het klantenportaal van ${selectedCustomer.company_name}. Hier volg je eenvoudig je lopende dossiers, uploads en opleverbestanden.`
    : 'Welkom in je klantenportaal. Hier volg je eenvoudig je lopende dossiers, uploads en opleverbestanden.'
  const projectLocations = projects
    .filter(
      (project) =>
        project.latitude != null &&
        project.longitude != null &&
        !Number.isNaN(Number(project.latitude)) &&
        !Number.isNaN(Number(project.longitude))
    )
    .map((project) => ({
      name: project.address || project.title || `Werf #${project.id}`,
      latitude: Number(project.latitude),
      longitude: Number(project.longitude),
    }))

  const actionButtonBase =
    'group relative inline-flex h-9 items-center gap-1.5 overflow-hidden rounded-lg border px-3 text-xs font-semibold transition'
  const actionButtonPrimary =
    `${actionButtonBase} border-[var(--border-soft)] bg-[var(--bg-card)] text-[var(--text-main)] hover:border-[var(--accent)]/45 hover:bg-[var(--bg-card)]/80`
  const actionButtonSecondary =
    `${actionButtonBase} border-[var(--border-soft)] bg-[var(--bg-card)] text-[var(--text-main)] hover:border-[var(--accent)]/45 hover:bg-[var(--bg-card)]/80`

  return (
    <AppShell isAdmin>
      <div className="space-y-4">
        <section className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
          <div className="border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-4 sm:px-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
              Adminportaal
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-[var(--text-main)] sm:text-3xl">
              Klantweergave
            </h1>
            <p className="mt-2 text-sm text-[var(--text-soft)]">
              Bekijk hoe het klantenportaal er voor een gekozen klant uitziet, zonder uit te loggen als admin.
            </p>
          </div>

          <div className="grid gap-3 px-4 py-4 sm:px-5 lg:grid-cols-[1fr_auto]">
            <form method="GET" className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <label className="grid gap-1 text-sm text-[var(--text-soft)]">
                Kies klant
                <select
                  name="customer"
                  defaultValue={effectiveCustomerId}
                  className="input-dark w-full px-3 py-2 text-sm"
                >
                  {safeCustomers.length === 0 && <option value="">Geen klanten gevonden</option>}
                  {safeCustomers.map((customer: any) => {
                    const label =
                      customer.company_name || customer.full_name || customer.email || 'Onbekende klant'

                    return (
                      <option key={customer.id} value={customer.id}>
                        {label}
                      </option>
                    )
                  })}
                </select>
              </label>

              <div className="flex items-end">
                <button
                  type="submit"
                  className={actionButtonPrimary}
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--accent)]/12 text-[var(--accent)]">
                    <Eye className="h-3 w-3" />
                  </span>
                  <span className="pr-1">Toon preview</span>
                  <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
                </button>
              </div>
            </form>

            <div className="flex items-end">
              <Link
                href="/admin/customers"
                className={actionButtonPrimary}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--accent)]/12 text-[var(--accent)]">
                  <ArrowLeft className="h-3 w-3" />
                </span>
                <span className="pr-1">Naar klanten</span>
                <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
              </Link>
            </div>
          </div>
        </section>

        {!selectedCustomer ? (
          <section className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Er is nog geen klant geselecteerd of beschikbaar.
          </section>
        ) : (
          <>
            <section className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
              <div className="relative border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-3 sm:px-5 sm:py-3.5">
                <div className="absolute inset-0 opacity-30">
                  <div className="h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(242,140,58,0.18),transparent_35%),radial-gradient(circle_at_left,rgba(255,255,255,0.05),transparent_25%)]" />
                </div>

                <div className="relative grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-5">
                  <div className="min-w-0 md:max-w-2xl">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                      Klantenportaal
                    </p>

                    <h1 className="mt-1 text-xl font-semibold text-[var(--text-main)] sm:text-2xl">
                      Welkom, {customerDisplayName}
                    </h1>

                    <p className="mt-1 max-w-2xl text-xs text-[var(--text-soft)] sm:text-sm">
                      {introText}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 md:mt-1 md:w-[420px] lg:mt-1.5 lg:w-[450px]">
                    <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(245,140,55,0.08),rgba(245,140,55,0.02))] px-2.5 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Werven</p>
                          <p className="mt-1 text-lg font-semibold text-[var(--accent)]">{projects.length}</p>
                        </div>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10">
                          <FolderOpen className="h-4.5 w-4.5 text-[var(--accent)]" />
                        </div>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(76,175,80,0.08),rgba(76,175,80,0.02))] px-2.5 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Actief</p>
                          <p className="mt-1 text-lg font-semibold text-green-500">{activeProjectsCount}</p>
                        </div>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
                          <Activity className="h-4.5 w-4.5 text-green-500" />
                        </div>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(33,150,243,0.08),rgba(33,150,243,0.02))] px-2.5 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Uploads</p>
                          <p className="mt-1 text-lg font-semibold text-blue-500">{uploadsCount}</p>
                        </div>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                          <UploadCloud className="h-4.5 w-4.5 text-blue-500" />
                        </div>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(156,39,176,0.08),rgba(156,39,176,0.02))] px-2.5 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Oplevering</p>
                          <p className="mt-1 text-lg font-semibold text-purple-500">{finalFilesCount}</p>
                        </div>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10">
                          <Download className="h-4.5 w-4.5 text-purple-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-3 xl:grid-cols-2">
              <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-3">
                <div className="mb-3 flex items-center justify-between border-b border-[var(--border-soft)] pb-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    Wervenkaart (preview)
                  </p>
                  <FolderOpen className="h-4 w-4 text-[var(--text-muted)]" />
                </div>

                <ProjectsMap
                  locations={projectLocations}
                  title={selectedCustomer.company_name || selectedCustomer.full_name || 'Klant'}
                  height={320}
                />
              </div>

              <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)]">
                <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    Mijn werven (preview)
                  </p>
                  <FolderOpen className="h-4 w-4 text-[var(--text-muted)]" />
                </div>

                {projects.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-[var(--text-soft)]">Geen werven gevonden voor deze klant.</p>
                ) : (
                  <div className="divide-y divide-[var(--border-soft)]">
                    {projects.map((project) => (
                      <div key={project.id} className="px-3 py-2.5">
                        <p className="text-sm font-semibold text-[var(--text-main)]">
                          #{project.id} · {project.title || project.address || 'Zonder titel'}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusClass(project.status || '')}`}>
                            {getStatusLabel(project.status || '')}
                          </span>

                          <div className="ml-auto flex items-center gap-2">
                            <span className="text-xs text-[var(--text-soft)]">
                              {formatDate(project.created_at)}
                            </span>
                            <span className="rounded-full border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-soft)]">
                              Alleen zichtbaar in klantenportaal
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] xl:col-span-2">
                <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    Tickets (preview)
                  </p>
                  <Ticket className="h-4 w-4 text-[var(--text-muted)]" />
                </div>

                {tickets.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-[var(--text-soft)]">Geen tickets gevonden voor deze klant.</p>
                ) : (
                  <div className="divide-y divide-[var(--border-soft)]">
                    {tickets.map((ticket) => (
                      <div key={ticket.id} className="px-3 py-2.5">
                        <p className="text-sm font-semibold text-[var(--text-main)]">
                          #{ticket.id} · {ticket.title || 'Zonder titel'}
                        </p>

                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getTicketStatusClass(ticket.status)}`}>
                            {getTicketStatusLabel(ticket.status)}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getTicketPriorityClass(ticket.priority)}`}>
                            {getTicketPriorityLabel(ticket.priority)}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-[var(--text-soft)]">
                          Laatst bijgewerkt: {formatDate(ticket.updated_at || ticket.created_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Klant
                </p>
                <p className="mt-1 text-xs text-[var(--text-soft)]">Alleen lezen: open de eigen klantfiche zonder bewerkrechten.</p>
                <div className="mt-3">
                  <Link href="/dashboard/klantfiche" className={`${actionButtonSecondary} w-full justify-center`}>
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--accent)]/12 text-[var(--accent)]">
                      <UserRound className="h-3 w-3" />
                    </span>
                    <span className="pr-1">Klantfiche openen</span>
                    <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
                  </Link>
                </div>
              </div>

              <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Tickets
                </p>
                <p className="mt-1 text-xs text-[var(--text-soft)]">Klant ziet enkel eigen tickets en antwoorden.</p>
                <div className="mt-3">
                  <Link href="/dashboard/tickets" className={`${actionButtonSecondary} w-full justify-center`}>
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--accent)]/12 text-[var(--accent)]">
                      <Ticket className="h-3 w-3" />
                    </span>
                    <span className="pr-1">Tickets beheren</span>
                    <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
                  </Link>
                </div>
              </div>

              <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Uploads
                </p>
                <p className="mt-1 text-xs text-[var(--text-soft)]">Klant bekijkt enkel eigen uploads en opleverbestanden.</p>
                <div className="mt-3">
                  <Link href="/dashboard" className={`${actionButtonSecondary} w-full justify-center`}>
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--accent)]/12 text-[var(--accent)]">
                      <UploadCloud className="h-3 w-3" />
                    </span>
                    <span className="pr-1">Uploads bekijken</span>
                    <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
                  </Link>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Klantnavigatie (referentie)
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--text-soft)]">
                <span className="rounded-full border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-2 py-1">Dashboard</span>
                <span className="rounded-full border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-2 py-1">Mijn werven</span>
                <span className="rounded-full border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-2 py-1">Tickets</span>
                <span className="rounded-full border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-2 py-1">Abonnement</span>
                <span className="rounded-full border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-2 py-1">Uploads</span>
                <span className="rounded-full border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-2 py-1">Oplevering</span>
                <Download className="h-4 w-4 text-[var(--text-muted)]" />
              </div>
            </section>
          </>
        )}
      </div>
    </AppShell>
  )
}