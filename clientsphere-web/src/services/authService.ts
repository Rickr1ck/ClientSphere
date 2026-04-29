
import api from '@/lib/api'
import type { AuthResponse, LoginRequest, RegisterTenantRequest } from '@/types/auth.types'

export interface RegisterWithPlanRequest {
  tenantName: string
  tenantSlug: string
  adminFirstName: string
  adminLastName: string
  adminEmail: string
  adminPassword: string
  planId: string
}

export interface PreRegistrationResponse {
  preRegistrationToken: string
  checkoutUrl: string
}

export const authService = {
  async login(request: LoginRequest): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', request)
    return data
  },

  async registerTenant(request: RegisterTenantRequest): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register', request)
    return data
  },

  async registerWithPlan(request: RegisterWithPlanRequest): Promise<PreRegistrationResponse> {
    const { data } = await api.post<PreRegistrationResponse>('/auth/register-with-plan', request)
    return data
  },

  async initiateCheckout(preRegToken: string): Promise<{ url: string; sessionId: string }> {
    const { data } = await api.post<{ url: string; sessionId: string }>(
      `/billing/checkout?preRegToken=${preRegToken}`
    )
    return data
  },
}