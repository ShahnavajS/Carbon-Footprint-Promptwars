/**
 * Global Error Handler
 * Handles unhandled errors, API errors, Firebase errors, and more
 */

import { logger } from "@/services/logger.service";
import { errorTracker } from "@/services/error-tracking.service";
import { analytics } from "@/services/analytics.service";

interface ErrorContext {
  userId?: string;
  path?: string;
  method?: string;
  timestamp?: number;
  context?: Record<string, unknown>;
}

/**
 * Handle API errors uniformly
 */
export function handleApiError(
  error: unknown,
  context?: ErrorContext
): { message: string; code?: string } {
  const errorResponse = {
    message: "An unexpected error occurred",
    code: "UNKNOWN_ERROR",
  };

  if (error instanceof Error) {
    errorResponse.message = error.message;

    // Handle specific error types
    if (error.message.includes("401") || error.message.includes("Unauthorized")) {
      errorResponse.code = "UNAUTHORIZED";
      errorResponse.message = "Your session has expired. Please log in again.";
    } else if (error.message.includes("403") || error.message.includes("Forbidden")) {
      errorResponse.code = "FORBIDDEN";
      errorResponse.message = "You don't have permission to perform this action.";
    } else if (error.message.includes("404") || error.message.includes("Not Found")) {
      errorResponse.code = "NOT_FOUND";
      errorResponse.message = "The resource was not found.";
    } else if (error.message.includes("429") || error.message.includes("Too Many Requests")) {
      errorResponse.code = "RATE_LIMITED";
      errorResponse.message = "Too many requests. Please try again later.";
    } else if (error.message.includes("500") || error.message.includes("Internal Server Error")) {
      errorResponse.code = "SERVER_ERROR";
      errorResponse.message = "Server error. Please try again later.";
    } else if (error.message.includes("Network")) {
      errorResponse.code = "NETWORK_ERROR";
      errorResponse.message = "Network error. Please check your internet connection.";
    }
  }

  // Track error
  errorTracker.trackError(error, context?.context, context?.userId);
  logger.error("API Error", error, {
    path: context?.path,
    method: context?.method,
    code: errorResponse.code,
  });

  // Track analytics
  if (context?.userId) {
    analytics.trackError(context.userId, errorResponse.code || "UNKNOWN", errorResponse.message);
  }

  return errorResponse;
}

/**
 * Handle Firebase errors
 */
export function handleFirebaseError(error: unknown, context?: ErrorContext) {
  const errorResponse = {
    message: "A database error occurred",
    code: "FIREBASE_ERROR",
  };

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes("permission")) {
      errorResponse.code = "PERMISSION_DENIED";
      errorResponse.message = "You don't have permission to access this resource.";
    } else if (message.includes("not-found")) {
      errorResponse.code = "NOT_FOUND";
      errorResponse.message = "The resource was not found.";
    } else if (message.includes("already-exists")) {
      errorResponse.code = "ALREADY_EXISTS";
      errorResponse.message = "This resource already exists.";
    } else if (message.includes("unauthenticated")) {
      errorResponse.code = "UNAUTHENTICATED";
      errorResponse.message = "Please log in to perform this action.";
    } else if (message.includes("invalid-argument")) {
      errorResponse.code = "INVALID_ARGUMENT";
      errorResponse.message = "Invalid data provided.";
    }
  }

  errorTracker.trackError(error, context?.context, context?.userId);
  logger.error("Firebase Error", error, { code: errorResponse.code });

  return errorResponse;
}

/**
 * Handle validation errors
 */
export function handleValidationError(errors: string[]): { message: string; errors: string[] } {
  logger.warn("Validation error", { errors });

  return {
    message: "Please check the following errors:",
    errors,
  };
}

/**
 * Setup global error handlers
 */
export function setupGlobalErrorHandlers() {
  // Handle unhandled promise rejections
  if (typeof window !== "undefined") {
    window.addEventListener("unhandledrejection", (event) => {
      logger.error("Unhandled promise rejection", event.reason);
      errorTracker.trackError(event.reason);
    });

    // Handle uncaught errors
    window.addEventListener("error", (event) => {
      logger.error("Uncaught error", event.error);
      errorTracker.trackError(event.error);
    });

    // Handle fetch errors globally
    const originalFetch = window.fetch;
    window.fetch = function (...args: Parameters<typeof fetch>) {
      const [resource, config] = args;
      const method = (config as RequestInit)?.method || "GET";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const path =
        typeof resource === "string" ? resource : (resource as any).url || String(resource);

      return originalFetch.apply(this, args).catch((error) => {
        handleApiError(error, {
          path,
          method,
        });
        throw error;
      });
    };
  }

  logger.info("Global error handlers initialized");
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  const tracked = errorTracker.getSuggestion(error);
  return tracked || "An unexpected error occurred. Please try again.";
}

/**
 * Check if error is recoverable
 */
export function isRecoverableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  return !(message.includes("500") || message.includes("fatal") || message.includes("syntax"));
}
