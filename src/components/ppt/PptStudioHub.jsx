import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { usePlan } from '../../contexts/PlanContext';
import { useTheme } from '../../contexts/ThemeContext';
import { THEME_OPTIONS, PPT_API_BASE } from './pptConstants';
import {
  Sparkles,
  ArrowRight,
  Plus,
  Layers,
  Clock,
  Trash2,
  Search,
  FolderKanban,
  FilePlus,
  Play,
  Loader2,
  Layout,
  Sun,
  Moon,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  Check,
} from 'lucide-react';


export default function PptStudioHub({
  onGenerateDeck,
  onStartBlankDeck,
  onSelectDeck,
  onResumeActiveDeck,
  onDeleteDeck,
  activeDeckTitle = '',
  activeSlidesCount = 0,
  isGeneratingDeck = false,
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { plan, lifetimePptCount = 0, featureAccess } = usePlan();
  const { theme, toggleTheme } = useTheme();
  const darkMode = theme === 'dark';

  const isPro = plan === 'pro' || plan === 'enterprise' || Boolean(featureAccess?.['ppt-studio']);
  const maxFreePpt = 2;
  const isFreeLimitReached = !isPro && lifetimePptCount >= maxFreePpt;

  const [prompt, setPrompt] = useState('');
  const [numSlides, setNumSlides] = useState(5);
  const [selectedTheme, setSelectedTheme] = useState('auto');
  const [savedDecks, setSavedDecks] = useState([]);
  const [loadingDecks, setLoadingDecks] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Inline Outline Planning states (No duplicate popup modals!)
  const [isPlanningOutline, setIsPlanningOutline] = useState(false);
  const [inlineOutline, setInlineOutline] = useState(null);
  const [outlineError, setOutlineError] = useState('');

  // Load user presentations from Supabase and LocalStorage (seamlessly merged)
  const loadSavedDecks = async () => {
    setLoadingDecks(true);
    let cloudDecks = [];
    try {
      if (user?.id) {
        const { data, error } = await supabase
          .from('user_decks')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          cloudDecks = data;
        }
      }
    } catch (err) {
      console.warn('[PptStudioHub] Supabase decks notice:', err);
    }

    try {
      const local = JSON.parse(localStorage.getItem('netroot_saved_slides') || '[]');
      let activeDeck = null;
      try {
        const act = JSON.parse(localStorage.getItem('netroot_active_working_deck') || '{}');
        if (act.id && Array.isArray(act.slides) && act.slides.length > 0) {
          activeDeck = {
            id: act.id,
            title: act.deckTitle || 'Untitled Presentation',
            slides: act.slides,
            theme: act.currentTheme || 'midnight',
            seed_color: act.currentSeed || '#0EA5E9',
            updated_at: new Date().toISOString(),
          };
        }
      } catch {}

      const combinedMap = new Map();
      cloudDecks.forEach((d) => d.id && combinedMap.set(d.id, d));
      local.forEach((d) => d.id && !combinedMap.has(d.id) && combinedMap.set(d.id, d));
      if (activeDeck && !combinedMap.has(activeDeck.id)) {
        combinedMap.set(activeDeck.id, activeDeck);
      }

      setSavedDecks(Array.from(combinedMap.values()));
    } catch (e) {
      setSavedDecks(cloudDecks || []);
    } finally {
      setLoadingDecks(false);
    }
  };

  useEffect(() => {
    loadSavedDecks();
  }, [user?.id]);


  // Direct generation or outline-aware submit
  const handleDirectGenerateSubmit = (e) => {
    e?.preventDefault();
    if (isFreeLimitReached) {
      navigate('/pricing');
      return;
    }
    if (isGeneratingDeck) return;

    if (inlineOutline && inlineOutline.length > 0) {
      handleGenerateFromOutline();
      return;
    }

    if (!prompt.trim()) return;
    onGenerateDeck({
      prompt: prompt.trim(),
      numSlides,
      theme: selectedTheme === 'auto' ? null : selectedTheme,
      outline: null,
    });
  };

  // Inline Outline Planning (Directly inside Hub, avoiding the popup box!)
  const handlePlanOutlineInline = async () => {
    if (isFreeLimitReached) {
      navigate('/pricing');
      return;
    }
    if (!prompt.trim() || isPlanningOutline || isGeneratingDeck) return;
    setIsPlanningOutline(true);
    setOutlineError('');

    try {
      const res = await fetch(`${PPT_API_BASE}/api/generate-outline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || '',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          num_slides: numSlides,
          userEmail: user?.email || '',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to plan presentation outline');
      }

      const data = await res.json();
      const rawOutline = data.slides || data.outline || [];
      const normalized = rawOutline.map((item, idx) => {
        if (typeof item === 'string') {
          return { title: item, subtopics: [] };
        }
        return {
          title: item.title || item.t || `Slide ${idx + 1}`,
          suggested_layout: item.suggested_layout || item.layout_hint || 'title_content',
          subtopics: Array.isArray(item.subtopics) ? item.subtopics : [],
        };
      });

      setInlineOutline(normalized);
    } catch (err) {
      setOutlineError(err.message || 'Error generating outline. Please try again.');
    } finally {
      setIsPlanningOutline(false);
    }
  };

  const handleUpdateOutlineTitle = (idx, newTitle) => {
    if (!inlineOutline) return;
    const next = [...inlineOutline];
    next[idx] = { ...next[idx], title: newTitle };
    setInlineOutline(next);
  };

  const handleRemoveOutlineSlide = (idx) => {
    if (!inlineOutline || inlineOutline.length <= 1) return;
    setInlineOutline(inlineOutline.filter((_, i) => i !== idx));
  };

  const handleAddOutlineSlide = () => {
    if (!inlineOutline) return;
    setInlineOutline([
      ...inlineOutline,
      {
        title: `Strategic Execution Topic #${inlineOutline.length + 1}`,
        subtopics: ['Key driver analysis', 'Target deliverables'],
      },
    ]);
  };

  const handleGenerateFromOutline = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!inlineOutline || isGeneratingDeck) return;
    const finalPrompt = prompt.trim() || inlineOutline[0]?.title || 'Professional Presentation';
    onGenerateDeck({
      prompt: finalPrompt,
      numSlides: inlineOutline.length,
      theme: selectedTheme === 'auto' ? null : selectedTheme,
      outline: inlineOutline,
    });
  };

  // Delete Deck with in-card confirmation and ghost-save prevention
  const handleConfirmDelete = async (deckId) => {
    setDeletingId(deckId);
    setConfirmDeleteId(null);

    try {
      if (user?.id && !String(deckId).startsWith('local_')) {
        await supabase.from('user_decks').delete().eq('id', deckId).eq('user_id', user.id);
      }
    } catch (err) {
      console.warn('Supabase delete notice:', err);
    }

    const updated = savedDecks.filter((d) => d.id !== deckId);
    setSavedDecks(updated);
    try {
      localStorage.setItem('netroot_saved_slides', JSON.stringify(updated));
    } catch {}

    if (onDeleteDeck) {
      onDeleteDeck(deckId);
    }
    setDeletingId(null);
  };

  const filteredDecks = savedDecks.filter((d) =>
    (d.title || 'Untitled Presentation').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        darkMode ? 'bg-[#0d0d10] text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Hub Top Bar */}
      <header
        className={`sticky top-0 z-30 px-6 py-3.5 border-b backdrop-blur-xl flex items-center justify-between ${
          darkMode
            ? 'bg-[#121215]/85 border-[#222226]'
            : 'bg-white/85 border-slate-200/90 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <Layout className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono tracking-wider text-sky-500 uppercase">
                NetRoot AI PPT Studio
              </span>
              <span className={`text-xs ${darkMode ? 'text-slate-600' : 'text-slate-300'}`}>/</span>
              <span className="text-xs font-semibold text-slate-400">Workspace Hub</span>
            </div>
            <h1 className="text-sm font-bold tracking-tight">Presentation Dashboard</h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Resume Active Session Button (if user has active slides) */}
          {activeSlidesCount > 0 && (
            <button
              type="button"
              onClick={() => {
                if (isFreeLimitReached) {
                  navigate('/pricing');
                  return;
                }
                onResumeActiveDeck();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border cursor-pointer ${
                isFreeLimitReached
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                  : darkMode
                  ? 'bg-sky-500/10 border-sky-500/30 text-sky-400 hover:bg-sky-500/20'
                  : 'bg-sky-50 border-sky-200 text-sky-600 hover:bg-sky-100'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Resume Active Deck ({activeSlidesCount} {activeSlidesCount === 1 ? 'slide' : 'slides'})</span>
              {isFreeLimitReached && (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400">PRO 🔒</span>
              )}
            </button>
          )}

          {/* Blank Deck Quick Action */}
          <button
            type="button"
            onClick={() => {
              if (isFreeLimitReached) {
                navigate('/pricing');
                return;
              }
              onStartBlankDeck();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border cursor-pointer ${
              darkMode
                ? 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
                : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <FilePlus className="w-3.5 h-3.5" />
            <span>Blank Deck</span>
            {isFreeLimitReached && (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400">PRO</span>
            )}
          </button>

          {/* Theme Switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`p-1.5 rounded-xl border transition cursor-pointer ${
              darkMode
                ? 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
            title="Toggle Light / Dark mode"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Hub Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12">
        {/* Hero: Gamma-style AI Prompt Card */}
        <section className="relative">
          {/* Subtle Glow Backdrop */}
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-3/4 h-52 bg-gradient-to-r from-sky-500/15 via-indigo-500/15 to-purple-500/15 blur-3xl pointer-events-none rounded-full" />

          <div className="relative text-center max-w-2xl mx-auto mb-8 space-y-2">
            <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Gen AI Presentation Engine</span>
              </div>
              {!isPro && (
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                    isFreeLimitReached
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  <span>Free Lifetime Decks: <strong>{lifetimePptCount} / {maxFreePpt}</strong></span>
                  {isFreeLimitReached && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">
                      Limit Reached
                    </span>
                  )}
                </div>
              )}
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-balance">
              What do you want to present today?
            </h2>
            <p className={`text-xs sm:text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Type your topic or project idea. NetRoot AI will architect structured, visually compelling slides in seconds.
            </p>
          </div>

          {/* Main Glowing AI Generation Card */}
          <div
            className={`relative rounded-2xl p-5 sm:p-6 border shadow-2xl backdrop-blur-xl transition-all duration-200 ${
              darkMode
                ? 'bg-[#151518]/90 border-white/10 shadow-black/60 ring-1 ring-white/5'
                : 'bg-white/95 border-slate-200 shadow-xl shadow-slate-200/50'
            }`}
          >
            <form onSubmit={handleDirectGenerateSubmit} className="space-y-4">
              {/* Textarea for Topic */}
              <div className="relative">
                <textarea
                  rows={3}
                  value={prompt}
                  disabled={isFreeLimitReached || isGeneratingDeck}
                  onChange={(e) => {
                    setPrompt(e.target.value);
                    if (inlineOutline) setInlineOutline(null);
                  }}
                  placeholder={
                    isFreeLimitReached
                      ? "🔒 Free lifetime limit reached (3/3). Upgrade to Pro to create more presentations."
                      : "e.g. Series A investor pitch deck for an autonomous enterprise AI platform covering problem, market size, product demo, unit economics, and roadmap..."
                  }
                  className={`w-full p-4 rounded-xl text-sm sm:text-base font-medium outline-none transition border resize-none leading-relaxed ${
                    isFreeLimitReached
                      ? 'opacity-60 cursor-not-allowed bg-black/40 text-slate-400 border-amber-500/20'
                      : darkMode
                      ? 'bg-[#0f0f12] text-white border-white/10 focus:border-sky-500/80 placeholder:text-slate-600'
                      : 'bg-slate-50 text-slate-900 border-slate-200 focus:border-sky-500 placeholder:text-slate-400'
                  }`}
                />
              </div>


              {/* Control Options & Primary Action Bar */}
              <div
                className={`pt-3 border-t flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 ${
                  darkMode ? 'border-white/10' : 'border-slate-100'
                }`}
              >
                <div className={`flex flex-wrap items-center gap-4 ${isFreeLimitReached ? 'opacity-40 pointer-events-none' : ''}`}>
                  {/* Slide Count Selector: 1 to 10 Drawer/Rail */}
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono font-bold shrink-0 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      Slides ({numSlides}):
                    </span>
                    <div className="flex items-center gap-1 overflow-x-auto max-w-[270px] sm:max-w-[340px] p-1 rounded-xl border bg-black/20 border-white/10 scrollbar-none">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => {
                            setNumSlides(num);
                            if (inlineOutline) setInlineOutline(null);
                          }}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition flex items-center justify-center shrink-0 cursor-pointer ${
                            numSlides === num
                              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30 ring-1 ring-sky-400'
                              : darkMode
                              ? 'text-slate-400 hover:text-white hover:bg-white/5'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Theme Selector */}
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-mono font-bold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      Theme:
                    </span>
                    <select
                      value={selectedTheme}
                      onChange={(e) => setSelectedTheme(e.target.value)}
                      className={`text-xs rounded-xl px-2.5 py-1.5 font-medium border outline-none cursor-pointer ${
                        darkMode
                          ? 'bg-[#1b1b1f] border-white/10 text-slate-200'
                          : 'bg-slate-100 border-slate-200 text-slate-800'
                      }`}
                    >
                      {THEME_OPTIONS.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.icon} {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Primary Actions (Suggestion B) */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {isFreeLimitReached ? (
                    <button
                      type="button"
                      onClick={() => navigate('/pricing')}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-sky-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-amber-200" />
                      <span>⚡ Upgrade to Pro to Generate Unlimited PPTs</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handlePlanOutlineInline}
                        disabled={!prompt.trim() || isPlanningOutline || isGeneratingDeck}
                        className={`px-4 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-40 cursor-pointer ${
                          darkMode
                            ? 'border-white/15 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
                            : 'border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        {isPlanningOutline ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
                        ) : (
                          <Layers className="w-3.5 h-3.5 text-sky-400" />
                        )}
                        <span>{isPlanningOutline ? 'Planning Agenda...' : 'Plan Outline'}</span>
                      </button>

                      <button
                        type="submit"
                        disabled={!prompt.trim() || isGeneratingDeck || isPlanningOutline}
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-sky-500/25 transition disabled:opacity-40 cursor-pointer"
                      >
                        {isGeneratingDeck ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Generating Deck...</span>
                          </>
                        ) : (
                          <>
                            <span>Generate Presentation</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Inline Agenda Breakdown (Directly inside Hub, ZERO annoying popup modals!) */}
              {inlineOutline && (
                <div
                  className={`mt-4 pt-4 border-t space-y-3 animate-in fade-in slide-in-from-top-2 duration-200 ${
                    darkMode ? 'border-white/10' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                      <span className="text-xs font-bold font-mono uppercase tracking-wider text-sky-400">
                        Agenda Breakdown ({inlineOutline.length} Slides Planned)
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleAddOutlineSlide}
                        className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Slide</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setInlineOutline(null)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                          darkMode
                            ? 'border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
                            : 'border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        Collapse
                      </button>
                    </div>
                  </div>

                  {outlineError && (
                    <p className="text-xs text-rose-400">{outlineError}</p>
                  )}

                  {/* Outline Cards List */}
                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {inlineOutline.map((slideItem, idx) => (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl border flex items-start gap-3 group transition ${
                          darkMode
                            ? 'bg-[#18181c] border-white/10 hover:border-sky-500/40'
                            : 'bg-slate-50 border-slate-200 hover:border-sky-400'
                        }`}
                      >
                        <span className="w-6 h-6 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5">
                          {idx + 1}
                        </span>

                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={slideItem.title}
                            onChange={(e) => handleUpdateOutlineTitle(idx, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                e.currentTarget.blur();
                              }
                            }}
                            className={`w-full bg-transparent border-b text-xs sm:text-sm font-semibold outline-none pb-0.5 transition ${
                              darkMode
                                ? 'text-white border-transparent focus:border-sky-500'
                                : 'text-slate-900 border-transparent focus:border-sky-500'
                            }`}
                          />
                          {slideItem.subtopics && slideItem.subtopics.length > 0 && (
                            <p className={`text-[11px] mt-1 leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                              • {slideItem.subtopics.join('  •  ')}
                            </p>
                          )}
                        </div>

                        {inlineOutline.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOutlineSlide(idx)}
                            className="opacity-60 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-1 rounded transition shrink-0 cursor-pointer"
                            title="Remove slide from agenda"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Generate from Outline Button */}
                  <div className="pt-2 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={handleGenerateFromOutline}
                      disabled={isGeneratingDeck}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-sky-500/25 transition disabled:opacity-40 cursor-pointer"
                    >
                      {isGeneratingDeck ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Generating Presentation...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Generate Presentation ({inlineOutline.length} Slides)</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </section>

        {/* Quick Bento Options */}
        <section className={`grid gap-4 ${activeSlidesCount > 0 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
          <div
            onClick={() => {
              if (isFreeLimitReached) {
                navigate('/pricing');
                return;
              }
              onStartBlankDeck();
            }}
            className={`p-5 rounded-2xl border transition-all duration-200 flex items-start gap-4 cursor-pointer group ${
              darkMode
                ? 'bg-[#151518]/70 border-white/10 hover:border-sky-500/50 hover:bg-[#1a1a20]'
                : 'bg-white border-slate-200 hover:border-sky-400 hover:shadow-md'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Plus className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold flex items-center gap-1.5">
                  <span>Blank Presentation</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </h3>
                {isFreeLimitReached && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    PRO 🔒
                  </span>
                )}
              </div>
              <p className={`text-xs mt-1 leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {isFreeLimitReached
                  ? 'Free presentation limit reached (2/2). Upgrade to Pro to create blank or AI presentations.'
                  : 'Start fresh with an empty canvas. Add custom bullet points and write content freely.'}
              </p>
            </div>
          </div>

          {activeSlidesCount > 0 && (
            <div
              onClick={() => {
                if (isFreeLimitReached) {
                  navigate('/pricing');
                  return;
                }
                onResumeActiveDeck();
              }}
              className={`p-5 rounded-2xl border transition-all duration-200 flex items-start gap-4 cursor-pointer group ${
                isFreeLimitReached
                  ? 'bg-amber-500/5 border-amber-500/30 hover:border-amber-500/50'
                  : darkMode
                  ? 'bg-[#151518]/70 border-white/10 hover:border-purple-500/50 hover:bg-[#1a1a20]'
                  : 'bg-white border-slate-200 hover:border-purple-400 hover:shadow-md'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${
                isFreeLimitReached
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  : 'bg-purple-500/10 border-purple-500/20 text-purple-400'
              }`}>
                <Play className="w-5 h-5 fill-current" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold flex items-center gap-1.5">
                    <span>Resume Active Session</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </h3>
                  {isFreeLimitReached && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      PRO 🔒
                    </span>
                  )}
                </div>
                <p className={`text-xs mt-1 leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  {isFreeLimitReached
                    ? 'Free presentation limit reached (2/2). Upgrade to Pro to resume editing your presentation.'
                    : `Continue working on "${activeDeckTitle || 'Untitled Presentation'}" (${activeSlidesCount} ${activeSlidesCount === 1 ? 'slide' : 'slides'} ready in editor).`}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* My Slides / Saved Presentations Section */}
        <section className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/10">
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-sky-400" />
                <span>My Slides ({savedDecks.length})</span>
              </h2>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Cloud & local presentations saved to your NetRoot account.
              </p>
            </div>

            {/* Search filter */}
            {savedDecks.length > 0 && (
              <div className="relative w-full sm:w-64">
                <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search presentations..."
                  className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border outline-none ${
                    darkMode
                      ? 'bg-[#151518] border-white/10 text-white placeholder:text-slate-600 focus:border-sky-500'
                      : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-sky-500'
                  }`}
                />
              </div>
            )}
          </div>

          {/* Decks Grid */}
          {loadingDecks ? (
            <div className="flex items-center justify-center py-16 gap-2 text-xs text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-sky-500" />
              <span>Loading saved presentations...</span>
            </div>
          ) : filteredDecks.length === 0 ? (
            <div
              className={`p-10 rounded-2xl border text-center space-y-3 ${
                darkMode ? 'bg-[#131316] border-white/5' : 'bg-white border-slate-200'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center mx-auto">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold">No presentations found</h3>
              <p className={`text-xs max-w-sm mx-auto ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {searchQuery
                  ? 'No presentation titles match your search criteria.'
                  : 'You have not created any saved decks yet. Enter a topic in the AI box above to create your first presentation!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDecks.map((deck) => {
                const count = Array.isArray(deck.slides) ? deck.slides.length : 1;
                const updatedTime = deck.updated_at
                  ? new Date(deck.updated_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Recently';

                return (
                  <div
                    key={deck.id}
                    onClick={() => onSelectDeck(deck)}
                    className={`group relative p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between cursor-pointer ${
                      darkMode
                        ? 'bg-[#151518]/80 border-white/10 hover:border-sky-500/60 hover:bg-[#1a1a20] hover:shadow-lg hover:shadow-black/50'
                        : 'bg-white border-slate-200 hover:border-sky-400 hover:shadow-md'
                    }`}
                  >
                    <div>
                      {/* Top Badges & Delete Button */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20">
                          {count} {count === 1 ? 'Slide' : 'Slides'}
                        </span>
                        <div className="flex items-center gap-1">
                          {confirmDeleteId === deck.id ? (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1.5 bg-rose-500/15 border border-rose-500/30 rounded-lg px-2 py-0.5 animate-in fade-in duration-150"
                            >
                              <span className="text-[10px] text-rose-400 font-bold">Delete?</span>
                              <button
                                type="button"
                                onClick={() => handleConfirmDelete(deck.id)}
                                className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold cursor-pointer transition shadow-sm"
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-slate-300 text-[10px] cursor-pointer transition"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(deck.id);
                              }}
                              disabled={deletingId === deck.id}
                              className={`p-1.5 rounded-lg transition opacity-60 group-hover:opacity-100 cursor-pointer ${
                                darkMode
                                  ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
                                  : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              }`}
                              title="Delete presentation"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Deck Title */}
                      <h4 className="text-sm font-bold line-clamp-2 group-hover:text-sky-400 transition-colors">
                        {deck.title || 'Untitled Presentation'}
                      </h4>

                      {/* Preview first slide topic or layout */}
                      {deck.slides?.[0]?.t && (
                        <p className={`text-xs mt-1 line-clamp-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          Cover: {deck.slides[0].t}
                        </p>
                      )}
                    </div>

                    {/* Bottom Metadata */}
                    <div
                      className={`mt-4 pt-3 border-t flex items-center justify-between text-[11px] font-mono ${
                        darkMode ? 'border-white/5 text-slate-500' : 'border-slate-100 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{updatedTime}</span>
                      </div>
                      <span className="text-sky-500 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        Open Studio →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
