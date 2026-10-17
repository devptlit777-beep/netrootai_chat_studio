import React from 'react';
import { useTranslation } from 'react-i18next';
import EditableText from '../EditableText';
import { stripMarkdown } from '../pptConstants';
import { Plus, X } from 'lucide-react';

export default function StatsLayout({
  slide,
  slideIndex,
  totalSlides,
  onUpdateSlide,
  onPushHistory,
}) {
  const { t } = useTranslation();
  const items = Array.isArray(slide.c) ? slide.c : [];

  const parseItem = (item) => {
    let num = '10x';
    let label = 'Metric';
    let desc = '';

    if (Array.isArray(item)) {
      num = item[0] || '10x';
      label = item[1] || 'Metric';
      desc = item[2] || '';
    } else if (typeof item === 'object' && item !== null) {
      num = item.stat || item.metric || '10x';
      label = item.label || item.title || 'Metric';
      desc = item.desc || item.subtext || '';
    } else if (typeof item === 'string') {
      const parts = item.split(/[:|–-]/);
      num = parts[0]?.trim() || '10x';
      label = parts[1]?.trim() || 'Metric';
      desc = parts.slice(2).join(' ').trim();
    }

    return {
      num: stripMarkdown(String(num || '')),
      label: stripMarkdown(String(label || '')),
      desc: stripMarkdown(String(desc || '')),
    };
  };

  const handleUpdateItem = (idx, field, val) => {
    const next = items.map((it, i) => {
      if (i !== idx) return it;
      const parsed = parseItem(it);
      parsed[field] = val;
      return [parsed.num, parsed.label, parsed.desc];
    });
    onUpdateSlide({ c: next });
  };

  const handleAddStat = () => {
    const next = [
      ...items,
      ['+85%', 'Strategic Growth', 'Demonstrated year-over-year acceleration across core customer segments.'],
    ];
    onUpdateSlide({ c: next });
    onPushHistory();
  };

  const handleDeleteStat = (idx) => {
    const next = items.filter((_, i) => i !== idx);
    onUpdateSlide({ c: next });
    onPushHistory();
  };

  const colsClass =
    items.length <= 2 ? 'grid-cols-2' : items.length === 3 ? 'grid-cols-3' : 'grid-cols-4';

  return (
    <div className="flex flex-col w-full h-full p-8 select-none relative">
      {/* Slide Header: Clean Title & Slide Counter */}
      <div className="flex justify-between items-start w-full shrink-0 border-b border-slate-700/60 pb-3 mb-4">
        <EditableText
          tag="h1"
          value={slide.t || 'Key Performance Indicators'}
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

      {/* Grid Bento KPI Cards */}
      <div className={`flex-1 grid ${colsClass} gap-4 w-full h-full overflow-hidden items-stretch`}>
        {items.map((rawItem, idx) => {
          const { num, label, desc } = parseItem(rawItem);

          return (
            <div
              key={idx}
              className="flex flex-col justify-start gap-3.5 slide-card-block rounded-xl p-5 relative overflow-hidden group hover:border-sky-500/50 transition"
            >
              <div className="w-full">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-slate-400">
                    KPI #{String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: 'var(--slide-badge-bg)',
                        color: 'var(--slide-badge-text)',
                      }}
                    >
                      ▲ Key Stat
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteStat(idx)}
                      className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-0.5 rounded transition"
                      title={t('ppt.deleteStat')}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Metric Number */}
                <EditableText
                  tag="div"
                  value={num}
                  onChange={(val) => handleUpdateItem(idx, 'num', val)}
                  onBlur={onPushHistory}
                  singleLine={true}
                  className="text-4xl sm:text-5xl font-black font-mono tracking-tight rounded px-1 transition"
                  style={{ color: 'var(--slide-accent)' }}
                />

                {/* Metric Label */}
                <EditableText
                  tag="h2"
                  value={label}
                  onChange={(val) => handleUpdateItem(idx, 'label', val)}
                  onBlur={onPushHistory}
                  singleLine={true}
                  className="text-base sm:text-lg font-bold mt-2 rounded px-1 transition leading-snug"
                  style={{ color: 'var(--slide-title)' }}
                />
              </div>

              {/* Subtle accent divider to anchor the card */}
              <div className="w-full border-t border-white/10 my-0.5" />

              {/* Metric Description & Strategic Points */}
              <div className="flex-1 w-full overflow-y-auto pr-1">
                <EditableText
                  tag="p"
                  value={desc}
                  onChange={(val) => handleUpdateItem(idx, 'desc', val)}
                  onBlur={onPushHistory}
                  singleLine={false}
                  className="text-xs sm:text-sm leading-relaxed rounded px-1 transition text-balance"
                  style={{ color: 'var(--slide-text)' }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Stat pill button */}
      <div className="mt-3 flex items-center justify-start shrink-0">
        <button
          type="button"
          onClick={handleAddStat}
          className="text-xs font-semibold text-sky-400 hover:text-sky-300 border border-dashed border-sky-500/40 hover:border-sky-400 rounded-lg px-3 py-1 flex items-center gap-1.5 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t('ppt.addMetric')}</span>
        </button>
      </div>
    </div>
  );
}
