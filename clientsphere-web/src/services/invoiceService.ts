
import api from '@/lib/api'
import type { PagedResult }          from '@/types/api.types'
import type {
  InvoiceResponse,
  GenerateInvoiceFromOpportunityRequest,
} from '@/types/invoice.types'

const BASE = '/invoices'

export const invoiceService = {
  async getAll(page = 1, pageSize = 50): Promise<PagedResult<InvoiceResponse>> {
    const { data } = await api.get<PagedResult<InvoiceResponse>>(BASE, {
      params: { page, pageSize },
    })
    return data
  },

  async getByCustomer(
    customerId: string,
    page = 1,
    pageSize = 50,
  ): Promise<PagedResult<InvoiceResponse>> {
    const { data } = await api.get<PagedResult<InvoiceResponse>>(
      `${BASE}/by-customer/${customerId}`,
      { params: { page, pageSize } },
    )
    return data
  },

  async getById(id: string): Promise<InvoiceResponse> {
    const { data } = await api.get<InvoiceResponse>(`${BASE}/${id}`)
    return data
  },

  async generateFromOpportunity(
    opportunityId: string,
    request: GenerateInvoiceFromOpportunityRequest,
  ): Promise<InvoiceResponse> {
    const { data } = await api.post<InvoiceResponse>(
      `${BASE}/generate-from-opportunity/${opportunityId}`,
      request,
    )
    return data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`${BASE}/${id}`)
  },
}