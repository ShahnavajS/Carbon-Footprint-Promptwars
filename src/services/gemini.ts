import { GoogleGenAI, Type } from "@google/genai";

const isServer = typeof window === "undefined";

/**
 * Enhanced Gemini AI Service.
 * All methods are server-only — enforced at runtime.
 * Supports structured JSON output via responseMimeType to prevent hallucinated formats.
 */
class GeminiService {
  private aiInstance: GoogleGenAI | null = null;

  private getClient(): GoogleGenAI {
    if (!isServer) {
      throw new Error(
        "Security Error: Gemini AI SDK cannot be used client-side. Use /api/ai/* routes."
      );
    }
    if (!this.aiInstance) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not configured.");
      }
      this.aiInstance = new GoogleGenAI({ apiKey });
    }
    return this.aiInstance;
  }

  /**
   * Generates free-form text. Used for simulator AI narrative explanations.
   */
  public async generateText(prompt: string): Promise<string> {
    const ai = this.getClient();
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });
      return response.text ?? "";
    } catch (error) {
      console.error("[Gemini] generateText error:", error);
      throw error;
    }
  }

  /**
   * Generates a structured JSON insight object.
   * Uses responseMimeType JSON + responseSchema for deterministic output.
   */
  public async generateInsightJSON(prompt: string): Promise<string> {
    const ai = this.getClient();
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              summary: { type: Type.STRING },
              biggestWin: { type: Type.STRING },
              improvementArea: { type: Type.STRING },
              nextStep: { type: Type.STRING },
            },
            required: ["title", "summary", "biggestWin", "improvementArea", "nextStep"],
          },
        },
      });
      return response.text ?? "{}";
    } catch (error) {
      console.error("[Gemini] generateInsightJSON error:", error);
      throw error;
    }
  }

  /**
   * Generates a structured JSON array of recommendations.
   */
  public async generateRecommendationsJSON(prompt: string): Promise<string> {
    const ai = this.getClient();
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                action: { type: Type.STRING },
                reason: { type: Type.STRING },
                category: { type: Type.STRING },
                estimatedCarbonSaved: { type: Type.NUMBER },
                estimatedPoints: { type: Type.INTEGER },
              },
              required: ["action", "reason", "category", "estimatedCarbonSaved", "estimatedPoints"],
            },
          },
        },
      });
      return response.text ?? "[]";
    } catch (error) {
      console.error("[Gemini] generateRecommendationsJSON error:", error);
      throw error;
    }
  }

  /**
   * Generates free-form text and parses it as JSON.
   * Used by services that build their own prompt and need flexible JSON
   * (objects or arrays) without a fixed response schema. Includes a regex
   * fallback to recover a JSON fragment from noisy model output.
   *
   * `options.temperature` / `options.maxTokens` are accepted for future use
   * (callers pass them today); they are intentionally not forwarded until the
   * upstream schema-bearing methods expose a matching config surface.
   */
  public async generateJSON(
    prompt: string,
    options: { temperature?: number; maxTokens?: number } = {}
  ): Promise<Record<string, unknown> | unknown[]> {
    void options;
    const raw = await this.generateText(prompt);
    const trimmed = raw.trim();

    try {
      return JSON.parse(trimmed) as Record<string, unknown> | unknown[];
    } catch {
      const jsonMatch = trimmed.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as Record<string, unknown> | unknown[];
      }
      throw new Error("Gemini returned invalid JSON");
    }
  }
}

export const gemini = new GeminiService();
export default gemini;
