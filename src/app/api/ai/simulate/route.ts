/**
 * POST /api/ai/simulate
 * Runs a deterministic "what-if" simulation for a scenario and attaches a
 * short Gemini narrative (with a graceful fallback).
 *
 * Body:
 *   - scenarioId: string (required)
 *   - currentEcoScore: number (default 0)
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { SimulatorService } from "@/services/simulator.service";
import { logger } from "@/services/logger.service";
import { parseJsonBody, internalError } from "@/lib/parse-request";

export const runtime = "nodejs";

const SimulateBodySchema = z.object({
  scenarioId: z.string().min(1, "scenarioId is required"),
  currentEcoScore: z.preprocess(
    (v) => (v === undefined || v === null ? 0 : Number(v)),
    z.number().min(0).max(1000)
  ),
});

export async function POST(request: NextRequest) {
  const parsed = await parseJsonBody(request, SimulateBodySchema);
  if (!parsed.success) {
    return parsed.response;
  }
  const { scenarioId, currentEcoScore } = parsed.data;

  try {
    const scenario = SimulatorService.getScenario(scenarioId);
    if (!scenario) {
      return NextResponse.json({ error: `Scenario '${scenarioId}' not found` }, { status: 404 });
    }

    // Run deterministic calculation
    const calcResult = SimulatorService.calculate(scenario, currentEcoScore);

    // Get Gemini AI narrative (non-blocking — has graceful fallback)
    const aiExplanation = await SimulatorService.getAiExplanation(scenario, calcResult);

    return NextResponse.json({ ...calcResult, aiExplanation });
  } catch (error) {
    logger.error("Simulation failed", {
      scenarioId,
      error: error instanceof Error ? error.message : String(error),
    });
    return internalError("Simulation failed. Please try again.");
  }
}
