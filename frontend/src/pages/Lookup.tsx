import { motion } from 'framer-motion'
import SearchInput from '../components/SearchInput'

const recentLookups = [
  { id: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', score: 85, label: 'Agent Alpha' },
  { id: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890', score: 72, label: 'DeFi Bot' },
  { id: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba', score: 45, label: 'Trading Agent' },
]

export default function Lookup() {
  return (
    <div className="min-h-[80vh] flex items-center">
      <div className="max-w-3xl mx-auto px-6 py-20 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-4">Lookup Agent Score</h1>
          <p className="text-gray-400">
            Enter an ERC-8004 agent ID to view their trust score and reputation history.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <SearchInput size="lg" />
        </motion.div>

        <motion.div
          className="mt-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
            Example Agent IDs
          </h3>
          <div className="space-y-3">
            {recentLookups.map((lookup, i) => (
              <motion.a
                key={lookup.id}
                href={`/agent/${lookup.id}`}
                className="block card p-4 card-hover group"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.4 + i * 0.1 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-300 group-hover:text-white transition-colors">
                      {lookup.label}
                    </p>
                    <p className="text-sm text-gray-500 font-mono">
                      {lookup.id.slice(0, 20)}...{lookup.id.slice(-8)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`font-mono font-medium ${
                      lookup.score >= 70 ? 'text-emerald-400' :
                      lookup.score >= 40 ? 'text-gray-400' : 'text-amber-400'
                    }`}>
                      {lookup.score}
                    </span>
                    <svg className="w-5 h-5 text-gray-600 group-hover:text-accent-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="mt-12 p-6 rounded-xl bg-surface-800/50 border border-surface-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <h4 className="font-medium mb-2">What is an Agent ID?</h4>
          <p className="text-sm text-gray-400">
            An Agent ID is a bytes32 identifier from the ERC-8004 Identity Registry. It's a 66-character
            hex string starting with <code className="text-accent-400">0x</code> followed by 64 hex characters.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
