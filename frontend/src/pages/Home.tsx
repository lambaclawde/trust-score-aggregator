import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import SearchInput from '../components/SearchInput'

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'On-chain Verified',
    description: 'Scores aggregated from ERC-8004 reputation registry. Transparent, immutable, trustworthy.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Real-time Updates',
    description: 'Continuous indexing of blockchain events. Scores reflect the latest feedback.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Time-Weighted',
    description: 'Recent feedback matters more. 90-day half-life decay ensures relevance.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    title: 'API Access',
    description: 'REST API and on-chain oracle. Integrate trust scores into your protocol.',
  },
]

const stats = [
  { value: '0.001', unit: 'ETH', label: 'Per on-chain query' },
  { value: '100', unit: 'req/day', label: 'Free API tier' },
  { value: '90', unit: 'days', label: 'Score half-life' },
]

export default function Home() {
  return (
    <div className="relative">
      {/* Hero */}
      <section className="min-h-[80vh] flex items-center">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-600/10 text-accent-400 text-sm font-medium border border-accent-600/20 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse" />
                ERC-8004 Compatible
              </span>
            </motion.div>

            <motion.h1
              className="text-5xl md:text-6xl font-bold leading-tight mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Trust Scores for{' '}
              <span className="text-gradient">Autonomous Agents</span>
            </motion.h1>

            <motion.p
              className="text-xl text-gray-400 mb-10 max-w-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Aggregated reputation data from on-chain feedback. Verify agent trustworthiness before interaction.
            </motion.p>

            <motion.div
              className="max-w-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <SearchInput size="lg" />
              <p className="text-sm text-gray-500 mt-3">
                Enter an ERC-8004 agent ID to lookup their trust score
              </p>
            </motion.div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1/2 h-1/2 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-radial from-accent-600/10 to-transparent" />
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-surface-700 bg-surface-800/30">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-3 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
              >
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold text-white">{stat.value}</span>
                  <span className="text-sm text-gray-400">{stat.unit}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Trust scores are computed from on-chain reputation feedback, weighted by recency and aggregated across categories.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                className="card p-6 card-hover"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <div className="w-12 h-12 rounded-xl bg-accent-600/10 flex items-center justify-center text-accent-400 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="card p-12 text-center relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-accent-900/20 via-transparent to-accent-900/20" />
            <div className="relative">
              <h2 className="text-3xl font-bold mb-4">Integrate Trust Scores</h2>
              <p className="text-gray-400 max-w-xl mx-auto mb-8">
                Use our REST API or query the on-chain oracle directly from your smart contracts.
              </p>
              <div className="flex items-center justify-center gap-4">
                <Link to="/docs" className="btn-primary">
                  View API Docs
                </Link>
                <a
                  href="https://github.com/lambaclawde/trust-score-aggregator"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                >
                  View on GitHub
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
