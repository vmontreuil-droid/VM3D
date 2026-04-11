import Link from 'next/link'
import { redirect } from 'next/navigation'
import AppShell from '@/components/app-shell'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardTicketsPage() {
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

  const isAdmin = profile?.role === 'admin'
  if (isAdmin) {
    redirect('/admin/tickets')
  }

  const displayName = profile?.company_name || profile?.full_name || 'klant'

  return (
    <AppShell isAdmin={isAdmin}>
      <div className="space-y-4">
        <section className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
          <div className="border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-4 sm:px-5">
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/dashboard" className="btn-secondary">
                ← Terug naar dashboard
              </Link>
            </div>

            <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
              Support
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-[var(--text-main)]">
              Tickets
            </h1>
            <p className="mt-2 text-sm text-[var(--text-soft)]">
              Hier zal {displayName} binnenkort eenvoudig supporttickets kunnen aanmaken en opvolgen.
            </p>
          </div>

          <div className="grid gap-3 px-4 py-4 sm:px-5 md:grid-cols-2">
            <div className="card-mini">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Binnenkort
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--text-main)]">
                Nieuw ticket indienen
              </p>
              <p className="mt-1 text-sm text-[var(--text-soft)]">
                Meld een vraag, technisch probleem of opvolging rechtstreeks via het portaal.
              </p>
            </div>

            <div className="card-mini">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Opvolging
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--text-main)]">
                Status en historiek
              </p>
              <p className="mt-1 text-sm text-[var(--text-soft)]">
                Bekijk later de status, antwoorden en historiek van je aanvragen op één plaats.
              </p>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  )
}
