import { GameStateManager } from './state';
import { BuildingManager } from './buildings';
import { UI } from './ui';
import { StoryManager } from './story';
import { GameEngine } from './gameLoop';
import { BUILDING_COSTS, BUILDING_ICONS, GAME_CONFIG } from './config';
import { BuildingSnapshot, BuildingType, GameState } from './types';

const LEVEL_ONE_BUILDINGS: BuildingType[] = ['house', 'workplace', 'grocery', 'library', 'school'];
const UNLOCKABLE_BUILDINGS: BuildingType[] = [
  'gym',
  'hospital',
  'cemetery',
  'restaurant',
  'church',
  'bank',
  'museum',
];

interface SavePayload {
  username: string;
  score: number;
  level: number;
  buildings: BuildingSnapshot[];
  money: number;
  population: number;
  incomePerSecond: number;
  populationGrowthRate: number;
}

class Game {
  private gameState: GameStateManager;
  private buildingManager: BuildingManager;
  private ui: UI;
  private storyManager: StoryManager;
  private engine: GameEngine;
  private currentLevel: number;
  private availableBuildingTypes: BuildingType[];
  private lockedBuildingTypes: BuildingType[];
  private username = '';
  private lastAutoSaveMs = 0;
  private loadedProgress: SavePayload | null = null;

  constructor() {
    this.gameState = new GameStateManager();
    this.buildingManager = new BuildingManager(this.gameState);
    this.ui = new UI();
    this.storyManager = new StoryManager();
    this.engine = new GameEngine(this.gameState, this.buildingManager, this.ui, (state) => this.handleTick(state));
    this.currentLevel = 1;
    this.availableBuildingTypes = [...LEVEL_ONE_BUILDINGS];
    this.lockedBuildingTypes = [...UNLOCKABLE_BUILDINGS];
  }

  async init(): Promise<void> {
    this.username = await this.ensureUsername();
    await this.loadProgress();

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

  private async ensureUsername(): Promise<string> {
    const storageKey = 'yourtown_user';
    const existing = localStorage.getItem(storageKey);

    if (existing) {
      return existing;
    }

    const overlay = document.createElement('div');
    overlay.className = 'username-overlay';

    const card = document.createElement('div');
    card.className = 'username-card';

    const title = document.createElement('h2');
    title.textContent = 'Welcome to Your Town';

    const subtitle = document.createElement('p');
    subtitle.textContent = 'Pick a username to save your progress and appear on the leaderboard.';

    const input = document.createElement('input');
    input.placeholder = 'Mayor name';
    input.maxLength = 24;
    input.autocomplete = 'username';

    const button = document.createElement('button');
    button.textContent = 'Start Building';

    const errorText = document.createElement('p');
    errorText.className = 'username-error';

    card.append(title, subtitle, input, button, errorText);
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    return await new Promise<string>((resolve) => {
      const submit = () => {
        const value = input.value.trim();
        if (!value) {
          errorText.textContent = 'Username is required.';
          return;
        }

        localStorage.setItem(storageKey, value);
        overlay.remove();
        resolve(value);
      };

      button.addEventListener('click', submit);
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          submit();
        }
      });

      input.focus();
    });
  }

  private async loadProgress(): Promise<void> {
    try {
      const response = await fetch(`/api/save-progress?username=${encodeURIComponent(this.username)}`);
      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as { progress?: SavePayload };
      if (!data.progress) {
        return;
      }

      this.loadedProgress = data.progress;
      this.currentLevel = Math.max(1, Math.floor(data.progress.level || 1));
    } catch {
      // no-op: game should still boot offline/local dev without API routes
    }
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
    this.startLevel(this.loadedProgress);
    this.loadedProgress = null;
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

  private startLevel(savedProgress?: SavePayload | null): void {
    this.ui.getTownView().innerHTML = '';
    this.gameState = new GameStateManager();
    this.buildingManager = new BuildingManager(this.gameState);
    this.engine = new GameEngine(this.gameState, this.buildingManager, this.ui, (state) => this.handleTick(state));

    if (savedProgress) {
      this.gameState.loadSnapshot({
        money: savedProgress.money,
        population: savedProgress.population,
        incomePerSecond: savedProgress.incomePerSecond,
        populationGrowthRate: savedProgress.populationGrowthRate,
      });

      savedProgress.buildings.forEach((building) => {
        const buildingElement = this.ui.addBuildingElement(building.type, BUILDING_ICONS[building.type]);
        buildingElement.style.left = `${building.x}px`;
        buildingElement.style.top = `${building.y}px`;
        this.ui.getTownView().appendChild(buildingElement);
        this.gameState.addBuilding(building.type, building.x, building.y, buildingElement);
      });
    }

    this.engine.start();
    this.ui.updateStats(this.gameState.getState());
    this.ui.updateLevel(this.currentLevel);

    if (!savedProgress) {
      alert(
        `${this.getLevelGoalMessage()}\n\nYou start this level from scratch with fresh money, population, and no buildings.`
      );
    }
  }

  private isCurrentLevelComplete(): boolean {
    return this.availableBuildingTypes.every(
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
    void this.saveProgress(true);
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

    void this.saveProgress(true);

    if (this.isCurrentLevelComplete()) {
      this.advanceToNextLevel();
    }
  }

  private buildSavePayload(state: GameState): SavePayload {
    return {
      username: this.username,
      score: this.calculateScore(state),
      level: this.currentLevel,
      buildings: state.buildings.map((building) => ({
        type: building.type,
        x: building.x,
        y: building.y,
      })),
      money: state.money,
      population: state.population,
      incomePerSecond: state.incomePerSecond,
      populationGrowthRate: state.populationGrowthRate,
    };
  }

  private calculateScore(state: GameState): number {
    return Math.floor(state.money + state.population * 10 + state.buildings.length * 25 + this.currentLevel * 100);
  }

  private handleTick(state: GameState): void {
    void this.saveProgress(false, state);
  }

  private async saveProgress(force = false, stateOverride?: GameState): Promise<void> {
    const now = Date.now();
    const minIntervalMs = 5000;

    if (!force && now - this.lastAutoSaveMs < minIntervalMs) {
      return;
    }

    const state = stateOverride ?? this.gameState.getState();
    this.lastAutoSaveMs = now;

    try {
      await fetch('/api/save-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.buildSavePayload(state)),
      });
    } catch {
      // no-op
    }
  }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  void game.init();
});
