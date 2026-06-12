import { useGameStore } from '../../store/useGameStore';
import { AI_STYLE_LABELS } from '../../engine/types';

export default function ScoreBoard() {
  const {
    playerScore,
    aiScore,
    server,
    aiStyle,
    roundNumber,
  } = useGameStore();

  const playerLeading = playerScore > aiScore;
  const aiLeading = aiScore > playerScore;

  return (
    <div className="bg-gradient-to-r from-[#16213E] to-[#1A1A2E] rounded-xl p-5 shadow-lg border border-white/10">
      <div className="grid grid-cols-3 items-center gap-4 mb-4">
        <div className="text-center">
          <div className="text-xs text-white/50 mb-1">你</div>
          <div
            className={`text-5xl font-bold transition-all duration-300 ${
            playerLeading ? 'text-[#FF6B35] scale-110' : 'text-white/70'
          }`}
            style={{ fontFamily: "'ZCOOL KuaiLe', cursive" }}
          >
            {playerScore}
          </div>
          {server === 'player' && (
            <div className="mt-1 text-xs text-amber-400">🏓 发球</div>
          )}
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-white/30">VS</div>
          <div className="text-xs text-white/40 mt-1">第 {roundNumber} 回合</div>
        </div>

        <div className="text-center">
          <div className="text-xs text-white/50 mb-1">
            {aiStyle ? AI_STYLE_LABELS[aiStyle] : 'AI'}
          </div>
          <div
            className={`text-5xl font-bold transition-all duration-300 ${
            aiLeading ? 'text-[#4ECDC4] scale-110' : 'text-white/70'
          }`}
            style={{ fontFamily: "'ZCOOL KuaiLe', cursive" }}
          >
            {aiScore}
          </div>
          {server === 'ai' && (
            <div className="mt-1 text-xs text-amber-400">🏓 发球</div>
          )}
        </div>
      </div>

      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#FF6B35] via-[#FFD93D] to-[#4ECDC4]"
          style={{
            width: `${Math.max(5, (playerScore / Math.max(1, playerScore + aiScore)) * 100)}%`,
          }}
        />
      </div>
    </div>
  );
}
