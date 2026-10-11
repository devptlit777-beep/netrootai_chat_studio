import React from 'react';
import EditableText from '../EditableText';
import BulletList from './BulletList';

export default function TwoColLayout({
  slide,
  slideIndex,
  totalSlides,
  onUpdateSlide,
  onOpenRestyleModal,
  onGeneratePointWithAI,
  onPushHistory,
  isGeneratingAI,
}) {
  const rawCols = Array.isArray(slide.c) ? slide.c : [];
  const col0 = Array.isArray(rawCols[0])
    ? rawCols[0]
    : [rawCols[0] || 'Strategic Focus Area A', 'Pillar detail and operational insight.'];
  const col1 = Array.isArray(rawCols[1])
    ? rawCols[1]
    : [rawCols[1] || 'Strategic Focus Area B', 'Execution deliverable and scale target.'];

  const columns = [col0, col1];

  const handleColumnHeaderChange = (colIdx, title) => {
    const nextCols = [...columns];
    const currentItems = [...(nextCols[colIdx] || [])];
    currentItems[0] = title;
    nextCols[colIdx] = currentItems;
    onUpdateSlide({ c: nextCols });
  };

  const handleColumnItemsChange = (colIdx, items) => {
    const nextCols = [...columns];
    const header = nextCols[colIdx]?.[0] || `Column ${colIdx + 1}`;
    nextCols[colIdx] = [header, ...items];
    onUpdateSlide({ c: nextCols });
  };

  return (
    <div className="flex flex-col w-full h-full p-8 select-none relative">
      {/* Header */}
      <div className="flex justify-between items-start w-full shrink-0 border-b border-slate-700/60 pb-3 mb-4">
        <EditableText
          tag="h1"
          value={slide.t || 'Comparative Analysis'}
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

      {/* 2-Columns */}
      <div className="flex-1 flex flex-row gap-5 w-full h-full overflow-hidden items-stretch">
        {columns.map((colData, colIdx) => {
          const header = colData[0] || `Column ${colIdx + 1}`;
          const items = colData.slice(1);

          return (
            <div
              key={colIdx}
              className="flex-1 flex flex-col slide-card-block rounded-xl p-5 overflow-hidden"
            >
              <EditableText
                tag="h2"
                value={header}
                onChange={(val) => handleColumnHeaderChange(colIdx, val)}
                onBlur={onPushHistory}
                singleLine={true}
                className="text-base font-bold mb-3 pb-2 border-b border-slate-700/60 rounded px-1 transition shrink-0"
                style={{ color: 'var(--slide-title)' }}
              />

              <BulletList
                items={items}
                isColumn={true}
                colIdx={colIdx}
                onChangeItems={(newItems) => handleColumnItemsChange(colIdx, newItems)}
                onOpenRestyleModal={onOpenRestyleModal}
                onGeneratePointWithAI={onGeneratePointWithAI}
                onPushHistory={onPushHistory}
                isGeneratingAI={isGeneratingAI}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
