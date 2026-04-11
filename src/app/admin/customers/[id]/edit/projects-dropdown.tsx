'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, FolderOpen } from 'lucide-react'

type ProjectOption = {
  id: string
  title: string | null
  status: string | null
  created_at: string | null
}

type Props = {
  projects: ProjectOption[]
}

function getProjectStatusLabel(status: string | null) {
  switch (status) {
    case 'ingediend':
      return 'Ingediend'
    case 'in_behandeling':
      return 'In behandeling'
    case 'klaar_voor_betaling':
      return 'Klaar voor betaling'
    case 'afgerond':
      return 'Afgerond'
    default:
      return 'Onbekend'
  }
}

export default function ProjectsDropdown({ projects }: Props) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState(projects[0]?.id ?? '')

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedId) ?? null,
    [projects, selectedId]
  )

  if (projects.length === 0) {
    return (
      <p className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-3 text-sm text-[var(--text-soft)]">
        Geen werven gevonden voor deze klant.
      </p>
    )
  }

  return (
    <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
        Kies een werf
      </p>

      <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="relative">
          <select
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
            className="w-full appearance-none rounded-xl border border-[var(--accent)]/45 bg-[var(--bg-card)] px-3 py-2.5 pr-10 text-sm text-[var(--text-main)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/15"
          >
            {projects.map((project) => {
              const label = project.title || 'Zonder titel'
              const dateLabel = project.created_at
                ? new Date(project.created_at).toLocaleDateString('nl-BE')
                : 'Geen datum'

              return (
                <option key={project.id} value={project.id}>
                  {label} - {getProjectStatusLabel(project.status)} - {dateLabel}
                </option>
              )
            })}
          </select>

          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--accent)]/85">
            <ChevronDown className="h-4 w-4" />
          </span>
        </div>

        <button
          type="button"
          onClick={() => selectedId && router.push(`/admin/projects/${selectedId}`)}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-2.5 text-sm font-semibold text-[var(--text-main)] transition hover:border-[var(--accent)]/40 hover:bg-[var(--bg-card)]"
          disabled={!selectedId}
        >
          <FolderOpen className="h-4 w-4 text-[var(--accent)]" />
          Open werf
        </button>
      </div>

      {selectedProject && (
        <p className="mt-2 text-xs text-[var(--text-soft)]">
          {getProjectStatusLabel(selectedProject.status)}
        </p>
      )}
    </div>
  )
}
