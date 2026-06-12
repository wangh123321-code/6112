import { create } from 'zustand';
import type {
  CounterDirection,
  CounterRelation,
  CounterStrength,
  CustomTactic,
  RiskLevel,
  TacticLibrary,
  TacticType,
} from '../engine/types';
import { BUILTIN_TACTICS } from '../engine/types';
import { sanitizeTacticName } from '../utils/xss';
import {
  createDefaultCounterRelations,
  detectCycles,
  getDefaultTactics,
  type CycleDetectionResult,
} from '../utils/tacticMatrix';

const STORAGE_KEY = 'table-tennis-tactic-library';
const MAX_CUSTOM_TACTICS = 12;
const CURRENT_VERSION = 2;

interface TacticLibraryStore {
  tactics: CustomTactic[];
  counterRelations: CounterRelation[];
  cycleResult: CycleDetectionResult;

  initLibrary: () => void;
  saveLibrary: () => void;
  resetLibrary: () => void;

  addTactic: (name: string, riskLevel: RiskLevel, icon: string, baseWinRate: number) => { success: boolean; error?: string };
  updateTactic: (id: string, updates: Partial<Omit<CustomTactic, 'id' | 'isBuiltin'>>) => { success: boolean; error?: string };
  deleteTactic: (id: string) => { success: boolean; error?: string };

  setCounterRelation: (
    tacticA: TacticType,
    tacticB: TacticType,
    direction: CounterDirection,
    strength: CounterStrength,
    reason?: string
  ) => void;
  setCounterReason: (tacticA: TacticType, tacticB: TacticType, reason: string) => void;

  getTacticById: (id: string) => CustomTactic | undefined;
  getAllTacticIds: () => TacticType[];
  getCustomTacticsCount: () => number;

  checkCycles: () => CycleDetectionResult;
}

function loadFromStorage(): TacticLibrary | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TacticLibrary;
    return parsed;
  } catch {
    return null;
  }
}

function migrateLegacyData(data: any): TacticLibrary {
  const tactics: CustomTactic[] = [...BUILTIN_TACTICS];
  const counterRelations: CounterRelation[] = createDefaultCounterRelations(tactics);
  return { tactics, counterRelations, version: CURRENT_VERSION };
}

function normalizeLibrary(data: any): TacticLibrary {
  if (!data || typeof data !== 'object') {
    return migrateLegacyData(data);
  }

  if (!data.version || data.version < CURRENT_VERSION) {
    return migrateLegacyData(data);
  }

  const tactics: CustomTactic[] = [...BUILTIN_TACTICS];
  if (Array.isArray(data.tactics)) {
    for (const t of data.tactics) {
      if (t && t.id && !BUILTIN_TACTICS.find((b) => b.id === t.id)) {
        tactics.push({
          id: String(t.id),
          name: sanitizeTacticName(String(t.name || '')),
          riskLevel: ['low', 'medium', 'high'].includes(t.riskLevel) ? t.riskLevel : 'medium',
          icon: String(t.icon || '🏓'),
          baseWinRate: typeof t.baseWinRate === 'number' ? t.baseWinRate : 0.5,
          isBuiltin: false,
          description: t.description ? String(t.description) : undefined,
        });
      }
    }
  }

  const counterRelations: CounterRelation[] = [];
  const existingKeys = new Set<string>();

  if (Array.isArray(data.counterRelations)) {
    for (const rel of data.counterRelations) {
      if (!rel || !rel.tacticA || !rel.tacticB) continue;
      const a = String(rel.tacticA);
      const b = String(rel.tacticB);
      if (!tactics.find((t) => t.id === a) || !tactics.find((t) => t.id === b)) continue;
      const key = [a, b].sort().join('|');
      if (existingKeys.has(key)) continue;
      existingKeys.add(key);
      counterRelations.push({
        tacticA: a,
        tacticB: b,
        direction: ['none', 'A-beats-B', 'B-beats-A'].includes(rel.direction) ? rel.direction : 'none',
        strength: [0, 10, 20, 30].includes(rel.strength) ? (rel.strength as CounterStrength) : 0,
        reason: rel.reason ? String(rel.reason) : undefined,
      });
    }
  }

  for (let i = 0; i < tactics.length; i++) {
    for (let j = i + 1; j < tactics.length; j++) {
      const key = [tactics[i].id, tactics[j].id].sort().join('|');
      if (!existingKeys.has(key)) {
        counterRelations.push({
          tacticA: tactics[i].id,
          tacticB: tactics[j].id,
          direction: 'none',
          strength: 0,
        });
      }
    }
  }

  return { tactics, counterRelations, version: CURRENT_VERSION };
}

function persistToStorage(state: { tactics: CustomTactic[]; counterRelations: CounterRelation[] }) {
  try {
    const data: TacticLibrary = {
      tactics: state.tactics,
      counterRelations: state.counterRelations,
      version: CURRENT_VERSION,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export const useTacticLibraryStore = create<TacticLibraryStore>((set, get) => ({
  tactics: getDefaultTactics(),
  counterRelations: createDefaultCounterRelations(getDefaultTactics()),
  cycleResult: { hasCycle: false, cycles: [] },

  initLibrary: () => {
    const loaded = loadFromStorage();
    const normalized = normalizeLibrary(loaded);
    const cycleResult = detectCycles(normalized.tactics, normalized.counterRelations);
    set({
      tactics: normalized.tactics,
      counterRelations: normalized.counterRelations,
      cycleResult,
    });
  },

  saveLibrary: () => {
    const state = get();
    persistToStorage({ tactics: state.tactics, counterRelations: state.counterRelations });
  },

  resetLibrary: () => {
    const tactics = getDefaultTactics();
    const counterRelations = createDefaultCounterRelations(tactics);
    const cycleResult = detectCycles(tactics, counterRelations);
    set({ tactics, counterRelations, cycleResult });
    persistToStorage({ tactics, counterRelations });
  },

  addTactic: (name, riskLevel, icon, baseWinRate) => {
    const state = get();
    const customCount = state.tactics.filter((t) => !t.isBuiltin).length;
    if (customCount >= MAX_CUSTOM_TACTICS) {
      return { success: false, error: `最多只能创建 ${MAX_CUSTOM_TACTICS} 个自定义战术` };
    }

    const sanitizedName = sanitizeTacticName(name);
    if (!sanitizedName) {
      return { success: false, error: '战术名称不能为空' };
    }

    const duplicate = state.tactics.find(
      (t) => t.name === sanitizedName || t.id === sanitizedName
    );
    if (duplicate) {
      return { success: false, error: '战术名称或ID已存在' };
    }

    const id = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const newTactic: CustomTactic = {
      id,
      name: sanitizedName,
      riskLevel,
      icon: icon || '🏓',
      baseWinRate: Math.max(0, Math.min(1, baseWinRate)),
      isBuiltin: false,
    };

    const newTactics = [...state.tactics, newTactic];
    const newRelations = [...state.counterRelations];
    for (const existing of state.tactics) {
      newRelations.push({
        tacticA: existing.id,
        tacticB: id,
        direction: 'none',
        strength: 0,
      });
    }

    const cycleResult = detectCycles(newTactics, newRelations);
    set({ tactics: newTactics, counterRelations: newRelations, cycleResult });
    persistToStorage({ tactics: newTactics, counterRelations: newRelations });
    return { success: true };
  },

  updateTactic: (id, updates) => {
    const state = get();
    const idx = state.tactics.findIndex((t) => t.id === id);
    if (idx === -1) {
      return { success: false, error: '战术不存在' };
    }
    const target = state.tactics[idx];
    if (target.isBuiltin && updates.name) {
      return { success: false, error: '内置战术不可修改名称' };
    }

    const merged: CustomTactic = { ...target, ...updates };
    if (updates.name) {
      merged.name = sanitizeTacticName(updates.name);
      if (!merged.name) {
        return { success: false, error: '战术名称不能为空' };
      }
    }
    if (typeof updates.baseWinRate === 'number') {
      merged.baseWinRate = Math.max(0, Math.min(1, updates.baseWinRate));
    }

    const newTactics = [...state.tactics];
    newTactics[idx] = merged;
    set({ tactics: newTactics });
    persistToStorage({ tactics: newTactics, counterRelations: state.counterRelations });
    return { success: true };
  },

  deleteTactic: (id) => {
    const state = get();
    const target = state.tactics.find((t) => t.id === id);
    if (!target) {
      return { success: false, error: '战术不存在' };
    }
    if (target.isBuiltin) {
      return { success: false, error: '内置战术不可删除' };
    }

    const newTactics = state.tactics.filter((t) => t.id !== id);
    const newRelations = state.counterRelations.filter(
      (r) => r.tacticA !== id && r.tacticB !== id
    );
    const cycleResult = detectCycles(newTactics, newRelations);
    set({ tactics: newTactics, counterRelations: newRelations, cycleResult });
    persistToStorage({ tactics: newTactics, counterRelations: newRelations });
    return { success: true };
  },

  setCounterRelation: (tacticA, tacticB, direction, strength, reason) => {
    const state = get();
    const idx = state.counterRelations.findIndex(
      (r) =>
        (r.tacticA === tacticA && r.tacticB === tacticB) ||
        (r.tacticA === tacticB && r.tacticB === tacticA)
    );

    let newRelations: CounterRelation[];
    if (idx === -1) {
      newRelations = [
        ...state.counterRelations,
        { tacticA, tacticB, direction, strength, reason },
      ];
    } else {
      const existing = state.counterRelations[idx];
      const isSwapped = existing.tacticA === tacticB && existing.tacticB === tacticA;
      let actualDirection: CounterDirection = direction;
      if (isSwapped) {
        if (direction === 'A-beats-B') actualDirection = 'B-beats-A';
        else if (direction === 'B-beats-A') actualDirection = 'A-beats-B';
      }
      newRelations = [...state.counterRelations];
      newRelations[idx] = {
        ...existing,
        direction: actualDirection,
        strength,
        reason: reason !== undefined ? reason : existing.reason,
      };
    }

    const cycleResult = detectCycles(state.tactics, newRelations);
    set({ counterRelations: newRelations, cycleResult });
  },

  setCounterReason: (tacticA, tacticB, reason) => {
    const state = get();
    const idx = state.counterRelations.findIndex(
      (r) =>
        (r.tacticA === tacticA && r.tacticB === tacticB) ||
        (r.tacticA === tacticB && r.tacticB === tacticA)
    );
    if (idx === -1) return;
    const newRelations = [...state.counterRelations];
    newRelations[idx] = { ...newRelations[idx], reason };
    set({ counterRelations: newRelations });
  },

  getTacticById: (id) => {
    return get().tactics.find((t) => t.id === id);
  },

  getAllTacticIds: () => {
    return get().tactics.map((t) => t.id);
  },

  getCustomTacticsCount: () => {
    return get().tactics.filter((t) => !t.isBuiltin).length;
  },

  checkCycles: () => {
    const state = get();
    const result = detectCycles(state.tactics, state.counterRelations);
    set({ cycleResult: result });
    return result;
  },
}));
