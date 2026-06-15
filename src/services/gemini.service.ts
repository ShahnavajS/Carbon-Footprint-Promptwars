import gemini from "@/services/gemini";

interface GenerateJsonOptions {
  temperature?: number;
  maxTokens?: number;
}

export class GeminiService {
  async generateJSON(prompt: string, options: GenerateJsonOptions = {}) {
    void options;
    const raw = await gemini.generateText(prompt);
    const trimmed = raw.trim();

    try {
      return JSON.parse(trimmed) as Record<string, unknown>;
    } catch {
      const jsonMatch = trimmed.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as Record<string, unknown>;
      }
      throw new Error("Gemini returned invalid JSON");
    }
  }
}

export default GeminiService;
