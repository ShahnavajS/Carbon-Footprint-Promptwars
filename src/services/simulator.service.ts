import type { SimulatorScenario, SimulationResult } from "@/domain/simulator/types";
import { gemini } from "./gemini";

// ─── Scenario Catalogue ───────────────────────────────────────────────────────
// All monetary values are in INR. Carbon values in kg CO₂.
// Sources: IEA, IPCC, Indian Ministry of Petroleum fuel cost estimates.

export const SIMULATOR_SCENARIOS: SimulatorScenario[] = [
  // ── Transport ──
  {
    id: "metro_vs_car",
    label: "Metro instead of Car",
    category: "transport",
    description: "Take the metro/subway instead of driving a private car for your daily commute.",
    weeklyFrequency: 5,
    carbonSavedPerOccurrence: 2.1, // avg 10km commute: car 2.3kg vs metro 0.2kg
    pointsPerOccurrence: 15,
    moneySavedPerOccurrence: 120, // ₹120 saved in fuel/parking per trip
  },
  {
    id: "bicycle_vs_metro",
    label: "Bicycle instead of Metro",
    category: "transport",
    description: "Cycle to work or campus instead of taking public transport.",
    weeklyFrequency: 3,
    carbonSavedPerOccurrence: 0.2,
    pointsPerOccurrence: 15,
    moneySavedPerOccurrence: 40,
  },
  {
    id: "walk_vs_auto",
    label: "Walk instead of Auto/Cab",
    category: "transport",
    description: "Walk short distances instead of hailing an auto-rickshaw or cab.",
    weeklyFrequency: 4,
    carbonSavedPerOccurrence: 0.8,
    pointsPerOccurrence: 15,
    moneySavedPerOccurrence: 80,
  },
  {
    id: "bus_vs_car",
    label: "Bus instead of Car",
    category: "transport",
    description: "Take the city bus instead of driving for errands and commutes.",
    weeklyFrequency: 5,
    carbonSavedPerOccurrence: 1.5,
    pointsPerOccurrence: 10,
    moneySavedPerOccurrence: 90,
  },
  // ── Food ──
  {
    id: "vegetarian_twice_weekly",
    label: "Vegetarian meals twice weekly",
    category: "food",
    description: "Replace meat-based meals with vegetarian options twice every week.",
    weeklyFrequency: 2,
    carbonSavedPerOccurrence: 1.5, // beef ~2.5kg, vegetarian ~0.9kg per meal
    pointsPerOccurrence: 10,
    moneySavedPerOccurrence: 60,
  },
  {
    id: "vegan_once_weekly",
    label: "Vegan meal once weekly",
    category: "food",
    description: "Have one fully plant-based meal per week (no animal products at all).",
    weeklyFrequency: 1,
    carbonSavedPerOccurrence: 2.0,
    pointsPerOccurrence: 15,
    moneySavedPerOccurrence: 50,
  },
  {
    id: "home_cooked_vs_restaurant",
    label: "Cook at home instead of dining out",
    category: "food",
    description: "Prepare meals at home 3 times a week instead of ordering from restaurants.",
    weeklyFrequency: 3,
    carbonSavedPerOccurrence: 0.5,
    pointsPerOccurrence: 5,
    moneySavedPerOccurrence: 200,
  },
  // ── Energy ──
  {
    id: "reduce_ac_30min",
    label: "Reduce AC usage 30 min/day",
    category: "energy",
    description:
      "Run your air conditioner 30 minutes less per day — set the timer or raise the temperature by 2°C.",
    weeklyFrequency: 7,
    carbonSavedPerOccurrence: 0.6, // 1.5kW × 0.5h × 0.82 kg CO₂/kWh (Indian grid)
    pointsPerOccurrence: 10,
    moneySavedPerOccurrence: 15,
  },
  {
    id: "line_dry_clothes",
    label: "Line dry instead of tumble dry",
    category: "energy",
    description: "Hang your laundry to air-dry instead of using a tumble dryer.",
    weeklyFrequency: 3,
    carbonSavedPerOccurrence: 0.8,
    pointsPerOccurrence: 10,
    moneySavedPerOccurrence: 12,
  },
  {
    id: "switch_off_standby",
    label: "Switch off appliances at standby",
    category: "energy",
    description:
      "Unplug or switch off TVs, chargers, and devices instead of leaving them on standby.",
    weeklyFrequency: 7,
    carbonSavedPerOccurrence: 0.4,
    pointsPerOccurrence: 5,
    moneySavedPerOccurrence: 8,
  },
];

// ─── Simulator Service ─────────────────────────────────────────────────────────

export const SimulatorService = {
  getScenarios(): SimulatorScenario[] {
    return SIMULATOR_SCENARIOS;
  },

  getScenario(id: string): SimulatorScenario | null {
    return SIMULATOR_SCENARIOS.find((s) => s.id === id) ?? null;
  },

  /**
   * Pure deterministic calculation — no AI call needed for math.
   * Annual and monthly projections based on weeklyFrequency.
   */
  calculate(
    scenario: SimulatorScenario,
    currentEcoScore: number
  ): Omit<SimulationResult, "aiExplanation"> {
    const weeksPerYear = 52;
    const annualOccurrences = scenario.weeklyFrequency * weeksPerYear;

    const annualCarbonSaved = parseFloat(
      (annualOccurrences * scenario.carbonSavedPerOccurrence).toFixed(2)
    );
    const monthlyCarbonSaved = parseFloat((annualCarbonSaved / 12).toFixed(2));

    const annualPoints = annualOccurrences * scenario.pointsPerOccurrence;
    const scoreGain = Math.round(annualPoints / 5); // same formula as activity service
    const ecoScoreImpact = Math.min(1000, currentEcoScore + scoreGain) - currentEcoScore;

    const annualMoneySaved = Math.round(annualOccurrences * scenario.moneySavedPerOccurrence);

    // 1 tree absorbs ~21 kg CO₂/year on average
    const treeEquivalent = parseFloat((annualCarbonSaved / 21).toFixed(1));

    // Average car emits ~0.21 kg CO₂/km (IPCC)
    const carKmEquivalent = Math.round(annualCarbonSaved / 0.21);

    return {
      scenario,
      annualCarbonSaved,
      monthlyCarbonSaved,
      ecoScoreImpact,
      annualMoneySaved,
      treeEquivalent,
      carKmEquivalent,
    };
  },

  /**
   * Calls Gemini to generate an engaging 2-sentence narrative explanation.
   * Server-side only — called via API route.
   */
  async getAiExplanation(
    scenario: SimulatorScenario,
    result: Omit<SimulationResult, "aiExplanation">
  ): Promise<string> {
    const prompt = `You are a sustainability coach. Write exactly 2 encouraging sentences explaining the environmental impact.

Scenario: "${scenario.description}"
Annual CO₂ saved: ${result.annualCarbonSaved} kg
Tree equivalent: ${result.treeEquivalent} trees per year
Car km avoided: ${result.carKmEquivalent} km per year
Money saved: ₹${result.annualMoneySaved} per year

Make it specific, use the numbers, and compare to something relatable. Be positive and motivating. Maximum 200 characters total.`;

    try {
      const explanation = await gemini.generateText(prompt);
      // Strip any markdown or extra newlines
      return explanation.trim().replace(/\n+/g, " ").slice(0, 300);
    } catch {
      // Graceful fallback — calculation result is still valuable
      return `By making this change ${scenario.weeklyFrequency}× per week, you could save ${result.annualCarbonSaved} kg CO₂ annually — equivalent to ${result.treeEquivalent} trees worth of absorption.`;
    }
  },
};

export default SimulatorService;
