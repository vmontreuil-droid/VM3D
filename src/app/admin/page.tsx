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
  Mail,
  Eye,
  Receipt,
  Construction,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/app-shell'
import AdminSearchPanel from '@/app/admin/admin-search-panel'
import AdminUploadPanel from '@/app/admin/admin-upload-panel'
import DashboardMap from '@/components/dashboard/dashboard-map'
import DashboardNotesWidget from '@/components/dashboard/dashboard-notes-widget'
import DashboardTimeWidget from '@/components/dashboard/dashboard-time-widget'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getTicketNotificationConfig,
  sendTicketNotificationEmail,
} from '@/lib/ticket-notifications'

async function sendTicketTestEmail() {
  'use server'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role, email, full_name, company_name')
    .eq('id', user.id)
    .single()

  if (adminProfile?.role !== 'admin') {
    redirect('/dashboard')
  }

  const config = getTicketNotificationConfig()

  if (!config.enabled) {
    redirect('/admin?mail_test=config_missing')
  }

  const inboxRecipient = adminProfile?.email || user.email || ''
  if (!inboxRecipient) {
    redirect('/admin?mail_test=no_email')
  }

  const usesResendSandboxSender = config.fromAddress.endsWith('@resend.dev')
  const recipientCandidates = usesResendSandboxSender
    ? ['delivered@resend.dev', inboxRecipient]
    : [inboxRecipient]

  const displayName =
    adminProfile?.full_name || adminProfile?.company_name || inboxRecipient

  let result:
    | Awaited<ReturnType<typeof sendTicketNotificationEmail>>
    | null = null

  for (const candidate of recipientCandidates) {
    const attempt = await sendTicketNotificationEmail({
      to: [candidate],
      subject: 'Testmail ticketnotificaties',
      text: `Hallo ${displayName},\n\nDit is een testmail om te bevestigen dat ticketnotificaties correct geconfigureerd zijn.`,
      html: `<p>Hallo ${displayName},</p><p>Dit is een testmail om te bevestigen dat ticketnotificaties correct geconfigureerd zijn.</p>`,
    })

    result = attempt
    if (attempt.sent) {
      break
    }
  }

  if (!result || !result.sent) {
    const detail = result?.detail || 'Onbekende fout'
    const detailLower = detail.toLowerCase()

    if (detailLower.includes('own email address')) {
      redirect('/admin?mail_test=failed_own_email')
    }

    if (detailLower.includes('domain is not verified') || detailLower.includes('domain mismatch')) {
      redirect('/admin?mail_test=failed_domain')
    }

    if (detailLower.includes('api key is invalid')) {
      redirect('/admin?mail_test=failed_api_key')
    }

    const shortDetail = encodeURIComponent(detail.slice(0, 200))
    const reason = encodeURIComponent(result?.reason || 'unknown')
    const status = encodeURIComponent(String(result?.status || ''))
    redirect(
      `/admin?mail_test=failed&mail_test_reason=${reason}&mail_test_status=${status}&mail_test_detail=${shortDetail}`
    )
  }

  if (usesResendSandboxSender) {
    redirect('/admin?mail_test=sent_sandbox')
  }

  redirect('/admin?mail_test=sent')
}

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

type Props = {
  searchParams?: Promise<{
    mail_test?: string
    mail_test_detail?: string
    mail_test_reason?: string
    mail_test_status?: string
  }>
}

export default async function AdminPage({ searchParams }: Props) {
  const resolvedSearchParams = searchParams ? await searchParams : {}
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
    .select('id, full_name, company_name, email, vat_number, city, phone, created_at, role, latitude, longitude')
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
    (project: any) => project.status === 'offerte_aangevraagd' || project.status === 'offerte_verstuurd'
  ).length
  const activeProjects = projectsWithProfiles.filter(
    (project: any) =>
      project.status === 'in_behandeling' ||
      project.status === 'facturatie' ||
      project.status === 'factuur_verstuurd'
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
  const { count: ticketCountRaw } = await adminSupabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
  const { count: openTicketCountRaw } = await adminSupabase
    .from('tickets')
    .select('id', { count: 'exact', head: true })
    .in('status', ['nieuw', 'in_behandeling'])

  const ticketCount = ticketCountRaw ?? 0
  const openTicketCount = openTicketCountRaw ?? 0

  const { count: facturenCountRaw } = await adminSupabase
    .from('facturen')
    .select('id', { count: 'exact', head: true })
  const facturenCount = facturenCountRaw ?? 0

  const { count: offertesCountRaw } = await adminSupabase
    .from('offertes')
    .select('id', { count: 'exact', head: true })
  const offertesCount = offertesCountRaw ?? 0

  const subscriptionCount = 0
  const ticketMailConfig = getTicketNotificationConfig()
  const ticketMailEnabled = ticketMailConfig.enabled
  const missingTicketMailConfig = ticketMailConfig.missing
  const warningTicketMailConfig = ticketMailConfig.warnings

  const mailTestState = resolvedSearchParams.mail_test
  const mailTestDetail = resolvedSearchParams.mail_test_detail
  const mailTestReason = resolvedSearchParams.mail_test_reason
  const mailTestStatus = resolvedSearchParams.mail_test_status

  return (
    <AppShell isAdmin>
      <div className="space-y-3 sm:space-y-4 lg:space-y-5">
        {mailTestState === 'sent' && (
          <section className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            Testmail succesvol verzonden.
          </section>
        )}
        {mailTestState === 'sent_sandbox' && (
          <section className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            Testmail succesvol verstuurd via Resend sandbox (`delivered@resend.dev`). Voor echte inboxbezorging moet je later een eigen domein koppelen in Resend.
          </section>
        )}
        {mailTestState === 'config_missing' && (
          <section className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Testmail niet verzonden: ticketmail-config is niet volledig.
          </section>
        )}
        {mailTestState === 'no_email' && (
          <section className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Testmail niet verzonden: geen e-mailadres gevonden voor jouw profiel.
          </section>
        )}
        {mailTestState === 'failed' && (
          <section className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            Testmail verzenden is mislukt.
            {mailTestReason ? ` Reden: ${mailTestReason}.` : ''}
            {mailTestStatus ? ` Status: ${mailTestStatus}.` : ''}
            {mailTestDetail ? ` Detail: ${mailTestDetail}` : ''}
          </section>
        )}
        {mailTestState === 'failed_own_email' && (
          <section className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Resend sandbox-beperking: met een `@resend.dev` afzender mag je enkel naar je eigen Resend-account e-mailadres sturen.
          </section>
        )}
        {mailTestState === 'failed_domain' && (
          <section className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Afzenderdomein is niet geverifieerd in Resend. Koppel eerst een eigen domein en gebruik daarna dat e-mailadres als `TICKET_NOTIFICATIONS_FROM`.
          </section>
        )}
        {mailTestState === 'failed_api_key' && (
          <section className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            API key ongeldig. Maak een nieuwe key in Resend en update `RESEND_API_KEY` in Vercel.
          </section>
        )}

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
                  Kaart
                </p>
                <p className="mt-1 text-xs text-[var(--text-soft)]">
                  Werven en klanten op de kaart.
                </p>
              </div>

              <div className="min-h-[250px] flex-1 sm:min-h-[280px] xl:min-h-0">
                <DashboardMap projects={projectsWithProfiles} customers={customersWithMeta} height="100%" />
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
                  href="/admin/tickets"
                  className="group relative overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-3 transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)]/80"
                >
                  <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
                  <span className="absolute right-2 top-2 z-10 flex items-center justify-center rounded-full border border-[var(--accent)]/60 bg-[var(--bg-card)] px-2 py-0.5 text-xs font-semibold text-[var(--accent)] min-w-[1.8em] h-[1.6em] leading-none">
                    {openTicketCount}
                  </span>
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
                  href="/admin/offerte"
                  className="group relative overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-3 transition hover:border-blue-400/50 hover:bg-[var(--bg-card)]/80"
                >
                  <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-blue-400/80" />
                  <span className="absolute right-2 top-2 z-10 flex items-center justify-center rounded-full border border-blue-400/60 bg-[var(--bg-card)] px-2 py-0.5 text-xs font-semibold text-blue-400 min-w-[1.8em] h-[1.6em] leading-none">
                    {offertesCount}
                  </span>
                  <div className="flex items-start gap-2.5 pr-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-400/12 text-blue-400">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487a2.25 2.25 0 0 1 2.651 2.651l-2.25 9a2.25 2.25 0 0 1-1.697 1.697l-9 2.25a2.25 2.25 0 0 1-2.651-2.651l2.25-9a2.25 2.25 0 0 1 1.697-1.697l9-2.25Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 12.75l4.5-4.5m0 0v3.375a1.125 1.125 0 0 0 1.125 1.125H16.5" />
                      </svg>
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold leading-5 text-[var(--text-main)]">
                        Offertes
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-4 text-[var(--text-soft)]">
                        Beheer en volg offertes op.
                      </span>
                    </span>
                  </div>
                </Link>

                <Link
                  href="/admin/facturen"
                  className="group relative overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-3 transition hover:border-emerald-400/50 hover:bg-[var(--bg-card)]/80"
                >
                  <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-emerald-400/80" />
                  <span className="absolute right-2 top-2 z-10 flex items-center justify-center rounded-full border border-emerald-400/60 bg-[var(--bg-card)] px-2 py-0.5 text-xs font-semibold text-emerald-400 min-w-[1.8em] h-[1.6em] leading-none">
                    {facturenCount}
                  </span>
                  <div className="flex items-start gap-2.5 pr-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-400/12 text-emerald-400">
                      <Receipt className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold leading-5 text-[var(--text-main)]">
                        Facturen
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-4 text-[var(--text-soft)]">
                        Bekijk en beheer alle facturen.
                      </span>
                    </span>
                  </div>
                </Link>

                <Link
                  href="/admin/statistieken"
                  className="group relative overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-3 transition hover:border-purple-400/50 hover:bg-[var(--bg-card)]/80"
                >
                  <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-purple-400/80" />
                  <div className="flex items-start gap-2.5 pr-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-400/12 text-purple-400">
                      <BarChart3 className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold leading-5 text-[var(--text-main)]">
                        Statistieken
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-4 text-[var(--text-soft)]">
                        Bekijk omzet, uren en grafieken.
                      </span>
                    </span>
                  </div>
                </Link>

                <Link
                  href="/admin/machines"
                  className="group relative overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-3 transition hover:border-orange-400/50 hover:bg-[var(--bg-card)]/80"
                >
                  <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-orange-400/80" />
                  <div className="flex items-start gap-2.5 pr-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-400/12 text-orange-400">
                      <Construction className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold leading-5 text-[var(--text-main)]">
                        Machinebeheer
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-4 text-[var(--text-soft)]">
                        Beheer tablets, GPS en werven per machine.
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

        <AdminSearchPanel
          customers={customersWithMeta}
          projects={projectsWithProfiles}
        />

        <div className="grid gap-3 xl:grid-cols-[1fr_1fr]">
          <AdminUploadPanel projects={projectsWithProfiles} />

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 xl:grid-rows-2">
            <div className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
              <DashboardNotesWidget />
            </div>
            <div className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
              <DashboardTimeWidget
                projects={projectsWithProfiles
                  .filter((p: any) => p.user_id)
                  .map((p: any) => ({
                    id: String(p.id),
                    label: `${p.profiles?.company_name || p.profiles?.full_name || 'Onbekend'} — ${p.name || 'Onbenoemd'}`,
                  }))}
              />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}