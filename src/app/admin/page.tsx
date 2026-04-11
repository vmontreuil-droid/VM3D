import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/app-shell'
import ProjectList from '@/app/dashboard/project-list'
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

  const customerCount = uniqueUserIds.length
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

  const hasLoadError = Boolean(projectsError || profilesError || filesError)

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
                  <Link href="/admin/customers" className="btn-secondary">
                    Klanten
                  </Link>

                  <Link href="/admin/customers/new" className="btn-secondary">
                    + Klant
                  </Link>

                  <Link href="/admin/projects/new" className="btn-primary">
                    + Project
                  </Link>

                  {latestProject ? (
                    <Link
                      href={`/admin/projects/${latestProject.id}`}
                      className="btn-secondary"
                    >
                      Laatste project
                    </Link>
                  ) : null}
                </div>

                <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                  Adminportaal
                </p>

                <h1 className="mt-2 text-2xl font-semibold text-[var(--text-main)] sm:text-3xl">
                  Welkom, {profile?.full_name || profile?.company_name || 'Admin'}
                </h1>

                <p className="mt-2.5 max-w-3xl text-sm leading-6 text-[var(--text-soft)]">
                  Centraal overzicht van klanten, projecten, bestanden en opvolgingen
                  binnen het platform.
                </p>
              </div>

              <div className="flex w-full flex-col gap-4 xl:w-auto">
                <div className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)]/80 shadow-sm backdrop-blur">
                  <div className="flex items-center gap-4 px-4 py-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)] text-xl font-bold text-white shadow-sm">
                      AD
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                        Omgeving
                      </p>
                      <p className="mt-1 truncate text-sm font-semibold text-[var(--text-main)]">
                        VM3D Admin Cloud
                      </p>
                      <p className="mt-1 text-xs text-[var(--text-soft)]">
                        Beveiligd beheerplatform
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 xl:w-auto xl:grid-cols-6">
                  <div className="card-mini text-center">
                    <p className="text-xs text-[var(--text-muted)]">Klanten</p>
                    <p className="text-lg font-semibold text-[var(--text-main)]">
                      {customerCount}
                    </p>
                  </div>

                  <div className="card-mini text-center">
                    <p className="text-xs text-[var(--text-muted)]">Projecten</p>
                    <p className="text-lg font-semibold text-[var(--text-main)]">
                      {totalProjects}
                    </p>
                  </div>

                  <div className="card-mini text-center">
                    <p className="text-xs text-[var(--text-muted)]">Ingediend</p>
                    <p className="text-lg font-semibold text-[var(--text-main)]">
                      {submittedProjects}
                    </p>
                  </div>

                  <div className="card-mini text-center">
                    <p className="text-xs text-[var(--text-muted)]">Actief</p>
                    <p className="text-lg font-semibold text-[var(--text-main)]">
                      {activeProjects}
                    </p>
                  </div>

                  <div className="card-mini text-center">
                    <p className="text-xs text-[var(--text-muted)]">Bestanden</p>
                    <p className="text-lg font-semibold text-[var(--text-main)]">
                      {totalFiles}
                    </p>
                  </div>

                  <div className="card-mini text-center">
                    <p className="text-xs text-[var(--text-muted)]">Afgerond</p>
                    <p className="text-lg font-semibold text-[var(--text-main)]">
                      {completedProjects}
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
                  <p className="text-xs text-[var(--text-muted)]">Laatste project</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {latestProject?.title || 'Nog geen project'}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-soft)]">
                    {latestProject?.status
                      ? getStatusLabel(latestProject.status)
                      : '—'}
                  </p>
                </div>

                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">Laatste klant</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {latestCustomer}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-soft)]">
                    Gekoppeld aan recent project
                  </p>
                </div>

                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">Klantuploads</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {clientFiles}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-soft)]">
                    Bestanden door klanten aangeleverd
                  </p>
                </div>

                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">Opleverbestanden</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {finalFiles}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-soft)]">
                    Klaar voor levering of download
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
                    Start snel een nieuw dossier op.
                  </p>
                </Link>

                <Link
                  href="/admin/customers"
                  className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-4 transition hover:border-[var(--accent)]/40 hover:bg-[var(--bg-card)]/80"
                >
                  <p className="text-sm font-semibold text-[var(--text-main)]">
                    Beheer klanten
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-soft)]">
                    Zoek en open bestaande klantfiches.
                  </p>
                </Link>

                {latestProject ? (
                  <Link
                    href={`/admin/projects/${latestProject.id}`}
                    className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-4 transition hover:border-[var(--accent)]/40 hover:bg-[var(--bg-card)]/80"
                  >
                    <p className="text-sm font-semibold text-[var(--text-main)]">
                      Open recent project
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-soft)]">
                      Ga verder op het laatst aangemaakte dossier.
                    </p>
                  </Link>
                ) : (
                  <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-4">
                    <p className="text-sm font-semibold text-[var(--text-main)]">
                      Nog geen project
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-soft)]">
                      Zodra een project bestaat, verschijnt het hier.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="px-4 pb-4 sm:px-5 sm:pb-5">
            <div className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card-2)]">
              <div className="border-b border-[var(--border-soft)] px-4 py-3">
                <h2 className="text-sm font-semibold text-[var(--text-main)]">
                  Projectkaart
                </h2>
                <p className="mt-1 text-xs text-[var(--text-soft)]">
                  Visueel overzicht van alle projecten en locaties.
                </p>
              </div>

              <div className="min-h-[260px] sm:min-h-[320px] lg:min-h-[380px]">
                <ProjectMap projects={projectsWithProfiles} />
              </div>
            </div>
          </div>
        </section>

        {hasLoadError && (
          <section className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm text-red-200 shadow-sm">
            Projecten, klantgegevens of bestanden konden niet volledig geladen
            worden.
          </section>
        )}

        <ProjectList
          projects={projectsWithProfiles}
          title="Alle projecten"
          description="Zoek, filter, sorteer en beheer alle projecten van klanten."
          showCustomerColumn
          showAdminActions
        />
      </div>
    </AppShell>
  )
}