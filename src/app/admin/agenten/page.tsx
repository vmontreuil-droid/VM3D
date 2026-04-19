import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import AppShell from '@/components/app-shell'
import Link from 'next/link'
import { Users, Plus, Percent, TrendingUp, ToggleLeft, ToggleRight } from 'lucide-react'

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

  return (
    <AppShell isAdmin>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="group relative inline-flex overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-3">
            <span className="absolute right-0 top-0 h-full w-[2px] rounded-l-full bg-[var(--accent)]/80" />
            <span className="flex items-start gap-2.5 pr-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
                <Users className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold leading-5 text-[var(--text-main)]">Agenten</span>
                <span className="block text-[11px] leading-4 text-[var(--text-soft)]">{agents?.length ?? 0} actieve agenten</span>
              </span>
            </span>
          </div>
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
    </AppShell>
  )
}
