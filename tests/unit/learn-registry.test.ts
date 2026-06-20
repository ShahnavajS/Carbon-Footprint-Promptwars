import { describe, it, expect } from "vitest";
import {
  LEARN_ARTICLES,
  getArticle,
  getArticlesByCategory,
  LEARN_CATEGORY_LABELS,
} from "@/content/learn/registry";

describe("learn content registry", () => {
  it("exposes a non-empty set of validated articles", () => {
    expect(LEARN_ARTICLES.length).toBeGreaterThan(0);
  });

  it("returns the article by slug", () => {
    const first = LEARN_ARTICLES[0];
    expect(getArticle(first.slug)?.slug).toBe(first.slug);
  });

  it("returns undefined for an unknown slug", () => {
    expect(getArticle("does-not-exist")).toBeUndefined();
  });

  it("filters articles by category", () => {
    const basics = getArticlesByCategory("basics");
    expect(basics.length).toBeGreaterThan(0);
    expect(basics.every((a) => a.category === "basics")).toBe(true);
  });

  it("labels every category present in the articles", () => {
    const usedCategories = new Set(LEARN_ARTICLES.map((a) => a.category));
    for (const cat of usedCategories) {
      expect(LEARN_CATEGORY_LABELS[cat]).toBeTruthy();
    }
  });

  it("every article has at least one source and one callout", () => {
    for (const article of LEARN_ARTICLES) {
      expect(article.sources.length).toBeGreaterThanOrEqual(1);
      expect(article.callouts.length).toBeGreaterThanOrEqual(1);
      expect(article.sections.length).toBeGreaterThanOrEqual(1);
    }
  });
});
