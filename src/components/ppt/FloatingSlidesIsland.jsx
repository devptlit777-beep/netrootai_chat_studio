import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Copy,
  Sun,
  Moon,
  Maximize2,
  RefreshCw,
  GripVertical,
  Layers,
  Pin,
  PinOff,
} from 'lucide-react';

export default function FloatingSlidesIsland({
  slides = [],
  currentIndex = 0,
  onSelectSlide,
  onReorderSlides,
  onDuplicateSlide,
  onDeleteSlide,
  onToggleSlideMode,
  onAddBlankSlide,
  onQuickRegenerate,
  isRegenerating = false,
  onOpenPresentMode,
}) {
  const { theme } = useTheme();
  const darkMode = theme === 'dark';

  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const hoverTimeoutRef = useRef(null);

  const isExpanded = isHovered || isPinned;

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (isPinned) return;
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 280);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  const handleDragStart = (e, idx) => {
    setDraggedIdx(idx);
    e.dataTransfer.setData('text/plain', String(idx));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    if (dragOverIdx !== idx) setDragOverIdx(idx);
  };

  const handleDrop = (e, targetIdx) => {
    e.preventDefault();
    setDragOverIdx(null);
    if (draggedIdx !== null && draggedIdx !== targetIdx) {
      onReorderSlides(draggedIdx, targetIdx);
    }
    setDraggedIdx(null);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  return (
    <div
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 select-none flex flex-col items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Floating Island Expanded Carousel (Morphs up on Hover/Pin) */}
      {isExpanded && (
        <div
          className={`mb-3 flex flex-col backdrop-blur-2xl rounded-2xl p-3.5 ring-1 animate-in fade-in zoom-in-95 slide-in-from-bottom-3 duration-200 max-w-[90vw] ${
            darkMode
              ? 'bg-[#121214]/95 border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.85)] ring-white/10'
              : 'bg-white/95 border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.12)] ring-slate-900/5'
          }`}
        >
          {/* Top header of expanded island */}
          <div
            className={`flex items-center justify-between pb-2 mb-2 border-b text-xs ${
              darkMode ? 'border-white/10' : 'border-slate-200'
            }`}
          >
            <div
              className={`flex items-center gap-2 font-mono font-semibold ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-sky-500" />
              <span>Slides Overview ({slides.length})</span>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-mono hidden sm:inline ${
                  darkMode ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Drag to reorder
              </span>
              <button
                type="button"
                onClick={() => setIsPinned(!isPinned)}
                className={`p-1 rounded text-xs transition cursor-pointer ${
                  isPinned
                    ? 'text-sky-500 bg-sky-500/15'
                    : darkMode
                    ? 'text-slate-400 hover:text-white hover:bg-white/5'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title={isPinned ? 'Unpin deck' : 'Pin deck open'}
              >
                {isPinned ? <Pin className="w-3 h-3 fill-sky-500" /> : <PinOff className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Horizontal slides card deck */}
          <div className="flex items-center gap-3 overflow-x-auto py-1 px-0.5 max-w-[85vw] scrollbar-thin">
            {slides.map((slide, idx) => {
              const isActive = idx === currentIndex;
              const isOver = dragOverIdx === idx;
              const mode = slide.theme_mode || 'dark';

              return (
                <div
                  key={idx}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onSelectSlide(idx)}
                  className={`group relative w-44 h-24 rounded-xl border p-2.5 flex flex-col justify-between shrink-0 cursor-pointer transition-all duration-150 ${
                    isActive
                      ? 'border-sky-500 bg-sky-500/15 shadow-md shadow-sky-500/20 scale-[1.03] ring-1 ring-sky-500'
                      : darkMode
                      ? 'border-white/10 bg-[#18181b]/80 hover:border-slate-500 hover:bg-[#202025]'
                      : 'border-slate-200 bg-white hover:border-sky-300 hover:bg-slate-50 shadow-sm'
                  } ${isOver ? 'border-dashed border-sky-500 scale-105' : ''}`}
                >
                  {/* Top card bar: Drag handle + Index + Quick actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <GripVertical
                        className={`w-3 h-3 cursor-grab active:cursor-grabbing ${
                          darkMode
                            ? 'text-slate-500 group-hover:text-slate-300'
                            : 'text-slate-400 group-hover:text-slate-600'
                        }`}
                      />
                      <span
                        className={`text-[10px] font-mono font-bold ${
                          darkMode ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        #{String(idx + 1).padStart(2, '0')}
                      </span>
                    </div>

                    <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition">
                      <button
                        type="button"
                        draggable="false"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          onToggleSlideMode(idx);
                        }}
                        className={`p-1 rounded transition cursor-pointer ${
                          darkMode
                            ? 'text-slate-400 hover:text-amber-300'
                            : 'text-slate-500 hover:text-amber-500'
                        }`}
                        title="Toggle Light / Dark mode"
                      >
                        {mode === 'dark' ? <Moon className="w-2.5 h-2.5" /> : <Sun className="w-2.5 h-2.5 text-amber-500" />}
                      </button>

                      <button
                        type="button"
                        draggable="false"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          onDuplicateSlide(idx);
                        }}
                        className={`p-1 rounded transition cursor-pointer ${
                          darkMode
                            ? 'text-slate-400 hover:text-sky-300'
                            : 'text-slate-500 hover:text-sky-600'
                        }`}
                        title="Duplicate slide"
                      >
                        <Copy className="w-2.5 h-2.5" />
                      </button>

                      {slides.length > 1 && (
                        <button
                          type="button"
                          draggable="false"
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            onDeleteSlide(idx);
                          }}
                          className={`p-1 rounded transition cursor-pointer ${
                            darkMode
                              ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
                              : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                          }`}
                          title="Delete slide"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Title preview */}
                  <p
                    className={`text-[11px] font-semibold line-clamp-2 leading-tight mt-1 ${
                      darkMode ? 'text-slate-200' : 'text-slate-800'
                    }`}
                  >
                    {slide.t || 'Untitled Slide'}
                  </p>
                </div>
              );
            })}

            {/* Quick add slide button in deck */}
            <button
              type="button"
              onClick={onAddBlankSlide}
              className={`w-28 h-24 rounded-xl border border-dashed flex flex-col items-center justify-center gap-1.5 shrink-0 transition text-xs font-semibold cursor-pointer ${
                darkMode
                  ? 'border-sky-500/40 hover:border-sky-400 bg-sky-500/5 hover:bg-sky-500/10 text-sky-400'
                  : 'border-sky-300 hover:border-sky-500 bg-sky-50 hover:bg-sky-100/70 text-sky-600'
              }`}
              title="Add new blank slide"
            >
              <Plus className="w-4 h-4" />
              <span>Add Slide</span>
            </button>
          </div>
        </div>
      )}

      {/* The Sleek Floating Glass Capsule (Dynamic Island Pill) */}
      <div
        className={`flex items-center gap-2.5 backdrop-blur-xl px-3.5 py-1.5 rounded-full border shadow-xl ring-1 transition-all ${
          darkMode
            ? 'bg-[#141416]/90 border-white/15 text-slate-200 ring-white/5 shadow-[0_15px_35px_rgba(0,0,0,0.6)] hover:border-sky-500/40 hover:bg-[#18181b]/95'
            : 'bg-white/90 border-slate-200 text-slate-800 ring-slate-900/5 shadow-[0_10px_30px_rgba(0,0,0,0.12)] hover:border-sky-400 hover:bg-white'
        }`}
      >
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => onSelectSlide(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className={`p-1 rounded-full disabled:opacity-25 transition cursor-pointer ${
            darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
          }`}
          title="Previous slide (Left Arrow)"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Dynamic Island Slide Indicator & Mini Dot Matrix */}
        <div
          onClick={() => setIsPinned(!isPinned)}
          className={`flex items-center gap-2 px-2.5 py-1 rounded-full cursor-pointer transition group ${
            darkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-100 hover:bg-slate-200'
          }`}
          title="Hover or click to view all slides"
        >
          <span
            className={`text-xs font-mono font-bold ${
              darkMode ? 'text-slate-200 group-hover:text-white' : 'text-slate-700 group-hover:text-slate-900'
            }`}
          >
            {currentIndex + 1} / {slides.length}
          </span>

          {/* Mini Glowing Indicator Dots (Apple Dynamic Island style) */}
          <div className="flex items-center gap-1">
            {slides.slice(0, 10).map((_, i) => (
              <span
                key={i}
                className={`rounded-full transition-all duration-200 ${
                  i === currentIndex
                    ? 'w-3 h-1.5 bg-sky-500 shadow-sm shadow-sky-500/50'
                    : darkMode
                    ? 'w-1.5 h-1.5 bg-slate-600 hover:bg-slate-400'
                    : 'w-1.5 h-1.5 bg-slate-300 hover:bg-slate-400'
                }`}
              />
            ))}
            {slides.length > 10 && (
              <span
                className={`text-[9px] font-mono ${
                  darkMode ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                +
              </span>
            )}
          </div>
        </div>

        {/* Next Button */}
        <button
          type="button"
          onClick={() => onSelectSlide(Math.min(slides.length - 1, currentIndex + 1))}
          disabled={currentIndex === slides.length - 1}
          className={`p-1 rounded-full disabled:opacity-25 transition cursor-pointer ${
            darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
          }`}
          title="Next slide (Right Arrow)"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <span
          className={`w-px h-3.5 mx-0.5 ${
            darkMode ? 'bg-slate-700/80' : 'bg-slate-200'
          }`}
        />

        {/* Add Blank Slide */}
        <button
          type="button"
          onClick={onAddBlankSlide}
          className={`p-1 transition cursor-pointer ${
            darkMode ? 'text-sky-400 hover:text-sky-300' : 'text-sky-600 hover:text-sky-700'
          }`}
          title="Add new blank slide"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Quick Regenerate */}
        <button
          type="button"
          onClick={onQuickRegenerate}
          disabled={isRegenerating}
          className={`p-1 transition disabled:opacity-30 cursor-pointer ${
            darkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'
          }`}
          title="Quick regenerate this slide"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
        </button>

        {/* Delete Current Slide */}
        {slides.length > 1 && (
          <button
            type="button"
            draggable="false"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onDeleteSlide(currentIndex);
            }}
            className={`p-1 transition cursor-pointer ${
              darkMode
                ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
                : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
            } rounded-full`}
            title="Delete current slide"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Fullscreen Present */}
        <button
          type="button"
          onClick={onOpenPresentMode}
          className={`p-1 transition cursor-pointer ${
            darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
          }`}
          title="Fullscreen presentation (F5)"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
