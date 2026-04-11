export type TicketStatus =
  | 'nieuw'
  | 'in_behandeling'
  | 'wacht_op_klant'
  | 'afgerond'
  | 'gesloten'

export type TicketPriority = 'laag' | 'normaal' | 'hoog' | 'urgent'

export function getTicketStatusLabel(status: string | null) {
  switch (status) {
    case 'nieuw':
      return 'Nieuw'
    case 'in_behandeling':
      return 'In behandeling'
    case 'wacht_op_klant':
      return 'Wacht op klant'
    case 'afgerond':
      return 'Afgerond'
    case 'gesloten':
      return 'Gesloten'
    default:
      return 'Onbekend'
  }
}

export function getTicketPriorityLabel(priority: string | null) {
  switch (priority) {
    case 'laag':
      return 'Laag'
    case 'normaal':
      return 'Normaal'
    case 'hoog':
      return 'Hoog'
    case 'urgent':
      return 'Urgent'
    default:
      return 'Normaal'
  }
}

export function getTicketStatusClass(status: string | null) {
  switch (status) {
    case 'nieuw':
      return 'badge-info'
    case 'in_behandeling':
      return 'badge-warning'
    case 'wacht_op_klant':
      return 'badge-neutral'
    case 'afgerond':
      return 'badge-success'
    case 'gesloten':
      return 'badge-neutral'
    default:
      return 'badge-neutral'
  }
}

export function getTicketPriorityClass(priority: string | null) {
  switch (priority) {
    case 'laag':
      return 'badge-neutral'
    case 'normaal':
      return 'badge-info'
    case 'hoog':
      return 'badge-warning'
    case 'urgent':
      return 'badge-warning'
    default:
      return 'badge-info'
  }
}
