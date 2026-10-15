import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { THEME_OPTIONS, THEME_SEEDS } from './pptConstants';
import { useTheme } from '../../contexts/ThemeContext';
import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Bot,
  Plus,
  Palette,
  Loader2,
  ChevronDown,
  ChevronLeft,
  Sun,
  Moon,
  FolderKanban,
  Cloud,
  CloudOff,
  Sparkles,
} from 'lucide-react';

export default function PptTopBar({
  deckTitle = 'Untitled Presentation',
  onChangeDeckTitle,
  currentTheme = 'midnight',
  currentSeed = '#0EA5E9',
  onSelectTheme,
  onSelectSeed,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  zoomScale = 1.0,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onOpenPresentMode,
  isCopilotOpen = false,
  onToggleCopilot,
  onNewPresentation,
  onOpenMySlides,
  onExportPptx,
  isExporting = false,
  saveStatus = 'saved', // 'saved' | 'saving' | 'error'
  onBackToHub,
  isViewOnly = false,
  isFreeLimitReached = false,
}) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const darkMode = theme === 'dark';
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  return (
    <header
      className={`h-14 border-b px-4 flex items-center justify-between gap-3 select-none shrink-0 z-30 transition-colors ${
        darkMode
          ? 'bg-[#121214] border-[#26262a] text-slate-100'
          : 'bg-white border-slate-200 text-slate-800 shadow-sm'
      }`}
    >
      {/* Left: Back to Hub + NetRoot AI PPT Studio Logo + Editable Deck Title Input + Cloud Save Indicator */}
      <div className="flex items-center gap-2.5 min-w-0">
        {onBackToHub && (
          <button
            type="button"
            onClick={onBackToHub}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition border shrink-0 cursor-pointer ${
              darkMode
                ? 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300 hover:text-white'
                : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700 hover:text-slate-900'
            }`}
            title="Back to Dashboard Hub"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hub</span>
          </button>
        )}

        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`text-xs font-bold font-mono tracking-wider hidden sm:inline ${
              darkMode ? 'text-slate-300' : 'text-slate-600'
            }`}
          >
            NETROOT AI PPT STUDIO
          </span>
          <span className={darkMode ? 'text-slate-600' : 'text-slate-300'}>/</span>
        </div>

        <input
          type="text"
          value={deckTitle || ''}
          onChange={(e) => !isViewOnly && onChangeDeckTitle && onChangeDeckTitle(e.target.value)}
          readOnly={isViewOnly}
          placeholder="Untitled Presentation"
          className={`text-sm font-semibold rounded-lg px-2 py-0.5 transition outline-none border focus:border-sky-500 max-w-[150px] sm:max-w-[240px] md:max-w-[320px] truncate ${
            isViewOnly ? 'cursor-default opacity-85' : ''
          } ${
            darkMode
              ? 'bg-transparent text-white border-transparent hover:border-white/20 focus:bg-[#18181b]'
              : 'bg-transparent text-slate-900 border-transparent hover:border-slate-300 focus:bg-white'
          }`}
          title={isViewOnly ? "Presentation Title (View-Only)" : "Click to rename presentation"}
        />

        {isViewOnly && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-mono shrink-0">
            <span>🔒 View-Only</span>
          </div>
        )}

        {/* Cloud Auto-Save Status */}
        <div className="hidden lg:flex items-center gap-1 text-[11px] font-mono">
          {saveStatus === 'saving' ? (
            <span className="flex items-center gap-1 text-sky-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Saving...</span>
            </span>
          ) : saveStatus === 'error' ? (
            <span
              className="flex items-center gap-1 text-amber-400/90"
              title="Saved locally (Cloud offline)"
            >
              <CloudOff className="w-3 h-3" />
              <span>Local backup</span>
            </span>
          ) : (
            <span
              className="flex items-center gap-1 text-emerald-400/80"
              title="All changes saved to cloud"
            >
              <Cloud className="w-3 h-3" />
              <span>Saved</span>
            </span>
          )}
        </div>
      </div>

      {/* Center: Undo/Redo & Zoom Controls */}
      <div
        className={`hidden md:flex items-center gap-1.5 border rounded-lg p-1 ${
          darkMode ? 'bg-[#18181b] border-[#26262a]' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className={`p-1 rounded transition ${
            darkMode
              ? 'text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400'
              : 'text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-500'
          }`}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          className={`p-1 rounded transition ${
            darkMode
              ? 'text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400'
              : 'text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-500'
          }`}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>

        <span
          className={`w-px h-3.5 mx-1 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}
        />

        <button
          type="button"
          onClick={onZoomOut}
          className={`p-1 rounded transition ${
            darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
          }`}
          title="Zoom out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onZoomReset}
          className={`text-[11px] font-mono font-medium px-1.5 transition ${
            darkMode ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-900'
          }`}
          title="Reset zoom to 100%"
        >
          {Math.round(zoomScale * 100)}%
        </button>
        <button
          type="button"
          onClick={onZoomIn}
          className={`p-1 rounded transition ${
            darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
          }`}
          title="Zoom in"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right: Theme, Light/Dark, My Slides, NetRoot AI Assistant, New Presentation, PPTX Export */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Presentation Color Palette Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
              darkMode
                ? 'border-[#26262a] bg-[#18181b] hover:border-slate-600 text-slate-200'
                : 'border-slate-200 bg-slate-50 hover:border-slate-300 text-slate-700'
            }`}
          >
            <span
              className="w-3 h-3 rounded-full shrink-0 shadow-sm"
              style={{ backgroundColor: currentSeed }}
            />
            <span className="hidden sm:inline capitalize">
              {THEME_OPTIONS.find((t) => t.id === currentTheme)?.label || currentTheme}
            </span>
            <ChevronDown
              className={`w-3 h-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}
            />
          </button>

          {isThemeMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsThemeMenuOpen(false)}
              />
              <div
                className={`absolute right-0 mt-2 w-64 border rounded-xl shadow-2xl p-3 z-50 space-y-3 ${
                  darkMode
                    ? 'bg-[#18181b] border-[#2b2b30] text-slate-200'
                    : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                <div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider font-mono block mb-1.5 ${
                      darkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    Theme Palettes
                  </span>
                  <div className="space-y-1">
                    {THEME_OPTIONS.map((th) => (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => {
                          onSelectTheme(th.id);
                          setIsThemeMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                          currentTheme === th.id
                            ? 'bg-sky-500/15 text-sky-400 font-semibold border border-sky-500/30'
                            : darkMode
                            ? 'text-slate-300 hover:bg-white/5'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: th.seed }}
                          />
                          <span>{th.label}</span>
                        </div>
                        <span className="text-xs">{th.icon}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Seed Accent Color Swatches */}
                <div
                  className={`pt-2 border-t ${
                    darkMode ? 'border-[#26262a]' : 'border-slate-100'
                  }`}
                >
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider font-mono block mb-1.5 ${
                      darkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    Brand Seed Accent
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {Object.entries(THEME_SEEDS).map(([k, hex]) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => {
                          onSelectSeed(hex);
                          setIsThemeMenuOpen(false);
                        }}
                        style={{ backgroundColor: hex }}
                        className={`w-5 h-5 rounded-full border transition hover:scale-110 cursor-pointer ${
                          currentSeed.toLowerCase() === hex.toLowerCase()
                            ? 'border-white ring-2 ring-sky-400 ring-offset-1 ring-offset-[#18181b]'
                            : 'border-transparent'
                        }`}
                        title={k}
                      />
                    ))}

                    {/* Custom Color Input */}
                    <label
                      className={`w-5 h-5 rounded-full border flex items-center justify-center cursor-pointer hover:border-sky-400 transition ${
                        darkMode
                          ? 'border-slate-600 bg-white/5'
                          : 'border-slate-300 bg-slate-50'
                      }`}
                      title="Custom color hex"
                    >
                      <Palette
                        className={`w-2.5 h-2.5 ${
                          darkMode ? 'text-slate-400' : 'text-slate-600'
                        }`}
                      />
                      <input
                        type="color"
                        value={currentSeed}
                        onChange={(e) => onSelectSeed(e.target.value)}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Global NetRoot AI Light / Dark Mode Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className={`p-1.5 rounded-lg border transition cursor-pointer ${
            darkMode
              ? 'border-[#26262a] bg-[#18181b] hover:bg-white/5 text-amber-400 hover:text-amber-300'
              : 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Present F5 Button */}
        <button
          type="button"
          onClick={onOpenPresentMode}
          className={`p-1.5 rounded-lg border transition cursor-pointer ${
            darkMode
              ? 'border-[#26262a] bg-[#18181b] hover:bg-white/5 text-slate-300 hover:text-white'
              : 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
          title="Fullscreen Presentation (F5)"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* My Slides Library Button */}
        <button
          type="button"
          onClick={onOpenMySlides}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
            darkMode
              ? 'border-[#26262a] bg-[#18181b] hover:border-slate-500 text-slate-200 hover:text-white'
              : 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900'
          }`}
          title="Open My Slides Library"
        >
          <FolderKanban className="w-3.5 h-3.5 text-sky-500" />
          <span className="hidden sm:inline">My Slides</span>
        </button>

        {/* NetRoot AI Assistant Toggle Button */}
        <button
          type="button"
          onClick={onToggleCopilot}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
            isCopilotOpen
              ? 'bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-600/30'
              : darkMode
              ? 'border-purple-500/40 bg-purple-950/30 text-purple-300 hover:bg-purple-950/60 hover:border-purple-400'
              : 'border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:border-purple-400'
          }`}
          title="Toggle NetRoot AI Assistant"
        >
          <Bot className="w-3.5 h-3.5" />
          <span className="hidden md:inline">NetRoot AI Assistant</span>
          <span className="hidden sm:inline md:hidden">AI Assistant</span>
        </button>

        {/* Upgrade CTA if View Only */}
        {isViewOnly && (
          <button
            type="button"
            onClick={() => navigate('/pricing')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span className="hidden sm:inline">⚡ Upgrade to Pro</span>
          </button>
        )}

        {/* New Presentation Trigger */}
        <button
          type="button"
          onClick={() => {
            if (isFreeLimitReached) {
              navigate('/pricing');
              return;
            }
            onNewPresentation();
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
            darkMode
              ? 'border-sky-500/40 bg-sky-950/30 hover:bg-sky-900/50 text-sky-300 hover:text-white'
              : 'border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-700'
          }`}
          title={isFreeLimitReached ? "Upgrade to Pro to create more presentations" : "Create New Presentation (Open Hub)"}
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Presentation</span>
          {isFreeLimitReached && (
            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400">PRO</span>
          )}
        </button>

        {/* Download PPTX Native Button */}
        <button
          type="button"
          onClick={onExportPptx}
          disabled={isExporting}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold text-xs shadow-md shadow-sky-500/20 transition disabled:opacity-50 cursor-pointer"
        >
          {isExporting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          <span>PPTX</span>
        </button>
      </div>
    </header>
  );
}
