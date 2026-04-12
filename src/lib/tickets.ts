export type TicketStatus =
  | 'nieuw'
  | 'in_behandeling'
  | 'wacht_op_klant'
  | 'afgerond'
  | 'gesloten'

export type TicketPriority = 'laag' | 'normaal' | 'hoog' | 'urgent'
export type TicketSlaState = 'on_track' | 'at_risk' | 'overdue' | 'paused' | 'resolved'

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

export function isTicketClosed(status: string | null) {
  return status === 'afgerond' || status === 'gesloten'
}

export function getTicketSlaTargetHours(priority: string | null) {
  switch (priority) {
    case 'urgent':
      return 4
    case 'hoog':
      return 8
    case 'normaal':
      return 24
    case 'laag':
      return 48
    default:
      return 24
  }
}

export function getTicketAgeHours(createdAt: string | null | undefined, now = new Date()) {
  if (!createdAt) return 0
  const created = new Date(createdAt).getTime()
  if (!Number.isFinite(created)) return 0
  return Math.max((now.getTime() - created) / (1000 * 60 * 60), 0)
}

export function getTicketSlaState(input: {
  status: string | null
  priority: string | null
  createdAt: string | null | undefined
  now?: Date
}) {
  const now = input.now ?? new Date()

  if (isTicketClosed(input.status)) {
    return 'resolved' as TicketSlaState
  }

  if (input.status === 'wacht_op_klant') {
    return 'paused' as TicketSlaState
  }

  const targetHours = getTicketSlaTargetHours(input.priority)
  const ageHours = getTicketAgeHours(input.createdAt, now)

  if (ageHours > targetHours) {
    return 'overdue' as TicketSlaState
  }

  if (ageHours >= targetHours * 0.8) {
    return 'at_risk' as TicketSlaState
  }

  return 'on_track' as TicketSlaState
}

export function getTicketSlaLabel(state: TicketSlaState) {
  switch (state) {
    case 'resolved':
      return 'SLA voldaan'
    case 'paused':
      return 'SLA gepauzeerd'
    case 'overdue':
      return 'SLA overtijd'
    case 'at_risk':
      return 'SLA risico'
    case 'on_track':
    default:
      return 'SLA op schema'
  }
}

export function getTicketSlaClass(state: TicketSlaState) {
  switch (state) {
    case 'resolved':
      return 'badge-success'
    case 'paused':
      return 'badge-neutral'
    case 'overdue':
      return 'badge-warning'
    case 'at_risk':
      return 'badge-warning'
    case 'on_track':
    default:
      return 'badge-info'
  }
}
