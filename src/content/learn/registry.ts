import { LearnArticleSchema, type LearnArticle, type LearnCategory } from "./schema";
import whatIsCo2 from "./articles/what-is-co2";
import why15Degrees from "./articles/why-15-degrees";
import whereEmissionsComeFrom from "./articles/where-emissions-come-from";
import dietVsCar from "./articles/diet-vs-car";

/**
 * Registry of curated Learn-hub articles.
 *
 * Articles are imported statically so they're bundled (no runtime fetch) and
 * validated once against the Zod schema — a malformed article fails at import,
 * which surfaces in tests/build rather than shipping broken content.
 *
 * To add an article: create a new file under `articles/`, import it here, and
 * add it to the array. The schema parse in each article file guards the shape.
 */

export const LEARN_ARTICLES: readonly LearnArticle[] = [
  whatIsCo2,
  why15Degrees,
  whereEmissionsComeFrom,
  dietVsCar,
];

/** Re-validate the whole registry at load (belt-and-braces over per-file parse). */
function validateAll(): void {
  for (const article of LEARN_ARTICLES) {
    const result = LearnArticleSchema.safeParse(article);
    if (!result.success) {
      throw new Error(
        `Invalid Learn article "${article.slug}": ${JSON.stringify(result.error.flatten())}`
      );
    }
  }
  // Ensure slug uniqueness.
  const slugs = LEARN_ARTICLES.map((a) => a.slug);
  const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i);
  if (dupes.length > 0) {
    throw new Error(`Duplicate Learn article slugs: ${dupes.join(", ")}`);
  }
}
validateAll();

/** Look up a single article by slug, or undefined. */
export function getArticle(slug: string): LearnArticle | undefined {
  return LEARN_ARTICLES.find((a) => a.slug === slug);
}

/** Returns articles filtered by category (or all if omitted), newest-first stable order. */
export function getArticlesByCategory(category?: LearnCategory): LearnArticle[] {
  if (!category) return [...LEARN_ARTICLES];
  return LEARN_ARTICLES.filter((a) => a.category === category);
}

export const LEARN_CATEGORY_LABELS: Record<LearnCategory, string> = {
  basics: "Climate Basics",
  science: "The Science",
  sectors: "Where Emissions Come From",
  action: "What You Can Do",
  policy: "Policy & Goals",
};
