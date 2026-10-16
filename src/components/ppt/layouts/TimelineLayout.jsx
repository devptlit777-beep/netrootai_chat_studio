import React from 'react';
import { useTranslation } from 'react-i18next';
import EditableText from '../EditableText';
import { stripMarkdown } from '../pptConstants';
import { Plus, X, ArrowRight } from 'lucide-react';

export default function TimelineLayout({
  slide,
  slideIndex,
  totalSlides,
  onUpdateSlide,
  onPushHistory,
}) {
  const { t } = useTranslation();
  const steps = Array.isArray(slide.c) ? slide.c : [];

  const parseStep = (stepItem, idx) => {
    let badge = `Phase ${String(idx + 1).padStart(2, '0')}`;
    let title = 'Milestone Execution';
    let desc = '';

    if (Array.isArray(stepItem)) {
      if (stepItem.length === 1) {
        title = stepItem[0];
      } else if (stepItem.length === 2) {
        title = stepItem[0];
        desc = stepItem[1];
      } else {
        badge = stepItem[0];
        title = stepItem[1];
        desc = stepItem.slice(2).join(' — ');
      }
    } else if (typeof stepItem === 'string') {
      const parts = stepItem.split(':');
      if (parts.length >= 2) {
        badge = parts[0].trim();
        title = parts[1].trim();
      } else {
        title = stepItem;
      }
    }

    return {
      badge: stripMarkdown(String(badge || '')),
      title: stripMarkdown(String(title || '')),
      desc: stripMarkdown(String(desc || '')),
    };
  };

  const handleUpdateStep = (idx, field, val) => {
    const next = steps.map((st, i) => {
      if (i !== idx) return st;
      const parsed = parseStep(st, i);
      parsed[field] = val;
      return [parsed.badge, parsed.title, parsed.desc];
    });
    onUpdateSlide({ c: next });
  };

  const handleAddStep = () => {
    const nextIdx = steps.length + 1;
    const next = [
      ...steps,
      [`Phase ${String(nextIdx).padStart(2, '0')}`, 'Scale & Expansion', 'Deploy enterprise automation pipelines and optimize latency.'],
    ];
    onUpdateSlide({ c: next });
    onPushHistory();
  };

  const handleDeleteStep = (idx) => {
    const next = steps.filter((_, i) => i !== idx);
    onUpdateSlide({ c: next });
    onPushHistory();
  };

  return (
    <div className="flex flex-col w-full h-full p-8 select-none relative">
      {/* Header */}
      <div className="flex justify-between items-start w-full shrink-0 border-b border-slate-700/60 pb-3 mb-4">
        <EditableText
          tag="h1"
          value={slide.t || 'Strategic Roadmap'}
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

      {/* Timeline Steps Flow */}
      <div className="flex-1 flex flex-row gap-4 w-full h-full overflow-hidden items-stretch relative">
        {steps.map((rawStep, idx) => {
          const { badge, title, desc } = parseStep(rawStep, idx);

          return (
            <React.Fragment key={idx}>
              <div className="flex-1 min-w-[180px] flex flex-col justify-between slide-card-block rounded-xl p-4 relative overflow-hidden group hover:border-sky-500/50 transition">
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs font-mono shrink-0 shadow-sm"
                        style={{
                          backgroundColor: 'var(--slide-badge-bg)',
                          color: 'var(--slide-badge-text)',
                          border: '1px solid var(--slide-accent)',
                        }}
                      >
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <EditableText
                        tag="span"
                        value={badge}
                        onChange={(val) => handleUpdateStep(idx, 'badge', val)}
                        onBlur={onPushHistory}
                        singleLine={true}
                        className="text-[10px] font-bold uppercase tracking-wider font-mono text-slate-400 rounded px-1 truncate max-w-[90px]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteStep(idx)}
                      className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-0.5 rounded transition"
                      title={t('ppt.deleteStep')}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  <EditableText
                    tag="h2"
                    value={title}
                    onChange={(val) => handleUpdateStep(idx, 'title', val)}
                    onBlur={onPushHistory}
                    singleLine={true}
                    className="text-sm font-bold mb-2 pb-1.5 border-b border-slate-700/60 rounded px-1 transition"
                    style={{ color: 'var(--slide-title)' }}
                  />
                </div>

                <EditableText
                  tag="div"
                  value={desc}
                  onChange={(val) => handleUpdateStep(idx, 'desc', val)}
                  onBlur={onPushHistory}
                  singleLine={false}
                  className="flex-1 text-xs leading-relaxed rounded px-1 transition mt-1"
                  style={{ color: 'var(--slide-text)' }}
                />
              </div>

              {/* Connector Arrow */}
              {idx < steps.length - 1 && (
                <div className="flex items-start justify-center shrink-0 pt-6 text-sky-400">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center bg-slate-900 border border-slate-700 shadow-sm text-sky-400">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Add Step button */}
      <div className="mt-3 flex items-center justify-start shrink-0">
        <button
          type="button"
          onClick={handleAddStep}
          className="text-xs font-semibold text-sky-400 hover:text-sky-300 border border-dashed border-sky-500/40 hover:border-sky-400 rounded-lg px-3 py-1 flex items-center gap-1.5 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t('ppt.addPhase')}</span>
        </button>
      </div>
    </div>
  );
}
