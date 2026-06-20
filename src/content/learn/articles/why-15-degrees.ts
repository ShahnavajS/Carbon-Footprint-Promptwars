import { LearnArticleSchema, type LearnArticle } from "../schema";

const article: LearnArticle = {
  slug: "why-15-degrees",
  title: "Why 1.5°C? The number that defines our climate future",
  summary:
    "World leaders agreed to limit warming to 1.5°C. Where did that number come from, and why does every fraction of a degree matter?",
  category: "policy",
  readingMinutes: 5,
  difficulty: "intermediate",
  emoji: "🌡️",
  sections: [
    {
      heading: "The Paris Agreement's promise",
      body: `In 2015, nearly every country on Earth signed the **Paris Agreement**, committing to keep global warming "well below 2°C" and to pursue efforts to limit it to **1.5°C** above pre-industrial levels. This was the first genuinely global climate pact.

The 1.5°C figure wasn't arbitrary. A landmark 2018 IPCC report found that crossing it sharply raises the risk of drought, heatwaves, floods, and the loss of coral reefs — and that the difference between 1.5°C and 2°C of warming is not small. It's the difference between losing 70% vs 99% of the world's coral reefs.`,
    },
    {
      heading: "Every fraction of a degree counts",
      body: `Climate change isn't a cliff we fall off — it's a slope, and we're already on it. Human activity has warmed the planet by about **1.1°C** so far. The impacts we feel today (wildfires, stronger storms, melting ice) are the early signs.

Limiting warming to 1.5°C requires cutting global emissions roughly in half by 2030 and reaching net zero around 2050. That's an enormous, society-wide shift — but it's still achievable, and every ton of CO₂ we avoid makes the outcome less severe.`,
    },
    {
      heading: "What this means for you",
      body: `No single person can hold the line at 1.5°C alone. But the global budget is the sum of billions of individual and community choices. Your footprint, your vote, your voice, and the systems you influence all push the needle.

Personal action and systemic action aren't opposites — they reinforce each other. People who track and shrink their footprint also tend to demand greener products, vote for climate policy, and inspire those around them.`,
    },
  ],
  analogy:
    "Think of 1.5°C like a household budget: you can overspend a little, but the more debt you carry, the harder life gets. Every dollar saved (every ton avoided) leaves more room for a stable future.",
  callouts: [
    {
      label: "Key threshold",
      text: "1.5°C of warming is the limit nearly every country agreed to in the Paris Agreement.",
    },
    {
      label: "The gap",
      text: "Between 1.5°C and 2°C of warming, virtually all coral reefs would vanish instead of 70%.",
    },
  ],
  sources: [
    {
      label: "IPCC — Global Warming of 1.5°C (SR15)",
      url: "https://www.ipcc.ch/sr15/",
    },
    {
      label: "UNFCCC — The Paris Agreement",
      url: "https://unfccc.int/process-and-meetings/the-paris-agreement",
    },
  ],
};

LearnArticleSchema.parse(article);
export default article;
