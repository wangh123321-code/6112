import type { AIStyle, TacticType, CustomTactic } from './types';
import { BUILTIN_TACTICS } from './types';
import type { CounterRelation } from './types';
import { buildCounterMatrix, getCounterAdvantage } from '../utils/tacticMatrix';

const BUILTIN_SENSITIVITY: Record<string, number> = {
  attack: 2.0,
  control: 0.5,
  redirect: 1.2,
};

export function getTacticSensitivity(
  tacticId: TacticType,
  tactics?: CustomTactic[]
): number {
  if (BUILTIN_SENSITIVITY[tacticId] !== undefined) {
    return BUILTIN_SENSITIVITY[tacticId];
  }
  if (tactics) {
    const t = tactics.find((x) => x.id === tacticId);
    if (t) {
      switch (t.riskLevel) {
        case 'high':
          return 2.0;
        case 'low':
          return 0.5;
        default:
          return 1.2;
      }
    }
  }
  return 1.0;
}

export function buildTacticMatrix(
  tactics: CustomTactic[],
  relations: CounterRelation[]
): Record<string, Record<string, number>> {
  const matrix: Record<string, Record<string, number>> = {};
  const counterMatrix = buildCounterMatrix(tactics, relations);

  for (const a of tactics) {
    matrix[a.id] = {};
    for (const b of tactics) {
      if (a.id === b.id) {
        matrix[a.id][b.id] = 0.5;
      } else {
        const base = (a.baseWinRate + (1 - b.baseWinRate)) / 2;
        const advantage = getCounterAdvantage(a.id, b.id, counterMatrix);
        matrix[a.id][b.id] = Math.max(0.05, Math.min(0.95, base + advantage));
      }
    }
  }
  return matrix;
}

const LEGACY_TACTIC_MATRIX: Record<TacticType, Record<TacticType, number>> = {
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

export function getWinRateFromMatrix(
  playerTactic: TacticType,
  aiTactic: TacticType,
  tactics: CustomTactic[] = BUILTIN_TACTICS,
  relations: CounterRelation[] = []
): number {
  if (
    LEGACY_TACTIC_MATRIX[playerTactic] &&
    LEGACY_TACTIC_MATRIX[playerTactic][aiTactic] !== undefined &&
    tactics.length === 3 &&
    relations.length === 0
  ) {
    return LEGACY_TACTIC_MATRIX[playerTactic][aiTactic];
  }
  const matrix = buildTacticMatrix(tactics, relations);
  if (matrix[playerTactic] && matrix[playerTactic][aiTactic] !== undefined) {
    return matrix[playerTactic][aiTactic];
  }
  return 0.5;
}

export const AI_WEIGHTS: Record<AIStyle, Record<string, number>> = {
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

export function getAIWeights(
  style: AIStyle,
  tactics: CustomTactic[]
): Record<string, number> {
  const base = { ...AI_WEIGHTS[style] };
  const weights: Record<string, number> = {};
  const builtinIds = ['attack', 'control', 'redirect'];

  for (const t of tactics) {
    if (builtinIds.includes(t.id)) {
      weights[t.id] = base[t.id] ?? 0.33;
    } else {
      switch (t.riskLevel) {
        case 'high':
          weights[t.id] = base.attack * 0.5;
          break;
        case 'low':
          weights[t.id] = base.control * 0.5;
          break;
        default:
          weights[t.id] = base.redirect * 0.5;
      }
    }
  }

  const total = Object.values(weights).reduce((s, w) => s + w, 0);
  if (total > 0) {
    for (const k of Object.keys(weights)) {
      weights[k] /= total;
    }
  }
  return weights;
}

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
