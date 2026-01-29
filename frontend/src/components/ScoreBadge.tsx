import clsx from 'clsx'

interface ScoreBadgeProps {
  score: number
  size?: 'sm' | 'md'
}

function getScoreStyle(score: number) {
  if (score >= 80) return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' }
  if (score >= 60) return { bg: 'bg-emerald-500/10', text: 'text-emerald-300', border: 'border-emerald-500/20' }
  if (score >= 40) return { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' }
  if (score >= 20) return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' }
  return { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' }
}

export default function ScoreBadge({ score, size = 'md' }: ScoreBadgeProps) {
  const style = getScoreStyle(score)

  return (
    <span
      className={clsx(
        'inline-flex items-center font-mono font-medium rounded-md border',
        style.bg,
        style.text,
        style.border,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      )}
    >
      {Math.round(score)}
    </span>
  )
}
