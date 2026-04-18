import CustomerLogoHeaderBlock from "@/components/customers/customer-logo-header-block"
import { createAdminClient, getLogoSignedUrl } from '@/lib/supabase/admin'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { locales, defaultLocale, COOKIE_NAME, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'

type QuickLink = {
  href: string;
  label: string;
  description: any;
  icon: any;
  badge?: number;
  color?: string;
};
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
  Construction,
  Sparkles,
  UserRound,
  ArrowRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/app-shell'
import ProjectsMap from '@/components/projects/projects-map'
import ProjectList from './project-list'
import RecentFilesList from './recent-files-list'

function getStatusLabel(status: string | null, t: ReturnType<typeof getDictionary>) {
  if (!status) return t.status.onbekend
  const key = status as keyof typeof t.status
  return (t.status as Record<string, string>)[key] ?? status
}

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const raw = cookieStore.get(COOKIE_NAME)?.value ?? defaultLocale
  const locale: Locale = (locales as readonly string[]).includes(raw) ? (raw as Locale) : defaultLocale
  const t = getDictionary(locale)

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const adminSupabase = createAdminClient()

  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('role, full_name, company_name, logo_url')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'
  const logoSignedUrl = await getLogoSignedUrl(adminSupabase, profile?.logo_url)

  const { data: projects, error: projectsError } = await adminSupabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Ophalen en tellen van klanten (admin ziet alle klanten, gebruiker alleen zichzelf)
  let totalCustomers = 0;
  if (isAdmin) {
    const { count } = await adminSupabase
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
    const filesResponse = await adminSupabase
      .from('project_files')
      .select('*')
      .in('project_id', projectIds)
      .order('created_at', { ascending: false })
      .limit(12)

    recentFiles = filesResponse.data ?? []
    recentFilesError = filesResponse.error
  }

  const totalProjects = safeProjects.length
  const submittedProjects = safeProjects.filter(
    (project: any) => project.status === 'offerte_aangevraagd' || project.status === 'offerte_verstuurd'
  ).length
  const activeProjects = safeProjects.filter(
    (project: any) =>
      project.status === 'in_behandeling' ||
      project.status === 'facturatie' ||
      project.status === 'factuur_verstuurd'
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

  // Ticket count (open = nieuw + in_behandeling + wacht_op_klant)
  const { count: openTicketCount } = await adminSupabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', user.id)
    .in('status', ['nieuw', 'in_behandeling', 'wacht_op_klant'])

  const projectLocations = (totalCustomers === 0)
    ? []
    : (safeProjects && safeProjects.length > 0)
      ? safeProjects
          .filter(
            (project: any) =>
              project.latitude != null &&
              project.longitude != null &&
              !Number.isNaN(Number(project.latitude)) &&
              !Number.isNaN(Number(project.longitude))
          )
          .map((project: any) => ({
            name: project.address || project.name || t.map.projectLocation,
            latitude: Number(project.latitude),
            longitude: Number(project.longitude),
          }))
      : []

  const customerDisplayName = profile?.company_name || ''

  const introText = profile?.company_name
    ? `${t.portalHeader.welcomeCompany} ${profile.company_name}. ${t.portalHeader.welcomeGeneric.split('.')[1]?.trim() || ''}`
    : t.portalHeader.welcomeGeneric

  const quickLinks: QuickLink[] = isAdmin
    ? [
        {
          href: '/admin/customers',
          label: t.adminCards.customers,
          description: t.adminCards.customersDesc,
          icon: Users,
          badge: totalCustomers,
        },
        {
          href: '/admin',
          label: t.adminCards.sites,
          description: t.adminCards.sitesDesc,
          icon: FolderOpen,
          badge: totalProjects,
        },
        {
          href: '/admin/customers/new',
          label: t.adminCards.newCustomer,
          description: t.adminCards.newCustomerDesc,
          icon: PlusCircle,
        },
        {
          href: '/admin/projects/new',
          label: t.adminCards.newSite,
          description: t.adminCards.newSiteDesc,
          icon: PlusCircle,
        },
        {
          href: '/dashboard/tickets',
          label: t.adminCards.tickets,
          description: t.adminCards.ticketsDesc,
          icon: Ticket,
          badge: openTicketCount ?? 0,
        },
        {
          href: '/dashboard/offerte',
          label: t.adminCards.offerte,
          description: t.adminCards.offerteDesc,
          icon: FilePlus,
        },
        {
          href: '/dashboard/abonnement',
          label: t.adminCards.subscription,
          description: t.adminCards.subscriptionDesc,
          icon: CreditCard,
        },
        {
          href: '/admin/projects/statistics',
          label: t.adminCards.statistics,
          description: t.adminCards.statisticsDesc,
          icon: BarChart3,
        },
        {
          href: '/admin?view=uploads',
          label: t.adminCards.uploadsCard,
          description: t.adminCards.uploadsDesc,
          icon: UploadCloud,
        },
      ]
    : [
        {
          href: '/dashboard',
          label: t.adminCards.mySites,
          description: t.adminCards.mySitesDesc,
          icon: FolderOpen,
          badge: totalProjects,
        },
        {
          href: '/dashboard/tickets',
          label: t.adminCards.tickets,
          description: t.adminCards.ticketReport,
          icon: Ticket,
          badge: openTicketCount ?? 0,
        },
        {
          href: '/dashboard/abonnement',
          label: t.adminCards.subscription,
          description: t.adminCards.subscriptionSelf,
          icon: CreditCard,
          badge: 0,
        },
        {
          href: '/dashboard/offerte',
          label: t.adminCards.requestQuote,
          description: t.adminCards.requestQuoteDesc,
          icon: FilePlus,
        },
        {
          href: '/dashboard/facturatie',
          label: t.platform.billing,
          description: t.adminCards.billingSelf,
          icon: FileText,
          badge: 0,
        },
        {
          href: '/dashboard',
          label: t.portalHeader.uploads,
          description: t.adminCards.uploadsSelf,
          icon: UploadCloud,
          badge: uploadsCount,
        },
        {
          href: '/dashboard',
          label: t.portalHeader.deliveries,
          description: t.adminCards.deliverySelf,
          icon: Download,
          badge: finalFilesCount,
        },
        {
          href: '/dashboard/machinetools',
          label: t.platform.machinetools,
          description: t.adminCards.machinetoolsDesc,
          icon: Construction,
          color: 'green',
        },
      ]

  return (
    <AppShell isAdmin={false}>
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
                  <CustomerLogoHeaderBlock logoUrl={logoSignedUrl} />
                </div>
                <div className="min-w-0 flex flex-col justify-center">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                    {t.portalHeader.portal}
                  </p>
                  <h1 className="mt-1 text-xl font-semibold text-[var(--text-main)] sm:text-2xl">
                    {t.portalHeader.portal}{customerDisplayName ? `, ${customerDisplayName}` : ''}
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
                      <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">{t.portalHeader.sites}</p>
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
                      <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">{t.portalHeader.active}</p>
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
                      <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">{t.portalHeader.uploads}</p>
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
                      <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">{t.portalHeader.deliveries}</p>
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
                  {t.adminCards.siteLocations}
                </p>
                <p className="mt-1 text-xs text-[var(--text-soft)]">
                  {t.adminCards.siteLocationsDesc}
                </p>
              </div>

              <ProjectsMap
                locations={projectLocations}
                title={t.adminCards.siteLocations}
                height={240}
              />
            </div>

            <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                {t.adminCards.quickLinks}
              </p>

              <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                {quickLinks.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href + item.label}
                      href={item.href}
                      className={`relative rounded-lg border px-2.5 py-2.5 transition ${
                        item.color === 'green'
                          ? 'border-emerald-500/30 bg-[linear-gradient(135deg,rgba(16,185,129,0.10),rgba(16,185,129,0.03))] hover:border-emerald-500/60'
                          : 'border-[var(--border-soft)] bg-[var(--bg-card)] hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)]/80'
                      }`}
                    >
                      {'badge' in item ? (
                        <span className={`absolute right-2 top-2 z-10 flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-semibold min-w-[1.8em] h-[1.6em] leading-none ${
                          item.color === 'green'
                            ? 'border-emerald-500/60 bg-[var(--bg-card)] text-emerald-400'
                            : 'border-[var(--accent)]/60 bg-[var(--bg-card)] text-[var(--accent)]'
                        }`}>
                          {typeof item.badge === 'number' ? item.badge : 0}
                        </span>
                      ) : null}
                      <div className="flex items-start gap-2.5">
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          item.color === 'green'
                            ? 'bg-emerald-500/12 text-emerald-400'
                            : 'bg-[var(--accent)]/12 text-[var(--accent)]'
                        }`}>
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
            {t.adminCards.siteLoadError}
          </div>
        )}

        {!isAdmin && totalProjects === 0 && (
          <section className="relative overflow-hidden rounded-xl border border-[var(--accent)]/30 bg-[linear-gradient(135deg,rgba(247,148,29,0.12),rgba(247,148,29,0.02))] px-4 py-5 sm:px-6 sm:py-6 shadow-sm">
            <div className="absolute inset-0 pointer-events-none opacity-60 bg-[radial-gradient(circle_at_top_right,rgba(247,148,29,0.15),transparent_45%)]" />
            <div className="relative">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                    {t.onboarding.eyebrow}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-[var(--text-main)] sm:text-2xl">
                    {t.onboarding.title}
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm text-[var(--text-soft)]">
                    {t.onboarding.subtitle}
                  </p>
                </div>
                <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/15 text-[var(--accent)] sm:flex">
                  <Sparkles className="h-6 w-6" />
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  {
                    href: '/dashboard/offerte',
                    icon: FilePlus,
                    title: t.onboarding.stepQuoteTitle,
                    body: t.onboarding.stepQuoteBody,
                    cta: t.onboarding.stepQuoteCta,
                  },
                  {
                    href: '/dashboard/tickets',
                    icon: Ticket,
                    title: t.onboarding.stepTicketTitle,
                    body: t.onboarding.stepTicketBody,
                    cta: t.onboarding.stepTicketCta,
                  },
                  {
                    href: '/dashboard/klantfiche',
                    icon: UserRound,
                    title: t.onboarding.stepProfileTitle,
                    body: t.onboarding.stepProfileBody,
                    cta: t.onboarding.stepProfileCta,
                  },
                ].map((step) => {
                  const Icon = step.icon
                  return (
                    <Link
                      key={step.href}
                      href={step.href}
                      className="group flex flex-col rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-4 transition hover:border-[var(--accent)]/60 hover:bg-[var(--bg-card-2)]"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
                        <Icon className="h-5 w-5" />
                      </span>
                      <p className="mt-3 text-sm font-semibold text-[var(--text-main)]">
                        {step.title}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">
                        {step.body}
                      </p>
                      <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] group-hover:gap-2 transition-all">
                        {step.cta}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </Link>
                  )
                })}
              </div>

              <p className="mt-4 text-xs text-[var(--text-muted)]">
                {t.onboarding.helper}
              </p>
            </div>
          </section>
        )}

        <ProjectList
          projects={safeProjects}
          files={recentFiles}
          title={t.adminCards.mySites}
          description={t.adminCards.sitesOverviewDesc}
        />

        {recentFilesError && (
          <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {t.adminCards.fileLoadError}
          </div>
        )}

        <RecentFilesList files={recentFiles} />
      </div>
    </AppShell>
  )
}