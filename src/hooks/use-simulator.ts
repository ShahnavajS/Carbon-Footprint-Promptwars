"use client";

import { useState, useCallback } from "react";
import { useAuthStore } from "@/features/auth/store";
import { SIMULATOR_SCENARIOS } from "@/services/simulator.service";
import { trackEvent } from "@/services/analytics";
import type { SimulationResult, SimulatorScenario } from "@/domain/simulator/types";

export function useSimulator() {
  const { user, dbUser } = useAuthStore();
  const [selectedScenario, setSelectedScenario] = useState<SimulatorScenario | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scenarios = SIMULATOR_SCENARIOS;

  const selectScenario = useCallback((scenarioId: string) => {
    const scenario = SIMULATOR_SCENARIOS.find((s) => s.id === scenarioId) ?? null;
    setSelectedScenario(scenario);
    setResult(null); // clear previous result when changing scenario
    setError(null);
  }, []);

  const runSimulation = useCallback(async () => {
    if (!selectedScenario || isRunning) return;
    setIsRunning(true);
    setError(null);
    setResult(null);

    try {
      const currentEcoScore = dbUser?.score.ecoScore ?? 0;

      const res = await fetch("/api/ai/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioId: selectedScenario.id,
          currentEcoScore,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Simulation request failed");
      }

      const data = (await res.json()) as SimulationResult;
      setResult(data);

      if (user) {
        trackEvent("simulation_run", {
          userId: user.uid,
          scenarioId: selectedScenario.id,
          annualCarbonSaved: data.annualCarbonSaved,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Simulation failed. Please try again.");
    } finally {
      setIsRunning(false);
    }
  }, [selectedScenario, isRunning, user, dbUser]);

  const reset = useCallback(() => {
    setSelectedScenario(null);
    setResult(null);
    setError(null);
  }, []);

  return {
    scenarios,
    selectedScenario,
    result,
    isRunning,
    error,
    selectScenario,
    runSimulation,
    reset,
  };
}

export default useSimulator;
