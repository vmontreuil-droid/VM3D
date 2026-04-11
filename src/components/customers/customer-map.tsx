'use client'

import dynamic from 'next/dynamic'

type Props = {
  latitude: number | null
  longitude: number | null
  label?: string
}

const CustomerMapInner = dynamic(
  () => import('@/components/customers/customer-map-inner'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[260px] items-center justify-center rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] text-sm text-[var(--text-soft)]">
        Kaart laden...
      </div>
    ),
  }
)

export default function CustomerMap({ latitude, longitude, label }: Props) {
  if (latitude == null || longitude == null) {
    return (
      <div className="flex h-[260px] items-center justify-center rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] text-sm text-[var(--text-soft)]">
        Nog geen kaartpositie beschikbaar.
      </div>
    )
  }

  return (
    <div className="project-map-wrapper rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)]">
      <CustomerMapInner
        latitude={latitude}
        longitude={longitude}
        label={label}
      />
    </div>
  )
}