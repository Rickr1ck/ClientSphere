
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AuthResponse } from '@/types/auth.types'
import type { RbacRole } from '@/types/user.types'

interface AuthState {
  token:    string | null
  userId:   string | null
  tenantId: string | null
  email:    string | null
  fullName: string | null
  role:     RbacRole | null
  tenantStatus: string | null
  requiresPayment: boolean

  // Actions
  setSession: (response: AuthResponse) => void
  clearSession: () => void
  isAuthenticated: () => boolean
  hasRole: (roles: RbacRole[]) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token:    null,
      userId:   null,
      tenantId: null,
      email:    null,
      fullName: null,
      role:     null,
      tenantStatus: null,
      requiresPayment: false,

      setSession: (response: AuthResponse) => {
        set({
          token:    response.accessToken,
          userId:   response.userId,
          tenantId: response.tenantId,
          email:    response.email,
          fullName: response.fullName,
          role:     response.role as RbacRole,
          tenantStatus: response.tenantStatus,
          requiresPayment: response.requiresPayment,
        })
      },

      clearSession: () => {
        set({
          token:    null,
          userId:   null,
          tenantId: null,
          email:    null,
          fullName: null,
          role:     null,
          tenantStatus: null,
          requiresPayment: false,
        })
      },

      isAuthenticated: () => {
        return Boolean(get().token)
      },

      hasRole: (roles: RbacRole[]) => {
        const current = get().role
        if (!current) return false
        return roles.includes(current)
      },
    }),
    {
      name:    'clientsphere-auth',      // localStorage key — must match getToken() in api.ts
      storage: createJSONStorage(() => localStorage),
      // Only persist these fields — never persist derived/computed state
      partialize: (state) => ({
        token:    state.token,
        userId:   state.userId,
        tenantId: state.tenantId,
        email:    state.email,
        fullName: state.fullName,
        role:     state.role,
        tenantStatus: state.tenantStatus,
        requiresPayment: state.requiresPayment,
      }),
    },
  ),
)