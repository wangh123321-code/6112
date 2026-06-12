export type TacticType = 'attack' | 'control' | 'redirect';

export type AIStyle = 'counter' | 'aggressive' | 'variable';

export type GamePhase =
  | 'selecting_style'
  | 'waiting_input'
  | 'resolving'
  | 'showing_tree'
  | 'game_over';

export interface Position {
  x: number;
  y: number;
}

export interface PlayerState {
  position: Position;
  positionAdvantage: number;
  lastTactic: TacticType | null;
}

export interface ProbabilityBranch {
  aiResponse: TacticType;
  playerWinProbability: number;
  description: string;
}

export interface RoundResult {
  playerTactic: TacticType;
  aiTactic: TacticType;
  playerWinRate: number;
  aiWinRate: number;
  winner: 'player' | 'ai';
  newPlayerPosition: Position;
  newAIPosition: Position;
  probabilityBranches: ProbabilityBranch[];
}

export interface CriticalPoint {
  round: number;
  playerScore: number;
  aiScore: number;
  playerTactic: TacticType;
  aiTactic: TacticType;
  winner: 'player' | 'ai';
  isGamePoint: boolean;
}

export interface TacticStatsRecord {
  used: number;
  won: number;
}

export interface TacticStats {
  attack: TacticStatsRecord;
  control: TacticStatsRecord;
  redirect: TacticStatsRecord;
  criticalPoints: CriticalPoint[];
}

export const TACTIC_LABELS: Record<TacticType, string> = {
  attack: '强攻',
  control: '控短',
  redirect: '变线',
};

export const AI_STYLE_LABELS: Record<AIStyle, string> = {
  counter: '防守反击型',
  aggressive: '抢攻型',
  variable: '变化型',
};

export const TACTIC_ICONS: Record<TacticType, string> = {
  attack: '⚡',
  control: '🎯',
  redirect: '↔️',
};
