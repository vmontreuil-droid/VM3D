'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MachineCard, type Machine } from '@/components/machines/machine-card'
import { MachineIcon, BRAND_COLORS, GUIDANCE_COLORS, formatTonnage } from '@/components/machines/machine-icons'
import { Search, Construction, ArrowLeft, Wifi, WifiOff, Filter, Trash2, Plus, Activity, HardHat, MapPin } from 'lucide-react'
import Link from 'next/link'
import { useT } from '@/i18n/context'
import MachinesMap, { type MachineMapPoint } from '@/components/machines/machines-map'

type MachineWithOwner = Machine & {
  owner?: { company_name?: string; full_name?: string }
  latitude?: number | null
  longitude?: number | null
  location_updated_at?: string | null
}

export default function AdminMachinesClient({ machines }: { machines: MachineWithOwner[] }) {
  const { t } = useT()
  const tt = t.adminMachines
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterBrand, setFilterBrand] = useState<string>('all')
  const [filterGuidance, setFilterGuidance] = useState<string>('all')
  const [filterOnline, setFilterOnline] = useState<string>('all')

  const brands = [...new Set(machines.map(m => m.brand.toUpperCase()))].sort()
  const guidanceSystems = [...new Set(machines.filter(m => m.guidance_system).map(m => m.guidance_system!.toUpperCase()))].sort()

  const filtered = machines.filter(m => {
    if (filterType !== 'all' && m.machine_type !== filterType) return false
    if (filterBrand !== 'all' && m.brand.toUpperCase() !== filterBrand) return false
    if (filterGuidance !== 'all' && m.guidance_system?.toUpperCase() !== filterGuidance) return false
    if (filterOnline === 'online' && !m.is_online) return false
    if (filterOnline === 'offline' && m.is_online) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        m.name.toLowerCase().includes(q) ||
        m.brand.toLowerCase().includes(q) ||
        m.model.toLowerCase().includes(q) ||
        m.connection_code.toLowerCase().includes(q) ||
        m.serial_number?.toLowerCase().includes(q) ||
        m.project?.name?.toLowerCase().includes(q) ||
        m.owner?.company_name?.toLowerCase().includes(q) ||
        m.owner?.full_name?.toLowerCase().includes(q)
      )
    }
    return true
  })

  const onlineCount = machines.filter(m => m.is_online).length
  const excavatorCount = machines.filter(m => m.machine_type === 'excavator').length
  const bulldozerCount = machines.filter(m => m.machine_type === 'bulldozer').length
  const graderCount = machines.filter(m => m.machine_type === 'grader').length

  const mapPoints: MachineMapPoint[] = machines
    .filter(m => m.latitude != null && m.longitude != null)
    .map(m => ({
      id: m.id,
      name: m.name,
      brand: m.brand,
      model: m.model,
      latitude: Number(m.latitude),
      longitude: Number(m.longitude),
      is_online: !!m.is_online,
      location_updated_at: m.location_updated_at ?? null,
    }))
  const locatedCount = mapPoints.length

  async function handleDelete(m: MachineWithOwner) {
    const label = `${m.brand} ${m.model} (${m.name})`
    if (!confirm(tt.deletePrompt.replace('{label}', label))) {
      return
    }
    setDeletingId(m.id)
    try {
      const res = await fetch(`/api/machines/${m.id}`, { method: 'DELETE' })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j.error || tt.deleteFailed)
      router.refresh()
    } catch (e) {
      alert('Fout: ' + (e as Error).message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header met stats rechts */}
      <section className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
        <div className="relative border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-3 sm:px-5 sm:py-3.5">
          <div className="absolute inset-0 opacity-30">
            <div className="h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_35%),radial-gradient(circle_at_left,rgba(255,255,255,0.05),transparent_25%)]" />
          </div>
          <div className="relative flex flex-wrap items-center justify-between gap-2">
            <Link href="/admin" className="btn-secondary text-xs">
              <ArrowLeft className="inline h-3 w-3 mr-1" />
              {tt.back}
            </Link>
          </div>
          <div className="relative mt-3 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-400">
                {tt.machineManagement}
              </p>
              <h1 className="mt-1 text-xl font-semibold text-[var(--text-main)] sm:text-2xl">
                {tt.allMachines}
              </h1>
              <p className="mt-1 max-w-2xl text-xs text-[var(--text-soft)]">
                {tt.overviewDesc}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(16,185,129,0.13),rgba(16,185,129,0.04))] px-4 py-3 min-w-[120px]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{tt.total}</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-400">{machines.length}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
                    <Construction className="h-6 w-6 text-emerald-400" />
                  </div>
                </div>
              </div>
              <div className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(76,175,80,0.13),rgba(76,175,80,0.04))] px-4 py-3 min-w-[120px]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{tt.online}</p>
                    <p className="mt-1 text-2xl font-bold text-green-500">{onlineCount}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/15">
                    <Activity className="h-6 w-6 text-green-500" />
                  </div>
                </div>
              </div>
              <div className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(245,140,55,0.13),rgba(245,140,55,0.04))] px-4 py-3 min-w-[120px]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{tt.cranes}</p>
                    <p className="mt-1 text-2xl font-bold text-[var(--accent)]">{excavatorCount}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/15">
                    <HardHat className="h-6 w-6 text-[var(--accent)]" />
                  </div>
                </div>
              </div>
              <div className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(33,150,243,0.13),rgba(33,150,243,0.04))] px-4 py-3 min-w-[120px]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{tt.bulldozers}</p>
                    <p className="mt-1 text-2xl font-bold text-blue-500">{bulldozerCount}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15">
                    <Construction className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
              </div>
              <div className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(168,85,247,0.13),rgba(168,85,247,0.04))] px-4 py-3 min-w-[120px]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{tt.graders}</p>
                    <p className="mt-1 text-2xl font-bold text-purple-500">{graderCount}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/15">
                    <Construction className="h-6 w-6 text-purple-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map — locaties van alle machines */}
      <section className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
        <div className="flex items-center gap-2 border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-2">
          <MapPin className="h-4 w-4 text-purple-400" />
          <span className="text-xs font-semibold text-[var(--text-main)]">{tt.locations}</span>
          <span className="ml-auto flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> {tt.online}</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> {tt.offline}</span>
            <span>·</span>
            <span>{tt.gpsCount.replace('{count}', String(locatedCount)).replace('{total}', String(machines.length))}</span>
          </span>
        </div>
        <div className="p-3">
          <MachinesMap points={mapPoints} height={320} />
        </div>
      </section>

      {/* Filters */}
      <section className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
        <div className="border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-4 py-2 flex items-center gap-2">
          <Filter className="h-4 w-4 text-[var(--text-muted)]" />
          <span className="text-xs font-semibold text-[var(--text-main)]">{tt.filters}</span>
          <span className="ml-auto text-[10px] text-[var(--text-muted)]">{tt.resultsCount.replace('{count}', String(filtered.length))}</span>
          <Link
            href="/admin/machines/new"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-3 py-1.5 text-[11px] font-semibold text-[var(--accent)] shadow-[0_0_0_1px_rgba(251,146,60,0.05)] transition hover:border-[var(--accent)]/70 hover:bg-[var(--accent)]/15 hover:shadow-[0_0_14px_-4px_rgba(251,146,60,0.55)]"
          >
            <Plus className="h-3.5 w-3.5" /> {tt.newMachine}
          </Link>
        </div>
        <div className="px-4 py-3 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={tt.searchPlaceholder}
              className="w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-main)] pl-10 pr-3 py-2 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)]"
            />
          </div>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-main)] px-3 py-2 text-sm text-[var(--text-soft)]"
          >
            <option value="all">{tt.allTypes}</option>
            <option value="excavator">{tt.cranes}</option>
            <option value="bulldozer">{tt.bulldozers}</option>
            <option value="grader">{tt.graders}</option>
          </select>
          <select
            value={filterBrand}
            onChange={e => setFilterBrand(e.target.value)}
            className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-main)] px-3 py-2 text-sm text-[var(--text-soft)]"
          >
            <option value="all">{tt.allBrands}</option>
            {brands.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <select
            value={filterGuidance}
            onChange={e => setFilterGuidance(e.target.value)}
            className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-main)] px-3 py-2 text-sm text-[var(--text-soft)]"
          >
            <option value="all">{tt.allGuidance}</option>
            {guidanceSystems.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <select
            value={filterOnline}
            onChange={e => setFilterOnline(e.target.value)}
            className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-main)] px-3 py-2 text-sm text-[var(--text-soft)]"
          >
            <option value="all">{tt.onlineOffline}</option>
            <option value="online">{tt.onlineOnly}</option>
            <option value="offline">{tt.offlineOnly}</option>
          </select>
        </div>
      </section>

      {/* Machine table */}
      <section className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--border-soft)] bg-[var(--bg-card-2)]">
                <th className="px-3 py-2.5 text-left font-semibold text-[var(--text-muted)] uppercase tracking-wider text-[10px]">{tt.colMachine}</th>
                <th className="px-3 py-2.5 text-left font-semibold text-[var(--text-muted)] uppercase tracking-wider text-[10px]">{tt.colType}</th>
                <th className="px-3 py-2.5 text-left font-semibold text-[var(--text-muted)] uppercase tracking-wider text-[10px]">{tt.colTonnage}</th>
                <th className="px-3 py-2.5 text-left font-semibold text-[var(--text-muted)] uppercase tracking-wider text-[10px]">{tt.colGuidance}</th>
                <th className="px-3 py-2.5 text-left font-semibold text-[var(--text-muted)] uppercase tracking-wider text-[10px]">{tt.colCustomer}</th>
                <th className="px-3 py-2.5 text-left font-semibold text-[var(--text-muted)] uppercase tracking-wider text-[10px]">{tt.colSite}</th>
                <th className="px-3 py-2.5 text-left font-semibold text-[var(--text-muted)] uppercase tracking-wider text-[10px]">{tt.colCode}</th>
                <th className="px-3 py-2.5 text-center font-semibold text-[var(--text-muted)] uppercase tracking-wider text-[10px]">{tt.colStatus}</th>
                <th className="px-3 py-2.5 text-right font-semibold text-[var(--text-muted)] uppercase tracking-wider text-[10px]"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => {
                const brandColor = BRAND_COLORS[m.brand.toUpperCase()] || '#888'
                const guidance = m.guidance_system ? GUIDANCE_COLORS[m.guidance_system.toUpperCase()] : null
                return (
                  <tr
                    key={m.id}
                    onClick={() => router.push(`/admin/machines/${m.id}`)}
                    className="cursor-pointer border-b border-[var(--border-soft)] hover:bg-[var(--bg-card-2)] transition"
                  >
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                          style={{ backgroundColor: brandColor + '1A' }}
                        >
                          <MachineIcon type={m.machine_type} tonnage={m.tonnage ?? undefined} size={20} />
                        </div>
                        <div>
                          <span
                            className="inline-block rounded px-1 py-0.5 text-[9px] font-bold uppercase"
                            style={{ backgroundColor: brandColor + '25', color: brandColor }}
                          >
                            {m.brand}
                          </span>
                          <p className="font-medium text-[var(--text-main)]">{m.model}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-[var(--text-soft)]">
                      {m.machine_type === 'bulldozer' ? tt.typeBulldozer : m.machine_type === 'grader' ? tt.typeGrader : tt.typeCrane}
                    </td>
                    <td className="px-3 py-2.5 font-medium text-[var(--text-main)]">
                      {formatTonnage(m.tonnage)}
                    </td>
                    <td className="px-3 py-2.5">
                      {guidance && m.guidance_system ? (
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${guidance.bg} ${guidance.text}`}>
                          {m.guidance_system}
                        </span>
                      ) : (
                        <span className="text-[var(--text-muted)]">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-[var(--text-soft)] truncate max-w-[120px]">
                      {m.owner?.company_name || m.owner?.full_name || '—'}
                    </td>
                    <td className="px-3 py-2.5 text-[var(--text-soft)] truncate max-w-[150px]">
                      {m.project?.name || '—'}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[var(--text-muted)]">
                      {m.connection_code}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {m.is_online ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                          <Wifi className="h-3 w-3" /> {tt.online}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-card-2)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
                          <WifiOff className="h-3 w-3" /> {tt.offline}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleDelete(m)}
                        disabled={deletingId === m.id}
                        title={tt.deleteTitle}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1 text-[11px] font-semibold text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                      >
                        <Trash2 className="h-3 w-3" /> {deletingId === m.id ? '…' : tt.actionDelete}
                      </button>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-12 text-center text-[var(--text-muted)]">
                    {tt.noMachines}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
