export interface Building {
  type: BuildingType;
  x: number;
  y: number;
  element: HTMLElement;
}

export interface Person {
  x: number;
  y: number;
  element: HTMLElement;
  ageMs: number;
  gender: 'male' | 'female';
  skinTone: 'light' | 'medium-light' | 'medium' | 'medium-dark' | 'dark';
  lifeSpanMs: number;
  isDying: boolean;
  deathTimerMs: number;
  currentDestinationType?: BuildingType | 'wander';
}

export interface Car {
  x: number;
  y: number;
  element: HTMLElement;
  currentDestinationType?: 'road' | 'highway' | 'wander';
}

export interface StoryFrame {
  img: string;
  text: string;
}

export interface GameState {
  money: number;
  population: number;
  buildings: Building[];
  buildingCounts: Record<BuildingType, number>;
  people: Person[];
  cars: Car[];
  incomePerSecond: number;
  populationGrowthRate: number;
}

export type BuildingType =
  | 'sidewalk'
  | 'street'
  | 'road'
  | 'highway'
  | 'house'
  | 'library'
  | 'workplace'
  | 'school'
  | 'gym'
  | 'grocery'
  | 'hospital'
  | 'cemetery'
  | 'restaurant'
  | 'church'
  | 'bank'
  | 'museum';
