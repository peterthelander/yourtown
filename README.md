# Your Town

A browser-based strategy game where you act as the mayor of a newly founded settlement, written in TypeScript with a modular architecture.

**Status:** playable browser prototype.
[Try Your Town](https://yourtown.vercel.app/).

Build a settlement, balance construction costs against income, and watch residents
move around the town. The interface is the quickest way to explore the idea;
the source separates state, building behavior, the game loop, and rendering.

## Project Structure

```
src/
  ├── main.ts          # Entry point; Game class that orchestrates everything
  ├── types.ts         # TypeScript interfaces for type safety
  ├── config.ts        # Constants: building costs, story frames, game config
  ├── state.ts         # GameStateManager - manages game state (money, population, etc)
  ├── buildings.ts     # BuildingManager - handles building logic and effects
  ├── gameLoop.ts      # GameEngine - main game loop, animation, population/income logic
  ├── story.ts         # StoryManager - manages story progression
  └── ui.ts            # UI - handles DOM updates and user interactions
dist/
  └── bundle.js        # Compiled & bundled output
```

## Design

The code separates game state, building rules, the update loop, and UI rendering.
Managers receive shared dependencies through their constructors, keeping the
main game orchestration distinct from individual rules and presentation.

## Features

* Story intro frames (text-based, ready for images)
* Bird's-eye town view with random building placement
* Population and money display in top-right
* Building buttons with cost logic and effects:
  - **House**: Increases population growth
  - **Workplace**: Generates passive income
  - **School/Library**: Boosts population growth further
  - **Gym, Grocery**: Placeholder for future features
* Animated "people" wandering around the town
* Real-time income and population growth

## Development Setup

Use Node.js 20.x (as specified in `package.json`) and npm. From the repository root:

```bash
npm ci
npm run build
npm run serve
```

Open http://localhost:3000. The initial build copies HTML and CSS into `dist/`.
For TypeScript development after that first build:

```bash
npm run dev
```

This runs the TypeScript bundle watcher and static server together. HTML/CSS changes
need another `npm run build` to copy them into `dist/`. Vercel API routes under
`api/` require a separate configured serverless environment; the static local server
does not emulate them or provide cloud persistence.

## How to Play

1. Click through the story intro (click "Next")
2. Mayor screen appears with 20 people and $100
3. Watch money increase automatically
4. Click building buttons to construct (costs deduct immediately, effects apply)
5. Watch population grow (especially with houses)
6. Workplaces generate income; schools boost growth

## Next Steps

- [ ] Add story artwork (cartoony illustrations)
- [ ] Building visual differentiation (colors, icons)
- [ ] Structured/grid-based placement & roads
- [ ] More building effects & balancing
- [ ] Game events/challenges
- [ ] Mobile responsiveness
- [ ] Save/load persistence
- [ ] Sound & animations
