import Link from 'next/link'
import { redirect } from 'next/navigation'
import AppShell from '@/components/app-shell'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import AdminProjectSearch from '@/app/admin/admin-project-search'
import ProjectMap from '@/components/projects/project-map'
import {
  Activity,
  ArrowLeft,
  BarChart3,
  CircleDollarSign,
  Download,
  FolderOpen,
  PlusCircle,
  UploadCloud,
  Wallet,
} from 'lucide-react'

function getStatusLabel(status: string | null) {
  switch (status) {
    case 'offerte_aangevraagd':
      return 'Offerte aangevraagd'
    case 'offerte_verstuurd':
      return 'Offerte verstuurd'
    case 'in_behandeling':
      return 'In behandeling'
    case 'facturatie':
      return 'Facturatie'
    case 'factuur_verstuurd':
      return 'Factuur verstuurd'
    case 'afgerond':
      return 'Afgerond'
    case 'ingediend':
      return 'Ingediend'
    case 'klaar_voor_betaling':
      return 'Klaar voor betaling'
    default:
      return 'Onbekend'
  }
}

export default async function AdminWervenPage() {
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

  const { data: projects, error: projectsError } = await adminSupabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  const safeProjects = projects ?? []

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

  let totalFiles = 0
  let finalFiles = 0
  let clientFiles = 0
  let filesError: any = null
  let projectFiles: { id: number; project_id: number; file_type?: string | null }[] = []

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
    projectFiles = safeFiles
    totalFiles = safeFiles.length
    finalFiles = safeFiles.filter(
      (file: any) => file.file_type === 'final_file'
    ).length
    clientFiles = safeFiles.filter(
      (file: any) => file.file_type === 'client_upload'
    ).length
  }

  const totalProjects = projectsWithProfiles.length
  const activeProjects = projectsWithProfiles.filter(
    (project: any) =>
      project.status === 'in_behandeling' ||
      project.status === 'facturatie' ||
      project.status === 'factuur_verstuurd'
  ).length
  const submittedProjects = projectsWithProfiles.filter(
    (project: any) =>
      project.status === 'offerte_aangevraagd' ||
      project.status === 'offerte_verstuurd'
  ).length

  const billingRelevantProjects = projectsWithProfiles.filter((project: any) => {
    const priceValue = Number(project.price)
    const hasPrice =
      project.price !== null &&
      project.price !== undefined &&
      Number.isFinite(priceValue) &&
      priceValue > 0

    return (
      hasPrice ||
      project.status === 'facturatie' ||
      project.status === 'factuur_verstuurd' ||
      Boolean(project.is_paid ?? project.paid)
    )
  })

  const invoiceReadyCount = billingRelevantProjects.length
  const paidProjectsCount = billingRelevantProjects.filter((project: any) =>
    Boolean(project.is_paid ?? project.paid)
  ).length
  const unpaidProjectsCount = billingRelevantProjects.filter(
    (project: any) => !Boolean(project.is_paid ?? project.paid)
  ).length

  const totalProjectValue = projectsWithProfiles.reduce(
    (sum: number, project: any) => {
      const priceValue = Number(project.price)
      return Number.isFinite(priceValue) && priceValue > 0
        ? sum + priceValue
        : sum
    },
    0
  )

  const paidRevenueAmount = projectsWithProfiles.reduce(
    (sum: number, project: any) => {
      const priceValue = Number(project.price)
      const isPaid = Boolean(project.is_paid ?? project.paid)

      return isPaid && Number.isFinite(priceValue) && priceValue > 0
        ? sum + priceValue
        : sum
    },
    0
  )

  const pricedProjectsCount = projectsWithProfiles.filter((project: any) => {
    const priceValue = Number(project.price)
    return Number.isFinite(priceValue) && priceValue > 0
  }).length

  const averageProjectValue =
    pricedProjectsCount > 0 ? totalProjectValue / pricedProjectsCount : 0

  const formattedTotalProjectValue = new Intl.NumberFormat('nl-BE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(totalProjectValue)

  const formattedPaidRevenue = new Intl.NumberFormat('nl-BE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(paidRevenueAmount)

  const formattedAverageProjectValue = new Intl.NumberFormat('nl-BE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(averageProjectValue)

  const latestProject = projectsWithProfiles[0] ?? null
  const latestProjectLabel =
    latestProject?.name || latestProject?.address || '—'
  const latestProjectDateLabel = latestProject?.created_at
    ? new Date(latestProject.created_at).toLocaleDateString('nl-BE')
    : '—'

  const highestValueProject =
    [...projectsWithProfiles].sort(
      (a: any, b: any) => Number(b.price || 0) - Number(a.price || 0)
    )[0] ?? null

  const highestValueProjectLabel =
    highestValueProject?.name || highestValueProject?.address || '—'

  const hasLoadError = Boolean(projectsError || profilesError || filesError)

  const searchProjects = projectsWithProfiles.map((project: any) => {
    const priceValue = Number(project.price)

    return {
      id: project.id,
      name: project.name || 'Ongetitelde werf',
      description: project.description ?? null,
      address: project.address ?? null,
      status: project.status || 'offerte_aangevraagd',
      price:
        Number.isFinite(priceValue) && priceValue > 0 ? priceValue : null,
      currency: project.currency || 'EUR',
      created_at: project.created_at ?? null,
      klantEmail:
        project.profiles?.company_name ||
        project.profiles?.full_name ||
        project.profiles?.email ||
        null,
      paid: Boolean(project.is_paid ?? project.paid),
      userId: project.user_id ?? null,
    }
  })

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
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-soft)] transition hover:text-[var(--accent)]"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Dashboard
                </Link>

                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                  Adminportaal
                </p>

                <h1 className="mt-1 text-xl font-semibold text-[var(--text-main)] sm:text-2xl">
                  Wervenbeheer
                </h1>
              </div>

              <div className="w-full xl:ml-auto xl:max-w-[820px]">
                <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
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

                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(245,158,11,0.08),rgba(245,158,11,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Offerte</p>
                        <p className="mt-1 text-lg font-semibold text-amber-400">{submittedProjects}</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400/10">
                        <BarChart3 className="h-4.5 w-4.5 text-amber-400" />
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
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Facturatie</p>
                        <p className="mt-1 text-lg font-semibold text-amber-400">{invoiceReadyCount}</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400/10">
                        <Wallet className="h-4.5 w-4.5 text-amber-400" />
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(6,182,212,0.08),rgba(6,182,212,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Openstaand</p>
                        <p className="mt-1 text-lg font-semibold text-cyan-400">{unpaidProjectsCount}</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-400/10">
                        <BarChart3 className="h-4.5 w-4.5 text-cyan-400" />
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
                  Wervenkaart
                </p>
                <p className="mt-1 text-xs text-[var(--text-soft)]">
                  Visueel overzicht van alle werven en hun locaties.
                </p>
              </div>

              <div id="wervenkaart" className="min-h-[180px] flex-1 sm:min-h-[220px] xl:min-h-0">
                <ProjectMap projects={projectsWithProfiles} height="100%" />
              </div>
            </div>

            <div className="flex h-full flex-col rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Sneltoetsen
                </p>
                <p className="mt-1 text-xs text-[var(--text-soft)]">
                  Snelle toegang tot de belangrijkste werfacties.
                </p>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
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
                        Start meteen een nieuw dossier.
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
                        Bekijk cijfers, voortgang en omzet.
                      </span>
                    </span>
                  </div>
                </Link>

                <Link
                  href="#wervenkaart"
                  className="group relative overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-3 transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)]/80"
                >
                  <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
                  <div className="flex items-start gap-2.5 pr-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
                      <FolderOpen className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold leading-5 text-[var(--text-main)]">
                        Wervenkaart
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-4 text-[var(--text-soft)]">
                        Spring direct naar alle zichtbare locaties.
                      </span>
                    </span>
                  </div>
                </Link>

                {latestProject ? (
                  <Link
                    href={`/admin/projects/${latestProject.id}`}
                    className="group relative overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-3 transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)]/80"
                  >
                    <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
                    <div className="flex items-start gap-2.5 pr-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
                        <FolderOpen className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[13px] font-semibold leading-5 text-[var(--text-main)]">
                          Recente werf
                        </span>
                        <span className="mt-0.5 block truncate text-[11px] leading-4 text-[var(--text-soft)]">
                          {latestProjectLabel}
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
                        <FolderOpen className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[13px] font-semibold leading-5 text-[var(--text-main)]">
                          Wervenoverzicht
                        </span>
                        <span className="mt-0.5 block text-[11px] leading-4 text-[var(--text-soft)]">
                          Er zijn nog geen recente werven beschikbaar.
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
                    <p className="text-xs text-[var(--text-muted)]">Laatste werf</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                      {latestProjectLabel}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-soft)]">
                      Aangemaakt op {latestProjectDateLabel}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Gemiddeld</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                      {formattedAverageProjectValue}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-soft)]">
                      Richtprijs per werf
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Hoogste waarde</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                      {formattedTotalProjectValue}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-soft)]">
                      Topdossier: {highestValueProjectLabel}
                    </p>
                  </div>
                </div>
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

        <AdminProjectSearch
          projects={searchProjects}
          projectFiles={projectFiles}
          adminUserId={user.id}
          hideResultsUntilSearch
        />
      </div>
    </AppShell>
  )
}
