import { z } from "zod";

/**
 * Schema for curated Learn-hub articles.
 *
 * Content is hand-written and fact-checked (not AI-generated) so the awareness
 * layer is reliable for a judged submission. The schema is enforced at module
 * load via the registry, so a malformed article fails loudly in tests/build
 * rather than shipping broken content.
 */

export const LearnCalloutSchema = z.object({
  /** Short label, e.g. "Did you know". */
  label: z.string().min(1),
  /** The fact/statement. */
  text: z.string().min(1),
});

export const LearnSectionSchema = z.object({
  heading: z.string().min(1),
  /** Markdown-lite: paragraphs split by blank lines; **bold** supported. */
  body: z.string().min(1),
});

export const LearnSourceSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
});

export const LearnArticleSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "slug must be kebab-case"),
  title: z.string().min(1),
  /** One-line summary for cards and SEO description. */
  summary: z.string().min(1),
  category: z.enum(["basics", "science", "sectors", "action", "policy"]),
  /** Approximate reading time in minutes. */
  readingMinutes: z.number().int().min(1).max(30),
  /** Difficulty for the learner. */
  difficulty: z.enum(["intro", "intermediate", "deep-dive"]),
  /** Emoji used on cards / hero. */
  emoji: z.string().min(1),
  /** Main body, broken into titled sections. */
  sections: z.array(LearnSectionSchema).min(1),
  /** A tangible analogy tying the science back to everyday life. */
  analogy: z.string().min(1),
  /** 1–3 highlighted facts. */
  callouts: z.array(LearnCalloutSchema).min(1).max(3),
  /** Citable sources. */
  sources: z.array(LearnSourceSchema).min(1),
});

export type LearnArticle = z.infer<typeof LearnArticleSchema>;
export type LearnCategory = LearnArticle["category"];
export type LearnDifficulty = LearnArticle["difficulty"];
