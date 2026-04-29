// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import ProtectedRoute      from '@/components/ProtectedRoute'
import EnterpriseLayout    from '@/components/layout/EnterpriseLayout'
import LoginPage           from '@/pages/LoginPage'
import RegisterTenantPage  from '@/pages/RegisterTenantPage'
import PricingPage         from '@/pages/PricingPage'
import StripeSuccessPage   from '@/pages/StripeSuccessPage'
import LandingPage         from '@/pages/LandingPage'
import DashboardPage       from '@/pages/dashboard/DashboardPage'
import CustomersPage from '@/pages/customers/CustomersPage'
import LeadsPage    from '@/pages/leads/LeadsPage'
import PipelinePage from '@/pages/pipeline/PipelinePage'
import TicketsPage  from '@/pages/tickets/TicketsPage'
import CampaignsPage from '@/pages/marketing/CampaignsPage'
import InvoicesPage  from '@/pages/invoices/InvoicesPage'
import UsersPage     from '@/pages/users/UsersPage'
import BillingRequiredPage from '@/pages/BillingRequiredPage'
import TenantDisabledPage from '@/pages/TenantDisabledPage'
import TenantsPage from '@/pages/admin/TenantsPage'
import { ACCESS_MAP } from '@/lib/permissions'
import type { RbacRole } from '@/types/user.types'

// Helper to get roles for a module
const getRolesForModule = (module: string): RbacRole[] => {
  return (Object.keys(ACCESS_MAP) as RbacRole[]).filter(role => 
    ACCESS_MAP[role].includes(module)
  )
}

export default function App() {
  useEffect(() => {
    const initialLoading = document.getElementById('initial-loading');
    if (initialLoading) {
      console.log('App.tsx: Removing initial loading message');
      initialLoading.remove();
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>

        {/* Public routes */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterTenantPage />} />
        <Route path="/pricing"  element={<PricingPage />} />
        <Route path="/stripe-success" element={<StripeSuccessPage />} />
        <Route path="/disabled" element={<TenantDisabledPage />} />

        {/* Protected routes — requires valid JWT */}
        <Route element={<ProtectedRoute />}>
          <Route path="/billing" element={<BillingRequiredPage />} />
          
          <Route element={<EnterpriseLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            
            <Route element={<ProtectedRoute allowedRoles={getRolesForModule('customers')} />}>
              <Route path="/customers" element={<CustomersPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={getRolesForModule('leads')} />}>
              <Route path="/leads"     element={<LeadsPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={getRolesForModule('pipeline')} />}>
              <Route path="/pipeline"  element={<PipelinePage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={getRolesForModule('tickets')} />}>
              <Route path="/tickets"   element={<TicketsPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={getRolesForModule('marketing')} />}>
              <Route path="/marketing" element={<CampaignsPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={getRolesForModule('billing')} />}>
              <Route path="/invoices"   element={<InvoicesPage />}  />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={getRolesForModule('users')} />}>
              <Route path="/users"     element={<UsersPage />}     />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={getRolesForModule('tenants')} />}>
              <Route path="/admin/tenants" element={<TenantsPage />} />
            </Route>
          </Route>
        </Route>

        {/* Default redirect */}
        <Route path="/"   element={<LandingPage />} />
        <Route path="*"   element={<Navigate to="/dashboard" replace />} />

      </Routes>
    </BrowserRouter>
  )
}
