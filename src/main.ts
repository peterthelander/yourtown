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
  gems: number;
  grimeLevel: number;
  population: number;
  incomePerSecond: number;
  populationGrowthRate: number;
}

interface GemPack {
  id: string;
  label: string;
  gems: number;
  priceUsd: number;
}

const GEM_PACKS: GemPack[] = [
  { id: 'single', label: 'Single Gem', gems: 1, priceUsd: 0.05 },
  { id: 'starter', label: 'Starter Pack', gems: 25, priceUsd: 1.25 },
  { id: 'value', label: 'Value Pack', gems: 120, priceUsd: 6.0 },
  { id: 'mayor', label: 'Mayor Pack', gems: 300, priceUsd: 15.0 },
  { id: 'mega', label: 'Mega Pack', gems: 1000, priceUsd: 50.0 },
];

class Game {
  private static readonly GEM_CLEAN_AMOUNT = 30;
  private static readonly GRASS_REGROWTH_PER_SECOND = 1.5;
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
  private activeStoreTab: 'buildings' | 'gems' = 'buildings';
  private lastGrimeTickMs = 0;
  private static readonly USERNAME_STORAGE_KEY = 'yourtown_user';

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
    this.ui.updateUsername(this.username);
    this.setupUsernameEditing();
    await this.loadProgress();

    this.setupStory();
    this.setupBuilding();
    this.setupStore();
    this.setupGemCleaning();

    // prepare selector right away so options are visible even during story
    this.prepareBuildingSelector();

    if (GAME_CONFIG.SKIP_INTRO_STORY) {
      this.startGame();
      return;
    }

    this.showStory();
  }

  private async ensureUsername(): Promise<string> {
    const existing = localStorage.getItem(Game.USERNAME_STORAGE_KEY);

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

        localStorage.setItem(Game.USERNAME_STORAGE_KEY, value);
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

  private setupUsernameEditing(): void {
    const editButton = this.ui.getEditUsernameButton();

    editButton.addEventListener('click', () => {
      const usernameWrap = document.getElementById('username-wrap');
      const usernameLabel = document.getElementById('username');
      if (!usernameWrap || !usernameLabel || usernameWrap.querySelector('.username-editor')) {
        return;
      }

      const input = document.createElement('input');
      input.className = 'username-editor';
      input.value = this.username;
      input.maxLength = 24;
      input.setAttribute('aria-label', 'Edit username');

      const commit = () => {
        if (!input.isConnected) {
          return;
        }

        const trimmedUsername = input.value.trim();
        if (!trimmedUsername) {
          input.classList.add('invalid');
          return;
        }

        input.removeEventListener('blur', commit);

        const normalizedUsername = trimmedUsername.slice(0, 24);
        this.username = normalizedUsername;
        localStorage.setItem(Game.USERNAME_STORAGE_KEY, normalizedUsername);
        this.ui.updateUsername(normalizedUsername);
        input.remove();
        editButton.hidden = false;
      };

      const cancel = () => {
        if (!input.isConnected) {
          return;
        }

        input.remove();
        editButton.hidden = false;
      };

      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          commit();
          return;
        }

        if (event.key === 'Escape') {
          cancel();
        }
      });

      input.addEventListener('input', () => {
        input.classList.remove('invalid');
      });

      input.addEventListener('blur', commit);

      editButton.hidden = true;
      usernameLabel.insertAdjacentElement('afterend', input);
      input.focus();
      input.select();
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

  private setupStore(): void {
    const storeButton = this.ui.getStoreButton();
    const storeModal = this.ui.getStoreModal();
    const storeClose = this.ui.getStoreCloseButton();
    const buildingsTab = this.ui.getStoreBuildingsTab();
    const gemsTab = this.ui.getStoreGemsTab();

    storeButton.addEventListener('click', () => {
      this.activeStoreTab = 'buildings';
      this.renderStore();
      storeModal.classList.remove('hidden');
    });

    storeClose.addEventListener('click', () => {
      storeModal.classList.add('hidden');
    });

    buildingsTab.addEventListener('click', () => {
      this.activeStoreTab = 'buildings';
      this.renderStore();
    });

    gemsTab.addEventListener('click', () => {
      this.activeStoreTab = 'gems';
      this.renderStore();
    });
  }

  private setupGemCleaning(): void {
    const useGemButton = this.ui.getUseGemButton();
    useGemButton.addEventListener('click', () => this.handleUseGem());
  }

  private handleUseGem(): void {
    const state = this.gameState.getState();
    if (state.gems < 1) {
      alert('You need at least 1 gem.');
      return;
    }

    this.gameState.addGems(-1);
    this.gameState.setGrimeLevel(state.grimeLevel - Game.GEM_CLEAN_AMOUNT);
    const updatedState = this.gameState.getState();
    this.ui.updateStats(updatedState);
    this.ui.updateGrassVisual(updatedState.grimeLevel);

    if (updatedState.grimeLevel <= 0) {
      alert('The ugly grass is gone! Bright flowers and fresh-cut grass are now visible.');
    }

    void this.saveProgress(true, updatedState);
  }

  private renderStore(): void {
    const buildingsTab = this.ui.getStoreBuildingsTab();
    const gemsTab = this.ui.getStoreGemsTab();
    const content = this.ui.getStoreContent();

    buildingsTab.classList.toggle('active', this.activeStoreTab === 'buildings');
    gemsTab.classList.toggle('active', this.activeStoreTab === 'gems');

    if (this.activeStoreTab === 'buildings') {
      this.renderBuildingStore(content);
      return;
    }

    this.renderGemStore(content);
  }

  private renderBuildingStore(container: HTMLElement): void {
    container.innerHTML = '';
    const list = document.createElement('div');
    list.className = 'store-list';

    const allBuildings = [...LEVEL_ONE_BUILDINGS, ...UNLOCKABLE_BUILDINGS];
    allBuildings.forEach((type) => {
      const row = document.createElement('div');
      row.className = 'store-item';
      const unlocked = this.availableBuildingTypes.includes(type);
      row.innerHTML = `
        <div class="store-item-label">${BUILDING_ICONS[type]} ${type}</div>
        <div class="store-item-meta">$${BUILDING_COSTS[type]} · ${unlocked ? 'Unlocked' : 'Locked'}</div>
      `;
      list.appendChild(row);
    });

    container.appendChild(list);
  }

  private renderGemStore(container: HTMLElement): void {
    container.innerHTML = '';
    const note = document.createElement('p');
    note.className = 'store-note';
    note.textContent = 'Use a gem each time to clear dark grass. It clears immediately, then slowly grows back.';
    container.appendChild(note);

    const list = document.createElement('div');
    list.className = 'store-list';

    GEM_PACKS.forEach((pack) => {
      const row = document.createElement('div');
      row.className = 'store-item gem-pack';

      const info = document.createElement('div');
      info.innerHTML = `<div class="store-item-label">💎 ${pack.label}</div><div class="store-item-meta">${pack.gems} gems · $${pack.priceUsd.toFixed(2)}</div>`;

      const buyButton = document.createElement('button');
      buyButton.type = 'button';
      buyButton.textContent = 'Buy';
      buyButton.addEventListener('click', () => {
        this.gameState.addGems(pack.gems);
        this.ui.updateStats(this.gameState.getState());
        alert(`Purchased ${pack.gems} gems for $${pack.priceUsd.toFixed(2)}.`);
      });

      row.append(info, buyButton);
      list.appendChild(row);
    });

    container.appendChild(list);
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
        gems: savedProgress.gems,
        grimeLevel: savedProgress.grimeLevel,
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
    this.lastGrimeTickMs = Date.now();
    this.ui.updateStats(this.gameState.getState());
    this.ui.updateGrassVisual(this.gameState.getState().grimeLevel);
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
      gems: state.gems,
      grimeLevel: state.grimeLevel,
      population: state.population,
      incomePerSecond: state.incomePerSecond,
      populationGrowthRate: state.populationGrowthRate,
    };
  }

  private calculateScore(state: GameState): number {
    return Math.floor(state.money + state.population * 10 + state.buildings.length * 25 + this.currentLevel * 100);
  }

  private handleTick(state: GameState): void {
    const now = Date.now();
    const elapsedSeconds = Math.max(0, (now - this.lastGrimeTickMs) / 1000);
    this.lastGrimeTickMs = now;
    if (elapsedSeconds > 0) {
      this.gameState.setGrimeLevel(state.grimeLevel + elapsedSeconds * Game.GRASS_REGROWTH_PER_SECOND);
      state = this.gameState.getState();
      this.ui.updateGrassVisual(state.grimeLevel);
    }
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
