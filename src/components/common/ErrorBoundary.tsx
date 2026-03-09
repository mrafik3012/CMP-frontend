// MODIFIED: 2026-03-03 - Added global error boundary component

import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // eslint-disable-next-line no-console
    console.error("Uncaught error in ErrorBoundary", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-surface-base text-text-primary">
          <div className="max-w-md rounded-xl border border-surface-border bg-surface-card p-6 text-center shadow-card">
            <h1 className="text-lg font-semibold">Something went wrong</h1>
            <p className="mt-2 text-sm text-text-secondary">
              Please refresh the page or try again later.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

