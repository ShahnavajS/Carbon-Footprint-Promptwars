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
}

export const gemini = new GeminiService();
export default gemini;
