import React, { useState } from 'react';
import {
  Search,
  Filter,
  X,
  RotateCcw,
  Sparkles,
  Layers,
  MessageSquare,
  Film,
  Image as ImageIcon,
  Volume2,
  Cpu,
  Eye,
  Zap,
  Brain,
  DollarSign,
  Lock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import ProviderLogo from '../common/ProviderLogo';

export default function CatalogSidebar({
  darkMode,
  search,
  setSearch,
  selectedModality,
  setSelectedModality,
  selectedProvider,
  setSelectedProvider,
  sortBy,
  setSortBy,
  pricingFilter,
  setPricingFilter,
  allowedModels,
  providers,
  counts,
  onResetFilters,
  hasActiveFilters,
  isOpenMobile,
  setIsOpenMobile,
}) {
  const [providerSearch, setProviderSearch] = useState('');
  const [showAllProviders, setShowAllProviders] = useState(false);

  const filteredProviders = providers.filter(p =>
    p.toLowerCase().includes(providerSearch.toLowerCase())
  );

  const displayedProviders = showAllProviders
    ? filteredProviders
    : filteredProviders.slice(0, 8);

  const modalityItems = [
    { id: 'all', label: 'All Models', count: counts.all, icon: Layers },
    { id: 'chat', label: 'Chat & Text LLMs', count: counts.chat, icon: MessageSquare },
    { id: 'image_gen', label: 'Image Generation', count: counts.image_gen, icon: ImageIcon, badge: 'Studio' },
    { id: 'video', label: 'Video Generation', count: counts.video, icon: Film, badge: '1080p' },
    { id: 'audio', label: 'Voice & Audio Studio', count: counts.audio, icon: Volume2, badge: 'Hi-Fi' },
    { id: 'code', label: 'Coding Pro', count: counts.code, icon: Cpu },
    { id: 'vision', label: 'Vision / OCR', count: counts.vision, icon: Eye },
    { id: 'fast', label: 'Fast Inference (<300ms)', count: counts.fast, icon: Zap },
    { id: 'reasoning', label: 'Reasoning & Math', count: counts.reasoning, icon: Brain },
  ];

  const sidebarContent = (
    <div className="space-y-6">
      {/* Search Input */}
      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
          Search Model Fleet
        </label>
        <div
          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all ${
            darkMode
              ? 'bg-[#181818] border-[#2e2e2e] focus-within:border-blue-500'
              : 'bg-gray-50 border-gray-200 focus-within:border-blue-500'
          }`}
        >
          <Search className={`w-4 h-4 shrink-0 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, slug or provider..."
            className={`w-full bg-transparent text-xs outline-none ${
              darkMode ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
            }`}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-gray-500 hover:text-gray-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Reset Filters Quick Button */}
      {hasActiveFilters && (
        <button
          onClick={onResetFilters}
          className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
            darkMode
              ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20'
              : 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset All Active Filters</span>
        </button>
      )}

      {/* Sort By Filter */}
      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
          Sort Order
        </label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className={`w-full text-xs rounded-xl px-3 py-2.5 border outline-none font-medium cursor-pointer transition-colors ${
            darkMode
              ? 'bg-[#181818] border-[#2e2e2e] text-gray-200 focus:border-blue-500'
              : 'bg-gray-50 border-gray-200 text-gray-800 focus:border-blue-500'
          }`}
        >
          <option value="popular">🔥 Most Popular (Daily Volume)</option>
          <option value="intelligence">🧠 Highest Intelligence Index</option>
          <option value="price_asc">💰 Price: Low to High</option>
          <option value="price_desc">💎 Price: High to Low</option>
          <option value="context">📚 Largest Context Window</option>
        </select>
      </div>

      {/* Pricing / Access Tier */}
      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
          Pricing & Access
        </label>
        <div className="grid grid-cols-1 gap-1.5">
          {[
            { id: 'all', label: 'All Access Levels', count: allowedModels.length },
            { id: 'free', label: '🟢 100% Free Only', count: counts.free },
            { id: 'pro', label: '⭐ Pro & Enterprise', count: allowedModels.length - counts.free },
          ].map(tier => (
            <button
              key={tier.id}
              onClick={() => setPricingFilter(tier.id)}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                pricingFilter === tier.id
                  ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20'
                  : darkMode
                  ? 'bg-[#181818] text-gray-400 hover:text-white hover:bg-[#202020]'
                  : 'bg-gray-50 text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <span>{tier.label}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                pricingFilter === tier.id
                  ? 'bg-white/20 text-white'
                  : darkMode
                  ? 'bg-[#252525] text-gray-400'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {tier.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Modality & Capabilities */}
      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
          Modalities & AI Tasks
        </label>
        <div className="space-y-1">
          {modalityItems.map(item => {
            const Icon = item.icon;
            const isSelected = selectedModality === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedModality(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20'
                    : darkMode
                    ? 'text-gray-400 hover:text-white hover:bg-white/5'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-pink-500/20 text-pink-300 ml-1.5 shrink-0">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full shrink-0 ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : darkMode
                      ? 'bg-[#1e1e1e] text-gray-500'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {item.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Providers Filter */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            AI Lab / Provider
          </label>
          <span className="text-[10px] text-gray-500 font-mono">
            {providers.length} Total
          </span>
        </div>

        {/* Provider Search */}
        <div
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border mb-2 ${
            darkMode ? 'bg-[#181818] border-[#2e2e2e]' : 'bg-gray-50 border-gray-200'
          }`}
        >
          <Search className="w-3 h-3 text-gray-500" />
          <input
            type="text"
            value={providerSearch}
            onChange={(e) => setProviderSearch(e.target.value)}
            placeholder="Search provider..."
            className={`w-full bg-transparent text-[11px] outline-none ${
              darkMode ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
            }`}
          />
        </div>

        {/* Provider Radio List */}
        <div className="space-y-1 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
          <button
            onClick={() => setSelectedProvider('all')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all ${
              selectedProvider === 'all'
                ? 'bg-blue-600 text-white font-bold'
                : darkMode
                ? 'text-gray-400 hover:text-white hover:bg-white/5'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <span>All Providers</span>
            <span className="text-[10px] font-mono">{allowedModels.length}</span>
          </button>

          {displayedProviders.map(p => {
            const count = allowedModels.filter(m => m.provider === p).length;
            const isSelected = selectedProvider === p;
            return (
              <button
                key={p}
                onClick={() => setSelectedProvider(p)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white font-bold'
                    : darkMode
                    ? 'text-gray-400 hover:text-white hover:bg-white/5'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <ProviderLogo provider={p} size="xs" />
                  <span className="truncate">{p}</span>
                </div>
                <span className="text-[10px] font-mono opacity-80">{count}</span>
              </button>
            );
          })}
        </div>

        {filteredProviders.length > 8 && (
          <button
            type="button"
            onClick={() => setShowAllProviders(!showAllProviders)}
            className="text-[11px] text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 mt-2"
          >
            {showAllProviders ? (
              <>
                Show Less <ChevronUp className="w-3 h-3" />
              </>
            ) : (
              <>
                Show All Providers ({filteredProviders.length}) <ChevronDown className="w-3 h-3" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside
        className={`hidden lg:block w-72 shrink-0 self-start sticky top-6 rounded-3xl border p-5 transition-all ${
          darkMode ? 'bg-[#121212] border-[#222]' : 'bg-white border-gray-200'
        }`}
      >
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-500" />
            <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Catalog Filters
            </span>
          </div>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
            darkMode ? 'bg-[#1c1c1c] text-gray-400' : 'bg-gray-100 text-gray-600'
          }`}>
            {counts.matching} Models
          </span>
        </div>

        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsOpenMobile(false)}
          />
          <div
            className={`relative ml-auto w-full max-w-xs h-full p-6 overflow-y-auto shadow-2xl flex flex-col justify-between transition-all ${
              darkMode ? 'bg-[#121212] border-l border-[#222]' : 'bg-white border-l border-gray-200'
            }`}
          >
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-blue-500" />
                  <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Catalog Filters
                  </span>
                </div>
                <button
                  onClick={() => setIsOpenMobile(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {sidebarContent}
            </div>

            <button
              onClick={() => setIsOpenMobile(false)}
              className="mt-6 w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
            >
              Apply & Close Filters
            </button>
          </div>
        </div>
      )}
    </>
  );
}

