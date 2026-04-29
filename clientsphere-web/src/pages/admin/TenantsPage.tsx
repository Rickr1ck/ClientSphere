// src/pages/admin/TenantsPage.tsx
import { useState, useEffect } from 'react'
import api from '@/lib/api'
import Spinner from '@/components/ui/Spinner'

interface Tenant {
  id: string
  name: string
  slug: string
  status: 'PendingPayment' | 'Active' | 'Disabled' | 'Trialing'
  subscriptionTier: string
  createdAt: string
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTenants = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/tenants')
      setTenants(data.items)
    } catch (err: any) {
      setError('Failed to fetch tenants')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTenants()
  }, [])

  const updateStatus = async (tenantId: string, newStatus: string) => {
    try {
      await api.patch(`/admin/tenants/${tenantId}/status`, { status: newStatus })
      setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, status: newStatus as any } : t))
    } catch (err: any) {
      alert('Failed to update tenant status')
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (error) return <div className="text-center py-20 text-red-600">{error}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tenant Management</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tenant</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Slug</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created At</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tenants.map(tenant => (
              <tr key={tenant.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                  <div className="text-xs text-gray-500">{tenant.subscriptionTier}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{tenant.slug}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    tenant.status === 'Active' ? 'bg-green-100 text-green-800' :
                    tenant.status === 'Trialing' ? 'bg-blue-100 text-blue-800' :
                    tenant.status === 'Disabled' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {tenant.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(tenant.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  {tenant.status === 'Disabled' ? (
                    <button
                      onClick={() => updateStatus(tenant.id, 'Active')}
                      className="text-xs font-semibold text-brand-600 hover:text-brand-800"
                    >
                      Enable
                    </button>
                  ) : (
                    <button
                      onClick={() => updateStatus(tenant.id, 'Disabled')}
                      className="text-xs font-semibold text-red-600 hover:text-red-800"
                    >
                      Disable
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
