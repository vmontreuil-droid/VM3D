'use client'

import dynamic from 'next/dynamic'

export type MapProject = {
  id: number
  name: string
  address?: string | null
  status?: string | null
  latitude?: number | null
  longitude?: number | null
  klantEmail?: string | null
}

export type MapCustomer = {
  id: string
  company_name?: string | null
  full_name?: string | null
  city?: string | null
  email?: string | null
  latitude?: number | null
  longitude?: number | null
  project_count?: number
}

type Props = {
  projects: MapProject[]
  customers: MapCustomer[]
  height?: number | string
}

const MapInner = dynamic(() => import('./dashboard-map-inner'), { ssr: false })

export default function DashboardMap({ projects, customers, height = '100%' }: Props) {
  const resolvedHeight = typeof height === 'number' ? `${height}px` : height
  return <MapInner projects={projects} customers={customers} height={resolvedHeight} />
}
