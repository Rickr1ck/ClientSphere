
import type { InvoiceStatus } from '@/types/invoice.types'

interface StyleDef {
  bg:   string
  text: string
  dot:  string
}

const STYLES: Record<InvoiceStatus, StyleDef> = {
  Draft:         { bg: 'bg-gray-100',   text: 'text-gray-600',   dot: 'bg-gray-400'   },
  Sent:          { bg: 'bg-blue-50',    text: 'text-blue-800',   dot: 'bg-blue-500'   },
  Paid:          { bg: 'bg-green-50',   text: 'text-green-800',  dot: 'bg-green-500'  },
  Void:          { bg: 'bg-red-50',     text: 'text-red-800',    dot: 'bg-red-500'    },
  Uncollectible: { bg: 'bg-amber-50',   text: 'text-amber-800',  dot: 'bg-amber-500'  },
}

export default function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const style = STYLES[status]
  return (
    <span className={`
      inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full
      text-xs font-medium ring-1 ring-inset
      ${style.bg} ${style.text}
      ${status === 'Paid'  ? 'ring-green-200' :
        status === 'Sent'  ? 'ring-blue-200'  :
        status === 'Void'  ? 'ring-red-200'   :
        status === 'Uncollectible' ? 'ring-amber-200' :
        'ring-gray-200'}
    `}
    title={`Stripe invoice status: ${status}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${style.dot}`} />
      {status === 'Uncollectible' ? 'Uncollectible' : status}
    </span>
  )
}