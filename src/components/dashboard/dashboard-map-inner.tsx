'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet'
import L, { Marker as LeafletMarker } from 'leaflet'
import type { MapProject, MapCustomer } from './dashboard-map'

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

function getStatusLabel(status?: string | null) {
  switch (status) {
    case 'offerte_aangevraagd': return 'Offerte aangevraagd'
    case 'offerte_verstuurd':   return 'Offerte verstuurd'
    case 'in_behandeling':      return 'In behandeling'
    case 'facturatie':          return 'Facturatie'
    case 'factuur_verstuurd':   return 'Factuur verstuurd'
    case 'afgerond':            return 'Afgerond'
    case 'ingediend':           return 'Ingediend'
    case 'klaar_voor_betaling': return 'Klaar voor betaling'
    default:                    return 'Onbekend'
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

function ProjectMarker({ project }: { project: MapProject }) {
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
          <p className="project-popup-address">{project.address || 'Geen adres'}</p>
          <p className="project-popup-client">Klant: {project.klantEmail || 'Onbekend'}</p>
          <div className="project-popup-status-wrap">
            <span className={getStatusClass(project.status)}>{getStatusLabel(project.status)}</span>
          </div>
          <div className="project-popup-actions">
            <Link href={`/admin/projects/${project.id}`} className="project-popup-button">Open werf</Link>
          </div>
        </div>
      </Popup>
    </Marker>
  )
}

function CustomerMarker({ customer }: { customer: MapCustomer }) {
  const ref = useRef<LeafletMarker | null>(null)
  const icon = useMemo(() => createCustomerIcon(), [])

  const label = customer.company_name || customer.full_name || customer.email || 'Klant'

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
            <p className="project-popup-client">{customer.project_count} werf{customer.project_count !== 1 ? 'en' : ''}</p>
          )}
          <div className="project-popup-actions">
            <Link href={`/admin/customers/${customer.id}/edit`} className="project-popup-button">Open klant</Link>
          </div>
        </div>
      </Popup>
    </Marker>
  )
}

/* ── main component ── */

type Layer = 'werven' | 'klanten'

export default function DashboardMapInner({
  projects,
  customers,
  height = '100%',
}: {
  projects: MapProject[]
  customers: MapCustomer[]
  height?: string
}) {
  const [layer, setLayer] = useState<Layer>('werven')

  const validProjects = useMemo(
    () => projects.filter((p) => p.latitude != null && p.longitude != null),
    [projects],
  )
  const validCustomers = useMemo(
    () => customers.filter((c) => c.latitude != null && c.longitude != null),
    [customers],
  )

  const points: [number, number][] = useMemo(() => {
    const src = layer === 'werven' ? validProjects : validCustomers
    return src.map((item) => [Number(item.latitude), Number(item.longitude)])
  }, [layer, validProjects, validCustomers])

  const center: [number, number] = points.length > 0 ? points[0] : [50.8503, 4.3517]

  const wCount = validProjects.length
  const cCount = validCustomers.length

  return (
    <div className="flex h-full flex-col" style={{ height }}>
      {/* Toggle tabs */}
      <div className="flex items-center gap-1 border-b border-[var(--border-soft)] px-4 py-2">
        <button
          type="button"
          onClick={() => setLayer('werven')}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            layer === 'werven'
              ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
              : 'text-[var(--text-soft)] hover:text-[var(--text-main)]'
          }`}
        >
          Werven
          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
            layer === 'werven' ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'bg-white/5 text-[var(--text-muted)]'
          }`}>
            {wCount}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setLayer('klanten')}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            layer === 'klanten'
              ? 'bg-purple-500/15 text-purple-400'
              : 'text-[var(--text-soft)] hover:text-[var(--text-main)]'
          }`}
        >
          Klanten
          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
            layer === 'klanten' ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-[var(--text-muted)]'
          }`}>
            {cCount}
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
            <ProjectMarker key={p.id} project={p} />
          ))}
          {layer === 'klanten' && validCustomers.map((c) => (
            <CustomerMarker key={c.id} customer={c} />
          ))}
        </MapContainer>
      </div>
    </div>
  )
}
