import { GameStateManager } from './state';
import { BuildingManager } from './buildings';
import { UI } from './ui';
import { GAME_CONFIG } from './config';
import { Building, BuildingType, Person } from './types';

type AgeGroup = 'baby' | 'child' | 'adult' | 'elder';

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

  private getAgeGroup(ageMs: number): AgeGroup {
    if (ageMs < GAME_CONFIG.BABY_STAGE_MS) return 'baby';
    if (ageMs < GAME_CONFIG.CHILD_STAGE_MS) return 'child';
    if (ageMs < GAME_CONFIG.ADULT_STAGE_MS) return 'adult';
    return 'elder';
  }

  private getRandomBuilding(type: BuildingType): Building | undefined {
    const buildings = this.gameState
      .getBuildings()
      .filter((building) => building.type === type);

    if (!buildings.length) return undefined;
    return buildings[Math.floor(Math.random() * buildings.length)];
  }

  private setPersonAtBuilding(person: Person, building: Building): void {
    person.x = building.x;
    person.y = building.y;
    this.ui.updatePersonPosition(person.element, person.x, person.y);
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
      currentDestinationType: 'wander',
    };

    const hospital = this.getRandomBuilding('hospital');
    if (!isInitialPopulation && hospital) {
      this.setPersonAtBuilding(person, hospital);
    } else {
      this.ui.randomizePosition(element, townView);
      person.x = parseFloat(element.style.left) || 0;
      person.y = parseFloat(element.style.top) || 0;
    }

    this.ui.updatePersonAppearance(person);

    townView.appendChild(element);
    this.ui.updatePersonPosition(element, person.x, person.y);
    this.gameState.addPerson(person);
  }

  private maybeAssignDestination(person: Person): void {
    const ageGroup = this.getAgeGroup(person.ageMs);
    const buildingCounts = this.gameState.getState().buildingCounts;
    const hasHouses = (buildingCounts.house || 0) > 0;

    const destinationWeights: Array<{ type: BuildingType | 'wander'; weight: number }> = [
      { type: 'wander', weight: 1.6 },
    ];

    if (hasHouses) {
      destinationWeights.push({ type: 'house', weight: 4 });
    }

    if ((buildingCounts.library || 0) > 0) {
      destinationWeights.push({ type: 'library', weight: hasHouses ? 2.5 : 1.8 });
    }

    if (ageGroup === 'adult' && (buildingCounts.workplace || 0) > 0) {
      destinationWeights.push({ type: 'workplace', weight: hasHouses ? 3 : 2.2 });
    }

    if (ageGroup === 'child' && (buildingCounts.school || 0) > 0) {
      destinationWeights.push({ type: 'school', weight: hasHouses ? 3 : 2.2 });
    }

    if (ageGroup === 'adult' && (buildingCounts.gym || 0) > 0) {
      destinationWeights.push({ type: 'gym', weight: hasHouses ? 2.2 : 1.6 });
    }

    if ((ageGroup === 'adult' || ageGroup === 'elder') && (buildingCounts.grocery || 0) > 0) {
      destinationWeights.push({ type: 'grocery', weight: hasHouses ? 2.4 : 1.8 });
    }

    if (ageGroup === 'elder' && (buildingCounts.hospital || 0) > 0) {
      destinationWeights.push({ type: 'hospital', weight: 1.2 });
    }

    if ((buildingCounts.cemetery || 0) > 0) {
      destinationWeights.push({ type: 'cemetery', weight: ageGroup === 'elder' ? 1.4 : 0.35 });
    }

    const nearEndOfLife = person.lifeSpanMs - person.ageMs <= GAME_CONFIG.CEMETERY_END_OF_LIFE_WINDOW_MS;
    if (nearEndOfLife && ageGroup === 'elder' && (buildingCounts.cemetery || 0) > 0) {
      person.currentDestinationType = 'cemetery';
      return;
    }

    const shouldPickNew = !person.currentDestinationType || Math.random() < 0.3;
    if (!shouldPickNew) return;

    const totalWeight = destinationWeights.reduce((sum, option) => sum + option.weight, 0);
    let roll = Math.random() * totalWeight;

    for (const option of destinationWeights) {
      roll -= option.weight;
      if (roll <= 0) {
        person.currentDestinationType = option.type;
        return;
      }
    }

    person.currentDestinationType = 'wander';
  }

  private getDestinationPoint(person: Person, townWidth: number, townHeight: number): { x: number; y: number } {
    const targetType = person.currentDestinationType;

    if (!targetType || targetType === 'wander') {
      return {
        x: Math.random() * townWidth,
        y: Math.random() * townHeight,
      };
    }

    const targetBuilding = this.getRandomBuilding(targetType);
    if (!targetBuilding) {
      return {
        x: Math.random() * townWidth,
        y: Math.random() * townHeight,
      };
    }

    return {
      x: targetBuilding.x + (Math.random() - 0.5) * 24,
      y: targetBuilding.y + (Math.random() - 0.5) * 24,
    };
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
        const ageGroup = this.getAgeGroup(person.ageMs);

        const nearEndOfLife = person.lifeSpanMs - person.ageMs <= GAME_CONFIG.CEMETERY_END_OF_LIFE_WINDOW_MS;
        if (person.ageMs >= person.lifeSpanMs) {
          const cemetery = this.getRandomBuilding('cemetery');
          if (cemetery) {
            this.setPersonAtBuilding(person, cemetery);
          }
          person.isDying = true;
          person.deathTimerMs = GAME_CONFIG.DEATH_MARKER_MS;
          this.ui.updatePersonAppearance(person);
          return;
        }

        this.ui.updatePersonAppearance(person);

        const rect = townView.getBoundingClientRect();
        const personWidth = person.element.offsetWidth || 20;
        const personHeight = person.element.offsetHeight || 20;

        this.maybeAssignDestination(person);
        const target = this.getDestinationPoint(person, rect.width - personWidth, rect.height - personHeight);

        const toTargetX = target.x - person.x;
        const toTargetY = target.y - person.y;
        const distance = Math.hypot(toTargetX, toTargetY) || 1;

        const directionalStrength = nearEndOfLife && ageGroup === 'elder' ? 18 : 14;
        const wanderStrength = ageGroup === 'baby' ? 6 : 8;

        const dx = (toTargetX / distance) * directionalStrength + (Math.random() - 0.5) * wanderStrength;
        const dy = (toTargetY / distance) * directionalStrength + (Math.random() - 0.5) * wanderStrength;

        let x = person.x + dx;
        let y = person.y + dy;

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
