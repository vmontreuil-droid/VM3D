import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import AppShell from '@/components/app-shell'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import OfferteForm from './offerte-form'

async function createOfferte(formData: FormData) {
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

  // --- Klantgegevens ---
  const isNewCustomer = formData.get('is_new_customer') === 'yes'
  let customerId = String(formData.get('customer_id') || '').trim() || null

  if (isNewCustomer) {
    const newEmail = String(formData.get('new_customer_email') || '').trim().toLowerCase()
    const newCompanyName = String(formData.get('new_customer_company') || '').trim()
    const newFullName = String(formData.get('new_customer_name') || '').trim()
    const newPhone = String(formData.get('new_customer_phone') || '').trim()
    const newVatNumber = String(formData.get('new_customer_vat') || '').trim().toUpperCase()

    if (!newEmail) {
      redirect('/admin/offerte/new?error=email')
    }

    const tempPassword = `Montreuil_${Date.now()}`

    const { data: authUser, error: authError } = await adminSupabase.auth.admin.createUser({
      email: newEmail,
      password: tempPassword,
      email_confirm: true,
    })

    if (authError || !authUser?.user) {
      console.error('createOfferte: new customer auth error', authError)
      redirect('/admin/offerte/new?error=customer')
    }

    const { error: profileError } = await adminSupabase
      .from('profiles')
      .upsert({
        id: authUser.user.id,
        email: newEmail,
        company_name: newCompanyName || null,
        full_name: newFullName || null,
        phone: newPhone || null,
        vat_number: newVatNumber || null,
        role: 'customer',
      })

    if (profileError) {
      console.error('createOfferte: new customer profile error', profileError)
      redirect('/admin/offerte/new?error=customer')
    }

    customerId = authUser.user.id
  }

  // --- Offerte gegevens ---
  const subject = String(formData.get('subject') || '').trim()
  const description = String(formData.get('description') || '').trim()
  const projectIdRaw = String(formData.get('project_id') || '').trim()
  const validUntilRaw = String(formData.get('valid_until') || '').trim()
  const currency = String(formData.get('currency') || 'EUR').trim()
  const vatRate = String(formData.get('vat_rate') || '21%').trim()
  const paymentTerms = String(formData.get('payment_terms') || '').trim()
  const notes = String(formData.get('notes') || '').trim()

  if (!subject) {
    redirect('/admin/offerte/new?error=subject')
  }

  // --- Offerte regels (line items) ---
  const lineDescriptions = formData.getAll('line_description')
  const lineQuantities = formData.getAll('line_quantity')
  const lineUnits = formData.getAll('line_unit')
  const linePrices = formData.getAll('line_unit_price')
  const lineVatRates = formData.getAll('line_vat_rate')

  const lines: {
    description: string
    quantity: number
    unit: string
    unit_price: number
    vat_rate: string
    vat_amount: number
    line_total: number
    position: number
  }[] = []

  for (let i = 0; i < lineDescriptions.length; i++) {
    const desc = String(lineDescriptions[i] || '').trim()
    const qty = parseFloat(String(lineQuantities[i] || '1')) || 1
    const unit = String(lineUnits[i] || 'stuk').trim()
    const price = parseFloat(String(linePrices[i] || '0')) || 0
    const lineVatPct = parseFloat(String(lineVatRates[i] || vatRate)) || 0
    const lineSubtotal = qty * price
    const lineVatAmount = Math.round(lineSubtotal * (lineVatPct / 100) * 100) / 100

    if (desc) {
      lines.push({
        description: desc,
        quantity: qty,
        unit,
        unit_price: price,
        vat_rate: `${lineVatPct}%`,
        vat_amount: lineVatAmount,
        line_total: lineSubtotal + lineVatAmount,
        position: i,
      })
    }
  }

  const subtotal = lines.reduce((sum, l) => sum + l.quantity * l.unit_price, 0)
  const vatAmount = lines.reduce((sum, l) => sum + l.vat_amount, 0)
  const total = subtotal + vatAmount

  // --- Offerte nummer genereren ---
  const year = new Date().getFullYear()
  const { count } = await adminSupabase
    .from('offertes')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', `${year}-01-01`)

  const offerteNumber = `OFF-${year}-${String((count ?? 0) + 1).padStart(4, '0')}`

  // --- Auto-create project if none selected ---
  let projectId = projectIdRaw ? Number(projectIdRaw) : null

  if (!projectId && customerId) {
    const { data: newProject, error: projectError } = await adminSupabase
      .from('projects')
      .insert({
        name: subject || 'Nieuw project',
        user_id: customerId,
        status: 'offerte_aangevraagd',
      })
      .select('id')
      .single()

    if (!projectError && newProject) {
      projectId = newProject.id
    }
  }

  // --- Opslaan ---
  const { data: offerte, error: offerteError } = await adminSupabase
    .from('offertes')
    .insert({
      offerte_number: offerteNumber,
      customer_id: customerId,
      project_id: projectId,
      created_by: user.id,
      status: 'concept',
      subject,
      description: description || null,
      valid_until: validUntilRaw || null,
      currency,
      vat_rate: vatRate,
      payment_terms: paymentTerms || null,
      notes: notes || null,
      subtotal,
      vat_amount: vatAmount,
      total,
    })
    .select('id')
    .single()

  if (offerteError || !offerte) {
    console.error('createOfferte error:', offerteError)
    redirect('/admin/offerte/new?error=save')
  }

  // --- Offerte regels opslaan ---
  if (lines.length > 0) {
    const lineInserts = lines.map((line) => ({
      offerte_id: offerte.id,
      position: line.position,
      description: line.description,
      quantity: line.quantity,
      unit: line.unit,
      unit_price: line.unit_price,
      vat_rate: line.vat_rate,
      line_total: line.line_total,
    }))

    const { error: linesError } = await adminSupabase
      .from('offerte_lines')
      .insert(lineInserts)

    if (linesError) {
      console.error('createOfferte lines error:', linesError)
    }
  }

  redirect(`/admin/offerte?created=${offerte.id}`)
}

type Props = {
  searchParams?: Promise<{
    error?: string
    customer?: string
  }>
}

export default async function AdminOfferteNewPage({ searchParams }: Props) {
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
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  const adminSupabase = createAdminClient()

  const { data: customers } = await adminSupabase
    .from('profiles')
    .select('id, full_name, company_name, email, phone, vat_number, iban, bic, address, payment_term_days, currency, vat_rate')
    .neq('role', 'admin')
    .order('company_name', { ascending: true })

  const { data: projects } = await adminSupabase
    .from('projects')
    .select('id, name, address, user_id')
    .order('created_at', { ascending: false })
    .limit(500)

  const errorType = resolvedSearchParams.error
  const preselectedCustomer = resolvedSearchParams.customer || ''

  return (
    <AppShell isAdmin>
      <div className="space-y-3 sm:space-y-4 lg:space-y-5">
        {errorType && (
          <section className="space-y-1">
            {errorType === 'subject' && (
              <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                Geef een onderwerp op voor de offerte.
              </div>
            )}
            {errorType === 'email' && (
              <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                Geef een e-mailadres op voor de nieuwe klant.
              </div>
            )}
            {errorType === 'customer' && (
              <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                De nieuwe klant kon niet aangemaakt worden.
              </div>
            )}
            {errorType === 'save' && (
              <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                De offerte kon niet opgeslagen worden.
              </div>
            )}
          </section>
        )}

        <section className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
          <div className="border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-4 sm:px-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
              Adminportaal
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-[var(--text-main)] sm:text-3xl">
              Nieuwe offerte
            </h1>
            <p className="mt-2 text-sm text-[var(--text-soft)]">
              Maak een prijsofferte aan, koppel aan een bestaande klant of maak direct een nieuwe klant aan.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <div className="max-w-[260px]">
                <Link
                  href="/admin/offerte"
                  className="group relative block overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2.5 transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)]/80"
                >
                  <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
                  <div className="flex items-start gap-2.5 pr-2">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold leading-5 text-[var(--text-main)]">
                        Offertes
                      </span>
                      <span className="block text-[11px] leading-4 text-[var(--text-soft)]">
                        Terug naar overzicht
                      </span>
                    </span>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          <div className="px-4 py-4 sm:px-5">
            <OfferteForm
              action={createOfferte}
              customers={customers ?? []}
              projects={projects ?? []}
              preselectedCustomer={preselectedCustomer}
            />
          </div>
        </section>
      </div>
    </AppShell>
  )
}
