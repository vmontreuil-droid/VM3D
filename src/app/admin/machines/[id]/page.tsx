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
import { ArrowLeft, Pencil, Wifi, WifiOff } from 'lucide-react'

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

        {/* Hero */}
        <section className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
          <div
            className="border-b border-[var(--border-soft)] px-5 py-5"
            style={{
              backgroundImage: `linear-gradient(135deg, ${brandColor}22 0%, transparent 60%)`,
            }}
          >
            <div className="flex flex-wrap items-start gap-4">
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl shadow-sm"
                style={{ backgroundColor: `${brandColor}22` }}
              >
                <MachineIcon type={machine.machine_type} size={40} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: `${brandColor}25`,
                      color: brandColor,
                    }}
                  >
                    {brand}
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
                  <span className="ml-1 rounded bg-black/30 px-2 py-0.5 font-mono text-[10px] text-emerald-400">
                    {machine.connection_code}
                  </span>
                </div>
                <h1 className="mt-1 text-2xl font-semibold text-[var(--text-main)]">
                  {machine.model}{' '}
                  <span className="text-[var(--text-soft)]">
                    · {machine.name}
                  </span>
                </h1>
                <p className="mt-0.5 text-xs text-[var(--text-soft)]">
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
              <div className="flex flex-col gap-2 sm:flex-row">
                <Link
                  href="/admin/machines"
                  className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-2 text-xs font-semibold text-[var(--text-main)] hover:bg-[var(--bg-card)]"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Terug
                </Link>
                <Link
                  href={`/admin/machines/${machine.id}/edit`}
                  className="inline-flex items-center gap-1 rounded-lg bg-[var(--accent)]/15 px-3 py-2 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent)]/25"
                >
                  <Pencil className="h-3.5 w-3.5" /> Bewerken
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Werven & bestanden */}
        <MachineTransferPanel
          machineId={machine.id}
          guidanceSystem={machine.guidance_system}
        />
      </div>
    </AppShell>
  )
}
