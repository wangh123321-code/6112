import { Link } from 'react-router-dom';
import { AI_STYLE_LABELS } from '../../engine/types';
import type { AIStyle } from '../../engine/types';
import { getAIStyleDescription } from '../../engine/ai';

interface AISelectorProps {
  onSelect: (style: AIStyle) => void;
}

const styles: { key: AIStyle; icon: string; color: string }[] = [
  { key: 'counter', icon: '🛡️', color: 'from-teal-500 to-emerald-600' },
  { key: 'aggressive', icon: '🔥', color: 'from-orange-500 to-red-600' },
  { key: 'variable', icon: '🎲', color: 'from-purple-500 to-fuchsia-600' },
];

export default function AISelector({ onSelect }: AISelectorProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1A2E] via-[#16213E] to-[#1A1A2E] text-[#F5F0E1] flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-4xl flex justify-end mb-4">
        <Link
          to="/tactic-editor"
          className="px-4 py-2 rounded-lg bg-white/10 hover:bg-[#FFD93D]/20 text-sm text-white/80 border border-white/20 hover:border-[#FFD93D]/50 transition-colors"
        >
          📚 战术库管理
        </Link>
      </div>

      <h1 className="text-5xl font-bold mb-2 text-center" style={{ fontFamily: "'ZCOOL KuaiLe', cursive" }}>
        🏓 乒乓球战术推演棋盘
      </h1>
      <p className="text-lg text-amber-300 mb-10 text-center max-w-xl">
        选择你的AI对手风格，每回合选择战术推演胜负
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        {styles.map(({ key, icon, color }) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={`group relative overflow-hidden rounded-2xl p-8 text-left bg-gradient-to-br ${color} shadow-xl hover:scale-105 hover:shadow-2xl transition-all duration-300`}
          >
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
            <div className="text-6xl mb-4">{icon}</div>
            <h3 className="text-2xl font-bold mb-2 text-white" style={{ fontFamily: "'ZCOOL KuaiLe', cursive" }}>
              {AI_STYLE_LABELS[key]}
            </h3>
            <p className="text-sm text-white/85 leading-relaxed">
              {getAIStyleDescription(key)}
            </p>
          </button>
        ))}
      </div>

      <div className="mt-12 p-6 bg-white/5 rounded-xl border border-white/10 max-w-2xl">
        <h4 className="text-amber-400 font-bold mb-3">游戏规则</h4>
        <ul className="text-sm text-white/70 space-y-1">
          <li>一局11分制，10平后需领先2分获胜</li>
          <li>每回合从战术库中选择一种战术进行推演</li>
          <li>系统根据战术组合、克制关系和当前站位推演结果</li>
          <li>每回合结束查看概率树，了解不同选择的胜率</li>
          <li>可在「战术库管理」中自定义战术与克制关系</li>
        </ul>
      </div>
    </div>
  );
}
