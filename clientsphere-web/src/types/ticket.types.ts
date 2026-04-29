
export type TicketPriority =
  | 'Low'
  | 'Medium'
  | 'High'
  | 'Critical'

export type TicketStatus =
  | 'Open'
  | 'Pending'
  | 'InProgress'
  | 'Resolved'
  | 'Closed'

export type AiSentimentLabel =
  | 'Positive'
  | 'Neutral'
  | 'Negative'
  | 'Urgent'

export interface TicketResponse {
  id:               string
  tenantId:         string
  ticketNumber:     string
  customerId:       string
  contactId:        string | null
  subject:          string
  description:      string | null
  priority:         TicketPriority
  status:           TicketStatus
  aiSentimentLabel: AiSentimentLabel | null
  aiSentimentScore: number | null   // NUMERIC(4,3) — -1.000 to 1.000
  assignedToId:     string | null
  resolvedAt:       string | null
  firstResponseAt:  string | null
  dueAt:            string | null
  tags:             string[] | null
  createdAt:        string
  updatedAt:        string
}

export interface CreateTicketRequest {
  customerId:  string
  contactId:   string | null
  subject:     string
  description: string | null
  priority:    TicketPriority
  assignedToId:string | null
  dueAt:       string | null
  tags:        string[] | null
}

export interface UpdateTicketRequest extends CreateTicketRequest {
  status: TicketStatus
}

export interface UpdateTicketStatusRequest {
  status: TicketStatus
}

// Sort weight — Urgent always first, then by priority severity
export const SENTIMENT_SORT_WEIGHT: Record<AiSentimentLabel, number> = {
  Urgent:   0,
  Negative: 1,
  Neutral:  2,
  Positive: 3,
}

export const PRIORITY_SORT_WEIGHT: Record<TicketPriority, number> = {
  Critical: 0,
  High:     1,
  Medium:   2,
  Low:      3,
}

export type TicketFilter = 'all' | 'urgent' | 'open' | 'mine'

export const STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  Open:       ['InProgress', 'Pending', 'Resolved', 'Closed'],
  Pending:    ['Open', 'InProgress', 'Resolved', 'Closed'],
  InProgress: ['Pending', 'Resolved', 'Closed'],
  Resolved:   ['Open', 'Closed'],
  Closed:     ['Open'],
}