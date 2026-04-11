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
      return 'border border-slate-500/20 bg-slate-500/10 text-slate-300'
    case 'in_behandeling':
      return 'border border-blue-500/20 bg-blue-500/10 text-blue-300'
    case 'klaar_voor_betaling':
      return 'border border-amber-500/20 bg-amber-500/10 text-amber-300'
    case 'afgerond':
      return 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
    default:
      return 'border border-[var(--border-soft)] bg-[var(--bg-card-2)] text-[var(--text-soft)]'
  }
}

export function getStatusIcon(status: string) {
  switch (status) {
    case 'ingediend':
      return 'FileText'
    case 'in_behandeling':
      return 'Clock'
    case 'klaar_voor_betaling':
      return 'CheckCircle'
    case 'afgerond':
      return 'Check'
    default:
      return 'FileText'
  }
}