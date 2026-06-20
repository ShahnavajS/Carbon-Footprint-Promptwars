import { LearnArticleSchema, type LearnArticle } from "../schema";

const article: LearnArticle = {
  slug: "diet-vs-car",
  title: "Your diet vs your car: what actually saves more carbon?",
  summary:
    "People are often surprised by how much food choices matter for emissions. Here's the data, with no shame — just clarity.",
  category: "action",
  readingMinutes: 4,
  difficulty: "intro",
  emoji: "🥗",
  sections: [
    {
      heading: "Food has a surprisingly big footprint",
      body: `What you eat can account for **20–30% of your personal carbon footprint**. That's because different foods require vastly different amounts of land, water, and energy to produce — and because livestock, especially cattle and sheep, burp methane as they digest.

Methane is a powerful greenhouse gas, which is why beef and lamb have such high emissions per kilogram compared to plant foods.`,
    },
    {
      heading: "The numbers, per kilogram",
      body: `Approximate emissions to produce 1 kg of food (CO₂-equivalent, global averages from Our World in Data):
- **Beef (beef herd):** ~99 kg CO₂e
- **Lamb/mutton:** ~39 kg CO₂e
- **Cheese:** ~23 kg CO₂e
- **Pork:** ~12 kg CO₂e
- **Chicken:** ~9 kg CO₂e
- **Eggs:** ~4.5 kg CO₂e
- **Tofu / beans / lentils:** ~1–2 kg CO₂e

So a single beef burger can carry more emissions than several days of plant-based meals.`,
    },
    {
      heading: "Practical, kind choices",
      body: `You don't need to go fully vegan to make a difference. Research suggests that **cutting beef just a few times a week** can cut your food footprint by a meaningful chunk. Some high-impact, low-friction swaps:
- Beef → chicken, beans, or lentils
- A meat-heavy meal → a veggie version of the same dish
- One plant-based dinner per week (a "Meatless Monday")

Start where it's easy for you. Sustained small changes beat a short-lived overhaul.`,
    },
  ],
  analogy:
    "Swapping one beef meal for a plant-based one can save about as much CO₂ as driving ~15 km (9 miles) — a useful yardstick for comparing your plate to your commute.",
  callouts: [
    {
      label: "Surprise stat",
      text: "Producing 1 kg of beef emits roughly as much CO₂ as producing 50 kg of lentils.",
    },
    {
      label: "Easy win",
      text: "Cutting beef 2–3 times a week is one of the highest-impact food swaps available.",
    },
  ],
  sources: [
    {
      label: "Our World in Data — Climate impacts of food",
      url: "https://ourworldindata.org/environmental-impacts-of-food",
    },
    {
      label: "Poore & Nemecek (2018), Science — Reducing food's environmental impacts",
      url: "https://www.science.org/doi/10.1126/science.aaq0216",
    },
  ],
};

LearnArticleSchema.parse(article);
export default article;
