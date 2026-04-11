import { redirect } from 'next/navigation'
import Link from 'next/link'
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

  const { error: profileError } = await adminSupabase.from('profiles').upsert(
    {
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
    },
    { onConflict: 'id' }
  )

  if (profileError) {
    console.error('profileError:', profileError)
    redirect('/admin/customers/new?error=profile')
  }

  if (sendInvite && passwordMode !== 'manual') {
    const inviteResult = await adminSupabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login`,
      data: {
        full_name: fullName || null,
        company_name: companyName || null,
      },
    })

    if (inviteResult.error) {
      console.error('inviteError:', inviteResult.error)
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
      <div className="space-y-2 sm:space-y-3 lg:space-y-4">
        <section className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
          <div className="flex flex-col gap-3 border-b border-[var(--border-soft)] px-4 py-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/admin/customers" className="btn-secondary">
                  ← Terug naar klanten
                </Link>

                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
                  Admin
                </p>
              </div>

              <h1 className="mt-2 text-xl font-semibold text-[var(--text-main)] sm:text-2xl">
                Nieuwe klant
              </h1>
              <p className="mt-1.5 text-sm text-[var(--text-soft)]">
                Maak een nieuwe klant aan en vul gegevens automatisch in via EU-btw-nummer.
              </p>
            </div>
          </div>

          <div className="px-4 py-4">
            <CustomerForm action={createCustomer} />
          </div>
        </section>
      </div>
    </AppShell>
  )
}