import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import {
  Building2,
  CreditCard,
  KeyRound,
  Mail,
  MapPinned,
  MessageSquare,
  ShieldCheck,
  FolderOpen,
  PlusCircle,
} from 'lucide-react'
import AppShell from '@/components/app-shell'
import CustomerMap from '@/components/customers/customer-map'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import AdminCustomerActions from '../admin-customer-actions'

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

  const street = String(formData.get('street') || '').trim()
  const houseNumber = String(formData.get('house_number') || '').trim()
  const bus = String(formData.get('bus') || '').trim()
  const postalCode = String(formData.get('postal_code') || '').trim()
  const city = String(formData.get('city') || '').trim()
  const country = String(formData.get('country') || '').trim()
  const comments = String(formData.get('comments') || '').trim()

  const latitudeRaw = String(formData.get('latitude') || '').trim()
  const longitudeRaw = String(formData.get('longitude') || '').trim()

  const paymentTermDays = paymentTermDaysRaw ? parseInt(paymentTermDaysRaw, 10) : null
  const quoteValidityDays = quoteValidityDaysRaw
    ? parseInt(quoteValidityDaysRaw, 10)
    : null

  const latitude = latitudeRaw ? parseFloat(latitudeRaw) : null
  const longitude = longitudeRaw ? parseFloat(longitudeRaw) : null

  const resolvedFullName =
    [directorFirstName, directorLastName]
      .map((value) => value.trim())
      .filter(Boolean)
      .join(' ') || fullName.trim()

  const resolvedInvoiceEmail = invoiceEmail.trim() || email.trim()

  const profileUpdate = {
    full_name: resolvedFullName,
    company_name: companyName,
    email,
    vat_number: vatNumber,
    enterprise_number: enterpriseNumber,
    reference,
    salutation,
    director_first_name: directorFirstName,
    director_last_name: directorLastName,
    rpr,
    invoice_email: resolvedInvoiceEmail,
    website,
    phone,
    mobile,
    fax,
    language,
    iban,
    bic,
    payment_term_days: paymentTermDays,
    quote_validity_days: quoteValidityDays,
    payment_method: paymentMethod,
    currency,
    vat_rate: vatRate,
    invoice_send_method: invoiceSendMethod,
    xml_format: xmlFormat,
    send_xml: sendXml,
    send_pdf: sendPdf,
    auto_reminders: autoReminders,
    street,
    house_number: houseNumber,
    bus,
    postal_code: postalCode,
    city,
    country,
    comments,
    latitude,
    longitude,
  }

  const { error } = await adminSupabase
    .from('profiles')
    .update(profileUpdate)
    .eq('id', id)

  if (error) {
    if (
      error &&
      typeof error.message === 'string' &&
      /(column .*iban|column .*bic|iban|bic)/i.test(error.message)
    ) {
      const {
        iban: _iban,
        bic: _bic,
        ...profileUpdateWithoutBankFields
      } = profileUpdate

      const retryResult = await adminSupabase
        .from('profiles')
        .update(profileUpdateWithoutBankFields)
        .eq('id', id)

      if (retryResult.error) {
        console.error('updateCustomer error:', retryResult.error)
        redirect(`/admin/customers/${id}?error=save`)
      }
    } else {
      console.error('updateCustomer error:', error)
      redirect(`/admin/customers/${id}?error=save`)
    }
  }

  redirect(`/admin/customers/${id}?updated=1`)
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
    notFound()
  }

  const { data: projects } = await adminSupabase
    .from('projects')
    .select('id, title, status, created_at')
    .eq('user_id', id)
    .order('created_at', { ascending: false })

  const safeProjects = projects ?? []
  const recentProjects = safeProjects.slice(0, 4)
  const totalProjects = safeProjects.length
  const activeProjects = safeProjects.filter(
    (project: any) =>
      project.status === 'in_behandeling' ||
      project.status === 'klaar_voor_betaling'
  ).length

  const updated = resolvedSearchParams?.updated === '1'
  const saveError = resolvedSearchParams?.error === 'save'

  const title =
    customer.company_name ||
    [customer.director_first_name, customer.director_last_name]
      .filter(Boolean)
      .join(' ') ||
    customer.full_name ||
    '—'

  const sectionClass =
    'flex h-full flex-col overflow-hidden rounded-[18px] border border-[var(--border-soft)] bg-[var(--bg-card-2)]/80 shadow-sm'
  const sectionBodyClass = 'flex-1 space-y-2 px-4 py-3 sm:px-5'
  const sectionHeadingClass =
    'text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]'
  const sectionTitleClass =
    'mt-1 flex items-center gap-2 text-sm font-semibold text-[var(--text-main)]'

  return (
    <AppShell isAdmin>
      <div className="space-y-1 sm:space-y-2">
        {(updated || saveError) && (
          <section className="space-y-1">
            {updated && (
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                Klantgegevens werden succesvol bijgewerkt.
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
                <div className="flex flex-wrap items-center gap-2">
                  <Link href="/admin/customers" className="btn-secondary">
                    ← Terug
                  </Link>
                </div>

                <h1 className="mt-2 text-xl font-semibold text-[var(--text-main)] sm:text-2xl">
                  {title}
                </h1>

                <p className="mt-1.5 text-xs text-[var(--text-soft)]">
                  Volledige klantenfiche — alle velden bewerkbaar.
                </p>
              </div>
            </div>
          </div>

          <form action={updateCustomer} className="space-y-1">
            <input type="hidden" name="id" value={customer.id} />

            <div className="grid gap-2 px-4 py-2 sm:px-5 xl:grid-cols-[1.2fr_0.8fr]">
              {/* STATS & ACTIONS */}
              <section className={sectionClass}>
                <div className="border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-2 sm:px-5">
                  <p className={sectionHeadingClass}>Statistieken</p>
                  <h2 className={sectionTitleClass}>
                    <Building2 className="h-4 w-4 text-[var(--accent)]" />
                    Werven & Acties
                  </h2>
                </div>

                <div className={sectionBodyClass}>
                  <div className="card-mini">
                    <p className="text-xs text-[var(--text-muted)]">Aantal werven</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                      {totalProjects}
                    </p>
                  </div>

                  <div className="card-mini">
                    <p className="text-xs text-[var(--text-muted)]">Actieve werven</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                      {activeProjects}
                    </p>
                  </div>

                  <div className="border-t border-[var(--border-soft)] pt-2">
                    <p className="mb-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                      Beheeracties
                    </p>
                    <AdminCustomerActions
                      customerId={customer.id}
                      customerName={customer.company_name || customer.full_name || 'Klant'}
                      currentActive={customer.is_active}
                      redirectTo={`/admin/customers/${customer.id}`}
                      compact
                    />
                  </div>
                </div>
              </section>

              {/* PROJECTS SHORTCUTS */}
              <section className={sectionClass}>
                <div className="border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-2 sm:px-5">
                  <p className={sectionHeadingClass}>Werven</p>
                  <h2 className={sectionTitleClass}>
                    <FolderOpen className="h-4 w-4 text-[var(--accent)]" />
                    Sneltoetsen
                  </h2>
                </div>

                <div className={sectionBodyClass}>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Link
                      href={`/admin/projects/new?customer=${customer.id}`}
                      className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2.5 text-xs font-semibold text-[var(--text-main)] transition hover:border-[var(--accent)]/40 hover:bg-[var(--bg-card)]/80"
                    >
                      <span className="flex items-center gap-2">
                        <PlusCircle className="h-4 w-4 text-[var(--accent)]" />
                        Nieuwe werf
                      </span>
                    </Link>

                    {safeProjects[0] && (
                      <Link
                        href={`/admin/projects/${safeProjects[0].id}`}
                        className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2.5 text-xs font-semibold text-[var(--text-main)] transition hover:border-[var(--accent)]/40 hover:bg-[var(--bg-card)]/80"
                      >
                        Laatste werf
                      </Link>
                    )}
                  </div>

                  {recentProjects.length > 0 && (
                    <div className="grid gap-1 text-xs">
                      {recentProjects.map((project: any) => (
                        <Link
                          key={project.id}
                          href={`/admin/projects/${project.id}`}
                          className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-2 py-1.5 transition hover:border-[var(--accent)]/30 hover:bg-[var(--bg-card)]/80"
                        >
                          <p className="truncate font-semibold text-[var(--text-main)]">
                            {project.title || '—'}
                          </p>
                          <span className="text-[var(--text-soft)]">
                            {getStatusLabel(project.status)} • {new Date(project.created_at).toLocaleDateString('nl-BE')}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* BEDRIJF SECTION */}
            <section className={sectionClass}>
              <div className="border-b border-[var(--border-soft)] px-4 py-2 sm:px-5">
                <p className={sectionHeadingClass}>Bedrijf</p>
                <h2 className={sectionTitleClass}>
                  <Building2 className="h-4 w-4 text-[var(--accent)]" />
                  Klant & bedrijfsgegevens
                </h2>
              </div>

              <div className={sectionBodyClass}>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      Bedrijfsnaam
                    </label>
                    <input
                      name="company_name"
                      type="text"
                      defaultValue={customer.company_name || ''}
                      className="input-dark mt-1 w-full px-3 py-2 text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      E-mail
                    </label>
                    <input
                      name="email"
                      type="email"
                      defaultValue={customer.email || ''}
                      className="input-dark mt-1 w-full px-3 py-2 text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      BTW-nummer
                    </label>
                    <input
                      name="vat_number"
                      type="text"
                      defaultValue={customer.vat_number || ''}
                      className="input-dark mt-1 w-full px-3 py-2 text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      Voornaam
                    </label>
                    <input
                      name="director_first_name"
                      type="text"
                      defaultValue={customer.director_first_name || ''}
                      className="input-dark mt-1 w-full px-3 py-2 text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      Familienaam
                    </label>
                    <input
                      name="director_last_name"
                      type="text"
                      defaultValue={customer.director_last_name || ''}
                      className="input-dark mt-1 w-full px-3 py-2 text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      Aanspreektitel
                    </label>
                    <select
                      name="salutation"
                      defaultValue={customer.salutation || ''}
                      className="input-dark mt-1 w-full px-3 py-2 text-sm"
                      required
                    >
                      <option value="">Selecteer</option>
                      <option value="Dhr.">Dhr.</option>
                      <option value="Mevr.">Mevr.</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      Taal
                    </label>
                    <select
                      name="language"
                      defaultValue={customer.language || ''}
                      className="input-dark mt-1 w-full px-3 py-2 text-sm"
                      required
                    >
                      <option value="">Selecteer</option>
                      <option value="NL">Nederlands</option>
                      <option value="FR">Frans</option>
                      <option value="ENG">Engels</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      Mobiel
                    </label>
                    <input
                      name="mobile"
                      type="tel"
                      defaultValue={customer.mobile || ''}
                      className="input-dark mt-1 w-full px-3 py-2 text-sm"
                      required
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* COMMUNICATIE SECTION */}
            <section className={sectionClass}>
              <div className="border-b border-[var(--border-soft)] px-4 py-2 sm:px-5">
                <p className={sectionHeadingClass}>Communicatie</p>
                <h2 className={sectionTitleClass}>
                  <Mail className="h-4 w-4 text-[var(--accent)]" />
                  Contact & verzending
                </h2>
              </div>

              <div className={sectionBodyClass}>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      Facturatie e-mail
                    </label>
                    <input
                      name="invoice_email"
                      type="email"
                      defaultValue={customer.invoice_email || customer.email || ''}
                      className="input-dark mt-1 w-full px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      Telephone
                    </label>
                    <input
                      name="phone"
                      type="tel"
                      defaultValue={customer.phone || ''}
                      className="input-dark mt-1 w-full px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      Fax
                    </label>
                    <input
                      name="fax"
                      type="tel"
                      defaultValue={customer.fax || ''}
                      className="input-dark mt-1 w-full px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      Website
                    </label>
                    <input
                      name="website"
                      type="url"
                      defaultValue={customer.website || ''}
                      className="input-dark mt-1 w-full px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* FINANCIEEL SECTION */}
            <section className={sectionClass}>
              <div className="border-b border-[var(--border-soft)] px-4 py-2 sm:px-5">
                <p className={sectionHeadingClass}>Financieel</p>
                <h2 className={sectionTitleClass}>
                  <CreditCard className="h-4 w-4 text-[var(--accent)]" />
                  Facturatie
                </h2>
              </div>

              <div className={sectionBodyClass}>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      BTW-tarief
                    </label>
                    <select
                      name="vat_rate"
                      defaultValue={customer.vat_rate || ''}
                      className="input-dark mt-1 w-full px-3 py-2 text-sm"
                    >
                      <option value="">Selecteer</option>
                      <option value="21%">21%</option>
                      <option value="12%">12%</option>
                      <option value="6%">6%</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      Munteenheid
                    </label>
                    <select
                      name="currency"
                      defaultValue={customer.currency || 'EUR'}
                      className="input-dark mt-1 w-full px-3 py-2 text-sm"
                    >
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      Betalingstermijn (dagen)
                    </label>
                    <select
                      name="payment_term_days"
                      defaultValue={customer.payment_term_days?.toString() || ''}
                      className="input-dark mt-1 w-full px-3 py-2 text-sm"
                    >
                      <option value="">Selecteer</option>
                      <option value="0">Contant</option>
                      <option value="30">30 dagen</option>
                      <option value="60">60 dagen</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      IBAN
                    </label>
                    <input
                      name="iban"
                      type="text"
                      defaultValue={customer.iban || ''}
                      className="input-dark mt-1 w-full px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      BIC
                    </label>
                    <input
                      name="bic"
                      type="text"
                      defaultValue={customer.bic || ''}
                      className="input-dark mt-1 w-full px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* LOCATIE SECTION */}
            <section className={sectionClass}>
              <div className="border-b border-[var(--border-soft)] px-4 py-2 sm:px-5">
                <p className={sectionHeadingClass}>Locatie</p>
                <h2 className={sectionTitleClass}>
                  <MapPinned className="h-4 w-4 text-[var(--accent)]" />
                  Adresgegevens
                </h2>
              </div>

              <div className={sectionBodyClass}>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      Straat
                    </label>
                    <input
                      name="street"
                      type="text"
                      defaultValue={customer.street || ''}
                      className="input-dark mt-1 w-full px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      Nr
                    </label>
                    <input
                      name="house_number"
                      type="text"
                      defaultValue={customer.house_number || ''}
                      className="input-dark mt-1 w-full px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      Bus
                    </label>
                    <input
                      name="bus"
                      type="text"
                      defaultValue={customer.bus || ''}
                      className="input-dark mt-1 w-full px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      Postcode
                    </label>
                    <input
                      name="postal_code"
                      type="text"
                      defaultValue={customer.postal_code || ''}
                      className="input-dark mt-1 w-full px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      Gemeente
                    </label>
                    <input
                      name="city"
                      type="text"
                      defaultValue={customer.city || ''}
                      className="input-dark mt-1 w-full px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      Land
                    </label>
                    <input
                      name="country"
                      type="text"
                      defaultValue={customer.country || ''}
                      className="input-dark mt-1 w-full px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* NOTITIES SECTION */}
            <section className={sectionClass}>
              <div className="border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-2 sm:px-5">
                <p className={sectionHeadingClass}>Notities</p>
                <h2 className={sectionTitleClass}>
                  <MessageSquare className="h-4 w-4 text-[var(--accent)]" />
                  Interne opmerkingen
                </h2>
              </div>
              <div className={sectionBodyClass}>
                <textarea
                  name="comments"
                  defaultValue={customer.comments || ''}
                  className="input-dark min-h-[200px] w-full resize-none px-3 py-2 text-sm"
                  placeholder="Interne notities..."
                />
              </div>
            </section>

            {/* HIDDEN INPUTS */}
            <input
              type="hidden"
              name="send_xml"
              value={customer.send_xml ? 'yes' : 'no'}
            />
            <input
              type="hidden"
              name="send_pdf"
              value={customer.send_pdf ? 'yes' : 'no'}
            />
            <input
              type="hidden"
              name="auto_reminders"
              value={customer.auto_reminders ? 'yes' : 'no'}
            />
            <input
              type="hidden"
              name="enterprise_number"
              value={customer.enterprise_number || ''}
            />
            <input type="hidden" name="reference" value={customer.reference || ''} />
            <input
              type="hidden"
              name="full_name"
              value={customer.full_name || ''}
            />
            <input type="hidden" name="rpr" value={customer.rpr || ''} />
            <input
              type="hidden"
              name="invoice_send_method"
              value={customer.invoice_send_method || ''}
            />
            <input
              type="hidden"
              name="xml_format"
              value={customer.xml_format || ''}
            />
            <input
              type="hidden"
              name="payment_method"
              value={customer.payment_method || ''}
            />
            <input
              type="hidden"
              name="quote_validity_days"
              value={customer.quote_validity_days?.toString() || ''}
            />
            <input
              type="hidden"
              name="latitude"
              value={customer.latitude?.toString() || ''}
            />
            <input
              type="hidden"
              name="longitude"
              value={customer.longitude?.toString() || ''}
            />

            {/* SUBMIT BUTTON */}
            <div className="flex justify-end gap-2 px-4 py-2 sm:px-5">
              <Link href="/admin/customers" className="btn-secondary">
                Annuleren
              </Link>
              <button type="submit" className="btn-primary">
                💾 Opslaan
              </button>
            </div>
          </form>
        </section>
      </div>
    </AppShell>
  )
}
