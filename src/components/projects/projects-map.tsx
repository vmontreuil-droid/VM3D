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

const ProjectsMapInner = dynamic(
  () => import('@/components/projects/projects-map-inner'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[400px] items-center justify-center rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] text-sm text-[var(--text-soft)]">
        Kaart laden...
      </div>
    ),
  }
)

export default function ProjectsMap({ locations, title }: Props) {
  if (!locations || locations.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] text-sm text-[var(--text-soft)]">
        Geen locaties beschikbaar.
      </div>
    )
  }

  return (
    <div className="map-wrapper rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] overflow-hidden">
      <ProjectsMapInner locations={locations} title={title} />
    </div>
  )
}
