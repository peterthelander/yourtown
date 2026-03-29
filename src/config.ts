import { BuildingType, StoryFrame } from './types';

export const BUILDING_COSTS: Record<BuildingType, number> = {
  house: 50,
  library: 90,
  workplace: 80,
  school: 100,
  gym: 110,
  grocery: 60,
  hospital: 170,
  cemetery: 70,
  restaurant: 130,
  church: 140,
  bank: 220,
  museum: 200,
};

export const BUILDING_ICONS: Record<BuildingType, string> = {
  house: '🏠',
  library: '📚',
  workplace: '🏭',
  school: '🎓',
  gym: '💪',
  grocery: '🛒',
  hospital: '🏥',
  cemetery: '🪦',
  restaurant: '🍽️',
  church: '⛪',
  bank: '🏦',
  museum: '🏛️',
};

export const STORY_FRAMES: StoryFrame[] = [
  {
    img: '',
    text: 'In a distant land, a group of brave people search for unclaimed terrain.',
  },
  {
    img: '',
    text: 'After many days, they find a wide empty plain. You have been chosen as mayor.',
  },
  {
    img: '',
    text: 'With $100 and 20 hopeful settlers, your job is to guide the town to prosperity.',
  },
  {
    img: '',
    text: 'Build homes, schools, workplaces and more. Use gems to clear the dark grass, but it slowly grows back.',
  },
  {
    img: '',
    text: 'Click "Next" to get started.',
  },
];

export const GAME_CONFIG = {
  SKIP_INTRO_STORY: true,
  INITIAL_MONEY: 100,
  INITIAL_POPULATION: 20,
  BASE_INCOME_PER_SECOND: 0.5,
  BASE_POPULATION_GROWTH_RATE: 0.1,
  GAME_LOOP_INTERVAL: 50, // ms
  ANIMATION_INTERVAL: 500, // ms for people movement
  BABY_STAGE_MS: 10_000,
  CHILD_STAGE_MS: 25_000,
  ADULT_STAGE_MS: 55_000,
  MIN_LIFESPAN_MS: 360_000,
  MAX_LIFESPAN_MS: 600_000,
  DEATH_MARKER_MS: 1_500,
  CEMETERY_END_OF_LIFE_WINDOW_MS: 30_000,
};
