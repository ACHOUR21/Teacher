'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import React from 'react';

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {return this.props.fallback;}
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Something went wrong</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {this.state.error?.message || 'An unexpected error occurred. Please try again.'}
            </p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
