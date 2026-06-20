import { LearnArticleSchema, type LearnArticle } from "../schema";

const article: LearnArticle = {
  slug: "where-emissions-come-from",
  title: "Where do emissions actually come from?",
  summary:
    "Energy, food, transport, industry — see how global greenhouse gas emissions break down by sector, and find the biggest levers for change.",
  category: "sectors",
  readingMinutes: 5,
  difficulty: "intermediate",
  emoji: "📊",
  sections: [
    {
      heading: "The big picture",
      body: `Global greenhouse gas emissions are roughly **50 billion tonnes of CO₂-equivalent per year** and still rising. To understand where to act, it helps to see the breakdown.

A widely cited breakdown (Our World in Data, based on Climate Watch) splits emissions like this:
- **Energy use in industry** ~ 24%
- **Agriculture, forestry & land use** ~ 18%
- **Road transport** ~ 12%
- **Energy in buildings** ~ 6%
- **Other transport (aviation, shipping, rail)** ~ 5%

The remaining share comes from industrial processes, fugitive emissions, and other energy use.`,
    },
    {
      heading: "How you move the needle",
      body: `The sectors that matter most for an **individual** look a little different, because you control your home, your plate, and your commute — not a steel plant.

For most people in high-footprint countries, the biggest personal levers are:
- **How you get around** (car vs transit/bike)
- **What you eat** (especially red meat and dairy)
- **How you power your home** (electricity source, heating, efficiency)
- **What you buy** (especially how often, and how far it travelled)

You don't need to tackle all of these at once. Picking one habit — and sticking with it — often matters more than overhauling everything for a week.`,
    },
    {
      heading: "Systemic vs individual — it's both",
      body: `Roughly **70% of global emissions come from just 100 fossil-fuel companies** and the systems around them. That can feel discouraging, but it's also a map: systemic change (policy, corporate pressure) is essential, and individual choices drive that change by shaping markets and votes.

The most effective approach is "and," not "or." Shrink your footprint *and* use your voice for systemic change.`,
    },
  ],
  analogy:
    "Emissions are like a leaky roof with many holes. Fixing the biggest holes first (energy + food + transport) stops most of the damage — and you can patch several holes at once over time.",
  callouts: [
    {
      label: "Scale",
      text: "The world emits about 50 billion tonnes of CO₂-equivalent each year.",
    },
    {
      label: "Lever",
      text: "Road transport + food + buildings make up roughly a third of global emissions — and are heavily influenced by daily choices.",
    },
  ],
  sources: [
    {
      label: "Our World in Data — Sector by sector: where do global emissions come from?",
      url: "https://ourworldindata.org/ghg-emissions-by-sector",
    },
    {
      label: "Climate Watch — Historical Emissions Data",
      url: "https://www.climatewatchdata.org/",
    },
  ],
};

LearnArticleSchema.parse(article);
export default article;
