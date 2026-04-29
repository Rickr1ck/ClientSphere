
export type LeadStatus =
  | 'New'
  | 'Contacted'
  | 'Qualified'
  | 'Unqualified'
  | 'Nurturing'

export interface LeadResponse {
  id:                  string
  tenantId:            string
  firstName:           string
  lastName:            string
  email:               string | null
  phone:               string | null
  companyName:         string | null
  jobTitle:            string | null
  source:              string | null
  status:              LeadStatus
  aiConversionScore:   number | null   // SMALLINT 0-100
  aiScoreCalculatedAt: string | null
  estimatedValue:      number | null
  assignedToId:        string | null
  convertedAt:         string | null
  convertedCustomerId: string | null
  notes:               string | null
  createdAt:           string
  updatedAt:           string
}

export interface CreateLeadRequest {
  firstName:      string
  lastName:       string
  email:          string | null
  phone:          string | null
  companyName:    string | null
  jobTitle:       string | null
  source:         string | null
  notes:          string | null
  estimatedValue: number | null
  assignedToId:   string | null
}

export interface UpdateLeadRequest extends CreateLeadRequest {
  status: LeadStatus
}