import { motion } from 'framer-motion'
import clsx from 'clsx'

interface StatCardProps {
  label: string
  value: string | number
  sublabel?: string
  trend?: 'up' | 'down' | 'neutral'
  icon?: React.ReactNode
  delay?: number
}

export default function StatCard({ label, value, sublabel, trend, icon, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      className="card p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-surface-500 dark:text-surface-400 mb-1">{label}</p>
          <p className="text-2xl font-semibold text-surface-900 dark:text-white">{value}</p>
          {sublabel && (
            <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">{sublabel}</p>
          )}
        </div>
        {icon && (
          <div className="p-2.5 bg-surface-100 dark:bg-surface-800 rounded-xl">
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className={clsx(
          'mt-3 flex items-center gap-1.5 text-sm font-medium',
          trend === 'up' && 'text-emerald-600 dark:text-emerald-400',
          trend === 'down' && 'text-red-600 dark:text-red-400',
          trend === 'neutral' && 'text-surface-500 dark:text-surface-400'
        )}>
          {trend === 'up' && (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          )}
          {trend === 'down' && (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          )}
          {trend === 'neutral' && (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
            </svg>
          )}
          <span>{trend === 'up' ? 'Trending up' : trend === 'down' ? 'Trending down' : 'Stable'}</span>
        </div>
      )}
    </motion.div>
  )
}
