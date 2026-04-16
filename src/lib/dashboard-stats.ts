export function countByStatus(projects: any[], status: string) {
  return projects.filter((project) => project.status === status).length
}

export function buildProjectStats(projects: any[]) {
  return {
    total: projects.length,
    offerteAangevraagd: countByStatus(projects, 'offerte_aangevraagd') + countByStatus(projects, 'ingediend'),
    offerteVerstuurd: countByStatus(projects, 'offerte_verstuurd'),
    inBehandeling: countByStatus(projects, 'in_behandeling'),
    facturatie: countByStatus(projects, 'facturatie') + countByStatus(projects, 'klaar_voor_betaling'),
    factuurVerstuurd: countByStatus(projects, 'factuur_verstuurd'),
    afgerond: countByStatus(projects, 'afgerond'),
  }
}