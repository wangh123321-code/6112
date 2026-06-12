import { useMemo, useState } from 'react';
import type {
  CounterDirection,
  CounterRelation,
  CounterStrength,
  CustomTactic,
  TacticType,
} from '../../engine/types';
import { useTacticLibraryStore } from '../../store/useTacticLibraryStore';

const STRENGTH_OPTIONS: { value: CounterStrength; label: string }[] = [
  { value: 0, label: '无克制' },
  { value: 10, label: '+10%' },
  { value: 20, label: '+20%' },
  { value: 30, label: '+30%' },
];

function findRelation(
  relations: CounterRelation[],
  a: TacticType,
  b: TacticType
): CounterRelation | undefined {
  return relations.find(
    (r) =>
      (r.tacticA === a && r.tacticB === b) ||
      (r.tacticA === b && r.tacticB === a)
  );
}

function getDisplayDirection(
  rel: CounterRelation | undefined,
  rowId: TacticType,
  colId: TacticType
): CounterDirection {
  if (!rel) return 'none';
  const isSwapped = rel.tacticA === colId && rel.tacticB === rowId;
  if (!isSwapped) return rel.direction;
  if (rel.direction === 'A-beats-B') return 'B-beats-A';
  if (rel.direction === 'B-beats-A') return 'A-beats-B';
  return 'none';
}

function getCellStyle(direction: CounterDirection, strength: CounterStrength): string {
  if (direction === 'none' || strength === 0) {
    return 'bg-white/5 hover:bg-white/10 text-white/40';
  }
  const opacity = strength === 10 ? 'bg-opacity-30' : strength === 20 ? 'bg-opacity-50' : 'bg-opacity-70';
  if (direction === 'A-beats-B') {
    return `bg-emerald-500 ${opacity} hover:bg-emerald-400 text-white`;
  }
  return `bg-red-500 ${opacity} hover:bg-red-400 text-white`;
}

function getCellText(direction: CounterDirection, strength: CounterStrength): string {
  if (direction === 'none' || strength === 0) return '—';
  if (direction === 'A-beats-B') return `克 +${strength}%`;
  return `被克 -${strength}%`;
}

interface Props {
  selectedCell: { row: TacticType; col: TacticType } | null;
  onSelectCell: (cell: { row: TacticType; col: TacticType } | null) => void;
}

export default function CounterMatrixEditor({ selectedCell, onSelectCell }: Props) {
  const { tactics, counterRelations, setCounterRelation, cycleResult } = useTacticLibraryStore();
  const [showCycleWarning, setShowCycleWarning] = useState(false);

  const cycleInfo = useMemo(() => {
    if (!cycleResult.hasCycle) return null;
    const names = cycleResult.cycles[0]?.map((id) => {
      const t = tactics.find((x) => x.id === id);
      return t ? t.name : id;
    });
    return names?.join(' → ');
  }, [cycleResult, tactics]);

  const handleCellClick = (rowId: TacticType, colId: TacticType) => {
    if (rowId === colId) return;
    const rel = findRelation(counterRelations, rowId, colId);
    const currentDir = getDisplayDirection(rel, rowId, colId);
    const currentStrength = rel?.strength ?? 0;

    let nextDir: CounterDirection = currentDir;
    let nextStrength: CounterStrength = currentStrength;

    if (currentDir === 'none' || currentStrength === 0) {
      nextDir = 'A-beats-B';
      nextStrength = 10;
    } else if (currentDir === 'A-beats-B') {
      if (currentStrength < 30) {
        nextStrength = (currentStrength + 10) as CounterStrength;
      } else {
        nextDir = 'B-beats-A';
        nextStrength = 10;
      }
    } else {
      if (currentStrength < 30) {
        nextStrength = (currentStrength + 10) as CounterStrength;
      } else {
        nextDir = 'none';
        nextStrength = 0;
      }
    }

    setCounterRelation(rowId, colId, nextDir, nextStrength, rel?.reason);
    onSelectCell({ row: rowId, col: colId });

    if (!showCycleWarning && cycleResult.hasCycle) {
      setShowCycleWarning(true);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-[#FFD93D]" style={{ fontFamily: "'ZCOOL KuaiLe', cursive" }}>
          克制关系矩阵（点击格子切换）
        </h3>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-emerald-500/50" /> 行克制列
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-red-500/50" /> 列克制行
          </span>
        </div>
      </div>

      {cycleResult.hasCycle && showCycleWarning && (
        <div className="mb-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
          <div className="flex items-start gap-2">
            <span className="text-base">⚠️</span>
            <div>
              <div className="font-bold mb-1">检测到循环克制关系</div>
              <div>{cycleInfo}</div>
              <div className="mt-1 text-amber-300/70">（警告：循环克制可能导致战术推演结果不可预期，但系统允许保留此设置）</div>
              <button
                onClick={() => setShowCycleWarning(false)}
                className="mt-2 px-2 py-1 text-xs bg-amber-500/20 rounded hover:bg-amber-500/30"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="sticky top-0 left-0 z-10 bg-[#16213E] p-2 border border-white/10 min-w-[60px]"></th>
              {tactics.map((col) => (
                <th
                  key={col.id}
                  className="sticky top-0 z-10 bg-[#16213E] p-2 border border-white/10 min-w-[70px]"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-lg">{col.icon}</span>
                    <span className="text-white/90 font-bold whitespace-nowrap">{col.name}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tactics.map((row) => (
              <tr key={row.id}>
                <th className="sticky left-0 z-10 bg-[#1A1A2E] p-2 border border-white/10">
                  <div className="flex items-center gap-1 whitespace-nowrap">
                    <span className="text-lg">{row.icon}</span>
                    <span className="text-white/90 font-bold">{row.name}</span>
                  </div>
                </th>
                {tactics.map((col) => {
                  const isSame = row.id === col.id;
                  const rel = findRelation(counterRelations, row.id, col.id);
                  const direction = getDisplayDirection(rel, row.id, col.id);
                  const strength = rel?.strength ?? 0;
                  const isSelected =
                    selectedCell?.row === row.id && selectedCell?.col === col.id;

                  return (
                    <td
                      key={col.id}
                      onClick={() => !isSame && handleCellClick(row.id, col.id)}
                      className={`p-2 border border-white/10 text-center transition-all cursor-pointer ${
                        isSame
                          ? 'bg-white/5 text-white/30'
                          : getCellStyle(direction, strength)
                      } ${isSelected ? 'ring-2 ring-[#FFD93D]' : ''}`}
                    >
                      {isSame ? '=' : getCellText(direction, strength)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 pt-3 border-t border-white/10">
        <div className="text-xs text-white/50 mb-2">强度档位：</div>
        <div className="flex gap-2 flex-wrap">
          {STRENGTH_OPTIONS.map((opt) => (
            <span
              key={opt.value}
              className="px-2 py-1 text-xs rounded bg-white/5 border border-white/10 text-white/70"
            >
              {opt.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
