
export type OpportunityStage =
  | 'Prospecting'
  | 'Qualification'
  | 'Proposal'
  | 'Negotiation'
  | 'ClosedWon'
  | 'ClosedLost'

export interface OpportunityResponse {
  id:               string
  tenantId:         string
  customerId:       string
  leadId:           string | null
  title:            string
  stage:            OpportunityStage
  estimatedValue:   number | null
  probability:      number | null   // 0-100
  expectedCloseDate:string | null   // DateOnly — ISO date string "YYYY-MM-DD"
  closedAt:         string | null
  assignedToId:     string | null
  primaryContactId: string | null
  lossReason:       string | null
  notes:            string | null
  createdAt:        string
  updatedAt:        string
}

export interface CreateOpportunityRequest {
  customerId:       string
  leadId:           string | null
  title:            string
  stage:            OpportunityStage
  estimatedValue:   number | null
  probability:      number | null
  expectedCloseDate:string | null
  assignedToId:     string | null
  primaryContactId: string | null
  notes:            string | null
}

export interface UpdateOpportunityRequest extends CreateOpportunityRequest {}

export interface UpdateOpportunityStageRequest {
  stage: OpportunityStage
}

// Maps each stage to its Kanban column
export const STAGE_COLUMNS: Record<OpportunityStage, KanbanColumnId> = {
  Prospecting:  'prospecting',
  Qualification:'qualification',
  Proposal:     'proposal',
  Negotiation:  'negotiation',
  ClosedWon:    'won',
  ClosedLost:   'lost',
}

export const COLUMN_TO_STAGE: Record<KanbanColumnId, OpportunityStage> = {
  prospecting:  'Prospecting',
  qualification:'Qualification',
  proposal:     'Proposal',
  negotiation:  'Negotiation',
  won:          'ClosedWon',
  lost:         'ClosedLost',
}

export type KanbanColumnId =
  | 'prospecting'
  | 'qualification'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost'

export interface KanbanColumn {
  id:    KanbanColumnId
  label: string
}

export const KANBAN_COLUMNS: KanbanColumn[] = [
  { id: 'prospecting',   label: 'Prospecting'   },
  { id: 'qualification', label: 'Qualification'  },
  { id: 'proposal',      label: 'Proposal'       },
  { id: 'negotiation',   label: 'Negotiation'    },
  { id: 'won',           label: 'Won'            },
  { id: 'lost',          label: 'Lost'           },
]