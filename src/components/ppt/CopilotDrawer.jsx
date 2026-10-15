import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { usePlan } from '../../contexts/PlanContext';
import { PPT_API_BASE } from './pptConstants';
import {
  Bot,
  X,
  Send,
  Loader2,
  RefreshCw,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export default function CopilotDrawer({
  isOpen = false,
  onClose,
  activeSlide,
  slideIndex = 0,
  deckTopic = '',
  deckId = null,
  isViewOnly = false,
  aiEditsCount = 0,
  maxAiEdits = 5,
  onApplySlideUpdate,
  onQuickRegenerateCurrent,
  isRegenerating = false,
}) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { plan, lifetimePptCount = 0, featureAccess } = usePlan();
  const darkMode = theme === 'dark';

  const isPro = plan === 'pro' || plan === 'enterprise' || Boolean(featureAccess?.['ppt-studio']);
  const isFreeLimitReached = !isPro && lifetimePptCount >= 2;
  const isEditLimitReached = !isPro && (isFreeLimitReached || isViewOnly || aiEditsCount >= maxAiEdits);

  const [instruction, setInstruction] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastSummary, setLastSummary] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (isEditLimitReached) {
      navigate('/pricing');
      return;
    }
    if (!instruction.trim() || isLoading || !activeSlide) return;

    setIsLoading(true);
    setErrorMsg('');
    setLastSummary(null);

    try {
      const res = await fetch(`${PPT_API_BASE}/api/copilot-edit-slide`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || '',
        },
        body: JSON.stringify({
          slide: activeSlide,
          instruction: instruction.trim(),
          deck_topic: deckTopic || activeSlide.t || '',
          deckId: deckId || undefined,
          userEmail: user?.email || '',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.detail || 'Failed to edit slide with NetRoot AI Assistant');
      }

      const data = await res.json();
      if (data.slide) {
        onApplySlideUpdate(data.slide);
        setLastSummary(data.summary || 'Slide updated successfully!');
        setInstruction('');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error executing NetRoot AI Assistant instruction');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    /* Side panel without any blur/dark backdrop overlay so slide remains 100% clear */
    <aside
      className={`fixed inset-y-0 right-0 z-40 w-80 sm:w-96 flex flex-col select-none shadow-2xl animate-in slide-in-from-right duration-200 border-l ${
        darkMode
          ? 'bg-[#141416] border-[#26262a] text-slate-100'
          : 'bg-white border-slate-200 text-slate-900 shadow-slate-300/40'
      }`}
    >
      {/* Header */}
      <div
        className={`p-4 border-b flex items-center justify-between ${
          darkMode ? 'border-[#26262a]' : 'border-slate-100 bg-slate-50/60'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-600/30">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h2
              className={`text-xs font-bold uppercase tracking-wider font-mono ${
                darkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              NetRoot AI Assistant
            </h2>
            <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Slide #{slideIndex + 1} Assistant
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={`w-7 h-7 flex items-center justify-center rounded-lg transition ${
            darkMode
              ? 'text-slate-400 hover:text-white hover:bg-white/5'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
          title="Close NetRoot AI Assistant"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Free Tier AI Edits Quota Indicator */}
        {!isPro && (
          <div
            className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-medium ${
              isEditLimitReached
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : darkMode
                ? 'bg-white/5 border-white/10 text-slate-300'
                : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            <span>Free AI Edits for Deck:</span>
            <span className="font-bold font-mono">
              {aiEditsCount} / {maxAiEdits} {isEditLimitReached && '(Limit reached)'}
            </span>
          </div>
        )}

        {/* Quick Slide Regenerate */}
        <div
          className={`p-3 rounded-xl border flex items-center justify-between ${
            darkMode
              ? 'bg-purple-950/20 border-purple-500/20 text-purple-200'
              : 'bg-purple-50 border-purple-200 text-purple-900'
          }`}
        >
          <div>
            <span className="text-xs font-semibold block">Redo Slide Content</span>
            <span
              className={`text-[11px] ${
                darkMode ? 'text-purple-400/80' : 'text-purple-600'
              }`}
            >
              Re-plan structure and text
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (isEditLimitReached) {
                navigate('/pricing');
                return;
              }
              onQuickRegenerateCurrent();
            }}
            disabled={isRegenerating}
            className="px-2.5 py-1 rounded-lg bg-purple-600 text-white hover:bg-purple-500 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-3 h-3 ${isRegenerating ? 'animate-spin' : ''}`} />
            <span>Regen</span>
            {isEditLimitReached && (
              <span className="ml-1 px-1 py-0.2 rounded text-[9px] font-bold bg-amber-500/30 text-amber-300">PRO</span>
            )}
          </button>
        </div>

        {/* Success feedback */}
        {lastSummary && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
              darkMode
                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
            <p className="leading-relaxed">{lastSummary}</p>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div
            className={`p-3 rounded-xl border text-xs ${
              darkMode
                ? 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {errorMsg}
          </div>
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className={`p-3 border-t ${
          darkMode ? 'border-[#26262a] bg-[#101012]' : 'border-slate-200 bg-slate-50/70'
        }`}
      >
        <div className="relative">
          <textarea
            rows={3}
            value={instruction}
            disabled={isEditLimitReached || isLoading}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder={
              isEditLimitReached
                ? "🔒 AI editing limit reached (5/5). Upgrade to Pro for unlimited edits."
                : "Ask NetRoot AI Assistant to update this slide..."
            }
            className={`w-full border rounded-xl p-3 text-xs outline-none resize-none transition ${
              isEditLimitReached
                ? 'opacity-60 cursor-not-allowed bg-black/40 text-slate-400 border-amber-500/20'
                : darkMode
                ? 'bg-[#18181b] border-[#2b2b30] text-white placeholder-slate-500 focus:border-purple-500'
                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-purple-500'
            }`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          {isEditLimitReached ? (
            <button
              type="button"
              onClick={() => navigate('/pricing')}
              className="w-full mt-2 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-md shadow-purple-600/30 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>⚡ Upgrade to Pro for Unlimited AI Edits</span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={!instruction.trim() || isLoading}
              className="absolute bottom-2.5 right-2.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow-md shadow-purple-600/30 cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>Apply</span>
            </button>
          )}
        </div>
      </form>
    </aside>
  );
}
