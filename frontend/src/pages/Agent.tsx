import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { api } from '../api/client'
import ScoreRing from '../components/ScoreRing'
import StatCard from '../components/StatCard'
import CategoryBar from '../components/CategoryBar'
import AddressDisplay from '../components/AddressDisplay'
import clsx from 'clsx'

export default function Agent() {
  const { id } = useParams<{ id: string }>()

  const { data: score, isLoading: scoreLoading, error: scoreError } = useQuery({
    queryKey: ['score', id],
    queryFn: () => api.getFullScore(id!),
    enabled: !!id,
  })

  const { data: agent } = useQuery({
    queryKey: ['agent', id],
    queryFn: () => api.getAgent(id!),
    enabled: !!id,
  })

  const { data: feedbackData } = useQuery({
    queryKey: ['feedback', id],
    queryFn: () => api.getFeedback(id!, 20),
    enabled: !!id,
  })

  if (scoreLoading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-2 border-accent-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400">Loading agent data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (scoreError || !score) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Agent Not Found</h2>
            <p className="text-gray-400 mb-6">
              No trust score data found for this agent ID.
            </p>
            <Link to="/lookup" className="btn-primary">
              Try Another Lookup
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const positiveRatio = score.feedback_count > 0
    ? (score.positive_count / score.feedback_count) * 100
    : 0

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Link
          to="/lookup"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Lookup
        </Link>
        <h1 className="text-3xl font-bold mb-2">Agent Trust Score</h1>
        <AddressDisplay address={id!} className="text-gray-400" />
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main score card */}
        <motion.div
          className="lg:col-span-1 card p-8 flex flex-col items-center justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <ScoreRing score={score.overall_score} size="lg" />
          <p className="text-sm text-gray-500 mt-4">
            Based on {score.feedback_count} reviews
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Last updated: {new Date(score.computed_at).toLocaleDateString()}
          </p>
        </motion.div>

        {/* Stats */}
        <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
          <StatCard
            label="Total Feedback"
            value={score.feedback_count}
            sublabel="All-time reviews"
            icon={
              <svg className="w-5 h-5 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            }
            delay={0.2}
          />
          <StatCard
            label="Positive Ratio"
            value={`${Math.round(positiveRatio)}%`}
            sublabel={`${score.positive_count} positive / ${score.negative_count} negative`}
            trend={positiveRatio >= 70 ? 'up' : positiveRatio >= 40 ? 'neutral' : 'down'}
            delay={0.3}
          />
          {agent && (
            <>
              <StatCard
                label="Owner"
                value={`${agent.owner.slice(0, 8)}...`}
                sublabel="Wallet address"
                icon={
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
                delay={0.4}
              />
              <StatCard
                label="Registered"
                value={`Block #${agent.block_number.toLocaleString()}`}
                sublabel={new Date(agent.created_at).toLocaleDateString()}
                delay={0.5}
              />
            </>
          )}
        </div>
      </div>

      {/* Categories */}
      {score.categories.length > 0 && (
        <motion.div
          className="mt-8 card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-lg font-semibold mb-6">Score by Category</h3>
          <div className="space-y-5">
            {score.categories.map((cat, i) => (
              <CategoryBar
                key={cat.category}
                category={cat.category}
                score={cat.score}
                count={cat.count}
                index={i}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent feedback */}
      {feedbackData && feedbackData.feedback.length > 0 && (
        <motion.div
          className="mt-8 card overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="px-6 py-4 border-b border-surface-600">
            <h3 className="text-lg font-semibold">Recent Feedback</h3>
          </div>
          <div className="divide-y divide-surface-700">
            {feedbackData.feedback.slice(0, 10).map((fb) => (
              <div key={fb.id} className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className={clsx(
                        'font-mono font-medium',
                        fb.value > 0 ? 'text-emerald-400' : fb.value < 0 ? 'text-red-400' : 'text-gray-400'
                      )}>
                        {fb.value > 0 ? '+' : ''}{fb.value}
                      </span>
                      <span className="text-xs text-gray-500">
                        from {fb.author.slice(0, 10)}...
                      </span>
                    </div>
                    {fb.comment && (
                      <p className="text-sm text-gray-400">{fb.comment}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-600">
                    {new Date(fb.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Embed code */}
      <motion.div
        className="mt-8 card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h3 className="text-lg font-semibold mb-4">Embed Badge</h3>
        <p className="text-sm text-gray-400 mb-4">
          Add this badge to your website to display this agent's trust score.
        </p>
        <div className="bg-surface-900 rounded-lg p-4 font-mono text-sm text-gray-300 overflow-x-auto">
          <code>{`<img src="https://trustscore.api/badge/${id}" alt="Trust Score" />`}</code>
        </div>
      </motion.div>
    </div>
  )
}
