export type TicketStatus =
  | 'nieuw'
  | 'in_behandeling'
  | 'wacht_op_klant'
  | 'afgerond'
  | 'gesloten'

export type TicketPriority = 'laag' | 'normaal' | 'hoog' | 'urgent'
export type TicketSlaState = 'on_track' | 'at_risk' | 'overdue' | 'paused' | 'resolved'

type TicketDictShape = {
  adminTickets?: {
    statusNew?: string
    statusInProgress?: string
    statusWaitingCustomer?: string
    statusDone?: string
    statusClosed?: string
    priorityLow?: string
    priorityNormal?: string
    priorityHigh?: string
    priorityUrgent?: string
  }
  ticketSla?: {
    met?: string
    paused?: string
    overdue?: string
    atRisk?: string
    onTrack?: string
  }
}

export function getTicketStatusLabel(status: string | null, t?: TicketDictShape) {
  switch (status) {
    case 'nieuw':
      return t?.adminTickets?.statusNew ?? 'Nieuw'
    case 'in_behandeling':
      return t?.adminTickets?.statusInProgress ?? 'In behandeling'
    case 'wacht_op_klant':
      return t?.adminTickets?.statusWaitingCustomer ?? 'Wacht op klant'
    case 'afgerond':
      return t?.adminTickets?.statusDone ?? 'Afgerond'
    case 'gesloten':
      return t?.adminTickets?.statusClosed ?? 'Gesloten'
    default:
      return 'Onbekend'
  }
}

export function getTicketPriorityLabel(priority: string | null, t?: TicketDictShape) {
  switch (priority) {
    case 'laag':
      return t?.adminTickets?.priorityLow ?? 'Laag'
    case 'normaal':
      return t?.adminTickets?.priorityNormal ?? 'Normaal'
    case 'hoog':
      return t?.adminTickets?.priorityHigh ?? 'Hoog'
    case 'urgent':
      return t?.adminTickets?.priorityUrgent ?? 'Urgent'
    default:
      return t?.adminTickets?.priorityNormal ?? 'Normaal'
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

export function getTicketSlaLabel(state: TicketSlaState, t?: TicketDictShape) {
  switch (state) {
    case 'resolved':
      return t?.ticketSla?.met ?? 'SLA voldaan'
    case 'paused':
      return t?.ticketSla?.paused ?? 'SLA gepauzeerd'
    case 'overdue':
      return t?.ticketSla?.overdue ?? 'SLA overtijd'
    case 'at_risk':
      return t?.ticketSla?.atRisk ?? 'SLA risico'
    case 'on_track':
    default:
      return t?.ticketSla?.onTrack ?? 'SLA op schema'
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
