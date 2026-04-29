
import { useState, type FormEvent, type ChangeEvent } from 'react'
import type {
  CampaignFormValues,
  CampaignFormErrors,
  CreateCampaignRequest,
} from '@/types/campaign.types'
import { emptyCampaignForm } from '@/types/campaign.types'

interface CampaignFormProps {
  onSubmit:   (request: CreateCampaignRequest) => Promise<void>
  submitting: boolean
}

function validate(v: CampaignFormValues): CampaignFormErrors {
  const e: CampaignFormErrors = {}
  if (!v.name.trim())
    e.name = 'Campaign name is required.'
  if (v.budget && isNaN(Number(v.budget)))
    e.budget = 'Budget must be a valid number.'
  if (v.budget && Number(v.budget) < 0)
    e.budget = 'Budget cannot be negative.'
  if (v.startDate && v.endDate && v.endDate < v.startDate)
    e.endDate = 'End date must be on or after start date.'
  return e
}

function toRequest(v: CampaignFormValues): CreateCampaignRequest {
  const n = (s: string) => s.trim() || null
  return {
    name:           v.name.trim(),
    description:    n(v.description),
    channel:        n(v.channel),
    budget:         v.budget ? Number(v.budget) : null,
    targetAudience: n(v.targetAudience),
    startDate:      n(v.startDate),
    endDate:        n(v.endDate),
  }
}

export const CAMPAIGN_FORM_ID = 'campaign-form'

export default function CampaignForm({ onSubmit }: CampaignFormProps) {
  const [values, setValues] = useState<CampaignFormValues>(emptyCampaignForm)
  const [errors, setErrors] = useState<CampaignFormErrors>({})

  const set = (field: keyof CampaignFormValues) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues(v => ({ ...v, [field]: e.target.value }))
      if (errors[field as keyof CampaignFormErrors])
        setErrors(prev => { const n = { ...prev }; delete n[field as keyof CampaignFormErrors]; return n })
    }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const errs = validate(values)
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    await onSubmit(toRequest(values))
    setValues(emptyCampaignForm)
    setErrors({})
  }

  const Field = ({
    id, label, type = 'text', placeholder = '', required = false,
    hint, rows,
  }: {
    id: keyof CampaignFormValues
    label: string
    type?: string
    placeholder?: string
    required?: boolean
    hint?: string
    rows?: number
  }) => (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-gray-600 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {rows ? (
        <textarea
          id={id}
          value={values[id]}
          onChange={set(id)}
          placeholder={placeholder}
          rows={rows}
          className={`
            w-full px-3 py-2 rounded-lg border text-sm text-gray-900
            placeholder:text-gray-400 resize-none transition-shadow
            focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent
            ${errors[id as keyof CampaignFormErrors] ? 'border-red-300 bg-red-50' : 'border-gray-200'}
          `}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={values[id]}
          onChange={set(id)}
          placeholder={placeholder}
          className={`
            w-full h-9 px-3 rounded-lg border text-sm text-gray-900
            placeholder:text-gray-400 transition-shadow
            focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent
            ${errors[id as keyof CampaignFormErrors] ? 'border-red-300 bg-red-50' : 'border-gray-200'}
          `}
        />
      )}
      {hint && !errors[id as keyof CampaignFormErrors] && (
        <p className="text-xs text-gray-400 mt-1">{hint}</p>
      )}
      {errors[id as keyof CampaignFormErrors] && (
        <p className="text-xs text-red-600 mt-1">
          {errors[id as keyof CampaignFormErrors]}
        </p>
      )}
    </div>
  )

  return (
    <form id={CAMPAIGN_FORM_ID} onSubmit={handleSubmit} noValidate className="space-y-4">
      <Field id="name"           label="Campaign name"    required placeholder="Q2 Product Launch" />
      <Field id="channel"        label="Channel"          placeholder="Email, Social, Paid…" />
      <Field id="targetAudience" label="Target audience"  rows={3} placeholder="Describe your target audience…" />
      <Field
        id="budget"
        label="Budget (PHP)"
        type="number"
        placeholder="0.00"
        hint="Leave blank for no budget cap"
      />
      <div className="grid grid-cols-2 gap-3">
        <Field id="startDate" label="Start date" type="date" />
        <Field id="endDate"   label="End date"   type="date" />
      </div>
      <Field id="description" label="Description" rows={2} placeholder="Optional campaign notes…" />
    </form>
  )
}