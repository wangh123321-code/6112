import type { AIStyle, TacticType } from './types';

export const TACTIC_SENSITIVITY: Record<TacticType, number> = {
  attack: 2.0,
  control: 0.5,
  redirect: 1.2,
};

export const TACTIC_MATRIX: Record<TacticType, Record<TacticType, number>> = {
  attack: {
    attack: 0.5,
    control: 0.62,
    redirect: 0.55,
  },
  control: {
    attack: 0.38,
    control: 0.5,
    redirect: 0.45,
  },
  redirect: {
    attack: 0.45,
    control: 0.55,
    redirect: 0.5,
  },
};

export const AI_WEIGHTS: Record<AIStyle, Record<TacticType, number>> = {
  counter: {
    attack: 0.2,
    control: 0.6,
    redirect: 0.2,
  },
  aggressive: {
    attack: 0.7,
    control: 0.1,
    redirect: 0.2,
  },
  variable: {
    attack: 0.33,
    control: 0.33,
    redirect: 0.34,
  },
};

export const COUNTER_AI_BOOSTED_ATTACK_WEIGHT = 0.6;

export const RANDOM_NOISE_RANGE = 0.08;

export const POSITION_ADVANTAGE_PER_01 = 0.03;

export const WINNER_POSITION_BOOST = 0.15;

export const LOSER_OFFSET_MAGNITUDE = 0.3;

export const INITIAL_POSITION = { x: 0, y: 0 };

export const WIN_SCORE = 11;

export const DEUCE_MIN_LEAD = 2;

export const SERVE_SWITCH_INTERVAL = 2;

export const COLORS = {
  tableBg: 0x0d4f4f,
  tableLine: 0xffffff,
  player: 0xff6b35,
  ai: 0x4ecdc4,
  highlight: 0xffd93d,
  ball: 0xffffff,
} as const;

export const TABLE_DIMENSIONS = {
  width: 600,
  height: 800,
  lineWidth: 3,
} as const;
