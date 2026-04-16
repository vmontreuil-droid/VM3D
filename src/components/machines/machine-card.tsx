'use client'

import { MachineIcon, BRAND_COLORS, GUIDANCE_COLORS, formatTonnage } from './machine-icons'
import { Wifi, WifiOff, Monitor } from 'lucide-react'

export type Machine = {
  id: number
  project_id: number
  name: string
  machine_type: string
  brand: string
  model: string
  tonnage: number
  year?: number
  guidance_system?: string
  serial_number?: string
  connection_code: string
  connection_password: string
  connection_host?: string
  connection_port?: string
  is_online: boolean
  last_seen_at?: string
  rustdesk_id?: string | null
  rustdesk_password?: string | null
  project?: { name: string }
}

export function MachineCard({
  machine,
  selected,
  onSelect,
  compact,
}: {
  machine: Machine
  selected?: boolean
  onSelect?: (m: Machine) => void
  compact?: boolean
}) {
  const brandColor = BRAND_COLORS[machine.brand.toUpperCase()] || '#888'
  const guidance = machine.guidance_system ? GUIDANCE_COLORS[machine.guidance_system.toUpperCase()] : null

  return (
    <button
      type="button"
      onClick={() => onSelect?.(machine)}
      className={`group relative flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all ${
        selected
          ? 'border-emerald-500/50 bg-emerald-500/10 shadow-lg shadow-emerald-500/5'
          : 'border-[var(--border-soft)] bg-[var(--bg-card)] hover:border-[var(--accent)]/30 hover:bg-[var(--bg-card-2)]'
      }`}
    >
      {/* Machine icon with brand color */}
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: brandColor + '1A' }}
      >
        <MachineIcon
          type={machine.machine_type}
          size={compact ? 28 : 32}
          className="drop-shadow-sm"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {/* Brand pill */}
          <span
            className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            style={{ backgroundColor: brandColor + '25', color: brandColor }}
          >
            {machine.brand}
          </span>
          {/* Online indicator */}
          <span className={`flex items-center gap-1 text-[10px] ${machine.is_online ? 'text-emerald-400' : 'text-[var(--text-muted)]'}`}>
            {machine.is_online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {machine.is_online ? 'Online' : 'Offline'}
          </span>
        </div>

        <p className="mt-0.5 text-sm font-semibold text-[var(--text-main)] truncate">
          {machine.name}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {/* Tonnage */}
          <span className="rounded-md bg-[var(--bg-card-2)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-soft)]">
            {formatTonnage(machine.tonnage)}
          </span>
          {/* Type */}
          <span className="rounded-md bg-[var(--bg-card-2)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-soft)]">
            {machine.machine_type === 'bulldozer' ? 'Bulldozer' : 'Kraan'}
          </span>
          {/* Year */}
          {machine.year && (
            <span className="rounded-md bg-[var(--bg-card-2)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
              {machine.year}
            </span>
          )}
          {/* Guidance system */}
          {guidance && machine.guidance_system && (
            <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${guidance.bg} ${guidance.text}`}>
              {machine.guidance_system}
            </span>
          )}
        </div>

        {!compact && (
          <div className="mt-1.5 flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
            {machine.project?.name && (
              <span className="truncate">📍 {machine.project.name}</span>
            )}
          </div>
        )}
      </div>

      {/* Connect button hint on hover */}
      {machine.is_online && (
        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition">
          <span className="flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2 py-1 text-[10px] font-medium text-emerald-400">
            <Monitor className="h-3 w-3" />
            Verbinden
          </span>
        </div>
      )}
    </button>
  )
}
