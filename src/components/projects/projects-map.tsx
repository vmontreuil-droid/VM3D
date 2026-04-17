'use client'

import dynamic from 'next/dynamic'
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

const ProjectsMapInner = dynamic(
  () => import('@/components/projects/projects-map-inner'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[400px] items-center justify-center rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] text-sm text-[var(--text-soft)]">
        <MapLoading />
      </div>
    ),
  }
)

function MapLoading() {
  const { t } = useT()
  return <>{t.mapPopup.loadingMap}</>
}

export default function ProjectsMap({
  locations,
  title,
  height = 400,
}: Props) {
  const { t } = useT()
  const resolvedHeight = typeof height === 'number' ? `${height}px` : height

  if (!locations || locations.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] text-sm text-[var(--text-soft)]"
        style={{ height: resolvedHeight }}
      >
        {t.mapPopup.noLocationsDot}
      </div>
    )
  }

  return (
    <div
      className="map-wrapper overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)]"
      style={{ height: resolvedHeight }}
    >
      <ProjectsMapInner
        locations={locations}
        title={title}
        height={resolvedHeight}
      />
    </div>
  )
}
