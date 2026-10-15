import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { PPT_API_BASE } from './pptConstants';
import {
  Presentation,
  ExternalLink,
  Download,
  Layers,
  Sparkles,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function PptChatDeckCard({ pptDeck, darkMode = true }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [showOutline, setShowOutline] = useState(true);

  if (!pptDeck) return null;

  const title = pptDeck.title || 'Untitled Presentation';
  const slideCount = pptDeck.slideCount || pptDeck.slides?.length || 5;
  const slides = pptDeck.slides || [];
  const theme = pptDeck.theme || 'midnight';

  const handleOpenStudio = () => {
    try {
      // 1. Set as active working deck
      localStorage.setItem(
        'netroot_active_working_deck',
        JSON.stringify({
          id: pptDeck.deckId,
          slides: pptDeck.slides,
          deckTitle: title,
          currentTheme: theme,
          currentSeed: pptDeck.seed_color || '#0EA5E9',
        })
      );

      // 2. Add or update in saved slides list
      const saved = JSON.parse(localStorage.getItem('netroot_saved_slides') || '[]');
      const existingIdx = saved.findIndex((d) => d.id === pptDeck.deckId);
      const deckItem = {
        id: pptDeck.deckId,
        title,
        slides: pptDeck.slides,
        theme,
        seed_color: pptDeck.seed_color || '#0EA5E9',
        updated_at: new Date().toISOString(),
      };
      if (existingIdx >= 0) {
        saved[existingIdx] = deckItem;
      } else {
        saved.unshift(deckItem);
      }
      localStorage.setItem('netroot_saved_slides', JSON.stringify(saved));
    } catch (e) {
      console.warn('Could not cache deck in localStorage:', e);
    }

    // Navigate to PPT Studio with deckId param
    navigate(`/ppt-studio?deckId=${pptDeck.deckId || ''}`);
  };

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const res = await fetch(`${PPT_API_BASE}/api/render`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || '',
        },
        body: JSON.stringify({
          slides: pptDeck.slides || [],
          deck_title: title,
          theme: theme,
          theme_seed_hex: pptDeck.seed_color || '#0EA5E9',
          userEmail: user?.email || '',
        }),
      });

      if (!res.ok) throw new Error('Could not compile presentation file');

      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const cleanName = (title || 'Presentation')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '_');
      link.setAttribute('download', `${cleanName}.pptx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className={`rounded-2xl border p-4.5 my-3.5 transition-all shadow-xl ${
        darkMode
          ? 'bg-gradient-to-br from-[#0e1626] via-[#101726] to-[#0a0f1c] border-blue-500/30 text-white shadow-blue-950/30'
          : 'bg-gradient-to-br from-blue-50/90 via-white to-slate-50 border-blue-200 text-slate-900 shadow-blue-100/70'
      }`}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 shrink-0">
            <Presentation className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20">
                <Sparkles className="w-3 h-3" />
                Pitch Deck Generated
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/20">
                {slideCount} Slides
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-500/15 text-slate-400 border border-slate-500/20">
                16:9 Widescreen
              </span>
            </div>
            <h3 className="font-bold text-base leading-snug line-clamp-1">
              {title}
            </h3>
          </div>
        </div>

        <button
          onClick={() => setShowOutline(!showOutline)}
          className={`p-1.5 rounded-lg border transition-colors shrink-0 ${
            darkMode
              ? 'border-gray-800 hover:bg-gray-800 text-gray-400'
              : 'border-gray-200 hover:bg-gray-100 text-gray-500'
          }`}
          title={showOutline ? 'Collapse outline' : 'Expand outline'}
        >
          {showOutline ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Slide Outline Preview */}
      {showOutline && slides.length > 0 && (
        <div
          className={`rounded-xl p-3 mb-4 space-y-1.5 text-xs border ${
            darkMode
              ? 'bg-[#0a0f1d]/70 border-gray-800/80 text-gray-300'
              : 'bg-white/80 border-gray-200/80 text-gray-700'
          }`}
        >
          <div className="flex items-center justify-between pb-1 text-[11px] font-medium text-gray-400 border-b border-gray-800/40">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              Slide Outline ({slides.length} slides)
            </span>
            <span className="capitalize text-blue-400">{theme} Theme</span>
          </div>
          <div className="grid grid-cols-1 gap-1.5 pt-1">
            {slides.map((s, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 py-0.5 px-1.5 rounded hover:bg-white/5 transition-colors"
              >
                <span className="w-5 h-5 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                  {idx + 1}
                </span>
                <span className="font-medium truncate flex-1">{s.t || `Slide ${idx + 1}`}</span>
                {s.l && (
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-gray-500/15 text-gray-400 shrink-0">
                    {s.l}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons Row */}
      <div className="flex items-center gap-2.5 flex-wrap pt-1">
        <button
          onClick={handleOpenStudio}
          className="flex-1 min-w-[170px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-md hover:shadow-blue-500/25 active:scale-[0.98] transition-all"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Open in NetRoot AI PPT Studio</span>
        </button>

        <button
          onClick={handleDownload}
          disabled={downloading}
          className={`flex-1 min-w-[150px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs border active:scale-[0.98] transition-all ${
            downloadSuccess
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
              : darkMode
              ? 'bg-white/5 border-blue-500/30 text-blue-300 hover:bg-blue-500/15 hover:border-blue-500/50'
              : 'bg-white border-blue-300 text-blue-600 hover:bg-blue-50'
          }`}
        >
          {downloadSuccess ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Downloaded!</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5" />
              <span>{downloading ? 'Preparing...' : 'Download PPTX'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
