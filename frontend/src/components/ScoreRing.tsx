import { motion } from 'framer-motion'
import clsx from 'clsx'

interface ScoreRingProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  animated?: boolean
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#10b981' // emerald-500
  if (score >= 60) return '#22c55e' // green-500
  if (score >= 40) return '#f59e0b' // amber-500
  if (score >= 20) return '#f97316' // orange-500
  return '#ef4444' // red-500
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Moderate'
  if (score >= 20) return 'Poor'
  return 'Risky'
}

const sizes = {
  sm: { size: 80, stroke: 6, fontSize: 'text-xl' },
  md: { size: 120, stroke: 8, fontSize: 'text-3xl' },
  lg: { size: 160, stroke: 10, fontSize: 'text-4xl' },
}

export default function ScoreRing({ score, size = 'md', showLabel = true, animated = true }: ScoreRingProps) {
  const config = sizes[size]
  const radius = (config.size - config.stroke) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (score / 100) * circumference
  const color = getScoreColor(score)
  const label = getScoreLabel(score)

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: config.size, height: config.size }}>
        <svg
          width={config.size}
          height={config.size}
          className="transform -rotate-90"
        >
          {/* Background ring */}
          <circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={config.stroke}
            className="text-surface-200 dark:text-surface-800"
          />
          {/* Score ring */}
          <motion.circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={config.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={animated ? { strokeDashoffset: circumference } : { strokeDashoffset: offset }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className={clsx('font-bold', config.fontSize)}
            style={{ color }}
            initial={animated ? { opacity: 0, scale: 0.5 } : {}}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            {Math.round(score)}
          </motion.span>
          {size === 'lg' && (
            <span className="text-xs text-surface-500 dark:text-surface-400 mt-1">/ 100</span>
          )}
        </div>
      </div>
      {showLabel && (
        <motion.div
          className="flex flex-col items-center"
          initial={animated ? { opacity: 0 } : {}}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <span
            className="text-sm font-semibold"
            style={{ color }}
          >
            {label}
          </span>
          <span className="text-xs text-surface-500 dark:text-surface-400">Trust Score</span>
        </motion.div>
      )}
    </div>
  )
}
