import Link from 'next/link'
import { redirect } from 'next/navigation'
import AppShell from '@/components/app-shell'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardSubscriptionPage() {
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
              Formule
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-[var(--text-main)]">
              Abonnement
            </h1>
            <p className="mt-2 text-sm text-[var(--text-soft)]">
              Hier zal {displayName} binnenkort het actieve abonnement, opties en facturatie-info kunnen bekijken.
            </p>
          </div>

          <div className="grid gap-3 px-4 py-4 sm:px-5 md:grid-cols-2">
            <div className="card-mini">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Binnenkort
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--text-main)]">
                Formuleoverzicht
              </p>
              <p className="mt-1 text-sm text-[var(--text-soft)]">
                Raadpleeg later je gekozen plan, inbegrepen diensten en eventuele uitbreidingen.
              </p>
            </div>

            <div className="card-mini">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Facturatie
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--text-main)]">
                Betaling en historiek
              </p>
              <p className="mt-1 text-sm text-[var(--text-soft)]">
                Een overzicht van facturen en betalingsstatus kan hier later toegevoegd worden.
              </p>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  )
}
