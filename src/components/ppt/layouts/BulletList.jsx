import React from 'react';
import { useTranslation } from 'react-i18next';
import EditableText from '../EditableText';
import { getSemanticIcon, stripMarkdown } from '../pptConstants';
import { Sparkles, Plus, X, Wand2 } from 'lucide-react';

export default function BulletList({
  items = [],
  isColumn = false,
  colIdx = 0,
  onChangeItems,
  onOpenRestyleModal,
  onGeneratePointWithAI,
  onPushHistory,
  isGeneratingAI = false,
}) {
  const { t } = useTranslation();
  const handleItemChange = (idx, newText) => {
    const next = [...items];
    next[idx] = newText;
    onChangeItems(next);
  };

  const handleDeleteItem = (idx) => {
    const next = items.filter((_, i) => i !== idx);
    onChangeItems(next);
    onPushHistory();
  };

  const handleAddItem = () => {
    const next = [...items, ''];
    onChangeItems(next);
    onPushHistory();
  };

  const handleInsertAfter = (idx) => {
    const next = [...items];
    next.splice(idx + 1, 0, '');
    onChangeItems(next);
    onPushHistory();
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleInsertAfter(idx);
    } else if (e.key === 'Backspace' && (!items[idx] || items[idx].trim() === '')) {
      e.preventDefault();
      handleDeleteItem(idx);
    }
  };

  return (
    <div className="flex flex-col flex-1 justify-between overflow-hidden">
      <ul className={`w-full overflow-y-auto pr-1 ${isColumn ? 'space-y-2' : 'space-y-3'}`}>
        {items.map((rawItem, idx) => {
          const itemStr = stripMarkdown(
            Array.isArray(rawItem) ? rawItem.join(' - ') : String(rawItem ?? '')
          );

          // Check if there is a colon for leading bold styling
          const colonIdx = itemStr.indexOf(':');
          const hasLead = colonIdx > 0 && colonIdx <= 45 && !itemStr.startsWith('http');
          const lead = hasLead ? itemStr.slice(0, colonIdx + 1) : null;
          const body = hasLead ? itemStr.slice(colonIdx + 1) : itemStr;

          const icon = itemStr.trim() ? getSemanticIcon(itemStr) : '•';

          return (
            <li
              key={idx}
              className="group/point flex items-start gap-2.5 p-2 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 transition relative"
            >
              {/* Drag Handle icon */}
              <span className="cursor-grab active:cursor-grabbing text-slate-500 group-hover/point:text-slate-300 text-xs py-1 select-none shrink-0 font-mono">
                ⠿
              </span>

              {/* Semantic Icon */}
              <span className="text-sm select-none shrink-0 py-0.5" title={t('ppt.semanticIcon') || 'Point bullet'}>
                {icon}
              </span>

              {/* Text content */}
              <div className="flex-1 flex flex-wrap items-baseline gap-1">
                {hasLead && (
                  <EditableText
                    tag="span"
                    value={lead}
                    onChange={(val) => {
                      const full = `${val}${body}`;
                      handleItemChange(idx, full);
                    }}
                    onBlur={onPushHistory}
                    onKeyDown={(e) => handleKeyDown(e, idx)}
                    singleLine={true}
                    className="font-bold rounded px-1 transition"
                    style={{ color: 'var(--slide-title)' }}
                  />
                )}
                <EditableText
                  tag="span"
                  value={body}
                  placeholder="Click to add text or point..."
                  onChange={(val) => {
                    const full = hasLead ? `${lead}${val}` : val;
                    handleItemChange(idx, full);
                  }}
                  onBlur={onPushHistory}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  singleLine={false}
                  className={`flex-1 rounded px-1 transition cursor-text ${
                    isColumn ? 'text-xs md:text-sm leading-relaxed' : 'text-sm md:text-base leading-relaxed'
                  }`}
                  style={{ color: 'var(--slide-text)' }}
                />
              </div>

              {/* Hover Actions: Restyle + Delete */}
              <div className="opacity-0 group-hover/point:opacity-100 flex items-center gap-1 transition shrink-0">
                {onOpenRestyleModal && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenRestyleModal({
                        isColumn,
                        colIdx,
                        pointIdx: idx,
                        text: itemStr,
                      });
                    }}
                    className="text-purple-400 hover:text-purple-200 hover:bg-purple-950/60 px-1.5 py-0.5 rounded text-[11px] font-semibold border border-purple-500/30 flex items-center gap-1 transition cursor-pointer shadow-sm"
                    title={t('ppt.restylePointTitle')}
                  >
                    <Wand2 className="w-3 h-3 text-purple-400" />
                    <span className="text-[10px] hidden sm:inline">{t('ppt.restylePoint')}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteItem(idx);
                  }}
                  className="text-slate-500 hover:text-rose-400 p-1 rounded text-xs transition"
                  title={t('ppt.deletePoint')}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Footer action buttons: + Add Point & ✨ Auto-Generate with AI */}
      <div className="mt-3 flex flex-wrap items-center gap-2 self-start shrink-0">
        <button
          type="button"
          onClick={handleAddItem}
          className="text-[11px] sm:text-xs font-semibold text-sky-400 hover:text-sky-300 border border-dashed border-sky-500/40 hover:border-sky-400/80 rounded-lg px-2.5 py-1 flex items-center gap-1 transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t('ppt.addPoint')}</span>
        </button>

        {onGeneratePointWithAI && (
          <button
            type="button"
            onClick={() => onGeneratePointWithAI(isColumn, colIdx)}
            disabled={isGeneratingAI}
            className="text-[11px] sm:text-xs font-semibold text-purple-300 hover:text-purple-100 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/40 hover:border-purple-400 rounded-lg px-2.5 py-1 flex items-center gap-1 transition cursor-pointer shadow-sm disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAI ? 'animate-spin' : ''}`} />
            <span>{t('ppt.generateWithAI')}</span>
          </button>
        )}
      </div>
    </div>
  );
}
