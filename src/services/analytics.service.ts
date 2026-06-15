/**
 * Analytics Service
 * Centralized event tracking for Firebase Analytics and BigQuery
 *
 * Features:
 * - Event tracking with properties
 * - User property management
 * - Event batching
 * - BigQuery integration ready
 */

import { logger } from "./logger.service";

interface AnalyticsEvent {
  name: string;
  parameters: Record<string, string | number | boolean>;
  timestamp: number;
  userId?: string;
}

class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private userProperties: Record<string, string | number | boolean> = {};
  private maxEvents = 500;
  private isBrowser = typeof window !== "undefined";

  /**
   * Track an event
   */
  trackEvent(
    eventName: string,
    parameters?: Record<string, string | number | boolean>,
    userId?: string
  ) {
    const event: AnalyticsEvent = {
      name: eventName,
      parameters: parameters || {},
      timestamp: Date.now(),
      userId,
    };

    this.events.push(event);
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    logger.debug(`Event tracked: ${eventName}`, parameters);

    // In production, send to Firebase Analytics
    if (this.isBrowser && typeof gtag !== "undefined") {
      try {
        gtag("event", eventName, parameters);
      } catch (error) {
        logger.warn("Failed to send event to Google Analytics", { error });
      }
    }
  }

  /**
   * Set user properties
   */
  setUserProperties(properties: Record<string, string | number | boolean>, userId?: string) {
    this.userProperties = {
      ...this.userProperties,
      ...properties,
    };

    logger.debug("User properties set", properties);

    if (this.isBrowser && typeof gtag !== "undefined") {
      try {
        gtag("set", { user_id: userId, ...properties });
      } catch (error) {
        logger.warn("Failed to set user properties", { error });
      }
    }
  }

  /**
   * Track user signup
   */
  trackSignup(userId: string, method: string) {
    this.trackEvent("sign_up", { method }, userId);
    this.setUserProperties({ userId, signup_method: method }, userId);
  }

  /**
   * Track activity logged
   */
  trackActivityLogged(userId: string, activityType: string, category: string) {
    this.trackEvent("activity_logged", { activityType, category }, userId);
  }

  /**
   * Track badge unlocked
   */
  trackBadgeUnlocked(userId: string, badgeId: string, badgeName: string) {
    this.trackEvent("badge_unlocked", { badgeId, badgeName }, userId);
  }

  /**
   * Track challenge joined
   */
  trackChallengeJoined(userId: string, challengeId: string, challengeName: string) {
    this.trackEvent("challenge_joined", { challengeId, challengeName }, userId);
  }

  /**
   * Track challenge completed
   */
  trackChallengeCompleted(userId: string, challengeId: string, duration: number) {
    this.trackEvent("challenge_completed", { challengeId, duration }, userId);
  }

  /**
   * Track report viewed
   */
  trackReportViewed(userId: string, reportMonth: string) {
    this.trackEvent("report_viewed", { month: reportMonth }, userId);
  }

  /**
   * Track report shared
   */
  trackReportShared(userId: string, platform: string) {
    this.trackEvent("report_shared", { platform }, userId);
  }

  /**
   * Track circle created
   */
  trackCircleCreated(userId: string, circleId: string) {
    this.trackEvent("circle_created", { circleId }, userId);
  }

  /**
   * Track circle joined
   */
  trackCircleJoined(userId: string, circleId: string) {
    this.trackEvent("circle_joined", { circleId }, userId);
  }

  /**
   * Track simulator used
   */
  trackSimulatorUsed(userId: string, scenario: string) {
    this.trackEvent("simulator_used", { scenario }, userId);
  }

  /**
   * Track recommendation accepted
   */
  trackRecommendationAccepted(userId: string, recommendationId: string, category: string) {
    this.trackEvent("recommendation_accepted", { recommendationId, category }, userId);
  }

  /**
   * Track feature viewed
   */
  trackFeatureViewed(userId: string, featureName: string) {
    this.trackEvent("feature_viewed", { feature: featureName }, userId);
  }

  /**
   * Track referral code shared
   */
  trackReferralShared(userId: string) {
    this.trackEvent("referral_shared", {}, userId);
  }

  /**
   * Track API call
   */
  trackApiCall(userId: string, endpoint: string, duration: number, success: boolean) {
    this.trackEvent("api_call", { endpoint, duration, success }, userId);
  }

  /**
   * Track error
   */
  trackError(userId: string, errorType: string, errorMessage: string) {
    this.trackEvent(
      "error_occurred",
      { error_type: errorType, error_message: errorMessage },
      userId
    );
  }

  /**
   * Get user properties
   */
  getUserProperties(): Record<string, string | number | boolean> {
    return { ...this.userProperties };
  }

  /**
   * Get events for export
   */
  getEvents(limit = 100): AnalyticsEvent[] {
    return this.events.slice(-limit);
  }

  /**
   * Get events by type
   */
  getEventsByType(eventName: string): AnalyticsEvent[] {
    return this.events.filter((e) => e.name === eventName);
  }

  /**
   * Get event statistics
   */
  getStatistics() {
    const eventCounts = new Map<string, number>();
    this.events.forEach((event) => {
      eventCounts.set(event.name, (eventCounts.get(event.name) || 0) + 1);
    });

    return {
      totalEvents: this.events.length,
      uniqueEventTypes: eventCounts.size,
      eventCounts: Object.fromEntries(eventCounts),
      userProperties: this.userProperties,
    };
  }

  /**
   * Clear events (for testing)
   */
  clearEvents() {
    this.events = [];
  }

  /**
   * Export events as BigQuery format
   */
  exportForBigQuery() {
    return this.events.map((event) => ({
      timestamp: new Date(event.timestamp).toISOString(),
      event_name: event.name,
      user_id: event.userId,
      event_params: event.parameters,
    }));
  }
}

export const analytics = new AnalyticsService();

// Global gtag type declaration
declare global {
  function gtag(command: string, eventName: string, eventParams?: Record<string, unknown>): void;
  function gtag(command: "set", params: Record<string, unknown>): void;
}
