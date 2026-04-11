import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  Building2,
  CreditCard,
  KeyRound,
  Mail,
  MapPinned,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react'
import AppShell from '@/components/app-shell'
import CustomerMap from '@/components/customers/customer-map'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type Props = {
  params: Promise<{
    id: string
  }>
  searchParams?: Promise<{
    updated?: string
    created?: string
    invite?: string
    warning?: string
    setup?: string
  }>
}

function display(value: unknown) {
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
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

function getStatusClass(status: string | null) {
  switch (status) {
    case 'ingediend':
      return 'badge-info'
    case 'in_behandeling':
      return 'badge-warning'
    case 'klaar_voor_betaling':
      return 'badge-warning'
    case 'afgerond':
      return 'badge-success'
    default:
      return 'badge-neutral'
  }
}

export default async function AdminCustomerDetailPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params
  const resolvedSearchParams = searchParams ? await searchParams : {}

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

  const { data: customer, error: customerError } = await adminSupabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (customerError || !customer) {
    redirect('/admin/customers')
  }

  const { data: projects } = await adminSupabase
    .from('projects')
    .select('*')
    .eq('user_id', id)
    .order('created_at', { ascending: false })

  const { data: authUserData } = await adminSupabase.auth.admin.getUserById(id)
  const authUser = authUserData?.user ?? null

  const safeProjects = projects ?? []

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

  const recentProjects = safeProjects.slice(0, 5)
  const latestProject = safeProjects[0] ?? null
  const latestProjectDate = latestProject?.created_at
    ? new Date(latestProject.created_at).toLocaleDateString('nl-BE')
    : '—'
  const lastSignInDate = authUser?.last_sign_in_at
    ? new Date(authUser.last_sign_in_at).toLocaleDateString('nl-BE')
    : null
  const invitedNotSignedIn = !lastSignInDate
  const emailConfirmed = Boolean(authUser?.email_confirmed_at)

  const fullAddress =
    [
      customer.street,
      customer.house_number,
      customer.bus,
      customer.postal_code,
      customer.city,
      customer.country,
    ]
      .filter(Boolean)
      .join(', ') || '—'

  const title =
    customer.company_name || customer.full_name || 'Onbekende klant'

  let customerLogoUrl: string | null = null

  if (customer.logo_path) {
    const { data: logoData } = await adminSupabase.storage
      .from('project-files')
      .createSignedUrl(customer.logo_path, 60 * 60)

    customerLogoUrl = logoData?.signedUrl ?? null
  }

  const managerName = [
    customer.director_first_name,
    customer.director_last_name,
  ]
    .filter(Boolean)
    .join(' ')
  const contactName = managerName || customer.full_name || '—'
  const contactTitle = display(customer.salutation)
  const invoiceEmailDisplay = customer.invoice_email || customer.email
  const shellClass =
    'flex h-full flex-col overflow-hidden rounded-[18px] border border-[var(--border-soft)] bg-[var(--bg-card-2)]/80 shadow-sm'
  const sectionClass =
    'flex h-full flex-col overflow-hidden rounded-[18px] border border-[var(--border-soft)] bg-[var(--bg-card-2)]/80 shadow-sm'
  const sectionBodyClass = 'flex-1 space-y-2 px-4 py-3 sm:px-5'
  const sectionHeadingClass =
    'text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]'
  const sectionTitleClass =
    'mt-1 flex items-center gap-2 text-sm font-semibold text-[var(--text-main)]'

  const updated = resolvedSearchParams?.updated === '1'
  const created = resolvedSearchParams?.created === '1'
  const inviteSent = resolvedSearchParams?.invite === '1'
  const inviteFailed = resolvedSearchParams?.warning === 'invite_failed'
  const manualPasswordSet = resolvedSearchParams?.setup === 'manual'

  return (
    <AppShell isAdmin>
      <div className="space-y-3 sm:space-y-4 lg:space-y-5">
        {(updated || created || inviteSent || inviteFailed || manualPasswordSet) && (
          <section className="space-y-3">
            {updated && (
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                Klantgegevens werden succesvol bijgewerkt.
              </div>
            )}

            {created && (
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                Klantaccount werd succesvol aangemaakt.
              </div>
            )}

            {inviteSent && (
              <div className="rounded-xl border border-blue-500/25 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
                Uitnodigingsmail werd verstuurd naar deze klant.
              </div>
            )}

            {inviteFailed && (
              <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                Klant werd aangemaakt of bijgewerkt, maar de uitnodigingsmail kon niet verzonden
                worden.
              </div>
            )}

            {manualPasswordSet && (
              <div className="rounded-xl border border-blue-500/25 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
                Voor deze klant werd een manueel wachtwoord ingesteld.
              </div>
            )}
          </section>
        )}

        <section className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
          <div className="relative border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-5 sm:px-5">
            <div className="absolute inset-0 opacity-30">
              <div className="h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(242,140,58,0.18),transparent_35%),radial-gradient(circle_at_left,rgba(255,255,255,0.05),transparent_25%)]" />
            </div>

            <div className="relative flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href="/admin/customers" className="btn-secondary">
                    ← Terug
                  </Link>

                  <Link
                    href={`/admin/customers/${customer.id}/edit`}
                    className="btn-secondary"
                  >
                    ✏️ Bewerken
                  </Link>

                  <Link
                    href={`/admin/projects/new?customer=${customer.id}`}
                    className="btn-primary"
                  >
                    + Nieuwe werf
                  </Link>
                </div>

                <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                  Premium klantenfiche
                </p>

                <h1 className="mt-2 text-2xl font-semibold text-[var(--text-main)] sm:text-3xl">
                  {title}
                </h1>

                <p className="mt-2.5 max-w-3xl text-sm leading-6 text-[var(--text-soft)]">
                  {fullAddress}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="badge-neutral px-3 py-1 text-xs font-semibold">
                    BTW: {display(customer.vat_number)}
                  </span>
                  <span className="badge-neutral px-3 py-1 text-xs font-semibold">
                    Ondernemingsnr: {display(customer.enterprise_number)}
                  </span>
                  <span className="badge-neutral px-3 py-1 text-xs font-semibold">
                    E-mail: {display(customer.email)}
                  </span>
                  <span
                    className={`px-3 py-1 text-xs font-semibold ${
                      customer.is_active === false ? 'badge-warning' : 'badge-success'
                    }`}
                  >
                    {customer.is_active === false ? 'Inactief' : 'Actief'}
                  </span>
                </div>
              </div>

              <div className="flex w-full flex-col gap-4 xl:w-auto">
                <div className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)]/80 shadow-sm backdrop-blur">
                  <div className="flex items-center gap-4 px-4 py-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[var(--accent)] text-xl font-bold text-white shadow-sm">
                      {customerLogoUrl ? (
                        <img
                          src={customerLogoUrl}
                          alt={`Logo van ${title}`}
                          className="h-full w-full object-contain bg-white/95 p-2"
                        />
                      ) : (
                        <span>{title.slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                        Klant
                      </p>
                      <p className="mt-1 truncate text-sm font-semibold text-[var(--text-main)]">
                        {title}
                      </p>
                      <p className="mt-1 text-xs text-[var(--text-soft)]">
                        Beheerfiche & opvolging
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4 xl:w-auto">
                  <div className="card-mini text-center">
                    <p className="text-xs text-[var(--text-muted)]">Werven</p>
                    <p className="text-lg font-semibold text-[var(--text-main)]">
                      {totalProjects}
                    </p>
                  </div>

                  <div className="card-mini text-center">
                    <p className="text-xs text-[var(--text-muted)]">Actief</p>
                    <p className="text-lg font-semibold text-[var(--text-main)]">
                      {activeProjects}
                    </p>
                  </div>

                  <div className="card-mini text-center">
                    <p className="text-xs text-[var(--text-muted)]">Afgerond</p>
                    <p className="text-lg font-semibold text-[var(--text-main)]">
                      {completedProjects}
                    </p>
                  </div>

                  <div className="card-mini text-center">
                    <p className="text-xs text-[var(--text-muted)]">Laatste</p>
                    <p className="text-lg font-semibold text-[var(--text-main)]">
                      {latestProjectDate}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-2 px-4 py-4 sm:px-5 xl:grid-cols-[1.1fr_0.9fr]">
            <section className={sectionClass}>
              <div className="border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-3.5 sm:px-5">
                <p className={sectionHeadingClass}>Overzicht</p>
                <h2 className={sectionTitleClass}>
                  <Building2 className="h-4 w-4 text-[var(--accent)]" />
                  Snelle info
                </h2>
              </div>

              <div className={`${sectionBodyClass} !space-y-0`}>
                <div className="grid gap-3 sm:grid-cols-2">
                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">Contact</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {contactName}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-soft)]">
                    {display(customer.email)}
                  </p>
                </div>

                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">Bestuurder</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {display(managerName)}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-soft)]">
                    {display(customer.rpr)}
                  </p>
                </div>

                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">Telefoon</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {display(customer.phone)}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-soft)]">
                    Mobiel: {display(customer.mobile)}
                  </p>
                </div>

                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">Facturatie</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)] break-all">
                    {display(invoiceEmailDisplay)}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-soft)]">
                    {getInvoiceSendMethodLabel(customer.invoice_send_method)}
                  </p>
                </div>
              </div>
              </div>
            </section>

            <section className={sectionClass}>
              <div className="border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-3.5 sm:px-5">
                <p className={sectionHeadingClass}>Acties</p>
                <h2 className={sectionTitleClass}>
                  <ShieldCheck className="h-4 w-4 text-[var(--accent)]" />
                  Snelle acties
                </h2>
              </div>

              <div className={`${sectionBodyClass} !space-y-0`}>
                <div className="grid gap-3 sm:grid-cols-2">
                <Link
                  href={`/admin/customers/${customer.id}/edit`}
                  className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-4 transition hover:border-[var(--accent)]/40 hover:bg-[var(--bg-card)]/80"
                >
                  <p className="text-sm font-semibold text-[var(--text-main)]">
                    Bewerk klant
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-soft)]">
                    Pas bedrijfs- en contactgegevens aan.
                  </p>
                </Link>

                <Link
                  href={`/admin/projects/new?customer=${customer.id}`}
                  className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-4 transition hover:border-[var(--accent)]/40 hover:bg-[var(--bg-card)]/80"
                >
                  <p className="text-sm font-semibold text-[var(--text-main)]">
                    Nieuwe werf
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-soft)]">
                    Start direct een nieuw dossier voor deze klant.
                  </p>
                </Link>

                <Link
                  href="/admin/customers"
                  className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-4 transition hover:border-[var(--accent)]/40 hover:bg-[var(--bg-card)]/80"
                >
                  <p className="text-sm font-semibold text-[var(--text-main)]">
                    Naar klantenoverzicht
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-soft)]">
                    Terug naar de volledige klantenlijst.
                  </p>
                </Link>

                {latestProject ? (
                  <Link
                    href={`/admin/projects/${latestProject.id}`}
                    className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-4 transition hover:border-[var(--accent)]/40 hover:bg-[var(--bg-card)]/80"
                  >
                    <p className="text-sm font-semibold text-[var(--text-main)]">
                      Open laatste project
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-soft)]">
                      {latestProject.title || 'Recente werf openen'}
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
            </section>
          </div>
        </section>

        <section className="grid gap-2 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-2">
            <section className={shellClass}>
              <div className="border-b border-[var(--border-soft)] px-4 py-4 sm:px-5">
                <p className={sectionHeadingClass}>Bedrijfsfiche</p>
                <h2 className={sectionTitleClass}>
                  <Building2 className="h-4 w-4 text-[var(--accent)]" />
                  Bedrijf & aanspreekpunt
                </h2>
                <p className="mt-1 text-xs text-[var(--text-soft)]">
                  Kerngegevens van de onderneming en contactpersoon.
                </p>
              </div>

              <div className="grid gap-3 px-4 py-4 sm:grid-cols-2 sm:px-5">
                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">Bedrijf</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {display(customer.company_name)}
                  </p>
                </div>

                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">Aanspreektitel</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {contactTitle}
                  </p>
                </div>

                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">Contactpersoon</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {contactName}
                  </p>
                </div>

                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">BTW-nummer</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {display(customer.vat_number)}
                  </p>
                </div>

                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">
                    Ondernemingsnummer
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {display(customer.enterprise_number)}
                  </p>
                </div>

                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">Referentie</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {display(customer.reference)}
                  </p>
                </div>

                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">Aanspreking</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {display(customer.salutation)}
                  </p>
                </div>

                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">Bestuurder</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {display(managerName)}
                  </p>
                </div>

                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">RPR</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {display(customer.rpr)}
                  </p>
                </div>
              </div>
            </section>

            <section className={shellClass}>
              <div className="border-b border-[var(--border-soft)] px-4 py-4 sm:px-5">
                <p className={sectionHeadingClass}>Communicatie</p>
                <h2 className={sectionTitleClass}>
                  <Mail className="h-4 w-4 text-[var(--accent)]" />
                  Contact & verzending
                </h2>
                <p className="mt-1 text-xs text-[var(--text-soft)]">
                  Bereikbaarheid en facturatieverzending.
                </p>
              </div>

              <div className="grid gap-2 px-4 py-4 sm:grid-cols-2 sm:px-5">
                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">E-mail</p>
                  <p className="mt-1 break-all text-sm font-semibold text-[var(--text-main)]">
                    {display(customer.email)}
                  </p>
                </div>

                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">
                    Facturatie e-mail
                  </p>
                  <p className="mt-1 break-all text-sm font-semibold text-[var(--text-main)]">
                    {display(invoiceEmailDisplay)}
                  </p>
                </div>

                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">Website</p>
                  <p className="mt-1 break-all text-sm font-semibold text-[var(--text-main)]">
                    {display(customer.website)}
                  </p>
                </div>

                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">Taal</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {getLanguageLabel(customer.language)}
                  </p>
                </div>

                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">Telefoon</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {display(customer.phone)}
                  </p>
                </div>

                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">Mobiel</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {display(customer.mobile)}
                  </p>
                </div>

                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">Fax</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {display(customer.fax)}
                  </p>
                </div>

                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">
                    Verstuurmethode
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {getInvoiceSendMethodLabel(customer.invoice_send_method)}
                  </p>
                </div>

                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">XML</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {customer.send_xml ? 'Ja' : 'Nee'}
                  </p>
                </div>

                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">XML-formaat</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {display(customer.xml_format)}
                  </p>
                </div>

                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">PDF</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {customer.send_pdf ? 'Ja' : 'Nee'}
                  </p>
                </div>

                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">
                    Herinneringen
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {customer.auto_reminders ? 'Ja' : 'Nee'}
                  </p>
                </div>
              </div>
            </section>

            <section className={shellClass}>
              <div className="border-b border-[var(--border-soft)] px-4 py-4 sm:px-5">
                <p className={sectionHeadingClass}>Financieel</p>
                <h2 className={sectionTitleClass}>
                  <CreditCard className="h-4 w-4 text-[var(--accent)]" />
                  Facturatie
                </h2>
                <p className="mt-1 text-xs text-[var(--text-soft)]">
                  Betalingsvoorwaarden en standaard instellingen.
                </p>
              </div>

              <div className="grid gap-2 px-4 py-4 sm:grid-cols-2 sm:px-5">
                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">
                    Betalingstermijn
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {display(customer.payment_term_days)}
                  </p>
                </div>

                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">
                    Geldigheid offerte
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {display(customer.quote_validity_days)}
                  </p>
                </div>

                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">Betaalwijze</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {display(customer.payment_method)}
                  </p>
                </div>

                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">Munteenheid</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {display(customer.currency)}
                  </p>
                </div>

                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">IBAN</p>
                  <p className="mt-1 break-all text-sm font-semibold text-[var(--text-main)]">
                    {display(customer.iban)}
                  </p>
                </div>

                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">BIC</p>
                  <p className="mt-1 break-all text-sm font-semibold text-[var(--text-main)]">
                    {display(customer.bic)}
                  </p>
                </div>

                <div className="sm:col-span-2 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-4">
                  <p className="text-xs text-[var(--text-muted)]">BTW-tarief</p>
                  <p className="mt-2 text-sm font-semibold text-[var(--text-main)]">
                    {display(customer.vat_rate)}
                  </p>
                </div>
              </div>
            </section>

            <section className={shellClass}>
              <div className="border-b border-[var(--border-soft)] px-4 py-4 sm:px-5">
                <p className={sectionHeadingClass}>Locatie</p>
                <h2 className={sectionTitleClass}>
                  <MapPinned className="h-4 w-4 text-[var(--accent)]" />
                  Adresgegevens
                </h2>
                <p className="mt-1 text-xs text-[var(--text-soft)]">
                  Volledig adres van de klant.
                </p>
              </div>

              <div className="grid gap-2 px-4 py-4 sm:grid-cols-2 sm:px-5">
                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">Straat</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {display(customer.street)}
                  </p>
                </div>

                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">Nr</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {display(customer.house_number)}
                  </p>
                </div>

                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">Bus</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {display(customer.bus)}
                  </p>
                </div>

                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">Postcode</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {display(customer.postal_code)}
                  </p>
                </div>

                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">Gemeente</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {display(customer.city)}
                  </p>
                </div>

                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">Land</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {display(customer.country)}
                  </p>
                </div>

                <div className="sm:col-span-2 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-4">
                  <p className="text-xs text-[var(--text-muted)]">
                    Volledig adres
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--text-main)]">
                    {fullAddress}
                  </p>
                </div>

              </div>
            </section>
          </div>

          <div className="space-y-2">
            <section className={shellClass}>
              <div className="border-b border-[var(--border-soft)] px-4 py-4">
                <p className={sectionHeadingClass}>Kaart</p>
                <h2 className={sectionTitleClass}>
                  <MapPinned className="h-4 w-4 text-[var(--accent)]" />
                  Locatie
                </h2>
                <p className="mt-1 text-xs text-[var(--text-soft)]">
                  Adrespositie van deze klant op kaart.
                </p>
              </div>

              <div className="px-4 py-4">
                <CustomerMap
                  latitude={customer.latitude}
                  longitude={customer.longitude}
                  label={fullAddress}
                />
              </div>
            </section>

            <section className={shellClass}>
              <div className="flex items-center justify-between gap-2 border-b border-[var(--border-soft)] px-4 py-4">
                <div>
                  <p className={sectionHeadingClass}>Projecten</p>
                  <h2 className={sectionTitleClass}>
                    <ShieldCheck className="h-4 w-4 text-[var(--accent)]" />
                    Werven
                  </h2>
                  <p className="mt-1 text-xs text-[var(--text-soft)]">
                    Laatste gekoppelde dossiers van deze klant.
                  </p>
                </div>

                <Link
                  href={`/admin?customer=${customer.id}`}
                  className="btn-secondary"
                >
                  Alles bekijken
                </Link>
              </div>

              <div className="grid gap-2 px-4 py-4">
                {recentProjects.length === 0 ? (
                  <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-4 text-sm text-[var(--text-soft)]">
                    Nog geen werven gevonden.
                  </div>
                ) : (
                  recentProjects.map((project: any) => (
                    <div
                      key={project.id}
                      className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-4 transition hover:bg-[var(--bg-card-3)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-[var(--text-main)]">
                            {project.title || '—'}
                          </p>

                          <p className="mt-1 text-sm text-[var(--text-soft)]">
                            {project.address || 'Geen locatie'}
                          </p>

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusClass(
                                project.status
                              )}`}
                            >
                              {getStatusLabel(project.status)}
                            </span>

                            <span className="text-xs text-[var(--text-muted)]">
                              {project.created_at
                                ? new Date(project.created_at).toLocaleDateString(
                                    'nl-BE'
                                  )
                                : '—'}
                            </span>
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-2">
                          <Link
                            href={`/admin/projects/${project.id}`}
                            className="btn-secondary text-xs px-3 py-1"
                          >
                            Open
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className={sectionClass}>
              <div className="border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-3.5 sm:px-5">
                <p className={sectionHeadingClass}>Notities</p>
                <h2 className={sectionTitleClass}>
                  <MessageSquare className="h-4 w-4 text-[var(--accent)]" />
                  Interne opmerkingen
                </h2>
              </div>
              <div className={sectionBodyClass}>
                <p className="whitespace-pre-wrap rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-main)]">
                  {display(customer.comments)}
                </p>
              </div>
            </section>

            <section className={sectionClass}>
              <div className="border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-3.5 sm:px-5">
                <p className={sectionHeadingClass}>Toegang</p>
                <h2 className={sectionTitleClass}>
                  <KeyRound className="h-4 w-4 text-[var(--accent)]" />
                  Login & wachtwoord
                </h2>
              </div>

              <div className={`${sectionBodyClass} !space-y-3`}>
                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">Login e-mail</p>
                  <p className="mt-1 break-all text-sm font-semibold text-[var(--text-main)]">
                    {display(customer.email)}
                  </p>
                </div>

                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">Accountstatus</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {invitedNotSignedIn
                      ? 'Klant kiest zelf een wachtwoord via uitnodigingsmail'
                      : 'Reeds aangemeld'}
                  </p>
                  {invitedNotSignedIn && (
                    <p className="mt-1 text-xs text-[var(--text-soft)]">
                      Verstuur opnieuw via bewerken als de klant nog geen login deed.
                    </p>
                  )}
                </div>

                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">Laatste login</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {lastSignInDate || 'Nog geen login geregistreerd'}
                  </p>
                </div>

                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">E-mail bevestigd</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {emailConfirmed ? 'Ja' : 'Nee'}
                  </p>
                </div>

                <Link
                  href={`/admin/customers/${customer.id}/edit`}
                  className="btn-secondary text-center"
                >
                  Login-instellingen aanpassen
                </Link>
              </div>
            </section>
          </div>
        </section>
      </div>
    </AppShell>
  )
}

function getLanguageLabel(language: string | null) {
  const normalized = language?.toLowerCase()

  switch (normalized) {
    case 'nl':
      return 'Nederlands'
    case 'fr':
      return 'Frans'
    case 'en':
    case 'eng':
      return 'Engels'
    case 'de':
      return 'Duits'
    default:
      return display(language)
  }
}

function getInvoiceSendMethodLabel(method: string | null) {
  switch (method) {
    case 'email':
      return 'E-mail'
    case 'peppol':
      return 'PEPPOL'
    case 'post':
      return 'Post'
    default:
      return display(method)
  }
}