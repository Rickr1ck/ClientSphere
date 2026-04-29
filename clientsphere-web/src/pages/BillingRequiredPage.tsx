// src/pages/BillingRequiredPage.tsx
import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'

export default function BillingRequiredPage() {
  const { tenantId, clearSession } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCheckout = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.post('/billing/checkout', { tenantId })
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to initiate checkout. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Subscription Required</h1>
        <p className="text-gray-600 mb-8">
          Your workspace is currently pending payment. Please complete your subscription to access all features.
        </p>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full h-11 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Subscribe Now'
            )}
          </button>
          
          <button
            onClick={() => clearSession()}
            className="w-full h-11 bg-white text-gray-600 font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  )
}
