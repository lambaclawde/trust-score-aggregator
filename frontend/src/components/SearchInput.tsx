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
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className={clsx(
            'input-field font-mono pr-32',
            size === 'lg' && 'py-4 text-lg',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500'
          )}
        />
        <button
          type="submit"
          className={clsx(
            'absolute right-2 top-1/2 -translate-y-1/2 btn-primary',
            size === 'lg' ? 'py-2.5 px-5' : 'py-1.5 px-4 text-sm'
          )}
        >
          Lookup
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}
    </form>
  )
}
