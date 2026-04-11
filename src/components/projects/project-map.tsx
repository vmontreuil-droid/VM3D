'use client'

import dynamic from 'next/dynamic'

const MapInner = dynamic(() => import('./project-map-inner'), {
  ssr: false,
})

export default function ProjectMap({ projects }: { projects: any[] }) {
  return <MapInner projects={projects} />
}