// src/types/customer.types.ts
// Mirrors backend CustomerResponse, CreateCustomerRequest, UpdateCustomerRequest exactly

export interface CustomerResponse {
  id:                 string
  tenantId:           string
  companyName:        string
  industry:           string | null
  website:            string | null
  phone:              string | null
  billingAddressLine1:string | null
  billingAddressLine2:string | null
  billingCity:        string | null
  billingState:       string | null
  billingPostalCode:  string | null
  billingCountry:     string | null   // ISO 3166-1 alpha-2 e.g. "US"
  annualRevenue:      number | null   // NUMERIC(18,2)
  employeeCount:      number | null
  accountOwnerId:     string | null
  notes:              string | null
  createdAt:          string          // ISO 8601 from DateTimeOffset
  updatedAt:          string
}

export interface CreateCustomerRequest {
  companyName:        string
  industry:           string | null
  website:            string | null
  phone:              string | null
  billingAddressLine1:string | null
  billingAddressLine2:string | null
  billingCity:        string | null
  billingState:       string | null
  billingPostalCode:  string | null
  billingCountry:     string | null
  annualRevenue:      number | null
  employeeCount:      number | null
  accountOwnerId:     string | null
  notes:              string | null
}

export interface UpdateCustomerRequest extends CreateCustomerRequest {}

// Form state type — all fields as strings for controlled inputs
// Converted to numbers/nulls before sending to API
export interface CustomerFormValues {
  companyName:        string
  industry:           string
  website:            string
  phone:              string
  billingAddressLine1:string
  billingAddressLine2:string
  billingCity:        string
  billingState:       string
  billingPostalCode:  string
  billingCountry:     string
  annualRevenue:      string
  employeeCount:      string
  accountOwnerId:     string
  notes:              string
}

export const emptyCustomerForm: CustomerFormValues = {
  companyName:        '',
  industry:           '',
  website:            '',
  phone:              '',
  billingAddressLine1:'',
  billingAddressLine2:'',
  billingCity:        '',
  billingState:       '',
  billingPostalCode:  '',
  billingCountry:     '',
  annualRevenue:      '',
  employeeCount:      '',
  accountOwnerId:     '',
  notes:              '',
}

export interface CustomerFormErrors {
  companyName?:    string
  website?:        string
  billingCountry?: string
  annualRevenue?:  string
  employeeCount?:  string
}