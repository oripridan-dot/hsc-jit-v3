/**
 * Generic Error Boundary Component
 * v3.7 - Graceful degradation for component failures
 * 
 * Wraps major sections (Navigator, Workbench, MediaBar)
 * Prevents single component failure from crashing the entire app
 */

import React, { type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      `❌ Error Boundary Caught (${this.props.name || 'Unknown'}):`,
      error,
      errorInfo
    );

    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div
            style={{
              padding: '16px',
              background: 'var(--bg-panel)',
              borderLeft: '4px solid #ef4444',
              borderRadius: '4px',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <AlertTriangle
                size={20}
                style={{ color: '#ef4444', flexShrink: 0 }}
              />
              <div>
                <h4
                  style={{
                    margin: '0 0 8px 0',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontWeight: '600',
                  }}
                >
                  {this.props.name ? `Error in ${this.props.name}` : 'Component Error'}
                </h4>
                <p
                  style={{
                    margin: '0 0 8px 0',
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                  }}
                >
                  {this.state.error?.message || 'An unknown error occurred'}
                </p>
                {import.meta.env.DEV && (
                  <details
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      marginTop: '8px',
                    }}
                  >
                    <summary style={{ cursor: 'pointer', marginBottom: '4px' }}>
                      Stack trace
                    </summary>
                    <pre
                      style={{
                        overflow: 'auto',
                        padding: '8px',
                        background: 'var(--bg-app)',
                        borderRadius: '4px',
                        fontSize: '11px',
                        margin: '4px 0 0 0',
                      }}
                    >
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
