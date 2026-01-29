/**
 * Format a bytes32 hex string for display.
 */
export function truncateAddress(address: string, startChars = 10, endChars = 6): string {
  if (address.length <= startChars + endChars) return address
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`
}

/**
 * Format a score for display.
 */
export function formatScore(score: number): string {
  return score.toFixed(1)
}

/**
 * Format a timestamp for display.
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format a timestamp with time.
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format relative time (e.g., "2 hours ago").
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 30) return formatDate(dateString)
  if (diffDays > 0) return `${diffDays}d ago`
  if (diffHours > 0) return `${diffHours}h ago`
  if (diffMins > 0) return `${diffMins}m ago`
  return 'Just now'
}

/**
 * Format a number with commas.
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US')
}

/**
 * Format a percentage.
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Get score color based on value.
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return '#10b981' // emerald
  if (score >= 60) return '#34d399' // emerald lighter
  if (score >= 40) return '#6b7280' // gray
  if (score >= 20) return '#f59e0b' // amber
  return '#ef4444' // red
}

/**
 * Get score label based on value.
 */
export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Neutral'
  if (score >= 20) return 'Poor'
  return 'Risky'
}

/**
 * Validate agent ID format.
 */
export function isValidAgentId(id: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(id)
}

/**
 * Normalize agent ID format.
 */
export function normalizeAgentId(id: string): string {
  if (!id.startsWith('0x')) {
    id = '0x' + id
  }
  return id.toLowerCase()
}
