import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/app-shell'
import ProjectList from './project-list'
import RecentFilesList from './recent-files-list'

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

function getInitials(value: string) {
  const clean = value.trim()
  if (!clean) return 'KP'

  const parts = clean.split(/\s+/).filter(Boolean)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
}

export default async function DashboardPage() {
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

  const isAdmin = profile?.role === 'admin'

  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const safeProjects = projects ?? []
  const projectIds = safeProjects.map((project: any) => project.id)

  let recentFiles: any[] = []
  let recentFilesError: any = null

  if (projectIds.length > 0) {
    const filesResponse = await supabase
      .from('project_files')
      .select(
        `
          *,
          projects (
            title,
            status
          )
        `
      )
      .in('project_id', projectIds)
      .order('created_at', { ascending: false })
      .limit(12)

    recentFiles = filesResponse.data ?? []
    recentFilesError = filesResponse.error
  }

  const totalProjects = safeProjects.length
  const submittedProjects = safeProjects.filter(
    (project: any) => project.status === 'ingediend'
  ).length
  const activeProjects = safeProjects.filter(
    (project: any) =>
      project.status === 'in_behandeling' ||
      project.status === 'klaar_voor_betaling'
  ).length
  const completedProjects = safeProjects.filter(
    (project: any) => project.status === 'afgerond'
  ).length

  const uploadsCount = recentFiles.filter(
    (file: any) => file.file_type === 'client_upload'
  ).length

  const finalFilesCount = recentFiles.filter(
    (file: any) => file.file_type === 'final_file'
  ).length

  const latestProject = safeProjects[0] ?? null
  const latestFile = recentFiles[0] ?? null

  const customerDisplayName =
    profile?.company_name || profile?.full_name || 'klant'

  const introText = profile?.company_name
    ? `Welkom in het klantenportaal van ${profile.company_name}. Hier volg je eenvoudig je lopende dossiers, uploads en opleverbestanden.`
    : `Welkom in je klantenportaal. Hier volg je eenvoudig je lopende dossiers, uploads en opleverbestanden.`

  const monogram = getInitials(customerDisplayName)

  return (
    <AppShell isAdmin={isAdmin}>
      <div className="space-y-3 sm:space-y-4 lg:space-y-4">
        <section className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
          <div className="relative border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-5 py-4">
            <div className="absolute inset-0 opacity-30">
              <div className="h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(242,140,58,0.18),transparent_35%),radial-gradient(circle_at_left,rgba(255,255,255,0.05),transparent_25%)]" />
            </div>

            <div className="relative flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                  Klantenportaal
                </p>

                <h1 className="mt-2 text-xl font-semibold text-[var(--text-main)] sm:text-2xl">
                  Welkom, {customerDisplayName}
                </h1>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Link href="/dashboard" className="btn-primary">
                    Mijn projecten
                  </Link>
                </div>
              </div>

              <div className="flex w-full flex-col gap-3 xl:w-auto">
                <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)]/80 shadow-sm backdrop-blur">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)] text-xl font-bold text-white shadow-sm">
                      {monogram}
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                        Account
                      </p>
                      <p className="mt-1 truncate text-sm font-semibold text-[var(--text-main)]">
                        {customerDisplayName}
                      </p>
                      <p className="mt-1 text-xs text-[var(--text-soft)]">
                        Beveiligd klantenportaal
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid w-full grid-cols-3 gap-2 sm:grid-cols-3 xl:w-auto xl:grid-cols-4">
                  <div className="card-mini text-center">
                    <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Projecten</p>
                    <p className="mt-1 text-base font-semibold text-[var(--text-main)]">
                      {totalProjects}
                    </p>
                  </div>

                  <div className="card-mini text-center">
                    <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Actief</p>
                    <p className="mt-1 text-base font-semibold text-[var(--text-main)]">
                      {activeProjects}
                    </p>
                  </div>

                  <div className="card-mini text-center">
                    <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Uploads</p>
                    <p className="mt-1 text-base font-semibold text-[var(--text-main)]">
                      {uploadsCount}
                    </p>
                  </div>

                  <div className="card-mini text-center hidden sm:block">
                    <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Oplevering</p>
                    <p className="mt-1 text-base font-semibold text-[var(--text-main)]">
                      {finalFilesCount}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-2 px-5 py-3 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-3.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Laatste project
              </p>

              <p className="mt-2 text-sm font-semibold text-[var(--text-main)]">
                {latestProject?.title || 'Nog geen project'}
              </p>
              <p className="text-[10px] text-[var(--text-soft)]">
                {latestProject?.status
                  ? getStatusLabel(latestProject.status)
                  : '—'}
              </p>
            </div>

            <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-3.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Sneltoets
              </p>
              {latestProject ? (
                <Link
                  href={`/dashboard/projects/${latestProject.id}`}
                  className="mt-2 block text-xs font-medium text-blue-400 transition hover:text-blue-300"
                >
                  Ga naar recent project →
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        {projectsError && (
          <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            Projecten konden niet volledig geladen worden.
          </div>
        )}

        <ProjectList
          projects={safeProjects}
          files={recentFiles}
          title="Mijn projecten"
          description="Sneller overzicht in kaartvorm met status, prijs en bestandsaantallen."
        />

        {recentFilesError && (
          <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            Bestanden konden niet volledig geladen worden.
          </div>
        )}

        <RecentFilesList files={recentFiles} />
      </div>
    </AppShell>
  )
}