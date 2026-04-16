export function getStatusLabel(status: string) {
  switch (status) {
    case 'offerte_aangevraagd':
      return 'Offerte aangevraagd'
    case 'offerte_verstuurd':
      return 'Offerte verstuurd'
    case 'in_behandeling':
      return 'In behandeling'
    case 'facturatie':
      return 'Facturatie'
    case 'factuur_verstuurd':
      return 'Factuur verstuurd'
    case 'afgerond':
      return 'Afgerond'
    case 'ingediend':
      return 'Ingediend'
    case 'klaar_voor_betaling':
      return 'Klaar voor betaling'
    default:
      return status
  }
}

export function getStatusClass(status: string) {
  switch (status) {
    case 'offerte_aangevraagd':
    case 'ingediend':
      return 'bg-slate-100 text-slate-700'
    case 'offerte_verstuurd':
      return 'bg-amber-100 text-amber-800'
    case 'in_behandeling':
      return 'bg-blue-100 text-blue-700'
    case 'facturatie':
    case 'klaar_voor_betaling':
      return 'bg-purple-100 text-purple-700'
    case 'factuur_verstuurd':
      return 'bg-amber-100 text-amber-800'
    case 'afgerond':
      return 'bg-green-100 text-green-700'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}