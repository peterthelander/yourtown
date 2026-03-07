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
  lifeSpanMs: number;
  isDying: boolean;
  deathTimerMs: number;
  currentDestinationType?: BuildingType | 'wander';
}

export interface Vehicle {
  x: number;
  y: number;
  element: HTMLElement;
  currentDestinationType?: 'road' | 'highway';
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
  incomePerSecond: number;
  populationGrowthRate: number;
}

export type BuildingType =
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
  | 'museum'
  | 'road'
  | 'street'
  | 'sidewalk'
  | 'highway';
