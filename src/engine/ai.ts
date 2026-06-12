import {
  AI_WEIGHTS,
  COUNTER_AI_BOOSTED_ATTACK_WEIGHT,
  getAIWeights,
} from './constants';
import type { AIStyle, PlayerState, TacticType, CustomTactic } from './types';
import { weightedRandom } from '../utils/helpers';
import { BUILTIN_TACTICS } from './types';

export function selectAITactic(
  style: AIStyle,
  playerState: PlayerState,
  aiState: PlayerState,
  tactics: CustomTactic[] = BUILTIN_TACTICS
): TacticType {
  const weights: Record<string, number> = tactics.length > 3
    ? getAIWeights(style, tactics)
    : { ...AI_WEIGHTS[style] };

  const validIds = new Set(tactics.map((t) => t.id));
  for (const k of Object.keys(weights)) {
    if (!validIds.has(k)) {
      delete weights[k];
    }
  }

  if (style === 'counter' && aiState.lastTactic === 'control') {
    if (weights.attack !== undefined) {
      const totalBoost = COUNTER_AI_BOOSTED_ATTACK_WEIGHT - weights.attack;
      weights.attack = COUNTER_AI_BOOSTED_ATTACK_WEIGHT;
      if (weights.control !== undefined) weights.control -= totalBoost * 0.7;
      if (weights.redirect !== undefined) weights.redirect -= totalBoost * 0.3;
    }
  }

  if (style === 'counter' && aiState.lastTactic === 'attack') {
    if (weights.control !== undefined) weights.control = 0.7;
    if (weights.attack !== undefined) weights.attack = 0.15;
    if (weights.redirect !== undefined) weights.redirect = 0.15;
  }

  if (style === 'aggressive' && aiState.positionAdvantage < -0.3) {
    if (weights.attack !== undefined) weights.attack = 0.5;
    if (weights.control !== undefined) weights.control = 0.35;
    if (weights.redirect !== undefined) weights.redirect = 0.15;
  }

  if (playerState.lastTactic === 'redirect' && style !== 'variable') {
    if (weights.redirect !== undefined) {
      weights.redirect = Math.max(weights.redirect, 0.3);
    }
  }

  const validKeys = Object.keys(weights).filter((k) => validIds.has(k));
  const sum = validKeys.reduce((s, k) => s + (weights[k] || 0), 0);
  if (sum > 0) {
    for (const k of validKeys) {
      weights[k] = (weights[k] || 0) / sum;
    }
  } else {
    const fallback = validIds.values().next().value;
    if (fallback) {
      weights[fallback] = 1;
    }
  }

  return weightedRandom<TacticType>(weights as Record<TacticType, number>);
}

export function getAIStyleDescription(style: AIStyle): string {
  switch (style) {
    case 'counter':
      return '偏好先控短争取主动，待站位占优后突然强攻。节奏沉稳，擅长后发制人。';
    case 'aggressive':
      return '首板就追求强攻，力图速战速决。站位劣势时偶尔过渡一板。';
    case 'variable':
      return '三种战术随机混合，无固定规律，难以预判。适合考验临场应变。';
  }
}
