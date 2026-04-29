// src/services/customerService.ts
import api from '@/lib/api'
import type { PagedResult } from '@/types/api.types'
import type {
  CustomerResponse,
  CreateCustomerRequest,
  UpdateCustomerRequest,
} from '@/types/customer.types'

const BASE = '/customers'

export const customerService = {
  async getAll(page = 1, pageSize = 20): Promise<PagedResult<CustomerResponse>> {
    const { data } = await api.get<PagedResult<CustomerResponse>>(BASE, {
      params: { page, pageSize },
    })
    return data
  },

  async getById(id: string): Promise<CustomerResponse> {
    const { data } = await api.get<CustomerResponse>(`${BASE}/${id}`)
    return data
  },

  async create(request: CreateCustomerRequest): Promise<CustomerResponse> {
    const { data } = await api.post<CustomerResponse>(BASE, request)
    return data
  },

  async update(id: string, request: UpdateCustomerRequest): Promise<CustomerResponse> {
    const { data } = await api.put<CustomerResponse>(`${BASE}/${id}`, request)
    return data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`${BASE}/${id}`)
  },
}