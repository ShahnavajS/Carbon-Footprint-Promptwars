/**
 * Error Boundary Component
 * Catches React component errors and displays fallback UI
 */

"use client";

import React, { ReactNode } from "react";
import { errorTracker } from "@/services/error-tracking.service";
import { logger } from "@/services/logger.service";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error("React error boundary caught error", error, {
      componentStack: errorInfo.componentStack,
    });

    errorTracker.trackError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });

    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex h-screen items-center justify-center bg-red-50">
            <div className="max-w-md rounded-lg bg-white p-6 shadow-lg">
              <h1 className="text-xl font-bold text-red-900">Something went wrong</h1>
              <p className="mt-2 text-sm text-gray-600">{this.state.error?.message}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
              >
                Try again
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
