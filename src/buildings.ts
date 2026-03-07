import { BuildingType } from './types';
import { GameStateManager } from './state';
import { BUILDING_COSTS } from './config';

export class BuildingManager {
  constructor(private gameState: GameStateManager) {}

  canBuild(type: BuildingType): boolean {
    const cost = BUILDING_COSTS[type];
    const state = this.gameState.getState();
    return state.money >= cost;
  }

  build(type: BuildingType): boolean {
    const state = this.gameState.getState();
    const cost = BUILDING_COSTS[type];

    if (!this.canBuild(type)) {
      return false;
    }

    // Deduct cost
    if (!this.gameState.spendMoney(cost)) {
      return false;
    }

    // Apply effects
    this.applyBuildingEffects(type);

    return true;
  }

  private applyBuildingEffects(type: BuildingType): void {
    switch (type) {
      case 'sidewalk':
      case 'street':
      case 'road':
      case 'highway':
        // Transportation buildings affect movement behavior, not economy stats directly.
        break;
      case 'workplace':
        this.gameState.increaseIncomePerSecond(0.5);
        break;
      case 'school':
      case 'library':
        this.gameState.increasePopulationGrowthRate(0.05);
        break;
      case 'house':
        // Houses are handled separately in game loop for growth
        break;
      case 'gym':
        this.gameState.increasePopulationGrowthRate(0.03);
        break;
      case 'grocery':
        this.gameState.increaseIncomePerSecond(0.15);
        this.gameState.increasePopulationGrowthRate(0.01);
        break;
      case 'hospital':
        this.gameState.increasePopulationGrowthRate(0.04);
        break;
      case 'cemetery':
        this.gameState.increasePopulationGrowthRate(0.01);
        break;
      case 'restaurant':
        this.gameState.increaseIncomePerSecond(0.25);
        this.gameState.increasePopulationGrowthRate(0.02);
        break;
      case 'church':
        this.gameState.increasePopulationGrowthRate(0.03);
        break;
      case 'bank':
        this.gameState.increaseIncomePerSecond(0.7);
        break;
      case 'museum':
        this.gameState.increaseIncomePerSecond(0.2);
        this.gameState.increasePopulationGrowthRate(0.03);
        break;
    }
  }

  getPopulationGrowthModifier(): number {
    const houseCount = this.gameState.getBuildingCount('house');
    return houseCount; // each house increases growth
  }
}
