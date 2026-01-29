import { motion } from 'framer-motion'
import clsx from 'clsx'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}

const sizes = {
  sm: 'w-6 h-6 border-2',
  md: 'w-10 h-10 border-2',
  lg: 'w-16 h-16 border-3',
}

export default function Loading({ size = 'md', text, className }: LoadingProps) {
  return (
    <div className={clsx('flex flex-col items-center justify-center gap-4', className)}>
      <motion.div
        className={clsx(
          'rounded-full border-accent-600 border-t-transparent',
          sizes[size]
        )}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      {text && (
        <motion.p
          className="text-sm text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  )
}

export function LoadingPage({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loading size="lg" text={text} />
    </div>
  )
}

export function LoadingCard() {
  return (
    <div className="card p-6 animate-pulse">
      <div className="h-4 bg-surface-700 rounded w-1/3 mb-4" />
      <div className="h-8 bg-surface-700 rounded w-1/2 mb-2" />
      <div className="h-4 bg-surface-700 rounded w-2/3" />
    </div>
  )
}

export function LoadingTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-surface-600">
        <div className="h-5 bg-surface-700 rounded w-32 animate-pulse" />
      </div>
      <div className="divide-y divide-surface-700">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-6 py-4 flex items-center gap-4 animate-pulse">
            <div className="h-4 bg-surface-700 rounded w-8" />
            <div className="h-4 bg-surface-700 rounded flex-1" />
            <div className="h-6 bg-surface-700 rounded w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}
