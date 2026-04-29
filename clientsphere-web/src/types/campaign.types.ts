// src/types/campaign.types.ts
export type CampaignStatus =
  | 'Draft'
  | 'Scheduled'
  | 'Active'
  | 'Paused'
  | 'Completed'
  | 'Cancelled'

export interface CampaignResponse {
  id:                string
  tenantId:          string
  name:              string
  description:       string | null
  status:            CampaignStatus
  channel:           string | null
  budget:            number | null    // NUMERIC(18,2)
  actualSpend:       number
  targetAudience:    string | null
  startDate:         string | null    // DateOnly — "YYYY-MM-DD"
  endDate:           string | null
  sendGridCampaignId:string | null
  impressions:       number
  clicks:            number
  conversions:       number
  ownerId:           string | null
  createdAt:         string
  updatedAt:         string
}

export interface CreateCampaignRequest {
  name:           string
  description:    string | null
  channel:        string | null
  budget:         number | null
  targetAudience: string | null
  startDate:      string | null
  endDate:        string | null
}

export interface UpdateCampaignRequest extends CreateCampaignRequest {
  status: CampaignStatus
}

export interface CampaignFormValues {
  name:           string
  description:    string
  channel:        string
  budget:         string
  targetAudience: string
  startDate:      string
  endDate:        string
}

export const emptyCampaignForm: CampaignFormValues = {
  name:           '',
  description:    '',
  channel:        '',
  budget:         '',
  targetAudience: '',
  startDate:      '',
  endDate:        '',
}

export interface CampaignFormErrors {
  name?:      string
  budget?:    string
  endDate?:   string
}