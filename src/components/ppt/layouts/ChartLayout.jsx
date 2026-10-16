import React from 'react';
import { useTranslation } from 'react-i18next';
import EditableText from '../EditableText';
import SvgChart from './SvgChart';
import BulletList from './BulletList';
import { BarChart3, TrendingUp, PieChart } from 'lucide-react';

export default function ChartLayout({
  slide,
  slideIndex,
  totalSlides,
  onUpdateSlide,
  onOpenRestyleModal,
  onGeneratePointWithAI,
  onPushHistory,
  isGeneratingAI,
}) {
  const { t } = useTranslation();
  const hasValidChartData =
    slide.chart_data &&
    Array.isArray(slide.chart_data.categories) &&
    slide.chart_data.categories.length > 0 &&
    Array.isArray(slide.chart_data.series) &&
    slide.chart_data.series.length > 0;

  const cd = hasValidChartData
    ? slide.chart_data
    : {
        title: slide.t || 'Data Insights',
        categories: [],
        series: [],
      };
  const currentType = slide.chart_type || 'bar';

  const handleChartTypeChange = (type) => {
    onUpdateSlide({ chart_type: type });
    onPushHistory();
  };

  const handleChartTitleChange = (val) => {
    onUpdateSlide({
      chart_data: {
        ...cd,
        title: val,
      },
    });
  };

  const handleTakeawaysChange = (items) => {
    onUpdateSlide({ c: items });
  };

  return (
    <div className="flex flex-col w-full h-full p-8 select-none relative">
      {/* Header */}
      <div className="flex justify-between items-start w-full shrink-0 border-b border-slate-700/60 pb-3 mb-4">
        <EditableText
          tag="h1"
          value={slide.t || 'Data & Analytics Insights'}
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

      {/* Main Content Area: Left Chart, Right Strategic Takeaways */}
      <div className="flex-1 flex flex-row gap-5 w-full h-full overflow-hidden items-stretch">
        {/* Left Chart Container (7/12) */}
        <div className="w-7/12 flex flex-col slide-card-block rounded-xl p-5 relative overflow-hidden justify-between">
          {/* Header with Type Switcher */}
          <div className="flex items-center justify-between mb-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-sky-400">
                📈 Live Visual
              </span>
              <EditableText
                tag="h2"
                value={cd.title || slide.t || 'Performance Benchmarks'}
                onChange={handleChartTitleChange}
                onBlur={onPushHistory}
                singleLine={true}
                className="text-sm font-bold rounded px-1 transition truncate max-w-[240px]"
                style={{ color: 'var(--slide-title)' }}
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-700/60 shrink-0">
              <button
                type="button"
                onClick={() => handleChartTypeChange('bar')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                  currentType === 'bar'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BarChart3 className="w-3 h-3" />
                <span>{t('ppt.chartTypes.Bar')}</span>
              </button>
              <button
                type="button"
                onClick={() => handleChartTypeChange('line')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                  currentType === 'line'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <TrendingUp className="w-3 h-3" />
                <span>{t('ppt.chartTypes.Line')}</span>
              </button>
              <button
                type="button"
                onClick={() => handleChartTypeChange('donut')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                  currentType === 'donut'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <PieChart className="w-3 h-3" />
                <span>{t('ppt.chartTypes.Donut')}</span>
              </button>
            </div>
          </div>

          {/* SVG Visual */}
          <div className="flex-1 w-full flex items-center justify-center relative overflow-hidden">
            {hasValidChartData ? (
              <SvgChart chartData={cd} chartType={currentType} />
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400">
                <BarChart3 className="w-10 h-10 mb-2 opacity-40 text-sky-400" />
                <p className="text-xs font-medium text-slate-300">{t('ppt.noChartData')}</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-[200px]">
                  {t('ppt.qualitativeFocus')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Strategic Takeaways (5/12) */}
        <div className="w-5/12 flex flex-col slide-card-block rounded-xl p-5 overflow-hidden">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-700/60 shrink-0">
            <span className="text-xs font-bold uppercase tracking-wider font-mono text-sky-400">
              {t('ppt.strategicTakeaways')}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">{t('ppt.takeaways')}</span>
          </div>

          <BulletList
            items={Array.isArray(slide.c) ? slide.c : [slide.c].filter(Boolean)}
            isColumn={false}
            onChangeItems={handleTakeawaysChange}
            onOpenRestyleModal={onOpenRestyleModal}
            onGeneratePointWithAI={onGeneratePointWithAI}
            onPushHistory={onPushHistory}
            isGeneratingAI={isGeneratingAI}
          />
        </div>
      </div>
    </div>
  );
}
