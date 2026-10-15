import React from 'react';
import EditableText from '../EditableText';
import { stripMarkdown } from '../pptConstants';
import { Plus, X, ArrowRight } from 'lucide-react';

export default function FlowchartLayout({
  slide,
  slideIndex,
  totalSlides,
  onUpdateSlide,
  onPushHistory,
}) {
  const nodes = Array.isArray(slide.c) ? slide.c : [];

  const parseNode = (nodeItem, idx) => {
    let title = 'Process Node';
    let tech = `STEP ${idx + 1}`;
    let desc = '';

    if (Array.isArray(nodeItem)) {
      if (nodeItem.length === 1) title = nodeItem[0];
      else if (nodeItem.length === 2) {
        title = nodeItem[0];
        tech = nodeItem[1];
      } else {
        title = nodeItem[0];
        tech = nodeItem[1];
        desc = nodeItem.slice(2).join(' — ');
      }
    } else if (typeof nodeItem === 'object' && nodeItem !== null) {
      title = nodeItem.title || nodeItem.name || 'Process Node';
      tech = nodeItem.tech || nodeItem.subtitle || `STEP ${idx + 1}`;
      desc = nodeItem.desc || nodeItem.details || '';
    } else if (typeof nodeItem === 'string') {
      const parts = nodeItem.split(':');
      title = parts[0]?.trim() || 'Node';
      desc = parts.slice(1).join(':').trim();
    }

    return {
      title: stripMarkdown(String(title || '')),
      tech: stripMarkdown(String(tech || '')),
      desc: stripMarkdown(String(desc || '')),
    };
  };

  const handleUpdateNode = (idx, field, val) => {
    const next = nodes.map((nd, i) => {
      if (i !== idx) return nd;
      const parsed = parseNode(nd, i);
      parsed[field] = val;
      return [parsed.title, parsed.tech, parsed.desc];
    });
    onUpdateSlide({ c: next });
  };

  const handleAddNode = () => {
    const nextIdx = nodes.length + 1;
    const next = [
      ...nodes,
      [`System Execution #${nextIdx}`, `STEP ${nextIdx}`, 'Autonomous agent task runner and state verification loop.'],
    ];
    onUpdateSlide({ c: next });
    onPushHistory();
  };

  const handleDeleteNode = (idx) => {
    const next = nodes.filter((_, i) => i !== idx);
    onUpdateSlide({ c: next });
    onPushHistory();
  };

  return (
    <div className="flex flex-col w-full h-full p-8 select-none relative">
      {/* Header */}
      <div className="flex justify-between items-start w-full shrink-0 border-b border-slate-700/60 pb-3 mb-4">
        <EditableText
          tag="h1"
          value={slide.t || 'System Architecture Pipeline'}
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

      {/* Nodes Flow */}
      <div className="flex-1 flex flex-row gap-3 w-full h-full overflow-hidden items-stretch relative py-1">
        {nodes.map((rawNode, idx) => {
          const { title, tech, desc } = parseNode(rawNode, idx);

          return (
            <React.Fragment key={idx}>
              <div className="flex-1 min-w-[190px] flex flex-col justify-start gap-2.5 slide-card-block rounded-xl p-4 relative overflow-hidden group hover:border-sky-500/50 transition">
                <div className="w-full">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-slate-400">
                      STEP {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <EditableText
                        tag="span"
                        value={tech}
                        onChange={(val) => handleUpdateNode(idx, 'tech', val)}
                        onBlur={onPushHistory}
                        singleLine={true}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full font-mono rounded"
                        style={{
                          backgroundColor: 'var(--slide-badge-bg)',
                          color: 'var(--slide-badge-text)',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteNode(idx)}
                        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-0.5 rounded transition"
                        title="Delete node"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <EditableText
                    tag="h2"
                    value={title}
                    onChange={(val) => handleUpdateNode(idx, 'title', val)}
                    onBlur={onPushHistory}
                    singleLine={true}
                    className="text-sm font-bold pb-1.5 border-b border-slate-700/60 rounded px-1 transition"
                    style={{ color: 'var(--slide-title)' }}
                  />
                </div>

                <div className="flex-1 flex flex-col min-h-0 overflow-y-auto pr-0.5">
                  <EditableText
                    tag="p"
                    value={desc}
                    onChange={(val) => handleUpdateNode(idx, 'desc', val)}
                    onBlur={onPushHistory}
                    singleLine={false}
                    className="text-xs leading-relaxed rounded px-1 transition whitespace-pre-line"
                    style={{ color: 'var(--slide-text)' }}
                  />
                </div>
              </div>

              {/* Animated connector arrow */}
              {idx < nodes.length - 1 && (
                <div className="flex items-start justify-center shrink-0 pt-7 text-sky-400">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center bg-slate-900 border border-slate-700 shadow-sm text-sky-400">
                    <ArrowRight className="w-3.5 h-3.5 animate-pulse" />
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
          onClick={handleAddNode}
          className="text-xs font-semibold text-sky-400 hover:text-sky-300 border border-dashed border-sky-500/40 hover:border-sky-400 rounded-lg px-3 py-1 flex items-center gap-1.5 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Pipeline Step</span>
        </button>
      </div>
    </div>
  );
}
