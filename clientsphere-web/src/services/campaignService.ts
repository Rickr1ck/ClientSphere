
import api from '@/lib/api'
import type { PagedResult }          from '@/types/api.types'
import type {
  CampaignResponse,
  CreateCampaignRequest,
  UpdateCampaignRequest,
} from '@/types/campaign.types'

const BASE = '/campaigns'

export const campaignService = {
  async getAll(page = 1, pageSize = 50): Promise<PagedResult<CampaignResponse>> {
    const { data } = await api.get<PagedResult<CampaignResponse>>(BASE, {
      params: { page, pageSize },
    })
    return data
  },

  async getById(id: string): Promise<CampaignResponse> {
    const { data } = await api.get<CampaignResponse>(`${BASE}/${id}`)
    return data
  },

  async create(request: CreateCampaignRequest): Promise<CampaignResponse> {
    const { data } = await api.post<CampaignResponse>(BASE, request)
    return data
  },

  async update(id: string, request: UpdateCampaignRequest): Promise<CampaignResponse> {
    const { data } = await api.put<CampaignResponse>(`${BASE}/${id}`, request)
    return data
  },

  async send(id: string): Promise<CampaignResponse> {
    const { data } = await api.post<CampaignResponse>(`${BASE}/${id}/send`)
    return data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`${BASE}/${id}`)
  },
}