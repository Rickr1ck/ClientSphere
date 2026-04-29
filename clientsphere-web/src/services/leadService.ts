
import api from '@/lib/api'
import type { PagedResult } from '@/types/api.types'
import type { LeadResponse, CreateLeadRequest, UpdateLeadRequest } from '@/types/lead.types'

const BASE = '/leads'

export const leadService = {
  async getAll(page = 1, pageSize = 20): Promise<PagedResult<LeadResponse>> {
    const { data } = await api.get<PagedResult<LeadResponse>>(BASE, {
      params: { page, pageSize },
    })
    return data
  },

  async getById(id: string): Promise<LeadResponse> {
    const { data } = await api.get<LeadResponse>(`${BASE}/${id}`)
    return data
  },

  async create(request: CreateLeadRequest): Promise<LeadResponse> {
    const { data } = await api.post<LeadResponse>(BASE, request)
    return data
  },

  async update(id: string, request: UpdateLeadRequest): Promise<LeadResponse> {
    const { data } = await api.put<LeadResponse>(`${BASE}/${id}`, request)
    return data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`${BASE}/${id}`)
  },
}