import { GameState } from './types';

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
    return div;
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
    element.style.left = Math.random() * Math.max(1, rect.width - offsetWidth) + 'px';
    element.style.top = Math.random() * Math.max(1, rect.height - offsetHeight) + 'px';
  }

  updatePersonPosition(element: HTMLElement, x: number, y: number): void {
    element.style.left = x + 'px';
    element.style.top = y + 'px';
  }
}
