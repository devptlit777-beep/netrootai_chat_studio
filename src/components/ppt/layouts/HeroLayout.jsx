import { useTranslation } from 'react-i18next';
import EditableText from '../EditableText';

export default function HeroLayout({
  slide,
  slideIndex,
  totalSlides,
  onUpdateSlide,
  onOpenPhotoModal,
  onPushHistory,
}) {
  const { t } = useTranslation();
  const subtitle = Array.isArray(slide.c) && slide.c[0]
    ? (Array.isArray(slide.c[0]) ? slide.c[0].join(' ') : slide.c[0])
    : 'Strategic Vision & Executive Briefing';

  const presenter = Array.isArray(slide.c) && slide.c[1]
    ? (Array.isArray(slide.c[1]) ? slide.c[1].join(' ') : slide.c[1])
    : 'NetRoot AI • Strategic Briefing 2026';

  const hasImage = Boolean(slide.image_data);
  const currentScale = Math.round((slide.image_scale || 1.0) * 100);

  const handleTitleChange = (val) => {
    onUpdateSlide({ t: val });
  };

  const handleSubtitleChange = (val) => {
    const newC = [...(slide.c || [])];
    newC[0] = val;
    onUpdateSlide({ c: newC });
  };

  const handlePresenterChange = (val) => {
    const newC = [...(slide.c || [])];
    newC[1] = val;
    onUpdateSlide({ c: newC });
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
      {/* Slide 1 Header Bar */}
      <div className="flex justify-between items-center w-full shrink-0 border-b border-slate-700/60 pb-2.5 mb-3.5 z-20">
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-bold uppercase tracking-wider font-mono px-2 py-0.5 rounded shadow-sm"
            style={{
              backgroundColor: 'var(--slide-badge-bg)',
              color: 'var(--slide-badge-text)',
              border: '1px solid var(--slide-accent)',
            }}
          >
            ★ Title Slide
          </span>
          <span className="text-xs font-semibold text-slate-400 truncate max-w-[280px]">
            {slide.t || 'Executive Briefing'}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-mono font-semibold text-slate-500">
            {slideIndex + 1} / {totalSlides}
          </span>
        </div>
      </div>

      {/* Hero Main Body: Landscape 2-Column (Left: Text, Right: Visual) */}
      <div className={`flex-1 flex flex-row ${hasImage ? 'gap-5' : ''} w-full h-full overflow-hidden items-stretch`}>
        {/* Left Content Card */}
        <div className="flex-1 flex flex-col justify-between slide-card-block rounded-2xl p-7 relative overflow-hidden">
          {/* Ambient Radial Accent Glow */}
          <div
            className="absolute -right-20 -top-20 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ backgroundColor: 'var(--slide-accent)' }}
          />

          <div className="my-auto py-2">
            <EditableText
              tag="h1"
              value={slide.t || 'Untitled Presentation'}
              onChange={handleTitleChange}
              onBlur={onPushHistory}
              singleLine={false}
              className="slide-title-style text-3xl font-black leading-tight tracking-tight focus:ring-1 focus:ring-blue-400 rounded px-1"
            />

            <EditableText
              tag="p"
              value={subtitle}
              onChange={handleSubtitleChange}
              onBlur={onPushHistory}
              className="text-base font-normal leading-relaxed mt-3 focus:ring-1 focus:ring-blue-400 rounded px-1"
              style={{ color: 'var(--slide-text)' }}
            />
          </div>

          {/* Footer Row */}
          <div
            className="pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs font-medium"
            style={{ color: 'var(--slide-text-muted)' }}
          >
            <EditableText
              tag="span"
              value={presenter}
              onChange={handlePresenterChange}
              onBlur={onPushHistory}
              singleLine={true}
              className="focus:ring-1 focus:ring-blue-400 rounded px-1"
            />
          </div>
        </div>

        {/* Right Hero Image Card */}
        {hasImage && (
          <div className="w-5/12 flex flex-col slide-card-block rounded-2xl p-3 relative overflow-hidden items-center justify-center group">
            <div
              className="relative max-w-full max-h-full flex items-center justify-center transition-all duration-150"
              style={{ width: `${currentScale}%`, height: `${currentScale}%` }}
            >
              {/* Image Control Pill on Hover */}
              <div className="opacity-0 group-hover:opacity-100 absolute -top-3 z-40 flex items-center gap-1.5 bg-slate-900/95 backdrop-blur-md text-white px-2.5 py-1 rounded-full shadow-xl text-xs border border-slate-700 transition">
                <button
                  type="button"
                  onClick={() => adjustImageScale(-0.1)}
                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-700 font-bold"
                  title={t('ppt.scaleDown')}
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
                  title={t('ppt.scaleUp')}
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={onOpenPhotoModal}
                  className="text-blue-400 hover:text-blue-300 px-1 py-0.5 rounded text-[11px] ml-1"
                >
                  {t('ppt.replace')}
                </button>
                <button
                  type="button"
                  onClick={removeImage}
                  className="text-rose-400 hover:text-rose-300 px-1 py-0.5 rounded text-[11px]"
                >
                  {t('ppt.delete')}
                </button>
              </div>

              <img
                src={slide.image_data}
                alt="Hero Visual"
                className="w-full h-full object-contain rounded-xl pointer-events-none select-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
