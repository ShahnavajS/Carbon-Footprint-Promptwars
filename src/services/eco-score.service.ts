import type { DietType, TransportType, HomeType } from "@/domain/user/types";
import type { EcoScoreResult } from "@/domain/eco-score/types";
import { getEcoLevel, getEcoLevelNumber } from "@/domain/eco-score/levels";
import { formatLabel } from "@/lib/string";

const DIET_POINTS: Record<DietType, number> = {
  vegan: 120,
  vegetarian: 100,
  mixed: 60,
  "high-meat": 20,
};

const TRANSPORT_POINTS: Record<TransportType, number> = {
  walk: 150,
  bicycle: 140,
  metro: 120,
  bus: 100,
  mixed: 80,
  car: 20,
};

const HOME_POINTS: Record<HomeType, number> = {
  shared: 100,
  apartment: 80,
  house: 50,
};

// Raw Min: 20 + 20 + 50 = 90
// Raw Max: 120 + 150 + 100 = 370
const RAW_MIN = 90;
const RAW_MAX = 370;

export const EcoScoreService = {
  calculateInitialEcoScore(
    dietType: DietType,
    transportType: TransportType,
    homeType: HomeType
  ): EcoScoreResult {
    const dietScore = DIET_POINTS[dietType] ?? 20;
    const transportScore = TRANSPORT_POINTS[transportType] ?? 20;
    const homeScore = HOME_POINTS[homeType] ?? 50;

    const rawScore = dietScore + transportScore + homeScore;

    // Linear normalization: (raw - min) / (max - min) * 1000
    const normalizedScore = Math.round(((rawScore - RAW_MIN) / (RAW_MAX - RAW_MIN)) * 1000);

    // Enforce bounds just in case
    const score = Math.max(0, Math.min(1000, normalizedScore));

    // Level is derived from the unified level system (single source of truth).
    const level = getEcoLevelNumber(score);

    const dietLabel = formatLabel(dietType);
    const transportLabel = formatLabel(transportType);
    const homeLabel = formatLabel(homeType);

    const ecoLevel = getEcoLevel(score);
    const explanation =
      `Your EcoScore is ${score}/1000 — ${ecoLevel.emoji} ${ecoLevel.name} (Level ${level}). ` +
      `Your sustainability habits include a ${dietLabel} diet (+${dietScore} points), ` +
      `${transportLabel} as your primary transit choice (+${transportScore} points), and ` +
      `living in a ${homeLabel} environment (+${homeScore} points). ` +
      `Keep logging and participating in challenges to increase your streak and level!`;

    return {
      score,
      level,
      explanation,
    };
  },
};

export default EcoScoreService;
