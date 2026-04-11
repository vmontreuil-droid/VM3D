'use client'

import dynamic from 'next/dynamic'

type Location = {
  name: string
  latitude: number
  longitude: number
}

type Props = {
  locations: Location[]
  title?: string
}

const CustomersMapInner = dynamic(
  () => import('@/components/customers/customers-map-inner'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[400px] items-center justify-center rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] text-sm text-[var(--text-soft)]">
        Kaart laden...
      </div>
    ),
  }
)

export default function CustomersMap({ locations, title }: Props) {
  if (!locations || locations.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] text-sm text-[var(--text-soft)]">
        Geen locaties beschikbaar.
      </div>
    )
  }

  return (
    <div className="map-wrapper rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] overflow-hidden">
      <CustomersMapInner locations={locations} title={title} />
    </div>
  )
}
