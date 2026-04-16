import { redirect } from 'next/navigation'
import AppShell from '@/components/app-shell'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import MachinesClient from './machines-client'

export default async function MachinesPage() {
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
    .select('role, full_name, company_name')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'

  // Fetch machines for this user
  const { data: machines } = await adminSupabase
    .from('machines')
    .select('*, project:projects(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Fetch user's projects for the form dropdown
  const { data: projects } = await adminSupabase
    .from('projects')
    .select('id, name')
    .eq('user_id', user.id)
    .order('name')

  return (
    <AppShell isAdmin={isAdmin}>
      <div className="space-y-4">
        {/* Header */}
        <section className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
          <div className="relative border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-3 sm:px-5 sm:py-3.5">
            <div className="absolute inset-0 opacity-30">
              <div className="h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_35%),radial-gradient(circle_at_left,rgba(255,255,255,0.05),transparent_25%)]" />
            </div>
            <div className="relative flex flex-wrap items-center justify-between gap-2">
              <div>
                <Link href="/dashboard" className="btn-secondary text-xs">← Dashboard</Link>
              </div>
            </div>
            <div className="relative mt-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-400">
                Machinepark
              </p>
              <h1 className="mt-1 text-xl font-semibold text-[var(--text-main)] sm:text-2xl">
                Mijn Machines
              </h1>
              <p className="mt-1 max-w-2xl text-xs text-[var(--text-soft)] sm:text-sm">
                Beheer je kranen, bulldozers en machinebesturingen.
              </p>
            </div>
          </div>
        </section>

        <MachinesClient
          machines={machines || []}
          projects={projects || []}
          userId={user.id}
        />
      </div>
    </AppShell>
  )
}
