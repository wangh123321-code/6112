import type {
  CounterDirection,
  CounterRelation,
  CounterStrength,
  CustomTactic,
  TacticType,
} from '../engine/types';
import { BUILTIN_TACTICS } from '../engine/types';

export interface CycleDetectionResult {
  hasCycle: boolean;
  cycles: TacticType[][];
}

export function createDefaultCounterRelations(tactics: CustomTactic[]): CounterRelation[] {
  const relations: CounterRelation[] = [];
  for (let i = 0; i < tactics.length; i++) {
    for (let j = i + 1; j < tactics.length; j++) {
      relations.push({
        tacticA: tactics[i].id,
        tacticB: tactics[j].id,
        direction: 'none',
        strength: 0,
      });
    }
  }
  return relations;
}

export function buildCounterMatrix(
  tactics: CustomTactic[],
  relations: CounterRelation[]
): Map<string, Map<string, { direction: CounterDirection; strength: CounterStrength }>> {
  const matrix = new Map<string, Map<string, { direction: CounterDirection; strength: CounterStrength }>>();
  tactics.forEach((t) => {
    matrix.set(t.id, new Map());
  });

  relations.forEach((rel) => {
    if (matrix.has(rel.tacticA) && matrix.has(rel.tacticB)) {
      matrix.get(rel.tacticA)!.set(rel.tacticB, {
        direction: rel.direction,
        strength: rel.strength,
      });
      const reverseDir: CounterDirection =
        rel.direction === 'A-beats-B' ? 'B-beats-A' : rel.direction === 'B-beats-A' ? 'A-beats-B' : 'none';
      matrix.get(rel.tacticB)!.set(rel.tacticA, {
        direction: reverseDir,
        strength: rel.strength,
      });
    }
  });

  return matrix;
}

export function getCounterAdvantage(
  attacker: TacticType,
  defender: TacticType,
  matrix: Map<string, Map<string, { direction: CounterDirection; strength: CounterStrength }>>
): number {
  const row = matrix.get(attacker);
  if (!row) return 0;
  const cell = row.get(defender);
  if (!cell) return 0;
  if (cell.direction === 'A-beats-B') {
    return cell.strength / 100;
  } else if (cell.direction === 'B-beats-A') {
    return -(cell.strength / 100);
  }
  return 0;
}

export function detectCycles(
  tactics: CustomTactic[],
  relations: CounterRelation[]
): CycleDetectionResult {
  const adjList = new Map<string, string[]>();
  tactics.forEach((t) => adjList.set(t.id, []));

  relations.forEach((rel) => {
    if (rel.direction === 'A-beats-B') {
      adjList.get(rel.tacticA)?.push(rel.tacticB);
    } else if (rel.direction === 'B-beats-A') {
      adjList.get(rel.tacticB)?.push(rel.tacticA);
    }
  });

  const cycles: TacticType[][] = [];
  const visited = new Set<string>();
  const recStack = new Set<string>();
  const path: string[] = [];

  function dfs(node: string) {
    visited.add(node);
    recStack.add(node);
    path.push(node);

    const neighbors = adjList.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor);
      } else if (recStack.has(neighbor)) {
        const cycleStart = path.indexOf(neighbor);
        if (cycleStart !== -1) {
          const cycle = path.slice(cycleStart);
          cycle.push(neighbor);
          cycles.push([...cycle]);
        }
      }
    }

    path.pop();
    recStack.delete(node);
  }

  tactics.forEach((t) => {
    if (!visited.has(t.id)) {
      dfs(t.id);
    }
  });

  const uniqueCycles = deduplicateCycles(cycles);
  return { hasCycle: uniqueCycles.length > 0, cycles: uniqueCycles };
}

function deduplicateCycles(cycles: TacticType[][]): TacticType[][] {
  const seen = new Set<string>();
  const result: TacticType[][] = [];

  for (const cycle of cycles) {
    const nodes = [...new Set(cycle.slice(0, -1))].sort();
    const key = nodes.join('|');
    if (!seen.has(key)) {
      seen.add(key);
      result.push(cycle);
    }
  }

  return result;
}

export function getDefaultTactics(): CustomTactic[] {
  return [...BUILTIN_TACTICS];
}
