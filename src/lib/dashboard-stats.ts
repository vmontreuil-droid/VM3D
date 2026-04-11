export function countByStatus(projects: any[], status: string) {
  return projects.filter((project) => project.status === status).length
}

export function buildProjectStats(projects: any[]) {
  return {
    total: projects.length,
    ingediend: countByStatus(projects, 'ingediend'),
    inBehandeling: countByStatus(projects, 'in_behandeling'),
    klaarVoorBetaling: countByStatus(projects, 'klaar_voor_betaling'),
    afgerond: countByStatus(projects, 'afgerond'),
  }
}