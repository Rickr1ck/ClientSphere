// src/pages/customers/CustomerForm.tsx
import { useState, useEffect, type FormEvent } from 'react'
import type {
  CustomerResponse,
  CustomerFormValues,
  CustomerFormErrors,
  CreateCustomerRequest,
} from '@/types/customer.types'
import { emptyCustomerForm } from '@/types/customer.types'

interface CustomerFormProps {
  customer?:   CustomerResponse | null   // null = create mode, defined = edit mode
  onSubmit:    (values: CreateCustomerRequest) => Promise<void>
  onCancel:    () => void
  submitting:  boolean
}

// ── Validation ────────────────────────────────────────────────────────────────
function validate(values: CustomerFormValues): CustomerFormErrors {
  const errors: CustomerFormErrors = {}

  if (!values.companyName.trim())
    errors.companyName = 'Company name is required.'

  if (values.website && !/^https?:\/\/.+/.test(values.website))
    errors.website = 'Must be a valid URL starting with http:// or https://'

  if (values.billingCountry && values.billingCountry.trim().length !== 2)
    errors.billingCountry = 'Must be a 2-letter ISO country code (e.g. US, GB).'

  if (values.annualRevenue && isNaN(Number(values.annualRevenue)))
    errors.annualRevenue = 'Must be a valid number.'

  if (values.annualRevenue && Number(values.annualRevenue) < 0)
    errors.annualRevenue = 'Cannot be negative.'

  if (values.employeeCount && isNaN(Number(values.employeeCount)))
    errors.employeeCount = 'Must be a valid number.'

  if (values.employeeCount && Number(values.employeeCount) < 1)
    errors.employeeCount = 'Must be greater than 0.'

  return errors
}

// ── Convert form state → API request ─────────────────────────────────────────
function toRequest(values: CustomerFormValues): CreateCustomerRequest {
  const nullIfEmpty = (s: string) => s.trim() || null

  return {
    companyName:        values.companyName.trim(),
    industry:           nullIfEmpty(values.industry),
    website:            nullIfEmpty(values.website),
    phone:              nullIfEmpty(values.phone),
    billingAddressLine1:nullIfEmpty(values.billingAddressLine1),
    billingAddressLine2:nullIfEmpty(values.billingAddressLine2),
    billingCity:        nullIfEmpty(values.billingCity),
    billingState:       nullIfEmpty(values.billingState),
    billingPostalCode:  nullIfEmpty(values.billingPostalCode),
    billingCountry:     nullIfEmpty(values.billingCountry)?.toUpperCase() ?? null,
    annualRevenue:      values.annualRevenue ? Number(values.annualRevenue) : null,
    employeeCount:      values.employeeCount ? Number(values.employeeCount) : null,
    accountOwnerId:     nullIfEmpty(values.accountOwnerId),
    notes:              nullIfEmpty(values.notes),
  }
}

// ── Populate form from existing customer (edit mode) ─────────────────────────
function fromCustomer(customer: CustomerResponse): CustomerFormValues {
  return {
    companyName:        customer.companyName,
    industry:           customer.industry           ?? '',
    website:            customer.website             ?? '',
    phone:              customer.phone               ?? '',
    billingAddressLine1:customer.billingAddressLine1 ?? '',
    billingAddressLine2:customer.billingAddressLine2 ?? '',
    billingCity:        customer.billingCity         ?? '',
    billingState:       customer.billingState        ?? '',
    billingPostalCode:  customer.billingPostalCode   ?? '',
    billingCountry:     customer.billingCountry      ?? '',
    annualRevenue:      customer.annualRevenue != null
                          ? String(customer.annualRevenue)
                          : '',
    employeeCount:      customer.employeeCount != null
                          ? String(customer.employeeCount)
                          : '',
    accountOwnerId:     customer.accountOwnerId ?? '',
    notes:              customer.notes          ?? '',
  }
}

// ── Reusable field components ─────────────────────────────────────────────────
interface FieldProps {
  id:           string
  label:        string
  value:        string
  onChange:     (v: string) => void
  error?:       string
  placeholder?: string
  type?:        string
  hint?:        string
  required?:    boolean
  maxLength?:   number
}

function Field({
  id, label, value, onChange, error,
  placeholder = '', type = 'text', hint, required, maxLength,
}: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-gray-600 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`
          w-full h-9 px-3 rounded-lg border text-sm text-gray-900
          placeholder:text-gray-400 transition-shadow
          focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent
          ${error ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}
        `}
      />
      {hint && !error && (
        <p className="text-xs text-gray-400 mt-1">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CustomerForm({
  customer,
  onSubmit,
}: CustomerFormProps) {
  const [values, setValues] = useState<CustomerFormValues>(
    customer ? fromCustomer(customer) : emptyCustomerForm
  )
  const [errors, setErrors] = useState<CustomerFormErrors>({})

  // Re-populate when customer changes (switching between edit targets)
  useEffect(() => {
    setValues(customer ? fromCustomer(customer) : emptyCustomerForm)
    setErrors({})
  }, [customer])

  const set = (field: keyof CustomerFormValues) => (value: string) => {
    setValues(v => ({ ...v, [field]: value }))
    if (errors[field as keyof CustomerFormErrors]) {
      setErrors(e => { const n = { ...e }; delete n[field as keyof CustomerFormErrors]; return n })
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const errs = validate(values)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    await onSubmit(toRequest(values))
  }

  return (
    <form id="customer-form" onSubmit={handleSubmit} noValidate>
      <div className="space-y-5">

        {/* Company details */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Company details
          </p>
          <div className="grid grid-cols-1 gap-4">
            <Field
              id="companyName"
              label="Company name"
              value={values.companyName}
              onChange={set('companyName')}
              error={errors.companyName}
              placeholder="Acme Corporation"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Field
                id="industry"
                label="Industry"
                value={values.industry}
                onChange={set('industry')}
                placeholder="Technology"
              />
              <Field
                id="phone"
                label="Phone"
                value={values.phone}
                onChange={set('phone')}
                placeholder="+1 555 000 0000"
                type="tel"
              />
            </div>
            <Field
              id="website"
              label="Website"
              value={values.website}
              onChange={set('website')}
              error={errors.website}
              placeholder="https://acme.com"
              type="url"
            />
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Billing address */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Billing address
          </p>
          <div className="grid grid-cols-1 gap-4">
            <Field
              id="billingAddressLine1"
              label="Address line 1"
              value={values.billingAddressLine1}
              onChange={set('billingAddressLine1')}
              placeholder="123 Main St"
            />
            <Field
              id="billingAddressLine2"
              label="Address line 2"
              value={values.billingAddressLine2}
              onChange={set('billingAddressLine2')}
              placeholder="Suite 400"
            />
            <div className="grid grid-cols-2 gap-4">
              <Field
                id="billingCity"
                label="City"
                value={values.billingCity}
                onChange={set('billingCity')}
                placeholder="San Francisco"
              />
              <Field
                id="billingState"
                label="State / Province"
                value={values.billingState}
                onChange={set('billingState')}
                placeholder="CA"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field
                id="billingPostalCode"
                label="Postal code"
                value={values.billingPostalCode}
                onChange={set('billingPostalCode')}
                placeholder="94105"
              />
              <Field
                id="billingCountry"
                label="Country (ISO-2)"
                value={values.billingCountry}
                onChange={set('billingCountry')}
                error={errors.billingCountry}
                placeholder="US"
                maxLength={2}
                hint="Two-letter code e.g. US, GB, DE"
              />
            </div>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Financials */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Financials
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Field
              id="annualRevenue"
              label="Annual revenue (PHP)"
              value={values.annualRevenue}
              onChange={set('annualRevenue')}
              error={errors.annualRevenue}
              placeholder="0.00"
              type="number"
            />
            <Field
              id="employeeCount"
              label="Employee count"
              value={values.employeeCount}
              onChange={set('employeeCount')}
              error={errors.employeeCount}
              placeholder="250"
              type="number"
            />
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-xs font-medium text-gray-600 mb-1.5">
            Notes
          </label>
          <textarea
            id="notes"
            value={values.notes}
            onChange={e => set('notes')(e.target.value)}
            placeholder="Any additional context about this customer…"
            rows={3}
            className="
              w-full px-3 py-2 rounded-lg border border-gray-200
              text-sm text-gray-900 placeholder:text-gray-400
              focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent
              resize-none transition-shadow
            "
          />
        </div>

      </div>
    </form>
  )
}

// Export the submit trigger id so CustomersPage can submit via form id
export const CUSTOMER_FORM_ID = 'customer-form'