import { GAME_CONFIG } from './config';
import { GameState, Person } from './types';

export class UI {
  private moneyElement: HTMLElement;
  private populationElement: HTMLElement;
  private storyContainer: HTMLElement;
  private gameContainer: HTMLElement;
  private townView: HTMLElement;

  constructor() {
    this.moneyElement = this.getElement('money');
    this.populationElement = this.getElement('population');
    this.storyContainer = this.getElement('story-container');
    this.gameContainer = this.getElement('game-container');
    this.townView = this.getElement('town-view');
  }

  private getElement(id: string): HTMLElement {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Element with id "${id}" not found`);
    return el;
  }

  updateStats(state: GameState): void {
    this.moneyElement.textContent = '$' + Math.floor(state.money);
    this.populationElement.textContent = Math.floor(state.population) + ' ppl';
  }

  showStory(): void {
    this.storyContainer.classList.remove('hidden');
    this.gameContainer.classList.add('hidden');
  }

  showGame(): void {
    this.storyContainer.classList.add('hidden');
    this.gameContainer.classList.remove('hidden');
  }

  getTownView(): HTMLElement {
    return this.townView;
  }

  addBuildingElement(type: string, icon: string, color: string): HTMLElement {
    const div = document.createElement('div');
    div.className = 'building';
    div.textContent = icon;
    div.title = type;
    div.style.backgroundColor = color;
    return div;
  }

  addPersonElement(): HTMLElement {
    const div = document.createElement('div');
    div.className = 'person';
    div.textContent = '👶';
    return div;
  }

  updatePersonAppearance(person: Person): void {
    if (person.isDying) {
      person.element.textContent = '✝️';
      return;
    }

    if (person.ageMs < GAME_CONFIG.BABY_STAGE_MS) {
      person.element.textContent = '👶';
      return;
    }

    if (person.ageMs < GAME_CONFIG.CHILD_STAGE_MS) {
      person.element.textContent = person.gender === 'male' ? '👦' : '👧';
      return;
    }

    if (person.ageMs < GAME_CONFIG.ADULT_STAGE_MS) {
      person.element.textContent = person.gender === 'male' ? '👨' : '👩';
      return;
    }

    person.element.textContent = person.gender === 'male' ? '👴' : '👵';
  }

  getStoryButton(): HTMLElement {
    const btn = document.getElementById('next-story');
    if (!btn) throw new Error('Story button not found');
    return btn;
  }

  getBuildButtons(): HTMLElement[] {
    return Array.from(document.getElementsByClassName('build-btn')) as HTMLElement[];
  }

  randomizePosition(element: HTMLElement, container: HTMLElement): void {
    const rect = container.getBoundingClientRect();
    const offsetWidth = element.offsetWidth || 10;
    const offsetHeight = element.offsetHeight || 10;

    const maxX = rect.width - offsetWidth;
    const maxY = rect.height - offsetHeight;

    if (maxX < 0 || maxY < 0) {
      element.style.left = '0px';
      element.style.top = '0px';
      return;
    }

    element.style.left = Math.random() * maxX + 'px';
    element.style.top = Math.random() * maxY + 'px';
  }

  placeWithoutOverlap(element: HTMLElement, container: HTMLElement, maxAttempts = 200): boolean {
    const containerRect = container.getBoundingClientRect();
    const offsetWidth = element.offsetWidth || 10;
    const offsetHeight = element.offsetHeight || 10;
    const maxX = containerRect.width - offsetWidth;
    const maxY = containerRect.height - offsetHeight;

    if (maxX < 0 || maxY < 0) {
      return false;
    }

    const existingBuildings = Array.from(container.getElementsByClassName('building'))
      .filter((building) => building !== element) as HTMLElement[];

    for (let i = 0; i < maxAttempts; i++) {
      const x = Math.random() * maxX;
      const y = Math.random() * maxY;

      const overlaps = existingBuildings.some((building) => {
        const bx = parseFloat(building.style.left) || 0;
        const by = parseFloat(building.style.top) || 0;
        const bWidth = building.offsetWidth || offsetWidth;
        const bHeight = building.offsetHeight || offsetHeight;

        return x < bx + bWidth && x + offsetWidth > bx && y < by + bHeight && y + offsetHeight > by;
      });

      if (!overlaps) {
        element.style.left = x + 'px';
        element.style.top = y + 'px';
        return true;
      }
    }

    return false;
  }

  updatePersonPosition(element: HTMLElement, x: number, y: number): void {
    element.style.left = x + 'px';
    element.style.top = y + 'px';
  }
}
