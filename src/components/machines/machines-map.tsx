'use client'

import dynamic from 'next/dynamic'
import type { MachineMapPoint } from './machines-map-inner'

const MachinesMapInner = dynamic(() => import('./machines-map-inner'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center text-xs text-[var(--text-soft)]" style={{ height: 320 }}>
      Kaart laden…
    </div>
  ),
})

export type { MachineMapPoint }
export default function MachinesMap(props: { points: MachineMapPoint[]; height?: number }) {
  return <MachinesMapInner {...props} />
}
