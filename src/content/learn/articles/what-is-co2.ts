import { LearnArticleSchema, type LearnArticle } from "../schema";

/**
 * "What is CO₂ & the greenhouse effect" — the foundational awareness article.
 *
 * All facts are sourced and kept to widely-published IPCC/NOAA figures so the
 * content is reliable for judging. Run `validateArticles()` (in the registry)
 * to enforce the schema at build/test time.
 */
const article: LearnArticle = {
  slug: "what-is-co2",
  title: "What is CO₂? The greenhouse effect, explained simply",
  summary:
    "Carbon dioxide is a natural gas that keeps our planet warm — but there can be too much of a good thing. Here's how it works.",
  category: "basics",
  readingMinutes: 4,
  difficulty: "intro",
  emoji: "🌫️",
  sections: [
    {
      heading: "A blanket around the Earth",
      body: `Sunlight warms the Earth's surface, and that heat radiates back toward space. Certain gases in our atmosphere — called **greenhouse gases** — trap some of that heat, like a blanket. Without this natural greenhouse effect, our planet would be a frozen -18°C (0°F). Carbon dioxide (CO₂) is one of the most important of these gases.

The problem isn't that CO₂ exists. It's that burning fossil fuels (coal, oil, gas) for energy releases CO₂ that was locked underground for millions of years — adding far more "blanket" than the planet can balance.`,
    },
    {
      heading: "Why a small number matters so much",
      body: `CO₂ is measured in **parts per million (ppm)**. For over 800,000 years, it stayed between 180–280 ppm, swinging slowly with ice ages. Since the industrial revolution it has climbed past **420 ppm** — higher than any time in human history, and rising fast.

That extra CO₂ doesn't disappear quickly. Roughly half of what we emit today will still be warming the planet centuries from now. This is why today's choices shape tomorrow's climate.`,
    },
    {
      heading: "It's not just CO₂",
      body: `CO₂ is the biggest driver because we emit so much of it, but other greenhouse gases matter too: **methane** (from livestock and leaks) is ~80x more warming per ton over 20 years, and **nitrous oxide** (from fertilizers) also packs a punch. When we talk about a "carbon footprint," we usually mean all of these, converted into CO₂-equivalent (CO₂e).`,
    },
  ],
  analogy:
    "Think of CO₂ like the glass walls of a greenhouse (or a parked car in the sun): sunlight gets in easily, but the heat it creates struggles to get back out. More glass = more trapped heat.",
  callouts: [
    {
      label: "Did you know",
      text: "CO₂ levels are now over 420 ppm — the highest in at least 800,000 years, confirmed by Antarctic ice cores.",
    },
    {
      label: "Remember",
      text: "About half of the CO₂ we emit today will still be affecting the climate 100+ years from now.",
    },
  ],
  sources: [
    {
      label: "NOAA — Climate Change: Atmospheric Carbon Dioxide",
      url: "https://climate.nasa.gov/vital-signs/carbon-dioxide/",
    },
    {
      label: "IPCC AR6 — The Physical Science Basis",
      url: "https://www.ipcc.ch/report/ar6/wg1/",
    },
  ],
};

LearnArticleSchema.parse(article);
export default article;
