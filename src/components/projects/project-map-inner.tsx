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

type Project = {
  id: number
  title: string
  address?: string | null
  status?: string | null
  latitude?: number | null
  longitude?: number | null
  klantEmail?: string | null
}

function getMarkerColor(status?: string | null) {
  switch (status) {
    case 'in_behandeling':
      return '#3b82f6'
    case 'klaar_voor_betaling':
      return '#f59e0b'
    case 'afgerond':
      return '#22c55e'
    case 'ingediend':
    default:
      return '#94a3b8'
  }
}

function getStatusLabel(status?: string | null) {
  switch (status) {
    case 'ingediend':
      return 'Ingediend'
    case 'in_behandeling':
      return 'In behandeling'
    case 'klaar_voor_betaling':
      return 'Klaar voor betaling'
    case 'afgerond':
      return 'Afgerond'
    default:
      return 'Onbekend'
  }
}

function getStatusClass(status?: string | null) {
  switch (status) {
    case 'in_behandeling':
      return 'project-popup-status project-popup-status--blue'
    case 'klaar_voor_betaling':
      return 'project-popup-status project-popup-status--amber'
    case 'afgerond':
      return 'project-popup-status project-popup-status--green'
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

    const timer = setTimeout(() => {
      map.invalidateSize()

      if (projects.length === 1) {
        map.setView(
          [Number(projects[0].latitude), Number(projects[0].longitude)],
          14,
          { animate: true }
        )
        return
      }

      const bounds = L.latLngBounds(
        projects.map((project) => [
          Number(project.latitude),
          Number(project.longitude),
        ])
      )

      map.fitBounds(bounds, {
        padding: [40, 40],
        animate: true,
      })
    }, 120)

    return () => clearTimeout(timer)
  }, [map, projects])

  return null
}

function ProjectMarker({ project }: { project: Project }) {
  const markerRef = useRef<LeafletMarker | null>(null)

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
          <p className="project-popup-title">{project.title}</p>

          <p className="project-popup-address">
            {project.address || 'Geen adres'}
          </p>

          <p className="project-popup-client">
            Klant: {project.klantEmail || 'Onbekend'}
          </p>

          <div className="project-popup-status-wrap">
            <span className={getStatusClass(project.status)}>
              {getStatusLabel(project.status)}
            </span>
          </div>

          <div className="project-popup-actions">
            <Link
              href={`/admin/projects/${project.id}`}
              className="project-popup-button"
            >
              Open project
            </Link>
          </div>
        </div>
      </Popup>
    </Marker>
  )
}

export default function ProjectMapInner({ projects }: { projects: Project[] }) {
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
    <div className="project-map-wrapper">
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