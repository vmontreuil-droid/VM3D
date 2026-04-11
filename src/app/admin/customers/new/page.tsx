import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, PlusCircle, Users } from 'lucide-react'
import AppShell from '@/components/app-shell'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import CustomerForm from './customer-form'

async function createCustomer(formData: FormData) {
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
  const passwordMode =
    String(formData.get('password_mode') || 'invite') === 'manual'
      ? 'manual'
      : 'invite'
  const sendInvite =
    passwordMode === 'invite' || String(formData.get('send_invite') || '') === 'yes'
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

  if (!email) {
    redirect('/admin/customers/new?error=missing_email')
  }

  const paymentTermDays =
    paymentTermDaysRaw === '' ? null : Number(paymentTermDaysRaw)
  const quoteValidityDays =
    quoteValidityDaysRaw === '' ? null : Number(quoteValidityDaysRaw)
  const latitude = latitudeRaw === '' ? null : Number(latitudeRaw)
  const longitude = longitudeRaw === '' ? null : Number(longitudeRaw)

  if (passwordMode === 'manual') {
    if (password.length < 8 || password !== passwordConfirm) {
      redirect('/admin/customers/new?error=password_setup')
    }
  }

  const tempPassword = `Vm3d!${Math.random().toString(36).slice(-10)}A1`
  const initialPassword = passwordMode === 'manual' ? password : tempPassword

  const { data: createdUserData, error: createUserError } =
    await adminSupabase.auth.admin.createUser({
      email,
      password: initialPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName || null,
        company_name: companyName || null,
      },
    })

  if (createUserError || !createdUserData.user) {
    console.error('createUserError:', createUserError)
    redirect('/admin/customers/new?error=create_user')
  }

  const createdUser = createdUserData.user

  const profilePayload = {
    id: createdUser.id,
    role: 'customer',
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

  let { error: profileError } = await adminSupabase
    .from('profiles')
    .upsert(profilePayload, { onConflict: 'id' })

  if (
    profileError &&
    typeof profileError.message === 'string' &&
    /(column .*iban|column .*bic|column .*logo_path|iban|bic|logo_path)/i.test(
      profileError.message
    )
  ) {
    const {
      iban: _iban,
      bic: _bic,
      logo_path: _logoPath,
      ...profilePayloadWithoutBankFields
    } = profilePayload

    const retryResult = await adminSupabase
      .from('profiles')
      .upsert(profilePayloadWithoutBankFields, { onConflict: 'id' })

    profileError = retryResult.error ?? null
  }

  if (profileError) {
    console.error('profileError:', profileError)
    redirect('/admin/customers/new?error=profile')
  }

  if (sendInvite && passwordMode !== 'manual') {
    const baseSiteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined)
    const redirectTo = baseSiteUrl
      ? `${baseSiteUrl.replace(/\/$/, '')}/login`
      : undefined

    const { error: resetError } = await adminSupabase.auth.resetPasswordForEmail(
      email,
      redirectTo ? { redirectTo } : undefined
    )

    if (resetError) {
      console.error('resetError:', resetError)
      redirect(`/admin/customers/${createdUser.id}?warning=invite_failed`)
    }

    redirect(`/admin/customers/${createdUser.id}?created=1&invite=1`)
  }

  redirect(
    `/admin/customers/${createdUser.id}?created=1${
      passwordMode === 'manual' ? '&setup=manual' : ''
    }`
  )
}

export default async function NewCustomerPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <AppShell isAdmin>
      <div className="space-y-3 sm:space-y-4 lg:space-y-5">
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
                  Nieuwe klant
                </h1>

                <p className="mt-2.5 max-w-3xl text-sm leading-6 text-[var(--text-soft)]">
                  Maak een nieuwe klantfiche aan en vul contact-, btw- en
                  facturatiegegevens centraal in vanuit hetzelfde premium
                  adminoverzicht.
                </p>

                <div className="mt-4 max-w-[260px]">
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
                          Klanten
                        </span>
                        <span className="block text-[11px] leading-4 text-[var(--text-soft)]">
                          Terug naar klantenoverzicht
                        </span>
                      </span>
                    </div>
                  </Link>
                </div>
              </div>

              <div className="w-full xl:ml-auto xl:max-w-[400px]">
                <div className="grid w-full grid-cols-2 gap-2">
                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(245,140,55,0.08),rgba(245,140,55,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">
                          Nieuwe fiche
                        </p>
                        <p className="mt-1 text-lg font-semibold text-[var(--accent)]">
                          Start
                        </p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)]/10">
                        <PlusCircle className="h-4.5 w-4.5 text-[var(--accent)]" />
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(76,175,80,0.08),rgba(76,175,80,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">
                          Klanttype
                        </p>
                        <p className="mt-1 text-lg font-semibold text-green-500">
                          Zakelijk
                        </p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10">
                        <Users className="h-4.5 w-4.5 text-green-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-4 sm:px-5">
            <CustomerForm action={createCustomer} />
          </div>
        </section>
      </div>
    </AppShell>
  )
}