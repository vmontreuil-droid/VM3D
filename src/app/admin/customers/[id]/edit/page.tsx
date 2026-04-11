import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2, Mail } from 'lucide-react'
import AppShell from '@/components/app-shell'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import CustomerEditForm from './edit-customer-form'

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

  const { error } = await adminSupabase
    .from('profiles')
    .update({
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
    })
    .eq('id', id)

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

  const saveError = resolvedSearchParams?.error === 'save'
  const passwordSetupError = resolvedSearchParams?.error === 'password_setup'
  const authUpdateFailed = resolvedSearchParams?.error === 'auth_update'
  const missingEmailError = resolvedSearchParams?.error === 'missing_email'

  return (
    <AppShell isAdmin>
      <div className="space-y-3 sm:space-y-4 lg:space-y-5">
        {(saveError || passwordSetupError || authUpdateFailed || missingEmailError) && (
          <section className="space-y-3">
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
          <div className="relative border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-5 sm:px-5">
            <div className="absolute inset-0 opacity-30">
              <div className="h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(242,140,58,0.18),transparent_35%),radial-gradient(circle_at_left,rgba(255,255,255,0.05),transparent_25%)]" />
            </div>

            <div className="relative flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 flex-1">
                <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                  Adminportaal
                </p>

                <h1 className="mt-2 text-2xl font-semibold text-[var(--text-main)] sm:text-3xl">
                  {customer.company_name || customer.full_name || 'Klant'}
                </h1>

                <p className="mt-2.5 max-w-3xl text-sm leading-6 text-[var(--text-soft)]">
                  Werk klantgegevens, btw-info en facturatiegegevens bij vanuit
                  dezelfde verfijnde adminomgeving.
                </p>

                <div className="mt-4 max-w-[280px]">
                  <Link
                    href={`/admin/customers/${customer.id}`}
                    className="group relative block overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2.5 transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)]/80"
                  >
                    <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
                    <div className="flex items-start gap-2.5 pr-2">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
                        <ArrowLeft className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[13px] font-semibold leading-5 text-[var(--text-main)]">
                          Klantfiche
                        </span>
                        <span className="block text-[11px] leading-4 text-[var(--text-soft)]">
                          Terug naar dit klantoverzicht
                        </span>
                      </span>
                    </div>
                  </Link>
                </div>
              </div>

              <div className="w-full xl:max-w-[420px]">
                <div className="grid w-full grid-cols-2 gap-2">
                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(245,140,55,0.08),rgba(245,140,55,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">
                          BTW-nummer
                        </p>
                        <p
                          className="mt-1 truncate text-sm font-semibold text-[var(--accent)]"
                          title={customer.vat_number || 'Niet ingevuld'}
                        >
                          {customer.vat_number || 'Niet ingevuld'}
                        </p>
                      </div>
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/10">
                        <Building2 className="h-4.5 w-4.5 text-[var(--accent)]" />
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
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-4 sm:px-5">
            <CustomerEditForm customer={customer} action={updateCustomer} />
          </div>
        </section>
      </div>
    </AppShell>
  )
}