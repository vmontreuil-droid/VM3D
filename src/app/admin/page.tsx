import Link from 'next/link'
import {
  Users,
  FolderOpen,
  PlusCircle,
  Ticket,
  BarChart3,
  CreditCard,
  UploadCloud,
  Activity,
  Download,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/app-shell'
import AdminSearchPanel from '@/app/admin/admin-search-panel'
import AdminUploadPanel from '@/app/admin/admin-upload-panel'
import ProjectMap from '@/components/projects/project-map'
import { createAdminClient } from '@/lib/supabase/admin'

function getStatusLabel(status: string | null) {
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

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, company_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  const adminSupabase = createAdminClient()

  const { data: projects, error: projectsError } = await adminSupabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  const safeProjects = projects ?? []

  const { data: customers, error: customersError } = await adminSupabase
    .from('profiles')
    .select('id, full_name, company_name, email, vat_number, city, phone, created_at, role')
    .neq('role', 'admin')
    .order('company_name', { ascending: true })

  const safeCustomers = customers ?? []

  const uniqueUserIds = Array.from(
    new Set(safeProjects.map((project: any) => project.user_id).filter(Boolean))
  )

  let profilesMap = new Map<
    string,
    {
      full_name?: string | null
      company_name?: string | null
      email?: string | null
    }
  >()

  let profilesError: any = null

  if (uniqueUserIds.length > 0) {
    const { data: profiles, error } = await adminSupabase
      .from('profiles')
      .select('id, full_name, company_name, email')
      .in('id', uniqueUserIds)

    profilesError = error

    if (profiles) {
      profilesMap = new Map(
        profiles.map((item: any) => [
          item.id,
          {
            full_name: item.full_name,
            company_name: item.company_name,
            email: item.email,
          },
        ])
      )
    }
  }

  const projectsWithProfiles = safeProjects.map((project: any) => ({
    ...project,
    profiles: project.user_id ? profilesMap.get(project.user_id) ?? null : null,
  }))

  const projectCounts = new Map<string, number>()
  const latestProjectDates = new Map<string, string | null>()

  for (const project of safeProjects) {
    const key = String(project.user_id ?? '')
    if (!key) continue

    projectCounts.set(key, (projectCounts.get(key) ?? 0) + 1)

    const currentLatest = latestProjectDates.get(key)
    if (!currentLatest) {
      latestProjectDates.set(key, project.created_at ?? null)
    } else if (
      project.created_at &&
      new Date(project.created_at).getTime() > new Date(currentLatest).getTime()
    ) {
      latestProjectDates.set(key, project.created_at)
    }
  }

  const customersWithMeta = safeCustomers.map((customer: any) => ({
    ...customer,
    project_count: projectCounts.get(String(customer.id)) ?? 0,
    last_project_at: latestProjectDates.get(String(customer.id)) ?? null,
  }))

  const customerCount = customersWithMeta.length
  const totalProjects = projectsWithProfiles.length
  const submittedProjects = projectsWithProfiles.filter(
    (project: any) => project.status === 'ingediend'
  ).length
  const activeProjects = projectsWithProfiles.filter(
    (project: any) =>
      project.status === 'in_behandeling' ||
      project.status === 'klaar_voor_betaling'
  ).length
  const completedProjects = projectsWithProfiles.filter(
    (project: any) => project.status === 'afgerond'
  ).length

  const latestProject = projectsWithProfiles[0] ?? null
  const latestCustomer =
    latestProject?.profiles?.company_name ||
    latestProject?.profiles?.full_name ||
    latestProject?.profiles?.email ||
    '—'

  let totalFiles = 0
  let finalFiles = 0
  let clientFiles = 0
  let filesError: any = null

  if (safeProjects.length > 0) {
    const { data: files, error } = await adminSupabase
      .from('project_files')
      .select('id, file_type, project_id')
      .in(
        'project_id',
        safeProjects.map((project: any) => project.id)
      )

    filesError = error

    const safeFiles = files ?? []
    totalFiles = safeFiles.length
    finalFiles = safeFiles.filter(
      (file: any) => file.file_type === 'final_file'
    ).length
    clientFiles = safeFiles.filter(
      (file: any) => file.file_type === 'client_upload'
    ).length
  }

  const hasLoadError = Boolean(projectsError || profilesError || customersError || filesError)
  const ticketCount = 0
  const subscriptionCount = 0

  return (
    <AppShell isAdmin>
      <div className="space-y-3 sm:space-y-4 lg:space-y-5">
        <section className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
          <div className="relative border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-5 sm:px-5">
            <div className="absolute inset-0 opacity-30">
              <div className="h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(242,140,58,0.18),transparent_35%),radial-gradient(circle_at_left,rgba(255,255,255,0.05),transparent_25%)]" />
            </div>

            <div className="relative flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0 flex-1">
                <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                  Adminportaal
                </p>

                <h1 className="mt-2 text-2xl font-semibold text-[var(--text-main)] sm:text-3xl">
                  Welkom, {profile?.full_name || profile?.company_name || 'Admin'}
                </h1>

                <p className="mt-2.5 max-w-3xl text-sm leading-6 text-[var(--text-soft)]">
                  Centraal overzicht van klanten, werven, bestanden en opvolgingen
                  binnen het platform.
                </p>
              </div>

              <div className="w-full xl:ml-auto xl:max-w-[820px]">
                <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(245,140,55,0.08),rgba(245,140,55,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Klanten</p>
                        <p className="mt-1 text-lg font-semibold text-[var(--accent)]">{customerCount}</p>
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
                        <p className="mt-1 text-lg font-semibold text-[var(--accent)]">{totalProjects}</p>
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
                        <p className="mt-1 text-lg font-semibold text-green-500">{activeProjects}</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10">
                        <Activity className="h-4.5 w-4.5 text-green-500" />
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(33,150,243,0.08),rgba(33,150,243,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Uploads</p>
                        <p className="mt-1 text-lg font-semibold text-blue-500">{clientFiles}</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                        <UploadCloud className="h-4.5 w-4.5 text-blue-500" />
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(156,39,176,0.08),rgba(156,39,176,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Oplevering</p>
                        <p className="mt-1 text-lg font-semibold text-purple-500">{finalFiles}</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10">
                        <Download className="h-4.5 w-4.5 text-purple-500" />
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(245,158,11,0.08),rgba(245,158,11,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Ingediend</p>
                        <p className="mt-1 text-lg font-semibold text-amber-400">{submittedProjects}</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400/10">
                        <BarChart3 className="h-4.5 w-4.5 text-amber-400" />
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(14,165,233,0.08),rgba(14,165,233,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Tickets</p>
                        <p className="mt-1 text-lg font-semibold text-sky-400">{ticketCount}</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-400/10">
                        <Ticket className="h-4.5 w-4.5 text-sky-400" />
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(236,72,153,0.08),rgba(236,72,153,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Abonnementen</p>
                        <p className="mt-1 text-lg font-semibold text-pink-400">{subscriptionCount}</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-pink-400/10">
                        <CreditCard className="h-4.5 w-4.5 text-pink-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid items-stretch gap-3 px-4 py-4 sm:px-5 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card-2)]">
              <div className="border-b border-[var(--border-soft)] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Wervenkaart
                </p>
                <p className="mt-1 text-xs text-[var(--text-soft)]">
                  Visueel overzicht van alle werven en locaties.
                </p>
              </div>

              <div className="min-h-[250px] flex-1 sm:min-h-[280px] xl:min-h-0">
                <ProjectMap projects={projectsWithProfiles} height="100%" />
              </div>
            </div>

            <div className="flex h-full flex-col rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Sneltoetsen
                </p>
                <p className="mt-1 text-xs text-[var(--text-soft)]">
                  Snelle toegang tot klanten, werven en opvolging.
                </p>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <Link
                  href="/admin/customers"
                  className="group relative overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-3 transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)]/80"
                >
                  <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
                  <div className="flex items-start gap-2.5 pr-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
                      <Users className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold leading-5 text-[var(--text-main)]">
                        Klanten
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-4 text-[var(--text-soft)]">
                        Open alle klantfiches.
                      </span>
                    </span>
                  </div>
                </Link>

                <Link
                  href="/admin/werven"
                  className="group relative overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-3 transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)]/80"
                >
                  <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
                  <div className="flex items-start gap-2.5 pr-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
                      <FolderOpen className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold leading-5 text-[var(--text-main)]">
                        Werven
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-4 text-[var(--text-soft)]">
                        Ga naar het centrale werfoverzicht.
                      </span>
                    </span>
                  </div>
                </Link>

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
                  href="/admin/projects/new"
                  className="group relative overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-3 transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)]/80"
                >
                  <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
                  <div className="flex items-start gap-2.5 pr-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
                      <PlusCircle className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold leading-5 text-[var(--text-main)]">
                        Nieuwe werf
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-4 text-[var(--text-soft)]">
                        Start snel een nieuw dossier op.
                      </span>
                    </span>
                  </div>
                </Link>

                <Link
                  href="/dashboard/tickets"
                  className="group relative overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-3 transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)]/80"
                >
                  <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
                  <div className="flex items-start gap-2.5 pr-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
                      <Ticket className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold leading-5 text-[var(--text-main)]">
                        Tickets
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-4 text-[var(--text-soft)]">
                        Volg supportvragen en meldingen op.
                      </span>
                    </span>
                  </div>
                </Link>

                <Link
                  href="/admin/projects/statistics"
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
                        Bekijk cijfers en voortgang van werven.
                      </span>
                    </span>
                  </div>
                </Link>

                <Link
                  href="/dashboard/abonnement"
                  className="group relative overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-3 transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)]/80"
                >
                  <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
                  <div className="flex items-start gap-2.5 pr-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
                      <CreditCard className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold leading-5 text-[var(--text-main)]">
                        Abonnement
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-4 text-[var(--text-soft)]">
                        Bekijk formule, opties en historiek.
                      </span>
                    </span>
                  </div>
                </Link>

                <Link
                  href="/admin?view=uploads"
                  className="group relative overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-3 transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)]/80"
                >
                  <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
                  <div className="flex items-start gap-2.5 pr-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
                      <UploadCloud className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold leading-5 text-[var(--text-main)]">
                        Uploads
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-4 text-[var(--text-soft)]">
                        Ga direct naar recente uploads en bestanden.
                      </span>
                    </span>
                  </div>
                </Link>
              </div>
            </div>
          </div>

        </section>

        {hasLoadError && (
          <section className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm text-red-200 shadow-sm">
            Werven, klantgegevens of bestanden konden niet volledig geladen
            worden.
          </section>
        )}

        <AdminUploadPanel projects={projectsWithProfiles} />

        <AdminSearchPanel
          customers={customersWithMeta}
          projects={projectsWithProfiles}
        />
      </div>
    </AppShell>
  )
}