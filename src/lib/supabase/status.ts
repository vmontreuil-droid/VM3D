export function getStatusLabel(status: string) {
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
      return status
  }
}

export function getStatusClass(status: string) {
  switch (status) {
    case 'ingediend':
      return 'bg-slate-100 text-slate-700'
    case 'in_behandeling':
      return 'bg-blue-100 text-blue-700'
    case 'klaar_voor_betaling':
      return 'bg-amber-100 text-amber-800'
    case 'afgerond':
      return 'bg-green-100 text-green-700'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}