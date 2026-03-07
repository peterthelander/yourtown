# Your Town

A browser-based strategy game where you act as the mayor of a newly founded settlement, written in TypeScript with a modular architecture.

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

## SOLID Principles Applied

- **Single Responsibility:** Each class handles one concern (state, buildings, UI, story, gameloop)
- **Open/Closed:** Easy to extend building effects or story frames without modifying core logic
- **Liskov Substitution:** Interfaces allow swapping implementations
- **Interface Segregation:** Minimal interfaces, focused on specific concerns
- **Dependency Injection:** Classes receive dependencies (GameStateManager, BuildingManager, UI) in their constructors

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
* Transport network options: sidewalks, streets, roads, and highways
* Cars spawn and travel between roads/highways while people prefer sidewalks/streets
* Real-time income and population growth

## Development Setup

### Prerequisites
- Node.js & npm installed
- Python 3 (for local server)

### Build

```bash
npm install          # Install dependencies (TypeScript, esbuild)
npm run build        # Compile TypeScript to JavaScript bundle
```

### Development Workflow

**Option 1: VS Code with F5**
1. Press **F5** to start both server and open game in browser
2. After source code changes, rebuild manually or use watch mode

**Option 2: Manual development**
1. **Terminal 1** - Watch mode (auto-rebuilds on save):
   ```bash
   npm run dev
   ```
2. **Terminal 2** - Start server:
   ```bash
   python3 -m http.server 8000
   ```
3. Open `http://localhost:8000` in browser

### Run via VS Code Tasks

- **Ctrl+Shift+P** → "Run Task" → choose:
  - "Build TypeScript" (one-time compile)
  - "Watch TypeScript" (auto-compile on save)
  - "Serve Your Town" (start HTTP server)

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
- [ ] Structured/grid-based placement
- [ ] More building effects & balancing
- [ ] Game events/challenges
- [ ] Mobile responsiveness
- [ ] Save/load persistence
- [ ] Sound & animations
