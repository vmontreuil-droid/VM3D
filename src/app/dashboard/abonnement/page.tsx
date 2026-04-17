import CustomerLogoHeaderBlock from "@/components/customers/customer-logo-header-block"
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import AppShell from '@/components/app-shell'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, getLogoSignedUrl } from '@/lib/supabase/admin'
import { locales, defaultLocale, COOKIE_NAME, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'

export default async function DashboardSubscriptionPage() {
  const cookieStore = await cookies()
  const raw = cookieStore.get(COOKIE_NAME)?.value ?? defaultLocale
  const locale: Locale = (locales as readonly string[]).includes(raw) ? (raw as Locale) : defaultLocale
  const t = getDictionary(locale)

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const adminSupabase = createAdminClient()

  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('role, full_name, company_name, logo_url')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'
  const logoSignedUrl = await getLogoSignedUrl(adminSupabase, profile?.logo_url)
  const displayName = profile?.company_name || profile?.full_name || 'klant'

  return (
    <AppShell isAdmin={isAdmin}>
      <div className="space-y-4">
        <section className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
          <div className="border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-4 sm:px-5">
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/dashboard" className="btn-secondary">
                {t.abonnement.back}
              </Link>
              <div className="ml-auto">
                <CustomerLogoHeaderBlock logoUrl={logoSignedUrl} />
              </div>
            </div>

            <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
              {t.abonnement.portal}
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-[var(--text-main)]">
              {t.abonnement.title}
            </h1>
            <p className="mt-2 text-sm text-[var(--text-soft)]">
              {t.abonnement.desc}
            </p>
          </div>

          <div className="grid gap-3 px-4 py-4 sm:px-5 md:grid-cols-2">
            <div className="card-mini">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                {t.abonnement.soon}
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--text-main)]">
                {t.abonnement.formulaTitle}
              </p>
              <p className="mt-1 text-sm text-[var(--text-soft)]">
                {t.abonnement.formulaDesc}
              </p>
            </div>

            <div className="card-mini">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                {t.abonnement.billingLabel}
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--text-main)]">
                {t.abonnement.billingTitle}
              </p>
              <p className="mt-1 text-sm text-[var(--text-soft)]">
                {t.abonnement.billingDesc}
              </p>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  )
}
