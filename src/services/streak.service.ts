export interface StreakState {
  currentStreak: number;
  bestStreak: number;
  lastActivityAt: number;
}

export const StreakService = {
  calculateStreak(
    lastActivityTimestamp: number | null,
    currentStreak: number,
    bestStreak: number,
    nowTimestamp: number = Date.now()
  ): StreakState {
    const nowDate = new Date(nowTimestamp);

    if (!lastActivityTimestamp) {
      // First activity logged
      return {
        currentStreak: 1,
        bestStreak: Math.max(1, bestStreak),
        lastActivityAt: nowTimestamp,
      };
    }

    const lastDate = new Date(lastActivityTimestamp);

    // Helper functions for calendar day comparisons
    const isSameDay =
      nowDate.getFullYear() === lastDate.getFullYear() &&
      nowDate.getMonth() === lastDate.getMonth() &&
      nowDate.getDate() === lastDate.getDate();

    const yesterday = new Date(nowTimestamp);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
      yesterday.getFullYear() === lastDate.getFullYear() &&
      yesterday.getMonth() === lastDate.getMonth() &&
      yesterday.getDate() === lastDate.getDate();

    if (isSameDay) {
      // Activity logged on the same calendar day -> maintain current streak
      return {
        currentStreak,
        bestStreak,
        lastActivityAt: lastActivityTimestamp, // Keep the original timestamp or update to latest? Keep or update: let's update to show latest log
      };
    }

    if (isYesterday) {
      // Successive day -> increment streak
      const newStreak = currentStreak + 1;
      return {
        currentStreak: newStreak,
        bestStreak: Math.max(newStreak, bestStreak),
        lastActivityAt: nowTimestamp,
      };
    }

    // Missed a calendar day -> reset streak to 1 (since they just completed an action right now)
    return {
      currentStreak: 1,
      bestStreak: Math.max(1, bestStreak),
      lastActivityAt: nowTimestamp,
    };
  },
};

export default StreakService;
