import { motion } from 'framer-motion'
import clsx from 'clsx'

interface CategoryBarProps {
  category: string
  score: number
  count: number
  index?: number
}

function getCategoryLabel(category: string): string {
  // Convert bytes32 hex to readable label if possible
  // For now, just truncate
  if (category.startsWith('0x')) {
    // Try to decode as ASCII
    try {
      const hex = category.slice(2)
      let str = ''
      for (let i = 0; i < hex.length; i += 2) {
        const charCode = parseInt(hex.substring(i, i + 2), 16)
        if (charCode === 0) break
        str += String.fromCharCode(charCode)
      }
      if (str && /^[\x20-\x7E]+$/.test(str)) {
        return str
      }
    } catch {
      // Ignore decode errors
    }
    return `${category.slice(0, 10)}...`
  }
  return category
}

function getBarColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 60) return 'bg-emerald-400'
  if (score >= 40) return 'bg-gray-500'
  if (score >= 20) return 'bg-amber-500'
  return 'bg-red-500'
}

export default function CategoryBar({ category, score, count, index = 0 }: CategoryBarProps) {
  const label = getCategoryLabel(category)
  const barColor = getBarColor(score)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-300 font-medium">{label}</span>
        <div className="flex items-center gap-3">
          <span className="text-gray-500 text-xs">{count} reviews</span>
          <span className="font-mono font-medium text-white">{Math.round(score)}</span>
        </div>
      </div>
      <div className="h-2 bg-surface-700 rounded-full overflow-hidden">
        <motion.div
          className={clsx('h-full rounded-full', barColor)}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, delay: index * 0.1, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
