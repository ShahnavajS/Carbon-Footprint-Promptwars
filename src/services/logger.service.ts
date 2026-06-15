/**
 * Logger Service
 * Centralized logging with Cloud Logging integration
 *
 * Features:
 * - Console + Cloud Logging output
 * - Structured logging with context
 * - Log levels (debug, info, warn, error)
 * - Request/response logging
 * - Performance timing
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  userId?: string;
  timestamp: number;
  level: LogLevel;
  service?: string;
  action?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

interface LogEntry extends LogContext {
  message: string;
}

class LoggerService {
  private isDevelopment = process.env.NODE_ENV === "development";
  private isProduction = process.env.NODE_ENV === "production";
  private logs: LogEntry[] = [];
  private maxLogSize = 1000;

  /**
   * Log debug message
   */
  debug(message: string, metadata?: Record<string, unknown>) {
    this.log("debug", message, metadata);
  }

  /**
   * Log info message
   */
  info(message: string, metadata?: Record<string, unknown>) {
    this.log("info", message, metadata);
  }

  /**
   * Log warning message
   */
  warn(message: string, metadata?: Record<string, unknown>) {
    this.log("warn", message, metadata);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | unknown, metadata?: Record<string, unknown>) {
    const errorMetadata = {
      ...metadata,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    };
    this.log("error", message, errorMetadata);
  }

  /**
   * Time an operation
   */
  time<T>(label: string, fn: () => T | Promise<T>): T | Promise<T> {
    const start = performance.now();

    try {
      const result = fn();

      if (result instanceof Promise) {
        return result.finally(() => {
          const duration = performance.now() - start;
          this.debug(`${label} completed`, { duration });
        }) as Promise<T>;
      }

      const duration = performance.now() - start;
      this.debug(`${label} completed`, { duration });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.error(`${label} failed`, error, { duration });
      throw error;
    }
  }

  /**
   * Internal logging implementation
   */
  private log(level: LogLevel, message: string, metadata?: Record<string, unknown>) {
    const entry: LogEntry = {
      message,
      timestamp: Date.now(),
      level,
      metadata,
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogSize) {
      this.logs.shift();
    }

    this.outputLog(entry);
  }

  /**
   * Output log to appropriate destination
   */
  private outputLog(entry: LogEntry) {
    const formatted = this.formatLog(entry);

    if (this.isDevelopment) {
      // Development: colorized console output
      const color = this.getLogColor(entry.level);
      console.log(`${color}${formatted}\x1b[0m`);
    }

    if (this.isProduction) {
      // Production: structured logging (would go to Cloud Logging)
      const structuredLog = {
        severity: entry.level.toUpperCase(),
        message: entry.message,
        timestamp: new Date(entry.timestamp).toISOString(),
        ...entry.metadata,
      };

      // Send to Cloud Logging (stub for now)
      if (entry.level === "error") {
        console.error(structuredLog);
      }
    }
  }

  /**
   * Format log message
   */
  private formatLog(entry: LogEntry): string {
    const time = new Date(entry.timestamp).toISOString();
    const level = entry.level.toUpperCase().padEnd(5);
    const metadata = entry.metadata ? ` ${JSON.stringify(entry.metadata)}` : "";
    return `[${time}] ${level} ${entry.message}${metadata}`;
  }

  /**
   * Get ANSI color for log level
   */
  private getLogColor(level: LogLevel): string {
    const colors: Record<LogLevel, string> = {
      debug: "\x1b[36m", // Cyan
      info: "\x1b[32m", // Green
      warn: "\x1b[33m", // Yellow
      error: "\x1b[31m", // Red
    };
    return colors[level];
  }

  /**
   * Get logs for debugging
   */
  getLogs(limit = 100): LogEntry[] {
    return this.logs.slice(-limit);
  }

  /**
   * Clear logs
   */
  clearLogs() {
    this.logs = [];
  }
}

export const logger = new LoggerService();
