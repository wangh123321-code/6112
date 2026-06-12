import { Link } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';
import AISelector from '../components/AISelector';
import TableCanvas from '../components/TableCanvas';
import ScoreBoard from '../components/ScoreBoard';
import TacticsPanel from '../components/TacticsPanel';
import ProbabilityTree from '../components/ProbabilityTree';
import StatsPanel from '../components/StatsPanel';

export default function GamePage() {
  const { phase, aiStyle, player, ai, lastResult, resetToStyleSelect } = useGameStore();

  if (phase === 'selecting_style' || !aiStyle) {
    return <AISelector onSelect={(style) => useGameStore.getState().selectAIStyle(style)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1A2E] via-[#16213E] to-[#1A1A2E] text-[#F5F0E1] p-4 md:p-6">
      {phase === 'game_over' && <StatsPanel />}

      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-[#FFD93D]" style={{ fontFamily: "'ZCOOL KuaiLe', cursive" }}>
            🏓 乒乓球战术推演棋盘
          </h1>
          <div className="flex items-center gap-2">
            <Link
              to="/tactic-editor"
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-[#FFD93D]/20 text-sm text-white/80 border border-white/20 hover:border-[#FFD93D]/50 transition-colors"
            >
              📚 战术库
            </Link>
            <button
              onClick={resetToStyleSelect}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm text-white/80 border border-white/20 transition-colors"
            >
              ← 返回选择对手
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6">
          <div className="flex justify-center">
            <TableCanvas
              playerPosition={player.position}
              aiPosition={ai.position}
              resolving={phase === 'resolving'}
              lastWinner={lastResult?.winner ?? null}
            />
          </div>

          <div className="flex flex-col gap-4">
            <ScoreBoard />

            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-white/50 mb-1">你的站位优势</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#FF6B35] rounded-full"
                        style={{ width: `${((player.positionAdvantage + 1) / 2) * 100}%` }}
                      />
                    </div>
                    <span className="text-[#FF6B35] font-bold text-xs w-10 text-right">
                      {Math.round(player.positionAdvantage * 100)}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-white/50 mb-1">AI站位优势</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#4ECDC4] rounded-full"
                        style={{ width: `${((ai.positionAdvantage + 1) / 2) * 100}%` }}
                      />
                    </div>
                    <span className="text-[#4ECDC4] font-bold text-xs w-10 text-right">
                      {Math.round(ai.positionAdvantage * 100)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {phase !== 'showing_tree' && <TacticsPanel />}

            <ProbabilityTree />
          </div>
        </div>
      </div>
    </div>
  );
}
