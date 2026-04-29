import { useState, useEffect, type FormEvent } from 'react'
import type { TicketResponse, CreateTicketRequest, TicketPriority } from '@/types/ticket.types'

interface TicketFormProps {
  ticket?:    TicketResponse
  onSubmit:  (values: CreateTicketRequest) => Promise<void>
  onCancel:  () => void
  submitting?: boolean
}

interface TicketFormValues {
  customerId:  string
  contactId:   string
  subject:     string
  description: string
  priority:    TicketPriority
  assignedToId:string
  dueAt:       string
  tags:        string
}

const emptyForm: TicketFormValues = {
  customerId:  '',
  contactId:   '',
  subject:     '',
  description: '',
  priority:    'Medium',
  assignedToId:'',
  dueAt:       '',
  tags:        '',
}

function fromTicket(t: TicketResponse): TicketFormValues {
  return {
    customerId:  t.customerId,
    contactId:   t.contactId ?? '',
    subject:     t.subject,
    description: t.description ?? '',
    priority:    t.priority,
    assignedToId:t.assignedToId ?? '',
    dueAt:       t.dueAt ?? '',
    tags:        t.tags?.join(', ') ?? '',
  }
}

const PRIORITIES: TicketPriority[] = ['Low', 'Medium', 'High', 'Critical']

interface FieldProps {
  id:           string
  label:        string
  value:        string
  onChange:     (v: string) => void
  error?:       string
  type?:        string
  placeholder?: string
  hint?:        string
  required?:    boolean
}

function Field({ id, label, value, onChange, error, type = 'text', placeholder, hint, required }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-gray-600 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        id={id} type={type} value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
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

type Errors = Partial<Record<keyof TicketFormValues, string>>

function validate(v: TicketFormValues): Errors {
  const errors: Errors = {}
  if (!v.customerId.trim()) errors.customerId = 'Customer ID is required.'
  if (!v.subject.trim()) errors.subject = 'Subject is required.'
  if (v.dueAt && !/^\d{4}-\d{2}-\d{2}$/.test(v.dueAt))
    errors.dueAt = 'Use YYYY-MM-DD format.'
  return errors
}

export default function TicketForm({ ticket, onSubmit }: TicketFormProps) {
  const [values, setValues] = useState<TicketFormValues>(
    ticket ? fromTicket(ticket) : emptyForm
  )
  const [errors, setErrors] = useState<Errors>({})

  useEffect(() => {
    setValues(ticket ? fromTicket(ticket) : emptyForm)
    setErrors({})
  }, [ticket])

  const set = (field: keyof TicketFormValues) => (value: string) => {
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
      customerId:   values.customerId.trim(),
      contactId:    values.contactId.trim() || null,
      subject:      values.subject.trim(),
      description: values.description.trim() || null,
      priority:    values.priority,
      assignedToId:values.assignedToId.trim() || null,
      dueAt:       values.dueAt || null,
      tags:        values.tags ? values.tags.split(',').map(t => t.trim()).filter(Boolean) : null,
    })
  }

  return (
    <form id="ticket-form" onSubmit={handleSubmit} noValidate>
      <div className="space-y-5">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Ticket details</p>
          <Field
            id="subject" label="Subject" value={values.subject}
            onChange={set('subject')} error={errors.subject}
            placeholder="Cannot login to the dashboard" required
          />
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Field
              id="customerId" label="Customer ID" value={values.customerId}
              onChange={set('customerId')} error={errors.customerId}
              placeholder="paste GUID here" required
            />
            <div>
              <label htmlFor="priority" className="block text-xs font-medium text-gray-600 mb-1.5">
                Priority<span className="text-red-500 ml-0.5">*</span>
              </label>
              <select
                id="priority" value={values.priority}
                onChange={e => set('priority')(e.target.value as TicketPriority)}
                className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
        </div>

        <hr className="border-gray-100" />

        <div>
          <Textarea
            id="description" label="Description" value={values.description}
            onChange={set('description')} placeholder="Describe the issue in detail…"
            rows={4}
          />
        </div>

        <hr className="border-gray-100" />

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Assignment & dates</p>
          <div className="grid grid-cols-2 gap-4">
            <Field
              id="assignedToId" label="Assigned to (user ID)" value={values.assignedToId}
              onChange={set('assignedToId')} placeholder="paste GUID here"
              hint="Support agent responsible"
            />
            <Field
              id="contactId" label="Contact ID (optional)" value={values.contactId}
              onChange={set('contactId')} placeholder="paste GUID here"
              hint="Reporting contact"
            />
          </div>
          <div className="mt-4">
            <Field
              id="dueAt" label="Due date" value={values.dueAt}
              onChange={set('dueAt')} error={errors.dueAt}
              placeholder="YYYY-MM-DD" hint="e.g. 2025-06-30"
            />
          </div>
        </div>

        <hr className="border-gray-100" />

        <div>
          <Field
            id="tags" label="Tags" value={values.tags}
            onChange={set('tags')}
            placeholder="bug, urgent, billing"
            hint="Comma-separated tags"
          />
        </div>
      </div>
    </form>
  )
}

export const TICKET_FORM_ID = 'ticket-form'
