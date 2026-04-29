// src/pages/RegisterTenantPage.tsx
import { useState, type FormEvent, type ChangeEvent, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import logo from '@/assets/LogoWithName.png'
import { authService } from '@/services/authService'
import type { AxiosError } from 'axios'
import type { ValidationProblemDetails } from '@/types/api.types'

interface FormState {
  tenantName:     string
  tenantSlug:     string
  adminFirstName: string
  adminLastName:  string
  adminEmail:     string
  adminPassword:  string
  confirmPassword:string
}

const initialForm: FormState = {
  tenantName:      '',
  tenantSlug:      '',
  adminFirstName:  '',
  adminLastName:   '',
  adminEmail:      '',
  adminPassword:   '',
  confirmPassword: '',
}

export default function RegisterTenantPage() {
  const [searchParams] = useSearchParams()

  // Get plan from URL query parameter
  const selectedPlan = searchParams.get('plan') || 'starter'
  const canceled = searchParams.get('canceled')

  const [form,    setForm]    = useState<FormState>(initialForm)
  const [errors,  setErrors]  = useState<Record<string, string>>({})
  const [apiError,setApiError]= useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState(selectedPlan)

  // Show cancellation message if user was redirected from Stripe
  useEffect(() => {
    if (canceled) {
      setApiError('Payment was canceled. Please try again.')
    }
  }, [canceled])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))

    // Auto-generate slug from workspace name
    if (name === 'tenantName') {
      const slug = value
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
      setForm(f => ({ ...f, tenantName: value, tenantSlug: slug }))
    }

    // Clear field error on change
    if (errors[name]) {
      setErrors(e => { const n = { ...e }; delete n[name]; return n })
    }
  }

  const validate = (): boolean => {
    const e: Record<string, string> = {}

    if (!form.tenantName.trim())     e.tenantName     = 'Workspace name is required'
    if (!form.tenantSlug.trim())     e.tenantSlug     = 'Workspace slug is required'
    if (!/^[a-z0-9-]+$/.test(form.tenantSlug))
      e.tenantSlug = 'Slug may only contain lowercase letters, numbers, and hyphens'
    if (!form.adminFirstName.trim()) e.adminFirstName = 'First name is required'
    if (!form.adminLastName.trim())  e.adminLastName  = 'Last name is required'
    if (!form.adminEmail.trim())     e.adminEmail     = 'Email is required'
    if (form.adminPassword.length < 12)
      e.adminPassword = 'Password must be at least 12 characters'
    if (form.adminPassword !== form.confirmPassword)
      e.confirmPassword = 'Passwords do not match'

    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setApiError(null)
    if (!validate()) return

    setLoading(true)
    try {
      // Step 1: Pre-register and get token
      const preRegResponse = await authService.registerWithPlan({
        tenantName:     form.tenantName.trim(),
        tenantSlug:     form.tenantSlug.trim(),
        adminFirstName: form.adminFirstName.trim(),
        adminLastName:  form.adminLastName.trim(),
        adminEmail:     form.adminEmail.trim(),
        adminPassword:  form.adminPassword,
        planId:         selectedPlanId,
      })

      // Step 2: Redirect to Stripe checkout
      const checkoutResponse = await authService.initiateCheckout(preRegResponse.preRegistrationToken)
      
      // Redirect to Stripe
      window.location.href = checkoutResponse.url
    } catch (err) {
      const axiosError = err as AxiosError<ValidationProblemDetails>
      const data = axiosError.response?.data

      if (data?.errors) {
        // Map server validation errors to field errors
        const mapped: Record<string, string> = {}
        for (const [key, msgs] of Object.entries(data.errors)) {
          const fieldName = key.charAt(0).toLowerCase() + key.slice(1)
          mapped[fieldName] = msgs[0] ?? 'Invalid value'
        }
        setErrors(mapped)
      } else {
        setApiError(data?.detail ?? 'Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const field = (
    id:          keyof FormState,
    label:       string,
    type:        string = 'text',
    placeholder: string = '',
    hint?:       string,
  ) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={form[id]}
        onChange={handleChange}
        placeholder={placeholder}
        autoComplete={type === 'password' ? 'new-password' : undefined}
        className={`
          w-full h-10 px-3 rounded-lg border text-sm text-gray-900
          placeholder:text-gray-400 transition-shadow
          focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent
          ${errors[id] ? 'border-red-300 bg-red-50' : 'border-gray-200'}
        `}
      />
      {hint && !errors[id] && (
        <p className="text-xs text-gray-400 mt-1">{hint}</p>
      )}
      {errors[id] && (
        <p className="text-xs text-red-600 mt-1">{errors[id]}</p>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="ClientSphere" className="h-16 w-auto" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900">Create your workspace</h1>
            <p className="text-sm text-gray-500 mt-1">
              Set up your enterprise CRM workspace and admin account
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Plan Selection */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Select Plan
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'starter', name: 'Starter', price: '$29/mo' },
                  { id: 'professional', name: 'Professional', price: '$79/mo' },
                  { id: 'enterprise', name: 'Enterprise', price: '$199/mo' },
                ].map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      selectedPlanId === plan.id
                        ? 'border-brand-600 bg-brand-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-semibold text-gray-900">{plan.name}</div>
                    <div className="text-xs text-gray-600">{plan.price}</div>
                  </button>
                ))}
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Workspace section */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Workspace
              </p>
              <div className="space-y-4">
                {field('tenantName', 'Workspace name', 'text', 'Acme Corporation')}
                {field(
                  'tenantSlug',
                  'Workspace URL slug',
                  'text',
                  'acme-corporation',
                  'Lowercase letters, numbers, and hyphens only',
                )}
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Admin section */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Admin account
              </p>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {field('adminFirstName', 'First name', 'text', 'Ada')}
                  {field('adminLastName',  'Last name',  'text', 'Lovelace')}
                </div>
                {field('adminEmail',    'Email address', 'email', 'ada@acme.com')}
                {field('adminPassword', 'Password',      'password', '••••••••••••',
                  'At least 12 characters with uppercase, lowercase, number, and symbol')}
                {field('confirmPassword', 'Confirm password', 'password', '••••••••••••')}
              </div>
            </div>

            {apiError && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-100">
                <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-700">{apiError}</p>
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
                  Creating workspace…
                </>
              ) : (
                'Create workspace'
              )}
            </button>
          </form>

          <p className="text-sm text-gray-500 text-center mt-6">
            Already have a workspace?{' '}
            <Link to="/login" className="text-brand-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-xs text-gray-400 text-center mt-4">
          14-day free trial · No credit card required
        </p>
      </div>
    </div>
  )
}