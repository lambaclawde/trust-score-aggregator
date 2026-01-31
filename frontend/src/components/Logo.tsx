import clsx from 'clsx'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

export default function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const sizes = {
    sm: { icon: 28, text: 'text-base' },
    md: { icon: 36, text: 'text-lg' },
    lg: { icon: 48, text: 'text-2xl' },
  }

  const config = sizes[size]

  return (
    <div className={clsx('flex items-center gap-3', className)}>
      {/* Abstract Trust Score Logo - Interlocking rings representing verification */}
      <div className="relative" style={{ width: config.icon, height: config.icon }}>
        <svg
          width={config.icon}
          height={config.icon}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-lg"
        >
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="logoGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#6d28d9" />
            </linearGradient>
            <linearGradient id="logoGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#0891b2" />
            </linearGradient>
            <linearGradient id="logoGradient3" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>
          </defs>

          {/* Background circle with glow */}
          <circle
            cx="24"
            cy="24"
            r="22"
            fill="url(#logoGradient1)"
            className="dark:opacity-100 opacity-95"
          />

          {/* Inner accent ring */}
          <circle
            cx="24"
            cy="24"
            r="16"
            stroke="url(#logoGradient2)"
            strokeWidth="2"
            fill="none"
            opacity="0.6"
          />

          {/* Shield/checkmark shape representing trust verification */}
          <g transform="translate(12, 10)">
            {/* Shield outline */}
            <path
              d="M12 2L3 6V14C3 20.05 6.75 25.74 12 27.5C17.25 25.74 21 20.05 21 14V6L12 2Z"
              fill="white"
              fillOpacity="0.15"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Checkmark */}
            <path
              d="M8 14L11 17L16 11"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </g>

          {/* Decorative dots representing data points */}
          <circle cx="8" cy="14" r="2" fill="white" fillOpacity="0.4" />
          <circle cx="40" cy="14" r="2" fill="white" fillOpacity="0.4" />
          <circle cx="8" cy="34" r="1.5" fill="white" fillOpacity="0.3" />
          <circle cx="40" cy="34" r="1.5" fill="white" fillOpacity="0.3" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className={clsx('font-semibold tracking-tight leading-none', config.text)}>
            <span className="text-surface-900 dark:text-white">Trust</span>
            <span className="text-primary-600 dark:text-primary-400">Score</span>
          </span>
          {size === 'lg' && (
            <span className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
              Agent Reputation Protocol
            </span>
          )}
        </div>
      )}
    </div>
  )
}
