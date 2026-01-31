import clsx from 'clsx'

interface ScoreBadgeProps {
  score: number
  size?: 'sm' | 'md'
}

function getScoreStyle(score: number) {
  if (score >= 80) return { bg: 'bg-emerald-50 dark:bg-emerald-950', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' }
  if (score >= 60) return { bg: 'bg-green-50 dark:bg-green-950', text: 'text-green-600 dark:text-green-400', border: 'border-green-200 dark:border-green-800' }
  if (score >= 40) return { bg: 'bg-amber-50 dark:bg-amber-950', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' }
  if (score >= 20) return { bg: 'bg-orange-50 dark:bg-orange-950', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800' }
  return { bg: 'bg-red-50 dark:bg-red-950', text: 'text-red-600 dark:text-red-400', border: 'border-red-200 dark:border-red-800' }
}

export default function ScoreBadge({ score, size = 'md' }: ScoreBadgeProps) {
  const style = getScoreStyle(score)

  return (
    <span
      className={clsx(
        'inline-flex items-center font-mono font-semibold rounded-lg border',
        style.bg,
        style.text,
        style.border,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1.5 text-sm'
      )}
    >
      {Math.round(score)}
    </span>
  )
}
