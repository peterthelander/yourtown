import { GameStateManager } from './state';
import { BuildingManager } from './buildings';
import { UI } from './ui';
import { GAME_CONFIG } from './config';
import { Person } from './types';

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

    for (let i = 0; i < state.population; i++) {
      this.spawnPerson(true);
    }
  }

  private spawnPerson(isInitialPopulation = false): void {
    const townView = this.ui.getTownView();
    const element = this.ui.addPersonElement();
    const lifeSpanMs =
      GAME_CONFIG.MIN_LIFESPAN_MS +
      Math.random() * (GAME_CONFIG.MAX_LIFESPAN_MS - GAME_CONFIG.MIN_LIFESPAN_MS);
    const person: Person = {
      x: 0,
      y: 0,
      element,
      ageMs: isInitialPopulation ? Math.random() * lifeSpanMs : 0,
      gender: Math.random() < 0.5 ? 'male' : 'female',
      lifeSpanMs,
      isDying: false,
      deathTimerMs: 0,
    };

    this.ui.randomizePosition(element, townView);
    person.x = parseFloat(element.style.left) || 0;
    person.y = parseFloat(element.style.top) || 0;
    this.ui.updatePersonAppearance(person);

    townView.appendChild(element);
    this.gameState.addPerson(person);
  }

  private startPeopleAnimation(): void {
    const townView = this.ui.getTownView();
    const animationLoop = () => {
      const people = this.gameState.getPeople();
      people.forEach((person) => {
        if (person.isDying) {
          person.deathTimerMs -= GAME_CONFIG.ANIMATION_INTERVAL;
          if (person.deathTimerMs <= 0) {
            person.element.remove();
            this.gameState.removePerson(person);
            this.gameState.addPopulation(-1);
          }
          return;
        }

        person.ageMs += GAME_CONFIG.ANIMATION_INTERVAL;
        if (person.ageMs >= person.lifeSpanMs) {
          person.isDying = true;
          person.deathTimerMs = GAME_CONFIG.DEATH_MARKER_MS;
          this.ui.updatePersonAppearance(person);
          return;
        }

        this.ui.updatePersonAppearance(person);

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
        this.spawnPerson();
      }

      // Update UI
      this.ui.updateStats(state);

      setTimeout(gameLoop, GAME_CONFIG.GAME_LOOP_INTERVAL);
    };

    gameLoop();
  }
}
