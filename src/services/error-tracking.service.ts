/**
 * Error Tracking Service
 * Centralized error handling and tracking
 *
 * Features:
 * - Global error handler
 * - Error categorization
 * - User context tracking
 * - Duplicate error prevention
 * - Error recovery suggestions
 */

import { logger } from "./logger.service";

export type ErrorSeverity = "fatal" | "error" | "warning" | "info";

interface ErrorReport {
  id: string;
  message: string;
  severity: ErrorSeverity;
  category: string;
  timestamp: number;
  userId?: string;
  context?: Record<string, unknown>;
  stack?: string;
  isDuplicate: boolean;
}

class ErrorTrackingService {
  private errors: ErrorReport[] = [];
  private maxErrors = 500;
  private lastErrorHashes = new Set<string>();
  private errorThrottleMs = 1000;
  private lastErrorTimes: Record<string, number> = {};

  /**
   * Track an error
   */
  trackError(
    error: Error | unknown,
    context?: Record<string, unknown>,
    userId?: string
  ): ErrorReport {
    const errorReport = this.createErrorReport(error, context, userId);

    // Check if this error was recently reported (deduplicate)
    const errorHash = this.hashError(errorReport);
    const isDuplicate = this.lastErrorHashes.has(errorHash);

    if (isDuplicate) {
      const lastTime = this.lastErrorTimes[errorHash] || 0;
      if (Date.now() - lastTime < this.errorThrottleMs) {
        errorReport.isDuplicate = true;
        return errorReport;
      }
    }

    // Track error
    this.lastErrorHashes.add(errorHash);
    this.lastErrorTimes[errorHash] = Date.now();
    this.errors.push(errorReport);

    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Log error
    logger.error(`[${errorReport.category}] ${errorReport.message}`, error, {
      errorId: errorReport.id,
      severity: errorReport.severity,
      userId,
    });

    return errorReport;
  }

  /**
   * Create error report from error object
   */
  private createErrorReport(
    error: Error | unknown,
    context?: Record<string, unknown>,
    userId?: string
  ): ErrorReport {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    return {
      id: this.generateErrorId(),
      message,
      severity: this.categorizeError(error),
      category: this.getErrorCategory(error),
      timestamp: Date.now(),
      userId,
      context,
      stack,
      isDuplicate: false,
    };
  }

  /**
   * Categorize error by type
   */
  private categorizeError(error: unknown): ErrorSeverity {
    if (error instanceof TypeError) return "error";
    if (error instanceof ReferenceError) return "error";
    if (error instanceof SyntaxError) return "fatal";
    if (error instanceof RangeError) return "error";
    return "error";
  }

  /**
   * Get error category
   */
  private getErrorCategory(error: unknown): string {
    if (error instanceof Error) {
      if (error.message.includes("auth")) return "AUTH";
      if (error.message.includes("network")) return "NETWORK";
      if (error.message.includes("validation")) return "VALIDATION";
      if (error.message.includes("permission")) return "PERMISSION";
      if (error.message.includes("firestore")) return "FIRESTORE";
    }
    return "UNKNOWN";
  }

  /**
   * Hash error for deduplication
   */
  private hashError(report: ErrorReport): string {
    return `${report.category}:${report.message}`;
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get error recovery suggestions
   */
  getSuggestion(error: Error | unknown): string {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes("Permission denied")) {
      return "You don't have permission to perform this action. Check your account permissions.";
    }

    if (message.includes("network")) {
      return "Network error. Please check your internet connection and try again.";
    }

    if (message.includes("quota")) {
      return "Rate limit exceeded. Please wait a moment and try again.";
    }

    if (message.includes("not found")) {
      return "The requested resource was not found. It may have been deleted.";
    }

    return "An unexpected error occurred. Please try again or contact support.";
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit = 50): ErrorReport[] {
    return this.errors.slice(-limit);
  }

  /**
   * Get errors by category
   */
  getErrorsByCategory(category: string): ErrorReport[] {
    return this.errors.filter((e) => e.category === category);
  }

  /**
   * Clear errors
   */
  clearErrors() {
    this.errors = [];
    this.lastErrorHashes.clear();
    this.lastErrorTimes = {};
  }

  /**
   * Get error summary
   */
  getSummary() {
    const categories = new Map<string, number>();
    const severities = new Map<ErrorSeverity, number>();

    this.errors.forEach((error) => {
      categories.set(error.category, (categories.get(error.category) || 0) + 1);
      severities.set(error.severity, (severities.get(error.severity) || 0) + 1);
    });

    return {
      totalErrors: this.errors.length,
      byCategory: Object.fromEntries(categories),
      bySeverity: Object.fromEntries(severities),
      lastError: this.errors[this.errors.length - 1],
    };
  }
}

export const errorTracker = new ErrorTrackingService();

/**
 * Global error handler for unhandled errors
 */
export function setupGlobalErrorHandlers() {
  // Handle unhandled promise rejections
  if (typeof window !== "undefined") {
    window.addEventListener("unhandledrejection", (event) => {
      errorTracker.trackError(event.reason);
      // Don't preventDefault - let default handler run
    });

    // Handle uncaught errors
    window.addEventListener("error", (event) => {
      errorTracker.trackError(event.error);
    });
  }
}
