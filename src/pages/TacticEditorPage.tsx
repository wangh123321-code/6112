import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { CustomTactic, RiskLevel, TacticType } from '../engine/types';
import { RISK_LABELS } from '../engine/types';
import { useTacticLibraryStore } from '../store/useTacticLibraryStore';
import CounterMatrixEditor from '../components/CounterMatrixEditor';
import { sanitizeTacticName } from '../utils/xss';

const EMOJI_OPTIONS = ['🏓', '⚡', '🎯', '↔️', '💥', '🌀', '🛡️', '🏃', '✨', '🔥', '💫', '🎪', '🌟', '💪', '🎨'];

const RISK_OPTIONS: { value: RiskLevel; label: string }[] = [
  { value: 'low', label: '低风险' },
  { value: 'medium', label: '中风险' },
  { value: 'high', label: '高风险' },
];

interface TacticFormState {
  name: string;
  riskLevel: RiskLevel;
  icon: string;
  baseWinRate: number;
  description: string;
}

const DEFAULT_FORM: TacticFormState = {
  name: '',
  riskLevel: 'medium',
  icon: '🏓',
  baseWinRate: 0.5,
  description: '',
};

export default function TacticEditorPage() {
  const {
    tactics,
    counterRelations,
    cycleResult,
    initLibrary,
    saveLibrary,
    resetLibrary,
    addTactic,
    updateTactic,
    deleteTactic,
    setCounterReason,
    getCustomTacticsCount,
    checkCycles,
  } = useTacticLibraryStore();

  const [selectedTacticId, setSelectedTacticId] = useState<string | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ row: TacticType; col: TacticType } | null>(null);
  const [formState, setFormState] = useState<TacticFormState>(DEFAULT_FORM);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [reasonText, setReasonText] = useState('');

  useEffect(() => {
    initLibrary();
  }, [initLibrary]);

  useEffect(() => {
    if (selectedCell) {
      const rel = counterRelations.find(
        (r) =>
          (r.tacticA === selectedCell.row && r.tacticB === selectedCell.col) ||
          (r.tacticA === selectedCell.col && r.tacticB === selectedCell.row)
      );
      setReasonText(rel?.reason || '');
    } else {
      setReasonText('');
    }
  }, [selectedCell, counterRelations]);

  const handleSelectTactic = (t: CustomTactic) => {
    setSelectedTacticId(t.id);
    setSelectedCell(null);
    setIsEditing(true);
    setError(null);
    setFormState({
      name: t.name,
      riskLevel: t.riskLevel,
      icon: t.icon,
      baseWinRate: t.baseWinRate,
      description: t.description || '',
    });
  };

  const handleNewTactic = () => {
    setSelectedTacticId(null);
    setSelectedCell(null);
    setIsEditing(false);
    setError(null);
    setFormState(DEFAULT_FORM);
  };

  const handleSaveTactic = () => {
    setError(null);
    const sanitizedName = sanitizeTacticName(formState.name);
    if (!sanitizedName) {
      setError('战术名称不能为空');
      return;
    }
    if (sanitizedName !== formState.name.trim()) {
      setFormState((s) => ({ ...s, name: sanitizedName }));
    }

    if (isEditing && selectedTacticId) {
      const res = updateTactic(selectedTacticId, {
        name: sanitizedName,
        riskLevel: formState.riskLevel,
        icon: formState.icon,
        baseWinRate: formState.baseWinRate,
        description: formState.description,
      });
      if (!res.success) {
        setError(res.error || '更新失败');
        return;
      }
    } else {
      const res = addTactic(
        sanitizedName,
        formState.riskLevel,
        formState.icon,
        formState.baseWinRate
      );
      if (!res.success) {
        setError(res.error || '创建失败');
        return;
      }
      if (res.success && formState.description) {
        const last = tactics[tactics.length - 1];
        if (last) {
          updateTactic(last.id, { description: formState.description });
        }
      }
    }
    setIsEditing(false);
    setSelectedTacticId(null);
    setFormState(DEFAULT_FORM);
  };

  const handleDeleteTactic = (id: string) => {
    if (!confirm('确定删除该战术？相关克制关系也会被清除。')) return;
    const res = deleteTactic(id);
    if (!res.success) {
      setError(res.error || '删除失败');
      return;
    }
    if (selectedTacticId === id) {
      setSelectedTacticId(null);
      setIsEditing(false);
      setFormState(DEFAULT_FORM);
    }
  };

  const handleSaveReason = () => {
    if (!selectedCell) return;
    setCounterReason(selectedCell.row, selectedCell.col, reasonText);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 1500);
  };

  const handleSaveAndApply = () => {
    saveLibrary();
    const cycles = checkCycles();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
    if (cycles.hasCycle) {
      alert('已保存！注意：当前存在循环克制关系，可能影响推演结果。');
    }
  };

  const handleReset = () => {
    if (!confirm('确定重置为默认战术库？所有自定义战术将被删除。')) return;
    resetLibrary();
    setSelectedTacticId(null);
    setIsEditing(false);
    setFormState(DEFAULT_FORM);
    setSelectedCell(null);
  };

  const customCount = getCustomTacticsCount();
  const canAddMore = customCount < 12;

  const selectedRelation = selectedCell
    ? counterRelations.find(
        (r) =>
          (r.tacticA === selectedCell.row && r.tacticB === selectedCell.col) ||
          (r.tacticA === selectedCell.col && r.tacticB === selectedCell.row)
      )
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1A2E] via-[#16213E] to-[#1A1A2E] text-[#F5F0E1]">
      <div className="max-w-[1600px] mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm text-white/80 border border-white/20 transition-colors"
            >
              ← 返回对战
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-[#FFD93D]" style={{ fontFamily: "'ZCOOL KuaiLe', cursive" }}>
              📚 战术库管理
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-white/60">
              自定义战术: <span className="text-[#FFD93D] font-bold">{customCount}/12</span>
            </div>
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-sm text-white/70 border border-white/10 hover:border-red-500/30 transition-colors"
            >
              重置默认
            </button>
            <button
              onClick={handleSaveAndApply}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-sm font-bold text-white shadow-lg transition-all hover:scale-105"
            >
              💾 保存并应用
            </button>
          </div>
        </div>

        {saveSuccess && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm animate-pulse">
            ✅ 保存成功，新战术库已生效！
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
            ❌ {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_320px] gap-4 h-[calc(100vh-140px)]">
          <div className="bg-gradient-to-b from-[#16213E] to-[#1A1A2E] rounded-xl p-4 border border-white/10 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#FFD93D]" style={{ fontFamily: "'ZCOOL KuaiLe', cursive" }}>
                战术列表
              </h3>
              <button
                onClick={handleNewTactic}
                disabled={!canAddMore}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  canAddMore
                    ? 'bg-gradient-to-r from-[#FFD93D] to-amber-500 text-[#1A1A2E] hover:scale-105'
                    : 'bg-white/10 text-white/40 cursor-not-allowed'
                }`}
              >
                + 新增战术
              </button>
            </div>

            <div className="flex-1 overflow-auto space-y-2 pr-1">
              {tactics.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleSelectTactic(t)}
                  className={`p-3 rounded-lg cursor-pointer transition-all border ${
                    selectedTacticId === t.id
                      ? 'bg-[#FFD93D]/10 border-[#FFD93D]/50'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{t.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white truncate">{t.name}</span>
                        {t.isBuiltin && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/30 text-blue-300">
                            内置
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs">
                        <span className="text-white/60">{RISK_LABELS[t.riskLevel]}</span>
                        <span className="text-white/40">·</span>
                        <span className="text-white/60">基础胜率 {Math.round(t.baseWinRate * 100)}%</span>
                      </div>
                    </div>
                    {!t.isBuiltin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTactic(t.id);
                        }}
                        className="text-white/40 hover:text-red-400 text-sm p-1"
                        title="删除"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {(isEditing || !selectedTacticId) && (
              <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                <h4 className="text-sm font-bold text-white/80">
                  {isEditing ? '编辑战术' : '新增战术'}
                </h4>

                <div>
                  <label className="block text-xs text-white/60 mb-1">战术名称（最多6字）</label>
                  <input
                    type="text"
                    value={formState.name}
                    onChange={(e) => setFormState((s) => ({ ...s, name: e.target.value.slice(0, 6) }))}
                    placeholder="如：摆短、劈长"
                    disabled={isEditing && tactics.find((t) => t.id === selectedTacticId)?.isBuiltin}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#FFD93D]/50"
                  />
                </div>

                <div>
                  <label className="block text-xs text-white/60 mb-1">风险等级</label>
                  <div className="grid grid-cols-3 gap-2">
                    {RISK_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setFormState((s) => ({ ...s, riskLevel: opt.value }))}
                        className={`px-2 py-1.5 rounded-lg text-xs transition-all ${
                          formState.riskLevel === opt.value
                            ? 'bg-[#FFD93D] text-[#1A1A2E] font-bold'
                            : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-white/60 mb-1">图标</label>
                  <div className="flex flex-wrap gap-1">
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => setFormState((s) => ({ ...s, icon: emoji }))}
                        className={`w-8 h-8 rounded-lg text-lg transition-all ${
                          formState.icon === emoji
                            ? 'bg-[#FFD93D]/30 ring-1 ring-[#FFD93D]'
                            : 'bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-white/60 mb-1">
                    基础胜率系数: {Math.round(formState.baseWinRate * 100)}%
                  </label>
                  <input
                    type="range"
                    min="30"
                    max="70"
                    value={Math.round(formState.baseWinRate * 100)}
                    onChange={(e) =>
                      setFormState((s) => ({ ...s, baseWinRate: Number(e.target.value) / 100 }))
                    }
                    className="w-full accent-[#FFD93D]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-white/60 mb-1">战术说明（可选）</label>
                  <textarea
                    value={formState.description}
                    onChange={(e) => setFormState((s) => ({ ...s, description: e.target.value }))}
                    rows={2}
                    placeholder="描述该战术的特点..."
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#FFD93D]/50 resize-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSaveTactic}
                    className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-r from-[#FFD93D] to-amber-500 text-[#1A1A2E] text-sm font-bold hover:scale-105 transition-all"
                  >
                    {isEditing ? '保存修改' : '创建战术'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setSelectedTacticId(null);
                      setFormState(DEFAULT_FORM);
                      setError(null);
                    }}
                    className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 text-sm hover:bg-white/10 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-b from-[#16213E] to-[#1A1A2E] rounded-xl p-4 border border-white/10 overflow-hidden">
            <CounterMatrixEditor selectedCell={selectedCell} onSelectCell={setSelectedCell} />
          </div>

          <div className="bg-gradient-to-b from-[#16213E] to-[#1A1A2E] rounded-xl p-4 border border-white/10 flex flex-col overflow-hidden">
            <h3 className="text-base font-bold text-[#FFD93D] mb-4" style={{ fontFamily: "'ZCOOL KuaiLe', cursive" }}>
              克制关系说明
            </h3>

            {selectedCell && selectedRelation ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center justify-center gap-3 text-lg">
                    {(() => {
                      const rowT = tactics.find((t) => t.id === selectedCell.row);
                      const colT = tactics.find((t) => t.id === selectedCell.col);
                      const isRowBeatCol =
                        (selectedRelation.tacticA === selectedCell.row &&
                          selectedRelation.tacticB === selectedCell.col &&
                          selectedRelation.direction === 'A-beats-B') ||
                        (selectedRelation.tacticA === selectedCell.col &&
                          selectedRelation.tacticB === selectedCell.row &&
                          selectedRelation.direction === 'B-beats-A');
                      const isColBeatRow =
                        (selectedRelation.tacticA === selectedCell.row &&
                          selectedRelation.tacticB === selectedCell.col &&
                          selectedRelation.direction === 'B-beats-A') ||
                        (selectedRelation.tacticA === selectedCell.col &&
                          selectedRelation.tacticB === selectedCell.row &&
                          selectedRelation.direction === 'A-beats-B');

                      return (
                        <>
                          <div className="flex flex-col items-center">
                            <span className="text-2xl">{rowT?.icon}</span>
                            <span className="text-sm font-bold">{rowT?.name}</span>
                          </div>
                          <span className="text-2xl font-bold text-[#FFD93D]">
                            {isRowBeatCol ? '→' : isColBeatRow ? '←' : '—'}
                          </span>
                          <div className="flex flex-col items-center">
                            <span className="text-2xl">{colT?.icon}</span>
                            <span className="text-sm font-bold">{colT?.name}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  <div className="text-center text-xs text-white/60 mt-2">
                    克制强度:{' '}
                    <span className="text-[#FFD93D] font-bold">
                      {selectedRelation.strength > 0 ? `+${selectedRelation.strength}%` : '无克制'}
                    </span>
                  </div>
                </div>

                <label className="block text-xs text-white/60 mb-1">克制/被克制原因</label>
                <textarea
                  value={reasonText}
                  onChange={(e) => setReasonText(e.target.value)}
                  rows={8}
                  placeholder="描述为什么这个战术克制/被克制另一个战术..."
                  className="flex-1 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#FFD93D]/50 resize-none"
                />

                <button
                  onClick={handleSaveReason}
                  className="mt-3 w-full px-3 py-2 rounded-lg bg-gradient-to-r from-[#FFD93D] to-amber-500 text-[#1A1A2E] text-sm font-bold hover:scale-105 transition-all"
                >
                  保存说明
                </button>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center text-white/40 text-sm">
                <div>
                  <div className="text-4xl mb-3">📝</div>
                  <div>在左侧矩阵中点击两个战术的交叉格</div>
                  <div>即可在此编辑克制关系说明</div>
                </div>
              </div>
            )}

            {cycleResult.hasCycle && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="text-xs text-amber-300 font-bold mb-2">⚠️ 当前循环克制:</div>
                <div className="text-xs text-amber-300/70 space-y-1">
                  {cycleResult.cycles.slice(0, 3).map((cycle, idx) => (
                    <div key={idx} className="px-2 py-1 rounded bg-amber-500/10">
                      {cycle
                        .map((id) => tactics.find((t) => t.id === id)?.name || id)
                        .join(' → ')}
                    </div>
                  ))}
                  {cycleResult.cycles.length > 3 && (
                    <div className="text-amber-300/50">...还有 {cycleResult.cycles.length - 3} 个循环</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
