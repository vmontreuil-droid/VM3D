'use client'

import { useEffect, useState } from 'react'

type Location = {
  name: string
  latitude: number
  longitude: number
}

type Props = {
  locations: Location[]
  title?: string
}

export default function CustomersMapInner({ locations, title }: Props) {
  const [mounted, setMounted] = useState(false)
  const [MapContainer, setMapContainer] = useState<any>(null)
  const [TileLayer, setTileLayer] = useState<any>(null)
  const [Marker, setMarker] = useState<any>(null)
  const [Popup, setPopup] = useState<any>(null)
  const [useMap, setUseMap] = useState<any>(null)
  const [markerIcon, setMarkerIcon] = useState<any>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    async function loadLeaflet() {
      try {
        // Import Leaflet and React-Leaflet
        const L = require('leaflet')
        const { MapContainer: MC, TileLayer: TL, Marker: M, Popup: P, useMap: UM } = await import('react-leaflet')

        // Create a proper Leaflet icon
        const icon = new L.Icon({
          iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iNiIgZmlsbD0iIzRDQUY1MCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+',
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
      <div className="flex h-[400px] items-center justify-center text-sm text-[var(--text-soft)]">
        Kaart laden...
      </div>
    )
  }

  if (!locations || locations.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center text-sm text-[var(--text-soft)]">
        Geen locaties beschikbaar
      </div>
    )
  }

  // Calculate bounds for all markers
  const bounds = {
    minLat: Math.min(...locations.map((l) => l.latitude)),
    maxLat: Math.max(...locations.map((l) => l.latitude)),
    minLng: Math.min(...locations.map((l) => l.longitude)),
    maxLng: Math.max(...locations.map((l) => l.longitude)),
  }

  const centerLat = (bounds.minLat + bounds.maxLat) / 2
  const centerLng = (bounds.minLng + bounds.maxLng) / 2

  function FitBounds() {
    const map = useMap()

    useEffect(() => {
      if (!locations.length) return

      const timer = window.setTimeout(() => {
        map.invalidateSize()

        if (locations.length === 1) {
          const [location] = locations

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
          locations.map((location) => [
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
    }, [map, locations])

    return null
  }

  return (
    <MapContainer
      center={[centerLat, centerLng]}
      zoom={9}
      style={{ height: '400px', width: '100%' }}
      className="z-0"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {locations.map((location, idx) => (
        <Marker
          key={idx}
          position={[location.latitude, location.longitude]}
          icon={markerIcon}
        >
          <Popup>
            <div className="text-sm font-medium">
              {location.name}
            </div>
          </Popup>
        </Marker>
      ))}
      <FitBounds />
    </MapContainer>
  )
}
