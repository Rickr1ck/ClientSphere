
import type { CampaignStatus } from '@/types/campaign.types'

const STYLES: Record<CampaignStatus, { bg: string; text: string }> = {
  Draft:     { bg: 'bg-gray-100',   text: 'text-gray-600'   },
  Scheduled: { bg: 'bg-blue-50',    text: 'text-blue-800'   },
  Active:    { bg: 'bg-green-50',   text: 'text-green-800'  },
  Paused:    { bg: 'bg-amber-50',   text: 'text-amber-800'  },
  Completed: { bg: 'bg-brand-50',   text: 'text-brand-800'  },
  Cancelled: { bg: 'bg-red-50',     text: 'text-red-800'    },
}

export default function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  const style = STYLES[status]
  return (
    <span className={`
      inline-flex items-center px-2 py-0.5 rounded-full
      text-xs font-medium ${style.bg} ${style.text}
    `}>
      {status}
    </span>
  )
}