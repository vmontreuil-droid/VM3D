import Link from 'next/link'
import { FolderOpen, Activity, UploadCloud, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/app-shell'
import ProjectsMap from '@/components/projects/projects-map'
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

  const projectLocations = safeProjects
    .filter(
      (project: any) =>
        project.latitude != null &&
        project.longitude != null &&
        !Number.isNaN(Number(project.latitude)) &&
        !Number.isNaN(Number(project.longitude))
    )
    .map((project: any) => ({
      name: project.address || project.title || 'Projectlocatie',
      latitude: Number(project.latitude),
      longitude: Number(project.longitude),
    }))

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
          <div className="relative border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-3 sm:px-5 sm:py-3.5">
            <div className="absolute inset-0 opacity-30">
              <div className="h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(242,140,58,0.18),transparent_35%),radial-gradient(circle_at_left,rgba(255,255,255,0.05),transparent_25%)]" />
            </div>

            <div className="relative space-y-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
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

                <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)]/80 shadow-sm backdrop-blur">
                  <div className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-sm font-bold text-white shadow-sm">
                      {monogram}
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                        Account
                      </p>
                      <p className="mt-0.5 truncate text-sm font-semibold text-[var(--text-main)]">
                        {customerDisplayName}
                      </p>
                      <p className="text-[11px] text-[var(--text-soft)]">
                        Beveiligd klantenportaal
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mx-auto grid w-full max-w-4xl grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(245,140,55,0.08),rgba(245,140,55,0.02))] px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Projecten</p>
                      <p className="mt-1 text-lg font-semibold text-[var(--accent)]">
                        {totalProjects}
                      </p>
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
                      <p className="mt-1 text-lg font-semibold text-green-500">
                        {activeProjects}
                      </p>
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
                      <p className="mt-1 text-lg font-semibold text-blue-500">
                        {uploadsCount}
                      </p>
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
                      <p className="mt-1 text-lg font-semibold text-purple-500">
                        {finalFilesCount}
                      </p>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10">
                      <Download className="h-4.5 w-4.5 text-purple-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-2 px-4 py-2.5 sm:px-5 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)]">
              <div className="border-b border-[var(--border-soft)] px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Projectlocaties
                </p>
                <p className="mt-1 text-xs text-[var(--text-soft)]">
                  Kaart van je projecten met gekende adressen.
                </p>
              </div>

              <ProjectsMap
                locations={projectLocations}
                title="Projectlocaties"
                height={240}
              />
            </div>

            <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Sneltoets
              </p>
              {latestProject ? (
                <Link
                  href={`/dashboard/projects/${latestProject.id}`}
                  className="mt-1.5 inline-flex text-xs font-medium text-[var(--accent)] transition hover:text-[var(--accent-hover)]"
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