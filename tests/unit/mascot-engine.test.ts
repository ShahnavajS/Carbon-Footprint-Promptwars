import { describe, it, expect } from "vitest";
import { getMascotMood } from "@/lib/mascot-engine";

const NOW = new Date("2026-06-19T12:00:00Z").getTime();
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

describe("mascot-engine getMascotMood", () => {
  it("is hopeful for a brand-new user with no activity", () => {
    const mood = getMascotMood({ streak: 0, lastActivityAt: null, now: NOW });
    expect(mood.mood).toBe("hopeful");
    expect(mood.emoji).toBe("🌱");
    expect(mood.line).toBeTruthy();
  });

  it("celebrates an action logged within the last hour", () => {
    const mood = getMascotMood({
      streak: 1,
      lastActivityAt: NOW - 30 * 60 * 1000,
      now: NOW,
    });
    expect(mood.mood).toBe("celebrating");
    expect(mood.animated).toBe(true);
  });

  it("is thriving on a strong streak with today's activity", () => {
    const mood = getMascotMood({
      streak: 10,
      lastActivityAt: NOW - 3 * HOUR,
      now: NOW,
    });
    expect(mood.mood).toBe("thriving");
  });

  it("is content with recent (last 2 days) activity", () => {
    const mood = getMascotMood({
      streak: 2,
      lastActivityAt: NOW - DAY,
      now: NOW,
    });
    expect(mood.mood).toBe("content");
  });

  it("is gently wistful (never shaming) after a streak lapse", () => {
    const mood = getMascotMood({
      streak: 0,
      lastActivityAt: NOW - 5 * DAY,
      now: NOW,
    });
    expect(mood.mood).toBe("wistful");
    expect(mood.animated).toBe(false);
    // Hope-forward framing — never uses guilt words.
    expect(mood.line.toLowerCase()).not.toMatch(/fail|bad|guilt|ashamed/);
  });

  it("rotates lines deterministically by day (stable within a session)", () => {
    const a = getMascotMood({ streak: 0, lastActivityAt: null, now: NOW });
    const b = getMascotMood({ streak: 0, lastActivityAt: null, now: NOW + 10 * 1000 });
    expect(a.line).toBe(b.line);
  });
});
