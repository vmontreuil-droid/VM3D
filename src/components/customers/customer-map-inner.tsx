'use client'

import { useEffect, useMemo, useState } from 'react'

type Props = {
  latitude: number
  longitude: number
  label?: string
  height?: number | string
}

export default function CustomerMapInner({
  latitude,
  longitude,
  label,
  height = 260,
}: Props) {
  const [mounted, setMounted] = useState(false)
  const [LeafletComponents, setLeafletComponents] = useState<any>(null)
  const [markerIcon, setMarkerIcon] = useState<any>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    async function loadLeaflet() {
      const leaflet = await import('leaflet')
      const reactLeaflet = await import('react-leaflet')

      const icon = leaflet.default.divIcon({
        className: 'custom-project-marker',
        html: `
          <div class="custom-project-marker-dot" style="
            width: 16px;
            height: 16px;
            border-radius: 9999px;
            background: #f28c3a;
            border: 2px solid white;
            box-shadow: 0 0 0 4px rgba(242,140,58,0.18);
          "></div>
        `,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      })

      setMarkerIcon(icon)
      setLeafletComponents(reactLeaflet)
    }

    loadLeaflet()
  }, [])

  const position = useMemo(() => [latitude, longitude] as [number, number], [
    latitude,
    longitude,
  ])
  const resolvedHeight = typeof height === 'number' ? `${height}px` : height

  if (!mounted || !LeafletComponents || !markerIcon) {
    return (
      <div
        className="flex items-center justify-center text-sm text-[var(--text-soft)]"
        style={{ height: resolvedHeight }}
      >
        Kaart laden...
      </div>
    )
  }

  const { MapContainer, TileLayer, Marker, Popup, useMap } = LeafletComponents

  function RecenterMap({
    latitude,
    longitude,
  }: {
    latitude: number
    longitude: number
  }) {
    const map = useMap()

    useEffect(() => {
      const timer = window.setTimeout(() => {
        map.invalidateSize()
        map.fitBounds(
          [
            [latitude - 0.008, longitude - 0.008],
            [latitude + 0.008, longitude + 0.008],
          ],
          {
            padding: [24, 24],
            maxZoom: 15,
            animate: true,
          }
        )
      }, 120)

      return () => window.clearTimeout(timer)
    }, [latitude, longitude, map])

    return null
  }

  return (
    <div
      className="project-map w-full overflow-hidden rounded-[inherit]"
      style={{ height: resolvedHeight }}
    >
      <MapContainer
        center={position}
        zoom={15}
        scrollWheelZoom={true}
        className="h-full w-full rounded-[inherit]"
      >
        <RecenterMap latitude={latitude} longitude={longitude} />
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} icon={markerIcon}>
          <Popup>{label || 'Klantlocatie'}</Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}