// src/pages/LoginPage.tsx
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import logo from '@/assets/LogoWithName.png'
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/authService'
import type { AxiosError } from 'axios'
import type { ValidationProblemDetails } from '@/types/api.types'

export default function LoginPage() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const setSession = useAuthStore(s => s.setSession)

  const from = (location.state as { from?: Location })?.from?.pathname ?? '/dashboard'

  const [form, setForm] = useState({
    email:    '',
    password: '',
    tenantId: '',
  })
  const [error,   setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await authService.login({
        email:    form.email.trim(),
        password: form.password,
        tenantId: form.tenantId.trim(),
      })
      setSession(response)
      if (response.requiresPayment) {
        navigate('/billing', { replace: true })
      } else {
        navigate(from, { replace: true })
      }
    } catch (err) {
      const axiosError = err as AxiosError<ValidationProblemDetails>
      const detail = axiosError.response?.data?.detail
      setError(detail ?? 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="ClientSphere" className="h-16 w-auto" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900">Sign in to your workspace</h1>
            <p className="text-sm text-gray-500 mt-1">Enter your workspace ID and credentials below</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            <div>
              <label htmlFor="tenantId" className="block text-sm font-medium text-gray-700 mb-1.5">
                Workspace ID
              </label>
              <input
                id="tenantId"
                type="text"
                required
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={form.tenantId}
                onChange={e => setForm(f => ({ ...f, tenantId: e.target.value }))}
                className="
                  w-full h-10 px-3 rounded-lg border border-gray-200 text-sm
                  text-gray-900 placeholder:text-gray-400
                  focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent
                  transition-shadow font-mono
                "
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="
                  w-full h-10 px-3 rounded-lg border border-gray-200 text-sm
                  text-gray-900 placeholder:text-gray-400
                  focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent
                  transition-shadow
                "
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="
                  w-full h-10 px-3 rounded-lg border border-gray-200 text-sm
                  text-gray-900 placeholder:text-gray-400
                  focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent
                  transition-shadow
                "
              />
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-100">
                <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="
                w-full h-10 rounded-lg bg-brand-600 text-white text-sm font-medium
                hover:bg-brand-800 active:scale-[0.98]
                disabled:opacity-60 disabled:cursor-not-allowed
                transition-all duration-150 flex items-center justify-center gap-2
              "
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <p className="text-sm text-gray-500 text-center mt-6">
            New to ClientSphere?{' '}
            <Link to="/register" className="text-brand-600 font-medium hover:underline">
              Create a workspace
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}