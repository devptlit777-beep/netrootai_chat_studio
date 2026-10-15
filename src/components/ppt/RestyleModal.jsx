import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { PPT_API_BASE } from './pptConstants';
import { Wand2, X, Loader2, Check, Sparkles } from 'lucide-react';

const PRESETS = [
  'Make punchier and more concise',
  'Executive C-suite tone',
  'Add realistic enterprise metrics / percentages',
  'Rephrase as actionable initiative',
  'Highlight technical infrastructure & latency',
];

export default function RestyleModal({
  isOpen = false,
  onClose,
  targetInfo = null,
  slideTitle = '',
  onApplyRestyle,
  deckId = null,
  isEditLimitReached = false,
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [instruction, setInstruction] = useState(PRESETS[0]);
  const [isRestyling, setIsRestyling] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !targetInfo) return null;

  const originalText = targetInfo.text || '';

  const handleExecuteRestyle = async (presetText) => {
    if (isEditLimitReached) {
      navigate('/pricing');
      return;
    }
    const finalInstruction = presetText || instruction;
    if (!finalInstruction.trim() || isRestyling) return;

    setIsRestyling(true);
    setErrorMsg('');

    try {
      const res = await fetch(`${PPT_API_BASE}/api/restyle-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || '',
        },
        body: JSON.stringify({
          text: originalText,
          instruction: finalInstruction.trim(),
          slide_title: slideTitle,
          deckId: deckId || undefined,
          userEmail: user?.email || '',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to restyle text');
      }

      const data = await res.json();
      if (data.restyled) {
        onApplyRestyle(targetInfo, data.restyled);
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error restyling text');
    } finally {
      setIsRestyling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
      <div className="w-full max-w-lg bg-[#141416] border border-[#26262a] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#26262a] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Restyle with NetRoot AI</h2>
              <p className="text-xs text-slate-400">Rephrase or refine point tone</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {isEditLimitReached && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-xs text-amber-200">
                  Free AI edit limit reached (5/5). Upgrade to Pro for unlimited AI restyling.
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigate('/pricing')}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white text-xs font-bold shrink-0 transition"
              >
                Upgrade to Pro
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Original Point */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-slate-400 block mb-1.5">
              Current Text
            </span>
            <div className="p-3 rounded-xl bg-[#18181b] border border-[#26262a] text-xs text-slate-200 leading-relaxed font-sans">
              "{originalText}"
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className={isEditLimitReached ? 'opacity-50 pointer-events-none' : ''}>
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-slate-400 block mb-2">
              Select Preset
            </span>
            <div className="flex flex-col gap-1.5">
              {PRESETS.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setInstruction(p);
                    handleExecuteRestyle(p);
                  }}
                  disabled={isRestyling || isEditLimitReached}
                  className="w-full text-left text-xs px-3 py-2 rounded-lg bg-[#18181b] hover:bg-[#202025] border border-[#26262a] hover:border-purple-500/50 text-slate-300 hover:text-white flex items-center justify-between transition disabled:opacity-50"
                >
                  <span>{p}</span>
                  <Wand2 className="w-3.5 h-3.5 text-purple-400 opacity-60" />
                </button>
              ))}
            </div>
          </div>

          {/* Custom Instruction */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-slate-400 block mb-1.5">
              Or Custom Instruction
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                disabled={isEditLimitReached || isRestyling}
                placeholder="e.g. Simplify language, make it executive-level, add a metaphor..."
                className="flex-1 bg-[#18181b] border border-[#2b2b30] focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none disabled:opacity-50"
              />
              {isEditLimitReached ? (
                <button
                  type="button"
                  onClick={() => navigate('/pricing')}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                  <span>Upgrade to Pro</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleExecuteRestyle(instruction)}
                  disabled={!instruction.trim() || isRestyling}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  {isRestyling ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Apply</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
