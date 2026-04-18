import Link from 'next/link'
import { ArrowLeft, StickyNote, Pin, Building2, FolderOpen, Construction } from 'lucide-react'
import { redirect } from 'next/navigation'
import AppShell from '@/components/app-shell'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import DashboardNotesWidget from '@/components/dashboard/dashboard-notes-widget'

export default async function AdminNotitiesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const adminSupabase = createAdminClient()

  const { data: notes } = await adminSupabase
    .from('admin_notes')
    .select('id, pinned, linked_customer_id, linked_project_id, linked_machine_id')

  const safeNotes = notes ?? []
  const total = safeNotes.length
  const pinnedCount = safeNotes.filter((n: any) => n.pinned).length
  const customerCount = safeNotes.filter((n: any) => n.linked_customer_id).length
  const projectCount = safeNotes.filter((n: any) => n.linked_project_id).length
  const machineCount = safeNotes.filter((n: any) => n.linked_machine_id).length

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
                  Dashboard
                </Link>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                  Adminportaal
                </p>
                <h1 className="mt-1 text-xl font-semibold text-[var(--text-main)] sm:text-2xl">
                  Notities
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-[var(--text-soft)]">
                  Snelle interne memo&apos;s, gekoppeld aan klanten, werven of machines.
                </p>
              </div>
              <div className="w-full xl:ml-auto xl:max-w-[820px]">
                <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(245,158,11,0.08),rgba(245,158,11,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Totaal</p>
                        <p className="mt-1 text-lg font-semibold text-amber-400">{total}</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400/10">
                        <StickyNote className="h-4.5 w-4.5 text-amber-400" />
                      </div>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(245,140,55,0.08),rgba(245,140,55,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Klanten</p>
                        <p className="mt-1 text-lg font-semibold text-[var(--accent)]">{customerCount}</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)]/10">
                        <Building2 className="h-4.5 w-4.5 text-[var(--accent)]" />
                      </div>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(33,150,243,0.08),rgba(33,150,243,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Werven</p>
                        <p className="mt-1 text-lg font-semibold text-blue-500">{projectCount}</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                        <FolderOpen className="h-4.5 w-4.5 text-blue-500" />
                      </div>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(16,185,129,0.08),rgba(16,185,129,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Machines</p>
                        <p className="mt-1 text-lg font-semibold text-emerald-400">{machineCount}</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-400/10">
                        <Construction className="h-4.5 w-4.5 text-emerald-400" />
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
            <Pin className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-semibold text-[var(--text-main)]">Alle notities</span>
            <span className="ml-auto text-[10px] text-[var(--text-muted)]">{pinnedCount} vastgepind</span>
          </div>
          <div className="min-h-[360px]">
            <DashboardNotesWidget hideHeader />
          </div>
        </section>
      </div>
    </AppShell>
  )
}
