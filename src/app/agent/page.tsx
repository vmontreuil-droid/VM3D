import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FilePlus, Receipt, TrendingUp, Users, LogOut } from 'lucide-react'

function fmt(n: number) {
  const [i, d] = n.toFixed(2).split('.')
  return `${i.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${d}`
}
function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('nl-BE')
}
function statusLabel(s: string) {
  const map: Record<string, { label: string; cls: string }> = {
    concept:   { label: 'Concept',   cls: 'bg-zinc-500/12 text-zinc-400' },
    verstuurd: { label: 'Verstuurd', cls: 'bg-amber-500/12 text-amber-400' },
    betaald:   { label: 'Betaald',   cls: 'bg-emerald-500/12 text-emerald-400' },
  }
  return map[s] ?? { label: s, cls: 'bg-zinc-500/12 text-zinc-400' }
}

export default async function AgentDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminSupabase = createAdminClient()
  const { data: agent } = await adminSupabase
    .from('profiles')
    .select('id, full_name, company_name, email, commission_rate')
    .eq('id', user.id)
    .single()

  // Toegewezen klanten
  const { data: assignments } = await adminSupabase
    .from('agent_assignments')
    .select('id, customer_id, project_id')
    .eq('agent_id', user.id)

  const customerIds = [...new Set((assignments || []).map(a => a.customer_id).filter(Boolean))]
  const { data: customers } = customerIds.length > 0
    ? await adminSupabase.from('profiles').select('id, company_name, full_name, email').in('id', customerIds)
    : { data: [] }

  // Eigen facturen
  const now = new Date()
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  const { data: facturen } = await adminSupabase
    .from('facturen')
    .select('id, factuur_number, status, total, due_date, created_at, customer_id')
    .eq('agent_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: monthFacturen } = await adminSupabase
    .from('facturen')
    .select('total')
    .eq('agent_id', user.id)
    .in('status', ['verstuurd', 'betaald'])
    .gte('created_at', monthStart)

  const maandomzet = (monthFacturen || []).reduce((s, f) => s + Number(f.total), 0)
  const commRate   = Number(agent?.commission_rate) || 0
  const commissie  = maandomzet * commRate / 100

  const customerMap: Record<string, string> = {}
  ;(customers || []).forEach(c => {
    customerMap[c.id] = c.company_name || c.full_name || c.email || 'Klant'
  })

  // Commission runs (historiek)
  const { data: commRuns } = await adminSupabase
    .from('agent_commission_runs')
    .select('id, periode, basis_bedrag, commission_rate, commission_bedrag, factuur_id')
    .eq('agent_id', user.id)
    .order('periode', { ascending: false })
    .limit(6)

  const name = agent?.company_name || agent?.full_name || 'Agent'

  return (
    <div className="min-h-screen bg-[var(--bg-main,#0f172a)]">
      {/* Header */}
      <div className="border-b border-[var(--border-soft,#1e293b)] bg-[var(--bg-card,#1e293b)] px-4 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-base font-bold text-[#f7941d]">MV3D<span className="text-white">.CLOUD</span></span>
            <span className="rounded-full border border-[#f7941d]/30 bg-[#f7941d]/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#f7941d]">
              Agent
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">{name}</span>
            <form action="/api/auth/signout" method="POST">
              <button type="submit" className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:text-white">
                <LogOut className="h-3.5 w-3.5" /> Uitloggen
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-5 p-4 pb-12">
        {/* Stat cards */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-[var(--border-soft,#1e293b)] bg-[var(--bg-card,#1e293b)] p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f7941d]/12 text-[#f7941d]">
                <TrendingUp className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Omzet deze maand</p>
                <p className="text-lg font-bold text-[#f7941d]">€ {fmt(maandomzet)}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--border-soft,#1e293b)] bg-[var(--bg-card,#1e293b)] p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/12 text-amber-400">
                <Receipt className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Commissie ({commRate}%)</p>
                <p className="text-lg font-bold text-amber-400">€ {fmt(commissie)}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--border-soft,#1e293b)] bg-[var(--bg-card,#1e293b)] p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/12 text-blue-400">
                <Users className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Toegewezen klanten</p>
                <p className="text-lg font-bold text-blue-400">{customerIds.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Facturen + nieuwe factuur */}
        <div className="overflow-hidden rounded-2xl border border-[var(--border-soft,#1e293b)] bg-[var(--bg-card,#1e293b)]">
          <div className="flex items-center justify-between border-b border-[var(--border-soft,#1e293b)] px-4 py-3.5">
            <h2 className="text-sm font-semibold text-white">Mijn facturen</h2>
            {customerIds.length > 0 && (
              <Link
                href="/agent/facturen/new"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#f7941d] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
              >
                <FilePlus className="h-3.5 w-3.5" /> Nieuwe factuur
              </Link>
            )}
          </div>

          {(!facturen || facturen.length === 0) ? (
            <div className="py-10 text-center">
              <p className="text-sm text-slate-400">Nog geen facturen opgemaakt.</p>
              {customerIds.length > 0 && (
                <Link href="/agent/facturen/new" className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#f7941d] px-4 py-2 text-xs font-semibold text-white">
                  <FilePlus className="h-3.5 w-3.5" /> Eerste factuur aanmaken
                </Link>
              )}
              {customerIds.length === 0 && (
                <p className="mt-1 text-xs text-slate-500">Wacht tot de admin u klanten toewijst.</p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-soft,#1e293b)]">
              {facturen.map(f => {
                const s = statusLabel(f.status)
                return (
                  <div key={f.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{f.factuur_number}</p>
                      <p className="text-xs text-slate-400">
                        {customerMap[f.customer_id] || '—'} · {fmtDate(f.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.cls}`}>{s.label}</span>
                      <span className="text-sm font-bold text-[#f7941d]">€ {fmt(Number(f.total))}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Commissiehistoriek */}
        {(commRuns || []).length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-[var(--border-soft,#1e293b)] bg-[var(--bg-card,#1e293b)]">
            <div className="border-b border-[var(--border-soft,#1e293b)] px-4 py-3.5">
              <h2 className="text-sm font-semibold text-white">Commissiehistoriek</h2>
            </div>
            <div className="divide-y divide-[var(--border-soft,#1e293b)]">
              {commRuns!.map(run => (
                <div key={run.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{run.periode}</p>
                    <p className="text-xs text-slate-400">Basis: € {fmt(Number(run.basis_bedrag))} · {run.commission_rate}%</p>
                  </div>
                  <span className="text-sm font-bold text-amber-400">€ {fmt(Number(run.commission_bedrag))}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
