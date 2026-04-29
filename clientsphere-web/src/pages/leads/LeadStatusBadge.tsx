
import type { LeadStatus } from '@/types/lead.types'

const STATUS_STYLES: Record<LeadStatus, { bg: string; text: string }> = {
  New:         { bg: 'bg-blue-50',   text: 'text-blue-800'   },
  Contacted:   { bg: 'bg-purple-50', text: 'text-purple-800' },
  Qualified:   { bg: 'bg-green-50',  text: 'text-green-800'  },
  Unqualified: { bg: 'bg-gray-100',  text: 'text-gray-600'   },
  Nurturing:   { bg: 'bg-amber-50',  text: 'text-amber-800'  },
}

export default function LeadStatusBadge({ status }: { status: LeadStatus }) {
  const style = STATUS_STYLES[status]
  return (
    <span className={`
      inline-flex items-center px-2 py-0.5 rounded-full
      text-xs font-medium ${style.bg} ${style.text}
    `}>
      {status}
    </span>
  )
}