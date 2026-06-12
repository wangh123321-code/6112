import {
  RANDOM_NOISE_RANGE,
  POSITION_ADVANTAGE_PER_01,
  WINNER_POSITION_BOOST,
  LOSER_OFFSET_MAGNITUDE,
  getTacticSensitivity,
  getWinRateFromMatrix,
} from './constants';
import type {
  PlayerState,
  Position,
  ProbabilityBranch,
  RoundResult,
  TacticType,
  CustomTactic,
  CounterRelation,
} from './types';
import { clamp, gaussianRandom, normalizePosition } from '../utils/helpers';

interface TacticContext {
  tactics: CustomTactic[];
  relations: CounterRelation[];
}

let tacticContext: TacticContext | null = null;

export function setTacticContext(ctx: TacticContext | null) {
  tacticContext = ctx;
}

export function getTacticContext(): TacticContext | null {
  return tacticContext;
}

export function computeBaseWinRate(
  playerTactic: TacticType,
  aiTactic: TacticType
): number {
  if (tacticContext) {
    return getWinRateFromMatrix(
      playerTactic,
      aiTactic,
      tacticContext.tactics,
      tacticContext.relations
    );
  }
  return getWinRateFromMatrix(playerTactic, aiTactic);
}

export function applyPositionAdvantage(
  baseRate: number,
  playerTactic: TacticType,
  playerAdvantage: number,
  aiAdvantage: number
): number {
  const sensitivity = tacticContext
    ? getTacticSensitivity(playerTactic, tacticContext.tactics)
    : getTacticSensitivity(playerTactic);
  const advantageDiff = playerAdvantage - aiAdvantage;
  const adjustment = advantageDiff * (POSITION_ADVANTAGE_PER_01 * 10) * sensitivity;
  return clamp(baseRate + adjustment, 0.05, 0.95);
}

export function applyRandomNoise(rate: number): number {
  const noise = gaussianRandom(0, RANDOM_NOISE_RANGE / 2.5);
  return clamp(rate + noise, 0.02, 0.98);
}

export function computeWinRate(
  playerTactic: TacticType,
  aiTactic: TacticType,
  playerAdvantage: number,
  aiAdvantage: number
): number {
  const base = computeBaseWinRate(playerTactic, aiTactic);
  const withAdvantage = applyPositionAdvantage(
    base,
    playerTactic,
    playerAdvantage,
    aiAdvantage
  );
  return applyRandomNoise(withAdvantage);
}

export function computeNewPositions(
  winner: 'player' | 'ai',
  playerPos: Position,
  aiPos: Position,
  winnerTactic: TacticType
): { playerPosition: Position; aiPosition: Position } {
  const winnerPos = winner === 'player' ? playerPos : aiPos;
  const loserPos = winner === 'player' ? aiPos : playerPos;

  const newWinnerX = winnerPos.x * (1 - WINNER_POSITION_BOOST);
  const newWinnerY = winnerPos.y * (1 - WINNER_POSITION_BOOST);

  let loserOffsetX = 0;
  let loserOffsetY = 0;

  switch (winnerTactic) {
    case 'attack':
      loserOffsetX = (Math.random() > 0.5 ? 1 : -1) * LOSER_OFFSET_MAGNITUDE;
      loserOffsetY = 0.1;
      break;
    case 'control':
      loserOffsetX = (Math.random() - 0.5) * 0.15;
      loserOffsetY = -LOSER_OFFSET_MAGNITUDE * 0.8;
      break;
    case 'redirect':
      const currentSide = loserPos.x >= 0 ? 1 : -1;
      loserOffsetX = -currentSide * LOSER_OFFSET_MAGNITUDE;
      loserOffsetY = 0.05;
      break;
    default:
      if (tacticContext) {
        const t = tacticContext.tactics.find((x) => x.id === winnerTactic);
        if (t) {
          switch (t.riskLevel) {
            case 'high':
              loserOffsetX = (Math.random() > 0.5 ? 1 : -1) * LOSER_OFFSET_MAGNITUDE;
              loserOffsetY = 0.1;
              break;
            case 'low':
              loserOffsetX = (Math.random() - 0.5) * 0.15;
              loserOffsetY = -LOSER_OFFSET_MAGNITUDE * 0.8;
              break;
            default:
              const side = loserPos.x >= 0 ? 1 : -1;
              loserOffsetX = -side * LOSER_OFFSET_MAGNITUDE;
              loserOffsetY = 0.05;
          }
        }
      }
  }

  const newLoserX = loserPos.x + loserOffsetX;
  const newLoserY = loserPos.y + loserOffsetY;

  const newWinner = normalizePosition(newWinnerX, newWinnerY);
  const newLoser = normalizePosition(newLoserX, newLoserY);

  return winner === 'player'
    ? { playerPosition: newWinner, aiPosition: newLoser }
    : { playerPosition: newLoser, aiPosition: newWinner };
}

export function generateProbabilityBranches(
  playerTactic: TacticType,
  playerAdvantage: number,
  aiAdvantage: number
): ProbabilityBranch[] {
  const responses: TacticType[] = tacticContext
    ? tacticContext.tactics.map((t) => t.id)
    : ['attack', 'control', 'redirect'];
  return responses.map((resp) => {
    const base = computeBaseWinRate(playerTactic, resp);
    const withAdv = applyPositionAdvantage(base, playerTactic, playerAdvantage, aiAdvantage);
    const prob = Math.round(withAdv * 100);

    let description = '';
    const labels: Record<TacticType, string> = tacticContext
      ? Object.fromEntries(tacticContext.tactics.map((t) => [t.id, t.name]))
      : { attack: '强攻', control: '控短', redirect: '变线' };

    if (playerTactic === 'attack' && resp === 'control') {
      description = '强攻对手控短，主动上手优势明显';
    } else if (playerTactic === 'attack' && resp === 'attack') {
      description = '双方对攻，看谁更稳定';
    } else if (playerTactic === 'control' && resp === 'attack') {
      description = '控短被对手抢攻，较为被动';
    } else if (playerTactic === 'control' && resp === 'control') {
      description = '双方斗短，比拼台内手感';
    } else if (playerTactic === 'redirect' && resp === 'redirect') {
      description = '双方变线，节奏变化激烈';
    } else if (playerTactic === 'redirect' && resp === 'control') {
      description = '变线打乱对手控短节奏';
    } else {
      const pName = labels[playerTactic] || playerTactic;
      const rName = labels[resp] || resp;
      description = `${pName} 对阵 ${rName}，战术对抗`;
    }

    return {
      aiResponse: resp,
      playerWinProbability: prob,
      description,
    };
  });
}

export function resolveRound(
  playerTactic: TacticType,
  aiTactic: TacticType,
  playerState: PlayerState,
  aiState: PlayerState
): RoundResult {
  const playerWinRate = computeWinRate(
    playerTactic,
    aiTactic,
    playerState.positionAdvantage,
    aiState.positionAdvantage
  );

  const winner: 'player' | 'ai' = Math.random() < playerWinRate ? 'player' : 'ai';
  const winnerTactic = winner === 'player' ? playerTactic : aiTactic;

  const newPositions = computeNewPositions(
    winner,
    playerState.position,
    aiState.position,
    winnerTactic
  );

  const probabilityBranches = generateProbabilityBranches(
    playerTactic,
    playerState.positionAdvantage,
    aiState.positionAdvantage
  );

  return {
    playerTactic,
    aiTactic,
    playerWinRate: Math.round(playerWinRate * 100),
    aiWinRate: Math.round((1 - playerWinRate) * 100),
    winner,
    newPlayerPosition: newPositions.playerPosition,
    newAIPosition: newPositions.aiPosition,
    probabilityBranches,
  };
}
