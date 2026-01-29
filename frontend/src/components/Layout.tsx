import { Outlet, Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import clsx from 'clsx'

const navItems = [
  { path: '/', label: 'Home' },
  { path: '/lookup', label: 'Lookup' },
  { path: '/leaderboard', label: 'Leaderboard' },
  { path: '/docs', label: 'API' },
]

export default function Layout() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-surface-900 bg-grid-pattern">
      {/* Gradient overlay */}
      <div className="fixed inset-0 bg-gradient-radial from-accent-900/20 via-transparent to-transparent pointer-events-none" />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 3L20 7V13C20 17.4183 16.4183 21 12 21C7.58172 21 4 17.4183 4 13V7L12 3Z" />
                  <path d="M9 12L11 14L15 10" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="font-semibold text-lg">TrustScore</span>
            </Link>

            {/* Nav links */}
            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={clsx(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-surface-700 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-surface-800'
                    )}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>

            {/* CTA */}
            <a
              href="https://github.com/lambaclawde/trust-score-aggregator"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-sm py-2"
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
                GitHub
              </span>
            </a>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="pt-16 relative">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-700 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-gray-500">
              <div className="w-6 h-6 rounded bg-accent-600/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-accent-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 3L20 7V13C20 17.4183 16.4183 21 12 21C7.58172 21 4 17.4183 4 13V7L12 3Z" />
                </svg>
              </div>
              <span className="text-sm">Trust Score Aggregator</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="/docs" className="hover:text-white transition-colors">API Docs</a>
              <a href="https://github.com/lambaclawde/trust-score-aggregator" className="hover:text-white transition-colors">GitHub</a>
              <span>ERC-8004</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
