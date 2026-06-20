# EcoScore — Architecture

This document explains how the codebase is layered and the conventions that keep it maintainable. It's the map for anyone extending the app.

## Layered structure

```
src/
├── domain/          Zod types & schemas — the single source of truth for data shapes
├── content/learn/   Curated, fact-checked awareness articles (+ Zod schema)
├── lib/             Pure, framework-free logic (engines, helpers, parsing)
├── repositories/    Firestore data access (one per collection)
├── services/        Business logic (EcoScore, Gemini, Twin, Activity, …)
├── hooks/           React data orchestration (realtime + REST)
├── components/      Shared UI (ui/, layout/, mascot/, auth/)
└── app/             Next.js App Router: pages + API routes
```

Each layer only imports from layers below it (domain ← lib ← repositories ← services ← hooks ← app). Business logic never leaks into pages or components.

## The unified level system

`src/domain/eco-score/levels.ts` is the **single source of truth** for score→level mapping. It exports `ECO_LEVELS` (5 tiers: Seedling → Climate Champion) plus helpers (`getEcoLevel`, `getEcoLevelNumber`, `getEcoTier`).

Every consumer imports from here:
- `eco-score.service.ts` — initial score from onboarding
- `activity.service.ts` — level after each logged action
- `journey.service.ts` — derived `JOURNEY_LEVELS` projection
- `twin.service.ts` / `voice.service.ts` — tier label for AI prompts
- `terra-biome.tsx` — biome image + tier
- `onboarding/page.tsx` — level reveal

Never re-derive a level inline. (Earlier the codebase had 5 divergent mappings; this file replaced them all.)

## Pure engines (`lib/`)

Framework-free, fully unit-tested:
- **`analogy-engine.ts`** — kg CO₂ → tangible equivalents (trees, balloons, phone charges, car-km, fan-hours) with documented physical constants.
- **`consequence-engine.ts`** — projects weekly carbon into 3 year-long scenarios (optimistic/steady/lapse) with visceral equivalents. Hope-forward tone.
- **`mascot-engine.ts`** — derives the Gaia companion's mood (hopeful/content/thriving/celebrating/wistful) from streak + recent activity. Never shames.
- **`dashboard-stats.ts`** — weekly score change, monthly goal progress, monthly report aggregation, time-ago formatting.

## Data access

Two paths, used deliberately per surface:
- **Realtime client SDK** (repositories → `services/firebase`) — for live data the user edits (activities, insights, recommendations, journal).
- **Optimized REST** (`app/api/*` via Admin SDK) — for paginated reads on the dashboard, with parallel fetching.

The dashboard's `useOptimizedDashboard` hook owns pagination (`loadMoreActivities`); pages should never call `fetch('/api/activities/recent')` directly.

## API routes

Every route:
1. Validates input with **Zod** via `lib/parse-request.ts` (`parseQuery` / `parseJsonBody`) — returns a uniform 422 on bad input.
2. Short-circuits to seeded fixture data for the **demo sentinel user** (`isDemoUid`).
3. Uses the shared error helpers (`badRequest`, `internalError`).

Routes that touch the client-SDK-backed services (`twin`, `community`) **lazy-import** them so the route module loads during static build.

## Graceful AI

Every Gemini call has a curated, deterministic fallback:
- Learn takeaway → fallback line
- Insight generation → fallback recommendations (`degraded: true`)
- Twin → seeded demo twin
- Simulator narrative → fallback string

The UI never breaks on AI failure, and climate facts are never hallucinated (the Learn articles are hand-written and fact-checked; Gemini only adds personalization).

## Demo mode

The demo sentinel user (`DEMO_UID` in `config/constants.ts`) lets the entire app run without Firebase or Gemini. The client writes `_demo_auth_user` to localStorage via `lib/demo-session.ts`, and every API route/service returns seeded data for that uid.

## Design tokens

`globals.css` defines the token system under `@theme`:
- Full emerald/teal/amber/earth color scales
- Semantic `--color-biome-*` and `--color-stakes-*` palettes
- Reusable keyframe animations (`animate-eco-*`) — defined once, applied by name

Components should prefer semantic tokens over raw colors. Motion is gated globally by `prefers-reduced-motion`.
