'use client'

import { useEffect, useMemo, useState } from 'react'

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

export default function CustomersMapInner({
  locations,
  title,
  height = 400,
}: Props) {
  const [mounted, setMounted] = useState(false)
  const [LeafletComponents, setLeafletComponents] = useState<any>(null)
  const [markerIcon, setMarkerIcon] = useState<any>(null)

  const resolvedHeight = typeof height === 'number' ? `${height}px` : height

  const safeLocations = useMemo(
    () =>
      locations.filter(
        (location) =>
          location.latitude != null &&
          location.longitude != null &&
          !Number.isNaN(Number(location.latitude)) &&
          !Number.isNaN(Number(location.longitude))
      ),
    [locations]
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    async function loadLeaflet() {
      try {
        const leaflet = await import('leaflet')
        const reactLeaflet = await import('react-leaflet')

        const icon = leaflet.default.divIcon({
          className: 'custom-project-marker',
          html: `
            <div class="custom-project-marker-dot" style="
              width: 18px;
              height: 18px;
              border-radius: 9999px;
              background: #f7941d;
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.25);
            "></div>
          `,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
          popupAnchor: [0, -12],
        })

        setMarkerIcon(icon)
        setLeafletComponents(reactLeaflet)
      } catch (error) {
        console.error('Error loading customer map:', error)
      }
    }

    loadLeaflet()
  }, [mounted])

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

  if (!safeLocations.length) {
    return (
      <div
        className="flex items-center justify-center text-sm text-[var(--text-soft)]"
        style={{ height: resolvedHeight }}
      >
        Geen locaties beschikbaar
      </div>
    )
  }

  const { MapContainer, TileLayer, Marker, Popup, useMap } = LeafletComponents

  const center: [number, number] = [
    Number(safeLocations[0].latitude),
    Number(safeLocations[0].longitude),
  ]

  function FitBounds() {
    const map = useMap()

    useEffect(() => {
      if (!safeLocations.length) return

      const timer = window.setTimeout(() => {
        map.invalidateSize()

        const points = safeLocations.map((location) => [
          Number(location.latitude),
          Number(location.longitude),
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

        map.fitBounds(points, {
          padding: [24, 24],
          maxZoom: 10,
          animate: true,
        })
      }, 120)

      return () => window.clearTimeout(timer)
    }, [map, safeLocations])

    return null
  }

  return (
    <div className="project-map-wrapper" style={{ height: resolvedHeight }}>
      <MapContainer
        center={center}
        zoom={8}
        scrollWheelZoom={true}
        className="project-map"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {safeLocations.map((location, idx) => (
          <Marker
            key={`${location.name}-${idx}`}
            position={[Number(location.latitude), Number(location.longitude)]}
            icon={markerIcon}
          >
            <Popup>
              <div className="text-sm font-medium">{location.name}</div>
              {title ? (
                <div className="mt-1 text-xs text-slate-500">{title}</div>
              ) : null}
            </Popup>
          </Marker>
        ))}

        <FitBounds />
      </MapContainer>
    </div>
  )
}
