'use client'

import { useState } from 'react'
import { MachineCard, type Machine } from '@/components/machines/machine-card'
import { MachineIcon, BRAND_COLORS, formatTonnage } from '@/components/machines/machine-icons'
import RemoteViewer from './remote-viewer'
import MachineFileManager from './machine-file-manager'
import { Search, Filter, Construction, Download, ChevronDown, ChevronRight, Smartphone, ExternalLink } from 'lucide-react'

type Props = {
  machines: Machine[]
  isAdmin?: boolean
}

export default function MachinetoolsClient({ machines, isAdmin }: Props) {
  const [selected, setSelected] = useState<Machine | null>(null)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterBrand, setFilterBrand] = useState<string>('all')
  const [showInstall, setShowInstall] = useState(false)

  // Unique brands for filter
  const brands = [...new Set(machines.map(m => m.brand.toUpperCase()))].sort()

  const filtered = machines.filter(m => {
    if (filterType !== 'all' && m.machine_type !== filterType) return false
    if (filterBrand !== 'all' && m.brand.toUpperCase() !== filterBrand) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        m.name.toLowerCase().includes(q) ||
        m.brand.toLowerCase().includes(q) ||
        m.model.toLowerCase().includes(q) ||
        m.connection_code.toLowerCase().includes(q) ||
        m.project?.name?.toLowerCase().includes(q)
      )
    }
    return true
  })

  // Stats
  const onlineCount = machines.filter(m => m.is_online).length
  const excavatorCount = machines.filter(m => m.machine_type === 'excavator').length
  const bulldozerCount = machines.filter(m => m.machine_type === 'bulldozer').length

  return (
    <>
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-3">
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Totaal machines</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">{machines.length}</p>
        </div>
        <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-3">
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Online</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">{onlineCount}</p>
        </div>
        <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-3">
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Kranen</p>
          <p className="mt-1 text-2xl font-bold text-[var(--text-main)]">{excavatorCount}</p>
        </div>
        <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-3">
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Bulldozers</p>
          <p className="mt-1 text-2xl font-bold text-[var(--text-main)]">{bulldozerCount}</p>
        </div>
      </div>

      {/* RustDesk installatie panel */}
      <section className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
        <button
          onClick={() => setShowInstall(!showInstall)}
          className="flex w-full items-center gap-2 px-4 py-2.5 text-left hover:bg-[var(--bg-card-2)] transition"
        >
          {showInstall ? <ChevronDown className="h-4 w-4 text-emerald-400" /> : <ChevronRight className="h-4 w-4 text-emerald-400" />}
          <Smartphone className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-semibold text-[var(--text-main)]">Machine verbinden (RustDesk)</span>
          <span className="ml-auto rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
            Eenmalig
          </span>
        </button>
        {showInstall && (
          <div className="border-t border-[var(--border-soft)] px-4 py-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-3">
                <p className="text-xs font-bold text-emerald-400">Stap 1</p>
                <p className="mt-1 text-xs text-[var(--text-soft)]">
                  Installeer <strong>RustDesk</strong> op de machine (tablet/PC):
                </p>
                <div className="mt-2 flex flex-col gap-1.5">
                  <a href="https://play.google.com/store/apps/details?id=com.carriez.flutter_hbb" target="_blank" rel="noopener noreferrer" className="text-[10px] text-emerald-400 underline">
                    → Android (Play Store)
                  </a>
                  <a href="https://rustdesk.com/download" target="_blank" rel="noopener noreferrer" className="text-[10px] text-emerald-400 underline">
                    → Windows / Mac
                  </a>
                </div>
              </div>
              <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-3">
                <p className="text-xs font-bold text-emerald-400">Stap 2</p>
                <p className="mt-1 text-xs text-[var(--text-soft)]">
                  Open RustDesk op de machine. Noteer het <strong>ID</strong> (9 cijfers) en stel een <strong>permanent wachtwoord</strong> in via Instellingen.
                </p>
              </div>
              <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-3">
                <p className="text-xs font-bold text-emerald-400">Stap 3</p>
                <p className="mt-1 text-xs text-[var(--text-soft)]">
                  Vul het ID en wachtwoord in bij de machine in <strong>Admin → Machines</strong>. Klaar!
                </p>
              </div>
            </div>
            <p className="text-[10px] text-[var(--text-muted)]">
              RustDesk moet ook op jouw PC geïnstalleerd zijn om schermen over te nemen.
              <a href="https://rustdesk.com/download" target="_blank" rel="noopener noreferrer" className="ml-1 text-emerald-400 underline">Download hier</a>
            </p>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* Machine list — 1/4 */}
        <div className="xl:col-span-1 space-y-3">
          <section className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
            <div className="border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-2">
              <div className="flex items-center gap-2">
                <Construction className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-semibold text-[var(--text-main)]">Machines</span>
                <span className="ml-auto text-[10px] text-[var(--text-muted)]">{filtered.length}</span>
              </div>
              {/* Search */}
              <div className="mt-2 relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Zoek machine..."
                  className="w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-main)] pl-8 pr-3 py-1.5 text-xs text-[var(--text-main)] placeholder:text-[var(--text-muted)]"
                />
              </div>
              {/* Filters */}
              <div className="mt-2 flex gap-1.5">
                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  className="flex-1 rounded-md border border-[var(--border-soft)] bg-[var(--bg-main)] px-2 py-1 text-[10px] text-[var(--text-soft)]"
                >
                  <option value="all">Alle types</option>
                  <option value="excavator">Kranen</option>
                  <option value="bulldozer">Bulldozers</option>
                </select>
                <select
                  value={filterBrand}
                  onChange={e => setFilterBrand(e.target.value)}
                  className="flex-1 rounded-md border border-[var(--border-soft)] bg-[var(--bg-main)] px-2 py-1 text-[10px] text-[var(--text-soft)]"
                >
                  <option value="all">Alle merken</option>
                  {brands.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>
            {/* Machine list */}
            <div className="max-h-[520px] overflow-y-auto p-2 space-y-2">
              {filtered.length === 0 ? (
                <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                  {machines.length === 0 ? 'Geen machines gekoppeld' : 'Geen machines gevonden'}
                </div>
              ) : (
                filtered.map(m => (
                  <MachineCard
                    key={m.id}
                    machine={m}
                    selected={selected?.id === m.id}
                    onSelect={setSelected}
                    compact
                  />
                ))
              )}
            </div>
          </section>
        </div>

        {/* Remote Viewer + File Manager — 3/4 */}
        <div className="xl:col-span-3 space-y-4">
          {/* Selected machine banner */}
          {selected && (
            <div
              className="flex items-center gap-3 rounded-xl border px-4 py-2"
              style={{
                borderColor: (BRAND_COLORS[selected.brand.toUpperCase()] || '#888') + '40',
                backgroundColor: (BRAND_COLORS[selected.brand.toUpperCase()] || '#888') + '0A',
              }}
            >
              <MachineIcon type={selected.machine_type} size={28} className="opacity-70" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--text-main)]">{selected.name}</p>
                <p className="text-[10px] text-[var(--text-muted)]">
                  {formatTonnage(selected.tonnage)} · {selected.guidance_system || 'Geen machinebesturing'}
                  {selected.project?.name && <> · 📍 {selected.project.name}</>}
                </p>
              </div>
              <span className={`text-xs font-medium ${selected.is_online ? 'text-emerald-400' : 'text-[var(--text-muted)]'}`}>
                {selected.is_online ? '● Online' : '○ Offline'}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* Remote Viewer — 2/3 */}
            <div className="xl:col-span-2">
              <RemoteViewer
                rustdeskId={selected?.rustdesk_id}
                rustdeskPassword={selected?.rustdesk_password}
                machineName={selected?.name}
                isOnline={selected?.is_online}
              />
            </div>

            {/* File Manager — 1/3 */}
            <div className="xl:col-span-1">
              <MachineFileManager machineId={selected?.id} machineName={selected?.name} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
