import React from 'react';
import EditableText from '../EditableText';
import BulletList from './BulletList';

export default function ThreeColLayout({
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
    : [rawCols[0] || 'Strategic Pillar 1', 'Foundational operational architecture.'];
  const col1 = Array.isArray(rawCols[1])
    ? rawCols[1]
    : [rawCols[1] || 'Strategic Pillar 2', 'Workflow automation & model latency.'];
  const col2 = Array.isArray(rawCols[2])
    ? rawCols[2]
    : [rawCols[2] || 'Strategic Pillar 3', 'Enterprise integration & scale.'];

  const columns = [col0, col1, col2];

  const handleColumnHeaderChange = (colIdx, title) => {
    const nextCols = [...columns];
    const currentItems = [...(nextCols[colIdx] || [])];
    currentItems[0] = title;
    nextCols[colIdx] = currentItems;
    onUpdateSlide({ c: nextCols });
  };

  const handleColumnItemsChange = (colIdx, items) => {
    const nextCols = [...columns];
    const header = nextCols[colIdx]?.[0] || `Pillar ${colIdx + 1}`;
    nextCols[colIdx] = [header, ...items];
    onUpdateSlide({ c: nextCols });
  };

  return (
    <div className="flex flex-col w-full h-full p-8 select-none relative">
      {/* Header */}
      <div className="flex justify-between items-start w-full shrink-0 border-b border-slate-700/60 pb-3 mb-4">
        <EditableText
          tag="h1"
          value={slide.t || 'Strategic Pillars'}
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

      {/* 3-Columns */}
      <div className="flex-1 flex flex-row gap-4 w-full h-full overflow-hidden items-stretch">
        {columns.map((colData, colIdx) => {
          const header = colData[0] || `Pillar ${colIdx + 1}`;
          const items = colData.slice(1);

          return (
            <div
              key={colIdx}
              className="flex-1 flex flex-col slide-card-block rounded-xl p-4 overflow-hidden"
            >
              <EditableText
                tag="h2"
                value={header}
                onChange={(val) => handleColumnHeaderChange(colIdx, val)}
                onBlur={onPushHistory}
                singleLine={true}
                className="text-sm font-bold mb-2 pb-1.5 border-b border-slate-700/60 rounded px-1 transition shrink-0"
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
