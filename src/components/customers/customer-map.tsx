'use client'

import dynamic from 'next/dynamic'
import { useT } from '@/i18n/context'

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
        <MapLoadingLabel />
      </div>
    ),
  }
)

function MapLoadingLabel() {
  const { t } = useT()
  return <>{t.sharedUI.mapLoading}</>
}

export default function CustomerMap({
  latitude,
  longitude,
  label,
  height = 260,
}: Props) {
  const { t } = useT()
  const resolvedHeight = typeof height === 'number' ? `${height}px` : height

  if (latitude == null || longitude == null) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] text-sm text-[var(--text-soft)]"
        style={{ height: resolvedHeight }}
      >
        {t.sharedUI.noMapPosition}
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