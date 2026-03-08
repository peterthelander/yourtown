# Your Town Repository Summary

This document is a compact but detailed orientation guide for another AI (or engineer) to quickly understand this codebase.

## 1) What this project is

**Your Town** is a browser-based town-building simulation game written in TypeScript, bundled with esbuild, and rendered with vanilla DOM APIs (no frontend framework). The player acts as mayor, places buildings, grows population/income, and advances through levels with unlocking mechanics. The game includes optional serverless persistence/leaderboard endpoints backed by Vercel KV.

Core characteristics:
- Frontend-first architecture with game state and simulation running entirely in-browser.
- Lightweight class-based modular design (`Game`, `GameStateManager`, `BuildingManager`, `GameEngine`, `UI`, `StoryManager`).
- Save/load + leaderboard APIs under `api/` intended for Vercel/serverless deployment.

## 2) High-level architecture

### Frontend modules (in `src/`)

- **`main.ts`**: Application orchestrator (`Game` class). Handles startup flow, username capture/editing, level progression, save/load calls, and wiring together subsystems.
- **`state.ts`**: Mutable state container (`GameStateManager`) for money, population, buildings, people, and derived rates.
- **`buildings.ts`**: Build affordability checks + immediate gameplay effects (income/growth modifiers by building type).
- **`gameLoop.ts`**: Time-based simulation engine (`GameEngine`) for:
  - passive income,
  - population growth,
  - spawning/removing person entities,
  - animated movement with weighted destination logic by age/building availability,
  - simple aging/death lifecycle.
- **`ui.ts`**: DOM access/manipulation layer; stat labels, view toggles, building/person element creation, placement helpers, and person emoji rendering (age/gender/skin-tone aware).
- **`story.ts`**: Intro frame progression utility.
- **`config.ts`**: Tunable constants (building costs/icons, story frames, simulation timing and lifecycle constants).
- **`types.ts`**: Shared TypeScript interfaces and union types.

### Backend/serverless modules (in `api/`)

- **`save-progress.ts`**:
  - `GET ?username=...` returns saved player progress.
  - `POST` validates and persists progress payload.
  - Updates leaderboard and recent-activity sorted sets.
- **`get-leaderboard.ts`**:
  - `GET` returns top players from sorted set.
- **`activity.ts`**:
  - `GET` returns recently active users and augments each with stored profile payload.

All API routes require `KV_REST_API_URL` to exist (otherwise they return HTTP 500 with configuration error text).

## 3) Runtime/gameplay flow

1. `DOMContentLoaded` instantiates `Game` and calls `init()`.
2. Username is loaded from localStorage or collected via modal overlay.
3. Client attempts to fetch persisted progress from `/api/save-progress?username=...`.
4. Story flow is prepared (though currently intro is skipped by default via config).
5. Build selector is pre-populated with level-1 building options.
6. On game start/level start:
   - state and engine are (re)initialized,
   - optional saved snapshot + building placements are restored,
   - game loop + animation loop begin.
7. Player builds structures via selector/button:
   - tentative element is inserted,
   - random non-overlapping placement is attempted,
   - cost/effects are applied if affordable,
   - state + UI are updated,
   - progress is saved.
8. Level-complete condition: player must own at least `currentLevel` of **each unlocked building type**.
9. On completion:
   - level increments,
   - one random locked building type is unlocked,
   - level resets with fresh base resources and empty map,
   - progress is force-saved.

## 4) Data model and key mechanics

### State shape
Game state tracks:
- money,
- population,
- building list + per-type counts,
- people entities with position/age/demographic/lifespan info,
- income per second,
- population growth rate.

### Buildings
Supported types:
`house`, `library`, `workplace`, `school`, `gym`, `grocery`, `hospital`, `cemetery`, `restaurant`, `church`, `bank`, `museum`.

Mechanics are split:
- **Cost/effect application** in `BuildingManager`.
- **Population growth multiplier via houses** in `GameEngine` (`houseCount * populationGrowthRate` over time).

Examples:
- `workplace` and `bank` increase income rate.
- `school`/`library`/`gym`/`hospital`/etc. increase growth rate in varying amounts.
- `grocery`, `restaurant`, and `museum` affect both income and growth.

### People simulation
Each person has:
- age progression and age-group classification (`baby`/`child`/`adult`/`elder`),
- randomized lifespan,
- weighted destination preference influenced by available buildings and age,
- optional “near end of life” cemetery prioritization,
- death marker phase then removal + population decrement.

Visuals use emoji variants with:
- age-based icon sets,
- gender variants,
- skin-tone modifiers,
- age-based scale transforms.

## 5) Persistence, leaderboard, and scoring

### Client autosave behavior
- `Game` auto-saves on ticks with throttling (~5 seconds minimum interval).
- Forced saves happen after building and after level transitions.
- Save payload includes username, score, level, buildings snapshot, and core economy stats.

### Score formula
`floor(money + population*10 + buildingCount*25 + level*100)`

### KV keys used by API routes
- `player:<normalized_username>` → latest saved payload.
- `leaderboard:global` (sorted set by score).
- `activity:lastSeen` (sorted set by timestamp).

### Normalization
Usernames are normalized to lowercase + trimmed on backend save route.

## 6) UI/UX structure

- Story overlay (`#story-container`) and gameplay screen (`#game-container`) are toggled with `hidden` class.
- Header shows level + username + economy stats.
- Main playfield (`#town-view`) hosts absolute-positioned buildings and people.
- Footer contains building-type `<select>` and build button.
- Username editing is inline via a temporary input field and edit icon button.

Styling is plain CSS with responsive-ish sizing using viewport units/clamps; no CSS preprocessor.

## 7) Build and development workflow

### Tooling
- TypeScript
- esbuild bundling to `dist/bundle.js`
- `serve` for static hosting of `dist`
- `concurrently` for parallel watch+serve

### npm scripts
- `npm run build`: bundle TS + copy `index.html` and `styles.css` to `dist/`.
- `npm run watch`: incremental rebuild.
- `npm run serve`: serve `dist` on port 3000.
- `npm run dev`: run watch + serve together.

## 8) Notable implementation details and caveats

- `GAME_CONFIG.SKIP_INTRO_STORY` is currently `true`, so intro story is bypassed unless changed.
- Offline/local development degrades gracefully if API routes are unavailable (fetch errors are swallowed in client save/load).
- Level progression intentionally resets map/resources each level (except progression metadata/unlocks).
- Building placement uses random trial attempts (`maxAttempts=200`) and can fail with “no space left” alert.
- No formal test suite is present.
- Frontend uses direct DOM + timeouts rather than framework state management or game libraries.

## 9) If another AI needs to modify this repo

Good starting points by task:
- **Economy balancing**: edit `src/config.ts` and `src/buildings.ts`.
- **Simulation behavior**: edit `src/gameLoop.ts`.
- **UI interactions/layout**: edit `src/ui.ts`, `index.html`, `styles.css`.
- **Progress/leaderboard schema**: edit `src/main.ts` save payload logic + `api/*.ts` route handlers.
- **Adding new building type** requires coordinated updates in:
  1. `BuildingType` union (`src/types.ts`),
  2. costs/icons (`src/config.ts`),
  3. effects (`src/buildings.ts`),
  4. unlock lists/level flow (`src/main.ts`),
  5. optional behavior weighting (`src/gameLoop.ts`).

---

If you hand this file to another AI, it should have enough context to reason about:
- project purpose,
- module boundaries,
- runtime data flow,
- persistence model,
- and where to implement common feature changes.
