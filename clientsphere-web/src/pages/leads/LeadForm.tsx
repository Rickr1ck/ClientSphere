import { useState, useEffect, type FormEvent } from 'react'
import type { LeadResponse, CreateLeadRequest } from '@/types/lead.types'

interface LeadFormProps {
  lead?:        LeadResponse
  onSubmit:     (values: CreateLeadRequest) => Promise<void>
  onCancel:     () => void
  submitting?:  boolean
}

interface LeadFormValues {
  firstName:    string
  lastName:     string
  email:        string
  phone:        string
  companyName:  string
  jobTitle:     string
  source:       string
  notes:        string
  estimatedValue: string
  assignedToId: string
}

const emptyForm: LeadFormValues = {
  firstName:    '',
  lastName:     '',
  email:        '',
  phone:        '',
  companyName:  '',
  jobTitle:     '',
  source:       '',
  notes:        '',
  estimatedValue: '',
  assignedToId: '',
}

function fromLead(lead: LeadResponse): LeadFormValues {
  return {
    firstName:     lead.firstName,
    lastName:      lead.lastName,
    email:         lead.email ?? '',
    phone:         lead.phone ?? '',
    companyName:   lead.companyName ?? '',
    jobTitle:      lead.jobTitle ?? '',
    source:        lead.source ?? '',
    notes:         lead.notes ?? '',
    estimatedValue: lead.estimatedValue?.toString() ?? '',
    assignedToId:  lead.assignedToId ?? '',
  }
}

interface FieldProps {
  id:       string
  label:    string
  value:    string
  onChange: (v: string) => void
  error?:   string
  type?:    string
  placeholder?: string
  hint?:    string
  required?: boolean
  maxLength?: number
}

function Field({ id, label, value, onChange, error, type = 'text', placeholder, hint, required, maxLength }: FieldProps) {
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
      {hint && !error && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}

interface TextareaProps {
  id:          string
  label:       string
  value:       string
  onChange:    (v: string) => void
  error?:      string
  placeholder?: string
  hint?:       string
  rows?:       number
}

function Textarea({ id, label, value, onChange, error, placeholder, hint, rows = 3 }: TextareaProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      <textarea
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`
          w-full px-3 py-2 rounded-lg border text-sm text-gray-900
          placeholder:text-gray-400 transition-shadow resize-none
          focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent
          ${error ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}
        `}
      />
      {hint && !error && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}

type Errors = Partial<Record<keyof LeadFormValues, string>>

function validate(v: LeadFormValues): Errors {
  const errors: Errors = {}
  if (!v.firstName.trim()) errors.firstName = 'First name is required.'
  if (!v.lastName.trim()) errors.lastName = 'Last name is required.'
  if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email))
    errors.email = 'Enter a valid email address.'
  if (v.estimatedValue && isNaN(Number(v.estimatedValue)))
    errors.estimatedValue = 'Must be a number.'
  return errors
}

export default function LeadForm({ lead, onSubmit }: LeadFormProps) {
  const [values, setValues] = useState<LeadFormValues>(lead ? fromLead(lead) : emptyForm)
  const [errors, setErrors] = useState<Errors>({})

  useEffect(() => {
    setValues(lead ? fromLead(lead) : emptyForm)
    setErrors({})
  }, [lead])

  const set = (field: keyof LeadFormValues) => (value: string) => {
    setValues(v => ({ ...v, [field]: value }))
    if (errors[field]) {
      setErrors(e => { const n = { ...e }; delete n[field]; return n })
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const errs = validate(values)
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    await onSubmit({
      firstName:     values.firstName.trim(),
      lastName:      values.lastName.trim(),
      email:         values.email.trim() || null,
      phone:         values.phone.trim() || null,
      companyName:   values.companyName.trim() || null,
      jobTitle:      values.jobTitle.trim() || null,
      source:        values.source.trim() || null,
      notes:         values.notes.trim() || null,
      estimatedValue: values.estimatedValue ? Number(values.estimatedValue) : null,
      assignedToId:  values.assignedToId.trim() || null,
    })
  }

  return (
    <form id="lead-form" onSubmit={handleSubmit} noValidate>
      <div className="space-y-5">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Contact details</p>
          <div className="grid grid-cols-2 gap-4">
            <Field
              id="firstName" label="First name" value={values.firstName}
              onChange={set('firstName')} error={errors.firstName}
              placeholder="John" required
            />
            <Field
              id="lastName" label="Last name" value={values.lastName}
              onChange={set('lastName')} error={errors.lastName}
              placeholder="Doe" required
            />
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Field
              id="email" label="Email" value={values.email}
              onChange={set('email')} error={errors.email}
              placeholder="john@example.com" type="email"
            />
            <Field
              id="phone" label="Phone" value={values.phone}
              onChange={set('phone')} placeholder="+1 555 000 0000" type="tel"
            />
          </div>
        </div>

        <hr className="border-gray-100" />

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Company</p>
          <div className="grid grid-cols-2 gap-4">
            <Field
              id="companyName" label="Company name" value={values.companyName}
              onChange={set('companyName')} placeholder="Acme Corp"
            />
            <Field
              id="jobTitle" label="Job title" value={values.jobTitle}
              onChange={set('jobTitle')} placeholder="VP of Sales"
            />
          </div>
          <div className="mt-4">
            <Field
              id="source" label="Lead source" value={values.source}
              onChange={set('source')} placeholder="Website, Referral, Trade Show…"
            />
          </div>
        </div>

        <hr className="border-gray-100" />

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Valuation</p>
          <div className="grid grid-cols-2 gap-4">
            <Field
              id="estimatedValue" label="Estimated value" value={values.estimatedValue}
              onChange={set('estimatedValue')} error={errors.estimatedValue}
              placeholder="50000" type="number"
              hint="Expected revenue in PHP"
            />
          </div>
        </div>

        <hr className="border-gray-100" />

        <div>
          <Textarea
            id="notes" label="Notes" value={values.notes}
            onChange={set('notes')} placeholder="Any additional context about this lead…"
          />
        </div>
      </div>
    </form>
  )
}

export const LEAD_FORM_ID = 'lead-form'
