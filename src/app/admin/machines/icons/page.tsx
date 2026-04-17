import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import {
  MACHINE_VARIANTS,
  IconByVariant,
  GraderIcon,
  type MachineVariant,
} from '@/components/machines/machine-icons'

export const dynamic = 'force-static'

type Entry = { id: MachineVariant | 'grader'; label: string; group: string }

const ENTRIES: Entry[] = [
  ...MACHINE_VARIANTS,
  { id: 'grader', label: 'Grader', group: 'grader' },
]

const GROUPS: { key: string; title: string; accent: string }[] = [
  { key: 'excavator', title: '⛏️  Kranen (10 varianten)', accent: 'text-orange-400' },
  { key: 'bulldozer', title: '🛠️  Bulldozers & grondverzet (10 varianten)', accent: 'text-amber-400' },
  { key: 'grader', title: '🧹  Graders (1 variant)', accent: 'text-purple-400' },
]

function Card({ e }: { e: Entry }) {
  return (
    <div className="group rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] p-4 transition hover:border-emerald-500/60 hover:bg-[var(--bg-card)]">
      <div className="flex items-center justify-center rounded-lg bg-[var(--bg-main)] p-4 text-[var(--text-main)]">
        {e.id === 'grader'
          ? <GraderIcon size={72} />
          : <IconByVariant variant={e.id as MachineVariant} size={72} />}
      </div>
      <div className="mt-3">
        <p className="text-xs font-semibold text-[var(--text-main)]">{e.label}</p>
        <p className="mt-0.5 font-mono text-[10px] text-[var(--text-muted)]">{e.id}</p>
      </div>

      {/* size preview row */}
      <div className="mt-3 flex items-center gap-3 border-t border-[var(--border-soft)] pt-3 text-[var(--text-soft)]">
        {[16, 24, 32, 48].map((s) => (
          <div key={s} className="flex flex-col items-center gap-1">
            {e.id === 'grader'
              ? <GraderIcon size={s} />
              : <IconByVariant variant={e.id as MachineVariant} size={s} />}
            <span className="text-[9px] text-[var(--text-muted)]">{s}px</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function MachineIconGalleryPage() {
  return (
    <div className="space-y-4 p-4 sm:p-6">
      {/* Hero */}
      <section className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
        <div className="relative border-b border-[var(--border-soft)] bg-[var(--bg-card-2)] px-5 py-4">
          <div className="absolute inset-0 opacity-30">
            <div className="h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.18),transparent_35%),radial-gradient(circle_at_left,rgba(255,255,255,0.05),transparent_25%)]" />
          </div>
          <div className="relative">
            <Link href="/admin/machines" className="btn-secondary text-xs">
              <ArrowLeft className="inline h-3 w-3 mr-1" />
              Terug naar machines
            </Link>
            <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-purple-400">
              Icoon-bibliotheek
            </p>
            <h1 className="mt-1 text-xl font-semibold text-[var(--text-main)] sm:text-2xl">
              Kies een symbool voor je machines
            </h1>
            <p className="mt-1 max-w-2xl text-xs text-[var(--text-soft)]">
              Hieronder zie je alle beschikbare symbolen. Laat weten welke je wil
              als vast icoon voor <b>kraan</b>, <b>bulldozer</b> en <b>grader</b>
              (of noteer een gewenste <span className="font-mono text-[11px]">id</span>).
            </p>
          </div>
        </div>
      </section>

      {GROUPS.map((g) => {
        const items = ENTRIES.filter((e) => e.group === g.key)
        if (items.length === 0) return null
        return (
          <section
            key={g.key}
            className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-4 shadow-sm"
          >
            <h2 className={`mb-3 text-sm font-semibold ${g.accent}`}>{g.title}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {items.map((e) => <Card key={e.id} e={e} />)}
            </div>
          </section>
        )
      })}
    </div>
  )
}
