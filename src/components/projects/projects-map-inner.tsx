'use client'

import { useEffect, useMemo, useState } from 'react'
import { useT } from '@/i18n/context'

type Location = {
  name: string
  latitude: number
  longitude: number
}

type Props = {
  locations: Location[]
  title?: string
  height?: number | string
}

export default function ProjectsMapInner({
  locations,
  title,
  height = 400,
}: Props) {
  const { t } = useT()
  const [mounted, setMounted] = useState(false)
  const [MapContainer, setMapContainer] = useState<any>(null)
  const [TileLayer, setTileLayer] = useState<any>(null)
  const [Marker, setMarker] = useState<any>(null)
  const [Popup, setPopup] = useState<any>(null)
  const [useMap, setUseMap] = useState<any>(null)
  const [markerIcon, setMarkerIcon] = useState<any>(null)

  const safeLocations = useMemo(
    () =>
      locations.filter(
        (location) =>
          location.latitude != null &&
          location.longitude != null &&
          !Number.isNaN(location.latitude) &&
          !Number.isNaN(location.longitude)
      ),
    [locations]
  )

  const resolvedHeight = typeof height === 'number' ? `${height}px` : height

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    async function loadLeaflet() {
      try {
        const L = require('leaflet')
        const {
          MapContainer: MC,
          TileLayer: TL,
          Marker: M,
          Popup: P,
          useMap: UM,
        } = await import('react-leaflet')

        const icon = new L.Icon({
          iconUrl:
            'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iNiIgZmlsbD0iI0Y3OTQxRCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
          popupAnchor: [0, -12],
        })

        setMarkerIcon(icon)
        setMapContainer(() => MC)
        setTileLayer(() => TL)
        setMarker(() => M)
        setPopup(() => P)
        setUseMap(() => UM)
      } catch (error) {
        console.error('Error loading Leaflet:', error)
      }
    }

    loadLeaflet()
  }, [mounted])

  if (!mounted || !MapContainer || !TileLayer || !Marker || !Popup || !useMap || !markerIcon) {
    return (
      <div
        className="flex items-center justify-center text-sm text-[var(--text-soft)]"
        style={{ height: resolvedHeight }}
      >
        {t.mapPopup.loadingMap}
      </div>
    )
  }

  if (!safeLocations.length) {
    return (
      <div
        className="flex items-center justify-center text-sm text-[var(--text-soft)]"
        style={{ height: resolvedHeight }}
      >
        {t.mapPopup.noLocations}
      </div>
    )
  }

  const bounds = {
    minLat: Math.min(...safeLocations.map((l) => l.latitude)),
    maxLat: Math.max(...safeLocations.map((l) => l.latitude)),
    minLng: Math.min(...safeLocations.map((l) => l.longitude)),
    maxLng: Math.max(...safeLocations.map((l) => l.longitude)),
  }

  const centerLat = (bounds.minLat + bounds.maxLat) / 2
  const centerLng = (bounds.minLng + bounds.maxLng) / 2

  function FitBounds() {
    const map = useMap()

    useEffect(() => {
      if (!safeLocations.length) return

      const timer = window.setTimeout(() => {
        map.invalidateSize()

        if (safeLocations.length === 1) {
          const [location] = safeLocations

          map.fitBounds(
            [
              [location.latitude - 0.01, location.longitude - 0.01],
              [location.latitude + 0.01, location.longitude + 0.01],
            ],
            {
              padding: [24, 24],
              maxZoom: 14,
              animate: true,
            }
          )
          return
        }

        map.fitBounds(
          safeLocations.map((location) => [
            location.latitude,
            location.longitude,
          ] as [number, number]),
          {
            padding: [24, 24],
            maxZoom: 10,
            animate: true,
          }
        )
      }, 120)

      return () => window.clearTimeout(timer)
    }, [map, safeLocations])

    return null
  }

  return (
    <MapContainer
      center={[centerLat, centerLng]}
      zoom={9}
      style={{ width: '100%', height: resolvedHeight }}
      className="z-0"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {safeLocations.map((location, idx) => (
        <Marker key={idx} position={[location.latitude, location.longitude]} icon={markerIcon}>
          <Popup>
            <div className="text-sm font-medium">{location.name}</div>
            {title ? <div className="mt-1 text-xs text-slate-500">{title}</div> : null}
          </Popup>
        </Marker>
      ))}
      <FitBounds />
    </MapContainer>
  )
}
