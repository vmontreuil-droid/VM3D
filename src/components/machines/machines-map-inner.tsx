'use client'

import { useEffect, useMemo, useState } from 'react'
import { useT } from '@/i18n/context'

export type MachineMapPoint = {
  id: number
  name: string
  brand: string
  model: string
  latitude: number
  longitude: number
  is_online: boolean
  location_updated_at: string | null
}

type Props = {
  points: MachineMapPoint[]
  height?: number
}

// SVG marker generator — green (online) or red (offline) pin
function pinSvg(online: boolean): string {
  const color = online ? '#22c55e' : '#ef4444'
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="42" viewBox="0 0 30 42">
      <defs>
        <filter id="s" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1" flood-opacity="0.45"/>
        </filter>
      </defs>
      <path filter="url(#s)" d="M15 0C6.716 0 0 6.716 0 15c0 11 15 27 15 27s15-16 15-27C30 6.716 23.284 0 15 0z" fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="15" cy="15" r="5.5" fill="white"/>
      <circle cx="15" cy="15" r="3" fill="${color}"/>
    </svg>
  `.trim()
  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64')
}

export default function MachinesMapInner({ points, height = 320 }: Props) {
  const { t } = useT()
  const tt = t.adminMachines
  const td = t.adminMachineDetail
  const [mounted, setMounted] = useState(false)
  const [MapContainer, setMapContainer] = useState<any>(null)
  const [TileLayer, setTileLayer] = useState<any>(null)
  const [Marker, setMarker] = useState<any>(null)
  const [Popup, setPopup] = useState<any>(null)
  const [useMap, setUseMap] = useState<any>(null)
  const [iconOnline, setIconOnline] = useState<any>(null)
  const [iconOffline, setIconOffline] = useState<any>(null)

  const safe = useMemo(
    () =>
      points.filter(
        (p) =>
          p.latitude != null &&
          p.longitude != null &&
          !Number.isNaN(p.latitude) &&
          !Number.isNaN(p.longitude),
      ),
    [points],
  )

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return
    ;(async () => {
      try {
        const L = require('leaflet')
        const rl = await import('react-leaflet')
        const makeIcon = (online: boolean) =>
          new L.Icon({
            iconUrl: pinSvg(online),
            iconSize: [30, 42],
            iconAnchor: [15, 42],
            popupAnchor: [0, -38],
          })
        setIconOnline(makeIcon(true))
        setIconOffline(makeIcon(false))
        setMapContainer(() => rl.MapContainer)
        setTileLayer(() => rl.TileLayer)
        setMarker(() => rl.Marker)
        setPopup(() => rl.Popup)
        setUseMap(() => rl.useMap)
      } catch (e) {
        console.error('Error loading Leaflet:', e)
      }
    })()
  }, [mounted])

  if (!mounted || !MapContainer || !TileLayer || !Marker || !Popup || !useMap) {
    return (
      <div className="flex items-center justify-center text-xs text-[var(--text-soft)]" style={{ height }}>
        …
      </div>
    )
  }

  if (!safe.length) {
    return (
      <div className="flex items-center justify-center text-xs text-[var(--text-soft)]" style={{ height }}>
        {tt.mapEmpty}
      </div>
    )
  }

  const bounds = {
    minLat: Math.min(...safe.map((p) => p.latitude)),
    maxLat: Math.max(...safe.map((p) => p.latitude)),
    minLng: Math.min(...safe.map((p) => p.longitude)),
    maxLng: Math.max(...safe.map((p) => p.longitude)),
  }
  const centerLat = (bounds.minLat + bounds.maxLat) / 2
  const centerLng = (bounds.minLng + bounds.maxLng) / 2

  function FitBounds() {
    const map = useMap()
    useEffect(() => {
      if (safe.length === 1) {
        map.setView([safe[0].latitude, safe[0].longitude], 13)
      } else {
        const L = require('leaflet')
        map.fitBounds(
          L.latLngBounds(safe.map((p) => [p.latitude, p.longitude])),
          { padding: [40, 40], maxZoom: 14 },
        )
      }
    }, [map])
    return null
  }

  return (
    <div style={{ height }} className="overflow-hidden rounded-lg border border-[var(--border-soft)]">
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={safe.length === 1 ? 13 : 8}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds />
        {safe.map((p) => (
          <Marker
            key={p.id}
            position={[p.latitude, p.longitude]}
            icon={p.is_online ? iconOnline : iconOffline}
          >
            <Popup>
              <div className="text-xs">
                <p className="font-semibold">{p.brand} {p.model}</p>
                <p className="text-[11px] opacity-70">{p.name}</p>
                <p className="mt-1">
                  <span className={p.is_online ? 'text-green-600' : 'text-red-600'}>
                    {p.is_online ? `● ${tt.online}` : `● ${tt.offline}`}
                  </span>
                </p>
                {p.location_updated_at && (
                  <p className="text-[10px] opacity-60">
                    {td.reportedAt.replace('{when}', new Date(p.location_updated_at).toLocaleString())}
                  </p>
                )}
                <a
                  href={`/admin/machines/${p.id}`}
                  className="mt-1 block text-[11px] text-[var(--accent)] underline"
                >
                  {td.edit} →
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
