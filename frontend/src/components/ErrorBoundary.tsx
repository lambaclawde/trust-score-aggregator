import { Component, ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-gray-400 mb-6">
              An unexpected error occurred. Please try again or return to the home page.
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => window.location.reload()}
                className="btn-secondary"
              >
                Reload Page
              </button>
              <Link to="/" className="btn-primary">
                Go Home
              </Link>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-6 p-4 bg-surface-800 rounded-lg text-left">
                <p className="text-sm text-red-400 font-mono">
                  {this.state.error.message}
                </p>
              </div>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

interface ErrorMessageProps {
  title?: string
  message?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function ErrorMessage({
  title = 'Error',
  message = 'Something went wrong',
  action
}: ErrorMessageProps) {
  return (
    <div className="card p-6 text-center">
      <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
        <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-400 mb-4">{message}</p>
      {action && (
        <button onClick={action.onClick} className="btn-secondary">
          {action.label}
        </button>
      )}
    </div>
  )
}

export function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-700 mb-4">404</h1>
        <h2 className="text-xl font-semibold mb-2">Page Not Found</h2>
        <p className="text-gray-400 mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn-primary">
          Go Home
        </Link>
      </div>
    </div>
  )
}
