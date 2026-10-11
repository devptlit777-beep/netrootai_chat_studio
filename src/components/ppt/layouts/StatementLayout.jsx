import React from 'react';
import EditableText from '../EditableText';
import { stripMarkdown } from '../pptConstants';
import { Trash2 } from 'lucide-react';

export default function StatementLayout({
  slide,
  slideIndex,
  totalSlides,
  onUpdateSlide,
  onOpenPhotoModal,
  onPushHistory,
}) {
  const items = Array.isArray(slide.c) ? slide.c : [String(slide.c || '')];
  const statementText = stripMarkdown(
    items.length > 0 ? (Array.isArray(items[0]) ? items[0].join(' ') : String(items[0] || '')) : ''
  );
  const contextText = stripMarkdown(
    items.length > 1 ? (Array.isArray(items[1]) ? items[1].join(' ') : String(items[1] || '')) : ''
  );

  const hasImage = Boolean(slide.image_data);
  const currentScale = Math.round((slide.image_scale || 1.0) * 100);

  const handleStatementChange = (val) => {
    const next = [...(slide.c || [])];
    next[0] = val;
    onUpdateSlide({ c: next });
  };

  const handleContextChange = (val) => {
    const next = [...(slide.c || [])];
    next[1] = val;
    onUpdateSlide({ c: next });
  };

  const adjustImageScale = (delta) => {
    const next = Math.max(0.4, Math.min(1.8, (slide.image_scale || 1.0) + delta));
    onUpdateSlide({ image_scale: next });
    onPushHistory();
  };

  const removeImage = () => {
    onUpdateSlide({ image_data: null, image_query: null });
    onPushHistory();
  };

  return (
    <div className="flex flex-col w-full h-full p-8 select-none relative">
      {/* Header */}
      <div className="flex justify-between items-start w-full shrink-0 border-b border-slate-700/60 pb-3 mb-4">
        <EditableText
          tag="h1"
          value={slide.t || 'Executive Thesis'}
          onChange={(val) => onUpdateSlide({ t: val })}
          onBlur={onPushHistory}
          singleLine={true}
          className="slide-title-style text-2xl font-bold leading-tight rounded px-1 transition"
        />
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-mono font-semibold text-slate-500">
            {slideIndex + 1} / {totalSlides}
          </span>
        </div>
      </div>

      {/* Main Body */}
      {hasImage ? (
        <div className="flex-1 flex flex-row gap-5 w-full h-full overflow-hidden items-stretch">
          {/* Left Quote Card */}
          <div className="flex-1 flex flex-col justify-between slide-card-block rounded-2xl p-7 relative overflow-hidden">
            <div className="my-auto py-2">
              <blockquote className="text-2xl font-extrabold leading-snug tracking-tight">
                <EditableText
                  tag="span"
                  value={statementText || 'Autonomous intelligence transforms execution velocity.'}
                  onChange={handleStatementChange}
                  onBlur={onPushHistory}
                  singleLine={false}
                  className="rounded px-1 transition cursor-text"
                  style={{ color: 'var(--slide-title)' }}
                />
              </blockquote>

              <EditableText
                tag="p"
                value={contextText || 'Strategic alignment across all enterprise layers.'}
                onChange={handleContextChange}
                onBlur={onPushHistory}
                singleLine={false}
                className="text-sm font-normal leading-relaxed mt-4 rounded px-1 transition cursor-text"
                style={{ color: 'var(--slide-text)' }}
              />
            </div>

            <div
              className="pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs font-medium"
              style={{ color: 'var(--slide-text-muted)' }}
            >
              <span className="font-mono text-[10px] tracking-wider uppercase">CORE TAKEAWAY</span>
            </div>
          </div>

          {/* Right Image Card */}
          <div className="w-5/12 flex flex-col slide-card-block rounded-2xl p-3 relative overflow-hidden items-center justify-center group">
            <div
              className="relative max-w-full max-h-full flex items-center justify-center transition-all duration-150"
              style={{ width: `${currentScale}%`, height: `${currentScale}%` }}
            >
              <div className="opacity-0 group-hover:opacity-100 absolute -top-4 z-40 flex items-center gap-1.5 bg-slate-900/95 backdrop-blur-md text-white px-2.5 py-1 rounded-full shadow-xl text-xs border border-slate-700 transition">
                <button
                  type="button"
                  onClick={() => adjustImageScale(-0.1)}
                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-700 font-bold"
                  title="Scale down"
                >
                  −
                </button>
                <span className="text-[11px] font-mono font-semibold px-1 text-sky-300">
                  {currentScale}%
                </span>
                <button
                  type="button"
                  onClick={() => adjustImageScale(0.1)}
                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-700 font-bold"
                  title="Scale up"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={onOpenPhotoModal}
                  className="text-sky-400 hover:text-sky-300 px-1 py-0.5 rounded text-[11px]"
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={removeImage}
                  className="text-rose-400 hover:text-rose-300 px-1 py-0.5 rounded text-[11px]"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              <img
                src={slide.image_data}
                alt="Statement visual"
                className="w-full h-full object-contain rounded-xl pointer-events-none select-none"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between slide-card-block rounded-2xl p-10 relative overflow-hidden">
          {/* Subtle ambient accent glow */}
          <div
            className="absolute -right-20 -top-20 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ backgroundColor: 'var(--slide-accent)' }}
          />

          <div className="my-auto max-w-4xl py-2">
            <blockquote className="text-3xl font-extrabold leading-tight tracking-tight">
              <EditableText
                tag="span"
                value={statementText || 'Autonomous intelligence transforms execution velocity.'}
                onChange={handleStatementChange}
                onBlur={onPushHistory}
                singleLine={false}
                className="rounded px-1 transition cursor-text"
                style={{ color: 'var(--slide-title)' }}
              />
            </blockquote>

            <EditableText
              tag="p"
              value={contextText || 'Strategic alignment across all enterprise layers.'}
              onChange={handleContextChange}
              onBlur={onPushHistory}
              singleLine={false}
              className="text-base font-normal leading-relaxed mt-5 rounded px-1 transition cursor-text"
              style={{ color: 'var(--slide-text)' }}
            />
          </div>

          <div
            className="pt-4 border-t border-slate-700/50 flex items-center justify-between text-xs font-medium"
            style={{ color: 'var(--slide-text-muted)' }}
          >
            <span className="font-mono text-[11px] tracking-wider uppercase">CORE TAKEAWAY</span>
          </div>
        </div>
      )}
    </div>
  );
}
