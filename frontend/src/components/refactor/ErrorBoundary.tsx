/**
 * ErrorBoundary Component
 * Graceful error handling and recovery
 */

import { Component } from 'react';
import type { ReactNode } from 'react';
import { Button } from './Button';
import { Heading, Text } from './Typography';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorCount: number;
}

/**
 * Error Boundary Class Component
 * Catches and displays errors in child components
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorCount: 0,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to console in development
    const isDev = typeof window !== 'undefined' && (window as any).__DEV__;
    
    if (isDev) {
      console.error('Error caught by boundary:', error);
      console.error('Error info:', errorInfo);
    }

    // You could also log error to an error reporting service here
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorCount: this.state.errorCount + 1,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-xl p-8 space-y-6">
            {/* Error Icon */}
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-8 h-8 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            {/* Error Message */}
            <div className="space-y-2 text-center">
              <Heading level="h3" className="text-red-400">
                Something went wrong
              </Heading>
              <Text className="text-slate-400">
                An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
              </Text>
            </div>

            {/* Error Details (Development Only) */}
            {(() => {
              try {
                return typeof import.meta !== 'undefined' && (import.meta as any).env.MODE === 'development';
              } catch {
                return false;
              }
            })() && this.state.error && (
              <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-3 space-y-2">
                <p className="text-xs font-mono text-red-400 break-words">
                  {this.state.error.message}
                </p>
                <details className="text-xs text-slate-400">
                  <summary className="cursor-pointer font-semibold">Stack trace</summary>
                  <pre className="mt-2 overflow-auto max-h-32 text-[10px]">
                    {this.state.error.stack}
                  </pre>
                </details>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={this.handleReset}
                variant="primary"
                fullWidth
              >
                Try Again
              </Button>
              <Button
                onClick={() => (window.location.href = '/')}
                variant="ghost"
                fullWidth
              >
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Error Alert
 * Display error message inline
 */
export function ErrorAlert({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss?: () => void;
}) {
  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
      <svg
        className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <div className="flex-1">
        <Text className="text-red-300" size="sm">
          {message}
        </Text>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-400 hover:text-red-300 transition-colors"
          aria-label="Dismiss error"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
