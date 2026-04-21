import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import AppShell from '@/components/app-shell'
import Link from 'next/link'
import { ArrowLeft, Globe2, Cpu, Package, CheckCircle2 } from 'lucide-react'
import { locales, defaultLocale, COOKIE_NAME, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { REGIONS, totalPackages, totalAvailable, uniqueVendors } from './manifest'
import GeoSetupWizard from './geo-setup-wizard'

export default async function GeoSetupPage() {
  const cookieStore = await cookies()
  const raw = cookieStore.get(COOKIE_NAME)?.value ?? defaultLocale
  const locale: Locale = (locales as readonly string[]).includes(raw) ? (raw as Locale) : defaultLocale
  const t = getDictionary(locale)
  const tt = t.adminGeoSetup

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const regionCount = REGIONS.length
  const vendorCount = uniqueVendors()
  const packageCount = totalPackages()
  const availableCount = totalAvailable()

  return (
    <AppShell isAdmin>
      <div className="space-y-3 sm:space-y-4 lg:space-y-5">
        <section className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
          <div className="relative border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-3 sm:px-5">
            <div className="absolute inset-0 opacity-30">
              <div className="h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(242,140,58,0.18),transparent_35%),radial-gradient(circle_at_left,rgba(255,255,255,0.05),transparent_25%)]" />
            </div>

            <div className="relative flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0 flex-1">
                <Link
                  href="/admin/tools"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-soft)] transition hover:text-[var(--accent)]"
                >
                  <ArrowLeft className="h-3 w-3" />
                  {tt.tools}
                </Link>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                  {tt.adminPortal}
                </p>
                <h1 className="mt-1 text-xl font-semibold text-[var(--text-main)] sm:text-2xl">
                  {tt.title}
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-[var(--text-soft)]">
                  {tt.description}
                </p>
              </div>

              <div className="w-full xl:ml-auto xl:max-w-[820px]">
                <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(14,165,233,0.10),rgba(14,165,233,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">{tt.kpiRegions}</p>
                        <p className="mt-1 text-lg font-semibold text-sky-400">{regionCount}</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-400/10">
                        <Globe2 className="h-4.5 w-4.5 text-sky-400" />
                      </div>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(245,158,11,0.10),rgba(245,158,11,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">{tt.kpiVendors}</p>
                        <p className="mt-1 text-lg font-semibold text-amber-400">{vendorCount}</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400/10">
                        <Cpu className="h-4.5 w-4.5 text-amber-400" />
                      </div>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(168,85,247,0.10),rgba(168,85,247,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">{tt.kpiPackages}</p>
                        <p className="mt-1 text-lg font-semibold text-violet-400">{packageCount}</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-400/10">
                        <Package className="h-4.5 w-4.5 text-violet-400" />
                      </div>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(16,185,129,0.10),rgba(16,185,129,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">{tt.kpiAvailable}</p>
                        <p className="mt-1 text-lg font-semibold text-emerald-400">{availableCount}</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-400/10">
                        <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-4 sm:px-5">
            <GeoSetupWizard regions={REGIONS} />
          </div>
        </section>
      </div>
    </AppShell>
  )
}
