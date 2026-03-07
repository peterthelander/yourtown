import { GameStateManager } from './state';
import { BuildingManager } from './buildings';
import { UI } from './ui';
import { StoryManager } from './story';
import { GameEngine } from './gameLoop';
import { BUILDING_COSTS, BUILDING_ICONS, GAME_CONFIG } from './config';
import { BuildingType } from './types';

const LEVEL_ONE_BUILDINGS: BuildingType[] = [
  'house',
  'workplace',
  'grocery',
  'library',
  'school',
  'road',
  'street',
  'sidewalk',
  'highway',
];
const UNLOCKABLE_BUILDINGS: BuildingType[] = [
  'gym',
  'hospital',
  'cemetery',
  'restaurant',
  'church',
  'bank',
  'museum',
];
const LEVEL_OPTIONAL_INFRASTRUCTURE: BuildingType[] = ['road', 'street', 'sidewalk', 'highway'];

class Game {
  private gameState: GameStateManager;
  private buildingManager: BuildingManager;
  private ui: UI;
  private storyManager: StoryManager;
  private engine: GameEngine;
  private currentLevel: number;
  private availableBuildingTypes: BuildingType[];
  private lockedBuildingTypes: BuildingType[];

  constructor() {
    this.gameState = new GameStateManager();
    this.buildingManager = new BuildingManager(this.gameState);
    this.ui = new UI();
    this.storyManager = new StoryManager();
    this.engine = new GameEngine(this.gameState, this.buildingManager, this.ui);
    this.currentLevel = 1;
    this.availableBuildingTypes = [...LEVEL_ONE_BUILDINGS];
    this.lockedBuildingTypes = [...UNLOCKABLE_BUILDINGS];
  }

  init(): void {
    this.setupStory();
    this.setupBuilding();

    // prepare selector right away so options are visible even during story
    this.prepareBuildingSelector();

    if (GAME_CONFIG.SKIP_INTRO_STORY) {
      this.startGame();
      return;
    }

    this.showStory();
  }

  private setupStory(): void {
    const nextBtn = this.ui.getStoryButton();
    nextBtn.addEventListener('click', () => this.handleNextStory());
    this.displayCurrentStoryFrame();
  }

  private displayCurrentStoryFrame(): void {
    const frame = this.storyManager.getCurrentFrame();
    const img = document.getElementById('story-image') as HTMLImageElement;
    const text = document.getElementById('story-text');

    if (!text) throw new Error('story-text element not found');

    if (frame.img) {
      img.src = frame.img;
      img.style.display = '';
    } else {
      img.style.display = 'none';
    }
    text.textContent = frame.text;
  }

  private handleNextStory(): void {
    const hasMore = this.storyManager.nextFrame();

    if (!hasMore) {
      this.startGame();
    } else {
      this.displayCurrentStoryFrame();
    }
  }

  private showStory(): void {
    this.ui.showStory();
  }

  private startGame(): void {
    this.ui.showGame();
    this.setupBuildAction();
    this.startLevel();
  }

  private formatBuildingLabel(type: BuildingType): string {
    const icon = BUILDING_ICONS[type];
    const cost = BUILDING_COSTS[type];
    return `${icon} ${type.charAt(0).toUpperCase() + type.slice(1)} ($${cost})`;
  }

  private prepareBuildingSelector(): void {
    const select = this.ui.getBuildingTypeSelect();
    select.innerHTML = '';
    this.availableBuildingTypes.forEach((type) => {
      const option = document.createElement('option');
      option.value = type;
      option.textContent = this.formatBuildingLabel(type);
      select.appendChild(option);
    });
  }

  private unlockRandomBuildingType(): BuildingType | null {
    if (!this.lockedBuildingTypes.length) {
      return null;
    }

    const index = Math.floor(Math.random() * this.lockedBuildingTypes.length);
    const [unlocked] = this.lockedBuildingTypes.splice(index, 1);
    this.availableBuildingTypes.push(unlocked);
    this.prepareBuildingSelector();
    return unlocked;
  }

  private setupBuilding(): void {
    // Building buttons setup will be in startGame
  }

  private setupBuildAction(): void {
    const buildBtn = this.ui.getBuildButton();
    const select = this.ui.getBuildingTypeSelect();

    buildBtn.addEventListener('click', () => {
      const selectedType = select.value as BuildingType;
      this.handleBuild(selectedType);
    });
  }

  private getLevelGoalMessage(): string {
    return `Level ${this.currentLevel}: Build at least ${this.currentLevel} of each unlocked building type to advance.`;
  }

  private startLevel(): void {
    this.ui.getTownView().innerHTML = '';
    this.gameState = new GameStateManager();
    this.buildingManager = new BuildingManager(this.gameState);
    this.engine = new GameEngine(this.gameState, this.buildingManager, this.ui);
    this.engine.start();
    this.ui.updateStats(this.gameState.getState());
    this.ui.updateLevel(this.currentLevel);

    alert(
      `${this.getLevelGoalMessage()}\n\nYou start this level from scratch with fresh money, population, and no buildings.`
    );
  }

  private isCurrentLevelComplete(): boolean {
    return this.availableBuildingTypes
      .filter((type) => !LEVEL_OPTIONAL_INFRASTRUCTURE.includes(type))
      .every(
      (type) => this.gameState.getBuildingCount(type) >= this.currentLevel
    );
  }

  private advanceToNextLevel(): void {
    this.engine.stop();
    alert(`Great job! You completed Level ${this.currentLevel}.`);
    this.currentLevel += 1;
    const unlocked = this.unlockRandomBuildingType();

    if (unlocked) {
      alert(`Level ${this.currentLevel} unlocked: ${unlocked.charAt(0).toUpperCase() + unlocked.slice(1)}!`);
    }

    this.startLevel();
  }

  private handleBuild(type: BuildingType): void {
    // Create and place building first to ensure there is room
    const townView = this.ui.getTownView();
    const icon = BUILDING_ICONS[type];
    const buildingElement = this.ui.addBuildingElement(type, icon);
    townView.appendChild(buildingElement);

    const placed = this.ui.placeWithoutOverlap(buildingElement, townView);
    if (!placed) {
      buildingElement.remove();
      alert('No space left to place ' + type);
      return;
    }

    if (!this.buildingManager.build(type)) {
      buildingElement.remove();
      alert('Not enough money to build ' + type);
      return;
    }

    // Add to game state
    const x = parseFloat(buildingElement.style.left);
    const y = parseFloat(buildingElement.style.top);
    this.gameState.addBuilding(type, x, y, buildingElement);

    // Update UI immediately
    this.ui.updateStats(this.gameState.getState());

    if (this.isCurrentLevelComplete()) {
      this.advanceToNextLevel();
    }
  }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  game.init();
});
