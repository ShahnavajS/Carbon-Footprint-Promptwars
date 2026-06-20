# EcoScore — A Carbon Footprint **Awareness** Platform

> Small choices today. A healthier planet tomorrow.

EcoScore reframes personal carbon tracking as an **emotional, narrative journey of awareness and hope** — not a guilt-driven spreadsheet. It pairs real climate science with a living Earth you nurture, an AI companion that meets you with empathy, and a community healing the planet together.

---

## 🌍 Why this is an *awareness* platform, not just a tracker

Most carbon apps audit your emissions and shame you with numbers. Research shows that approach drives fatigue and deletion. EcoScore is built on three pillars validated by behavior-change science:

1. **Learn** — a fact-checked awareness hub (CO₂, 1.5°C, where emissions come from, diet vs car) so users *understand* the climate before they try to change it.
2. **Feel** — abstract kg CO₂ becomes tangible (trees, balloons, flights), a living Terra Biome that heals as you act, and a Gaia companion that responds with hope — never guilt.
3. **Act together** — personal rituals, a Sustainability Twin that projects your future self, consequence scenarios that show the stakes, and a community counter proving collective impact.

The full awareness loop: **Learn → Track → Reflect → Impact → Community.**

---

## 🌟 Key Features

| Feature | What it does |
|---|---|
| **📚 Learn Hub** | Curated, sourced climate explainers (`/learn`) with a hybrid AI "why this matters for YOU" takeaway. |
| **🌍 Terra Biome** | A living Earth with 5 evolving states that heal as you save carbon. |
| **🧚 Gaia Companion** | An emotional mascot whose mood reflects your streak — celebrating wins, gently welcoming you back after a lapse. |
| **🔮 Sustainability Twin** | AI profile of your strengths/growth areas + a future-self EcoScore projection (`/twin`). |
| **⚡ Impact Simulator** | "Your year at this pace" — visceral equivalents across optimistic/steady/lapse paths (`/impact`). |
| **📊 What-If Simulator** | Compare lifestyle changes side-by-side before committing (`/simulator`). |
| **👥 Community** | Hybrid leaderboard + a collective-impact counter ("together this week: X kg CO₂, Y trees") (`/community`). |
| **📓 Reflection Journal** | A quiet space to check in with your climate feelings — bidirectional emotion (`/journal`). |
| **🎯 Tangible Analogies** | Every kg CO₂ becomes phone charges, tree-days, balloons, car-km, fan-hours. |
| **🤖 AI Weekly Reflection** | Gemini-powered, Finch/Headspace-tone coaching with graceful fallback. |

---

## 🛠️ Technology Stack

- **Framework**: Next.js 15 (App Router, React 19, TypeScript)
- **Styling**: Tailwind CSS v4 with a custom design-token system (biome/stakes palettes)
- **State**: Zustand + React Query
- **Backend**: Firebase (Auth, Firestore, Cloud Functions) + Admin SDK
- **AI**: Google Gemini (`gemini-2.0-flash`) via `@google/genai`
- **Testing**: Vitest + Playwright (E2E) + jest-axe (accessibility)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm
- Firebase CLI (for local emulation)

### Setup
```bash
npm install
cp .env.example .env.local   # configure Firebase + Gemini credentials

# Run Firebase emulators (Auth + Firestore)
npm run emulators
# or on Windows PowerShell:
npm run emulators:win

# Start the dev server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

> **No Firebase/Gemini keys?** Click **"Explore Demo Mode"** on the landing or login page. The entire app runs client-side with seeded data — perfect for review.

---

## 🧪 Testing & Quality

```bash
npm run test          # unit/integration tests (Vitest)
npm run typecheck     # strict TypeScript
npm run lint          # ESLint (0 errors)
npm run test:e2e      # Playwright E2E
```

All gates are green: **0 type errors, 0 lint errors, full test suite passing, clean production build.**

---

## 🏗️ Architecture

EcoScore uses a clean, layered architecture (see `ARCHITECTURE.md` for detail):

```
domain/        → Zod types & schemas (single source of truth)
content/learn/ → curated, fact-checked awareness articles
lib/           → pure logic (levels, analogy, consequence, mascot engines)
repositories/  → Firestore data access
services/      → business logic (EcoScore, Gemini, Twin, …)
hooks/         → React data orchestration
app/           → pages (App Router) + API routes
```

**Key principles:**
- **One level system** — `domain/eco-score/levels.ts` is the single source; every surface (onboarding, journey, biome, twin) reads from it.
- **Pure engines** — analogy, consequence, mascot, and dashboard-stats logic are framework-free and fully unit-tested.
- **Graceful AI** — every Gemini call has a curated fallback so the UI never breaks or hallucinates climate facts.
- **Hybrid demo** — the entire app runs without a backend via a demo sentinel user.

---

## 📄 License

MIT
