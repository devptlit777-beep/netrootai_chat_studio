import React from 'react';
import EditableText from '../EditableText';
import BulletList from './BulletList';
import { Image as ImageIcon, Trash2, Sliders } from 'lucide-react';

export default function TitleImageLayout({
  slide,
  slideIndex,
  totalSlides,
  onUpdateSlide,
  onOpenPhotoModal,
  onOpenRestyleModal,
  onGeneratePointWithAI,
  onPushHistory,
  isGeneratingAI,
}) {
  const hasImage = Boolean(slide.image_data);
  const currentScale = Math.round((slide.image_scale || 1.0) * 100);

  const handleItemsChange = (items) => {
    onUpdateSlide({ c: items });
  };

  const adjustImageScale = (delta) => {
    const next = Math.max(0.4, Math.min(1.8, (slide.image_scale || 1.0) + delta));
    onUpdateSlide({ image_scale: next });
    onPushHistory();
  };

  const handleSliderScale = (val) => {
    const scale = parseFloat(val) / 100;
    onUpdateSlide({ image_scale: scale });
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
          value={slide.t || 'Visual Analysis & Architecture'}
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

      {/* Main Split Layout */}
      <div className="flex-1 flex flex-row gap-5 w-full h-full overflow-hidden items-stretch">
        {/* Left Points Column */}
        <div className="flex-1 flex flex-col slide-card-block rounded-xl p-5 overflow-hidden">
          <BulletList
            items={Array.isArray(slide.c) ? slide.c : [slide.c].filter(Boolean)}
            isColumn={false}
            onChangeItems={handleItemsChange}
            onOpenRestyleModal={onOpenRestyleModal}
            onGeneratePointWithAI={onGeneratePointWithAI}
            onPushHistory={onPushHistory}
            isGeneratingAI={isGeneratingAI}
          />
        </div>

        {/* Right Visual Card (5/12) */}
        <div className="w-5/12 flex flex-col slide-card-block rounded-xl p-3 relative overflow-hidden items-center justify-center group">
          {hasImage ? (
            <>
              {/* Source Badge */}
              {slide.attached_image_id ? (
                <span className="absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 z-10">
                  📎 User Chart
                </span>
              ) : slide.image_query ? (
                <span className="absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 z-10 truncate max-w-[150px]">
                  🌐 {slide.image_query}
                </span>
              ) : null}

              <div
                className="relative max-w-full max-h-full flex items-center justify-center transition-all duration-150"
                style={{ width: `${currentScale}%`, height: `${currentScale}%` }}
              >
                {/* Control Pill */}
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
                  <input
                    type="range"
                    min="40"
                    max="150"
                    step="5"
                    value={currentScale}
                    onChange={(e) => handleSliderScale(e.target.value)}
                    onMouseUp={onPushHistory}
                    className="w-14 h-1 accent-sky-500 cursor-pointer"
                    title="Image size"
                  />
                  <span className="w-px h-3.5 bg-slate-700 mx-0.5" />
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
                  alt={slide.image_query || 'Slide visual'}
                  className="w-full h-full object-contain rounded-lg pointer-events-none select-none"
                />
              </div>
            </>
          ) : (
            <div
              onClick={onOpenPhotoModal}
              className="text-center text-slate-500 p-6 cursor-pointer hover:text-sky-400 hover:bg-white/5 rounded-xl transition flex flex-col items-center justify-center w-full h-full border border-dashed border-slate-700 hover:border-sky-500/50"
              title="Click to add photo or visual"
            >
              <ImageIcon className="w-8 h-8 mb-2 opacity-40 text-sky-400" />
              <p className="text-xs font-semibold">+ Add Visual</p>
              <span className="text-[10px] text-slate-500 mt-1">Unsplash / Wikipedia search</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
