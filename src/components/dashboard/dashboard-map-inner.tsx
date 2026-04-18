'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { FolderOpen, Users, Construction } from 'lucide-react'
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet'
import L, { Marker as LeafletMarker } from 'leaflet'
import type { MapProject, MapCustomer, MapMachine } from './dashboard-map'
import { useT } from '@/i18n/context'

/* ── status helpers (projects) ── */

function getMarkerColor(status?: string | null) {
  switch (status) {
    case 'offerte_verstuurd':   return '#f59e0b'
    case 'in_behandeling':      return '#3b82f6'
    case 'facturatie':          return '#a855f7'
    case 'factuur_verstuurd':   return '#f59e0b'
    case 'afgerond':            return '#22c55e'
    default:                    return '#94a3b8'
  }
}

function getStatusLabel(status: string | null | undefined, t: ReturnType<typeof useT>['t']) {
  switch (status) {
    case 'offerte_aangevraagd': return t.status.offerte_aangevraagd
    case 'offerte_verstuurd':   return t.status.offerte_verstuurd
    case 'in_behandeling':      return t.status.in_behandeling
    case 'facturatie':          return t.status.facturatie
    case 'factuur_verstuurd':   return t.status.factuur_verstuurd
    case 'afgerond':            return t.status.afgerond
    case 'ingediend':           return t.status.ingediend
    case 'klaar_voor_betaling': return t.status.klaar_voor_betaling
    default:                    return t.mapPopup.unknown
  }
}

function getStatusClass(status?: string | null) {
  switch (status) {
    case 'offerte_verstuurd':   return 'project-popup-status project-popup-status--amber'
    case 'in_behandeling':      return 'project-popup-status project-popup-status--blue'
    case 'facturatie':          return 'project-popup-status project-popup-status--amber'
    case 'factuur_verstuurd':   return 'project-popup-status project-popup-status--amber'
    case 'afgerond':            return 'project-popup-status project-popup-status--green'
    default:                    return 'project-popup-status project-popup-status--default'
  }
}

/* ── icon factories ── */

function createProjectIcon(status?: string | null) {
  const color = getMarkerColor(status)
  return L.divIcon({
    className: 'custom-project-marker',
    html: `<div style="width:18px;height:18px;border-radius:9999px;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25)"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [20, -200],
  })
}

function createCustomerIcon() {
  return L.divIcon({
    className: 'custom-project-marker',
    html: `<div style="width:18px;height:18px;border-radius:9999px;background:#a855f7;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25)"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [20, -200],
  })
}

function createMachineIcon(online: boolean) {
  const color = online ? '#22c55e' : '#f97316'
  return L.divIcon({
    className: 'custom-project-marker',
    html: `<div style="width:18px;height:18px;border-radius:9999px;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25)"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [20, -200],
  })
}

/* ── fit bounds ── */

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap()

  useEffect(() => {
    if (!points.length) return

    const timer = window.setTimeout(() => {
      map.invalidateSize()

      if (points.length === 1) {
        const [[lat, lng]] = points
        map.fitBounds(
          [[lat - 0.01, lng - 0.01], [lat + 0.01, lng + 0.01]],
          { padding: [24, 24], maxZoom: 14, animate: true },
        )
        return
      }

      const bounds = L.latLngBounds(points).pad(0.08)
      map.fitBounds(bounds, { padding: [24, 24], maxZoom: 10, animate: true })
    }, 120)

    return () => window.clearTimeout(timer)
  }, [map, points])

  return null
}

/* ── individual markers ── */

function ProjectMarker({ project, t }: { project: MapProject; t: ReturnType<typeof useT>['t'] }) {
  const ref = useRef<LeafletMarker | null>(null)
  const icon = useMemo(() => createProjectIcon(project.status), [project.status])

  return (
    <Marker
      position={[Number(project.latitude), Number(project.longitude)]}
      icon={icon}
      ref={ref}
      eventHandlers={{
        click: () => ref.current?.openPopup(),
        popupopen: () => ref.current?.getElement()?.classList.add('custom-project-marker--active'),
        popupclose: () => ref.current?.getElement()?.classList.remove('custom-project-marker--active'),
      }}
    >
      <Popup autoPan className="project-popup">
        <div className="project-popup-inner">
          <p className="project-popup-title">{project.name}</p>
          <p className="project-popup-address">{project.address || t.mapPopup.noAddress}</p>
          <p className="project-popup-client">{t.mapPopup.customerLabel}: {project.klantEmail || t.mapPopup.unknown}</p>
          <div className="project-popup-status-wrap">
            <span className={getStatusClass(project.status)}>{getStatusLabel(project.status, t)}</span>
          </div>
          <div className="project-popup-actions">
            <Link href={`/admin/projects/${project.id}`} className="project-popup-button">{t.mapPopup.openSite}</Link>
          </div>
        </div>
      </Popup>
    </Marker>
  )
}

function CustomerMarker({ customer, t }: { customer: MapCustomer; t: ReturnType<typeof useT>['t'] }) {
  const ref = useRef<LeafletMarker | null>(null)
  const icon = useMemo(() => createCustomerIcon(), [])

  const label = customer.company_name || customer.full_name || customer.email || t.mapPopup.customer

  return (
    <Marker
      position={[Number(customer.latitude), Number(customer.longitude)]}
      icon={icon}
      ref={ref}
      eventHandlers={{
        click: () => ref.current?.openPopup(),
        popupopen: () => ref.current?.getElement()?.classList.add('custom-project-marker--active'),
        popupclose: () => ref.current?.getElement()?.classList.remove('custom-project-marker--active'),
      }}
    >
      <Popup autoPan className="project-popup">
        <div className="project-popup-inner">
          <p className="project-popup-title">{label}</p>
          {customer.city && <p className="project-popup-address">{customer.city}</p>}
          {customer.email && <p className="project-popup-client">{customer.email}</p>}
          {typeof customer.project_count === 'number' && (
            <p className="project-popup-client">{(customer.project_count === 1 ? t.mapPopup.siteCount : t.mapPopup.sitesCount).replace('{count}', String(customer.project_count))}</p>
          )}
          <div className="project-popup-actions">
            <Link href={`/admin/customers/${customer.id}/edit`} className="project-popup-button">{t.mapPopup.openCustomer}</Link>
          </div>
        </div>
      </Popup>
    </Marker>
  )
}

/* ── main component ── */

type Layer = 'werven' | 'klanten' | 'machines'

function MachineMarker({ machine, t }: { machine: MapMachine; t: ReturnType<typeof useT>['t'] }) {
  const ref = useRef<LeafletMarker | null>(null)
  const icon = useMemo(() => createMachineIcon(!!machine.is_online), [machine.is_online])
  return (
    <Marker
      position={[Number(machine.latitude), Number(machine.longitude)]}
      icon={icon}
      ref={ref}
      eventHandlers={{
        click: () => ref.current?.openPopup(),
        popupopen: () => ref.current?.getElement()?.classList.add('custom-project-marker--active'),
        popupclose: () => ref.current?.getElement()?.classList.remove('custom-project-marker--active'),
      }}
    >
      <Popup autoPan className="project-popup">
        <div className="project-popup-inner">
          <p className="project-popup-title">{machine.brand} {machine.model}</p>
          <p className="project-popup-address">{machine.name}</p>
          <div className="project-popup-actions">
            <Link href={`/admin/machines/${machine.id}`} className="project-popup-button">{t.adminMachineDetail.edit}</Link>
          </div>
        </div>
      </Popup>
    </Marker>
  )
}

export default function DashboardMapInner({
  projects,
  customers,
  machines = [],
  height = '100%',
}: {
  projects: MapProject[]
  customers: MapCustomer[]
  machines?: MapMachine[]
  height?: string
}) {
  const [layer, setLayer] = useState<Layer>('werven')
  const { t } = useT()

  const validProjects = useMemo(
    () => projects.filter((p) => p.latitude != null && p.longitude != null),
    [projects],
  )
  const validCustomers = useMemo(
    () => customers.filter((c) => c.latitude != null && c.longitude != null),
    [customers],
  )
  const validMachines = useMemo(
    () => machines.filter((m) => m.latitude != null && m.longitude != null),
    [machines],
  )

  const points: [number, number][] = useMemo(() => {
    const src = layer === 'werven' ? validProjects : layer === 'klanten' ? validCustomers : validMachines
    return src.map((item) => [Number(item.latitude), Number(item.longitude)])
  }, [layer, validProjects, validCustomers, validMachines])

  const center: [number, number] = points.length > 0 ? points[0] : [50.8503, 4.3517]

  const wCount = validProjects.length
  const cCount = validCustomers.length
  const mCount = validMachines.length

  return (
    <div className="relative flex h-full flex-col" style={{ height }}>
      {/* Toggle tabs — floating top-right overlay */}
      <div className="pointer-events-none absolute right-3 top-3 z-[500] flex flex-wrap items-center justify-end gap-1.5">
        <button
          type="button"
          onClick={() => setLayer('werven')}
          className={`pointer-events-auto inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur transition ${
            layer === 'werven'
              ? 'border-[var(--accent)]/40 bg-[var(--accent)]/15 text-[var(--accent)]'
              : 'border-[var(--border-soft)] bg-[var(--bg-card)]/85 text-[var(--text-soft)] hover:text-[var(--text-main)]'
          }`}
        >
          <FolderOpen className="h-3.5 w-3.5" />
          {t.mapPopup.sitesLayer}
          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
            layer === 'werven' ? 'bg-[var(--accent)]/25 text-[var(--accent)]' : 'bg-white/5 text-[var(--text-muted)]'
          }`}>
            {wCount}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setLayer('klanten')}
          className={`pointer-events-auto inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur transition ${
            layer === 'klanten'
              ? 'border-purple-400/40 bg-purple-500/15 text-purple-400'
              : 'border-[var(--border-soft)] bg-[var(--bg-card)]/85 text-[var(--text-soft)] hover:text-[var(--text-main)]'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          {t.mapPopup.customersLayer}
          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
            layer === 'klanten' ? 'bg-purple-500/25 text-purple-400' : 'bg-white/5 text-[var(--text-muted)]'
          }`}>
            {cCount}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setLayer('machines')}
          className={`pointer-events-auto inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur transition ${
            layer === 'machines'
              ? 'border-orange-400/40 bg-orange-500/15 text-orange-400'
              : 'border-[var(--border-soft)] bg-[var(--bg-card)]/85 text-[var(--text-soft)] hover:text-[var(--text-main)]'
          }`}
        >
          <Construction className="h-3.5 w-3.5" />
          {t.mapPopup.machinesLayer}
          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
            layer === 'machines' ? 'bg-orange-500/25 text-orange-400' : 'bg-white/5 text-[var(--text-muted)]'
          }`}>
            {mCount}
          </span>
        </button>
      </div>

      {/* Map */}
      <div className="project-map-wrapper flex-1" style={{ minHeight: 0 }}>
        <MapContainer center={center} zoom={8} scrollWheelZoom className="project-map">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds points={points} />
          {layer === 'werven' && validProjects.map((p) => (
            <ProjectMarker key={p.id} project={p} t={t} />
          ))}
          {layer === 'klanten' && validCustomers.map((c) => (
            <CustomerMarker key={c.id} customer={c} t={t} />
          ))}
          {layer === 'machines' && validMachines.map((m) => (
            <MachineMarker key={m.id} machine={m} t={t} />
          ))}
        </MapContainer>
      </div>
    </div>
  )
}
