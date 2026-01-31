import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import SearchInput from '../components/SearchInput'
import Logo from '../components/Logo'

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: 'On-chain Verified',
    description: 'Trust scores derived directly from ERC-8004 reputation registry events. Immutable, transparent, and cryptographically verifiable.',
    highlight: 'Blockchain secured',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    title: 'Real-time Indexing',
    description: 'Continuous monitoring of Ethereum events. New feedback is indexed within minutes, ensuring scores always reflect the latest data.',
    highlight: 'Live updates',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Time-Weighted Scoring',
    description: 'Recent feedback carries more weight with our 90-day half-life decay algorithm. Agents must maintain quality over time.',
    highlight: '90-day half-life',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
      </svg>
    ),
    title: 'Developer APIs',
    description: 'REST API for off-chain integrations and Solidity oracle for on-chain queries. Build trust verification into any protocol.',
    highlight: 'API & Oracle',
  },
]

const useCases = [
  {
    title: 'DeFi Protocols',
    description: 'Gate agent access to liquidity pools, lending protocols, or yield strategies based on trust scores.',
    icon: '🏦',
  },
  {
    title: 'AI Agent Marketplaces',
    description: 'Help users discover reliable agents and filter out bad actors before delegation.',
    icon: '🤖',
  },
  {
    title: 'DAO Governance',
    description: 'Weight agent votes or restrict proposal creation based on reputation.',
    icon: '🗳️',
  },
  {
    title: 'Insurance & Risk',
    description: 'Price coverage premiums based on agent track record and behavior patterns.',
    icon: '🛡️',
  },
]

const stats = [
  { value: '22K+', label: 'Agents Indexed', sublabel: 'from ERC-8004 registry' },
  { value: '0.001', unit: 'ETH', label: 'Per On-chain Query', sublabel: 'pay-per-use pricing' },
  { value: '90', unit: 'days', label: 'Score Half-life', sublabel: 'time-weighted decay' },
  { value: '100', unit: 'req/day', label: 'Free API Tier', sublabel: 'no credit card required' },
]

export default function Home() {
  const { data: healthData } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      try {
        const res = await fetch('http://localhost:8000/health')
        return res.json()
      } catch {
        return null
      }
    },
    staleTime: 60000,
  })

  const agentCount = healthData?.agents_indexed || 22637

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-primary-500/5 dark:bg-primary-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] bg-accent-500/5 dark:bg-accent-500/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-6 py-20 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left content */}
            <div className="max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 text-sm font-medium border border-primary-200 dark:border-primary-800 mb-8">
                  <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                  ERC-8004 Reputation Standard
                </span>
              </motion.div>

              <motion.h1
                className="text-display-md md:text-display-lg font-bold leading-[1.1] mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                Trust Scores for{' '}
                <span className="text-gradient">Autonomous Agents</span>
              </motion.h1>

              <motion.p
                className="text-lg md:text-xl text-surface-600 dark:text-surface-400 mb-10 max-w-xl leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Aggregated reputation data from on-chain feedback. Verify agent
                trustworthiness before interaction with cryptographically proven scores.
              </motion.p>

              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <SearchInput size="lg" placeholder="Search by agent ID (0x...)" />
                <p className="text-sm text-surface-500 dark:text-surface-500 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Currently tracking {agentCount.toLocaleString()} agents
                </p>
              </motion.div>

              {/* Quick actions */}
              <motion.div
                className="flex flex-wrap items-center gap-4 mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Link to="/leaderboard" className="btn-primary">
                  View Leaderboard
                </Link>
                <Link to="/docs" className="btn-secondary">
                  API Documentation
                </Link>
              </motion.div>
            </div>

            {/* Right side - Visual */}
            <motion.div
              className="hidden lg:flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="relative">
                {/* Decorative rings */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-[400px] h-[400px] rounded-full border border-primary-200/50 dark:border-primary-800/50 animate-pulse-slow" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-[320px] h-[320px] rounded-full border border-accent-200/50 dark:border-accent-800/50" />
                </div>

                {/* Center logo */}
                <div className="relative z-10 w-48 h-48 flex items-center justify-center">
                  <Logo size="lg" showText={false} />
                </div>

                {/* Floating cards */}
                <motion.div
                  className="absolute -top-4 -right-8 card p-4 shadow-lg"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <span className="text-emerald-500 font-bold">95</span>
                    </div>
                    <div>
                      <p className="text-xs text-surface-500 dark:text-surface-400">Trust Score</p>
                      <p className="text-sm font-medium text-emerald-500">Excellent</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="absolute -bottom-4 -left-8 card p-4 shadow-lg"
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, delay: 2 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-surface-500 dark:text-surface-400">Verified</p>
                      <p className="text-sm font-medium">On-chain</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-16 border-y border-surface-200 dark:border-surface-800 bg-surface-100/50 dark:bg-surface-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl md:text-4xl font-bold text-surface-900 dark:text-white">
                    {stat.value}
                  </span>
                  {stat.unit && (
                    <span className="text-lg text-surface-500 dark:text-surface-400">{stat.unit}</span>
                  )}
                </div>
                <p className="font-medium text-surface-700 dark:text-surface-300 mt-1">{stat.label}</p>
                <p className="text-sm text-surface-500 dark:text-surface-500">{stat.sublabel}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="badge badge-primary mb-4">How It Works</span>
            <h2 className="text-display-sm font-bold mb-4">
              Transparent Trust Verification
            </h2>
            <p className="text-lg text-surface-600 dark:text-surface-400 max-w-2xl mx-auto">
              Trust scores are computed from on-chain reputation feedback, weighted by recency,
              and aggregated across categories for comprehensive agent evaluation.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                className="card p-8 card-hover group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-950 flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-surface-900 dark:text-white">
                        {feature.title}
                      </h3>
                      <span className="badge badge-neutral text-2xs">
                        {feature.highlight}
                      </span>
                    </div>
                    <p className="text-surface-600 dark:text-surface-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-24 bg-surface-100/50 dark:bg-surface-900/30">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="badge badge-primary mb-4">Use Cases</span>
            <h2 className="text-display-sm font-bold mb-4">
              Built for the AI Agent Economy
            </h2>
            <p className="text-lg text-surface-600 dark:text-surface-400 max-w-2xl mx-auto">
              Integrate trust verification wherever autonomous agents interact with value,
              data, or user assets.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((useCase, i) => (
              <motion.div
                key={useCase.title}
                className="card p-6 text-center card-hover"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <div className="text-4xl mb-4">{useCase.icon}</div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
                  {useCase.title}
                </h3>
                <p className="text-sm text-surface-600 dark:text-surface-400">
                  {useCase.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="relative card p-12 md:p-16 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-accent-500/5 dark:from-primary-500/10 dark:to-accent-500/10" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />

            <div className="relative text-center max-w-2xl mx-auto">
              <h2 className="text-display-sm font-bold mb-4">
                Start Integrating Trust Scores
              </h2>
              <p className="text-lg text-surface-600 dark:text-surface-400 mb-8">
                Use our REST API for off-chain applications or query the on-chain oracle
                directly from your smart contracts. Free tier available.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link to="/docs" className="btn-primary">
                  View API Documentation
                </Link>
                <a
                  href="https://github.com/lambaclawde/trust-score-aggregator"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                  View on GitHub
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Technical Details Section */}
      <section className="py-24 border-t border-surface-200 dark:border-surface-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Algorithm explanation */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="badge badge-primary mb-4">Technical Details</span>
              <h2 className="text-display-sm font-bold mb-6">
                Scoring Algorithm
              </h2>
              <div className="prose prose-surface dark:prose-invert">
                <p className="text-surface-600 dark:text-surface-400 mb-6">
                  Trust scores are computed using a time-weighted average of on-chain feedback,
                  ensuring recent interactions have more influence than historical data.
                </p>
                <div className="card p-6 font-mono text-sm mb-6">
                  <p className="text-surface-500 dark:text-surface-400 mb-2">// Time decay formula</p>
                  <p className="text-primary-600 dark:text-primary-400">weight = 2^(-age_days / 90)</p>
                  <p className="text-surface-500 dark:text-surface-400 mt-4 mb-2">// Final score</p>
                  <p className="text-primary-600 dark:text-primary-400">score = Σ(value × weight) / Σ(weight)</p>
                </div>
                <ul className="space-y-3 text-surface-600 dark:text-surface-400">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Feedback older than 90 days carries half the weight</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Revoked feedback is excluded from calculations</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Scores normalized to 0-100 scale for easy comparison</span>
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* Data sources */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="badge badge-primary mb-4">Data Sources</span>
              <h2 className="text-display-sm font-bold mb-6">
                On-chain Registries
              </h2>
              <div className="space-y-4">
                <div className="card p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950 flex items-center justify-center text-primary-600 dark:text-primary-400 flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-surface-900 dark:text-white mb-1">Identity Registry</h4>
                      <p className="text-sm text-surface-500 dark:text-surface-400 font-mono mb-2">
                        0x8004A169...9a432
                      </p>
                      <p className="text-sm text-surface-600 dark:text-surface-400">
                        ERC-8004 agent registration and ownership tracking
                      </p>
                    </div>
                  </div>
                </div>

                <div className="card p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-accent-50 dark:bg-accent-950 flex items-center justify-center text-accent-600 dark:text-accent-400 flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-surface-900 dark:text-white mb-1">Reputation Registry</h4>
                      <p className="text-sm text-surface-500 dark:text-surface-400 font-mono mb-2">
                        0x8004BAa1...9dE9b63
                      </p>
                      <p className="text-sm text-surface-600 dark:text-surface-400">
                        On-chain feedback events: NewFeedback, FeedbackRevoked
                      </p>
                    </div>
                  </div>
                </div>

                <div className="card p-6 bg-surface-50 dark:bg-surface-900/50 border-dashed">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-surface-900 dark:text-white mb-1">Trust Score Oracle</h4>
                      <p className="text-sm text-surface-500 dark:text-surface-400 font-mono mb-2">
                        Coming Soon
                      </p>
                      <p className="text-sm text-surface-600 dark:text-surface-400">
                        Query trust scores directly from smart contracts
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}
