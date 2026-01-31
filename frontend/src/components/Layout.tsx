import { Outlet, Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import Logo from './Logo'
import ThemeToggle from './ThemeToggle'

const navItems = [
  { path: '/', label: 'Home' },
  { path: '/lookup', label: 'Lookup' },
  { path: '/leaderboard', label: 'Leaderboard' },
  { path: '/docs', label: 'API' },
]

export default function Layout() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 bg-grid">
      {/* Hero gradient overlay */}
      <div className="fixed inset-0 bg-hero-glow-light dark:bg-hero-glow pointer-events-none" />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="mx-4 mt-4">
          <div className="max-w-7xl mx-auto glass rounded-2xl shadow-lg">
            <div className="px-6">
              <div className="flex items-center justify-between h-16">
                {/* Logo */}
                <Link to="/" className="flex-shrink-0">
                  <Logo size="md" />
                </Link>

                {/* Center nav links */}
                <div className="hidden md:flex items-center gap-1 bg-surface-100/50 dark:bg-surface-800/50 rounded-xl p-1">
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.path
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={clsx(
                          'relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                          isActive
                            ? 'text-surface-900 dark:text-white'
                            : 'text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white'
                        )}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeNav"
                            className="absolute inset-0 bg-white dark:bg-surface-700 rounded-lg shadow-sm"
                            transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                          />
                        )}
                        <span className="relative z-10">{item.label}</span>
                      </Link>
                    )
                  })}
                </div>

                {/* Right side actions */}
                <div className="flex items-center gap-3">
                  <ThemeToggle />
                  <a
                    href="https://github.com/lambaclawde/trust-score-aggregator"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary text-sm py-2 hidden sm:flex"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                    </svg>
                    <span>GitHub</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <div className="mx-4 mb-4">
          <div className="glass rounded-2xl shadow-lg">
            <div className="flex items-center justify-around py-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={clsx(
                      'flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors',
                      isActive
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-surface-500 dark:text-surface-400'
                    )}
                  >
                    <span className="text-xs font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="pt-24 pb-24 md:pb-12 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-surface-200 dark:border-surface-800 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-4 gap-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <Logo size="lg" />
              <p className="mt-4 text-surface-600 dark:text-surface-400 max-w-md">
                Aggregated trust scores for ERC-8004 autonomous agents. Verify agent reputation
                before interaction with on-chain verified data.
              </p>
              <div className="flex items-center gap-4 mt-6">
                <a
                  href="https://github.com/lambaclawde/trust-score-aggregator"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-icon"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                </a>
                <a
                  href="https://x.com/lambaclawde"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-icon"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold text-surface-900 dark:text-white mb-4">Product</h4>
              <ul className="space-y-3">
                <li>
                  <Link to="/lookup" className="text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                    Score Lookup
                  </Link>
                </li>
                <li>
                  <Link to="/leaderboard" className="text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                    Leaderboard
                  </Link>
                </li>
                <li>
                  <Link to="/docs" className="text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                    API Documentation
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-semibold text-surface-900 dark:text-white mb-4">Resources</h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="https://ethereum.org/en/developers/docs/standards/tokens/erc-8004/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    ERC-8004 Standard
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/lambaclawde/trust-score-aggregator"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    Open Source
                  </a>
                </li>
                <li>
                  <Link to="/docs" className="text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                    On-chain Oracle
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="divider my-8" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-surface-500 dark:text-surface-500">
              Built for the ERC-8004 ecosystem
            </p>
            <div className="flex items-center gap-6 text-sm text-surface-500 dark:text-surface-500">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Indexer Active
              </span>
              <span>Ethereum Mainnet</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
