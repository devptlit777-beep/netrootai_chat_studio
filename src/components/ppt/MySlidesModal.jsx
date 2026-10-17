import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  FolderKanban,
  X,
  Search,
  Plus,
  Trash2,
  Copy,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { getActiveDeckStorageKey, getSavedSlidesStorageKey, clearLegacyGlobalPptStorage } from './pptConstants';

export default function MySlidesModal({
  isOpen = false,
  onClose,
  onSelectDeck,
  onNewDeck,
  currentDeckId = null,
}) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const darkMode = theme === 'dark';

  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadUserDecks();
    }
  }, [isOpen, user]);

  const loadUserDecks = async () => {
    setLoading(true);
    setActionError('');
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
      console.warn('[MySlidesModal] Supabase notice:', err);
    }

    try {
      clearLegacyGlobalPptStorage();
      const activeKey = getActiveDeckStorageKey(user?.id);
      const savedKey = getSavedSlidesStorageKey(user?.id);

      const local = user?.id ? [] : JSON.parse(localStorage.getItem(savedKey) || '[]');
      let activeDeck = null;
      try {
        const act = JSON.parse(localStorage.getItem(activeKey) || '{}');
        if (act.id && Array.isArray(act.slides) && act.slides.length > 0) {
          activeDeck = {
            id: act.id,
            title: act.deckTitle || 'Untitled Presentation',
            slides: act.slides,
            theme: act.currentTheme || 'midnight',
            seed_color: act.currentSeed || '#0EA5E9',
            updated_at: act.updated_at || new Date().toISOString(),
          };
        }
      } catch {}

      const combinedMap = new Map();
      cloudDecks.forEach((d) => d.id && combinedMap.set(d.id, d));
      local.forEach((d) => d.id && !combinedMap.has(d.id) && combinedMap.set(d.id, d));
      if (activeDeck && !combinedMap.has(activeDeck.id)) {
        combinedMap.set(activeDeck.id, activeDeck);
      }

      setDecks(Array.from(combinedMap.values()));
    } catch {
      setDecks(cloudDecks || []);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, deckId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this presentation?')) return;

    try {
      if (user?.id) {
        const { error } = await supabase
          .from('user_decks')
          .delete()
          .eq('id', deckId)
          .eq('user_id', user.id);

        if (error) throw error;
      }

      // Also clean local
      setDecks((prev) => {
        const updated = prev.filter((d) => d.id !== deckId);
        const savedKey = getSavedSlidesStorageKey(user?.id);
        localStorage.setItem(savedKey, JSON.stringify(updated));
        return updated;
      });

      setActionSuccess('Presentation deleted successfully');
      setTimeout(() => setActionSuccess(''), 2500);
    } catch (err) {
      setActionError(err.message || 'Failed to delete presentation');
      setTimeout(() => setActionError(''), 3000);
    }
  };

  const handleDuplicate = async (e, deck) => {
    e.stopPropagation();
    try {
      const duplicateData = {
        title: `${deck.title || 'Presentation'} (Copy)`,
        slides: deck.slides || [],
        theme: deck.theme || 'midnight',
        seed_color: deck.seed_color || '#0EA5E9',
        user_id: user?.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (user?.id) {
        const { data, error } = await supabase
          .from('user_decks')
          .insert(duplicateData)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setDecks((prev) => [data, ...prev]);
        }
      } else {
        const newLocal = { ...duplicateData, id: 'local_' + Date.now() };
        setDecks((prev) => {
          const updated = [newLocal, ...prev];
          const savedKey = getSavedSlidesStorageKey(user?.id);
          localStorage.setItem(savedKey, JSON.stringify(updated));
          return updated;
        });
      }

      setActionSuccess('Presentation duplicated!');
      setTimeout(() => setActionSuccess(''), 2500);
    } catch (err) {
      setActionError(err.message || 'Failed to duplicate presentation');
      setTimeout(() => setActionError(''), 3000);
    }
  };

  const filteredDecks = decks.filter((deck) =>
    (deck.title || 'Untitled').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (isoStr) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none animate-in fade-in duration-150">
      <div
        className={`w-full max-w-4xl max-h-[85vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden transition-all ${
          darkMode
            ? 'bg-[#141416] border-[#26262a] text-slate-100'
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`p-5 border-b flex items-center justify-between gap-4 ${
            darkMode ? 'border-[#26262a] bg-[#18181b]' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>My Slides</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-mono font-normal ${
                    darkMode ? 'bg-white/10 text-slate-300' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {decks.length}
                </span>
              </h2>
              <p
                className={`text-xs ${
                  darkMode ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Access and manage your cloud-saved presentations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                onClose();
                onNewDeck();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs transition shadow-sm cursor-pointer"
              title="Create New Presentation (Open Hub)"
            >
              <Plus className="w-4 h-4" />
              <span>New Presentation</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition cursor-pointer ${
                darkMode
                  ? 'text-slate-400 hover:text-white hover:bg-white/5'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Feedback Banner */}
        <div
          className={`px-5 py-3 border-b flex items-center justify-between gap-3 ${
            darkMode ? 'border-[#26262a] bg-[#121214]' : 'border-slate-200 bg-white'
          }`}
        >
          <div className="relative flex-1 max-w-sm">
            <Search
              className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${
                darkMode ? 'text-slate-500' : 'text-slate-400'
              }`}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search presentations by title..."
              className={`w-full pl-9 pr-3 py-1.5 rounded-lg text-xs border outline-none transition ${
                darkMode
                  ? 'bg-[#18181b] border-[#2b2b30] text-white focus:border-sky-500'
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-sky-500'
              }`}
            />
          </div>

          {actionSuccess && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {actionError && (
            <div className="flex items-center gap-1.5 text-xs text-rose-500 font-medium animate-in fade-in">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{actionError}</span>
            </div>
          )}
        </div>

        {/* Presentations Grid Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="h-48 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-sky-500" />
              <span className="text-xs">Loading your saved slides...</span>
            </div>
          ) : filteredDecks.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                  darkMode ? 'bg-white/5 text-slate-500' : 'bg-slate-100 text-slate-400'
                }`}
              >
                <Layers className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">
                  {searchQuery ? 'No matching presentations' : 'No saved presentations yet'}
                </h3>
                <p
                  className={`text-xs mt-1 max-w-sm ${
                    darkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  {searchQuery
                    ? 'Try searching with a different keyword.'
                    : 'Create your first presentation with AI or blank slides to start building your cloud library.'}
                </p>
              </div>
              {!searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNewDeck();
                  }}
                  className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-sky-500/20"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Create First Slides</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredDecks.map((deck) => {
                const isActive = deck.id === currentDeckId;
                const slideCount = Array.isArray(deck.slides) ? deck.slides.length : 0;
                const seedColor = deck.seed_color || '#0EA5E9';

                return (
                  <div
                    key={deck.id}
                    onClick={() => {
                      onSelectDeck(deck);
                      onClose();
                    }}
                    className={`group relative rounded-xl border p-4 flex flex-col justify-between transition-all duration-150 cursor-pointer ${
                      isActive
                        ? darkMode
                          ? 'border-sky-500 bg-sky-500/10 shadow-lg shadow-sky-500/10 ring-1 ring-sky-500'
                          : 'border-sky-500 bg-sky-50 shadow-md ring-1 ring-sky-500'
                        : darkMode
                        ? 'border-[#26262a] bg-[#18181b] hover:border-slate-600 hover:bg-[#202025]'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                    }`}
                  >
                    <div>
                      {/* Top Header: Badge + Actions */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                            style={{ backgroundColor: seedColor }}
                          />
                          <span
                            className={`text-[11px] font-mono font-semibold ${
                              darkMode ? 'text-slate-400' : 'text-slate-500'
                            }`}
                          >
                            {slideCount} {slideCount === 1 ? 'Slide' : 'Slides'}
                          </span>
                          {isActive && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-sky-500 text-white">
                              Active
                            </span>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition">
                          <button
                            type="button"
                            onClick={(e) => handleDuplicate(e, deck)}
                            className={`p-1 rounded transition cursor-pointer ${
                              darkMode
                                ? 'text-slate-400 hover:text-sky-300 hover:bg-white/5'
                                : 'text-slate-500 hover:text-sky-600 hover:bg-slate-100'
                            }`}
                            title="Duplicate presentation"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDelete(e, deck.id)}
                            className={`p-1 rounded transition cursor-pointer ${
                              darkMode
                                ? 'text-slate-400 hover:text-rose-400 hover:bg-white/5'
                                : 'text-slate-500 hover:text-rose-600 hover:bg-slate-100'
                            }`}
                            title="Delete presentation"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Presentation Title */}
                      <h4
                        className={`text-sm font-semibold line-clamp-2 leading-snug mb-3 group-hover:text-sky-500 transition ${
                          darkMode ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {deck.title || 'Untitled Presentation'}
                      </h4>
                    </div>

                    {/* Footer: Date + Open arrow */}
                    <div
                      className={`pt-2.5 border-t flex items-center justify-between text-[11px] ${
                        darkMode
                          ? 'border-white/5 text-slate-500'
                          : 'border-slate-100 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(deck.updated_at || deck.created_at)}</span>
                      </div>

                      <div className="flex items-center gap-1 text-sky-500 font-semibold group-hover:translate-x-0.5 transition-transform">
                        <span>Open</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
