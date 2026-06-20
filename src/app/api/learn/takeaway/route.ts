/**
 * POST /api/learn/takeaway
 * Generates a short, personalized "why this matters for YOU" takeaway for a
 * Learn article, tailored to the user's habits and EcoScore.
 *
 * Hybrid model: the article's curated, fact-checked body is the source of
 * truth; this endpoint only adds a 1–2 sentence personal angle from Gemini.
 * On ANY failure (timeout, bad key, malformed output) it returns a curated
 * fallback so the page always renders — never blocks or hallucinates climate
 * facts.
 *
 * Demo sentinel user → deterministic seeded takeaway (no AI call).
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { gemini } from "@/services/gemini";
import { rateLimit } from "@/lib/rate-limiter";
import { getArticle } from "@/content/learn/registry";
import { isDemoUid } from "@/config/constants";
import { parseJsonBody } from "@/lib/parse-request";

export const runtime = "nodejs";
export const maxDuration = 20;

const TakeawayBodySchema = z.object({
  slug: z.string().min(1),
  userId: z.string().optional(),
  ecoScore: z.coerce.number().min(0).max(1000).optional(),
  /** The user's weakest category — helps focus the takeaway. */
  focusCategory: z.enum(["food", "transport", "energy"]).optional(),
});

/** Hard fallback — used if Gemini is unavailable. Always safe + on-topic. */
function fallbackTakeaway(ecoScore = 0): string {
  const level = ecoScore >= 600 ? "advanced" : ecoScore >= 300 ? "growing" : "early";
  return `As a climate learner at the ${level} stage, this article's core idea — that small, consistent choices add up — is exactly how real change happens. Pick one specific action from it and try it this week.`;
}

function buildPrompt(
  articleTitle: string,
  articleSummary: string,
  ecoScore: number,
  focusCategory?: string
): string {
  const focus = focusCategory ? `The user's weakest area is ${focusCategory}.` : "";
  return `You are a warm, encouraging climate coach (Finch/Headspace tone — never shaming, never preachy).

In ONE or TWO sentences, explain why this article matters personally to a user. Reference their context briefly and end with a tiny, doable next step. Keep it under 40 words. No emojis, no lists, no markdown.

Article: "${articleTitle}" — ${articleSummary}
User context: EcoScore ${ecoScore}/1000. ${focus}

Respond with only the takeaway sentence, nothing else.`;
}

export async function POST(request: NextRequest) {
  const parsed = await parseJsonBody(request, TakeawayBodySchema);
  if (!parsed.success) {
    return parsed.response;
  }
  const { slug, userId, ecoScore = 0, focusCategory } = parsed.data;

  const article = getArticle(slug);
  if (!article) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  // Demo users get an instant deterministic takeaway (no Gemini call).
  if (userId && isDemoUid(userId)) {
    return NextResponse.json({
      takeaway: fallbackTakeaway(ecoScore),
      personalized: false,
    });
  }

  try {
    // Rate-limit the AI call per user to protect the Gemini quota. Falls back
    // gracefully if the limit is hit (no error surfaced to the user).
    if (userId) {
      try {
        await rateLimit("AI", userId);
      } catch {
        return NextResponse.json({
          takeaway: fallbackTakeaway(ecoScore),
          personalized: false,
          rateLimited: true,
        });
      }
    }

    const text = await gemini.generateText(
      buildPrompt(article.title, article.summary, ecoScore, focusCategory)
    );
    const takeaway = text.trim().slice(0, 280); // hard cap to keep it tight
    if (!takeaway) throw new Error("Empty takeaway");

    return NextResponse.json({ takeaway, personalized: true });
  } catch {
    // Graceful fallback — the page must never break on AI failure.
    return NextResponse.json({
      takeaway: fallbackTakeaway(ecoScore),
      personalized: false,
    });
  }
}
