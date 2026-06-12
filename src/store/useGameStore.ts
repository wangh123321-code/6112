import { create } from 'zustand';
import type {
  AIStyle,
  CriticalPoint,
  GamePhase,
  PlayerState,
  RoundResult,
  TacticStats,
  TacticType,
  TacticStatsRecord,
} from '../engine/types';
import {
  DEUCE_MIN_LEAD,
  INITIAL_POSITION,
  SERVE_SWITCH_INTERVAL,
  WIN_SCORE,
} from '../engine/constants';
import { resolveRound, setTacticContext } from '../engine/probability';
import { selectAITactic } from '../engine/ai';
import { computeAdvantageFromPosition } from '../utils/helpers';
import { useTacticLibraryStore } from './useTacticLibraryStore';

interface GameStore {
  phase: GamePhase;
  aiStyle: AIStyle | null;
  playerScore: number;
  aiScore: number;
  roundNumber: number;
  server: 'player' | 'ai';
  player: PlayerState;
  ai: PlayerState;
  lastResult: RoundResult | null;
  stats: TacticStats;
  winner: 'player' | 'ai' | null;

  selectAIStyle: (style: AIStyle) => void;
  chooseTactic: (tactic: TacticType) => void;
  advanceFromTree: () => void;
  restartGame: () => void;
  resetToStyleSelect: () => void;
}

function createInitialPlayer(): PlayerState {
  return {
    position: { ...INITIAL_POSITION },
    positionAdvantage: computeAdvantageFromPosition(INITIAL_POSITION),
    lastTactic: null,
  };
}

function createInitialStats(): TacticStats {
  const lib = useTacticLibraryStore.getState();
  const records: Record<string, TacticStatsRecord> = {};
  for (const t of lib.tactics) {
    records[t.id] = { used: 0, won: 0 };
  }
  return { records, criticalPoints: [] };
}

function ensureStatsEntry(
  records: Record<string, TacticStatsRecord>,
  id: string
): TacticStatsRecord {
  if (!records[id]) {
    records[id] = { used: 0, won: 0 };
  }
  return records[id];
}

function syncTacticContext() {
  const lib = useTacticLibraryStore.getState();
  setTacticContext({ tactics: lib.tactics, relations: lib.counterRelations });
}

function checkGameEnd(playerScore: number, aiScore: number): 'player' | 'ai' | null {
  const maxScore = Math.max(playerScore, aiScore);
  const minScore = Math.min(playerScore, aiScore);
  if (maxScore >= WIN_SCORE && maxScore - minScore >= DEUCE_MIN_LEAD) {
    return playerScore > aiScore ? 'player' : 'ai';
  }
  return null;
}

function isCriticalPoint(
  playerScore: number,
  aiScore: number,
  round: number
): { isCritical: boolean; isGamePoint: boolean } {
  const maxScore = Math.max(playerScore, aiScore);
  const isDeuce = playerScore >= 10 && aiScore >= 10;
  const isGamePoint =
    (maxScore >= 10 && Math.abs(playerScore - aiScore) >= 1) ||
    isDeuce;
  return {
    isCritical: isDeuce || isGamePoint,
    isGamePoint,
  };
}

export const useGameStore = create<GameStore>((set, get) => ({
  phase: 'selecting_style',
  aiStyle: null,
  playerScore: 0,
  aiScore: 0,
  roundNumber: 0,
  server: 'player',
  player: createInitialPlayer(),
  ai: createInitialPlayer(),
  lastResult: null,
  stats: createInitialStats(),
  winner: null,

  selectAIStyle: (style) => {
    syncTacticContext();
    set({
      aiStyle: style,
      phase: 'waiting_input',
      playerScore: 0,
      aiScore: 0,
      roundNumber: 0,
      server: 'player',
      player: createInitialPlayer(),
      ai: createInitialPlayer(),
      lastResult: null,
      stats: createInitialStats(),
      winner: null,
    });
  },

  chooseTactic: (playerTactic) => {
    syncTacticContext();
    const state = get();
    if (state.phase !== 'waiting_input' || !state.aiStyle) return;

    set({ phase: 'resolving' });

    const lib = useTacticLibraryStore.getState();
    const aiTactic = selectAITactic(state.aiStyle, state.player, state.ai, lib.tactics);
    const result = resolveRound(playerTactic, aiTactic, state.player, state.ai);

    const newPlayerScore =
      result.winner === 'player' ? state.playerScore + 1 : state.playerScore;
    const newAIScore =
      result.winner === 'ai' ? state.aiScore + 1 : state.aiScore;
    const newRound = state.roundNumber + 1;

    const totalPoints = newPlayerScore + newAIScore;
    const newServer: 'player' | 'ai' =
      Math.floor(totalPoints / SERVE_SWITCH_INTERVAL) % 2 === 0 ? 'player' : 'ai';

    const newRecords = { ...state.stats.records };
    const playerEntry = ensureStatsEntry(newRecords, playerTactic);
    newRecords[playerTactic] = {
      used: playerEntry.used + 1,
      won: playerEntry.won + (result.winner === 'player' ? 1 : 0),
    };
    const aiEntry = ensureStatsEntry(newRecords, aiTactic);
    newRecords[aiTactic] = {
      used: aiEntry.used + 1,
      won: aiEntry.won + (result.winner === 'ai' ? 1 : 0),
    };

    const newCriticalPoints = [...state.stats.criticalPoints];
    const critical = isCriticalPoint(state.playerScore, state.aiScore, newRound);
    if (critical.isCritical) {
      const cp: CriticalPoint = {
        round: newRound,
        playerScore: state.playerScore,
        aiScore: state.aiScore,
        playerTactic,
        aiTactic,
        winner: result.winner,
        isGamePoint: critical.isGamePoint,
      };
      newCriticalPoints.push(cp);
    }

    const gameWinner = checkGameEnd(newPlayerScore, newAIScore);

    setTimeout(() => {
      set({
        playerScore: newPlayerScore,
        aiScore: newAIScore,
        roundNumber: newRound,
        server: newServer,
        player: {
          position: result.newPlayerPosition,
          positionAdvantage: computeAdvantageFromPosition(result.newPlayerPosition),
          lastTactic: playerTactic,
        },
        ai: {
          position: result.newAIPosition,
          positionAdvantage: computeAdvantageFromPosition(result.newAIPosition),
          lastTactic: aiTactic,
        },
        lastResult: result,
        stats: { records: newRecords, criticalPoints: newCriticalPoints },
        winner: gameWinner,
        phase: gameWinner ? 'game_over' : 'showing_tree',
      });
    }, 800);
  },

  advanceFromTree: () => {
    const state = get();
    if (state.phase !== 'showing_tree') return;
    set({ phase: 'waiting_input' });
  },

  restartGame: () => {
    syncTacticContext();
    const { aiStyle } = get();
    if (!aiStyle) {
      set({ phase: 'selecting_style' });
      return;
    }
    set({
      phase: 'waiting_input',
      playerScore: 0,
      aiScore: 0,
      roundNumber: 0,
      server: 'player',
      player: createInitialPlayer(),
      ai: createInitialPlayer(),
      lastResult: null,
      stats: createInitialStats(),
      winner: null,
    });
  },

  resetToStyleSelect: () => {
    set({
      phase: 'selecting_style',
      aiStyle: null,
      playerScore: 0,
      aiScore: 0,
      roundNumber: 0,
      server: 'player',
      player: createInitialPlayer(),
      ai: createInitialPlayer(),
      lastResult: null,
      stats: createInitialStats(),
      winner: null,
    });
  },
}));
