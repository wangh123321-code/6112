import { TACTIC_ICONS, TACTIC_LABELS } from '../../engine/types';
import type { TacticType } from '../../engine/types';
import { useGameStore } from '../../store/useGameStore';

const tactics: { key: TacticType; desc: string; color: string; risk: string }[] = [
  {
    key: 'attack',
    desc: '站位优时胜率高，站位差时容易失误',
    color: 'from-orange-500 to-red-600',
    risk: '高风险',
  },
  {
    key: 'control',
    desc: '主动调整站位，为下一板创造机会',
    color: 'from-teal-500 to-emerald-600',
    risk: '低风险',
  },
  {
    key: 'redirect',
    desc: '打乱对手节奏，克制连续压中路',
    color: 'from-blue-500 to-indigo-600',
    risk: '中风险',
  },
];

export default function TacticsPanel() {
  const { phase, chooseTactic } = useGameStore();
  const disabled = phase !== 'waiting_input';

  return (
    <div className="bg-gradient-to-r from-[#16213E] to-[#1A1A2E] rounded-xl p-5 shadow-lg border border-white/10">
      <h3 className="text-lg font-bold text-[#FFD93D] mb-4" style={{ fontFamily: "'ZCOOL KuaiLe', cursive" }}>
        选择本回合战术
      </h3>

      <div className="grid grid-cols-3 gap-3">
        {tactics.map(({ key, desc, color, risk }) => (
          <button
            key={key}
            onClick={() => !disabled && chooseTactic(key)}
            disabled={disabled}
            className={`relative group overflow-hidden rounded-xl p-4 text-left bg-gradient-to-br ${color} ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105 hover:shadow-xl cursor-pointer'} transition-all duration-300`}
          >
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
            <div className="text-3xl mb-2">{TACTIC_ICONS[key]}</div>
            <div className="font-bold text-white text-base mb-1" style={{ fontFamily: "'ZCOOL KuaiLe', cursive" }}>
              {TACTIC_LABELS[key]}
            </div>
            <div className="text-xs text-white/80 mb-2 leading-snug">{desc}</div>
            <div className="inline-block px-2 py-0.5 rounded bg-black/30 text-xs text-white/90 text-[10px]">
              {risk}
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
