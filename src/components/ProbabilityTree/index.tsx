import { useGameStore } from '../../store/useGameStore';
import { TACTIC_ICONS, TACTIC_LABELS } from '../../engine/types';
import type { TacticType } from '../../engine/types';

const TACTIC_COLORS: Record<TacticType, string> = {
  attack: '#FF6B35',
  control: '#4ECDC4',
  redirect: '#FFD93D',
};

export default function ProbabilityTree() {
  const { lastResult, advanceFromTree, phase } = useGameStore();

  if (!lastResult || phase !== 'showing_tree') return null;

  const { playerTactic, aiTactic, playerWinRate, winner, probabilityBranches } = lastResult;

  const actualBranch = probabilityBranches.find(
    (b) => b.aiResponse === aiTactic
  );

  return (
    <div className="bg-gradient-to-r from-[#16213E] to-[#1A1A2E] rounded-xl p-5 shadow-lg border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-[#FFD93D]" style={{ fontFamily: "'ZCOOL KuaiLe', cursive" }}>
          概率推演分析
        </h3>
        <div
          className={`px-3 py-1 rounded-full text-sm font-bold ${
          winner === 'player'
            ? 'bg-[#FF6B35]/20 text-[#FF6B35]'
            : 'bg-[#4ECDC4]/20 text-[#4ECDC4]'
          }`}
        >
          {winner === 'player' ? '🏆 你赢了这一板' : '💥 AI赢了这一板'}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-5">
        <div
          className="px-3 py-1.5 rounded-lg text-white text-sm font-bold"
          style={{ backgroundColor: TACTIC_COLORS[playerTactic] }}
        >
          {TACTIC_ICONS[playerTactic]} {TACTIC_LABELS[playerTactic]}
        </div>
        <span className="text-white/50 mx-1">vs</span>
        <div
          className="px-3 py-1.5 rounded-lg text-white text-sm font-bold"
          style={{ backgroundColor: TACTIC_COLORS[aiTactic] }}
        >
          {TACTIC_ICONS[aiTactic]} {TACTIC_LABELS[aiTactic]}
        </div>
        <span className="text-white/50 mx-1">→</span>
        <div className="flex items-center gap-1 text-sm">
          <span className="text-[#FF6B35] font-bold">{playerWinRate}%</span>
          <span className="text-white/50">/</span>
          <span className="text-[#4ECDC4] font-bold">{100 - playerWinRate}%</span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="text-xs text-white/60 mb-2">你的战术在不同AI应对下的胜率分支：</div>
        {probabilityBranches.map((branch) => {
          const isActual = branch.aiResponse === aiTactic;
          return (
            <div
              key={branch.aiResponse}
              className={`relative flex items-center gap-3 p-3 rounded-lg border transition-all ${
              isActual
                ? 'bg-amber-500/10 border-amber-500/40'
                : 'bg-white/5 border-white/10'
              }`}
            >
              {isActual && (
                <div className="absolute -left-1 -top-1 w-3 h-3 rounded-full bg-amber-400 text-[8px] flex items-center justify-center text-black font-bold">
                  ✓
                </div>
              )}
              <div
                className="flex items-center gap-2 w-24"
                style={{ color: TACTIC_COLORS[branch.aiResponse] }}
              >
                <span className="text-lg">{TACTIC_ICONS[branch.aiResponse]}</span>
                <span className="font-bold text-sm">
                  AI{TACTIC_LABELS[branch.aiResponse]}
                </span>
              </div>

              <div className="flex-1">
                <div className="h-2 bg-white/10 rounded-full overflow-hidden flex">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${branch.playerWinProbability}%`,
                      background: `linear-gradient(90deg, #FF6B35, #FFD93D)`,
                    }}
                  />
                </div>
              </div>

              <div className="w-14 text-right">
                <span
                  className="font-bold text-sm"
                  style={{
                    color:
                    branch.playerWinProbability >= 55
                    ? '#FF6B35'
                    : branch.playerWinProbability <= 45
                    ? '#4ECDC4'
                    : '#F5F0E1',
                  }}
                >
                  {branch.playerWinProbability}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {actualBranch && (
        <div className="text-xs text-white/60 italic border-l-2 border-amber-400 pl-3 mb-4">
          💡 {actualBranch.description}
        </div>
      )}

      <button
        onClick={advanceFromTree}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm hover:opacity-90 transition-opacity"
      >
        继续下一回合 →
      </button>
    </div>
  );
}
