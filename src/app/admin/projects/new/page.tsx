import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, PlusCircle, Users } from 'lucide-react'
import AppShell from '@/components/app-shell'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type Props = {
  searchParams?: Promise<{
    customer?: string
    customerId?: string
    error?: string
  }>
}

async function createProject(formData: FormData) {
  'use server'

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

  const userId = String(formData.get('user_id') || '').trim()
  const title = String(formData.get('title') || '').trim()
  const description = String(formData.get('description') || '').trim()
  const address = String(formData.get('address') || '').trim()
  const status = String(formData.get('status') || 'ingediend').trim()
  const priceRaw = String(formData.get('price') || '').trim()
  const currency = String(formData.get('currency') || 'EUR').trim()

  if (!userId) {
    redirect('/admin/projects/new?error=missing_customer')
  }

  if (!title) {
    redirect(`/admin/projects/new?customer=${userId}&error=missing_title`)
  }

  const price = priceRaw === '' ? null : Number(priceRaw.replace(',', '.'))

  const { data: insertedProject, error } = await adminSupabase
    .from('projects')
    .insert({
      user_id: userId,
      title,
      description: description || null,
      address: address || null,
      status: status || 'ingediend',
      price: price === null || Number.isNaN(price) ? null : price,
      currency: currency || 'EUR',
    })
    .select('id')
    .single()

  if (error || !insertedProject) {
    console.error('createProject error:', error)
    redirect(`/admin/projects/new?customer=${userId}&error=create_failed`)
  }

  let customerLabel = 'Onbekende klant'

  const { data: customerProfile } = await adminSupabase
    .from('profiles')
    .select('company_name, full_name, email')
    .eq('id', userId)
    .single()

  if (customerProfile) {
    customerLabel =
      customerProfile.company_name ||
      customerProfile.full_name ||
      customerProfile.email ||
      customerLabel
  }

  await adminSupabase.from('project_timeline').insert({
    project_id: insertedProject.id,
    event_type: 'project_created',
    title: 'Project aangemaakt',
    description: `Project gekoppeld aan ${customerLabel}. Startstatus: ${status}.${price !== null && !Number.isNaN(price) ? ` Richtprijs: ${price} ${currency}.` : ''}`,
    created_by: user.id,
  })

  redirect(`/admin/projects/${insertedProject.id}?created=1`)
}

export default async function NewAdminProjectPage({ searchParams }: Props) {
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const preselectedCustomerId =
    resolvedSearchParams?.customerId || resolvedSearchParams?.customer || ''
  const errorCode = resolvedSearchParams?.error || ''

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

  const { data: customers, error: customersError } = await adminSupabase
    .from('profiles')
    .select('id, full_name, company_name, email, vat_number, city, role')
    .neq('role', 'admin')
    .order('company_name', { ascending: true })

  const safeCustomers = customers ?? []

  const selectedCustomer = safeCustomers.find(
    (customer: any) => customer.id === preselectedCustomerId
  )

  const selectedCustomerLabel = selectedCustomer
    ? selectedCustomer.company_name ||
      selectedCustomer.full_name ||
      selectedCustomer.email
    : 'Geen'

  const selectedCustomerMeta = selectedCustomer
    ? [selectedCustomer.city, selectedCustomer.vat_number]
        .filter(Boolean)
        .join(' · ')
    : ''

  return (
    <AppShell isAdmin>
      <div className="space-y-3 sm:space-y-4 lg:space-y-5">
        {errorCode && (
          <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorCode === 'missing_customer' &&
              'Selecteer eerst een klant.'}
            {errorCode === 'missing_title' &&
              'Geef eerst een projecttitel in.'}
            {errorCode === 'create_failed' &&
              'Project kon niet aangemaakt worden.'}
            {!['missing_customer', 'missing_title', 'create_failed'].includes(
              errorCode
            ) && 'Er is een onverwachte fout opgetreden.'}
          </div>
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
                  Nieuwe werf
                </h1>

                <p className="mt-2.5 max-w-3xl text-sm leading-6 text-[var(--text-soft)]">
                  Maak een nieuwe werf aan, koppel die meteen aan de juiste
                  klant en start de projecthistoriek vanuit hetzelfde premium
                  adminoverzicht.
                </p>

                <div className="mt-4 max-w-[270px]">
                  <Link
                    href="/admin/werven"
                    className="group relative block overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2.5 transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)]/80"
                  >
                    <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
                    <div className="flex items-start gap-2.5 pr-2">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
                        <ArrowLeft className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[13px] font-semibold leading-5 text-[var(--text-main)]">
                          Werven
                        </span>
                        <span className="block text-[11px] leading-4 text-[var(--text-soft)]">
                          Terug naar wervenoverzicht
                        </span>
                      </span>
                    </div>
                  </Link>
                </div>
              </div>

              <div className="w-full xl:ml-auto xl:max-w-[420px]">
                <div className="grid w-full grid-cols-2 gap-2">
                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(245,140,55,0.08),rgba(245,140,55,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">
                          Nieuwe werf
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
                      <div className="min-w-0">
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">
                          Koppeling
                        </p>
                        <p
                          className="mt-1 truncate text-sm font-semibold text-green-500"
                          title={
                            selectedCustomer
                              ? selectedCustomerLabel
                              : 'Nog geen klant vooraf gekozen'
                          }
                        >
                          {selectedCustomer ? selectedCustomerLabel : 'Vrije keuze'}
                        </p>
                      </div>
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
                        <Users className="h-4.5 w-4.5 text-green-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 px-4 py-4 sm:px-5 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Snelle info
              </p>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">
                    Geselecteerde klant
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {selectedCustomerLabel}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-soft)]">
                    {selectedCustomerMeta || 'Nog geen klant vooraf gekozen'}
                  </p>
                </div>

                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">
                    Timeline
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    Automatisch actief
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-soft)]">
                    Projectcreatie wordt meteen gelogd
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Quick actions
              </p>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Link
                  href="/admin/customers/new"
                  className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-4 transition hover:border-[var(--accent)]/40 hover:bg-[var(--bg-card)]/80"
                >
                  <p className="text-sm font-semibold text-[var(--text-main)]">
                    Nieuwe klant
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-soft)]">
                    Maak eerst een klant als die nog niet bestaat.
                  </p>
                </Link>

                {preselectedCustomerId ? (
                  <Link
                    href={`/admin/customers/${preselectedCustomerId}`}
                    className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-4 transition hover:border-[var(--accent)]/40 hover:bg-[var(--bg-card)]/80"
                  >
                    <p className="text-sm font-semibold text-[var(--text-main)]">
                      Open klant
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-soft)]">
                      Ga terug naar de gekoppelde klantfiche.
                    </p>
                  </Link>
                ) : (
                  <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-4">
                    <p className="text-sm font-semibold text-[var(--text-main)]">
                      Geen klant gekozen
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-soft)]">
                      Kies straks een klant in het formulier.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {customersError && (
          <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            Klanten konden niet geladen worden.
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
          <div className="border-b border-[var(--border-soft)] px-4 py-3">
            <h2 className="text-sm font-semibold text-[var(--text-main)]">
              Projectgegevens
            </h2>
            <p className="mt-1 text-xs text-[var(--text-soft)]">
              Vul de basisinformatie van het nieuwe project in.
            </p>
          </div>

          <form action={createProject} className="space-y-4 px-4 py-4 sm:px-5">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-4 rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-4">
                <h3 className="text-sm font-semibold text-[var(--text-main)]">
                  Koppeling
                </h3>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-[var(--text-main)]">
                    Klant
                  </label>
                  <select
                    name="user_id"
                    defaultValue={preselectedCustomerId}
                    className="input-dark w-full px-3 py-2.5 text-sm"
                    required
                  >
                    <option value="">Selecteer een klant</option>
                    {safeCustomers.map((customer: any) => {
                      const label =
                        customer.company_name ||
                        customer.full_name ||
                        customer.email ||
                        customer.id

                      const meta = [customer.city, customer.vat_number]
                        .filter(Boolean)
                        .join(' · ')

                      return (
                        <option key={customer.id} value={customer.id}>
                          {meta ? `${label} — ${meta}` : label}
                        </option>
                      )
                    })}
                  </select>
                </div>

                <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-soft)]">
                  {selectedCustomer ? (
                    <>
                      <p className="font-medium text-[var(--text-main)]">
                        {selectedCustomer.company_name ||
                          selectedCustomer.full_name ||
                          selectedCustomer.email}
                      </p>
                      <p className="mt-1">
                        {[selectedCustomer.city, selectedCustomer.vat_number]
                          .filter(Boolean)
                          .join(' · ') || 'Geen extra info'}
                      </p>
                    </>
                  ) : (
                    <p>Kies de klant waaraan dit project gekoppeld wordt.</p>
                  )}
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-4">
                <h3 className="text-sm font-semibold text-[var(--text-main)]">
                  Status & prijs
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-[var(--text-main)]">
                      Status
                    </label>
                    <select
                      name="status"
                      defaultValue="ingediend"
                      className="input-dark w-full px-3 py-2.5 text-sm"
                    >
                      <option value="ingediend">Ingediend</option>
                      <option value="in_behandeling">In behandeling</option>
                      <option value="klaar_voor_betaling">
                        Klaar voor betaling
                      </option>
                      <option value="afgerond">Afgerond</option>
                    </select>
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-[var(--text-main)]">
                      Munteenheid
                    </label>
                    <input
                      name="currency"
                      type="text"
                      defaultValue="EUR"
                      className="input-dark w-full px-3 py-2.5 text-sm"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-[var(--text-main)]">
                    Richtprijs
                  </label>
                  <input
                    name="price"
                    type="number"
                    step="0.01"
                    placeholder="Bijv. 1250"
                    className="input-dark w-full px-3 py-2.5 text-sm"
                  />
                </div>

                <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-soft)]">
                  De gekozen status, prijs en munteenheid worden mee opgenomen
                  in de eerste timeline-entry van dit project.
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-4">
              <h3 className="text-sm font-semibold text-[var(--text-main)]">
                Inhoud
              </h3>

              <div className="mt-4 grid gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-[var(--text-main)]">
                    Projecttitel
                  </label>
                  <input
                    name="title"
                    type="text"
                    placeholder="Bijv. 3D opmeting nieuwbouwsite"
                    className="input-dark w-full px-3 py-2.5 text-sm"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-[var(--text-main)]">
                    Locatie / adres
                  </label>
                  <input
                    name="address"
                    type="text"
                    placeholder="Straat, postcode, gemeente"
                    className="input-dark w-full px-3 py-2.5 text-sm"
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-[var(--text-main)]">
                    Beschrijving
                  </label>
                  <textarea
                    name="description"
                    placeholder="Korte omschrijving van het project"
                    className="input-dark min-h-[160px] w-full px-3 py-2.5 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                type="submit"
                className="btn-primary inline-flex items-center justify-center px-4 py-2 text-sm font-semibold"
              >
                Project aanmaken
              </button>

              <Link href="/admin" className="btn-secondary">
                Annuleren
              </Link>
            </div>
          </form>
        </section>
      </div>
    </AppShell>
  )
}