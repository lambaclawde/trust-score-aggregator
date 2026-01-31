import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'

interface SearchInputProps {
  size?: 'md' | 'lg'
  placeholder?: string
  className?: string
}

export default function SearchInput({ size = 'md', placeholder = 'Enter agent ID (0x...)', className }: SearchInputProps) {
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError('')

    const trimmed = query.trim()
    if (!trimmed) {
      setError('Please enter an agent ID')
      return
    }

    // Basic validation for bytes32 hex
    if (!trimmed.match(/^0x[a-fA-F0-9]{64}$/)) {
      setError('Invalid agent ID format. Expected 0x followed by 64 hex characters.')
      return
    }

    navigate(`/agent/${trimmed}`)
  }

  return (
    <form onSubmit={handleSubmit} className={clsx('w-full', className)}>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 dark:text-surface-500">
          <svg className={clsx('w-5 h-5', size === 'lg' && 'w-6 h-6')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className={clsx(
            'w-full font-mono bg-white dark:bg-surface-900',
            'border border-surface-200 dark:border-surface-700 rounded-2xl',
            'text-surface-900 dark:text-white placeholder-surface-400 dark:placeholder-surface-500',
            'focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
            'transition-all duration-200',
            size === 'lg' ? 'py-4 pl-14 pr-36 text-lg' : 'py-3 pl-12 pr-28',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
          )}
        />
        <button
          type="submit"
          className={clsx(
            'absolute right-2 top-1/2 -translate-y-1/2',
            'btn-primary',
            size === 'lg' ? 'py-3 px-6' : 'py-2 px-4 text-sm'
          )}
        >
          Search
        </button>
      </div>
      {error && (
        <p className="mt-3 text-sm text-red-500 dark:text-red-400 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
    </form>
  )
}
