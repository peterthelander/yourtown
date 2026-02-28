import { GameStateManager } from './state';
import { BuildingManager } from './buildings';
import { UI } from './ui';
import { GAME_CONFIG } from './config';

export class GameEngine {
  constructor(
    private gameState: GameStateManager,
    private buildingManager: BuildingManager,
    private ui: UI
  ) {}

  start(): void {
    this.spawnInitialPeople();
    this.startPeopleAnimation();
    this.startGameLoop();
  }

  private spawnInitialPeople(): void {
    const state = this.gameState.getState();
    const townView = this.ui.getTownView();

    for (let i = 0; i < state.population; i++) {
      const element = this.ui.addPersonElement();
      this.ui.randomizePosition(element, townView);
      townView.appendChild(element);
      this.gameState.addPerson(0, 0, element);
    }
  }

  private startPeopleAnimation(): void {
    const townView = this.ui.getTownView();
    const animationLoop = () => {
      const people = this.gameState.getPeople();
      people.forEach((person) => {
        const rect = townView.getBoundingClientRect();
        const dx = (Math.random() - 0.5) * 20;
        const dy = (Math.random() - 0.5) * 20;

        let x = parseFloat(person.element.style.left) + dx;
        let y = parseFloat(person.element.style.top) + dy;

        const personWidth = person.element.offsetWidth || 20;
        const personHeight = person.element.offsetHeight || 20;

        x = Math.max(0, Math.min(rect.width - personWidth, x));
        y = Math.max(0, Math.min(rect.height - personHeight, y));

        this.ui.updatePersonPosition(person.element, x, y);
        person.x = x;
        person.y = y;
      });

      setTimeout(animationLoop, GAME_CONFIG.ANIMATION_INTERVAL);
    };

    animationLoop();
  }

  private startGameLoop(): void {
    const gameLoop = () => {
      const state = this.gameState.getState();

      // Passive income
      const incomeThisFrame = state.incomePerSecond / (1000 / GAME_CONFIG.GAME_LOOP_INTERVAL);
      this.gameState.addMoney(incomeThisFrame);

      // Population growth (based on houses + base rate boosted by schools/libraries)
      const houseModifier = this.buildingManager.getPopulationGrowthModifier();
      const growthThisFrame =
        (houseModifier * state.populationGrowthRate) / (1000 / GAME_CONFIG.GAME_LOOP_INTERVAL);
      this.gameState.addPopulation(growthThisFrame);

      // Spawn new people visually if population grew
      const townView = this.ui.getTownView();
      const people = this.gameState.getPeople();
      while (people.length < Math.floor(state.population)) {
        const element = this.ui.addPersonElement();
        this.ui.randomizePosition(element, townView);
        townView.appendChild(element);
        this.gameState.addPerson(0, 0, element);
      }

      // Update UI
      this.ui.updateStats(state);

      setTimeout(gameLoop, GAME_CONFIG.GAME_LOOP_INTERVAL);
    };

    gameLoop();
  }
}
