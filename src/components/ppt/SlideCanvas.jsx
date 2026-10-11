import React, { useRef, useState, useEffect } from 'react';
import HeroLayout from './layouts/HeroLayout';
import StatsLayout from './layouts/StatsLayout';
import TimelineLayout from './layouts/TimelineLayout';
import ChartLayout from './layouts/ChartLayout';
import TwoColLayout from './layouts/TwoColLayout';
import ThreeColLayout from './layouts/ThreeColLayout';
import TitleImageLayout from './layouts/TitleImageLayout';
import FlowchartLayout from './layouts/FlowchartLayout';
import StatementLayout from './layouts/StatementLayout';
import TitleContentLayout from './layouts/TitleContentLayout';
import { THEME_SEEDS } from './pptConstants';

export default function SlideCanvas({
  slide,
  slideIndex,
  totalSlides,
  currentTheme = 'midnight',
  currentSeedHex = '#0EA5E9',
  zoomScale = 1.0,
  onUpdateSlide,
  onOpenPhotoModal,
  onOpenRestyleModal,
  onGeneratePointWithAI,
  onPushHistory,
  isGeneratingAI = false,
}) {
  const containerRef = useRef(null);
  const [autoScale, setAutoScale] = useState(1.0);

  const baseW = 960;
  const baseH = 540;

  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current?.parentElement) return;
      const parent = containerRef.current.parentElement;
      const availW = Math.max(260, parent.clientWidth - 48);
      const availH = Math.max(160, parent.clientHeight - 64);
      const fit = Math.min(availW / baseW, availH / baseH);
      setAutoScale(Math.min(fit, 1.0));
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  if (!slide) {
    return null;
  }

  const effectiveTheme = slide.theme || currentTheme || 'midnight';
  const mode = slide.theme_mode || (effectiveTheme === 'clean' ? 'light_canvas' : 'dark');
  const effectiveSeed =
    slide.seed_color || currentSeedHex || THEME_SEEDS[effectiveTheme] || '#0EA5E9';

  // Compute theme CSS class
  const themeClasses = [];
  if (effectiveTheme && effectiveTheme !== 'midnight') {
    themeClasses.push(`theme-${effectiveTheme}`);
  }
  if (mode === 'light_cards') {
    themeClasses.push('slide-mode-light-cards');
  } else if (mode === 'light_canvas' || mode === 'light') {
    themeClasses.push('slide-mode-light-canvas slide-mode-light');
  }

  const finalScale = zoomScale !== 1.0 ? zoomScale : autoScale;

  const renderLayout = () => {
    const layout = slide.l || 'title_content';

    const commonProps = {
      slide,
      slideIndex,
      totalSlides,
      onUpdateSlide,
      onOpenPhotoModal,
      onOpenRestyleModal,
      onGeneratePointWithAI,
      onPushHistory,
      isGeneratingAI,
    };

    switch (layout) {
      case 'hero':
        return <HeroLayout {...commonProps} />;
      case 'stats':
        return <StatsLayout {...commonProps} />;
      case 'timeline':
        return <TimelineLayout {...commonProps} />;
      case 'chart_slide':
        return <ChartLayout {...commonProps} />;
      case '2col':
        return <TwoColLayout {...commonProps} />;
      case '3col':
        return <ThreeColLayout {...commonProps} />;
      case 'title_image_right':
        return <TitleImageLayout {...commonProps} />;
      case 'flowchart':
        return <FlowchartLayout {...commonProps} />;
      case 'statement':
      case 'quote':
      case 'vision':
        return <StatementLayout {...commonProps} />;
      case 'title_content':
      default:
        if (slide.image_data) {
          return <TitleImageLayout {...commonProps} />;
        }
        return <TitleContentLayout {...commonProps} />;
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center transition-all duration-150"
      style={{
        width: `${Math.round(baseW * finalScale)}px`,
        height: `${Math.round(baseH * finalScale)}px`,
      }}
    >
      <div
        id="slidePreview"
        className={`slide-stage-canvas ${themeClasses.join(' ')}`}
        style={{
          width: `${baseW}px`,
          height: `${baseH}px`,
          transform: `scale(${finalScale})`,
          transformOrigin: 'top left',
          position: 'absolute',
          top: 0,
          left: 0,
          '--slide-accent': effectiveSeed,
        }}
      >
        {renderLayout()}
      </div>
    </div>
  );
}
