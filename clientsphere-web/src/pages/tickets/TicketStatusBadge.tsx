
import type { TicketStatus } from '@/types/ticket.types'

const STATUS_STYLES: Record<TicketStatus, { bg: string; text: string; label: string }> = {
  Open:       { bg: 'bg-blue-50',   text: 'text-blue-800',   label: 'Open'        },
  Pending:    { bg: 'bg-amber-50',  text: 'text-amber-800',  label: 'Pending'     },
  InProgress: { bg: 'bg-purple-50', text: 'text-purple-800', label: 'In progress' },
  Resolved:   { bg: 'bg-green-50',  text: 'text-green-800',  label: 'Resolved'    },
  Closed:     { bg: 'bg-gray-100',  text: 'text-gray-600',   label: 'Closed'      },
}

export default function TicketStatusBadge({ status }: { status: TicketStatus }) {
  const style = STATUS_STYLES[status]
  return (
    <span className={`
      inline-flex items-center px-2 py-0.5 rounded-full
      text-xs font-medium ${style.bg} ${style.text}
    `}>
      {style.label}
    </span>
  )
}