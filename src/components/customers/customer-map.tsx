'use client'

import dynamic from 'next/dynamic'

type Props = {
  latitude: number | null
  longitude: number | null
  label?: string
  height?: number | string
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

export default function CustomerMap({
  latitude,
  longitude,
  label,
  height = 260,
}: Props) {
  const resolvedHeight = typeof height === 'number' ? `${height}px` : height

  if (latitude == null || longitude == null) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] text-sm text-[var(--text-soft)]"
        style={{ height: resolvedHeight }}
      >
        Nog geen kaartpositie beschikbaar.
      </div>
    )
  }

  return (
    <div
      className="project-map-wrapper overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)]"
      style={{ height: resolvedHeight }}
    >
      <CustomerMapInner
        latitude={latitude}
        longitude={longitude}
        label={label}
        height={height}
      />
    </div>
  )
}