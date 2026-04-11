'use client'

import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import L from 'leaflet'

type Props = {
  latitude: number
  longitude: number
  title?: string | null
  address?: string | null
}

const markerIcon = L.divIcon({
  className: '',
  html: `
    <div style="
      width: 18px;
      height: 18px;
      border-radius: 9999px;
      background: #f59a3d;
      border: 3px solid white;
      box-shadow: 0 0 0 3px rgba(0,0,0,0.18);
    "></div>
  `,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

export default function ProjectLocationMapInner({
  latitude,
  longitude,
  title,
  address,
}: Props) {
  return (
    <div className="h-[320px] w-full overflow-hidden">
      <MapContainer
        center={[latitude, longitude]}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap-bijdragers"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={[latitude, longitude]} icon={markerIcon}>
          <Popup>
            <div className="text-sm">
              <div className="font-semibold">{title || 'Projectlocatie'}</div>
              {address ? <div>{address}</div> : null}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}