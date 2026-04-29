
interface LeadScoreBadgeProps {
  score: number | null
}

function getScoreStyle(score: number) {
  if (score >= 80) return {
    bg:   'bg-green-50',
    text: 'text-green-800',
    ring: 'ring-green-200',
    label:'High',
  }
  if (score >= 50) return {
    bg:   'bg-amber-50',
    text: 'text-amber-800',
    ring: 'ring-amber-200',
    label:'Mid',
  }
  return {
    bg:   'bg-red-50',
    text: 'text-red-800',
    ring: 'ring-red-200',
    label:'Low',
  }
}

export default function LeadScoreBadge({ score }: LeadScoreBadgeProps) {
  if (score == null) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-400">
        —
      </span>
    )
  }

  const style = getScoreStyle(score)

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full
        text-xs font-semibold tabular-nums
        ring-1 ring-inset
        ${style.bg} ${style.text} ${style.ring}
      `}
      title={`AI conversion score: ${score}/100 (${style.label} probability)`}
    >
      {/* Colored dot indicator */}
      <span
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
          score >= 80 ? 'bg-green-500' :
          score >= 50 ? 'bg-amber-500' :
                        'bg-red-500'
        }`}
      />
      {score}
    </span>
  )
}