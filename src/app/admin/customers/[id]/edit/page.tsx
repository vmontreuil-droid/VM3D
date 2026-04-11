import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock3,
  CircleDollarSign,
  FolderOpen,
  Mail,
  PhoneCall,
  PlusCircle,
  UserCheck,
} from 'lucide-react'
import AppShell from '@/components/app-shell'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import CustomerEditForm from './edit-customer-form'
import ProjectsDropdown from './projects-dropdown'
import AdminCustomerActions from '../../admin-customer-actions'

type Props = {
  params: Promise<{
    id: string
  }>
  searchParams?: Promise<{
    error?: string
  }>
}

async function updateCustomer(formData: FormData) {
  'use server'

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

  const id = String(formData.get('id') || '').trim()
  if (!id) {
    redirect('/admin/customers')
  }

  const fullName = String(formData.get('full_name') || '').trim()
  const companyName = String(formData.get('company_name') || '').trim()
  const email = String(formData.get('email') || '').trim().toLowerCase()
  const vatNumber = String(formData.get('vat_number') || '').trim().toUpperCase()
  const enterpriseNumber = String(formData.get('enterprise_number') || '').trim()
  const reference = String(formData.get('reference') || '').trim()
  const salutation = String(formData.get('salutation') || '').trim()
  const directorFirstName = String(formData.get('director_first_name') || '').trim()
  const directorLastName = String(formData.get('director_last_name') || '').trim()
  const rpr = String(formData.get('rpr') || '').trim()
  const invoiceEmail = String(formData.get('invoice_email') || '').trim()
  const website = String(formData.get('website') || '').trim()
  const phone = String(formData.get('phone') || '').trim()
  const mobile = String(formData.get('mobile') || '').trim()
  const fax = String(formData.get('fax') || '').trim()
  const language = String(formData.get('language') || '').trim()
  const iban = String(formData.get('iban') || '').trim().toUpperCase()
  const bic = String(formData.get('bic') || '').trim().toUpperCase()
  const logoPath = String(formData.get('logo_path') || '').trim()

  const paymentTermDaysRaw = String(formData.get('payment_term_days') || '').trim()
  const quoteValidityDaysRaw = String(formData.get('quote_validity_days') || '').trim()

  const paymentMethod = String(formData.get('payment_method') || '').trim()
  const currency = String(formData.get('currency') || '').trim()
  const vatRate = String(formData.get('vat_rate') || '').trim()
  const invoiceSendMethod = String(formData.get('invoice_send_method') || '').trim()
  const xmlFormat = String(formData.get('xml_format') || '').trim()

  const sendXml = String(formData.get('send_xml') || '') === 'yes'
  const sendPdf = String(formData.get('send_pdf') || '') === 'yes'
  const autoReminders = String(formData.get('auto_reminders') || '') === 'yes'
  const passwordModeRaw = String(formData.get('password_mode') || 'keep').trim()
  const passwordMode =
    passwordModeRaw === 'invite' || passwordModeRaw === 'manual'
      ? passwordModeRaw
      : 'keep'
  const password = String(formData.get('password') || '')
  const passwordConfirm = String(formData.get('password_confirm') || '')

  const street = String(formData.get('street') || '').trim()
  const houseNumber = String(formData.get('house_number') || '').trim()
  const bus = String(formData.get('bus') || '').trim()
  const postalCode = String(formData.get('postal_code') || '').trim()
  const city = String(formData.get('city') || '').trim()
  const country = String(formData.get('country') || '').trim()
  const comments = String(formData.get('comments') || '').trim()

  const latitudeRaw = String(formData.get('latitude') || '').trim()
  const longitudeRaw = String(formData.get('longitude') || '').trim()

  const paymentTermDays =
    paymentTermDaysRaw === '' ? null : Number(paymentTermDaysRaw)
  const quoteValidityDays =
    quoteValidityDaysRaw === '' ? null : Number(quoteValidityDaysRaw)
  const latitude = latitudeRaw === '' ? null : Number(latitudeRaw)
  const longitude = longitudeRaw === '' ? null : Number(longitudeRaw)

  if (passwordMode === 'manual') {
    if (password.length < 8 || password !== passwordConfirm) {
      redirect(`/admin/customers/${id}/edit?error=password_setup`)
    }
  }

  const authPayload: {
    email?: string
    email_confirm?: boolean
    password?: string
    user_metadata: {
      full_name: string | null
      company_name: string | null
    }
  } = {
    user_metadata: {
      full_name: fullName || null,
      company_name: companyName || null,
    },
  }

  if (email) {
    authPayload.email = email
    authPayload.email_confirm = true
  }

  if (passwordMode === 'manual') {
    authPayload.password = password
  }

  const { error: authUpdateError } = await adminSupabase.auth.admin.updateUserById(
    id,
    authPayload
  )

  if (authUpdateError) {
    console.error('authUpdateError:', authUpdateError)
    redirect(`/admin/customers/${id}/edit?error=auth_update`)
  }

  const profileUpdate = {
    full_name: fullName || null,
    company_name: companyName || null,
    email: email || null,
    vat_number: vatNumber || null,
    enterprise_number: enterpriseNumber || null,
    reference: reference || null,
    salutation: salutation || null,
    director_first_name: directorFirstName || null,
    director_last_name: directorLastName || null,
    rpr: rpr || null,
    invoice_email: invoiceEmail || null,
    website: website || null,
    phone: phone || null,
    mobile: mobile || null,
    fax: fax || null,
    language: language || null,
    iban: iban || null,
    bic: bic || null,
    logo_path: logoPath || null,
    payment_term_days:
      paymentTermDays === null || Number.isNaN(paymentTermDays)
        ? null
        : paymentTermDays,
    quote_validity_days:
      quoteValidityDays === null || Number.isNaN(quoteValidityDays)
        ? null
        : quoteValidityDays,
    payment_method: paymentMethod || null,
    currency: currency || null,
    vat_rate: vatRate || null,
    invoice_send_method: invoiceSendMethod || null,
    send_xml: sendXml,
    xml_format: xmlFormat || null,
    send_pdf: sendPdf,
    auto_reminders: autoReminders,
    street: street || null,
    house_number: houseNumber || null,
    bus: bus || null,
    postal_code: postalCode || null,
    city: city || null,
    country: country || null,
    comments: comments || null,
    latitude:
      latitude === null || Number.isNaN(latitude) ? null : latitude,
    longitude:
      longitude === null || Number.isNaN(longitude) ? null : longitude,
  }

  let { error } = await adminSupabase
    .from('profiles')
    .update(profileUpdate)
    .eq('id', id)

  if (
    error &&
    typeof error.message === 'string' &&
    /(column .*iban|column .*bic|column .*logo_path|iban|bic|logo_path)/i.test(
      error.message
    )
  ) {
    const {
      iban: _iban,
      bic: _bic,
      logo_path: _logoPath,
      ...profileUpdateWithoutBankFields
    } = profileUpdate

    const retryResult = await adminSupabase
      .from('profiles')
      .update(profileUpdateWithoutBankFields)
      .eq('id', id)

    error = retryResult.error ?? null
  }

  if (error) {
    console.error('updateCustomer error:', error)
    redirect(`/admin/customers/${id}/edit?error=save`)
  }

  if (passwordMode === 'invite') {
    if (!email) {
      redirect(`/admin/customers/${id}/edit?error=missing_email`)
    }

    const { error: resetError } = await adminSupabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login`,
      }
    )

    if (resetError) {
      console.error('resetError:', resetError)
      redirect(`/admin/customers/${id}?updated=1&warning=invite_failed`)
    }

    redirect(`/admin/customers/${id}?updated=1&invite=1`)
  }

  redirect(`/admin/customers/${id}?updated=1${passwordMode === 'manual' ? '&setup=manual' : ''}`)
}

export default async function EditCustomerPage({ params, searchParams }: Props) {
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

  const { data: customer, error } = await adminSupabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !customer || customer.role === 'admin') {
    notFound()
  }

  const { data: projects } = await adminSupabase
    .from('projects')
    .select('id, title, status, created_at')
    .eq('user_id', id)
    .order('created_at', { ascending: false })

  const { data: authUserData } = await adminSupabase.auth.admin.getUserById(id)
  const authUser = authUserData?.user ?? null

  const safeProjects = projects ?? []
  const recentProjects = safeProjects.slice(0, 4)
  const totalProjects = safeProjects.length
  const submittedProjects = safeProjects.filter(
    (project: any) => project.status === 'ingediend'
  ).length
  const inProgressProjects = safeProjects.filter(
    (project: any) => project.status === 'in_behandeling'
  ).length
  const readyForPaymentProjects = safeProjects.filter(
    (project: any) => project.status === 'klaar_voor_betaling'
  ).length
  const completedProjects = safeProjects.filter(
    (project: any) => project.status === 'afgerond'
  ).length
  const activeProjects = safeProjects.filter(
    (project: any) =>
      project.status === 'in_behandeling' ||
      project.status === 'klaar_voor_betaling'
  ).length
  const latestProject = safeProjects[0] ?? null
  const latestProjectDate = latestProject?.created_at
    ? new Date(latestProject.created_at).toLocaleDateString('nl-BE')
    : '—'
  const lastOnlineLabel = authUser?.last_sign_in_at
    ? new Date(authUser.last_sign_in_at).toLocaleString('nl-BE', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : 'Nog niet ingelogd'
  const contactChannels = [
    customer.email,
    customer.phone,
    customer.mobile,
    customer.invoice_email,
    customer.website,
  ].filter((value) => Boolean(value)).length
  const billingFieldsFilled = [
    customer.payment_term_days,
    customer.quote_validity_days,
    customer.payment_method,
    customer.currency,
    customer.vat_rate,
    customer.iban,
    customer.bic,
  ].filter((value) => Boolean(value)).length
  const profileFields = [
    customer.company_name,
    customer.vat_number,
    customer.email,
    customer.director_first_name,
    customer.director_last_name,
    customer.mobile,
    customer.street,
    customer.postal_code,
    customer.city,
    customer.country,
  ]
  const profileCompleteness = Math.round(
    (profileFields.filter((value) => Boolean(value)).length / profileFields.length) * 100
  )

  let logoPreviewUrl: string | null = null

  if (customer.logo_path) {
    const { data: logoData } = await adminSupabase.storage
      .from('project-files')
      .createSignedUrl(customer.logo_path, 60 * 60)

    logoPreviewUrl = logoData?.signedUrl ?? null
  }

  const saveError = resolvedSearchParams?.error === 'save'
  const passwordSetupError = resolvedSearchParams?.error === 'password_setup'
  const authUpdateFailed = resolvedSearchParams?.error === 'auth_update'
  const missingEmailError = resolvedSearchParams?.error === 'missing_email'

  return (
    <AppShell isAdmin>
      <div className="space-y-1 sm:space-y-2">
        {(saveError || passwordSetupError || authUpdateFailed || missingEmailError) && (
          <section className="space-y-1">
            {passwordSetupError && (
              <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                Het manuele wachtwoord moet minstens 8 tekens bevatten en beide velden moeten overeenkomen.
              </div>
            )}

            {authUpdateFailed && (
              <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                De login-instellingen van deze klant konden niet bijgewerkt worden.
              </div>
            )}

            {missingEmailError && (
              <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                Er is een geldig e-mailadres nodig om een uitnodigingsmail te versturen.
              </div>
            )}

            {saveError && (
              <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                De klantgegevens konden niet opgeslagen worden.
              </div>
            )}
          </section>
        )}

        <section className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
          <div className="relative border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-2.5 sm:px-5">
            <div className="absolute inset-0 opacity-30">
              <div className="h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(242,140,58,0.18),transparent_35%),radial-gradient(circle_at_left,rgba(255,255,255,0.05),transparent_25%)]" />
            </div>

            <div className="relative flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                  Adminportaal
                </p>

                <h1 className="mt-2 text-xl font-semibold text-[var(--text-main)] sm:text-2xl">
                  {customer.company_name || customer.full_name || 'Klant'}
                </h1>

                <p className="mt-1.5 text-xs text-[var(--text-soft)]">
                  Volledige klantenfiche met alle bewerkbare gegevens.
                </p>

                <div className="mt-3 max-w-[280px]">
                  <Link
                    href="/admin/customers"
                    className="group relative block overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2.5 transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)]/80"
                  >
                    <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
                    <div className="flex items-start gap-2.5 pr-2">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
                        <ArrowLeft className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[13px] font-semibold leading-5 text-[var(--text-main)]">
                          Dashboard
                        </span>
                        <span className="block text-[11px] leading-4 text-[var(--text-soft)]">
                          Terug naar klantenoverzicht
                        </span>
                      </span>
                    </div>
                  </Link>
                </div>
              </div>

              <div className="w-full xl:max-w-[640px]">
                <div className="grid w-full gap-2 sm:grid-cols-3">
                  <div className="overflow-hidden rounded-xl border border-blue-500/30 bg-[linear-gradient(135deg,rgba(59,130,246,0.10),rgba(59,130,246,0.03))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">
                          Mobiel
                        </p>
                        <p
                          className="mt-1 truncate text-sm font-semibold text-blue-300"
                          title={customer.mobile || 'Niet ingevuld'}
                        >
                          {customer.mobile || 'Niet ingevuld'}
                        </p>
                      </div>
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                        <PhoneCall className="h-4.5 w-4.5 text-blue-300" />
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(76,175,80,0.08),rgba(76,175,80,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">
                          E-mail
                        </p>
                        <p
                          className="mt-1 truncate text-sm font-semibold text-green-500"
                          title={customer.email || 'Niet ingevuld'}
                        >
                          {customer.email || 'Niet ingevuld'}
                        </p>
                      </div>
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
                        <Mail className="h-4.5 w-4.5 text-green-500" />
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-violet-500/30 bg-[linear-gradient(135deg,rgba(139,92,246,0.10),rgba(139,92,246,0.03))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">
                          Laatst online
                        </p>
                        <p
                          className="mt-1 truncate text-sm font-semibold text-violet-200"
                          title={lastOnlineLabel}
                        >
                          {lastOnlineLabel}
                        </p>
                      </div>
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                        <Clock3 className="h-4.5 w-4.5 text-violet-300" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-2 px-4 py-2 sm:px-5 xl:grid-cols-[1.2fr_0.8fr]">
            <section className="flex h-full flex-col overflow-hidden rounded-[18px] border border-[var(--border-soft)] bg-[var(--bg-card-2)]/80 shadow-sm">
              <div className="border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-2 sm:px-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Statistieken
                </p>
                <h2 className="mt-1 flex items-center gap-2 text-sm font-semibold text-[var(--text-main)]">
                  <Building2 className="h-4 w-4 text-[var(--accent)]" />
                  Werven & Acties
                </h2>
              </div>

              <div className="flex-1 space-y-2 px-4 py-2 sm:px-5">
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl border border-fuchsia-500/30 bg-[linear-gradient(135deg,rgba(217,70,239,0.10),rgba(217,70,239,0.03))] px-3 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Profiel compleet</p>
                        <p className="mt-1 text-2xl font-semibold text-fuchsia-200">{profileCompleteness}%</p>
                      </div>
                      <span className="rounded-lg bg-fuchsia-500/14 p-2 text-fuchsia-300">
                        <UserCheck className="h-4 w-4" />
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[var(--accent)]/35 bg-[linear-gradient(135deg,rgba(245,140,55,0.10),rgba(245,140,55,0.03))] px-3 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Werven</p>
                        <p className="mt-1 text-2xl font-semibold text-[var(--accent)]">{totalProjects}</p>
                      </div>
                      <span className="rounded-lg bg-[var(--accent)]/14 p-2 text-[var(--accent)]">
                        <FolderOpen className="h-4 w-4" />
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-violet-500/30 bg-[linear-gradient(135deg,rgba(168,85,247,0.10),rgba(168,85,247,0.03))] px-3 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Actief</p>
                        <p className="mt-1 text-2xl font-semibold text-violet-200">{activeProjects}</p>
                      </div>
                      <span className="rounded-lg bg-violet-500/14 p-2 text-violet-300">
                        <UserCheck className="h-4 w-4" />
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-cyan-500/30 bg-[linear-gradient(135deg,rgba(6,182,212,0.10),rgba(6,182,212,0.03))] px-3 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Facturatie ingevuld</p>
                        <p className="mt-1 text-2xl font-semibold text-cyan-200">{billingFieldsFilled}/7</p>
                      </div>
                      <span className="rounded-lg bg-cyan-500/14 p-2 text-cyan-300">
                        <CircleDollarSign className="h-4 w-4" />
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-sky-500/30 bg-[linear-gradient(135deg,rgba(14,165,233,0.10),rgba(14,165,233,0.03))] px-3 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Ingediend</p>
                        <p className="mt-1 text-2xl font-semibold text-sky-200">{submittedProjects}</p>
                      </div>
                      <span className="rounded-lg bg-sky-500/14 p-2 text-sky-300">
                        <Mail className="h-4 w-4" />
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-amber-500/30 bg-[linear-gradient(135deg,rgba(245,158,11,0.10),rgba(245,158,11,0.03))] px-3 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">In behandeling</p>
                        <p className="mt-1 text-2xl font-semibold text-amber-200">{inProgressProjects}</p>
                      </div>
                      <span className="rounded-lg bg-amber-500/14 p-2 text-amber-300">
                        <Building2 className="h-4 w-4" />
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-orange-500/30 bg-[linear-gradient(135deg,rgba(249,115,22,0.10),rgba(249,115,22,0.03))] px-3 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Klaar voor betaling</p>
                        <p className="mt-1 text-2xl font-semibold text-orange-200">{readyForPaymentProjects}</p>
                      </div>
                      <span className="rounded-lg bg-orange-500/14 p-2 text-orange-300">
                        <CircleDollarSign className="h-4 w-4" />
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-emerald-500/30 bg-[linear-gradient(135deg,rgba(16,185,129,0.10),rgba(16,185,129,0.03))] px-3 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Afgerond</p>
                        <p className="mt-1 text-2xl font-semibold text-emerald-200">{completedProjects}</p>
                      </div>
                      <span className="rounded-lg bg-emerald-500/14 p-2 text-emerald-300">
                        <CheckCircle2 className="h-4 w-4" />
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-blue-500/30 bg-[linear-gradient(135deg,rgba(59,130,246,0.10),rgba(59,130,246,0.03))] px-3 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Contactkanalen</p>
                        <p className="mt-1 text-2xl font-semibold text-blue-200">{contactChannels}</p>
                      </div>
                      <span className="rounded-lg bg-blue-500/14 p-2 text-blue-300">
                        <PhoneCall className="h-4 w-4" />
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[var(--border-soft)]/90 bg-[var(--bg-card)]/60 px-3 py-2.5 sm:col-span-2 xl:col-span-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Laatste werfdatum</p>
                    <p className="mt-1 text-base font-semibold text-[var(--text-main)]">{latestProjectDate}</p>
                  </div>
                </div>

                <div className="border-t border-[var(--border-soft)] pt-2">
                  <p className="mb-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    Beheeracties
                  </p>
                  <AdminCustomerActions
                    customerId={customer.id}
                    customerName={customer.company_name || customer.full_name || 'Klant'}
                    currentActive={customer.is_active}
                    redirectTo={`/admin/customers/${customer.id}/edit`}
                    compact
                  />
                </div>
              </div>
            </section>

            <section className="flex h-full flex-col overflow-hidden rounded-[18px] border border-[var(--border-soft)] bg-[var(--bg-card-2)]/80 shadow-sm">
              <div className="border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-3.5 sm:px-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Werven
                </p>
                <h2 className="mt-1 flex items-center gap-2 text-sm font-semibold text-[var(--text-main)]">
                  <FolderOpen className="h-4 w-4 text-[var(--accent)]" />
                  Sneltoetsen
                </h2>
              </div>

              <div className="flex-1 space-y-2 px-4 py-2 sm:px-5">
                <div className="grid gap-2 sm:grid-cols-2">
                  <Link
                    href={`/admin/projects/new?customer=${customer.id}`}
                    className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-3 text-sm font-semibold text-[var(--text-main)] transition hover:border-[var(--accent)]/40 hover:bg-[var(--bg-card)]/80"
                  >
                    <span className="flex items-center gap-2">
                      <PlusCircle className="h-4 w-4 text-[var(--accent)]" />
                      Nieuwe werf
                    </span>
                  </Link>

                  {latestProject ? (
                    <Link
                      href={`/admin/projects/${latestProject.id}`}
                      className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-3 text-sm font-semibold text-[var(--text-main)] transition hover:border-[var(--accent)]/40 hover:bg-[var(--bg-card)]/80"
                    >
                      Laatste werf openen
                    </Link>
                  ) : (
                    <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-3 text-sm text-[var(--text-soft)]">
                      Nog geen werven beschikbaar
                    </div>
                  )}
                </div>

                <ProjectsDropdown projects={safeProjects} />
              </div>
            </section>
          </div>

          <div className="px-4 py-2 sm:px-5">
            <CustomerEditForm
              customer={customer}
              action={updateCustomer}
              logoPreviewUrl={logoPreviewUrl}
            />
          </div>
        </section>
      </div>
    </AppShell>
  )
}

function getProjectStatusLabel(status: string | null) {
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