import type { Dictionary } from '@/i18n/nl'

export function getStatusLabel(status: string, t?: Dictionary) {
  if (t) {
    const key = status as keyof typeof t.status
    if (key in (t.status || {})) return (t.status as Record<string, string>)[key] ?? status
  }
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
    // legacy
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
      return 'border border-slate-500/20 bg-slate-500/10 text-slate-300'
    case 'offerte_verstuurd':
      return 'border border-amber-500/20 bg-amber-500/10 text-amber-300'
    case 'in_behandeling':
      return 'border border-blue-500/20 bg-blue-500/10 text-blue-300'
    case 'facturatie':
    case 'klaar_voor_betaling':
      return 'border border-purple-500/20 bg-purple-500/10 text-purple-300'
    case 'factuur_verstuurd':
      return 'border border-amber-500/20 bg-amber-500/10 text-amber-300'
    case 'afgerond':
      return 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
    default:
      return 'border border-[var(--border-soft)] bg-[var(--bg-card-2)] text-[var(--text-soft)]'
  }
}

export function getStatusIcon(status: string) {
  switch (status) {
    case 'offerte_aangevraagd':
    case 'ingediend':
      return 'FileText'
    case 'offerte_verstuurd':
      return 'Send'
    case 'in_behandeling':
      return 'Clock'
    case 'facturatie':
    case 'klaar_voor_betaling':
      return 'Receipt'
    case 'factuur_verstuurd':
      return 'Mail'
    case 'afgerond':
      return 'Check'
    default:
      return 'FileText'
  }
}