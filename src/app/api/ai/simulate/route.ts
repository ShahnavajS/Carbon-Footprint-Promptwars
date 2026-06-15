import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SimulatorService } from "@/services/simulator.service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { scenarioId?: string; currentEcoScore?: number };
    const { scenarioId, currentEcoScore = 0 } = body;

    if (!scenarioId || typeof scenarioId !== "string") {
      return NextResponse.json({ error: "scenarioId is required" }, { status: 400 });
    }

    const scenario = SimulatorService.getScenario(scenarioId);
    if (!scenario) {
      return NextResponse.json({ error: `Scenario '${scenarioId}' not found` }, { status: 404 });
    }

    // Run deterministic calculation
    const calcResult = SimulatorService.calculate(scenario, currentEcoScore);

    // Get Gemini AI narrative (non-blocking — has graceful fallback)
    const aiExplanation = await SimulatorService.getAiExplanation(scenario, calcResult);

    const result = { ...calcResult, aiExplanation };

    return NextResponse.json(result);
  } catch (error) {
    console.error("[/api/ai/simulate] Error:", error);
    return NextResponse.json({ error: "Simulation failed. Please try again." }, { status: 500 });
  }
}
