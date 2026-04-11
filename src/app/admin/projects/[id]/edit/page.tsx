import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import AppShell from '@/components/app-shell'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type Props = {
  params: Promise<{
    id: string
  }>
}

async function updateProject(formData: FormData) {
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

  const id = String(formData.get('id') || '').trim()
  const userId = String(formData.get('user_id') || '').trim()
  const title = String(formData.get('title') || '').trim()
  const description = String(formData.get('description') || '').trim()
  const address = String(formData.get('address') || '').trim()
  const status = String(formData.get('status') || 'ingediend').trim()
  const priceRaw = String(formData.get('price') || '').trim()
  const currency = String(formData.get('currency') || 'EUR').trim()

  if (!id) {
    redirect('/admin')
  }

  if (!userId) {
    redirect(`/admin/projects/${id}/edit?error=missing_customer`)
  }

  if (!title) {
    redirect(`/admin/projects/${id}/edit?error=missing_title`)
  }

  const price = priceRaw === '' ? null : Number(priceRaw.replace(',', '.'))

  const { error } = await adminSupabase
    .from('projects')
    .update({
      user_id: userId,
      title,
      description: description || null,
      address: address || null,
      status: status || 'ingediend',
      price: price === null || Number.isNaN(price) ? null : price,
      currency: currency || 'EUR',
    })
    .eq('id', id)

  if (error) {
    console.error('updateProject error:', error)
    redirect(`/admin/projects/${id}/edit?error=save_failed`)
  }

  redirect(`/admin/projects/${id}?updated=1`)
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

export default async function EditAdminProjectPage({ params }: Props) {
  const { id } = await params
  const projectId = Number(id)

  if (Number.isNaN(projectId)) {
    notFound()
  }

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

  const { data: project, error: projectError } = await adminSupabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()

  if (projectError || !project) {
    notFound()
  }

  const { data: customers, error: customersError } = await adminSupabase
    .from('profiles')
    .select('id, full_name, company_name, email, vat_number, city, role')
    .neq('role', 'admin')
    .order('company_name', { ascending: true })

  const safeCustomers = customers ?? []

  const currentCustomer = safeCustomers.find(
    (customer: any) => customer.id === project.user_id
  )

  const currentCustomerLabel = currentCustomer
    ? currentCustomer.company_name ||
      currentCustomer.full_name ||
      currentCustomer.email
    : 'Geen'

  const currentCustomerMeta = currentCustomer
    ? [currentCustomer.city, currentCustomer.vat_number]
        .filter(Boolean)
        .join(' · ')
    : ''

  return (
    <AppShell isAdmin>
      <div className="space-y-3 sm:space-y-4 lg:space-y-5">
        <section className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
          <div className="relative border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-5 sm:px-5">
            <div className="absolute inset-0 opacity-30">
              <div className="h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(242,140,58,0.18),transparent_35%),radial-gradient(circle_at_left,rgba(255,255,255,0.05),transparent_25%)]" />
            </div>

            <div className="relative flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/projects/${project.id}`}
                    className="btn-secondary"
                  >
                    ← Terug naar werf
                  </Link>

                  <Link href="/admin" className="btn-secondary">
                    Werven
                  </Link>

                  {project.user_id ? (
                    <Link
                      href={`/admin/customers/${project.user_id}`}
                      className="btn-secondary"
                    >
                      Klant openen
                    </Link>
                  ) : null}
                </div>

                <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                  Werf bewerken
                </p>

                <h1 className="mt-2 text-2xl font-semibold text-[var(--text-main)] sm:text-3xl">
                  {project.title || 'Werf'}
                </h1>

                <p className="mt-2.5 max-w-3xl text-sm leading-6 text-[var(--text-soft)]">
                  Pas werfgegevens aan en wijzig indien nodig de gekoppelde
                  klant, status of prijs.
                </p>
              </div>

              <div className="flex w-full flex-col gap-4 xl:w-auto">
                <div className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)]/80 shadow-sm backdrop-blur">
                  <div className="flex items-center gap-4 px-4 py-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)] text-xl font-bold text-white shadow-sm">
                      EP
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                        Module
                      </p>
                      <p className="mt-1 truncate text-sm font-semibold text-[var(--text-main)]">
                        Werf bewerken
                      </p>
                      <p className="mt-1 text-xs text-[var(--text-soft)]">
                        Inhoud, koppeling en status
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid w-full grid-cols-2 gap-3 xl:w-auto">
                  <div className="card-mini text-center">
                    <p className="text-xs text-[var(--text-muted)]">
                      Huidige status
                    </p>
                    <p className="text-lg font-semibold text-[var(--text-main)]">
                      {getStatusLabel(project.status)}
                    </p>
                  </div>

                  <div className="card-mini text-center">
                    <p className="text-xs text-[var(--text-muted)]">
                      Munteenheid
                    </p>
                    <p className="text-lg font-semibold text-[var(--text-main)]">
                      {project.currency || 'EUR'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 px-4 py-3 sm:px-5 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Snelle info
              </p>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">
                    Gekoppelde klant
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {currentCustomerLabel}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-soft)]">
                    {currentCustomerMeta || 'Geen extra info'}
                  </p>
                </div>

                <div className="card-mini">
                  <p className="text-xs text-[var(--text-muted)]">
                    Huidige prijs
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                    {project.price != null
                      ? `${project.price} ${project.currency || 'EUR'}`
                      : 'Nog niet bepaald'}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-soft)]">
                    Pas aan in het blok status & prijs
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Quick actions
              </p>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {project.user_id ? (
                  <Link
                    href={`/admin/customers/${project.user_id}`}
                    className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-4 transition hover:border-[var(--accent)]/40 hover:bg-[var(--bg-card)]/80"
                  >
                    <p className="text-sm font-semibold text-[var(--text-main)]">
                      Open klant
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-soft)]">
                      Bekijk de gekoppelde klantenfiche.
                    </p>
                  </Link>
                ) : (
                  <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-4">
                    <p className="text-sm font-semibold text-[var(--text-main)]">
                      Geen klant gekoppeld
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-soft)]">
                      Kies hieronder een klant.
                    </p>
                  </div>
                )}

                <Link
                  href={`/admin/projects/${project.id}`}
                  className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-4 transition hover:border-[var(--accent)]/40 hover:bg-[var(--bg-card)]/80"
                >
                  <p className="text-sm font-semibold text-[var(--text-main)]">
                    Terug naar project
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-soft)]">
                    Open de projectfiche zonder wijzigingen.
                  </p>
                </Link>
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
              Bewerk de basisinformatie van dit project.
            </p>
          </div>

          <form action={updateProject} className="space-y-4 px-4 py-4 sm:px-5">
            <input type="hidden" name="id" value={project.id} />

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
                    defaultValue={project.user_id || ''}
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
                  {currentCustomer ? (
                    <>
                      <p className="font-medium text-[var(--text-main)]">
                        {currentCustomer.company_name ||
                          currentCustomer.full_name ||
                          currentCustomer.email}
                      </p>
                      <p className="mt-1">
                        {[currentCustomer.city, currentCustomer.vat_number]
                          .filter(Boolean)
                          .join(' · ') || 'Geen extra info'}
                      </p>
                    </>
                  ) : (
                    <p>Kies de klant waaraan dit project gekoppeld is.</p>
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
                      defaultValue={project.status || 'ingediend'}
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
                      defaultValue={project.currency || 'EUR'}
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
                    defaultValue={project.price ?? ''}
                    placeholder="Bijv. 1250"
                    className="input-dark w-full px-3 py-2.5 text-sm"
                  />
                </div>

                <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-soft)]">
                  Status en prijs worden meteen geüpdatet op de projectfiche na
                  opslaan.
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
                    defaultValue={project.title || ''}
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
                    defaultValue={project.address || ''}
                    className="input-dark w-full px-3 py-2.5 text-sm"
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-[var(--text-main)]">
                    Beschrijving
                  </label>
                  <textarea
                    name="description"
                    defaultValue={project.description || ''}
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
                Wijzigingen opslaan
              </button>

              <Link
                href={`/admin/projects/${project.id}`}
                className="btn-secondary"
              >
                Annuleren
              </Link>
            </div>
          </form>
        </section>
      </div>
    </AppShell>
  )
}