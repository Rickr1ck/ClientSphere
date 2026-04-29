import { useState, useEffect, type FormEvent } from 'react'
import type { OpportunityResponse, CreateOpportunityRequest, OpportunityStage } from '@/types/opportunity.types'

interface OpportunityFormProps {
  opportunity?:  OpportunityResponse
  onSubmit:      (values: CreateOpportunityRequest) => Promise<void>
  onCancel:      () => void
  submitting?:   boolean
}

interface OpportunityFormValues {
  customerId:       string
  leadId:            string
  title:             string
  stage:             OpportunityStage
  estimatedValue:    string
  probability:       string
  expectedCloseDate: string
  assignedToId:      string
  primaryContactId:  string
  notes:             string
}

const emptyForm: OpportunityFormValues = {
  customerId:       '',
  leadId:            '',
  title:             '',
  stage:            'Prospecting',
  estimatedValue:    '',
  probability:       '',
  expectedCloseDate: '',
  assignedToId:      '',
  primaryContactId:  '',
  notes:             '',
}

function fromOpportunity(o: OpportunityResponse): OpportunityFormValues {
  return {
    customerId:       o.customerId,
    leadId:            o.leadId ?? '',
    title:             o.title,
    stage:             o.stage,
    estimatedValue:    o.estimatedValue?.toString() ?? '',
    probability:       o.probability?.toString() ?? '',
    expectedCloseDate: o.expectedCloseDate ?? '',
    assignedToId:      o.assignedToId ?? '',
    primaryContactId:  o.primaryContactId ?? '',
    notes:             o.notes ?? '',
  }
}

const STAGES: OpportunityStage[] = [
  'Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'ClosedWon', 'ClosedLost',
]

interface FieldProps {
  id:          string
  label:       string
  value:       string
  onChange:    (v: string) => void
  error?:      string
  type?:       string
  placeholder?: string
  hint?:       string
  required?:   boolean
  maxLength?:  number
}

function Field({ id, label, value, onChange, error, type = 'text', placeholder, hint, required, maxLength }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-gray-600 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        id={id} type={type} value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder} maxLength={maxLength}
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

function Textarea({ id, label, value, onChange, error, placeholder, hint, rows = 3 }: { id: string; label: string; value: string; onChange: (v: string) => void; error?: string; placeholder?: string; hint?: string; rows?: number }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      <textarea
        id={id} value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder} rows={rows}
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

type Errors = Partial<Record<keyof OpportunityFormValues, string>>

function validate(v: OpportunityFormValues): Errors {
  const errors: Errors = {}
  if (!v.customerId.trim()) errors.customerId = 'Customer is required.'
  if (!v.title.trim()) errors.title = 'Title is required.'
  if (v.estimatedValue && isNaN(Number(v.estimatedValue)))
    errors.estimatedValue = 'Must be a number.'
  if (v.probability && (isNaN(Number(v.probability)) || Number(v.probability) < 0 || Number(v.probability) > 100))
    errors.probability = 'Must be 0–100.'
  if (v.expectedCloseDate && !/^\d{4}-\d{2}-\d{2}$/.test(v.expectedCloseDate))
    errors.expectedCloseDate = 'Use YYYY-MM-DD format.'
  return errors
}

export default function OpportunityForm({ opportunity, onSubmit }: OpportunityFormProps) {
  const [values, setValues] = useState<OpportunityFormValues>(
    opportunity ? fromOpportunity(opportunity) : emptyForm
  )
  const [errors, setErrors] = useState<Errors>({})

  useEffect(() => {
    setValues(opportunity ? fromOpportunity(opportunity) : emptyForm)
    setErrors({})
  }, [opportunity])

  const set = (field: keyof OpportunityFormValues) => (value: string) => {
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
      customerId:        values.customerId.trim(),
      leadId:            values.leadId.trim() || null,
      title:             values.title.trim(),
      stage:             values.stage,
      estimatedValue:    values.estimatedValue ? Number(values.estimatedValue) : null,
      probability:       values.probability ? Number(values.probability) : null,
      expectedCloseDate: values.expectedCloseDate || null,
      assignedToId:      values.assignedToId.trim() || null,
      primaryContactId:  values.primaryContactId.trim() || null,
      notes:             values.notes.trim() || null,
    })
  }

  return (
    <form id="opportunity-form" onSubmit={handleSubmit} noValidate>
      <div className="space-y-5">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Deal details</p>
          <div className="grid grid-cols-2 gap-4">
            <Field
              id="title" label="Opportunity title" value={values.title}
              onChange={set('title')} error={errors.title}
              placeholder="Enterprise license deal" required
            />
            <div>
              <label htmlFor="stage" className="block text-xs font-medium text-gray-600 mb-1.5">Stage</label>
              <select
                id="stage" value={values.stage} onChange={e => set('stage')(e.target.value as OpportunityStage)}
                className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Field
              id="customerId" label="Customer ID" value={values.customerId}
              onChange={set('customerId')} error={errors.customerId}
              placeholder="paste GUID here" required
              hint="Customer this opportunity belongs to"
            />
            <Field
              id="leadId" label="Lead ID (optional)" value={values.leadId}
              onChange={set('leadId')} placeholder="paste GUID here"
              hint="Originating lead, if any"
            />
          </div>
        </div>

        <hr className="border-gray-100" />

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Valuation</p>
          <div className="grid grid-cols-2 gap-4">
            <Field
              id="estimatedValue" label="Estimated value (PHP)" value={values.estimatedValue}
              onChange={set('estimatedValue')} error={errors.estimatedValue}
              placeholder="75000" type="number"
            />
            <Field
              id="probability" label="Probability (%)" value={values.probability}
              onChange={set('probability')} error={errors.probability}
              placeholder="60" type="number"
              hint="Win probability 0–100"
            />
          </div>
          <div className="mt-4">
            <Field
              id="expectedCloseDate" label="Expected close date" value={values.expectedCloseDate}
              onChange={set('expectedCloseDate')} error={errors.expectedCloseDate}
              placeholder="YYYY-MM-DD" hint="e.g. 2025-06-30"
            />
          </div>
        </div>

        <hr className="border-gray-100" />

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Assignment</p>
          <div className="grid grid-cols-2 gap-4">
            <Field
              id="assignedToId" label="Assigned to (user ID)" value={values.assignedToId}
              onChange={set('assignedToId')} placeholder="paste GUID here"
              hint="Sales rep responsible"
            />
            <Field
              id="primaryContactId" label="Primary contact (ID)" value={values.primaryContactId}
              onChange={set('primaryContactId')} placeholder="paste GUID here"
              hint="Key contact for this deal"
            />
          </div>
        </div>

        <hr className="border-gray-100" />

        <div>
          <Textarea
            id="notes" label="Notes" value={values.notes}
            onChange={set('notes')} placeholder="Any additional context about this opportunity…"
          />
        </div>
      </div>
    </form>
  )
}

export const OPPORTUNITY_FORM_ID = 'opportunity-form'
