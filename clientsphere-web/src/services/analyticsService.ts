import api from '@/lib/api'

export interface DashboardSummary {
  totalRevenue: number
  activeCustomers: number
  openTickets: number
  urgentTickets: number
  winRate: number
  newCustomersMonth: number
  revenueGrowth: number
}

export interface EmployeeSalesStats {
  userId: string
  fullName: string
  email: string
  totalOpportunities: number
  wonDeals: number
  lostDeals: number
  wonValue: number
  pipelineValue: number
}

export interface TicketsOverview {
  totalTickets: number
  openTickets: number
  inProgressTickets: number
  resolvedTickets: number
  closedTickets: number
  averageResolutionHours: number
  highPriorityTickets: number
}

export interface CampaignPerformance {
  campaignId: string
  campaignName: string
  status: string
  budget: number
  actualSpend: number
  impressions: number
  clicks: number
  conversions: number
  clickThroughRate: number
  conversionRate: number
}

export const analyticsService = {
  getSummary: () => api.get<DashboardSummary>('/analytics/summary'),
  getSalesByEmployee: () => api.get<EmployeeSalesStats[]>('/analytics/sales-by-employee'),
  getTicketsOverview: () => api.get<TicketsOverview>('/analytics/tickets-overview'),
  getCampaignPerformance: () => api.get<CampaignPerformance[]>('/analytics/campaign-performance'),
}
