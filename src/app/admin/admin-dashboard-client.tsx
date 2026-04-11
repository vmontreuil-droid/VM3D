'use client'

import { useMemo, useState } from 'react'
import ProjectMap from '@/components/projects/project-map'
import AdminProjectSearch from './admin-project-search'
import GeocodeMissingProjectsButton from './geocode-missing-projects-button'

type Props = {
  projects: any[]
  projectFiles: any[]
  adminUserId: string
}

type FilterStatus =
  | 'all'
  | 'ingediend'
  | 'in_behandeling'
  | 'klaar_voor_betaling'
  | 'afgerond'

function LegendItem({
  label,
  colorClass,
}: {
  label: string
  colorClass: string
}) {
  return (
    <div className="inline-flex items-center gap-2">
      <span className={`h-3 w-3 rounded-full ${colorClass}`} />
      <span className="text-xs text-[var(--text-soft)]">{label}</span>
    </div>
  )
}

export default function AdminDashboardClient({
  projects,
  projectFiles,
  adminUserId,
}: Props) {
  const [activeStatus, setActiveStatus] = useState<FilterStatus>('all')

  const totalProjects = projects.length
  const ingediendCount = projects.filter(
    (project: any) => project.status === 'ingediend'
  ).length
  const inBehandelingCount = projects.filter(
    (project: any) => project.status === 'in_behandeling'
  ).length
  const klaarVoorBetalingCount = projects.filter(
    (project: any) => project.status === 'klaar_voor_betaling'
  ).length
  const afgerondCount = projects.filter(
    (project: any) => project.status === 'afgerond'
  ).length

  const filteredProjects = useMemo(() => {
    if (activeStatus === 'all') return projects
    return projects.filter((project: any) => project.status === activeStatus)
  }, [projects, activeStatus])

  function cardClass(status: FilterStatus, extra = '') {
    const active = activeStatus === status

    return [
      'rounded-2xl border p-5 shadow-sm transition text-left',
      active
        ? 'ring-2 ring-[var(--accent)] border-[var(--accent)] translate-y-[-1px]'
        : 'border-[var(--border-soft)]',
      extra || 'bg-[var(--bg-card)] hover:bg-[var(--bg-card-2)]',
    ].join(' ')
  }

  return (
    <>
      <div className="mb-5 grid gap-4 sm:grid-cols-2 2xl:grid-cols-5">
        <button
          type="button"
          onClick={() => setActiveStatus('all')}
          className={cardClass('all')}
        >
          <p className="text-sm font-medium text-[var(--text-muted)]">Totaal</p>
          <p className="mt-2 text-3xl font-bold text-[var(--text-main)]">
            {totalProjects}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActiveStatus('ingediend')}
          className={cardClass('ingediend')}
        >
          <p className="text-sm font-medium text-[var(--text-soft)]">
            Ingediend
          </p>
          <p className="mt-2 text-3xl font-bold text-[var(--text-main)]">
            {ingediendCount}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActiveStatus('in_behandeling')}
          className={cardClass(
            'in_behandeling',
            'border-blue-900 bg-[var(--info-bg)]'
          )}
        >
          <p className="text-sm font-medium text-[var(--info-text)]">
            In behandeling
          </p>
          <p className="mt-2 text-3xl font-bold text-[var(--info-text)]">
            {inBehandelingCount}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActiveStatus('klaar_voor_betaling')}
          className={cardClass(
            'klaar_voor_betaling',
            'border-amber-900 bg-[var(--warning-bg)]'
          )}
        >
          <p className="text-sm font-medium text-[var(--warning-text)]">
            Klaar voor betaling
          </p>
          <p className="mt-2 text-3xl font-bold text-[var(--warning-text)]">
            {klaarVoorBetalingCount}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActiveStatus('afgerond')}
          className={cardClass(
            'afgerond',
            'border-green-900 bg-[var(--success-bg)]'
          )}
        >
          <p className="text-sm font-medium text-[var(--success-text)]">
            Afgerond
          </p>
          <p className="mt-2 text-3xl font-bold text-[var(--success-text)]">
            {afgerondCount}
          </p>
        </button>
      </div>

      <div className="mb-6 rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
        <div className="border-b border-[var(--border-soft)] px-5 py-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-main)]">
                Locaties van de werven
              </h2>
              <p className="mt-1 text-sm text-[var(--text-soft)]">
                Overzicht van alle projecten op kaart.
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                <LegendItem label="Ingediend" colorClass="bg-slate-400" />
                <LegendItem label="In behandeling" colorClass="bg-blue-500" />
                <LegendItem
                  label="Klaar voor betaling"
                  colorClass="bg-amber-500"
                />
                <LegendItem label="Afgerond" colorClass="bg-green-500" />
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 xl:items-end">
              <div className="rounded-full border border-[var(--border-soft)] bg-[var(--bg-card-2)] px-3 py-1 text-sm font-medium text-[var(--text-soft)]">
                {filteredProjects.length} zichtbaar
              </div>

              <GeocodeMissingProjectsButton />
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-card-2)]">
          <ProjectMap projects={filteredProjects} />
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-6 text-sm text-[var(--text-soft)] shadow-sm">
          Geen projecten gevonden voor deze status.
        </div>
      ) : (
        <AdminProjectSearch
          projects={filteredProjects}
          projectFiles={projectFiles}
          adminUserId={adminUserId}
        />
      )}
    </>
  )
}