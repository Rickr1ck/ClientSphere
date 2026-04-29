// src/types/auth.types.ts
export interface LoginRequest {
  email:    string
  password: string
  tenantId: string
}

export interface RegisterTenantRequest {
  tenantName:     string
  tenantSlug:     string
  adminFirstName: string
  adminLastName:  string
  adminEmail:     string
  adminPassword:  string
}

export interface AuthResponse {
  accessToken:      string
  tokenType:        string
  expiresInSeconds: number
  userId:           string
  tenantId:         string
  email:            string
  fullName:         string
  role:             string
  tenantStatus:     string
  requiresPayment:  boolean
}