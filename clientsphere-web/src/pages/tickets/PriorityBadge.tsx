// src/pages/tickets/PriorityBadge.tsx
import type { TicketPriority } from '@/types/ticket.types'

const PRIORITY_STYLES: Record<TicketPriority, { bg: string; text: string }> = {
  Critical: { bg: 'bg-red-50',   text: 'text-red-800'   },
  High:     { bg: 'bg-amber-50', text: 'text-amber-800' },
  Medium:   { bg: 'bg-gray-100', text: 'text-gray-600'  },
  Low:      { bg: 'bg-green-50', text: 'text-green-800' },
}

export default function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const style = PRIORITY_STYLES[priority]
  return (
    <span className={`
      inline-flex items-center px-2 py-0.5 rounded-full
      text-[10px] font-semibold uppercase tracking-wide
      ${style.bg} ${style.text}
    `}>
      {priority}
    </span>
  )
}