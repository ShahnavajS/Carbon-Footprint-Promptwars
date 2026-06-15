/**
 * Performance Monitor Service
 * Tracks Core Web Vitals and application performance
 *
 * Metrics:
 * - Largest Contentful Paint (LCP)
 * - First Input Delay (FID) / Interaction to Next Paint (INP)
 * - Cumulative Layout Shift (CLS)
 * - First Contentful Paint (FCP)
 * - Time to First Byte (TTFB)
 */

import { logger } from "./logger.service";

interface WebVitals {
  lcp?: number; // Largest Contentful Paint
  inp?: number; // Interaction to Next Paint
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
}

interface PerformanceMetric {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  timestamp: number;
}

interface PerformanceData {
  vitals: WebVitals;
  metrics: PerformanceMetric[];
  apiLatencies: Array<{ endpoint: string; duration: number; timestamp: number }>;
  firebaseLatencies: Array<{ operation: string; duration: number; timestamp: number }>;
}

class PerformanceMonitor {
  private vitals: WebVitals = {};
  private metrics: PerformanceMetric[] = [];
  private apiLatencies: PerformanceData["apiLatencies"] = [];
  private firebaseLatencies: PerformanceData["firebaseLatencies"] = [];
  private maxRecords = 100;

  /**
   * Initialize performance monitoring
   */
  init() {
    if (typeof window === "undefined") return;

    // Monitor Core Web Vitals using PerformanceObserver
    this.observeWebVitals();

    // Monitor navigation timing
    this.observeNavigationTiming();

    // Monitor long tasks
    this.observeLongTasks();
  }

  /**
   * Observe Core Web Vitals
   */
  private observeWebVitals() {
    try {
      // LCP - Largest Contentful Paint
      if ("PerformanceObserver" in window) {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          this.vitals.lcp = (lastEntry as any).startTime || 0;
          this.recordMetric("LCP", this.vitals.lcp || 0);
        });
        lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });

        // INP - Interaction to Next Paint (replaces FID)
        const inpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const maxDuration = Math.max(...entries.map((e) => e.duration));
          this.vitals.inp = maxDuration;
          this.recordMetric("INP", maxDuration);
        });
        inpObserver.observe({ entryTypes: ["event"] });

        // CLS - Cumulative Layout Shift
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          list.getEntries().forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          this.vitals.cls = clsValue;
          this.recordMetric("CLS", clsValue);
        });
        clsObserver.observe({ entryTypes: ["layout-shift"] });

        // FCP - First Contentful Paint
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          this.vitals.fcp = entries[0].startTime;
          this.recordMetric("FCP", this.vitals.fcp);
        });
        fcpObserver.observe({ entryTypes: ["paint"] });
      }
    } catch (error) {
      logger.warn("Web Vitals monitoring not available", { error });
    }
  }

  /**
   * Observe navigation timing
   */
  private observeNavigationTiming() {
    if (typeof window === "undefined" || !window.performance) return;

    const onLoad = () => {
      setTimeout(() => {
        const navigation = window.performance.getEntriesByType(
          "navigation"
        )[0] as PerformanceNavigationTiming;

        if (navigation) {
          const ttfb = navigation.responseStart - navigation.fetchStart;
          this.vitals.ttfb = ttfb;
          this.recordMetric("TTFB", ttfb);

          const domInteractive = navigation.domInteractive - navigation.fetchStart;
          this.recordMetric("DOM Interactive", domInteractive);

          const domComplete = navigation.domComplete - navigation.fetchStart;
          this.recordMetric("DOM Complete", domComplete);
        }
      }, 0);
    };

    if (document.readyState === "complete") {
      onLoad();
    } else {
      window.addEventListener("load", onLoad);
    }
  }

  /**
   * Observe long tasks
   */
  private observeLongTasks() {
    if (typeof window === "undefined" || !("PerformanceObserver" in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        list.getEntries().forEach((entry: any) => {
          logger.warn("Long task detected", {
            name: entry.name,
            duration: entry.duration,
            startTime: entry.startTime,
          });
        });
      });

      observer.observe({ entryTypes: ["longtask"] });
    } catch {
      logger.debug("Long task monitoring not available");
    }
  }

  /**
   * Record API latency
   */
  recordApiLatency(endpoint: string, duration: number) {
    this.apiLatencies.push({
      endpoint,
      duration,
      timestamp: Date.now(),
    });

    if (this.apiLatencies.length > this.maxRecords) {
      this.apiLatencies.shift();
    }

    if (duration > 3000) {
      logger.warn("Slow API request", { endpoint, duration });
    }
  }

  /**
   * Record Firebase latency
   */
  recordFirebaseLatency(operation: string, duration: number) {
    this.firebaseLatencies.push({
      operation,
      duration,
      timestamp: Date.now(),
    });

    if (this.firebaseLatencies.length > this.maxRecords) {
      this.firebaseLatencies.shift();
    }

    if (duration > 2000) {
      logger.warn("Slow Firebase operation", { operation, duration });
    }
  }

  /**
   * Record metric
   */
  private recordMetric(name: string, value: number) {
    const rating = this.rateMetric(name, value);
    this.metrics.push({
      name,
      value,
      rating,
      timestamp: Date.now(),
    });

    if (this.metrics.length > this.maxRecords) {
      this.metrics.shift();
    }
  }

  /**
   * Rate metric as good, needs-improvement, or poor
   */
  private rateMetric(name: string, value: number): "good" | "needs-improvement" | "poor" {
    // Web Vitals thresholds (Google standards)
    const thresholds: Record<string, { good: number; poor: number }> = {
      LCP: { good: 2500, poor: 4000 },
      INP: { good: 200, poor: 500 },
      CLS: { good: 0.1, poor: 0.25 },
      FCP: { good: 1800, poor: 3000 },
      TTFB: { good: 800, poor: 1800 },
    };

    const threshold = thresholds[name];
    if (!threshold) return "needs-improvement";

    if (value <= threshold.good) return "good";
    if (value >= threshold.poor) return "poor";
    return "needs-improvement";
  }

  /**
   * Get current vitals
   */
  getVitals(): WebVitals {
    return { ...this.vitals };
  }

  /**
   * Get performance summary
   */
  getSummary(): PerformanceData {
    return {
      vitals: this.vitals,
      metrics: this.metrics,
      apiLatencies: this.apiLatencies,
      firebaseLatencies: this.firebaseLatencies,
    };
  }

  /**
   * Get average latencies
   */
  getAverageLatencies() {
    const avgApi =
      this.apiLatencies.length > 0
        ? this.apiLatencies.reduce((sum, l) => sum + l.duration, 0) / this.apiLatencies.length
        : 0;

    const avgFirebase =
      this.firebaseLatencies.length > 0
        ? this.firebaseLatencies.reduce((sum, l) => sum + l.duration, 0) /
          this.firebaseLatencies.length
        : 0;

    return { avgApi, avgFirebase };
  }

  /**
   * Check if metrics are healthy
   */
  isHealthy(): boolean {
    if (!this.vitals.lcp) return true; // Not enough data yet

    return (
      (this.vitals.lcp || 0) <= 2500 &&
      (this.vitals.inp || 0) <= 200 &&
      (this.vitals.cls || 0) <= 0.1
    );
  }

  /**
   * Get health report
   */
  getHealthReport() {
    return {
      isHealthy: this.isHealthy(),
      vitals: this.vitals,
      warnings: this.getWarnings(),
    };
  }

  /**
   * Get performance warnings
   */
  private getWarnings(): string[] {
    const warnings: string[] = [];

    if ((this.vitals.lcp || 0) > 2500) {
      warnings.push(`LCP is high: ${this.vitals.lcp}ms`);
    }

    if ((this.vitals.inp || 0) > 200) {
      warnings.push(`INP is high: ${this.vitals.inp}ms`);
    }

    if ((this.vitals.cls || 0) > 0.1) {
      warnings.push(`CLS is high: ${this.vitals.cls}`);
    }

    return warnings;
  }

  /**
   * Clear records
   */
  clear() {
    this.vitals = {};
    this.metrics = [];
    this.apiLatencies = [];
    this.firebaseLatencies = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();
