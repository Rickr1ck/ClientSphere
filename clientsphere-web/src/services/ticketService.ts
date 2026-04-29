
import api from '@/lib/api'
import type { PagedResult }             from '@/types/api.types'
import type {
  TicketResponse,
  CreateTicketRequest,
  UpdateTicketStatusRequest,
} from '@/types/ticket.types'

const BASE = '/tickets'

export const ticketService = {
  async getAll(page = 1, pageSize = 50): Promise<PagedResult<TicketResponse>> {
    const { data } = await api.get<PagedResult<TicketResponse>>(BASE, {
      params: { page, pageSize },
    })
    return data
  },

  async getByCustomer(
    customerId: string,
    page = 1,
    pageSize = 50,
  ): Promise<PagedResult<TicketResponse>> {
    const { data } = await api.get<PagedResult<TicketResponse>>(
      `${BASE}/by-customer/${customerId}`,
      { params: { page, pageSize } },
    )
    return data
  },

  async getById(id: string): Promise<TicketResponse> {
    const { data } = await api.get<TicketResponse>(`${BASE}/${id}`)
    return data
  },

  async create(request: CreateTicketRequest): Promise<TicketResponse> {
    const { data } = await api.post<TicketResponse>(BASE, request)
    return data
  },

  async update(id: string, request: CreateTicketRequest): Promise<TicketResponse> {
    const { data } = await api.put<TicketResponse>(`${BASE}/${id}`, request)
    return data
  },

  async updateStatus(
    id: string,
    request: UpdateTicketStatusRequest,
  ): Promise<TicketResponse> {
    const { data } = await api.patch<TicketResponse>(
      `${BASE}/${id}/status`,
      request,
    )
    return data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`${BASE}/${id}`)
  },
}