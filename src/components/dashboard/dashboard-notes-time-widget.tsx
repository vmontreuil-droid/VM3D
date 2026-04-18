'use client'

import { useState } from 'react'
import { StickyNote, Clock } from 'lucide-react'
import DashboardNotesWidget from './dashboard-notes-widget'
import DashboardTimeWidget from './dashboard-time-widget'

type Tab = 'notes' | 'time'

export default function DashboardNotesTimeWidget() {
  const [tab, setTab] = useState<Tab>('notes')

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1 border-b border-[var(--border-soft)] px-2 py-1.5">
        <button
          type="button"
          onClick={() => setTab('notes')}
          className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-wider transition ${
            tab === 'notes'
              ? 'bg-amber-400/15 text-amber-400'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          <StickyNote className="h-3.5 w-3.5" />
          Notities
        </button>
        <button
          type="button"
          onClick={() => setTab('time')}
          className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-wider transition ${
            tab === 'time'
              ? 'bg-emerald-500/15 text-emerald-400'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          Tijdregistratie
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className={tab === 'notes' ? 'h-full' : 'hidden'}>
          <DashboardNotesWidget hideHeader />
        </div>
        <div className={tab === 'time' ? 'h-full' : 'hidden'}>
          <DashboardTimeWidget hideHeader />
        </div>
      </div>
    </div>
  )
}
