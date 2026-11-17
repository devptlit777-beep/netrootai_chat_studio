import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Sparkles, Scale, Layers } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import ModelHub from '../components/models/ModelHub';
import ModelDiscover from '../components/models/ModelDiscover';
import ModelCompare from '../components/models/ModelCompare';

export default function ModelsPage() {
  const { theme } = useTheme();
  const darkMode = theme === 'dark';
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Active view: 'catalog' | 'discover' | 'compare'
  const [activeView, setActiveView] = useState(() => {
    const viewParam = searchParams.get('view') || searchParams.get('tab');
    if (viewParam === 'compare') return 'compare';
    if (viewParam === 'discover') return 'discover';
    if ((searchParams.get('modelA') || searchParams.get('modelB')) && viewParam !== 'catalog') return 'compare';
    return 'catalog';
  });

  const [selectedCompareModel, setSelectedCompareModel] = useState(null);

  // Sync with searchParams
  useEffect(() => {
    const viewParam = searchParams.get('view') || searchParams.get('tab');
    if (viewParam && (viewParam === 'catalog' || viewParam === 'discover' || viewParam === 'compare')) {
      if (viewParam !== activeView) {
        setActiveView(viewParam);
      }
    } else if (!viewParam && (searchParams.get('modelA') || searchParams.get('modelB')) && activeView !== 'compare') {
      setActiveView('compare');
    }
  }, [searchParams]);

  function switchView(view) {
    setActiveView(view);
    const newParams = new URLSearchParams(searchParams);
    if (view === 'catalog') {
      newParams.delete('view');
      newParams.delete('tab');
      newParams.delete('modelA');
      newParams.delete('modelB');
    } else {
      newParams.set('view', view);
      newParams.delete('tab');
      if (view !== 'compare') {
        newParams.delete('modelA');
        newParams.delete('modelB');
      }
    }
    setSearchParams(newParams);
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#0e0e0e] text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 transition-all duration-300">
        {/* Header with Title & Top-Right Segmented Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-[#222]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold text-blue-400 tracking-wider uppercase font-mono">
                Model Directory & Intelligence Arena
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
              {activeView === 'catalog' && (
                <>
                  <Layers className="w-7 h-7 text-blue-500" />
                  Model Catalog
                </>
              )}
              {activeView === 'discover' && (
                <>
                  <Sparkles className="w-7 h-7 text-amber-500" />
                  Discover & Trends
                </>
              )}
              {activeView === 'compare' && (
                <>
                  <Scale className="w-7 h-7 text-indigo-500" />
                  Model Comparison Arena
                </>
              )}
            </h1>
            <p className={`text-xs mt-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {activeView === 'catalog' &&
                'Explore 470+ models with live sidebar filters by lab, modality, context capacity, and token pricing.'}
              {activeView === 'discover' &&
                'Real-time developer token traffic, frontier benchmarks, and low-latency production models.'}
              {activeView === 'compare' &&
                'Direct graphical side-by-side comparison across token rates, context capacity, and reasoning benchmarks.'}
            </p>
          </div>

          {/* Segmented Pill Switcher (3 Tabs) */}
          <div className={`flex items-center p-1 rounded-2xl border self-start sm:self-auto shrink-0 ${
            darkMode ? 'bg-[#181818] border-[#2a2a2a]' : 'bg-gray-200 border-gray-300'
          }`}>
            <button
              onClick={() => switchView('catalog')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeView === 'catalog'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : darkMode
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>🗂️</span> Model Catalog
            </button>
            <button
              onClick={() => switchView('discover')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeView === 'discover'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/25'
                  : darkMode
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>🌟</span> Discover & Trends
            </button>
            <button
              onClick={() => switchView('compare')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeView === 'compare'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-500/25'
                  : darkMode
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>⚖️</span> Compare Arena
            </button>
          </div>
        </div>

        {/* View 1: Model Catalog (Direct Sidebar & Filterable Cards Grid) */}
        {activeView === 'catalog' && (
          <ModelHub
            darkMode={darkMode}
            onSelectCompare={m => {
              setSelectedCompareModel(m);
              switchView('compare');
            }}
          />
        )}

        {/* View 2: Discover & Trends (Analytics, Leaderboard & Highlights) */}
        {activeView === 'discover' && (
          <ModelDiscover
            darkMode={darkMode}
            onSelectCompare={m => {
              setSelectedCompareModel(m);
              switchView('compare');
            }}
            onSwitchToCatalog={(targetModality) => {
              if (targetModality) {
                const newParams = new URLSearchParams(searchParams);
                newParams.delete('view');
                newParams.delete('tab');
                newParams.set('modality', targetModality);
                setSearchParams(newParams);
                setActiveView('catalog');
              } else {
                switchView('catalog');
              }
            }}
          />
        )}

        {/* View 3: Model Comparison Arena */}
        {activeView === 'compare' && (
          <ModelCompare
            darkMode={darkMode}
            initialModelA={selectedCompareModel}
            onSwitchToCatalog={(targetModality) => {
              if (targetModality) {
                const newParams = new URLSearchParams(searchParams);
                newParams.delete('view');
                newParams.delete('tab');
                newParams.set('modality', targetModality);
                setSearchParams(newParams);
                setActiveView('catalog');
              } else {
                switchView('catalog');
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
