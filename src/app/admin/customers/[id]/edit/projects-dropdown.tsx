'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, FolderOpen } from 'lucide-react'

type ProjectOption = {
  id: string
  name: string | null
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
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(projects[0]?.id ?? '')

  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return projects

    return projects.filter((project) => {
      const title = (project.name || '').toLowerCase()
      const statusLabel = getProjectStatusLabel(project.status).toLowerCase()
      return title.includes(normalizedQuery) || statusLabel.includes(normalizedQuery)
    })
  }, [projects, query])

  useEffect(() => {
    if (!filteredProjects.length) {
      setSelectedId('')
      return
    }

    const stillExists = filteredProjects.some((project) => project.id === selectedId)
    if (!stillExists) {
      setSelectedId(filteredProjects[0].id)
    }
  }, [filteredProjects, selectedId])

  const selectedProject = useMemo(
    () => filteredProjects.find((project) => project.id === selectedId) ?? null,
    [filteredProjects, selectedId]
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

      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Zoek op titel of status"
        className="input-dark mt-2 w-full px-3 py-2 text-sm"
      />

      <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="relative">
          <select
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
            className="w-full appearance-none rounded-xl border border-[var(--accent)]/45 bg-[var(--bg-card)] px-3 py-2.5 pr-10 text-sm text-[var(--text-main)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/15"
            disabled={!filteredProjects.length}
          >
            {filteredProjects.map((project) => {
              const label = project.name || 'Zonder titel'
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

      {query && filteredProjects.length === 0 && (
        <p className="mt-2 text-xs text-[var(--text-soft)]">
          Geen resultaten voor deze zoekterm.
        </p>
      )}

      {selectedProject && (
        <p className="mt-2 text-xs text-[var(--text-soft)]">
          {getProjectStatusLabel(selectedProject.status)}
        </p>
      )}
    </div>
  )
}
