// src/types/invoice.types.ts
export type InvoiceStatus =
  | 'Draft'
  | 'Sent'
  | 'Paid'
  | 'Void'
  | 'Uncollectible'

export interface InvoiceResponse {
  id:                 string
  tenantId:           string
  invoiceNumber:      string
  customerId:         string
  opportunityId:      string | null
  status:             InvoiceStatus
  issueDate:          string    // DateOnly — "YYYY-MM-DD"
  dueDate:            string
  paidAt:             string | null
  subtotal:           number
  discountAmount:     number
  taxRate:            number    // 0–1 e.g. 0.0850
  taxAmount:          number
  totalAmount:        number
  currencyCode:       string    // ISO 4217
  stripeInvoiceId:    string | null
  stripePaymentIntent:string | null
  notes:              string | null
  createdAt:          string
  updatedAt:          string
}

export interface GenerateInvoiceFromOpportunityRequest {
  issueDate:    string   // "YYYY-MM-DD"
  dueDate:      string
  taxRate:      number
  currencyCode: string
}

export interface GenerateInvoiceFormValues {
  issueDate:    string
  dueDate:      string
  taxRate:      string
  currencyCode: string
}

export const defaultGenerateForm = (): GenerateInvoiceFormValues => {
  const today   = new Date()
  const in30    = new Date(today)
  in30.setDate(in30.getDate() + 30)
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  return {
    issueDate:    fmt(today),
    dueDate:      fmt(in30),
    taxRate:      '0',
    currencyCode: 'PHP',
  }
}

export interface GenerateInvoiceFormErrors {
  issueDate?:    string
  dueDate?:      string
  taxRate?:      string
  currencyCode?: string
}