export type BuiltinTacticType = 'attack' | 'control' | 'redirect';

export type TacticType = BuiltinTacticType | string;

export type RiskLevel = 'low' | 'medium' | 'high';

export type CounterStrength = 0 | 10 | 20 | 30;

export type CounterDirection = 'none' | 'A-beats-B' | 'B-beats-A';

export interface CustomTactic {
  id: string;
  name: string;
  riskLevel: RiskLevel;
  icon: string;
  baseWinRate: number;
  isBuiltin: boolean;
  description?: string;
}

export interface CounterRelation {
  tacticA: TacticType;
  tacticB: TacticType;
  direction: CounterDirection;
  strength: CounterStrength;
  reason?: string;
}

export interface TacticLibrary {
  tactics: CustomTactic[];
  counterRelations: CounterRelation[];
  version: number;
}

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
  records: Record<string, TacticStatsRecord>;
  criticalPoints: CriticalPoint[];
}

export const BUILTIN_TACTICS: CustomTactic[] = [
  {
    id: 'attack',
    name: '强攻',
    riskLevel: 'high',
    icon: '⚡',
    baseWinRate: 0.5,
    isBuiltin: true,
  },
  {
    id: 'control',
    name: '控短',
    riskLevel: 'low',
    icon: '🎯',
    baseWinRate: 0.5,
    isBuiltin: true,
  },
  {
    id: 'redirect',
    name: '变线',
    riskLevel: 'medium',
    icon: '↔️',
    baseWinRate: 0.5,
    isBuiltin: true,
  },
];

export const RISK_LABELS: Record<RiskLevel, string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
};

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
