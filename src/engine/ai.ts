import { AI_WEIGHTS, COUNTER_AI_BOOSTED_ATTACK_WEIGHT } from './constants';
import type { AIStyle, PlayerState, TacticType } from './types';
import { weightedRandom } from '../utils/helpers';

export function selectAITactic(
  style: AIStyle,
  playerState: PlayerState,
  aiState: PlayerState
): TacticType {
  const weights = { ...AI_WEIGHTS[style] };

  if (style === 'counter' && aiState.lastTactic === 'control') {
    const totalBoost = COUNTER_AI_BOOSTED_ATTACK_WEIGHT - weights.attack;
    weights.attack = COUNTER_AI_BOOSTED_ATTACK_WEIGHT;
    weights.control -= totalBoost * 0.7;
    weights.redirect -= totalBoost * 0.3;
  }

  if (style === 'counter' && aiState.lastTactic === 'attack') {
    weights.control = 0.7;
    weights.attack = 0.15;
    weights.redirect = 0.15;
  }

  if (style === 'aggressive' && aiState.positionAdvantage < -0.3) {
    weights.attack = 0.5;
    weights.control = 0.35;
    weights.redirect = 0.15;
  }

  if (playerState.lastTactic === 'redirect' && style !== 'variable') {
    weights.redirect = Math.max(weights.redirect, 0.3);
  }

  const sum = weights.attack + weights.control + weights.redirect;
  weights.attack /= sum;
  weights.control /= sum;
  weights.redirect /= sum;

  return weightedRandom<TacticType>(weights);
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
