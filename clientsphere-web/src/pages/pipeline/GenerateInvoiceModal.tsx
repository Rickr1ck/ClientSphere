// src/pages/pipeline/GenerateInvoiceModal.tsx
import { useState, type FormEvent } from 'react'
import Modal   from '@/components/ui/Modal'
import Spinner from '@/components/ui/Spinner'
import type {
  GenerateInvoiceFormValues,
  GenerateInvoiceFormErrors,
  GenerateInvoiceFromOpportunityRequest,
} from '@/types/invoice.types'
import { defaultGenerateForm } from '@/types/invoice.types'
import type { OpportunityResponse } from '@/types/opportunity.types'

interface GenerateInvoiceModalProps {
  open:        boolean
  opportunity: OpportunityResponse | null
  onClose:     () => void
  onGenerate:  (
    opportunityId: string,
    request:       GenerateInvoiceFromOpportunityRequest,
  ) => Promise<void>
}

function validate(v: GenerateInvoiceFormValues): GenerateInvoiceFormErrors {
  const e: GenerateInvoiceFormErrors = {}
  if (!v.issueDate) e.issueDate = 'Issue date is required.'
  if (!v.dueDate)   e.dueDate   = 'Due date is required.'
  if (v.dueDate && v.issueDate && v.dueDate < v.issueDate)
    e.dueDate = 'Due date must be on or after issue date.'
  if (isNaN(Number(v.taxRate)) || Number(v.taxRate) < 0 || Number(v.taxRate) > 1)
    e.taxRate = 'Tax rate must be between 0 and 1 (e.g. 0.0850 for 8.5%).'
  if (!v.currencyCode.trim() || v.currencyCode.trim().length !== 3)
    e.currencyCode = 'Must be a 3-letter ISO 4217 code (e.g. USD, EUR, GBP).'
  return e
}

export const GENERATE_INVOICE_FORM_ID = 'generate-invoice-form'

export default function GenerateInvoiceModal({
  open,
  opportunity,
  onClose,
  onGenerate,
}: GenerateInvoiceModalProps) {
  const [values,     setValues]     = useState<GenerateInvoiceFormValues>(defaultGenerateForm)
  const [errors,     setErrors]     = useState<GenerateInvoiceFormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [apiError,   setApiError]   = useState<string | null>(null)

  const set = (field: keyof GenerateInvoiceFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues(v => ({ ...v, [field]: e.target.value }))
      if (errors[field])
        setErrors(prev => { const n = { ...prev }; delete n[field]; return n })
    }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const errs = validate(values)
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    if (!opportunity) return

    setSubmitting(true)
    setApiError(null)
    try {
      await onGenerate(opportunity.id, {
        issueDate:    values.issueDate,
        dueDate:      values.dueDate,
        taxRate:      Number(values.taxRate),
        currencyCode: values.currencyCode.trim().toUpperCase(),
      })
      onClose()
      setValues(defaultGenerateForm())
      setErrors({})
    } catch {
      setApiError(
        'Failed to generate invoice. This opportunity may already have an invoice.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (!opportunity) return null

  const estimatedTotal = opportunity.estimatedValue
    ? new Intl.NumberFormat('en-PH', {
        style: 'currency', currency: values.currencyCode || 'PHP',
      }).format(opportunity.estimatedValue)
    : '—'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Generate invoice"
      size="sm"
      footer={
        <>
          {apiError && (
            <p className="text-xs text-red-600 mr-auto">{apiError}</p>
          )}
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 h-9 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form={GENERATE_INVOICE_FORM_ID}
            disabled={submitting}
            className="
              px-4 h-9 rounded-lg bg-green-600 text-white
              text-sm font-medium hover:bg-green-700
              disabled:opacity-60 transition-colors
              flex items-center gap-2
            "
          >
            {submitting ? <><Spinner size="sm" />Generating…</> : 'Generate invoice'}
          </button>
        </>
      }
    >
      {/* Opportunity summary */}
      <div className="mb-5 p-3 rounded-lg bg-green-50 border border-green-100">
        <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">
          Opportunity
        </p>
        <p className="text-sm font-medium text-gray-900">{opportunity.title}</p>
        <p className="text-base font-semibold text-green-800 mt-0.5 tabular-nums">
          {estimatedTotal}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Subtotal will be set to the opportunity's estimated value.
          Discount can be applied after creation.
        </p>
      </div>

      <form id={GENERATE_INVOICE_FORM_ID} onSubmit={handleSubmit} noValidate className="space-y-4">

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="inv-issue" className="block text-xs font-medium text-gray-600 mb-1.5">
              Issue date <span className="text-red-500">*</span>
            </label>
            <input
              id="inv-issue"
              type="date"
              value={values.issueDate}
              onChange={set('issueDate')}
              className={`
                w-full h-9 px-3 rounded-lg border text-sm
                focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent
                ${errors.issueDate ? 'border-red-300 bg-red-50' : 'border-gray-200'}
              `}
            />
            {errors.issueDate && (
              <p className="text-xs text-red-600 mt-1">{errors.issueDate}</p>
            )}
          </div>

          <div>
            <label htmlFor="inv-due" className="block text-xs font-medium text-gray-600 mb-1.5">
              Due date <span className="text-red-500">*</span>
            </label>
            <input
              id="inv-due"
              type="date"
              value={values.dueDate}
              onChange={set('dueDate')}
              className={`
                w-full h-9 px-3 rounded-lg border text-sm
                focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent
                ${errors.dueDate ? 'border-red-300 bg-red-50' : 'border-gray-200'}
              `}
            />
            {errors.dueDate && (
              <p className="text-xs text-red-600 mt-1">{errors.dueDate}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="inv-tax" className="block text-xs font-medium text-gray-600 mb-1.5">
              Tax rate (0–1)
            </label>
            <input
              id="inv-tax"
              type="number"
              step="0.0001"
              min="0"
              max="1"
              value={values.taxRate}
              onChange={set('taxRate')}
              placeholder="0.0850"
              className={`
                w-full h-9 px-3 rounded-lg border text-sm
                focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent
                ${errors.taxRate ? 'border-red-300 bg-red-50' : 'border-gray-200'}
              `}
            />
            {errors.taxRate
              ? <p className="text-xs text-red-600 mt-1">{errors.taxRate}</p>
              : <p className="text-xs text-gray-400 mt-1">e.g. 0.0850 for 8.5%</p>
            }
          </div>

          <div>
            <label htmlFor="inv-currency" className="block text-xs font-medium text-gray-600 mb-1.5">
              Currency
            </label>
            <input
              id="inv-currency"
              type="text"
              maxLength={3}
              value={values.currencyCode}
              onChange={set('currencyCode')}
              placeholder="PHP"
              className={`
                w-full h-9 px-3 rounded-lg border text-sm uppercase
                focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent
                ${errors.currencyCode ? 'border-red-300 bg-red-50' : 'border-gray-200'}
              `}
            />
            {errors.currencyCode && (
              <p className="text-xs text-red-600 mt-1">{errors.currencyCode}</p>
            )}
          </div>
        </div>

      </form>
    </Modal>
  )
}