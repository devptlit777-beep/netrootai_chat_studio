import React from 'react';
import EditableText from '../EditableText';
import BulletList from './BulletList';

export default function TitleContentLayout({
  slide,
  slideIndex,
  totalSlides,
  onUpdateSlide,
  onOpenRestyleModal,
  onGeneratePointWithAI,
  onPushHistory,
  isGeneratingAI,
}) {
  const handleItemsChange = (items) => {
    onUpdateSlide({ c: items });
  };

  return (
    <div className="flex flex-col w-full h-full p-8 select-none relative">
      {/* Header */}
      <div className="flex justify-between items-start w-full shrink-0 border-b border-slate-700/60 pb-3 mb-4">
        <EditableText
          tag="h1"
          value={slide.t || 'Strategic Overview'}
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col slide-card-block rounded-xl p-6 overflow-hidden">
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
    </div>
  );
}
