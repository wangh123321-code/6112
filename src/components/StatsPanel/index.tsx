import { useGameStore } from '../../store/useGameStore';
import { useTacticLibraryStore } from '../../store/useTacticLibraryStore';
import { AI_STYLE_LABELS } from '../../engine/types';
import type { TacticType } from '../../engine/types';
import { useEffect } from 'react';

const DEFAULT_COLORS: Record<string, string> = {
  attack: '#FF6B35',
  control: '#4ECDC4',
  redirect: '#FFD93D',
};

const RAINBOW_COLORS = [
  '#FF6B35', '#4ECDC4', '#FFD93D', '#A78BFA', '#F472B6',
  '#34D399', '#60A5FA', '#FB923C', '#F87171', '#38BDF8',
  '#C084FC', '#FBBF24', '#2DD4BF', '#FB7185', '#A3E635',
];

function getTacticColor(id: string, idx: number): string {
  if (DEFAULT_COLORS[id]) return DEFAULT_COLORS[id];
  return RAINBOW_COLORS[idx % RAINBOW_COLORS.length];
}

export default function StatsPanel() {
  const { stats, winner, aiStyle, restartGame, resetToStyleSelect, playerScore, aiScore } =
    useGameStore();
  const { tactics, initLibrary } = useTacticLibraryStore();

  useEffect(() => {
    initLibrary();
  }, [initLibrary]);

  const tacticList: TacticType[] = tactics.map((t) => t.id);

  const totalRounds = tacticList.reduce((sum, id) => {
    const s = stats.records[id];
    return sum + (s?.used || 0);
  }, 0);

  const getSuccessRate = (used: number, won: number) => {
    if (used === 0) return 0;
    return Math.round((won / used) * 100);
  };

  const maxUsed = Math.max(
    ...tacticList.map((id) => stats.records[id]?.used || 0),
    1
  );

  const tacticMap = new Map(tactics.map((t, i) => [t.id, { ...t, color: getTacticColor(t.id, i) }]));

  const getTacticInfo = (id: TacticType) => {
    const found = tacticMap.get(id);
    if (found) return { name: found.name, icon: found.icon, color: found.color };
    return { name: id, icon: '🏓', color: '#F5F0E1' };
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-[#1A1A2E] via-[#16213E] to-[#1A1A2E] rounded-2xl p-8 max-w-3xl w-full border border-white/10 shadow-2xl my-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">
            {winner === 'player' ? '🏆' : '😢'}
          </div>
          <h2
            className={`text-4xl font-bold mb-2 ${
            winner === 'player' ? 'text-[#FF6B35]' : 'text-[#4ECDC4]'
            }`}
            style={{ fontFamily: "'ZCOOL KuaiLe', cursive" }}
          >
            {winner === 'player' ? '恭喜你获胜！' : 'AI 获胜'}
          </h2>
          <div className="text-2xl text-white/80 mb-1">
            <span className="text-[#FF6B35] font-bold">{playerScore}</span>
            <span className="text-white/50 mx-2">:</span>
            <span className="text-[#4ECDC4] font-bold">{aiScore}</span>
          </div>
          <div className="text-sm text-white/50">
            对战 AI （{aiStyle ? AI_STYLE_LABELS[aiStyle] : ''}）共 {totalRounds} 回合
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/5 rounded-xl p-5 border border-white/10">
            <h3 className="text-lg font-bold text-[#FFD93D] mb-4" style={{ fontFamily: "'ZCOOL KuaiLe', cursive" }}>
              📊 战术使用频率
            </h3>
            <div className="space-y-3">
              {tacticList.map((t) => {
                const info = getTacticInfo(t);
                const used = stats.records[t]?.used || 0;
                const rate = totalRounds === 0 ? 0 : (used / totalRounds) * 100;
                return (
                  <div key={t} className="flex items-center gap-3">
                    <div className="w-24 text-sm text-white/80 truncate">
                      {info.icon} {info.name}
                    </div>
                    <div className="flex-1 h-6 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${rate}%`,
                          backgroundColor: info.color,
                        }}
                      />
                    </div>
                    <div className="w-12 text-right text-sm font-bold" style={{ color: info.color }}>
                      {used}次
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-5 border border-white/10">
            <h3 className="text-lg font-bold text-[#FFD93D] mb-4" style={{ fontFamily: "'ZCOOL KuaiLe', cursive" }}>
              🎯 各类战术成功率
            </h3>
            <div className="space-y-3">
              {tacticList.map((t) => {
                const info = getTacticInfo(t);
                const { used = 0, won = 0 } = stats.records[t] || {};
                const success = getSuccessRate(used, won);
                return (
                  <div key={t} className="flex items-center gap-3">
                    <div className="w-24 text-sm text-white/80 truncate">
                      {info.icon} {info.name}
                    </div>
                    <div className="flex-1 h-6 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all flex items-center justify-end pr-2"
                        style={{
                          width: `${success}%`,
                          backgroundColor:
                            success >= 60
                            ? '#10B981'
                            : success >= 40
                            ? '#F59E0B'
                            : '#EF4444',
                        }}
                      >
                        {success > 25 && (
                          <span className="text-[10px] text-white font-bold">
                            {success}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-16 text-right text-xs text-white/60">
                      {won}/{used}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {stats.criticalPoints.length > 0 && (
          <div className="bg-white/5 rounded-xl p-5 border border-white/10 mb-8">
            <h3 className="text-lg font-bold text-[#FFD93D] mb-4" style={{ fontFamily: "'ZCOOL KuaiLe', cursive" }}>
              🔑 关键分回顾
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-white/50 text-xs border-b border-white/10">
                    <th className="text-left py-2 px-2">回合</th>
                    <th className="text-left py-2 px-2">比分</th>
                    <th className="text-left py-2 px-2">你的战术</th>
                    <th className="text-left py-2 px-2">AI战术</th>
                    <th className="text-left py-2 px-2">结果</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.criticalPoints.map((cp, idx) => {
                    const pInfo = getTacticInfo(cp.playerTactic);
                    const aInfo = getTacticInfo(cp.aiTactic);
                    return (
                      <tr
                        key={idx}
                        className="border-b border-white/5 hover:bg-white/5"
                      >
                        <td className="py-2 px-2 text-white/70">#{cp.round}</td>
                        <td className="py-2 px-2">
                          <span className="text-[#FF6B35]">{cp.playerScore}</span>
                          <span className="text-white/50 mx-1">:</span>
                          <span className="text-[#4ECDC4]">{cp.aiScore}</span>
                          {cp.isGamePoint && (
                            <span className="ml-1 text-[10px] text-amber-400">局点</span>
                          )}
                        </td>
                        <td className="py-2 px-2">
                          <span style={{ color: pInfo.color }}>
                            {pInfo.icon} {pInfo.name}
                          </span>
                        </td>
                        <td className="py-2 px-2">
                          <span style={{ color: aInfo.color }}>
                            {aInfo.icon} {aInfo.name}
                          </span>
                        </td>
                        <td className="py-2 px-2">
                          <span
                            className={
                              cp.winner === 'player' ? 'text-[#FF6B35]' : 'text-[#4ECDC4]'
                            }
                          >
                            {cp.winner === 'player' ? '✅ 胜' : '❌ 负'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={restartGame}
            className="flex-1 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-lg hover:opacity-90 transition-opacity"
            style={{ fontFamily: "'ZCOOL KuaiLe', cursive" }}
          >
            🔄 再来一局
          </button>
          <button
            onClick={resetToStyleSelect}
            className="flex-1 py-4 rounded-xl bg-white/10 text-white/80 font-bold text-lg hover:bg-white/15 transition-colors border border-white/20"
            style={{ fontFamily: "'ZCOOL KuaiLe', cursive" }}
          >
            🎯 更换对手
          </button>
        </div>
      </div>
    </div>
  );
}
