import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Sparkles,
  Zap,
  TrendingUp,
  Award,
  Layers,
  ExternalLink,
  MessageSquare,
  Scale,
  Check,
  ChevronRight,
  Filter,
  Eye,
  DollarSign,
  Cpu,
  CreditCard,
  Share2,
  Lock,
  ShieldCheck,
  Film,
  Volume2,
} from 'lucide-react';
import API_BASE from '../../lib/api';
import { usePlan } from '../../contexts/PlanContext';
import ModelDetailModal from './ModelDetailModal';
import ProUpgradeModal from './ProUpgradeModal';
import FalMediaModal from './FalMediaModal';
import CatalogSidebar from './CatalogSidebar';
import { getModelBenchmarks } from '../../lib/modelBenchmarks';
import { getFullModelDescription, getModelSummary } from '../../lib/modelDescriptions';
import ProviderLogo from '../common/ProviderLogo';

export default function ModelHub({ darkMode, onSelectCompare }) {
  const navigate = useNavigate();
  const { plan, featureAccess } = usePlan();
  const isPro = plan === 'pro' || plan === 'enterprise' || Boolean(featureAccess?.models);

  const [searchParams] = useSearchParams();
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedModality, setSelectedModality] = useState(() => searchParams.get('modality') || 'all');
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [pricingFilter, setPricingFilter] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [modalModel, setModalModel] = useState(null);
  const [falModalModel, setFalModalModel] = useState(null);
  const [upgradeModel, setUpgradeModel] = useState(null);
  const [guardrails, setGuardrails] = useState({ blocked_providers: [], disallowed_models: [] });

  const isFreeModel = m => {
    if (!m) return true;
    const id = typeof m === 'string' ? m : m.id;
    if (m?.is_free) return true;
    if (id?.endsWith(':free') || id?.includes(':free')) return true;
    const freeAllowed = ['openai/gpt-oss-20b', 'allam-2-7b', 'qwen/qwen3.8-27b', 'ppt-studio', 'fal-ai/flux/schnell', 'fal-ai/f5-tts', 'fal-ai/whisper', 'fal-ai/cogvideox-5b'];
    if (freeAllowed.includes(id)) return true;
    if (m?.calculated_pricing?.prompt === 0 && m?.calculated_pricing?.completion === 0 && !m?.calculated_pricing?.image) return true;
    return false;
  };

  useEffect(() => {
    fetchModels();
  }, []);

  useEffect(() => {
    const mod = searchParams.get('modality');
    if (mod) setSelectedModality(mod);
  }, [searchParams]);

  // Capability detection helpers
  const isGenerativeVideo = m => {
    if (!m) return false;
    if (m.media_category === 'video') return true;
    const outs = Array.isArray(m.output_modalities) ? m.output_modalities : [];
    if (outs.includes('video')) return true;
    const id = (m.id || '').toLowerCase();
    return (
      id.includes('video') ||
      id.includes('kling') ||
      id.includes('luma') ||
      id.includes('dream-machine') ||
      id.includes('cogvideo') ||
      id.includes('hailuo') ||
      id.includes('minimax/video')
    );
  };

  const isGenerativeImage = m => {
    if (!m) return false;
    if (m.media_category === 'image') return true;
    const outs = Array.isArray(m.output_modalities) ? m.output_modalities : [];
    if (outs.includes('image')) return true;
    const id = (m.id || '').toLowerCase();
    return (
      id.includes('flux') ||
      id.includes('recraft') ||
      id.includes('diffusion') ||
      id.includes('sdxl') ||
      id.includes('dall-e') ||
      id.includes('imagen') ||
      id.includes('midjourney') ||
      (id.includes('image') && !id.includes('text'))
    );
  };

  const isGenerativeAudio = m => {
    if (!m) return false;
    if (m.media_category === 'audio') return true;
    const outs = Array.isArray(m.output_modalities) ? m.output_modalities : [];
    if (outs.includes('speech') || outs.includes('audio')) return true;
    const id = (m.id || '').toLowerCase();
    return (
      id.includes('tts') ||
      id.includes('stable-audio') ||
      id.includes('whisper') ||
      id.includes('lyria') ||
      id.includes('audio')
    );
  };

  const isGenerativeMedia = m => {
    return isGenerativeVideo(m) || isGenerativeImage(m) || isGenerativeAudio(m);
  };

  const isMultimodal = m => {
    if (!m || isGenerativeMedia(m)) return false;
    const mods = Array.isArray(m.modalities) ? m.modalities : [];
    return mods.includes('image') || mods.includes('video') || mods.includes('audio');
  };

  const isCode = m => {
    const id = (m.id || '').toLowerCase();
    const name = (m.name || m.display_name || '').toLowerCase();
    const codingScore = m.benchmarks?.artificial_analysis?.coding_index;
    return (
      m.custom_badge === 'Coding Pro' ||
      id.includes('coder') ||
      id.includes('codex') ||
      name.includes('code') ||
      (typeof codingScore === 'number' && codingScore >= 70)
    );
  };

  const isFast = m => {
    const id = (m.id || '').toLowerCase();
    return id.includes('flash') || id.includes('instant') || id.includes('schnell') || m.custom_badge === 'Speed King';
  };

  const isReasoning = m => {
    const id = (m.id || '').toLowerCase();
    const params = Array.isArray(m.supported_parameters) ? m.supported_parameters : [];
    return id.includes('r1') || id.includes('o1') || id.includes('o3') || params.includes('reasoning') || params.includes('include_reasoning');
  };

  // Workspace guardrails enforcement: filter out blocked providers and disallowed models (including :free, :batch, and dated variants)
  const isModelAllowed = m => {
    if (!m || !m.id) return false;
    const modelId = m.id.toLowerCase().trim();
    const modelBase = modelId.split(':')[0].replace(/-\d{8}$/, '');
    const shortId = modelId.includes('/') ? modelId.split('/')[1] : modelId;
    const shortBase = modelBase.includes('/') ? modelBase.split('/')[1] : modelBase;

    const disallowedList = (guardrails?.disallowed_models || []).map(x => x.toLowerCase().trim());
    const isDisallowed = disallowedList.some(blocked => {
      const blockedBase = blocked.split(':')[0].replace(/-\d{8}$/, '');
      const blockedShort = blocked.includes('/') ? blocked.split('/')[1] : blocked;
      const blockedShortBase = blockedBase.includes('/') ? blockedBase.split('/')[1] : blockedBase;

      if (
        modelId === blocked ||
        modelBase === blockedBase ||
        shortId === blockedShort ||
        shortBase === blockedShortBase ||
        modelId.startsWith(blockedBase + ':') ||
        modelBase === blocked ||
        blocked.startsWith(modelBase + ':')
      ) {
        return true;
      }

      if (blocked.length >= 4 && (modelId.includes(blocked) || shortId.includes(blocked))) {
        return true;
      }

      return false;
    });
    if (isDisallowed) return false;

    const providerSlug = (m.id.split('/')[0] || '').toLowerCase();
    const providerName = (m.provider || '').toLowerCase();
    const blockedProvidersList = (guardrails?.blocked_providers || []).map(x => x.toLowerCase().trim());
    if (blockedProvidersList.includes(providerSlug) || blockedProvidersList.includes(providerName)) {
      return false;
    }
    return true;
  };

  const allowedModels = models.filter(isModelAllowed);

  // Deep Link: if URL has ?model=..., auto-open that model in the centered modal (respecting guardrails)
  useEffect(() => {
    const modelParam = searchParams.get('model');
    if (modelParam && allowedModels.length > 0) {
      const found = allowedModels.find(
        m => m.id === modelParam || m.id.toLowerCase() === modelParam.toLowerCase()
      );
      if (found) {
        setModalModel(found);
      }
    }
  }, [searchParams, allowedModels]);

  async function fetchModels() {
    setLoading(true);
    try {
      const [modelsRes, grRes] = await Promise.all([
        fetch(`${API_BASE}/api/models`),
        fetch(`${API_BASE}/api/workspace/guardrails`).catch(() => null),
      ]);
      const data = await modelsRes.json();
      if (data.models) {
        setModels(data.models);
      }
      if (grRes && grRes.ok) {
        const grData = await grRes.json();
        if (grData.guardrails) {
          setGuardrails(grData.guardrails);
        }
      }
    } catch (err) {
      console.error('Failed to load models:', err);
    } finally {
      setLoading(false);
    }
  }

  // Filter models
  const providers = Array.from(new Set(allowedModels.map(m => m.provider || 'AI'))).sort();

  const counts = {
    all: allowedModels.length,
    chat: allowedModels.filter(m => !isGenerativeMedia(m)).length,
    image_gen: allowedModels.filter(isGenerativeImage).length,
    video: allowedModels.filter(isGenerativeVideo).length,
    audio: allowedModels.filter(isGenerativeAudio).length,
    code: allowedModels.filter(isCode).length,
    vision: allowedModels.filter(isMultimodal).length,
    fast: allowedModels.filter(isFast).length,
    reasoning: allowedModels.filter(isReasoning).length,
    free: allowedModels.filter(m => m.is_free || isFreeModel(m)).length,
    matching: 0,
  };

  const filtered = allowedModels.filter(m => {
    const s = search.toLowerCase();
    const matchesSearch =
      !s ||
      m.id?.toLowerCase().includes(s) ||
      m.display_name?.toLowerCase().includes(s) ||
      m.name?.toLowerCase().includes(s) ||
      m.provider?.toLowerCase().includes(s) ||
      m.description?.toLowerCase().includes(s);

    const matchesBatch = s.includes(':batch');
    if (!matchesBatch && m.id.endsWith(':batch')) return false;

    if (!matchesSearch) return false;

    if (selectedProvider !== 'all' && m.provider?.toLowerCase() !== selectedProvider.toLowerCase()) {
      return false;
    }

    if (pricingFilter === 'free' && !m.is_free && !isFreeModel(m)) {
      return false;
    }
    if (pricingFilter === 'pro' && (m.is_free || isFreeModel(m))) {
      return false;
    }

    if (selectedModality === 'your_models') {
      if (isPro) return true;
      return m.is_free || isFreeModel(m);
    }
    if (selectedModality === 'free') return m.is_free || isFreeModel(m);
    if (selectedModality === 'chat') return !isGenerativeMedia(m);
    if (selectedModality === 'image_gen') return isGenerativeImage(m);
    if (selectedModality === 'video') return isGenerativeVideo(m);
    if (selectedModality === 'audio') return isGenerativeAudio(m);
    if (selectedModality === 'vision') return isMultimodal(m);
    if (selectedModality === 'code') return isCode(m);
    if (selectedModality === 'fast') return isFast(m);
    if (selectedModality === 'reasoning') return isReasoning(m);

    return true;
  });

  counts.matching = filtered.length;

  const hasActiveFilters =
    Boolean(search) ||
    selectedModality !== 'all' ||
    selectedProvider !== 'all' ||
    pricingFilter !== 'all' ||
    sortBy !== 'popular';

  const handleResetFilters = () => {
    setSearch('');
    setSelectedModality('all');
    setSelectedProvider('all');
    setPricingFilter('all');
    setSortBy('popular');
  };

  // Apply sorting with authentic blended pricing
  const getBlendedPrice = (item) => {
    if (item.is_free) return 0;
    const prompt = item.calculated_pricing?.prompt || 0;
    const comp = item.calculated_pricing?.completion || 0;
    return (0.75 * prompt) + (0.25 * comp);
  };

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'intelligence') {
      const benchA = getModelBenchmarks(a).intelligence || 0;
      const benchB = getModelBenchmarks(b).intelligence || 0;
      return benchB - benchA;
    }
    if (sortBy === 'price_asc') {
      return getBlendedPrice(a) - getBlendedPrice(b);
    }
    if (sortBy === 'price_desc') {
      return getBlendedPrice(b) - getBlendedPrice(a);
    }
    if (sortBy === 'context') {
      return (b.context_length || 0) - (a.context_length || 0);
    }
    // Default popular: Authentic OpenRouter developer volume & traffic
    const rankA = typeof a.openrouter_rank === 'number' && a.openrouter_rank > 0 ? a.openrouter_rank : 9999;
    const rankB = typeof b.openrouter_rank === 'number' && b.openrouter_rank > 0 ? b.openrouter_rank : 9999;
    if (rankA !== rankB) return rankA - rankB;

    const tokensA = a.openrouter_tokens || 0;
    const tokensB = b.openrouter_tokens || 0;
    if (tokensA !== tokensB) return tokensB - tokensA;

    const isFlagship = m => (
      m.id.includes('claude-3') ||
      m.id.includes('claude-opus') ||
      m.id.includes('gpt-4o') ||
      m.id.includes('o3-mini') ||
      m.id.includes('deepseek-v4') ||
      m.id.includes('gemini-1.5') ||
      m.id.includes('llama-3.1-70b')
    );
    const isA = isFlagship(a);
    const isB = isFlagship(b);
    if (isA && !isB) return -1;
    if (!isA && isB) return 1;

    if (a.is_free && !b.is_free) return -1;
    if (!a.is_free && b.is_free) return 1;
    return (a.display_name || a.name || a.id).localeCompare(b.display_name || b.name || b.id);
  });

  function startChat(modelOrId) {
    const m = typeof modelOrId === 'object' ? modelOrId : allowedModels.find(x => x.id === modelOrId);
    const modelId = typeof modelOrId === 'string' ? modelOrId : m?.id;
    if (!isPro && !isFreeModel(m || modelId)) {
      setUpgradeModel(m || { id: modelId, name: modelId?.split('/').pop() });
      return;
    }
    navigate(`/dashboard?model=${encodeURIComponent(modelId)}`);
  }

  // Pagination state for ultra-smooth 60fps scrolling
  const [visibleCount, setVisibleCount] = useState(36);

  useEffect(() => {
    setVisibleCount(36);
  }, [search, selectedModality, selectedProvider, sortBy]);

  return (
    <div className="pb-16">
      {/* ── Model Catalog Grid Section with Left Sidebar ── */}
      <div>
        {/* Mobile Filter Control Bar */}
        <div className="flex lg:hidden items-center justify-between gap-3 mb-4">
          <button
            onClick={() => setIsMobileFiltersOpen(true)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold border transition-all ${
              darkMode ? 'bg-[#181818] border-[#2e2e2e] text-white hover:bg-[#202020]' : 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4 text-blue-500" />
            <span>Filters ({hasActiveFilters ? 'Active' : 'All'})</span>
          </button>
          <div className="text-xs text-gray-500 font-mono">
            {sorted.length} models
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left Sticky Sidebar */}
          <CatalogSidebar
            darkMode={darkMode}
            search={search}
            setSearch={setSearch}
            selectedModality={selectedModality}
            setSelectedModality={setSelectedModality}
            selectedProvider={selectedProvider}
            setSelectedProvider={setSelectedProvider}
            sortBy={sortBy}
            setSortBy={setSortBy}
            pricingFilter={pricingFilter}
            setPricingFilter={setPricingFilter}
            allowedModels={allowedModels}
            providers={providers}
            counts={counts}
            onResetFilters={handleResetFilters}
            hasActiveFilters={hasActiveFilters}
            isOpenMobile={isMobileFiltersOpen}
            setIsOpenMobile={setIsMobileFiltersOpen}
          />

          {/* Right Main Grid Area */}
          <div className="flex-1 w-full min-w-0">
            {/* Active Filters Pill Bar & Results Header */}
            <div
              className={`p-3.5 px-4 rounded-2xl border mb-5 flex flex-wrap items-center justify-between gap-3 ${
                darkMode ? 'bg-[#121212] border-[#222]' : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-gray-400">View:</span>
                <span className="text-xs px-2.5 py-1 rounded-lg font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/20">
                  {selectedModality === 'all'
                    ? 'All Models'
                    : selectedModality === 'image_gen'
                    ? '🎨 Image Gen'
                    : selectedModality === 'video'
                    ? '🎬 Video Gen'
                    : selectedModality === 'audio'
                    ? '🎙️ Audio Studio'
                    : selectedModality.toUpperCase()}
                </span>
                {selectedProvider !== 'all' && (
                  <span className="text-xs px-2.5 py-1 rounded-lg font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                    {selectedProvider}
                  </span>
                )}
                {pricingFilter !== 'all' && (
                  <span className="text-xs px-2.5 py-1 rounded-lg font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                    {pricingFilter === 'free' ? '🟢 100% Free' : '⭐ Pro Tier'}
                  </span>
                )}
                {search && (
                  <span className="text-xs px-2.5 py-1 rounded-lg font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20">
                    "{search}"
                  </span>
                )}
              </div>

              <div className="text-xs font-mono text-gray-400">
                Showing{' '}
                <strong className={darkMode ? 'text-white' : 'text-gray-900'}>
                  {Math.min(visibleCount, sorted.length)}
                </strong>{' '}
                of <strong>{sorted.length}</strong> models
              </div>
            </div>

            {/* Model Cards Grid */}
            {loading ? (
              <div className="py-20 text-center">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="mt-3 text-xs text-gray-500">Loading AI Model Fleet...</p>
              </div>
            ) : sorted.length === 0 ? (
              <div className="py-16 text-center text-gray-500 text-sm">
                No models found matching your search criteria.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {sorted.slice(0, visibleCount).map(m => {
              const promptRate = m.calculated_pricing?.prompt
                ? (m.calculated_pricing.prompt * 1000000).toFixed(2)
                : '0.00';
              const compRate = m.calculated_pricing?.completion
                ? (m.calculated_pricing.completion * 1000000).toFixed(2)
                : '0.00';

              const ctxLabel = m.context_length
                ? m.context_length >= 1000000
                  ? `${(m.context_length / 1000000).toFixed(1)}M`
                  : `${Math.round(m.context_length / 1000)}k`
                : '—';

              const imageRate = m.calculated_pricing?.image
                ? Number(m.calculated_pricing.image).toFixed(3)
                : (isGenerativeVideo(m) ? '0.250' : isGenerativeAudio(m) ? '0.050' : '0.040');

              return (
                <div
                  key={m.id}
                  onClick={() => setModalModel(m)}
                  className={`rounded-2xl border p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 cursor-pointer group ${
                    darkMode
                      ? 'bg-[#121212] border-[#222] hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-500/5'
                      : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-lg'
                  }`}
                >
                  <div>
                    {/* Card Header: Provider & Badges */}
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] pl-1.5 pr-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                          darkMode ? 'bg-[#202020] text-gray-300 border border-[#2e2e2e]' : 'bg-gray-100 text-gray-600'
                        }`}>
                          <ProviderLogo provider={m.provider} modelId={m.id} size="sm" />
                          <span>{m.provider}</span>
                        </span>
                        {m.openrouter_rank && m.openrouter_rank <= 25 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-400 border border-amber-500/25">
                            #{m.openrouter_rank} Global Rank
                          </span>
                        )}
                        {m.is_free && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                            FREE
                          </span>
                        )}
                        {!isFreeModel(m) && !isPro && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> PRO
                          </span>
                        )}
                      </div>

                      {m.custom_badge && !m.is_free && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/20">
                          {m.custom_badge}
                        </span>
                      )}
                    </div>

                    {/* Model Name */}
                    <h3 className={`text-base font-bold transition-colors line-clamp-1 group-hover:text-blue-500 ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {m.display_name || m.name}
                    </h3>
                    <p className="text-[11px] text-gray-500 font-mono mt-0.5 truncate">{m.id}</p>

                    {/* Capability Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {isGenerativeImage(m) && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-pink-500/15 text-pink-400 border border-pink-500/20">
                          🎨 Image Gen
                        </span>
                      )}
                      {isGenerativeVideo(m) && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/20">
                          🎬 Video Gen
                        </span>
                      )}
                      {isGenerativeAudio(m) && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20">
                          🎙️ Audio Studio
                        </span>
                      )}
                      {isMultimodal(m) && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/20">
                          👁️ Multimodal
                        </span>
                      )}
                      {isFast(m) && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                          ⚡ &lt;300ms Fast
                        </span>
                      )}
                      {isReasoning(m) && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                          🧠 Reasoning
                        </span>
                      )}
                      {m.openrouter_volume_str && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {m.openrouter_volume_str}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className={`text-xs mt-2.5 line-clamp-2 leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {getModelSummary(m)}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-[#1e1e1e]">
                    {/* Metrics: Context & Price */}
                    <div className="flex items-center justify-between text-xs mb-4">
                      <div>
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider block">
                          {isGenerativeMedia(m) ? 'Task Domain' : 'Context Window'}
                        </span>
                        <span className="font-mono font-semibold text-gray-300">
                          {isGenerativeMedia(m)
                            ? (isGenerativeVideo(m) ? '1080p Video' : isGenerativeAudio(m) ? 'Stereo Audio' : 'High-Res Image')
                            : `${ctxLabel} tokens`}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider block">
                          {isGenerativeMedia(m) ? 'Rate / Generation' : 'Pricing (1M Tokens)'}
                        </span>
                        {m.is_free ? (
                          <span className="font-mono font-bold text-emerald-400">100% Free</span>
                        ) : isGenerativeMedia(m) && imageRate ? (
                          <span className="font-mono font-semibold text-gray-300">${imageRate} / req</span>
                        ) : (
                          <span className="font-mono font-semibold text-gray-300">
                            ${promptRate} <span className="text-gray-500 font-normal">/</span> ${compRate}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons: Primary Action + Compare */}
                    <div className="flex items-center gap-2">
                      {isGenerativeMedia(m) ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (m.id.startsWith('fal-ai/')) {
                              setFalModalModel(m);
                            } else {
                              startChat(m);
                            }
                          }}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all shadow-md ${
                            isGenerativeVideo(m)
                              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-500/20'
                              : isGenerativeAudio(m)
                              ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-amber-500/20'
                              : 'bg-gradient-to-r from-pink-600 to-blue-600 hover:from-pink-500 hover:to-blue-500 text-white shadow-pink-500/20'
                          }`}
                        >
                          {isGenerativeVideo(m) ? (
                            <>
                              <Film className="w-3.5 h-3.5" />
                              <span>Generate Video</span>
                            </>
                          ) : isGenerativeAudio(m) ? (
                            <>
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>Audio Studio</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Generate Image</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startChat(m);
                          }}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                            !isFreeModel(m) && !isPro
                              ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-md shadow-indigo-500/20'
                              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20'
                          }`}
                        >
                          {!isFreeModel(m) && !isPro ? (
                            <>
                              <Lock className="w-3.5 h-3.5" />
                              <span>Unlock Pro</span>
                            </>
                          ) : (
                            <>
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Start Chat</span>
                            </>
                          )}
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectCompare) onSelectCompare(m);
                        }}
                        className={`py-2 px-3.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 shrink-0 transition-all ${
                          darkMode
                            ? 'border-[#2a2a2a] text-gray-300 hover:bg-white/5 hover:text-white'
                            : 'border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                        title="Compare in Arena"
                      >
                        <Scale className="w-3.5 h-3.5 text-blue-400" />
                        <span>Compare</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load More Models Pagination Button */}
        {!loading && sorted.length > visibleCount && (
          <div className="flex justify-center mt-10">
            <button
              onClick={() => setVisibleCount(prev => prev + 36)}
              className={`px-8 py-3 rounded-2xl text-xs font-bold border transition-all flex items-center gap-2.5 shadow-lg ${
                darkMode
                  ? 'bg-[#181818] border-[#333] hover:bg-[#222] text-white hover:border-blue-500/50'
                  : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-900'
              }`}
            >
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>Load More Models</span>
              <span className="text-gray-500 font-normal font-mono">
                (Showing {visibleCount} of {sorted.length})
              </span>
            </button>
          </div>
        )}
          </div>
        </div>
      </div>

      {/* ── Model Detail Deep-Dive Centered Modal (OpenRouter Style) ── */}
      <ModelDetailModal
        model={modalModel}
        isOpen={Boolean(modalModel)}
        onClose={() => {
          setModalModel(null);
          const p = new URLSearchParams(window.location.search);
          if (p.has('model')) {
            p.delete('model');
            window.history.replaceState({}, '', `${window.location.pathname}${p.toString() ? '?' + p.toString() : ''}`);
          }
        }}
        darkMode={darkMode}
        onSelectCompare={onSelectCompare}
      />

      {/* ── Netroot Pro Upgrade Modal ── */}
      <ProUpgradeModal
        isOpen={Boolean(upgradeModel)}
        onClose={() => setUpgradeModel(null)}
        model={upgradeModel}
        darkMode={darkMode}
        onSelectFreeModel={() => {
          setUpgradeModel(null);
          navigate('/dashboard?model=minimax/minimax-m3.1-flash:free');
        }}
      />

      {/* ── Fal.ai Media Studio Modal (Image, Video, Audio) ── */}
      <FalMediaModal
        model={falModalModel}
        darkMode={darkMode}
        onClose={() => setFalModalModel(null)}
      />
    </div>
  );
}
