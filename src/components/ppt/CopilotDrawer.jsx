import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import {
  Bot,
  X,
  Send,
  Loader2,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

export default function CopilotDrawer({
  isOpen = false,
  onClose,
  activeSlide,
  slideIndex = 0,
  deckTopic = '',
  onApplySlideUpdate,
  onQuickRegenerateCurrent,
  isRegenerating = false,
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const darkMode = theme === 'dark';

  const [instruction, setInstruction] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastSummary, setLastSummary] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!instruction.trim() || isLoading || !activeSlide) return;

    setIsLoading(true);
    setErrorMsg('');
    setLastSummary(null);

    try {
      const PPT_API_BASE = import.meta.env.VITE_PPT_API_URL || 'http://127.0.0.1:8001';
      const res = await fetch(`${PPT_API_BASE}/api/copilot-edit-slide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slide: activeSlide,
          instruction: instruction.trim(),
          deck_topic: deckTopic || activeSlide.t || '',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to edit slide with Slide AI');
      }

      const data = await res.json();
      if (data.slide) {
        onApplySlideUpdate(data.slide);
        setLastSummary(data.summary || 'Slide updated successfully!');
        setInstruction('');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error executing Slide AI instruction');
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
              Slide AI
            </h2>
            <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {t('ppt.assistant', { index: slideIndex + 1 })}
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
          title={t('ppt.closeSlideAI')}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Quick Slide Regenerate */}
        <div
          className={`p-3 rounded-xl border flex items-center justify-between ${
            darkMode
              ? 'bg-purple-950/20 border-purple-500/20 text-purple-200'
              : 'bg-purple-50 border-purple-200 text-purple-900'
          }`}
        >
          <div>
            <span className="text-xs font-semibold block">{t('ppt.redoSlideContent')}</span>
            <span
              className={`text-[11px] ${
                darkMode ? 'text-purple-400/80' : 'text-purple-600'
              }`}
            >
              {t('ppt.replanStructure')}
            </span>
          </div>
          <button
            type="button"
            onClick={onQuickRegenerateCurrent}
            disabled={isRegenerating}
            className="px-2.5 py-1 rounded-lg bg-purple-600 text-white hover:bg-purple-500 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-3 h-3 ${isRegenerating ? 'animate-spin' : ''}`} />
            <span>{t('ppt.regenerate')}</span>
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
            onChange={(e) => setInstruction(e.target.value)}
            placeholder={t('ppt.slideCommand')}
            className={`w-full border focus:border-purple-500 rounded-xl p-3 text-xs outline-none resize-none transition ${
              darkMode
                ? 'bg-[#18181b] border-[#2b2b30] text-white placeholder-slate-500'
                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white'
            }`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
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
            <span>{t('ppt.apply')}</span>
          </button>
        </div>
      </form>
    </aside>
  );
}
