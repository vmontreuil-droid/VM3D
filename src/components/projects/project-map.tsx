'use client'

import dynamic from 'next/dynamic'

type Props = {
  projects: any[]
  height?: number | string
}

const MapInner = dynamic(() => import('./project-map-inner'), {
  ssr: false,
})

export default function ProjectMap({ projects, height = 420 }: Props) {
  const resolvedHeight = typeof height === 'number' ? `${height}px` : height

  return <MapInner projects={projects} height={resolvedHeight} />
}