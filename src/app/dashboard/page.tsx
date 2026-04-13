import CustomerLogoHeaderBlock from "@/components/customers/customer-logo-header-block"
import Link from 'next/link'
import {
  FolderOpen,
  Activity,
  UploadCloud,
  Download,
  Users,
  PlusCircle,
  BarChart3,
  Ticket,
  CreditCard,
  Building2,
  FileText,
  FilePlus,
} from 'lucide-react'
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
    .select('role, full_name, company_name, logo_url')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'

  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Ophalen en tellen van klanten (admin ziet alle klanten, gebruiker alleen zichzelf)
  let totalCustomers = 0;
  if (isAdmin) {
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    totalCustomers = count || 0;
  } else {
    totalCustomers = 1;
  }

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

  const customerDisplayName = profile?.company_name || ''

  const introText = profile?.company_name
    ? `Welkom in het klantenportaal van ${profile.company_name}. Hier volg je eenvoudig je lopende dossiers, uploads en opleverbestanden.`
    : `Welkom in je klantenportaal. Hier volg je eenvoudig je lopende dossiers, uploads en opleverbestanden.`

  const quickLinks = isAdmin
    ? [
        {
          href: '/admin/customers',
          label: 'Klanten',
          description: 'Open alle klantfiches.',
          icon: Users,
          badge: totalCustomers, // badge met aantal klanten
        },
        {
          href: '/admin',
          label: 'Werven',
          description: 'Ga naar het werfoverzicht.',
          icon: FolderOpen,
          badge: totalProjects, // badge met aantal werven
        },
        {
          href: '/admin/customers/new',
          label: 'Nieuwe klant',
          description: 'Voeg snel een klant toe.',
          icon: PlusCircle,
        },
        {
          href: '/admin/projects/new',
          label: 'Nieuwe werf',
          description: 'Start een nieuwe werf.',
          icon: PlusCircle,
        },
        {
          href: '/dashboard/tickets',
          label: 'Tickets',
          description: 'Beheer vragen en opvolgingen.',
          icon: Ticket,
        },
        {
          href: '/dashboard/abonnement',
          label: 'Abonnement',
          description: 'Bekijk formule en opties.',
          icon: CreditCard,
        },
        {
          href: '/admin/projects/statistics',
          label: 'Statistieken',
          description: 'Bekijk cijfers en voortgang.',
          icon: BarChart3,
        },
        {
          href: '/admin?view=uploads',
          label: 'Uploads',
          description: 'Ga naar bestanden en uploads.',
          icon: UploadCloud,
        },
      ]
    : [
        {
          href: '/dashboard',
          label: 'Mijn werven',
          description: 'Overzicht van je werven.',
          icon: FolderOpen,
        },
        {
          href: '/dashboard/tickets',
          label: 'Tickets',
          description: 'Meld een vraag of opvolging.',
          icon: Ticket,
        },
        {
          href: '/dashboard/abonnement',
          label: 'Abonnement',
          description: 'Bekijk je formule en opties.',
          icon: CreditCard,
        },
        {
          href: '/dashboard/offerte',
          label: 'Offerte aanvragen',
          description: 'Vraag een nieuwe offerte aan.',
          icon: FilePlus,
        },
        {
          href: '/dashboard/facturatie',
          label: 'Facturatie',
          description: 'Bekijk je facturen en betalingen.',
          icon: FileText,
        },
        {
          href: '/dashboard',
          label: 'Uploads',
          description: 'Bekijk je aangeleverde bestanden.',
          icon: UploadCloud,
        },
        {
          href: '/dashboard',
          label: 'Oplevering',
          description: 'Open je finale bestanden.',
          icon: Download,
        },
        {
          href: latestProject ? `/dashboard/projects/${latestProject.id}` : '/dashboard',
          label: 'Recente werf',
          description: latestProject
            ? latestProject.title || 'Ga verder in je laatste dossier.'
            : 'Nog geen recente werf beschikbaar.',
          icon: Activity,
        },
      ]

  return (
    <AppShell isAdmin={isAdmin}>
      <div className="space-y-3 sm:space-y-4 lg:space-y-4">
        <section className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
          <div className="relative border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-3 sm:px-5 sm:py-3.5">
            <div className="absolute inset-0 opacity-30">
              <div className="h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(242,140,58,0.18),transparent_35%),radial-gradient(circle_at_left,rgba(255,255,255,0.05),transparent_25%)]" />
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex min-w-0 md:max-w-2xl">
                {/* Logo of fallback: volledige headerhoogte */}
                <div className="flex items-stretch pr-6">
                  <CustomerLogoHeaderBlock logoUrl={profile?.logo_url} />
                </div>
                <div className="min-w-0 flex flex-col justify-center">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                    Klantenportaal
                  </p>
                  <h1 className="mt-1 text-xl font-semibold text-[var(--text-main)] sm:text-2xl">
                    Welkom{customerDisplayName ? `, ${customerDisplayName}` : ''}
                  </h1>
                  <p className="mt-1 max-w-2xl text-xs text-[var(--text-soft)] sm:text-sm">
                    {introText}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 md:mt-0">
                <div className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(245,140,55,0.13),rgba(245,140,55,0.04))] px-5 py-4 min-w-[140px]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Werven</p>
                      <p className="mt-1 text-2xl font-bold text-[var(--accent)]">{totalProjects}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)]/15">
                      <FolderOpen className="h-7 w-7 text-[var(--accent)]" />
                    </div>
                  </div>
                </div>
                <div className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(76,175,80,0.13),rgba(76,175,80,0.04))] px-5 py-4 min-w-[140px]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Actief</p>
                      <p className="mt-1 text-2xl font-bold text-green-500">{activeProjects}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/15">
                      <Activity className="h-7 w-7 text-green-500" />
                    </div>
                  </div>
                </div>
                <div className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(33,150,243,0.13),rgba(33,150,243,0.04))] px-5 py-4 min-w-[140px]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Uploads</p>
                      <p className="mt-1 text-2xl font-bold text-blue-500">{uploadsCount}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/15">
                      <UploadCloud className="h-7 w-7 text-blue-500" />
                    </div>
                  </div>
                </div>
                <div className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(156,39,176,0.13),rgba(156,39,176,0.04))] px-5 py-4 min-w-[140px]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Oplevering</p>
                      <p className="mt-1 text-2xl font-bold text-purple-500">{finalFilesCount}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/15">
                      <Download className="h-7 w-7 text-purple-500" />
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
                  Werflocaties
                </p>
                <p className="mt-1 text-xs text-[var(--text-soft)]">
                  Kaart van je werven met gekende adressen.
                </p>
              </div>

              <ProjectsMap
                locations={projectLocations}
                title="Werflocaties"
                height={240}
              />
            </div>

            <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Sneltoetsen
              </p>

              <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                {quickLinks.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href + item.label}
                      href={item.href}
                      className="relative rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-2.5 py-2.5 transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)]/80"
                    >
                      {/* Badge alleen tonen voor admin en alleen bij Klanten/Werven */}
                      {isAdmin && typeof item.badge === 'number' && (
                        <span className="absolute right-2 top-2 z-10 flex items-center justify-center rounded-full border border-[var(--accent)]/60 bg-[var(--bg-card)] px-2 py-0.5 text-xs font-semibold text-[var(--accent)] min-w-[1.8em] h-[1.6em] leading-none">
                          {item.badge}
                        </span>
                      )}
                      <div className="flex items-start gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[13px] font-semibold leading-5 text-[var(--text-main)]">
                            {item.label}
                          </span>
                          <span className="mt-0.5 block text-[11px] leading-4 text-[var(--text-soft)]">
                            {item.description}
                          </span>
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {projectsError && (
          <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            Werven konden niet volledig geladen worden.
          </div>
        )}

        <ProjectList
          projects={safeProjects}
          files={recentFiles}
          title="Mijn werven"
          description="Sneller overzicht van je werven met status, prijs en bestandsaantallen."
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