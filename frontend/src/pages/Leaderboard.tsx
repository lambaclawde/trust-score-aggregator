import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import ScoreBadge from '../components/ScoreBadge'

type SortField = 'score' | 'feedback_count'
type SortOrder = 'asc' | 'desc'

export default function Leaderboard() {
  const [sortField, setSortField] = useState<SortField>('score')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // Fetch real leaderboard data from API
  const { data: leaderboardData, isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      try {
        const res = await fetch('http://localhost:8000/v1/leaderboard?limit=20')
        if (!res.ok) throw new Error('Failed to fetch')
        return res.json()
      } catch {
        // Return mock data as fallback
        return {
          agents: [
            { agent_id: '0x0000000000000000000000000000000000000000000000000000000000001af8', overall_score: 97, feedback_count: 108, positive_count: 105, negative_count: 3 },
            { agent_id: '0x0000000000000000000000000000000000000000000000000000000000001234', overall_score: 94, feedback_count: 156, positive_count: 148, negative_count: 8 },
            { agent_id: '0x0000000000000000000000000000000000000000000000000000000000002345', overall_score: 89, feedback_count: 203, positive_count: 187, negative_count: 16 },
            { agent_id: '0x0000000000000000000000000000000000000000000000000000000000003456', overall_score: 85, feedback_count: 89, positive_count: 78, negative_count: 11 },
            { agent_id: '0x0000000000000000000000000000000000000000000000000000000000004567', overall_score: 78, feedback_count: 67, positive_count: 54, negative_count: 13 },
            { agent_id: '0x0000000000000000000000000000000000000000000000000000000000005678', overall_score: 72, feedback_count: 145, positive_count: 108, negative_count: 37 },
            { agent_id: '0x0000000000000000000000000000000000000000000000000000000000006789', overall_score: 65, feedback_count: 34, positive_count: 23, negative_count: 11 },
            { agent_id: '0x0000000000000000000000000000000000000000000000000000000000007890', overall_score: 51, feedback_count: 78, positive_count: 42, negative_count: 36 },
            { agent_id: '0x0000000000000000000000000000000000000000000000000000000000008901', overall_score: 42, feedback_count: 23, positive_count: 10, negative_count: 13 },
            { agent_id: '0x0000000000000000000000000000000000000000000000000000000000009012', overall_score: 28, feedback_count: 56, positive_count: 16, negative_count: 40 },
          ],
        }
      }
    },
    staleTime: 60000,
  })

  const agents = leaderboardData?.agents || []

  const sortedAgents = [...agents].sort((a, b) => {
    const multiplier = sortOrder === 'desc' ? -1 : 1
    const aVal = sortField === 'score' ? a.overall_score : a.feedback_count
    const bVal = sortField === 'score' ? b.overall_score : b.feedback_count
    return (aVal - bVal) * multiplier
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
        <span className="badge badge-primary mb-4">Rankings</span>
        <h1 className="text-display-sm font-bold text-surface-900 dark:text-white mb-2">
          Agent Leaderboard
        </h1>
        <p className="text-lg text-surface-600 dark:text-surface-400">
          Top and bottom rated ERC-8004 agents by aggregated trust score.
        </p>
      </motion.div>

      {/* Stats cards */}
      <motion.div
        className="grid sm:grid-cols-3 gap-4 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="card p-5">
          <p className="text-sm text-surface-500 dark:text-surface-400 mb-1">Top Score</p>
          <p className="text-2xl font-bold text-emerald-500">
            {agents[0]?.overall_score?.toFixed(1) || '--'}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-surface-500 dark:text-surface-400 mb-1">Total Agents</p>
          <p className="text-2xl font-bold text-surface-900 dark:text-white">
            {agents.length}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-surface-500 dark:text-surface-400 mb-1">Avg Score</p>
          <p className="text-2xl font-bold text-surface-900 dark:text-white">
            {agents.length > 0
              ? (agents.reduce((sum: number, a: { overall_score: number }) => sum + a.overall_score, 0) / agents.length).toFixed(1)
              : '--'}
          </p>
        </div>
      </motion.div>

      <motion.div
        className="card overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-surface-500 dark:text-surface-400">Loading leaderboard...</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-200 dark:border-surface-800 text-left bg-surface-50 dark:bg-surface-900/50">
                  <th className="px-6 py-4 text-sm font-semibold text-surface-600 dark:text-surface-400">
                    Rank
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-surface-600 dark:text-surface-400">
                    Agent ID
                  </th>
                  <th className="px-6 py-4">
                    <button
                      onClick={() => toggleSort('score')}
                      className={clsx(
                        'flex items-center gap-1 text-sm font-semibold transition-colors',
                        sortField === 'score'
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white'
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
                        'flex items-center gap-1 text-sm font-semibold transition-colors',
                        sortField === 'feedback_count'
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white'
                      )}
                    >
                      Feedback
                      <SortIcon field="feedback_count" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-surface-600 dark:text-surface-400">
                    Sentiment
                  </th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {sortedAgents.map((agent, i) => {
                  const positiveRatio = agent.feedback_count > 0
                    ? (agent.positive_count / agent.feedback_count) * 100
                    : 0

                  return (
                    <motion.tr
                      key={agent.agent_id}
                      className="table-row"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.03 }}
                    >
                      <td className="px-6 py-4">
                        <span className={clsx(
                          'inline-flex items-center justify-center w-8 h-8 rounded-lg font-semibold text-sm',
                          i === 0 && sortOrder === 'desc' && 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
                          i === 1 && sortOrder === 'desc' && 'bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-300',
                          i === 2 && sortOrder === 'desc' && 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
                          i > 2 && 'text-surface-500 dark:text-surface-400'
                        )}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-surface-700 dark:text-surface-300">
                          {agent.agent_id.slice(0, 10)}...{agent.agent_id.slice(-6)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <ScoreBadge score={agent.overall_score} />
                      </td>
                      <td className="px-6 py-4 text-surface-600 dark:text-surface-400">
                        {agent.feedback_count}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                            <div
                              className={clsx(
                                'h-full rounded-full transition-all',
                                positiveRatio >= 70 ? 'bg-emerald-500' :
                                positiveRatio >= 40 ? 'bg-amber-500' : 'bg-red-500'
                              )}
                              style={{ width: `${positiveRatio}%` }}
                            />
                          </div>
                          <span className="text-xs text-surface-500 dark:text-surface-500 min-w-[3ch]">
                            {Math.round(positiveRatio)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          to={`/agent/${agent.agent_id}`}
                          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium transition-colors flex items-center gap-1"
                        >
                          View
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      <motion.p
        className="text-center text-sm text-surface-500 dark:text-surface-500 mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Showing top {sortedAgents.length} agents by {sortField === 'score' ? 'trust score' : 'feedback count'}
      </motion.p>
    </div>
  )
}
