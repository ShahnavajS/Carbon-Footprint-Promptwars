import "@testing-library/jest-dom";
import { toHaveNoViolations } from "jest-axe";
import { vi, beforeAll, expect } from "vitest";

expect.extend(toHaveNoViolations);

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

vi.mock("@/config/env", () => ({
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: "mock-key",
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "mock-domain",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: "mock-id",
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "mock-bucket",
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "mock-sender",
    NEXT_PUBLIC_FIREBASE_APP_ID: "mock-app-id",
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: "mock-measurement-id",
    NODE_ENV: "test",
    GEMINI_API_KEY: "mock-gemini-key",
    FIREBASE_PROJECT_ID: "mock-id",
    FIREBASE_CLIENT_EMAIL: "mock-email",
    FIREBASE_PRIVATE_KEY: "mock-private-key",
  },
}));

vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(() => ({})),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => ({})),
}));

vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => ({ currentUser: null, onAuthStateChanged: vi.fn() })),
  onAuthStateChanged: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
}));

vi.mock("firebase/analytics", () => ({
  getAnalytics: vi.fn(() => ({})),
  isSupported: vi.fn(() => Promise.resolve(false)),
  logEvent: vi.fn(),
}));

vi.mock("firebase/functions", () => ({
  getFunctions: vi.fn(() => ({})),
}));

vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: vi.fn().mockResolvedValue({
        text: "Mocked Gemini insight.",
      }),
    },
  })),
}));
