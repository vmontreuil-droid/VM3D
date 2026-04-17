'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef } from 'react'
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet'
import L, { Marker as LeafletMarker } from 'leaflet'
import { useT } from '@/i18n/context'

type Project = {
  id: number
  name: string
  address?: string | null
  status?: string | null
  latitude?: number | null
  longitude?: number | null
  klantEmail?: string | null
}

function getMarkerColor(status?: string | null) {
  switch (status) {
    case 'offerte_aangevraagd':
      return '#94a3b8'
    case 'offerte_verstuurd':
      return '#f59e0b'
    case 'in_behandeling':
      return '#3b82f6'
    case 'facturatie':
      return '#a855f7'
    case 'factuur_verstuurd':
      return '#f97316'
    case 'afgerond':
      return '#22c55e'
    case 'ingediend':
    case 'klaar_voor_betaling':
    default:
      return '#94a3b8'
  }
}

function getStatusLabel(status: string | null | undefined, t: ReturnType<typeof useT>['t']) {
  switch (status) {
    case 'offerte_aangevraagd':
      return t.status.offerte_aangevraagd
    case 'offerte_verstuurd':
      return t.status.offerte_verstuurd
    case 'in_behandeling':
      return t.status.in_behandeling
    case 'facturatie':
      return t.status.facturatie
    case 'factuur_verstuurd':
      return t.status.factuur_verstuurd
    case 'afgerond':
      return t.status.afgerond
    case 'ingediend':
      return t.status.ingediend
    case 'klaar_voor_betaling':
      return t.status.klaar_voor_betaling
    default:
      return t.mapPopup.unknown
  }
}

function getStatusClass(status?: string | null) {
  switch (status) {
    case 'offerte_verstuurd':
      return 'project-popup-status project-popup-status--amber'
    case 'in_behandeling':
      return 'project-popup-status project-popup-status--blue'
    case 'facturatie':
      return 'project-popup-status project-popup-status--amber'
    case 'factuur_verstuurd':
      return 'project-popup-status project-popup-status--amber'
    case 'afgerond':
      return 'project-popup-status project-popup-status--green'
    case 'offerte_aangevraagd':
    case 'ingediend':
    default:
      return 'project-popup-status project-popup-status--default'
  }
}

function createMarkerIcon(status?: string | null) {
  const color = getMarkerColor(status)

  return L.divIcon({
    className: 'custom-project-marker',
    html: `
      <div class="custom-project-marker-dot" style="
        width: 18px;
        height: 18px;
        border-radius: 9999px;
        background: ${color};
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      "></div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [20, -200],
  })
}

function FitBounds({ projects }: { projects: Project[] }) {
  const map = useMap()

  useEffect(() => {
    if (!projects.length) return

    const timer = window.setTimeout(() => {
      map.invalidateSize()

      const points = projects.map((project) => [
        Number(project.latitude),
        Number(project.longitude),
      ] as [number, number])

      if (points.length === 1) {
        const [[lat, lng]] = points

        map.fitBounds(
          [
            [lat - 0.01, lng - 0.01],
            [lat + 0.01, lng + 0.01],
          ],
          {
            padding: [24, 24],
            maxZoom: 14,
            animate: true,
          }
        )
        return
      }

      const bounds = L.latLngBounds(points).pad(0.08)

      map.fitBounds(bounds, {
        padding: [24, 24],
        maxZoom: 10,
        animate: true,
      })
    }, 120)

    return () => window.clearTimeout(timer)
  }, [map, projects])

  return null
}

function ProjectMarker({ project }: { project: Project }) {
  const markerRef = useRef<LeafletMarker | null>(null)
  const { t } = useT()

  const markerIcon = useMemo(() => createMarkerIcon(project.status), [project.status])

  return (
    <Marker
      position={[Number(project.latitude), Number(project.longitude)]}
      icon={markerIcon}
      ref={markerRef}
      eventHandlers={{
        click: () => {
          markerRef.current?.openPopup()
        },
        popupopen: () => {
          const markerEl = markerRef.current?.getElement()
          markerEl?.classList.add('custom-project-marker--active')
        },
        popupclose: () => {
          const markerEl = markerRef.current?.getElement()
          markerEl?.classList.remove('custom-project-marker--active')
        },
      }}
    >
      <Popup autoPan className="project-popup">
        <div className="project-popup-inner">
          <p className="project-popup-title">{project.name}</p>

          <p className="project-popup-address">
            {project.address || t.mapPopup.noAddress}
          </p>

          <p className="project-popup-client">
            {t.mapPopup.customerLabel}: {project.klantEmail || t.mapPopup.unknown}
          </p>

          <div className="project-popup-status-wrap">
            <span className={getStatusClass(project.status)}>
              {getStatusLabel(project.status, t)}
            </span>
          </div>

          <div className="project-popup-actions">
            <Link
              href={`/admin/projects/${project.id}`}
              className="project-popup-button"
            >
              {t.mapPopup.openSite}
            </Link>
          </div>
        </div>
      </Popup>
    </Marker>
  )
}

export default function ProjectMapInner({
  projects,
  height = '420px',
}: {
  projects: Project[]
  height?: number | string
}) {
  const resolvedHeight = typeof height === 'number' ? `${height}px` : height

  const validProjects = projects.filter(
    (p) =>
      p.latitude !== null &&
      p.latitude !== undefined &&
      p.longitude !== null &&
      p.longitude !== undefined
  )

  const center: [number, number] =
    validProjects.length > 0
      ? [Number(validProjects[0].latitude), Number(validProjects[0].longitude)]
      : [50.8503, 4.3517]

  return (
    <div className="project-map-wrapper" style={{ height: resolvedHeight }}>
      <MapContainer
        center={center}
        zoom={8}
        scrollWheelZoom={true}
        className="project-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBounds projects={validProjects} />

        {validProjects.map((project) => (
          <ProjectMarker key={project.id} project={project} />
        ))}
      </MapContainer>
    </div>
  )
}