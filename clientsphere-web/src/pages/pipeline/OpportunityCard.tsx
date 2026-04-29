// src/pages/pipeline/OpportunityCard.tsx
// Full replacement — adds onGenerateInvoice prop, shown only in Won column
import { useSortable } from '@dnd-kit/sortable'
import { CSS }         from '@dnd-kit/utilities'
import { useAuthStore }  from '@/store/authStore'
import type { OpportunityResponse } from '@/types/opportunity.types'

interface OpportunityCardProps {
  opportunity:       OpportunityResponse
  isDragging?:       boolean
  onGenerateInvoice?:(opportunity: OpportunityResponse) => void
}

function formatValue(value: number | null): string {
  if (value == null) return ''
  return new Intl.NumberFormat('en-PH', {
    style: 'currency', currency: 'PHP',
    notation: 'compact', maximumFractionDigits: 1,
  }).format(value)
}

function probColor(prob: number | null): string {
  if (prob == null) return 'bg-gray-200'
  if (prob >= 75)   return 'bg-green-400'
  if (prob >= 40)   return 'bg-amber-400'
  return 'bg-red-400'
}

export default function OpportunityCard({
  opportunity,
  isDragging = false,
  onGenerateInvoice,
}: OpportunityCardProps) {
  const { role } = useAuthStore()
  const canEdit = role === 'TenantAdmin' || role === 'SalesManager' || role === 'SalesRep' || role === 'SuperAdmin'
  const canDelete = role === 'TenantAdmin' || role === 'SuperAdmin'
  const canBilling = role === 'TenantAdmin' || role === 'SuperAdmin'

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: opportunity.id })

  const style = {
    transform:  CSS.Transform.toString(transform),
    transition,
    opacity:    isSortableDragging ? 0.4 : 1,
  }

  const isWon = opportunity.stage === 'ClosedWon'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        bg-white rounded-lg border border-gray-200 p-3
        ${isWon ? 'border-green-200' : ''}
        ${isDragging ? 'shadow-md rotate-1 border-brand-300' : ''}
        hover:border-gray-300 transition-colors select-none
      `}
    >
      {/* Drag handle area — excludes the Generate Invoice button */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <p className="text-sm font-medium text-gray-900 leading-snug">
            {opportunity.title}
          </p>
          <div className="flex items-center gap-0.5 -mt-1 -mr-1">
            {canEdit && (
              <button
                className="p-1 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors"
                onClick={e => { e.stopPropagation(); /* edit logic */ }}
                title="Edit opportunity"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            {canDelete && (
              <button
                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                onClick={e => { e.stopPropagation(); /* delete logic */ }}
                title="Delete opportunity"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {opportunity.estimatedValue != null && (
          <p className={`text-base font-semibold tabular-nums ${isWon ? 'text-green-800' : 'text-gray-900'}`}>
            {formatValue(opportunity.estimatedValue)}
          </p>
        )}

        {opportunity.expectedCloseDate && (
          <p className="text-xs text-gray-400 mt-1">
            Close {new Date(opportunity.expectedCloseDate).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric',
            })}
          </p>
        )}

        {opportunity.probability != null && (
          <div className="mt-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">Probability</span>
              <span className="text-xs font-medium text-gray-600 tabular-nums">
                {Math.round(opportunity.probability)}%
              </span>
            </div>
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${probColor(opportunity.probability)}`}
                style={{ width: `${Math.round(opportunity.probability)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Generate Invoice button — only in Won column, stops drag propagation */}
      {isWon && onGenerateInvoice && canBilling && (
        <button
          onClick={e => {
            e.stopPropagation()
            onGenerateInvoice(opportunity)
          }}
          className="
            mt-3 w-full h-7 rounded-md
            bg-green-50 border border-green-200 text-green-700
            text-xs font-medium
            hover:bg-green-100 active:scale-[0.98]
            transition-all flex items-center justify-center gap-1.5
          "
          aria-label={`Generate invoice for ${opportunity.title}`}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Generate invoice
        </button>
      )}
    </div>
  )
}