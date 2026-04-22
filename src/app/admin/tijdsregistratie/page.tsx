import Link from 'next/link'
import { ArrowLeft, Clock, Play, CheckCircle2, Euro } from 'lucide-react'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import AppShell from '@/components/app-shell'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import DashboardTimeWidget from '@/components/dashboard/dashboard-time-widget'
import { locales, defaultLocale, COOKIE_NAME, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'

function formatDuration(seconds: number, hSuffix: string, mSuffix: string) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}${hSuffix} ${m}${mSuffix}`
}

export default async function AdminTijdsregistratiePage() {
  const cookieStore = await cookies()
  const raw = cookieStore.get(COOKIE_NAME)?.value ?? defaultLocale
  const locale: Locale = (locales as readonly string[]).includes(raw) ? (raw as Locale) : defaultLocale
  const t = getDictionary(locale)
  const tt = t.adminTimeTracking

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const adminSupabase = createAdminClient()

  const { data: entries } = await adminSupabase
    .from('time_entries')
    .select('id, started_at, ended_at, duration_seconds, billable')

  const safeEntries = entries ?? []
  const total = safeEntries.length
  const running = safeEntries.filter((e: any) => !e.ended_at).length
  const completed = safeEntries.filter((e: any) => e.ended_at).length
  const totalSeconds = safeEntries
    .filter((e: any) => e.ended_at)
    .reduce((s: number, e: any) => s + (e.duration_seconds ?? 0), 0)
  const billableSeconds = safeEntries
    .filter((e: any) => e.ended_at && e.billable)
    .reduce((s: number, e: any) => s + (e.duration_seconds ?? 0), 0)

  // Vandaag
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todaySeconds = safeEntries
    .filter((e: any) => e.ended_at && new Date(e.started_at) >= todayStart)
    .reduce((s: number, e: any) => s + (e.duration_seconds ?? 0), 0)

  return (
    <AppShell isAdmin>
      <div className="space-y-2 sm:space-y-3">
        <section className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
          <div className="relative border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-3 sm:px-5">
            <div className="absolute inset-0 opacity-30">
              <div className="h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(242,140,58,0.18),transparent_35%),radial-gradient(circle_at_left,rgba(255,255,255,0.05),transparent_25%)]" />
            </div>
            <div className="relative flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0 flex-1">
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-soft)] transition hover:text-[var(--accent)]"
                >
                  <ArrowLeft className="h-3 w-3" />
                  {tt.dashboard}
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
                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(16,185,129,0.08),rgba(16,185,129,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">{tt.kpiRunning}</p>
                        <p className="mt-1 text-lg font-semibold text-emerald-400">{running}</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-400/10">
                        <Play className="h-4.5 w-4.5 text-emerald-400" />
                      </div>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(14,165,233,0.08),rgba(14,165,233,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">{tt.kpiToday}</p>
                        <p className="mt-1 text-lg font-semibold text-sky-400">{formatDuration(todaySeconds, tt.hoursShort, tt.minutesShort)}</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-400/10">
                        <Clock className="h-4.5 w-4.5 text-sky-400" />
                      </div>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(245,140,55,0.08),rgba(245,140,55,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">{tt.kpiTotal}</p>
                        <p className="mt-1 text-lg font-semibold text-[var(--accent)]">{formatDuration(totalSeconds, tt.hoursShort, tt.minutesShort)}</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)]/10">
                        <CheckCircle2 className="h-4.5 w-4.5 text-[var(--accent)]" />
                      </div>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(76,175,80,0.08),rgba(76,175,80,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">{tt.kpiBillable}</p>
                        <p className="mt-1 text-lg font-semibold text-green-500">{formatDuration(billableSeconds, tt.hoursShort, tt.minutesShort)}</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10">
                        <Euro className="h-4.5 w-4.5 text-green-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
          <div className="flex items-center gap-2 border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-2.5">
            <Clock className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-semibold text-[var(--text-main)]">{tt.sectionTitle}</span>
            <span className="ml-auto text-[10px] text-[var(--text-muted)]">{tt.entriesCount.replace('{n}', String(total)).replace('{done}', String(completed))}</span>
          </div>
          <div className="min-h-[360px]">
            <DashboardTimeWidget hideHeader />
          </div>
        </section>
      </div>
    </AppShell>
  )
}
