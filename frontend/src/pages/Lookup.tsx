import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import SearchInput from '../components/SearchInput'

const exampleAgents = [
  {
    id: '0x0000000000000000000000000000000000000000000000000000000000001af8',
    label: 'Agent #6888',
    description: 'High-activity agent with extensive feedback',
    score: 97,
  },
  {
    id: '0x0000000000000000000000000000000000000000000000000000000000001af7',
    label: 'Agent #6887',
    description: 'Recently registered agent',
    score: null,
  },
  {
    id: '0x0000000000000000000000000000000000000000000000000000000000001af6',
    label: 'Agent #6886',
    description: 'Moderate activity agent',
    score: 72,
  },
]

export default function Lookup() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center">
      <div className="max-w-3xl mx-auto px-6 py-20 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="badge badge-primary mb-4">Score Lookup</span>
          <h1 className="text-display-sm font-bold mb-4 text-surface-900 dark:text-white">
            Search Agent Trust Score
          </h1>
          <p className="text-lg text-surface-600 dark:text-surface-400 max-w-xl mx-auto">
            Enter an ERC-8004 agent ID to view their aggregated trust score,
            feedback history, and reputation details.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <SearchInput size="lg" placeholder="0x followed by 64 hex characters..." />
        </motion.div>

        <motion.div
          className="mt-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3 className="text-sm font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-6">
            Example Agents
          </h3>
          <div className="space-y-3">
            {exampleAgents.map((agent, i) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.4 + i * 0.1 }}
              >
                <Link
                  to={`/agent/${agent.id}`}
                  className="block card p-5 card-hover group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-semibold text-surface-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                          {agent.label}
                        </p>
                        {agent.score !== null && (
                          <span className={`badge ${
                            agent.score >= 80 ? 'badge-success' :
                            agent.score >= 50 ? 'badge-warning' : 'badge-danger'
                          }`}>
                            Score: {agent.score}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-surface-500 dark:text-surface-400 mb-2">
                        {agent.description}
                      </p>
                      <p className="text-xs text-surface-400 dark:text-surface-500 font-mono truncate">
                        {agent.id}
                      </p>
                    </div>
                    <div className="flex-shrink-0 ml-4">
                      <div className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-surface-400 dark:text-surface-500 group-hover:bg-primary-50 dark:group-hover:bg-primary-950 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-all">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="mt-12 card p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950 flex items-center justify-center text-primary-600 dark:text-primary-400 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-surface-900 dark:text-white mb-1">What is an Agent ID?</h4>
              <p className="text-sm text-surface-600 dark:text-surface-400">
                An Agent ID is a <code className="text-primary-600 dark:text-primary-400 font-mono">bytes32</code> identifier
                from the ERC-8004 Identity Registry. It's a 66-character hex string starting
                with <code className="text-primary-600 dark:text-primary-400 font-mono">0x</code> followed
                by 64 hexadecimal characters. You can find agent IDs in the{' '}
                <Link to="/leaderboard" className="text-primary-600 dark:text-primary-400 hover:underline">
                  leaderboard
                </Link>{' '}
                or through the ERC-8004 registry directly.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
