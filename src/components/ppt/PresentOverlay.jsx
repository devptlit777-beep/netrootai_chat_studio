import React, { useEffect } from 'react';
import SlideCanvas from './SlideCanvas';
import { ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react';

export default function PresentOverlay({
  isOpen = false,
  onClose,
  slides = [],
  currentIndex = 0,
  onNavigate,
  currentTheme = 'midnight',
  currentSeedHex = '#0EA5E9',
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        onNavigate(1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        onNavigate(-1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onNavigate, onClose]);

  if (!isOpen || !slides || slides.length === 0) return null;

  const currentSlide = slides[currentIndex];

  return (
    <div className="fixed inset-0 z-50 bg-[#09090b] flex flex-col items-center justify-center select-none overflow-hidden">
      {/* Top Floating Controls */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-50 opacity-40 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs font-mono text-slate-300">
          <span>{currentIndex + 1} / {slides.length}</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">Use Arrow Keys or Click</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition"
          title="Exit Fullscreen (Esc)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Slide Canvas at Auto Scale */}
      <div className="flex-1 w-full h-full flex items-center justify-center p-8">
        <SlideCanvas
          slide={currentSlide}
          slideIndex={currentIndex}
          totalSlides={slides.length}
          currentTheme={currentTheme}
          currentSeedHex={currentSeedHex}
          zoomScale={1.0}
        />
      </div>

      {/* Navigation Arrows */}
      <button
        type="button"
        onClick={() => onNavigate(-1)}
        disabled={currentIndex === 0}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-slate-300 hover:text-white disabled:opacity-20 transition"
        title="Previous Slide"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        type="button"
        onClick={() => onNavigate(1)}
        disabled={currentIndex === slides.length - 1}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-slate-300 hover:text-white disabled:opacity-20 transition"
        title="Next Slide"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
    </div>
  );
}
