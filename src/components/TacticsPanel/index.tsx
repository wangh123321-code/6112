import type { CustomTactic, TacticType } from '../../engine/types';
import { RISK_LABELS } from '../../engine/types';
import { useGameStore } from '../../store/useGameStore';
import { useTacticLibraryStore } from '../../store/useTacticLibraryStore';
import { useEffect } from 'react';

function getColorForRisk(risk: string): string {
  switch (risk) {
    case 'high':
      return 'from-orange-500 to-red-600';
    case 'low':
      return 'from-teal-500 to-emerald-600';
    default:
      return 'from-blue-500 to-indigo-600';
  }
}

function getTacticDescription(tactic: CustomTactic): string {
  if (tactic.id === 'attack') return '站位优时胜率高，站位差时容易失误';
  if (tactic.id === 'control') return '主动调整站位，为下一板创造机会';
  if (tactic.id === 'redirect') return '打乱对手节奏，克制连续压中路';
  return tactic.description || '自定义战术';
}

export default function TacticsPanel() {
  const { phase, chooseTactic } = useGameStore();
  const { tactics, initLibrary } = useTacticLibraryStore();
  const disabled = phase !== 'waiting_input';

  useEffect(() => {
    initLibrary();
  }, [initLibrary]);

  return (
    <div className="bg-gradient-to-r from-[#16213E] to-[#1A1A2E] rounded-xl p-5 shadow-lg border border-white/10">
      <h3 className="text-lg font-bold text-[#FFD93D] mb-4" style={{ fontFamily: "'ZCOOL KuaiLe', cursive" }}>
        选择本回合战术
      </h3>

      <div className={`grid gap-3 ${tactics.length <= 3 ? 'grid-cols-3' : tactics.length <= 4 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'}`}>
        {tactics.map((tactic) => (
          <button
            key={tactic.id}
            onClick={() => !disabled && chooseTactic(tactic.id as TacticType)}
            disabled={disabled}
            className={`relative group overflow-hidden rounded-xl p-4 text-left bg-gradient-to-br ${getColorForRisk(tactic.riskLevel)} ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105 hover:shadow-xl cursor-pointer'} transition-all duration-300`}
          >
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
            <div className="text-3xl mb-2">{tactic.icon}</div>
            <div className="font-bold text-white text-base mb-1" style={{ fontFamily: "'ZCOOL KuaiLe', cursive" }}>
              {tactic.name}
            </div>
            <div className="text-xs text-white/80 mb-2 leading-snug">{getTacticDescription(tactic)}</div>
            <div className="inline-block px-2 py-0.5 rounded bg-black/30 text-xs text-white/90 text-[10px]">
              {RISK_LABELS[tactic.riskLevel]}
            </div>
          </button>
        ))}
      </div>

      {phase === 'resolving' && (
        <div className="mt-4 text-center text-amber-400 text-sm animate-pulse">
          ⚡ 推演中...
        </div>
      )}
    </div>
  );
}
