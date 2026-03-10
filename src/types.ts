export interface BuildingSnapshot {
  type: BuildingType;
  x: number;
  y: number;
}

export interface Building extends BuildingSnapshot {
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

export interface StoryFrame {
  img: string;
  text: string;
}

export interface GameState {
  money: number;
  gems: number;
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
  | 'museum';
