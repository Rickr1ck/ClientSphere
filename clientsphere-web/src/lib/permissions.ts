import type { RbacRole } from '@/types/user.types'

export const ACCESS_MAP: Record<RbacRole, string[]> = {
  SuperAdmin: ['dashboard', 'users', 'customers', 'pipeline', 'tickets', 'marketing', 'billing', 'leads', 'tenants'],
  TenantAdmin: ['dashboard', 'users', 'customers', 'pipeline', 'tickets', 'marketing', 'billing', 'leads'],
  SalesManager: ['dashboard', 'customers', 'pipeline', 'leads'],
  SalesRep: ['dashboard', 'customers', 'pipeline', 'leads'],
  SupportAgent: ['dashboard', 'customers', 'tickets'],
  MarketingManager: ['dashboard', 'marketing'],
  ReadOnly: ['dashboard'],
}

export function canAccess(role: RbacRole | null, module: string): boolean {
  if (!role) return false
  return ACCESS_MAP[role]?.includes(module) ?? false
}
