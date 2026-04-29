
import type { TicketResponse } from '@/types/ticket.types'
import SentimentBadge   from './SentimentBadge'
import PriorityBadge    from './PriorityBadge'
import TicketStatusBadge from './TicketStatusBadge'

interface TicketCardProps {
  ticket:     TicketResponse
  isSelected: boolean
  onSelect:   (ticket: TicketResponse) => void
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins  < 1)  return 'just now'
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days  < 7)  return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function TicketCard({ ticket, isSelected, onSelect }: TicketCardProps) {
  const isUrgent = ticket.aiSentimentLabel === 'Urgent'

  return (
    <button
      onClick={() => onSelect(ticket)}
      className={`
        w-full text-left rounded-xl border transition-all duration-150 p-3
        focus:outline-none focus:ring-2 focus:ring-brand-400
        ${isSelected
          ? 'border-brand-400 bg-brand-50 shadow-sm'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
        }
        ${isUrgent && !isSelected
          ? 'border-l-2 border-l-red-400'
          : ''
        }
      `}
      aria-selected={isSelected}
      aria-label={`Ticket ${ticket.ticketNumber}: ${ticket.subject}`}
    >
      {/* Top row: number + sentiment */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono text-gray-400">
          {ticket.ticketNumber}
        </span>
        <SentimentBadge label={ticket.aiSentimentLabel} />
      </div>

      {/* Subject */}
      <p className={`
        text-sm font-medium leading-snug mb-2
        ${isSelected ? 'text-brand-900' : 'text-gray-900'}
      `}>
        {ticket.subject}
      </p>

      {/* Meta row */}
      <div className="flex items-center gap-2 flex-wrap">
        <PriorityBadge priority={ticket.priority} />
        <TicketStatusBadge status={ticket.status} />
        <span className="text-xs text-gray-400 ml-auto">
          {timeAgo(ticket.createdAt)}
        </span>
      </div>
    </button>
  )
}