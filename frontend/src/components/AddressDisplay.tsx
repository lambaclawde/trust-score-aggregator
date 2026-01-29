import { useState } from 'react'
import clsx from 'clsx'

interface AddressDisplayProps {
  address: string
  truncate?: boolean
  copyable?: boolean
  className?: string
}

export default function AddressDisplay({ address, truncate = true, copyable = true, className }: AddressDisplayProps) {
  const [copied, setCopied] = useState(false)

  const displayAddress = truncate
    ? `${address.slice(0, 10)}...${address.slice(-8)}`
    : address

  const handleCopy = async () => {
    if (!copyable) return
    await navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      disabled={!copyable}
      className={clsx(
        'font-mono text-sm inline-flex items-center gap-2 group',
        copyable && 'hover:text-accent-400 transition-colors cursor-pointer',
        className
      )}
    >
      <span>{displayAddress}</span>
      {copyable && (
        <span className="opacity-0 group-hover:opacity-100 transition-opacity">
          {copied ? (
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </span>
      )}
    </button>
  )
}
