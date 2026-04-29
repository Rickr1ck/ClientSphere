
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import OpportunityCard from './OpportunityCard'
import type { OpportunityResponse } from '@/types/opportunity.types'
import type { KanbanColumnId } from '@/types/opportunity.types'



interface KanbanColumnProps {
  id: KanbanColumnId
  label: string
  opportunities: OpportunityResponse[]
  isOver?: boolean
  onGenerateInvoice: (opportunity: OpportunityResponse) => void  // ← added
}

// Column header styles keyed by column id
const COLUMN_STYLES: Record<KanbanColumnId, { header: string; count: string }> = {
  prospecting: {
    header: 'bg-blue-50 text-blue-800 border-blue-100',
    count: 'bg-blue-100 text-blue-700',
  },
  qualification: {
    header: 'bg-brand-50 text-brand-800 border-brand-100',
    count: 'bg-brand-100 text-brand-700',
  },
  proposal: {
    header: 'bg-purple-50 text-purple-800 border-purple-100',
    count: 'bg-purple-100 text-purple-700',
  },
  negotiation: {
    header: 'bg-amber-50 text-amber-800 border-amber-100',
    count: 'bg-amber-100 text-amber-700',
  },
  won: {
    header: 'bg-green-50 text-green-800 border-green-100',
    count: 'bg-green-100 text-green-700',
  },
  lost: {
    header: 'bg-red-50 text-red-800 border-red-100',
    count: 'bg-red-100 text-red-700',
  },
}

function formatColumnTotal(opps: OpportunityResponse[]): string {
  const total = opps.reduce((sum, o) => sum + (o.estimatedValue ?? 0), 0)
  if (total === 0) return ''
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(total)
}

export default function KanbanColumn({
  id,
  label,
  opportunities,
  isOver = false,
  onGenerateInvoice,
}: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id })
  const styles = COLUMN_STYLES[id]
  const total = formatColumnTotal(opportunities)
  const ids = opportunities.map(o => o.id)

  return (
    <div className="flex flex-col min-w-[220px] w-full">

      {/* Column header */}
      <div className={`
        flex items-center justify-between px-3 py-2.5
        rounded-t-lg border border-b-0
        ${styles.header}
      `}>
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider">
            {label}
          </span>
          {total && (
            <span className="text-xs font-medium opacity-70 ml-1.5">
              {total}
            </span>
          )}
        </div>
        <span className={`
          inline-flex items-center justify-center w-5 h-5
          rounded-full text-xs font-semibold
          ${styles.count}
        `}>
          {opportunities.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`
          flex-1 border border-t-0 rounded-b-lg
          transition-colors duration-150 min-h-[120px]
          ${isOver
            ? 'bg-brand-50 border-brand-300'
            : 'bg-gray-50 border-gray-200'
          }
        `}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="p-2 space-y-2">
            {opportunities.map(opp => (
              <OpportunityCard
                key={opp.id}
                opportunity={opp}
                onGenerateInvoice={opp.stage === 'ClosedWon' ? onGenerateInvoice : undefined}
              />
            ))}

            {opportunities.length === 0 && (
              <div className={`
                flex items-center justify-center h-16 rounded-lg
                border-2 border-dashed text-xs
                ${isOver
                  ? 'border-brand-300 text-brand-400'
                  : 'border-gray-200 text-gray-300'
                }
              `}>
                {isOver ? 'Drop here' : 'No opportunities'}
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  )
}