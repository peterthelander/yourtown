import { GameState, BuildingType, Person } from './types';
import { GAME_CONFIG } from './config';

interface StateSnapshot {
  money: number;
  population: number;
  incomePerSecond: number;
  populationGrowthRate: number;
}

export class GameStateManager {
  private state: GameState;

  constructor() {
    this.state = {
      money: GAME_CONFIG.INITIAL_MONEY,
      population: GAME_CONFIG.INITIAL_POPULATION,
      buildings: [],
      buildingCounts: {} as Record<BuildingType, number>,
      people: [],
      incomePerSecond: GAME_CONFIG.BASE_INCOME_PER_SECOND,
      populationGrowthRate: GAME_CONFIG.BASE_POPULATION_GROWTH_RATE,
    };
  }

  getState(): GameState {
    return this.state;
  }

  loadSnapshot(snapshot: StateSnapshot): void {
    this.state.money = snapshot.money;
    this.state.population = snapshot.population;
    this.state.incomePerSecond = snapshot.incomePerSecond;
    this.state.populationGrowthRate = snapshot.populationGrowthRate;
  }

  addMoney(amount: number): void {
    this.state.money += amount;
  }

  spendMoney(amount: number): boolean {
    if (this.state.money < amount) return false;
    this.state.money -= amount;
    return true;
  }

  addPopulation(amount: number): void {
    this.state.population += amount;
  }

  addBuilding(type: BuildingType, x: number, y: number, element: HTMLElement): void {
    this.state.buildings.push({ type, x, y, element });
    this.state.buildingCounts[type] = (this.state.buildingCounts[type] || 0) + 1;
  }

  increaseIncomePerSecond(amount: number): void {
    this.state.incomePerSecond += amount;
  }

  increasePopulationGrowthRate(amount: number): void {
    this.state.populationGrowthRate += amount;
  }

  addPerson(person: Person): void {
    this.state.people.push(person);
  }

  removePerson(person: Person): void {
    const index = this.state.people.indexOf(person);
    if (index >= 0) {
      this.state.people.splice(index, 1);
    }
  }

  getPeople() {
    return this.state.people;
  }

  getBuildings() {
    return this.state.buildings;
  }

  getBuildingCount(type: BuildingType): number {
    return this.state.buildingCounts[type] || 0;
  }
}
