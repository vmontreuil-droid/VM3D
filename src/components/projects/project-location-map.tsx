'use client'

import dynamic from 'next/dynamic'
import { useT } from '@/i18n/context'

const ProjectLocationMapInner = dynamic(
  () => import('./project-location-map-inner'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[320px] w-full items-center justify-center text-sm text-[var(--text-soft)]">
        <MapLoadingPlaceholder />
      </div>
    ),
  }
)

function MapLoadingPlaceholder() {
  const { t } = useT()
  return <>{t.mapPopup.loadingMap}</>
}

type Props = {
  latitude: number
  longitude: number
  title?: string | null
  address?: string | null
}

export default function ProjectLocationMap(props: Props) {
  return (
    <div className="h-[320px] w-full">
      <ProjectLocationMapInner {...props} />
    </div>
  )
}