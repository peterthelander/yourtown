import { GAME_CONFIG } from './config';
import { GameState, Person } from './types';

const PERSON_EMOJIS = {
  dying: '✝️',
  baby: {
    default: '🧍',
    male: '🧍‍♂️',
    female: '🧍‍♀️',
  },
  child: {
    default: '🚶',
    male: '🚶‍♂️',
    female: '🚶‍♀️',
  },
  adult: {
    default: '🧍',
    male: '🧍‍♂️',
    female: '🧍‍♀️',
  },
  elder: {
    default: '🧑‍🦯',
    male: '👨‍🦯',
    female: '👩‍🦯',
  },
} as const;


const SKIN_TONE_MODIFIERS = {
  light: '\u{1F3FB}',
  'medium-light': '\u{1F3FC}',
  medium: '\u{1F3FD}',
  'medium-dark': '\u{1F3FE}',
  dark: '\u{1F3FF}',
} as const;

function applySkinTone(emoji: string, skinTone: keyof typeof SKIN_TONE_MODIFIERS): string {
  if (!emoji.includes('🧍') && !emoji.includes('🚶') && !emoji.includes('🧑') && !emoji.includes('👨') && !emoji.includes('👩')) {
    return emoji;
  }

  const modifier = SKIN_TONE_MODIFIERS[skinTone];
  if (emoji.includes('‍')) {
    const [base, ...rest] = emoji.split('‍');
    return `${base}${modifier}‍${rest.join('‍')}`;
  }

  return `${emoji}${modifier}`;
}

const EMOJI_SCALES = {
  baby: 0.5,
  child: 0.75,
  adult: 1.0,
  elder: 1.0,
} as const;

function getEmojiStyle(age: keyof typeof PERSON_EMOJIS): {
  transform: string;
  transformOrigin: string;
} {
  const scale = EMOJI_SCALES[age as keyof typeof EMOJI_SCALES] ?? EMOJI_SCALES.adult;

  return {
    transform: `scale(${scale})`,
    transformOrigin: 'bottom center',
  };
}

function getGenderedEmoji(
  emojiSet: { default: string; male: string; female: string },
  gender: Person['gender'],
  skinTone: Person['skinTone'],
): string {
  if (gender === 'male') return applySkinTone(emojiSet.male, skinTone);
  if (gender === 'female') return applySkinTone(emojiSet.female, skinTone);
  return applySkinTone(emojiSet.default, skinTone);
}

export class UI {
  private moneyElement: HTMLElement;
  private populationElement: HTMLElement;
  private levelElement: HTMLElement;
  private usernameElement: HTMLElement;
  private editUsernameButton: HTMLButtonElement;
  private storyContainer: HTMLElement;
  private gameContainer: HTMLElement;
  private townView: HTMLElement;

  constructor() {
    this.moneyElement = this.getElement('money');
    this.populationElement = this.getElement('population');
    this.levelElement = this.getElement('level');
    this.usernameElement = this.getElement('username');
    this.editUsernameButton = this.getButtonElement('edit-username');
    this.storyContainer = this.getElement('story-container');
    this.gameContainer = this.getElement('game-container');
    this.townView = this.getElement('town-view');
  }

  private getElement(id: string): HTMLElement {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Element with id "${id}" not found`);
    return el;
  }


  private getButtonElement(id: string): HTMLButtonElement {
    const el = document.getElementById(id) as HTMLButtonElement | null;
    if (!el) throw new Error(`Button with id "${id}" not found`);
    return el;
  }

  updateStats(state: GameState): void {
    this.moneyElement.textContent = '$' + Math.floor(state.money);
    this.populationElement.textContent = Math.floor(state.population) + ' ppl';
  }

  updateLevel(level: number): void {
    this.levelElement.textContent = `Level ${level}`;
  }

  updateUsername(username: string): void {
    this.usernameElement.textContent = `Mayor: ${username}`;
    this.usernameElement.title = username;
  }


  getEditUsernameButton(): HTMLButtonElement {
    return this.editUsernameButton;
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

  addBuildingElement(type: string, icon: string): HTMLElement {
    const div = document.createElement('div');
    div.className = 'building';
    div.textContent = icon;
    div.title = type;
    return div;
  }

  addPersonElement(): HTMLElement {
    const div = document.createElement('div');
    div.className = 'person';
    div.textContent = PERSON_EMOJIS.baby.default;
    return div;
  }

  updatePersonAppearance(person: Person): void {
    if (person.isDying) {
      person.element.textContent = PERSON_EMOJIS.dying;
      Object.assign(person.element.style, getEmojiStyle('adult'));
      return;
    }

    if (person.ageMs < GAME_CONFIG.BABY_STAGE_MS) {
      person.element.textContent = getGenderedEmoji(PERSON_EMOJIS.baby, person.gender, person.skinTone);
      Object.assign(person.element.style, getEmojiStyle('baby'));
      return;
    }

    if (person.ageMs < GAME_CONFIG.CHILD_STAGE_MS) {
      person.element.textContent = getGenderedEmoji(PERSON_EMOJIS.child, person.gender, person.skinTone);
      Object.assign(person.element.style, getEmojiStyle('child'));
      return;
    }

    if (person.ageMs < GAME_CONFIG.ADULT_STAGE_MS) {
      person.element.textContent = getGenderedEmoji(PERSON_EMOJIS.adult, person.gender, person.skinTone);
      Object.assign(person.element.style, getEmojiStyle('adult'));
      return;
    }

    person.element.textContent = getGenderedEmoji(PERSON_EMOJIS.elder, person.gender, person.skinTone);
    Object.assign(person.element.style, getEmojiStyle('elder'));
  }

  getStoryButton(): HTMLElement {
    const btn = document.getElementById('next-story');
    if (!btn) throw new Error('Story button not found');
    return btn;
  }

  getBuildButton(): HTMLButtonElement {
    const btn = document.getElementById('build-button') as HTMLButtonElement | null;
    if (!btn) throw new Error('Build button not found');
    return btn;
  }

  getBuildingTypeSelect(): HTMLSelectElement {
    const select = document.getElementById('building-type') as HTMLSelectElement | null;
    if (!select) throw new Error('Building type selector not found');
    return select;
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
