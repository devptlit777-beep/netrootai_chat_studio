import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { usePlan } from '../contexts/PlanContext';
import { supabase } from '../lib/supabase';
import PptTopBar from '../components/ppt/PptTopBar';
import FloatingSlidesIsland from '../components/ppt/FloatingSlidesIsland';
import SlideCanvas from '../components/ppt/SlideCanvas';
import CopilotDrawer from '../components/ppt/CopilotDrawer';
import MySlidesModal from '../components/ppt/MySlidesModal';
import PresentOverlay from '../components/ppt/PresentOverlay';
import UnsplashModal from '../components/ppt/UnsplashModal';
import RestyleModal from '../components/ppt/RestyleModal';
import PptStudioHub from '../components/ppt/PptStudioHub';
import {
  createBlankSlide,
  stripMarkdown,
  THEME_SEEDS,
  PPT_API_BASE,
  getActiveDeckStorageKey,
  getSavedSlidesStorageKey,
  clearLegacyGlobalPptStorage,
} from '../components/ppt/pptConstants';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Plus,
  Maximize2,
  AlertCircle,
  CheckCircle2,
  Layers,
} from 'lucide-react';

function cleanPromptTitle(rawPrompt) {
  if (!rawPrompt) return '';
  return rawPrompt
    .replace(/^(create|make|generate|build|design|give me|produce)\s+(a|an|the)?\s*(presentation|pitch deck|deck|slides|slide deck|ppt|powerpoint)?\s*(on|about|for)?\s*/i, '')
    .trim()
    .slice(0, 60)
    .replace(/^./, (c) => c.toUpperCase());
}

const INITIAL_DECK = [
  {
    l: 'hero',
    t: 'NetRoot AI: Autonomous Agent Workflow & Enterprise Scale',
    c: [
      'Next-generation orchestration delivering multi-agent intelligence and low-latency execution.',
      'NetRoot AI • Strategic Briefing 2026',
    ],
    theme: 'midnight',
    theme_mode: 'dark',
    seed_color: '#0EA5E9',
  },
  {
    l: 'stats',
    t: 'Enterprise Performance Benchmarks',
    c: [
      ['< 40ms', 'LPU Inference Latency', 'High-throughput agent reasoning loop with real-time state updates.'],
      ['99.98%', 'Execution Reliability', 'Fault-tolerant distributed architecture backed by state checkpoints.'],
      ['10x', 'Developer Velocity', 'Autonomous code generation, refactoring, and full CI validation.'],
      ['$2.4M', 'Annual Cost Reduction', 'Streamlined engineering operations across core product teams.'],
    ],
    theme: 'midnight',
    theme_mode: 'dark',
    seed_color: '#0EA5E9',
  },
  {
    l: 'title_content',
    t: 'Strategic Architecture & Execution Pillars',
    c: [
      'Autonomous Agent Loop: Continuous self-monitoring, tool execution, and live verification.',
      'Enterprise Guardrails: Multi-layer compliance policies and secure contextual memory storage.',
      'Native Cloud Scalability: Effortless deployment across hybrid multi-region clusters.',
    ],
    theme: 'midnight',
    theme_mode: 'dark',
    seed_color: '#0EA5E9',
  },
];

export default function PptStudioPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { plan, lifetimePptCount = 0, featureAccess, refresh: refreshPlan } = usePlan();
  const darkMode = theme === 'dark';

  const isPro = plan === 'pro' || plan === 'enterprise' || Boolean(featureAccess?.['ppt-studio']);
  const maxFreePpt = 2;
  const maxDeckAiEdits = 5;
  const isFreeLimitReached = !isPro && lifetimePptCount >= maxFreePpt;

  const activeStorageKey = getActiveDeckStorageKey(user?.id);

  const [currentDeckAiEdits, setCurrentDeckAiEdits] = useState(() => {
    try {
      const active = localStorage.getItem(activeStorageKey);
      if (active) {
        const parsed = JSON.parse(active);
        return Number(parsed.ai_edits_count || 0);
      }
    } catch {}
    return 0;
  });
  const isViewOnly = isFreeLimitReached || (!isPro && currentDeckAiEdits >= maxDeckAiEdits);

  const [hasActiveSession, setHasActiveSession] = useState(() => {
    try {
      const active = localStorage.getItem(activeStorageKey);
      if (active) {
        const parsed = JSON.parse(active);
        return Boolean(
          parsed &&
          Array.isArray(parsed.slides) &&
          parsed.slides.length > 0 &&
          (parsed.id || (parsed.deckTitle && parsed.deckTitle !== 'Untitled Presentation') || parsed.slides.some(s => s.c && s.c.some(p => typeof p === 'string' && p.trim().length > 0)))
        );
      }
    } catch {}
    return false;
  });
  const [isDirty, setIsDirty] = useState(false);

  const [slides, setSlides] = useState(() => {
    try {
      const active = localStorage.getItem(activeStorageKey);
      if (active) {
        const parsed = JSON.parse(active);
        if (Array.isArray(parsed.slides) && parsed.slides.length > 0) return parsed.slides;
      }
    } catch {}
    return INITIAL_DECK;
  });
  const [searchParams] = useSearchParams();
  const queryDeckId = searchParams.get('deckId');
  const [viewMode, setViewMode] = useState(() => (queryDeckId ? 'editor' : 'hub'));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [deckTitle, setDeckTitle] = useState(() => {
    try {
      const active = localStorage.getItem(activeStorageKey);
      if (active) {
        const parsed = JSON.parse(active);
        if (parsed.deckTitle && parsed.deckTitle !== 'NetRoot AI Enterprise Studio') {
          return parsed.deckTitle;
        }
      }
    } catch {}
    return 'Untitled Presentation';
  });
  const [currentTheme, setCurrentTheme] = useState(() => {
    try {
      const active = localStorage.getItem(activeStorageKey);
      if (active) {
        const parsed = JSON.parse(active);
        if (parsed.currentTheme) return parsed.currentTheme;
      }
    } catch {}
    return 'midnight';
  });
  const [currentSeed, setCurrentSeed] = useState(() => {
    try {
      const active = localStorage.getItem(activeStorageKey);
      if (active) {
        const parsed = JSON.parse(active);
        if (parsed.currentSeed) return parsed.currentSeed;
      }
    } catch {}
    return '#0EA5E9';
  });
  const [zoomScale, setZoomScale] = useState(1.0);

  // Cloud & Presentation Persistence state
  const [currentDeckId, setCurrentDeckId] = useState(() => {
    try {
      const active = localStorage.getItem(activeStorageKey);
      if (active) {
        const parsed = JSON.parse(active);
        if (parsed.id) return parsed.id;
      }
    } catch {}
    return null;
  });
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'error'
  const [isMySlidesModalOpen, setIsMySlidesModalOpen] = useState(false);
  const isInitialMount = useRef(true);

  // Undo / Redo history
  const [history, setHistory] = useState([INITIAL_DECK]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Studio UI states
  const [isSlidesDrawerOpen, setIsSlidesDrawerOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isPresentModeOpen, setIsPresentModeOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isRestyleModalOpen, setIsRestyleModalOpen] = useState(false);
  const [restyleTargetInfo, setRestyleTargetInfo] = useState(null);

  // Async loading indicators
  const [isGeneratingDeck, setIsGeneratingDeck] = useState(false);
  const [isRegeneratingSlide, setIsRegeneratingSlide] = useState(false);
  const [isExportingPptx, setIsExportingPptx] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Toast notification
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const pushHistory = useCallback(
    (newSlides = null) => {
      const stateToSave = newSlides || slides;
      setHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1);
        return [...sliced, JSON.parse(JSON.stringify(stateToSave))];
      });
      setHistoryIndex((prev) => prev + 1);
    },
    [slides, historyIndex]
  );

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      const targetState = JSON.parse(JSON.stringify(history[prevIdx]));
      setSlides(targetState);
      setHistoryIndex(prevIdx);
      if (currentIndex >= targetState.length) {
        setCurrentIndex(Math.max(0, targetState.length - 1));
      }
      showToast('Undone', 'info');
    }
  }, [historyIndex, history, currentIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      const targetState = JSON.parse(JSON.stringify(history[nextIdx]));
      setSlides(targetState);
      setHistoryIndex(nextIdx);
      showToast('Redone', 'info');
    }
  }, [historyIndex, history]);

  // Sync active working draft immediately to user-scoped localStorage
  useEffect(() => {
    if (!hasActiveSession || slides.length === 0) return;
    const activeKey = getActiveDeckStorageKey(user?.id);
    try {
      localStorage.setItem(
        activeKey,
        JSON.stringify({
          id: currentDeckId,
          slides,
          deckTitle,
          currentTheme,
          currentSeed,
          ai_edits_count: currentDeckAiEdits,
        })
      );
    } catch (e) {}
  }, [hasActiveSession, slides, deckTitle, currentTheme, currentSeed, currentDeckId, currentDeckAiEdits, user?.id]);

  // Restore user's isolated presentations when user logs in or switches account
  useEffect(() => {
    clearLegacyGlobalPptStorage();
    if (!user?.id) {
      setHasActiveSession(false);
      setCurrentDeckId(null);
      setSlides(INITIAL_DECK);
      setDeckTitle('Untitled Presentation');
      return;
    }

    async function restoreRecentDeck() {
      // 1. Check user-scoped active working deck
      const activeKey = getActiveDeckStorageKey(user.id);
      try {
        const active = localStorage.getItem(activeKey);
        if (active) {
          const parsed = JSON.parse(active);
          if (Array.isArray(parsed.slides) && parsed.slides.length > 0) {
            setSlides(parsed.slides);
            setDeckTitle(parsed.deckTitle || 'Untitled Presentation');
            if (parsed.currentTheme) setCurrentTheme(parsed.currentTheme);
            if (parsed.currentSeed) setCurrentSeed(parsed.currentSeed);
            setCurrentDeckId(parsed.id || null);
            setCurrentDeckAiEdits(Number(parsed.ai_edits_count || 0));
            setHasActiveSession(true);
            setHistory([parsed.slides]);
            setHistoryIndex(0);
            return;
          }
        }
      } catch {}

      // Clean session state if user has no in-progress working draft
      setHasActiveSession(false);
      setCurrentDeckId(null);
      setSlides(INITIAL_DECK);
      setDeckTitle('Untitled Presentation');
    }

    restoreRecentDeck();
  }, [user?.id]);

  // Cloud saving helper
  const saveDeckToCloud = useCallback(
    async (slidesToSave, titleToSave, themeToSave, seedToSave, deckId) => {
      if (!slidesToSave || slidesToSave.length === 0) return;
      setSaveStatus('saving');
      try {
        const payload = {
          title: titleToSave || 'Untitled Presentation',
          slides: slidesToSave,
          theme: themeToSave || 'midnight',
          seed_color: seedToSave || '#0EA5E9',
          ai_edits_count: currentDeckAiEdits,
          updated_at: new Date().toISOString(),
        };

        if (user?.id) {
          payload.user_id = user.id;
          if (deckId && !String(deckId).startsWith('local_')) {
            payload.id = deckId;
          }

          const { data, error } = await supabase
            .from('user_decks')
            .upsert(payload)
            .select()
            .single();

          if (!error && data?.id) {
            const savedCloudId = data.id;
            if (!deckId || String(deckId).startsWith('local_')) {
              setCurrentDeckId(savedCloudId);
            }
            // Clean up old local copy so it never appears as duplicate in My Slides
            const savedKey = getSavedSlidesStorageKey(user?.id);
            const activeKey = getActiveDeckStorageKey(user?.id);
            try {
              const localDecks = JSON.parse(localStorage.getItem(savedKey) || '[]');
              const filtered = localDecks.filter(
                (d) => d.id !== deckId && d.id !== savedCloudId && (d.title || '').trim().toLowerCase() !== (titleToSave || '').trim().toLowerCase()
              );
              localStorage.setItem(savedKey, JSON.stringify(filtered));
            } catch {}
            // Sync active working deck ID
            try {
              const active = JSON.parse(localStorage.getItem(activeKey) || '{}');
              if (active) {
                active.id = savedCloudId;
                localStorage.setItem(activeKey, JSON.stringify(active));
              }
            } catch {}
            setSaveStatus('saved');
            setIsDirty(false);
            return savedCloudId;
          }
        }

        // Local backup fallback for offline / guest
        const savedKey = getSavedSlidesStorageKey(user?.id);
        const localId = deckId || 'local_deck_' + Date.now();
        const localDecks = JSON.parse(localStorage.getItem(savedKey) || '[]');
        const existingIdx = localDecks.findIndex((d) => d.id === localId);
        const localItem = { ...payload, id: localId };
        if (existingIdx >= 0) {
          localDecks[existingIdx] = localItem;
        } else {
          localDecks.unshift(localItem);
        }
        localStorage.setItem(savedKey, JSON.stringify(localDecks));
        if (!deckId) setCurrentDeckId(localId);
        setSaveStatus('saved');
        setIsDirty(false);
        return localId;
      } catch (err) {
        console.warn('[PptStudioPage] Auto-save notice:', err);
        setSaveStatus('error');
      }
    },
    [user?.id, currentDeckAiEdits]
  );

  // Debounced Auto-Save on slide / title / theme changes (Only while actively in editor & modified!)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (viewMode !== 'editor') return;
    if (!isDirty) return; // Only auto-save if user actually modified the presentation!

    const timer = setTimeout(() => {
      saveDeckToCloud(slides, deckTitle, currentTheme, currentSeed, currentDeckId);
    }, 1500);
    return () => clearTimeout(timer);
  }, [slides, deckTitle, currentTheme, currentSeed, currentDeckId, saveDeckToCloud, viewMode, isDirty]);

  // Handle deck deletion from Hub or MySlides without ghost re-saves
  const handleDeleteDeckFromStorage = useCallback(
    (deckId) => {
      const activeKey = getActiveDeckStorageKey(user?.id);
      const savedKey = getSavedSlidesStorageKey(user?.id);
      if (currentDeckId === deckId || !currentDeckId) {
        setCurrentDeckId(null);
        setDeckTitle('Untitled Presentation');
        const blank = [createBlankSlide(1)];
        setSlides(blank);
        setCurrentIndex(0);
        setCurrentDeckAiEdits(0);
        setHistory([blank]);
        setHistoryIndex(0);
        setIsDirty(false);
        setHasActiveSession(false);
        try {
          localStorage.removeItem(activeKey);
        } catch {}
      }

      try {
        const local = JSON.parse(localStorage.getItem(savedKey) || '[]');
        const filtered = local.filter((d) => d.id !== deckId);
        localStorage.setItem(savedKey, JSON.stringify(filtered));
        if (filtered.length === 0 && (!currentDeckId || currentDeckId === deckId)) {
          setHasActiveSession(false);
          try {
            localStorage.removeItem(activeKey);
          } catch {}
        }
      } catch {}

      showToast('Presentation deleted successfully', 'info');
    },
    [currentDeckId, user?.id]
  );

  const handleSelectDeck = (deck) => {
    if (!deck) return;
    const clean = Array.isArray(deck.slides) && deck.slides.length > 0 ? deck.slides : INITIAL_DECK;
    setSlides(clean);
    setDeckTitle(deck.title || 'Untitled Presentation');
    setCurrentDeckAiEdits(Number(deck.ai_edits_count || 0));
    const th = deck.theme || currentTheme;
    const sd = deck.seed_color || currentSeed;
    if (deck.theme) setCurrentTheme(deck.theme);
    if (deck.seed_color) setCurrentSeed(deck.seed_color);
    setCurrentIndex(0);
    setCurrentDeckId(deck.id);
    setHistory([clean]);
    setHistoryIndex(0);
    setIsDirty(false);
    setHasActiveSession(true);
    setViewMode('editor');
    const activeKey = getActiveDeckStorageKey(user?.id);
    try {
      localStorage.setItem(
        activeKey,
        JSON.stringify({
          id: deck.id,
          slides: clean,
          deckTitle: deck.title || 'Untitled Presentation',
          currentTheme: th,
          currentSeed: sd,
          ai_edits_count: Number(deck.ai_edits_count || 0),
        })
      );
    } catch (e) {}
    showToast(`Loaded "${deck.title || 'Presentation'}"`, 'success');
  };

  // Automatically load presentation from URL query param (?deckId=...)
  useEffect(() => {
    if (!queryDeckId) return;

    const activeKey = getActiveDeckStorageKey(user?.id);
    const savedKey = getSavedSlidesStorageKey(user?.id);

    // 1. Check active working deck
    try {
      const active = localStorage.getItem(activeKey);
      if (active) {
        const parsed = JSON.parse(active);
        if (parsed.id === queryDeckId && Array.isArray(parsed.slides) && parsed.slides.length > 0) {
          handleSelectDeck(parsed);
          setViewMode('editor');
          return;
        }
      }
    } catch {}

    // 2. Check saved slides in localStorage
    try {
      const saved = JSON.parse(localStorage.getItem(savedKey) || '[]');
      const found = saved.find((d) => d.id === queryDeckId);
      if (found && Array.isArray(found.slides) && found.slides.length > 0) {
        handleSelectDeck(found);
        setViewMode('editor');
        return;
      }
    } catch {}

    // 3. Check Supabase user_decks
    async function loadCloudDeck() {
      try {
        let query = supabase.from('user_decks').select('*').eq('id', queryDeckId);
        if (user?.id) {
          query = query.eq('user_id', user.id);
        }
        const { data, error } = await query.maybeSingle();

        if (!error && data && Array.isArray(data.slides) && data.slides.length > 0) {
          handleSelectDeck(data);
          setViewMode('editor');
        }
      } catch (err) {
        console.warn('Could not load query deck:', err);
      }
    }
    loadCloudDeck();
  }, [queryDeckId, user?.id]);

  const handleStartNewSlides = () => {
    if (isFreeLimitReached) {
      navigate('/pricing');
      return;
    }
    const blank = [createBlankSlide(1)];
    setCurrentDeckId(null);
    setDeckTitle('Untitled Presentation');
    setSlides(blank);
    setCurrentIndex(0);
    setCurrentDeckAiEdits(0);
    setHistory([blank]);
    setHistoryIndex(0);
    setIsDirty(false); // Clean untouched blank deck
    setHasActiveSession(false);
    setViewMode('editor');
    showToast('Started new blank presentation', 'info');
  };

  // Global Keyboard Shortcuts (F5 present, Delete slide, Ctrl+Z, Ctrl+Y, Left/Right arrow)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInputActive =
        ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName) ||
        document.activeElement?.isContentEditable;

      if (e.key === 'F5') {
        e.preventDefault();
        setIsPresentModeOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        if (!isInputActive) {
          e.preventDefault();
          handleUndo();
        }
      } else if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 'y' || (e.key === 'z' && e.shiftKey))
      ) {
        if (!isInputActive) {
          e.preventDefault();
          handleRedo();
        }
      } else if (!isInputActive && !isPresentModeOpen) {
        if (e.key === 'Delete') {
          e.preventDefault();
          handleDeleteSlide(currentIndex);
        } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
          e.preventDefault();
          setCurrentIndex((prev) => Math.min(slides.length - 1, prev + 1));
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
          e.preventDefault();
          setCurrentIndex((prev) => Math.max(0, prev - 1));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, slides.length, currentIndex, isPresentModeOpen]);

  // Update current active slide
  const handleUpdateCurrentSlide = (updates) => {
    setIsDirty(true);
    setHasActiveSession(true);
    setSlides((prev) => {
      const next = [...prev];
      next[currentIndex] = {
        ...next[currentIndex],
        ...updates,
      };
      return next;
    });
    if (currentIndex === 0 && updates.t && typeof updates.t === 'string' && updates.t.trim()) {
      setDeckTitle(updates.t.trim());
    }
  };

  // Theme application
  const handleSelectTheme = (themeId) => {
    setCurrentTheme(themeId);
    const seed = THEME_SEEDS[themeId] || '#0EA5E9';
    setCurrentSeed(seed);

    // Apply theme to all slides
    const updated = slides.map((s) => ({
      ...s,
      theme: themeId,
      seed_color: seed,
    }));
    setSlides(updated);
    pushHistory(updated);
    setIsDirty(true);
    setHasActiveSession(true);
    showToast(`Applied ${themeId} theme to presentation`, 'success');
  };

  const handleSelectSeed = (hex) => {
    setCurrentSeed(hex);
    const updated = slides.map((s) => ({
      ...s,
      seed_color: hex,
    }));
    setSlides(updated);
    pushHistory(updated);
    setIsDirty(true);
    setHasActiveSession(true);
  };

  // Reordering slides via Drag & Drop
  const handleReorderSlides = (fromIdx, toIdx) => {
    if (fromIdx === toIdx) return;
    const next = [...slides];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setSlides(next);
    setCurrentIndex(toIdx);
    pushHistory(next);
    setIsDirty(true);
    setHasActiveSession(true);
    showToast(`Moved slide #${fromIdx + 1} to #${toIdx + 1}`, 'info');
  };

  // Duplicate slide
  const handleDuplicateSlide = (idx) => {
    const next = [...slides];
    const copy = JSON.parse(JSON.stringify(next[idx]));
    next.splice(idx + 1, 0, copy);
    setSlides(next);
    setCurrentIndex(idx + 1);
    pushHistory(next);
    setIsDirty(true);
    setHasActiveSession(true);
    showToast(`Duplicated slide #${idx + 1}`, 'success');
  };

  // Delete slide
  const handleDeleteSlide = (idx) => {
    if (slides.length <= 1) {
      showToast('A presentation must have at least one slide', 'error');
      return;
    }
    const next = slides.filter((_, i) => i !== idx);
    setSlides(next);
    setCurrentIndex(Math.min(idx, next.length - 1));
    pushHistory(next);
    setIsDirty(true);
    setHasActiveSession(true);
    showToast(`Deleted slide #${idx + 1}`, 'info');
  };

  // Add blank slide
  const handleAddBlankSlide = () => {
    const blank = createBlankSlide(slides.length + 1);
    blank.theme = currentTheme;
    blank.seed_color = currentSeed;
    const next = [...slides, blank];
    setSlides(next);
    setCurrentIndex(next.length - 1);
    pushHistory(next);
    setIsDirty(true);
    setHasActiveSession(true);
    showToast('Added new blank slide', 'success');
  };

  // Toggle slide mode (dark -> light_canvas -> light_cards -> dark)
  const handleToggleSlideMode = (idx) => {
    const currentMode = slides[idx]?.theme_mode || 'dark';
    const nextMode =
      currentMode === 'dark'
        ? 'light_canvas'
        : currentMode === 'light_canvas'
        ? 'light_cards'
        : 'dark';

    const next = [...slides];
    next[idx] = { ...next[idx], theme_mode: nextMode };
    setSlides(next);
    pushHistory(next);
    setIsDirty(true);
    setHasActiveSession(true);
  };

  // Full AI Generation
  const handleGenerateDeck = async ({ prompt, numSlides, theme, outline }) => {
    setIsGeneratingDeck(true);

    try {
      const res = await fetch(`${PPT_API_BASE}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || '',
        },
        body: JSON.stringify({
          prompt,
          num_slides: numSlides,
          theme: theme || null,
          theme_seed_hex: theme ? currentSeed : null,
          outline: outline || null,
          userEmail: user?.email || '',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Slide generation failed');
      }

      const data = await res.json();

      if (data.validation && !data.validation.valid) {
        throw new Error(data.validation.error || 'Slide generation failed validation');
      }

      const generatedSlides = data.slides || [];

      if (!generatedSlides || generatedSlides.length === 0) {
        throw new Error('AI could not produce slides for this topic. Please try again.');
      }

      const resTheme = data.theme || theme || currentTheme;
      const resSeed =
        data.theme_seed_hex || (resTheme ? THEME_SEEDS[resTheme] : null) || currentSeed;

      const cleanSlides = generatedSlides.map((s) => ({
        ...stripMarkdown(s),
        theme: s.theme || resTheme,
        seed_color: s.seed_color || resSeed,
      }));
      setSlides(cleanSlides);
      setCurrentIndex(0);
      setCurrentDeckAiEdits(0);
      const autoTitle =
        cleanSlides[0]?.t ||
        data.topic ||
        (prompt ? cleanPromptTitle(prompt) : null) ||
        'Untitled Presentation';
      setDeckTitle(autoTitle);
      setCurrentTheme(resTheme);
      setCurrentSeed(resSeed);
      pushHistory(cleanSlides);
      setIsDirty(true);
      setHasActiveSession(true);
      setViewMode('editor');
      showToast(
        `Successfully generated ${cleanSlides.length} slides!`,
        'success'
      );
      refreshPlan?.();
    } catch (err) {
      showToast(err.message || 'Error generating presentation', 'error');
    } finally {
      setIsGeneratingDeck(false);
    }
  };

  // Quick single slide regenerate
  const handleQuickRegenerateCurrent = async () => {
    if (isViewOnly) {
      navigate('/pricing');
      return;
    }
    const activeSlide = slides[currentIndex];
    if (!activeSlide || isRegeneratingSlide) return;

    setIsRegeneratingSlide(true);
    try {
      const res = await fetch(`${PPT_API_BASE}/api/regenerate-slide`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || '',
        },
        body: JSON.stringify({
          prompt: deckTitle || activeSlide.t,
          slide_index: currentIndex,
          total_slides: slides.length,
          current_title: activeSlide.t,
          current_layout: activeSlide.l,
          deckId: currentDeckId || undefined,
          userEmail: user?.email || '',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to regenerate slide');
      }

      const data = await res.json();
      if (data.slide) {
        const clean = stripMarkdown(data.slide);
        handleUpdateCurrentSlide(clean);
        setCurrentDeckAiEdits((prev) => prev + 1);
        pushHistory();
        showToast(`Regenerated slide #${currentIndex + 1}`, 'success');
      }
    } catch (err) {
      showToast(err.message || 'Error regenerating slide', 'error');
    } finally {
      setIsRegeneratingSlide(false);
    }
  };

  // Auto-generate point with AI
  const handleGeneratePointWithAI = async (isColumn = false, colIdx = 0) => {
    if (!isPro && currentDeckAiEdits >= maxDeckAiEdits) {
      showToast(`Free AI edit limit reached (${maxDeckAiEdits}/${maxDeckAiEdits}). Upgrade to Pro for unlimited AI edits.`, 'info');
      navigate('/pricing');
      return;
    }

    const activeSlide = slides[currentIndex];
    if (!activeSlide || isGeneratingAI) return;

    setIsGeneratingAI(true);
    try {
      let existingPoints = [];
      if (isColumn) {
        existingPoints = (activeSlide.c?.[colIdx] || []).slice(1);
      } else {
        existingPoints = Array.isArray(activeSlide.c) ? activeSlide.c : [];
      }

      const res = await fetch(`${PPT_API_BASE}/api/suggest-point`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || '',
        },
        body: JSON.stringify({
          slide_title: activeSlide.t,
          existing_points: existingPoints,
          topic: deckTitle,
          deckId: currentDeckId || undefined,
          userEmail: user?.email || '',
        }),
      });

      if (!res.ok) throw new Error('Failed to generate point');
      const data = await res.json();

      if (data.point) {
        const next = [...slides];
        if (isColumn) {
          if (!next[currentIndex].c) next[currentIndex].c = [];
          if (!next[currentIndex].c[colIdx]) next[currentIndex].c[colIdx] = ['Pillar'];
          next[currentIndex].c[colIdx].push(data.point);
        } else {
          if (!Array.isArray(next[currentIndex].c)) next[currentIndex].c = [];
          next[currentIndex].c.push(data.point);
        }

        setSlides(next);
        setCurrentDeckAiEdits((prev) => prev + 1);
        pushHistory(next);
        showToast('AI added a strategic takeaway point!', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Error auto-generating point', 'error');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Apply Restyle text
  const handleApplyRestyle = (targetInfo, restyledText) => {
    const next = [...slides];
    const slide = next[currentIndex];
    if (!slide) return;

    if (targetInfo.isColumn) {
      if (slide.c?.[targetInfo.colIdx]) {
        slide.c[targetInfo.colIdx][targetInfo.pointIdx + 1] = restyledText;
      }
    } else {
      if (Array.isArray(slide.c)) {
        slide.c[targetInfo.pointIdx] = restyledText;
      }
    }

    setSlides(next);
    setCurrentDeckAiEdits((prev) => prev + 1);
    pushHistory(next);
    showToast('Applied AI text restyle', 'success');
  };

  // Photo modal selection
  const handleSelectPhoto = (dataUri, query) => {
    handleUpdateCurrentSlide({
      image_data: dataUri,
      image_query: query,
      image_scale: 1.0,
    });
    pushHistory();
    showToast('Visual attached to slide!', 'success');
  };

  // Native PowerPoint (.pptx) In-Memory Download (0 Bytes on Server Disk)
  const handleExportPptx = async () => {
    if (isExportingPptx) return;
    setIsExportingPptx(true);
    showToast('Compiling presentation into PowerPoint .pptx...', 'info');
    try {
      // Ensure all exported slides carry explicit active theme & seed
      const exportSlides = slides.map((s) => ({
        ...s,
        theme: s.theme || currentTheme,
        seed_color: s.seed_color || currentSeed,
      }));

      const payload = {
        theme: currentTheme,
        theme_seed_hex: currentSeed,
        seed_color: currentSeed,
        deck_title: deckTitle,
        slides: exportSlides,
      };

      const res = await fetch(`${PPT_API_BASE}/api/render`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || '',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Server could not generate PowerPoint presentation');
      }

      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const cleanName = (deckTitle || 'Presentation')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '_');
      link.setAttribute('download', `${cleanName}.pptx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
      showToast('PowerPoint .pptx file downloaded successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Error exporting PPTX', 'error');
    } finally {
      setIsExportingPptx(false);
    }
  };

  const activeSlide = slides[currentIndex];

  if (viewMode === 'hub') {
    return (
      <>
        <PptStudioHub
          onGenerateDeck={handleGenerateDeck}
          onStartBlankDeck={handleStartNewSlides}
          onSelectDeck={handleSelectDeck}
          onResumeActiveDeck={() => {
            setViewMode('editor');
          }}
          onDeleteDeck={handleDeleteDeckFromStorage}
          activeDeckTitle={deckTitle}
          activeSlidesCount={hasActiveSession ? slides.length : 0}
          isGeneratingDeck={isGeneratingDeck}
        />

        {/* Toast Notification Banner */}
        {toast && (
          <div
            className={`fixed top-16 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl border shadow-2xl text-xs font-semibold backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-top-2 ${
              toast.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
                : toast.type === 'error'
                ? 'bg-rose-950/80 border-rose-500/40 text-rose-200'
                : 'bg-sky-950/80 border-sky-500/40 text-sky-200'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        )}
      </>
    );
  }

  return (
    <div
      className={`w-full h-screen flex flex-col font-sans overflow-hidden select-none transition-colors ${
        darkMode ? 'bg-[#0e0e10] text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Toast Notification Banner */}
      {toast && (
        <div
          className={`fixed top-16 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl border shadow-2xl text-xs font-semibold backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-top-2 ${
            toast.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
              : toast.type === 'error'
              ? 'bg-rose-950/80 border-rose-500/40 text-rose-200'
              : 'bg-sky-950/80 border-sky-500/40 text-sky-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Application Bar */}
      <PptTopBar
        deckTitle={deckTitle}
        onChangeDeckTitle={(val) => setDeckTitle(val)}
        currentTheme={currentTheme}
        currentSeed={currentSeed}
        onSelectTheme={handleSelectTheme}
        onSelectSeed={handleSelectSeed}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        zoomScale={zoomScale}
        onZoomIn={() => setZoomScale((prev) => Math.min(1.6, prev + 0.1))}
        onZoomOut={() => setZoomScale((prev) => Math.max(0.5, prev - 0.1))}
        onZoomReset={() => setZoomScale(1.0)}
        onOpenPresentMode={() => setIsPresentModeOpen(true)}
        isCopilotOpen={isCopilotOpen}
        onToggleCopilot={() => setIsCopilotOpen(!isCopilotOpen)}
        onNewPresentation={() => setViewMode('hub')}
        onOpenMySlides={() => setIsMySlidesModalOpen(true)}
        onExportPptx={handleExportPptx}
        isExporting={isExportingPptx}
        saveStatus={saveStatus}
        slidesCount={slides.length}
        onBackToHub={() => setViewMode('hub')}
        isViewOnly={isViewOnly}
        isFreeLimitReached={isFreeLimitReached}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex flex-row overflow-hidden relative">
        {/* Center Presentation Stage Canvas */}
        <main
          id="stageWorkspace"
          className={`flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors ${
            darkMode ? 'bg-[#0a0a0c]' : 'bg-[#f1f5f9]'
          }`}
        >
          {/* Subtle Ambient Background Grid & Glow */}
          <div
            className={`absolute inset-0 [background-size:24px_24px] pointer-events-none transition-opacity ${
              darkMode
                ? 'bg-[radial-gradient(#26262a_1px,transparent_1px)] opacity-25'
                : 'bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] opacity-60'
            }`}
          />

          {/* Slide Stage Container */}
          <div id="stageContainer" className="relative flex items-center justify-center">
            {activeSlide ? (
              <SlideCanvas
                slide={activeSlide}
                slideIndex={currentIndex}
                totalSlides={slides.length}
                currentTheme={currentTheme}
                currentSeedHex={currentSeed}
                zoomScale={zoomScale}
                onUpdateSlide={handleUpdateCurrentSlide}
                onOpenPhotoModal={() => setIsPhotoModalOpen(true)}
                onOpenRestyleModal={(target) => {
                  setRestyleTargetInfo(target);
                  setIsRestyleModalOpen(true);
                }}
                onGeneratePointWithAI={handleGeneratePointWithAI}
                onPushHistory={() => pushHistory()}
                isGeneratingAI={isGeneratingAI}
              />
            ) : null}
          </div>

          {/* Apple Dynamic Island - Floating Slides Glass Capsule */}
          <FloatingSlidesIsland
            slides={slides}
            currentIndex={currentIndex}
            onSelectSlide={(idx) => setCurrentIndex(idx)}
            onReorderSlides={handleReorderSlides}
            onDuplicateSlide={handleDuplicateSlide}
            onDeleteSlide={handleDeleteSlide}
            onToggleSlideMode={handleToggleSlideMode}
            onAddBlankSlide={handleAddBlankSlide}
            onQuickRegenerate={handleQuickRegenerateCurrent}
            isRegenerating={isRegeneratingSlide}
            onOpenPresentMode={() => setIsPresentModeOpen(true)}
          />
        </main>

        {/* Right AI Copilot Drawer */}
        <CopilotDrawer
          isOpen={isCopilotOpen}
          onClose={() => setIsCopilotOpen(false)}
          activeSlide={activeSlide}
          slideIndex={currentIndex}
          deckTopic={deckTitle}
          deckId={currentDeckId}
          isViewOnly={isViewOnly}
          aiEditsCount={currentDeckAiEdits}
          maxAiEdits={maxDeckAiEdits}
          onApplySlideUpdate={(newSlide) => {
            handleUpdateCurrentSlide(newSlide);
            setCurrentDeckAiEdits((prev) => prev + 1);
            pushHistory();
            showToast('NetRoot AI Assistant updated active slide!', 'success');
          }}
          onQuickRegenerateCurrent={handleQuickRegenerateCurrent}
          isRegenerating={isRegeneratingSlide}
        />
      </div>

      {/* Fullscreen Presenter Mode */}
      <PresentOverlay
        isOpen={isPresentModeOpen}
        onClose={() => setIsPresentModeOpen(false)}
        slides={slides}
        currentIndex={currentIndex}
        onNavigate={(delta) =>
          setCurrentIndex((p) => Math.max(0, Math.min(slides.length - 1, p + delta)))
        }
        currentTheme={currentTheme}
        currentSeedHex={currentSeed}
      />

      {/* Unsplash / Web Photo Modal */}
      <UnsplashModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        initialQuery={
          activeSlide?.image_query ||
          (activeSlide?.t
            ? activeSlide.t.replace(/[^\w\s]/g, '').trim().split(/\s+/).slice(0, 3).join(' ')
            : 'technology')
        }
        onSelectImage={handleSelectPhoto}
      />

      {/* AI Bullet Restyle Modal */}
      <RestyleModal
        isOpen={isRestyleModalOpen}
        onClose={() => {
          setIsRestyleModalOpen(false);
          setRestyleTargetInfo(null);
        }}
        targetInfo={restyleTargetInfo}
        slideTitle={activeSlide?.t || ''}
        onApplyRestyle={handleApplyRestyle}
        deckId={currentDeckId}
        isEditLimitReached={!isPro && currentDeckAiEdits >= maxDeckAiEdits}
      />

      {/* My Slides Modal (Cloud Presentation Library) */}
      <MySlidesModal
        isOpen={isMySlidesModalOpen}
        onClose={() => setIsMySlidesModalOpen(false)}
        onSelectDeck={handleSelectDeck}
        onNewDeck={() => {
          setIsMySlidesModalOpen(false);
          setViewMode('hub');
        }}
        currentDeckId={currentDeckId}
      />
    </div>
  );
}
