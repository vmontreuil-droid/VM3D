import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import AppShell from '@/components/app-shell'
import Link from 'next/link'
import { Users, Plus, Percent, TrendingUp, ToggleLeft, ToggleRight, ArrowLeft, CheckCircle2, Wallet } from 'lucide-react'

async function toggleAgentAction(agentId: string, active: boolean) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')
  const adminSupabase = createAdminClient()
  await adminSupabase.from('profiles').update({ agent_active: active }).eq('id', agentId)
  revalidatePath('/admin/agenten')
}

async function updateCommissionAction(agentId: string, rate: number) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')
  const adminSupabase = createAdminClient()
  await adminSupabase.from('profiles').update({ commission_rate: rate }).eq('id', agentId)
  revalidatePath('/admin/agenten')
}

function fmt(n: number) {
  const [i, d] = n.toFixed(2).split('.')
  return `${i.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${d}`
}

export default async function AgentenPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const adminSupabase = createAdminClient()
  const { data: agents } = await adminSupabase
    .from('profiles')
    .select('id, full_name, company_name, email, commission_rate, agent_active')
    .eq('role', 'agent')
    .order('full_name')

  // Per agent: aantal facturen + omzet deze maand
  const now = new Date()
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  const agentStats: Record<string, { facturen: number; omzet: number; commissie: number }> = {}
  for (const agent of agents || []) {
    const { data: facs } = await adminSupabase
      .from('facturen')
      .select('total')
      .eq('agent_id', agent.id)
      .in('status', ['verstuurd', 'betaald'])
      .gte('created_at', monthStart)
    const omzet = (facs || []).reduce((s, f) => s + Number(f.total), 0)
    agentStats[agent.id] = {
      facturen: (facs || []).length,
      omzet,
      commissie: omzet * (Number(agent.commission_rate) || 0) / 100,
    }
  }

  const totalAgents = agents?.length ?? 0
  const activeAgents = (agents ?? []).filter(a => a.agent_active).length
  const totalOmzet = Object.values(agentStats).reduce((s, x) => s + x.omzet, 0)
  const totalCommissie = Object.values(agentStats).reduce((s, x) => s + x.commissie, 0)

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
                  Agenten
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-[var(--text-soft)]">
                  Beheer je verkoopagenten, hun commissiepercentage en bekijk de omzet die ze deze maand binnenbrachten.
                </p>
              </div>

              <div className="w-full xl:ml-auto xl:max-w-[820px]">
                <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(14,165,233,0.10),rgba(14,165,233,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Totaal</p>
                        <p className="mt-1 text-lg font-semibold text-sky-400">{totalAgents}</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-400/10">
                        <Users className="h-4.5 w-4.5 text-sky-400" />
                      </div>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(16,185,129,0.10),rgba(16,185,129,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Actief</p>
                        <p className="mt-1 text-lg font-semibold text-emerald-400">{activeAgents}</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-400/10">
                        <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400" />
                      </div>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(168,85,247,0.10),rgba(168,85,247,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Omzet (maand)</p>
                        <p className="mt-1 text-lg font-semibold text-violet-400">€ {fmt(totalOmzet)}</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-400/10">
                        <TrendingUp className="h-4.5 w-4.5 text-violet-400" />
                      </div>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(245,158,11,0.10),rgba(245,158,11,0.02))] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Commissie</p>
                        <p className="mt-1 text-lg font-semibold text-amber-400">€ {fmt(totalCommissie)}</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400/10">
                        <Wallet className="h-4.5 w-4.5 text-amber-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 px-4 py-4 sm:px-5">
            <div className="flex items-center justify-end">
              <Link
                href="/admin/agenten/new"
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90"
              >
                <Plus className="h-3.5 w-3.5" />
                Nieuwe agent
              </Link>
            </div>

        {(!agents || agents.length === 0) ? (
          <div className="flex flex-col items-center justify-center rounded-[18px] border border-[var(--border-soft)] bg-[var(--bg-card-2)]/80 py-12 text-center shadow-sm">
            <Users className="h-8 w-8 text-[var(--text-muted)]" />
            <p className="mt-3 text-sm font-semibold text-[var(--text-main)]">Nog geen agenten</p>
            <p className="mt-1 text-xs text-[var(--text-soft)]">Maak een agent aan om klanten en projecten toe te wijzen.</p>
            <Link href="/admin/agenten/new" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white">
              <Plus className="h-3.5 w-3.5" /> Eerste agent aanmaken
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[18px] border border-[var(--border-soft)] bg-[var(--bg-card-2)]/80 shadow-sm">
            <div className="divide-y divide-[var(--border-soft)]">
              {agents!.map(agent => {
                const stats = agentStats[agent.id] || { facturen: 0, omzet: 0, commissie: 0 }
                const name = agent.company_name || agent.full_name || agent.email
                return (
                  <div key={agent.id} className="flex flex-wrap items-center gap-4 px-4 py-4 sm:px-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/12 text-sm font-bold text-[var(--accent)]">
                      {(name || '?')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[var(--text-main)]">{name}</p>
                      <p className="text-xs text-[var(--text-soft)]">{agent.email}</p>
                    </div>

                    {/* Stats deze maand */}
                    <div className="flex items-center gap-4 text-xs text-[var(--text-soft)]">
                      <div className="text-center">
                        <p className="font-semibold text-[var(--text-main)]">{stats.facturen}</p>
                        <p className="text-[10px]">facturen</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-[var(--accent)]">€ {fmt(stats.omzet)}</p>
                        <p className="text-[10px]">omzet</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-emerald-400">€ {fmt(stats.commissie)}</p>
                        <p className="text-[10px]">commissie</p>
                      </div>
                    </div>

                    {/* Commissie % */}
                    <form action={async (fd: FormData) => {
                      'use server'
                      const rate = parseFloat(String(fd.get('rate') || '0'))
                      await updateCommissionAction(agent.id, rate)
                    }} className="flex items-center gap-1.5">
                      <Percent className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                      <input
                        name="rate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        defaultValue={Number(agent.commission_rate) || 0}
                        className="w-16 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-2 py-1 text-xs text-[var(--text-main)] outline-none focus:border-[var(--accent)]/50"
                      />
                      <button type="submit" className="rounded-lg bg-[var(--accent)]/12 px-2 py-1 text-[10px] font-semibold text-[var(--accent)] hover:bg-[var(--accent)]/20">
                        Sla op
                      </button>
                    </form>

                    {/* Toggle active */}
                    <form action={toggleAgentAction.bind(null, agent.id, !agent.agent_active)}>
                      <button type="submit" className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                        agent.agent_active
                          ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                          : 'bg-zinc-500/10 text-zinc-400 hover:bg-zinc-500/20'
                      }`}>
                        {agent.agent_active
                          ? <><ToggleRight className="h-3.5 w-3.5" /> Actief</>
                          : <><ToggleLeft className="h-3.5 w-3.5" /> Inactief</>}
                      </button>
                    </form>

                    <Link
                      href={`/admin/agenten/${agent.id}`}
                      className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-1.5 text-xs font-semibold text-[var(--text-main)] hover:border-[var(--accent)]/40"
                    >
                      Details
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        )}
          </div>
        </section>
      </div>
    </AppShell>
  )
}
