// src/pages/dashboard/SummaryCard.tsx
import type { LucideIcon } from 'lucide-react'

interface SummaryCardProps {
  label:     string
  value:     string
  delta?:    string
  deltaType?:'up' | 'down' | 'neutral'
  icon:      LucideIcon
  iconBg:    string
  iconColor: string
  loading?:  boolean
}

export default function SummaryCard({
  label,
  value,
  delta,
  deltaType = 'neutral',
  icon: Icon,
  iconBg,
  iconColor,
  loading = false,
}: SummaryCardProps) {
  const deltaColor =
    deltaType === 'up'   ? 'text-green-700' :
    deltaType === 'down' ? 'text-red-700'   :
                           'text-gray-500'

  const deltaPrefix =
    deltaType === 'up'   ? '↑ ' :
    deltaType === 'down' ? '↓ ' :
                           ''

  return (
    <div className="bg-gray-50 rounded-xl p-4">
      {/* Icon */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 flex-shrink-0"
        style={{ background: iconBg }}
      >
        {Icon ? (
          <Icon size={16} color={iconColor} strokeWidth={2} />
        ) : (
          <div className="w-4 h-4 bg-gray-200 rounded-sm" />
        )}
      </div>

      {/* Label */}
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </p>

      {/* Value */}
      {loading ? (
        <div className="h-7 w-24 bg-gray-200 rounded animate-pulse" />
      ) : (
        <p className="text-2xl font-semibold text-gray-900 tabular-nums leading-tight">
          {value}
        </p>
      )}

      {/* Delta */}
      {delta && !loading && (
        <p className={`text-xs mt-1.5 ${deltaColor}`}>
          {deltaPrefix}{delta}
        </p>
      )}
    </div>
  )
}