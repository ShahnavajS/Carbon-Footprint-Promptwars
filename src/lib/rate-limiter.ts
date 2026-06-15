/**
 * Rate Limiting Middleware
 * Prevents abuse and protects API endpoints
 *
 * Features:
 * - Per-user rate limiting
 * - Per-endpoint rate limiting
 * - Configurable windows and limits
 * - Redis-ready for distributed systems
 */

import { logger } from "@/services/logger.service";

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  keyGenerator?: (req: any) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private records = new Map<string, RequestRecord>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      keyGenerator: (req) => req.userId || req.ip,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...config,
    };

    // Cleanup old records every minute
    if (typeof setInterval !== "undefined") {
      const cleanupTimer = setInterval(() => this.cleanup(), 60000);
      if (typeof cleanupTimer.unref === "function") {
        cleanupTimer.unref();
      }
    }
  }

  /**
   * Check if request is within rate limit
   */
  isLimited(key: string): boolean {
    const now = Date.now();
    const record = this.records.get(key);

    if (!record) {
      this.records.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });
      return false;
    }

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + this.config.windowMs;
      return false;
    }

    record.count++;
    return record.count > this.config.maxRequests;
  }

  /**
   * Get remaining requests
   */
  getRemaining(key: string): number {
    const record = this.records.get(key);
    if (!record) return this.config.maxRequests;
    return Math.max(0, this.config.maxRequests - record.count);
  }

  /**
   * Get reset time for key
   */
  getResetTime(key: string): number {
    const record = this.records.get(key);
    return record?.resetTime || 0;
  }

  /**
   * Reset rate limit for key
   */
  reset(key: string) {
    this.records.delete(key);
  }

  /**
   * Cleanup expired records
   */
  private cleanup() {
    const now = Date.now();
    for (const [key, record] of this.records.entries()) {
      if (now > record.resetTime) {
        this.records.delete(key);
      }
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      activeKeys: this.records.size,
      totalRequests: Array.from(this.records.values()).reduce((sum, r) => sum + r.count, 0),
      config: this.config,
    };
  }
}

// ============ Predefined Rate Limit Configs ============

export const RATE_LIMITS = {
  // Strict: 10 requests per minute
  STRICT: {
    windowMs: 60 * 1000,
    maxRequests: 10,
  },

  // Normal: 60 requests per minute
  NORMAL: {
    windowMs: 60 * 1000,
    maxRequests: 60,
  },

  // Generous: 300 requests per minute
  GENEROUS: {
    windowMs: 60 * 1000,
    maxRequests: 300,
  },

  // Auth: 5 requests per 15 minutes
  AUTH: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
  },

  // Activity: 100 requests per hour
  ACTIVITY: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 100,
  },

  // Export: 10 requests per hour
  EXPORT: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 10,
  },

  // AI: 50 requests per hour
  AI: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 50,
  },
};

// ============ Rate Limiter Instances ============

export const rateLimiters = {
  auth: new RateLimiter(RATE_LIMITS.AUTH),
  api: new RateLimiter(RATE_LIMITS.NORMAL),
  activity: new RateLimiter(RATE_LIMITS.ACTIVITY),
  export: new RateLimiter(RATE_LIMITS.EXPORT),
  ai: new RateLimiter(RATE_LIMITS.AI),
};

/**
 * Rate limit middleware for API routes
 */
export function createRateLimitMiddleware(limiter: RateLimiter) {
  return (key: string) => {
    if (limiter.isLimited(key)) {
      logger.warn("Rate limit exceeded", { key });
      return {
        limited: true,
        remaining: limiter.getRemaining(key),
        resetTime: limiter.getResetTime(key),
      };
    }

    return {
      limited: false,
      remaining: limiter.getRemaining(key),
      resetTime: limiter.getResetTime(key),
    };
  };
}

/**
 * Check rate limit and throw error if exceeded
 */
export function checkRateLimit(limiter: RateLimiter, key: string) {
  const status = createRateLimitMiddleware(limiter)(key);

  if (status.limited) {
    const error = new Error("Too many requests");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (error as any).status = 429;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (error as any).retryAfter = Math.ceil((status.resetTime - Date.now()) / 1000);
    throw error;
  }

  return status;
}

/**
 * Compatibility helper for service-layer call sites.
 */
export async function rateLimit(limitType: keyof typeof RATE_LIMITS | "AI", key: string) {
  const normalizedType = limitType.toLowerCase() as keyof typeof rateLimiters;
  const limiter = rateLimiters[normalizedType] ?? rateLimiters.ai;
  return checkRateLimit(limiter, key);
}

export default RateLimiter;
