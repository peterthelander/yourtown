import { GameStateManager } from './state';
import { BuildingManager } from './buildings';
import { UI } from './ui';
import { StoryManager } from './story';
import { GameEngine } from './gameLoop';
import { BUILDING_COSTS, BUILDING_ICONS, BUILDING_COLORS, GAME_CONFIG } from './config';

class Game {
  private gameState: GameStateManager;
  private buildingManager: BuildingManager;
  private ui: UI;
  private storyManager: StoryManager;
  private engine: GameEngine;

  constructor() {
    this.gameState = new GameStateManager();
    this.buildingManager = new BuildingManager(this.gameState);
    this.ui = new UI();
    this.storyManager = new StoryManager();
    this.engine = new GameEngine(this.gameState, this.buildingManager, this.ui);
  }

  init(): void {
    this.setupStory();
    this.setupBuilding();

    // prepare buttons right away so icons are visible even during story
    this.prepareBuildButtons();

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
    this.setupBuildingButtons();
    this.engine.start();
  }

  private prepareBuildButtons(): void {
    const buildBtns = this.ui.getBuildButtons();
    buildBtns.forEach((btn) => {
      const type = btn.getAttribute('data-type');
      if (type) {
        const icon = BUILDING_ICONS[type as keyof typeof BUILDING_ICONS];
        const cost = BUILDING_COSTS[type as keyof typeof BUILDING_COSTS];
        btn.innerText = `${icon} ${type.charAt(0).toUpperCase() + type.slice(1)} ($${cost})`;
        const color = BUILDING_COLORS[type as keyof typeof BUILDING_COLORS];
        btn.style.backgroundColor = color;
      }
    });
  }

  private setupBuilding(): void {
    // Building buttons setup will be in startGame
  }

  private setupBuildingButtons(): void {
    const buildBtns = this.ui.getBuildButtons();

    buildBtns.forEach((btn) => {
      const type = btn.getAttribute('data-type');
      if (type) {
        const icon = BUILDING_ICONS[type as keyof typeof BUILDING_ICONS];
        const cost = BUILDING_COSTS[type as keyof typeof BUILDING_COSTS];
        btn.innerText = `${icon} ${type.charAt(0).toUpperCase() + type.slice(1)} ($${cost})`;
      }

      btn.addEventListener('click', () => {
        const t = btn.getAttribute('data-type');
        if (t) {
          this.handleBuild(t as keyof typeof BUILDING_COSTS);
        }
      });
    });
  }

  private handleBuild(type: keyof typeof BUILDING_COSTS): void {
    // Create and place building first to ensure there is room
    const townView = this.ui.getTownView();
    const icon = BUILDING_ICONS[type];
    const color = BUILDING_COLORS[type];
    const buildingElement = this.ui.addBuildingElement(type, icon, color);
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
  }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  game.init();
});
