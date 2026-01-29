import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import ScoreBadge from '../components/ScoreBadge'

// Mock data - in production this would come from the API
const mockAgents = [
  { id: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', score: 94, feedback_count: 156, positive: 148, negative: 8 },
  { id: '0x2345678901bcdef02345678901bcdef02345678901bcdef02345678901bcdef0', score: 89, feedback_count: 203, positive: 187, negative: 16 },
  { id: '0x3456789012cdef013456789012cdef013456789012cdef013456789012cdef01', score: 85, feedback_count: 89, positive: 78, negative: 11 },
  { id: '0x4567890123def0124567890123def0124567890123def0124567890123def012', score: 78, feedback_count: 67, positive: 54, negative: 13 },
  { id: '0x567890134ef01235678901234ef01235678901234ef01235678901234ef0123', score: 72, feedback_count: 145, positive: 108, negative: 37 },
  { id: '0x67890125f0123467890125f0123467890125f0123467890125f0123467890124', score: 65, feedback_count: 34, positive: 23, negative: 11 },
  { id: '0x789012360123457890123601234578901236012345789012360123457890125', score: 51, feedback_count: 78, positive: 42, negative: 36 },
  { id: '0x890123471234568901234712345689012347123456890123471234568901236', score: 42, feedback_count: 23, positive: 10, negative: 13 },
  { id: '0x901234582345679012345823456790123458234567901234582345679012347', score: 28, feedback_count: 56, positive: 16, negative: 40 },
  { id: '0xa12345693456780123456934567801234569345678012345693456780123458', score: 15, feedback_count: 89, positive: 14, negative: 75 },
]

type SortField = 'score' | 'feedback_count'
type SortOrder = 'asc' | 'desc'

export default function Leaderboard() {
  const [sortField, setSortField] = useState<SortField>('score')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const sortedAgents = [...mockAgents].sort((a, b) => {
    const multiplier = sortOrder === 'desc' ? -1 : 1
    return (a[sortField] - b[sortField]) * multiplier
  })

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => (
    <svg
      className={clsx(
        'w-4 h-4 transition-transform',
        sortField === field && sortOrder === 'asc' && 'rotate-180'
      )}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">Agent Leaderboard</h1>
        <p className="text-gray-400">
          Top and bottom rated ERC-8004 agents by trust score.
        </p>
      </motion.div>

      <motion.div
        className="card overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-600 text-left">
                <th className="px-6 py-4 text-sm font-medium text-gray-400">Rank</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-400">Agent ID</th>
                <th className="px-6 py-4">
                  <button
                    onClick={() => toggleSort('score')}
                    className={clsx(
                      'flex items-center gap-1 text-sm font-medium transition-colors',
                      sortField === 'score' ? 'text-white' : 'text-gray-400 hover:text-gray-300'
                    )}
                  >
                    Score
                    <SortIcon field="score" />
                  </button>
                </th>
                <th className="px-6 py-4">
                  <button
                    onClick={() => toggleSort('feedback_count')}
                    className={clsx(
                      'flex items-center gap-1 text-sm font-medium transition-colors',
                      sortField === 'feedback_count' ? 'text-white' : 'text-gray-400 hover:text-gray-300'
                    )}
                  >
                    Feedback
                    <SortIcon field="feedback_count" />
                  </button>
                </th>
                <th className="px-6 py-4 text-sm font-medium text-gray-400">Sentiment</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {sortedAgents.map((agent, i) => {
                const positiveRatio = agent.feedback_count > 0
                  ? (agent.positive / agent.feedback_count) * 100
                  : 0

                return (
                  <motion.tr
                    key={agent.id}
                    className="table-row"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.03 }}
                  >
                    <td className="px-6 py-4">
                      <span className={clsx(
                        'font-mono font-medium',
                        i === 0 && sortOrder === 'desc' && 'text-amber-400',
                        i === 1 && sortOrder === 'desc' && 'text-gray-300',
                        i === 2 && sortOrder === 'desc' && 'text-amber-600'
                      )}>
                        #{i + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-gray-300">
                        {agent.id.slice(0, 10)}...{agent.id.slice(-6)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <ScoreBadge score={agent.score} />
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {agent.feedback_count}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-surface-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${positiveRatio}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {Math.round(positiveRatio)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/agent/${agent.id}`}
                        className="text-accent-400 hover:text-accent-300 text-sm font-medium transition-colors"
                      >
                        View →
                      </Link>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      <motion.p
        className="text-center text-sm text-gray-500 mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Showing top {mockAgents.length} agents • Updated every 6 hours
      </motion.p>
    </div>
  )
}
