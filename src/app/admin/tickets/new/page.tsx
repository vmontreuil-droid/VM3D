import Link from 'next/link'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { ArrowLeft, PlusCircle } from 'lucide-react'
import AppShell from '@/components/app-shell'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { locales, defaultLocale, COOKIE_NAME, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'

async function createTicket(formData: FormData) {
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

  const title = String(formData.get('title') || '').trim()
  const description = String(formData.get('description') || '').trim()
  const customerIdRaw = String(formData.get('customer_id') || '').trim()
  const projectIdRaw = String(formData.get('project_id') || '').trim()
  const priority = String(formData.get('priority') || 'normaal').trim()
  const status = String(formData.get('status') || 'nieuw').trim()
  const dueDateRaw = String(formData.get('due_date') || '').trim()

  if (!title) {
    redirect('/admin/tickets/new?error=title')
  }

  const adminSupabase = createAdminClient()

  const insertPayload = {
    title,
    description: description || null,
    customer_id: customerIdRaw || null,
    project_id: projectIdRaw ? Number(projectIdRaw) : null,
    priority,
    status,
    due_date: dueDateRaw || null,
    created_by: user.id,
  }

  const { data, error } = await adminSupabase
    .from('tickets')
    .insert(insertPayload)
    .select('id')
    .single()

  if (error || !data) {
    console.error('createTicket error:', error)
    redirect('/admin/tickets/new?error=save')
  }

  redirect(`/admin/tickets/${data.id}?created=1`)
}

type Props = {
  searchParams?: Promise<{
    customer?: string
    project?: string
    error?: string
  }>
}

export default async function AdminTicketNewPage({ searchParams }: Props) {
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const cookieStore = await cookies()
  const raw = cookieStore.get(COOKIE_NAME)?.value ?? defaultLocale
  const locale: Locale = (locales as readonly string[]).includes(raw) ? (raw as Locale) : defaultLocale
  const t = getDictionary(locale)
  const tt = t.newTicket

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
    .select('id, full_name, company_name, email')
    .neq('role', 'admin')
    .order('company_name', { ascending: true })

  const { data: projects } = await adminSupabase
    .from('projects')
    .select('id, name, address, user_id')
    .order('created_at', { ascending: false })
    .limit(250)

  const titleError = resolvedSearchParams.error === 'title'
  const saveError = resolvedSearchParams.error === 'save'

  return (
    <AppShell isAdmin>
      <div className="space-y-3 sm:space-y-4 lg:space-y-5">
        {(titleError || saveError) && (
          <section className="space-y-1">
            {titleError && (
              <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                {tt.titleRequired}
              </div>
            )}
            {saveError && (
              <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {tt.saveError}
              </div>
            )}
          </section>
        )}

        <section className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
          <div className="border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-4 sm:px-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
              {tt.adminPortal}
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-[var(--text-main)] sm:text-3xl">
              {tt.title}
            </h1>
            <p className="mt-2 text-sm text-[var(--text-soft)]">
              {tt.subtitle}
            </p>

            <div className="mt-3 max-w-[280px]">
              <Link
                href="/admin"
                className="group relative block overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2.5 transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)]/80"
              >
                <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
                <div className="flex items-start gap-2.5 pr-2">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold leading-5 text-[var(--text-main)]">
                      {tt.dashboard}
                    </span>
                    <span className="block text-[11px] leading-4 text-[var(--text-soft)]">
                      {tt.backToAdmin}
                    </span>
                  </span>
                </div>
              </Link>
            </div>
          </div>

          <form action={createTicket} className="space-y-3 px-4 py-4 sm:px-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2 sm:col-span-2">
                <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  {tt.titleLabel}
                </label>
                <input
                  name="title"
                  type="text"
                  required
                  className="input-dark w-full px-3 py-2.5 text-sm"
                  placeholder={tt.titlePlaceholder}
                />
              </div>

              <div className="grid gap-2 sm:col-span-2">
                <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  {tt.description}
                </label>
                <textarea
                  name="description"
                  className="input-dark min-h-[120px] w-full resize-none px-3 py-2.5 text-sm"
                  placeholder={tt.descriptionPlaceholder}
                />
              </div>

              <div className="grid gap-2">
                <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  {tt.customer}
                </label>
                <select
                  name="customer_id"
                  defaultValue={resolvedSearchParams.customer || ''}
                  className="input-dark w-full px-3 py-2.5 text-sm"
                >
                  <option value="">{tt.noCustomer}</option>
                  {(customers ?? []).map((customer: any) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.company_name || customer.full_name || customer.email || customer.id}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  {tt.site}
                </label>
                <select
                  name="project_id"
                  defaultValue={resolvedSearchParams.project || ''}
                  className="input-dark w-full px-3 py-2.5 text-sm"
                >
                  <option value="">{tt.noSite}</option>
                  {(projects ?? []).map((project: any) => (
                    <option key={project.id} value={project.id}>
                      #{project.id} · {project.name || project.address || tt.noTitle}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  {tt.priority}
                </label>
                <select
                  name="priority"
                  defaultValue="normaal"
                  className="input-dark w-full px-3 py-2.5 text-sm"
                >
                  <option value="laag">{tt.priorityLow}</option>
                  <option value="normaal">{tt.priorityNormal}</option>
                  <option value="hoog">{tt.priorityHigh}</option>
                  <option value="urgent">{tt.priorityUrgent}</option>
                </select>
              </div>

              <div className="grid gap-2">
                <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  {tt.status}
                </label>
                <select
                  name="status"
                  defaultValue="nieuw"
                  className="input-dark w-full px-3 py-2.5 text-sm"
                >
                  <option value="nieuw">{tt.statusNew}</option>
                  <option value="in_behandeling">{tt.statusInProgress}</option>
                  <option value="wacht_op_klant">{tt.statusWaitingCustomer}</option>
                  <option value="afgerond">{tt.statusDone}</option>
                  <option value="gesloten">{tt.statusClosed}</option>
                </select>
              </div>

              <div className="grid gap-2">
                <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  {tt.dueDate}
                </label>
                <input
                  name="due_date"
                  type="date"
                  className="input-dark w-full px-3 py-2.5 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" className="btn-primary">
                <PlusCircle className="h-4 w-4" />
                {tt.submit}
              </button>
            </div>
          </form>
        </section>
      </div>
    </AppShell>
  )
}
