// src/services/opportunityService.ts
import api from '@/lib/api'
import type { PagedResult } from '@/types/api.types'
import type {
  OpportunityResponse,
  CreateOpportunityRequest,
  UpdateOpportunityStageRequest,
} from '@/types/opportunity.types'

const BASE = '/opportunities'

export const opportunityService = {
  async getAll(page = 1, pageSize = 100): Promise<PagedResult<OpportunityResponse>> {
    const { data } = await api.get<PagedResult<OpportunityResponse>>(BASE, {
      params: { page, pageSize },
    })
    return data
  },

  async getByCustomer(
    customerId: string,
    page = 1,
    pageSize = 100,
  ): Promise<PagedResult<OpportunityResponse>> {
    const { data } = await api.get<PagedResult<OpportunityResponse>>(
      `${BASE}/by-customer/${customerId}`,
      { params: { page, pageSize } },
    )
    return data
  },

  async getById(id: string): Promise<OpportunityResponse> {
    const { data } = await api.get<OpportunityResponse>(`${BASE}/${id}`)
    return data
  },

  async create(request: CreateOpportunityRequest): Promise<OpportunityResponse> {
    const { data } = await api.post<OpportunityResponse>(BASE, request)
    return data
  },

  async update(id: string, request: CreateOpportunityRequest): Promise<OpportunityResponse> {
    const { data } = await api.put<OpportunityResponse>(`${BASE}/${id}`, request)
    return data
  },

  async updateStage(
    id: string,
    request: UpdateOpportunityStageRequest,
  ): Promise<OpportunityResponse> {
    const { data } = await api.patch<OpportunityResponse>(
      `${BASE}/${id}/stage`,
      request,
    )
    return data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`${BASE}/${id}`)
  },
}