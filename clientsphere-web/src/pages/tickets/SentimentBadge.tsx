
import type { AiSentimentLabel } from '@/types/ticket.types'

interface SentimentBadgeProps {
  label: AiSentimentLabel | null
  score?: number | null
  size?: 'sm' | 'md'
}

interface SentimentStyle {
  bg:     string
  text:   string
  ring:   string
  dot:    string
  label:  string
}

const SENTIMENT_STYLES: Record<AiSentimentLabel, SentimentStyle> = {
  Urgent: {
    bg:   'bg-red-50',
    text: 'text-red-800',
    ring: 'ring-red-200',
    dot:  'bg-red-500',
    label:'Urgent',
  },
  Negative: {
    bg:   'bg-amber-50',
    text: 'text-amber-800',
    ring: 'ring-amber-200',
    dot:  'bg-amber-500',
    label:'Negative',
  },
  Neutral: {
    bg:   'bg-gray-100',
    text: 'text-gray-600',
    ring: 'ring-gray-200',
    dot:  'bg-gray-400',
    label:'Neutral',
  },
  Positive: {
    bg:   'bg-green-50',
    text: 'text-green-800',
    ring: 'ring-green-200',
    dot:  'bg-green-500',
    label:'Positive',
  },
}

export default function SentimentBadge({
  label,
  score,
  size = 'sm',
}: SentimentBadgeProps) {
  if (!label) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-400">
        No AI data
      </span>
    )
  }

  const style = SENTIMENT_STYLES[label]
  const scoreDisplay = score != null
    ? Math.abs(score).toFixed(2)
    : null

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-semibold
        ring-1 ring-inset uppercase tracking-wide
        ${style.bg} ${style.text} ${style.ring}
        ${size === 'md'
          ? 'px-2.5 py-1 text-xs gap-2'
          : 'px-2 py-0.5 text-[10px]'
        }
      `}
      title={scoreDisplay ? `AI sentiment: ${label} (confidence ${scoreDisplay})` : `AI sentiment: ${label}`}
    >
      <span className={`rounded-full flex-shrink-0 ${style.dot} ${size === 'md' ? 'w-2 h-2' : 'w-1.5 h-1.5'}`} />
      {label}
      {size === 'md' && scoreDisplay && (
        <span className="opacity-70 font-normal normal-case tracking-normal tabular-nums">
          {scoreDisplay}
        </span>
      )}
    </span>
  )
}