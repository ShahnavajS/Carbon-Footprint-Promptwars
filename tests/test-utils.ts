/**
 * Test Setup and Utilities
 * Centralized test configuration and helper functions
 */

import { describe, it, expect, vi } from "vitest";

// ============ Mock Utilities ============

export function mockFirebase() {
  return {
    auth: {
      currentUser: null,
      signInWithEmail: vi.fn(),
      signOut: vi.fn(),
    },
    firestore: {
      collection: vi.fn(),
      doc: vi.fn(),
      query: vi.fn(),
      getDocs: vi.fn(),
      getDoc: vi.fn(),
      setDoc: vi.fn(),
      updateDoc: vi.fn(),
      deleteDoc: vi.fn(),
    },
  };
}

export function mockUser(overrides = {}) {
  return {
    uid: "test-user-123",
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
    role: "user",
    createdAt: new Date(),
    ...overrides,
  };
}

export function mockActivity(overrides = {}) {
  return {
    id: "activity-123",
    userId: "test-user-123",
    type: "transport",
    category: "car",
    date: new Date(),
    duration: 30,
    distance: 10,
    createdAt: new Date(),
    ...overrides,
  };
}

export function mockGoal(overrides = {}) {
  return {
    id: "goal-123",
    userId: "test-user-123",
    type: "reduction",
    category: "transport",
    title: "Reduce car usage",
    targetReduction: 25,
    durationDays: 30,
    difficulty: "medium",
    createdAt: new Date(),
    ...overrides,
  };
}

export function mockBadge(overrides = {}) {
  return {
    id: "badge-123",
    userId: "test-user-123",
    badgeId: "eco-warrior",
    name: "Eco Warrior",
    description: "Logged 100 eco activities",
    unlockedAt: new Date(),
    ...overrides,
  };
}

export function mockChallenge(overrides = {}) {
  return {
    id: "challenge-123",
    title: "Car-Free Week",
    description: "Go without driving for a week",
    category: "transport",
    difficulty: "hard",
    duration: 7,
    targetReduction: 100,
    rewardPoints: 500,
    createdAt: new Date(),
    endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    ...overrides,
  };
}

export function mockLeaderboard(overrides = {}) {
  return {
    id: "leaderboard-123",
    scope: "global",
    month: "2024-06",
    entries: [
      {
        userId: "user-1",
        rank: 1,
        score: 1000,
        activities: 50,
      },
      {
        userId: "user-2",
        rank: 2,
        score: 950,
        activities: 48,
      },
    ],
    createdAt: new Date(),
    ...overrides,
  };
}

export function mockCircle(overrides = {}) {
  return {
    id: "circle-123",
    name: "Eco Warriors",
    description: "Community of eco-conscious people",
    createdBy: "test-user-123",
    members: ["test-user-123"],
    privacy: "public",
    category: "community",
    createdAt: new Date(),
    ...overrides,
  };
}

export function mockReport(overrides = {}) {
  return {
    id: "report-123",
    userId: "test-user-123",
    month: "2024-06",
    totalActivities: 25,
    totalEmissionsReduced: 150.5,
    topCategory: "transport",
    badges: ["eco-warrior", "consistent-logger"],
    recommendations: [],
    createdAt: new Date(),
    ...overrides,
  };
}

// ============ Assertion Utilities ============

export function expectValidEmail(email: string) {
  expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
}

export function expectValidDate(date: Date | string) {
  const d = new Date(date);
  expect(d.getTime()).not.toBeNaN();
}

export function expectValidId(id: string) {
  expect(id).toBeTruthy();
  expect(typeof id).toBe("string");
  expect(id.length).toBeGreaterThan(0);
}

export function expectValidUser(user: any) {
  expect(user).toHaveProperty("uid");
  expect(user).toHaveProperty("email");
  expectValidEmail(user.email);
  expect(user).toHaveProperty("firstName");
  expect(user).toHaveProperty("lastName");
}

export function expectValidActivity(activity: any) {
  expect(activity).toHaveProperty("id");
  expect(activity).toHaveProperty("userId");
  expect(activity).toHaveProperty("type");
  expect(["transport", "energy", "food", "waste", "water", "shopping", "entertainment"]).toContain(
    activity.type
  );
  expect(activity).toHaveProperty("date");
  expectValidDate(activity.date);
}

// ============ Async Utilities ============

export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100
) {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    if (await condition()) {
      return true;
    }
    await wait(interval);
  }

  throw new Error(`Condition not met within ${timeout}ms`);
}

// ============ Mock API Utilities ============

export function mockApiResponse<T>(data: T, delay = 0) {
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
}

export function mockApiError(message = "API Error", statusCode = 500, delay = 0) {
  return new Promise((_, reject) => {
    setTimeout(() => {
      const error = new Error(message);
      (error as any).status = statusCode;
      reject(error);
    }, delay);
  });
}

// ============ Test Suite Builders ============

/**
 * Create a test suite for a service
 */
export function describeService(serviceName: string, tests: () => void) {
  describe(`Service: ${serviceName}`, tests);
}

/**
 * Create a test suite for a component
 */
export function describeComponent(componentName: string, tests: () => void) {
  describe(`Component: ${componentName}`, tests);
}

/**
 * Create a test suite for a hook
 */
export function describeHook(hookName: string, tests: () => void) {
  describe(`Hook: ${hookName}`, tests);
}

/**
 * Test a happy path scenario
 */
export function itShouldWork(description: string, test: () => void | Promise<void>) {
  it(`✓ ${description}`, test);
}

/**
 * Test an error scenario
 */
export function itShouldError(description: string, test: () => void | Promise<void>) {
  it(`✗ ${description}`, test);
}

// ============ Test Data Factories ============

export class TestDataFactory {
  static createUser(overrides = {}) {
    return mockUser(overrides);
  }

  static createActivity(overrides = {}) {
    return mockActivity(overrides);
  }

  static createGoal(overrides = {}) {
    return mockGoal(overrides);
  }

  static createBadge(overrides = {}) {
    return mockBadge(overrides);
  }

  static createChallenge(overrides = {}) {
    return mockChallenge(overrides);
  }

  static createLeaderboard(overrides = {}) {
    return mockLeaderboard(overrides);
  }

  static createCircle(overrides = {}) {
    return mockCircle(overrides);
  }

  static createReport(overrides = {}) {
    return mockReport(overrides);
  }

  static createUsers(count: number, overrides = {}) {
    return Array.from({ length: count }, (_, i) => this.createUser({ uid: `user-${i + 1}`, ...overrides }));
  }

  static createActivities(count: number, overrides = {}) {
    return Array.from({ length: count }, (_, i) =>
      this.createActivity({
        id: `activity-${i + 1}`,
        ...overrides,
      })
    );
  }
}

export default {
  mockUser,
  mockActivity,
  mockGoal,
  mockBadge,
  mockChallenge,
  mockLeaderboard,
  mockCircle,
  mockReport,
  mockFirebase,
  wait,
  waitFor,
  mockApiResponse,
  mockApiError,
  TestDataFactory,
};
