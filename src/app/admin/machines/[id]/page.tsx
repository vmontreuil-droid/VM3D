import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/app-shell'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import MachineTransferPanel from '@/components/machines/machine-transfer-panel'
import {
  MachineIcon,
  BRAND_COLORS,
  GUIDANCE_COLORS,
  formatTonnage,
} from '@/components/machines/machine-icons'
import { ArrowLeft, Pencil, Wifi, WifiOff, Hash, Building2, Radio, Construction } from 'lucide-react'

export default async function AdminOpenMachinePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const machineId = parseInt(id, 10)
  if (Number.isNaN(machineId)) notFound()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminSupabase = createAdminClient()
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: machine } = await adminSupabase
    .from('machines')
    .select('*')
    .eq('id', machineId)
    .maybeSingle()
  if (!machine) notFound()

  const { data: owner } = await adminSupabase
    .from('profiles')
    .select('id, company_name, full_name, email')
    .eq('id', machine.user_id)
    .maybeSingle()

  const brand = (machine.brand || '').toUpperCase()
  const guidance = (machine.guidance_system || '').toUpperCase()
  const brandColor = BRAND_COLORS[brand] || '#888'
  const guidanceStyle = guidance ? GUIDANCE_COLORS[guidance] : null
  const lastSeen = machine.last_seen_at ? new Date(machine.last_seen_at) : null

  return (
    <AppShell isAdmin>
      <div className="mx-auto w-full max-w-[1600px] space-y-4 pb-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <Link href="/admin" className="hover:text-[var(--text-main)]">
            Admin
          </Link>
          <span>/</span>
          <Link
            href="/admin/machines"
            className="hover:text-[var(--text-main)]"
          >
            Machines
          </Link>
          <span>/</span>
          <span className="text-[var(--text-main)]">
            {brand} {machine.model}
          </span>
        </div>

        {/* Hero — uniform dashboard style */}
        <section className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
          <div className="relative border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-3 sm:px-5 sm:py-3.5">
            <div className="absolute inset-0 opacity-30">
              <div className="h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_35%),radial-gradient(circle_at_left,rgba(255,255,255,0.05),transparent_25%)]" />
            </div>
            <div className="relative flex flex-wrap items-center justify-between gap-2">
              <Link
                href="/admin/machines"
                className="btn-secondary text-xs"
              >
                <ArrowLeft className="inline h-3 w-3 mr-1" /> Terug
              </Link>
              <Link
                href={`/admin/machines/${machine.id}/edit`}
                className="ml-auto inline-flex items-center gap-1 rounded-lg bg-[var(--accent)]/15 px-3 py-1.5 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent)]/25"
              >
                <Pencil className="h-3 w-3" /> Bewerken
              </Link>
            </div>
            <div className="relative mt-3 flex flex-wrap items-center gap-3">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${brandColor}22` }}
              >
                <MachineIcon type={machine.machine_type} size={32} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-400">
                  Machine
                </p>
                <h1 className="mt-0.5 flex flex-wrap items-center gap-2 text-xl font-semibold text-[var(--text-main)] sm:text-2xl">
                  <span>
                    {brand} {machine.model}
                  </span>
                  <span className="font-normal text-[var(--text-soft)]">
                    · {machine.name}
                  </span>
                  {guidanceStyle && guidance && (
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold ${guidanceStyle.bg} ${guidanceStyle.text}`}
                    >
                      {guidance}
                    </span>
                  )}
                  {machine.is_online ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                      <Wifi className="h-3 w-3" /> Online
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-card-2)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
                      <WifiOff className="h-3 w-3" /> Offline
                    </span>
                  )}
                </h1>
                <p className="mt-1 text-xs text-[var(--text-soft)]">
                  {machine.machine_type === 'bulldozer' ? 'Bulldozer' : 'Kraan'}
                  {machine.tonnage
                    ? ` · ${formatTonnage(Number(machine.tonnage))}`
                    : ''}
                  {machine.year ? ` · Bouwjaar ${machine.year}` : ''}
                  {owner
                    ? ` · Klant: ${owner.company_name || owner.full_name}`
                    : ' · Geen klant'}
                  {lastSeen
                    ? ` · Laatst gezien ${lastSeen.toLocaleString()}`
                    : ''}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-3">
            <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
              <Hash className="h-3 w-3" /> Code
            </p>
            <p className="mt-1 font-mono text-sm font-bold text-emerald-400">
              {machine.connection_code}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-3">
            <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
              <Building2 className="h-3 w-3" /> Klant
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-[var(--text-main)]">
              {owner?.company_name || owner?.full_name || '—'}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-3">
            <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
              <Radio className="h-3 w-3" /> Besturing
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
              {guidance || '—'}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-3">
            <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
              <Construction className="h-3 w-3" /> Tonnage
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
              {machine.tonnage ? formatTonnage(Number(machine.tonnage)) : '—'}
            </p>
          </div>
        </div>

        {/* Werven & bestanden */}
        <MachineTransferPanel
          machineId={machine.id}
          guidanceSystem={machine.guidance_system}
        />
      </div>
    </AppShell>
  )
}
