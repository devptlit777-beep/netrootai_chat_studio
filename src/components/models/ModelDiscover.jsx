import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Award,
  Zap,
  Sparkles,
  Scale,
  ShieldCheck,
  MessageSquare,
  ArrowRight,
  Layers,
  Film,
  Image as ImageIcon,
  Volume2,
  Cpu,
  Brain,
  Eye,
} from 'lucide-react';
import API_BASE from '../../lib/api';
import { usePlan } from '../../contexts/PlanContext';
import { getModelSummary } from '../../lib/modelDescriptions';
import ProviderLogo from '../common/ProviderLogo';
import ModelDetailModal from './ModelDetailModal';
import ProUpgradeModal from './ProUpgradeModal';
import FalMediaModal from './FalMediaModal';

export default function ModelDiscover({ darkMode, onSelectCompare, onSwitchToCatalog }) {
  const navigate = useNavigate();
  const { plan } = usePlan();
  const isPro = plan === 'pro' || plan === 'enterprise';

  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guardrails, setGuardrails] = useState({ blocked_providers: [], disallowed_models: [] });

  const [modalModel, setModalModel] = useState(null);
  const [upgradeModel, setUpgradeModel] = useState(null);
  const [falModalModel, setFalModalModel] = useState(null);

  const isFreeModel = (m) => {
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

  // Workspace guardrails enforcement
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

  // Authentic OpenRouter Live Rankings & Spotlight Leaders
  const rankedLeaders = (() => {
    const list = allowedModels
      .filter(m => !m.id.endsWith(':batch') && typeof m.openrouter_rank === 'number' && m.openrouter_rank > 0)
      .sort((a, b) => a.openrouter_rank - b.openrouter_rank);

    const top5 = [];
    const seenBaseSlugs = new Set();
    const seenProviders = new Map();

    for (const m of list) {
      const baseSlug = m.id.split(':')[0].replace(/-\d{4,8}$/, '');
      if (seenBaseSlugs.has(baseSlug)) continue;

      const prov = (m.provider || 'AI').toLowerCase();
      const count = seenProviders.get(prov) || 0;
      if (count >= 2) continue;

      seenBaseSlugs.add(baseSlug);
      seenProviders.set(prov, count + 1);
      top5.push(m);
      if (top5.length === 5) break;
    }

    if (top5.length < 5) {
      for (const m of list) {
        if (!top5.find(x => x.id === m.id)) {
          top5.push(m);
          if (top5.length === 5) break;
        }
      }
    }
    return top5;
  })();

  const top1Volume = rankedLeaders[0]?.openrouter_tokens || 1;

  // 4 Featured Spotlight Models
  const trendingModel =
    rankedLeaders[0] ||
    allowedModels.find(m => m.openrouter_rank === 2 || m.id.includes('deepseek-v4.1-flash')) ||
    allowedModels[0];

  const bestValueModel =
    allowedModels.filter(m => m.is_free && !m.id.endsWith(':batch') && m.openrouter_rank).sort((a, b) => a.openrouter_rank - b.openrouter_rank)[0] ||
    allowedModels.find(m => m.is_free && (m.id.includes('minimax') || m.id.includes('nemotron'))) ||
    allowedModels.find(m => m.is_free) ||
    allowedModels[1];

  const fastestModel =
    allowedModels.find(m =>
      m.id !== trendingModel?.id &&
      !m.id.endsWith(':batch') &&
      (m.id.includes('gemini-flash') || m.id.includes('lightning') || m.id.includes('instant') || m.id.includes('compound-mini') || (m.id.includes('flash') && !m.id.includes('deepseek')))
    ) ||
    allowedModels.find(m => m.id !== trendingModel?.id && m.id.includes('flash')) ||
    allowedModels[2];

  const codingModel =
    allowedModels.find(m =>
      m.id !== trendingModel?.id &&
      !m.id.endsWith(':batch') &&
      (m.id.includes('claude-3.5-sonnet') || m.id.includes('claude-opus') || m.id.includes('gpt-4o') || m.id.includes('gemini-pro') || m.id.includes('glm-5.3-prime'))
    ) ||
    allowedModels.find(m => m.id !== trendingModel?.id && m.id.includes('claude')) ||
    allowedModels[3];

  function startChat(modelOrId) {
    const m = typeof modelOrId === 'object' ? modelOrId : allowedModels.find(x => x.id === modelOrId);
    const modelId = typeof modelOrId === 'string' ? modelOrId : m?.id;
    if (!isPro && !isFreeModel(m || modelId)) {
      setUpgradeModel(m || { id: modelId, name: modelId?.split('/').pop() });
      return;
    }
    navigate(`/dashboard?model=${encodeURIComponent(modelId)}`);
  }

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

  return (
    <div className="space-y-10 pb-16">
      {/* ── Sub-bar: Live Production Fleet Status ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" /> Live Fleet Market Intelligence
          </span>
          <span className="text-gray-500">•</span>
          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Real-time developer token traffic, frontier benchmarks, and low-latency models
          </span>
        </div>
        <div className="flex items-center gap-2">
          {models.length - allowedModels.length > 0 && (
            <span className={`text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1.5 ${
              darkMode ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-red-50 text-red-600 border border-red-200'
            }`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              {models.length - allowedModels.length} Hidden by Guardrails
            </span>
          )}
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${darkMode ? 'bg-[#181818] text-gray-400 border border-[#2a2a2a]' : 'bg-gray-100 text-gray-600'}`}>
            {allowedModels.length} Active Models
          </span>
        </div>
      </div>

      {/* ── 2-Column Dashboard: Top Traffic Models (Left) + 4 Highlight Cards (Right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Global Production Fleet Leaders */}
        <div className={`lg:col-span-6 p-6 rounded-2xl border ${darkMode ? 'bg-[#121212] border-[#222]' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[11px] font-bold text-blue-400 tracking-wider uppercase font-mono">
                Live Production Fleet Activity
              </span>
              <h3 className={`text-base font-bold mt-0.5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Top Models by Daily Developer Traffic
              </h3>
            </div>
            <span className={`text-[11px] font-mono ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Daily Tokens</span>
          </div>

          <div className="space-y-3">
            {rankedLeaders.map((m, idx) => {
              const volumeStr = m.openrouter_volume_str || (m.openrouter_tokens ? `${(m.openrouter_tokens / 1e12).toFixed(2)}T` : 'Top Active');
              const relPct = Math.max(15, Math.min(100, Math.round(((m.openrouter_tokens || (10 - idx) * 1e11) / top1Volume) * 100)));

              return (
                <div
                  key={m.id}
                  onClick={() => setModalModel(m)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer group ${
                    darkMode
                      ? 'bg-[#181818] border-[#262626] hover:border-blue-500/40 hover:bg-[#1e1e1e]'
                      : 'bg-gray-50 border-gray-100 hover:border-blue-300 hover:bg-blue-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-bold font-mono text-gray-500 w-4">{idx + 1}</span>
                    <ProviderLogo provider={m.provider} modelId={m.id} size="md" className="shrink-0" />
                    <div className="min-w-0">
                      <div className={`text-xs font-bold leading-tight truncate group-hover:text-blue-500 transition-colors ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {m.display_name || m.name}
                      </div>
                      <div className="text-[10px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                        <span className="font-medium text-gray-300">{m.provider}</span>
                        <span className="text-gray-600">•</span>
                        <span className="font-mono text-gray-500">
                          {m.context_length ? `${Math.round(m.context_length / 1000)}k ctx` : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-20 bg-gray-800 h-1.5 rounded-full overflow-hidden hidden sm:block">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${relPct}%` }}
                      />
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold font-mono text-blue-400 block">
                        {volumeStr}
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {m.is_free ? '100% Free' : `$${(m.calculated_pricing?.prompt * 1000000 || 0).toFixed(2)}/1M`}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startChat(m.id);
                      }}
                      title="Chat with this model"
                      className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white transition-all ml-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: 4 Hero Highlight Cards */}
        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 1. #1 Trending by Volume */}
          <div
            onClick={() => trendingModel && setModalModel(trendingModel)}
            className={`p-5 rounded-2xl border flex flex-col justify-between cursor-pointer transition-all hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 ${darkMode ? 'bg-[#121212] border-[#222]' : 'bg-white border-gray-200'}`}
          >
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-blue-400">
                <span className="flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> #1 Trending Global</span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  {trendingModel?.openrouter_volume_str || '6.04T'}/Day
                </span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <ProviderLogo provider={trendingModel?.provider} modelId={trendingModel?.id} size="md" />
                <h4 className={`text-sm font-bold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{trendingModel?.display_name || 'DeepSeek V4.1 Flash'}</h4>
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed line-clamp-2">
                {getModelSummary(trendingModel) || 'Highest volume model processing trillions of developer tokens daily.'}
              </p>
            </div>
            <div className={`mt-4 pt-3 border-t flex items-center justify-between gap-3 ${darkMode ? 'border-[#222]' : 'border-gray-100'}`}>
              <span className="text-xs font-mono font-bold text-blue-400 shrink-0">
                {trendingModel?.is_free ? '100% Free' : `$${(trendingModel?.calculated_pricing?.prompt * 1000000 || 0).toFixed(2)}/1M`}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    trendingModel && startChat(trendingModel.id);
                  }}
                  className="text-xs px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Chat
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (trendingModel) {
                      if (onSelectCompare) onSelectCompare(trendingModel);
                      else navigate(`/app/models?view=compare&modelA=${encodeURIComponent(trendingModel.id)}`);
                    }
                  }}
                  className={`text-xs px-2.5 py-1.5 rounded-xl border font-medium flex items-center gap-1 transition-colors ${
                    darkMode ? 'border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white' : 'border-gray-200 hover:border-gray-300 bg-gray-50 text-gray-700'
                  }`}
                >
                  <Scale className="w-3.5 h-3.5 text-sky-400" /> Compare
                </button>
              </div>
            </div>
          </div>

          {/* 2. #1 Free Global Model */}
          <div
            onClick={() => bestValueModel && setModalModel(bestValueModel)}
            className={`p-5 rounded-2xl border flex flex-col justify-between cursor-pointer transition-all hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 ${darkMode ? 'bg-[#121212] border-[#222]' : 'bg-white border-gray-200'}`}
          >
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
                <span className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5" /> #1 Free Global Model</span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  {bestValueModel?.openrouter_volume_str || '661.8B'}/Day
                </span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <ProviderLogo provider={bestValueModel?.provider} modelId={bestValueModel?.id} size="md" />
                <h4 className={`text-sm font-bold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{bestValueModel?.display_name || 'Nemotron 3 Ultra'}</h4>
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed line-clamp-2">
                {getModelSummary(bestValueModel) || 'Zero-cost open foundation model ideal for daily tasks, development, and testing.'}
              </p>
            </div>
            <div className={`mt-4 pt-3 border-t flex items-center justify-between gap-3 ${darkMode ? 'border-[#222]' : 'border-gray-100'}`}>
              <span className="text-xs font-mono font-bold text-emerald-400 shrink-0">100% FREE</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    bestValueModel && startChat(bestValueModel.id);
                  }}
                  className="text-xs px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Chat
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (bestValueModel) {
                      if (onSelectCompare) onSelectCompare(bestValueModel);
                      else navigate(`/app/models?view=compare&modelA=${encodeURIComponent(bestValueModel.id)}`);
                    }
                  }}
                  className={`text-xs px-2.5 py-1.5 rounded-xl border font-medium flex items-center gap-1 transition-colors ${
                    darkMode ? 'border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white' : 'border-gray-200 hover:border-gray-300 bg-gray-50 text-gray-700'
                  }`}
                >
                  <Scale className="w-3.5 h-3.5 text-emerald-400" /> Compare
                </button>
              </div>
            </div>
          </div>

          {/* 3. High Throughput Model */}
          <div
            onClick={() => fastestModel && setModalModel(fastestModel)}
            className={`p-5 rounded-2xl border flex flex-col justify-between cursor-pointer transition-all hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10 ${darkMode ? 'bg-[#121212] border-[#222]' : 'bg-white border-gray-200'}`}
          >
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-amber-400">
                <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> High Throughput</span>
                <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full">
                  &lt;300ms Latency
                </span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <ProviderLogo provider={fastestModel?.provider} modelId={fastestModel?.id} size="md" />
                <h4 className={`text-sm font-bold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{fastestModel?.display_name || 'GLM 5.3 Flash'}</h4>
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed line-clamp-2">
                {getModelSummary(fastestModel) || 'Optimized for high-concurrency production applications requiring sub-second response times.'}
              </p>
            </div>
            <div className={`mt-4 pt-3 border-t flex items-center justify-between gap-3 ${darkMode ? 'border-[#222]' : 'border-gray-100'}`}>
              <span className="text-xs font-mono font-bold text-amber-400 shrink-0">
                {fastestModel?.is_free ? '100% Free' : `$${(fastestModel?.calculated_pricing?.prompt * 1000000 || 0).toFixed(2)}/1M`}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    fastestModel && startChat(fastestModel.id);
                  }}
                  className="text-xs px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Chat
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (fastestModel) {
                      if (onSelectCompare) onSelectCompare(fastestModel);
                      else navigate(`/app/models?view=compare&modelA=${encodeURIComponent(fastestModel.id)}`);
                    }
                  }}
                  className={`text-xs px-2.5 py-1.5 rounded-xl border font-medium flex items-center gap-1 transition-colors ${
                    darkMode ? 'border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white' : 'border-gray-200 hover:border-gray-300 bg-gray-50 text-gray-700'
                  }`}
                >
                  <Scale className="w-3.5 h-3.5 text-amber-400" /> Compare
                </button>
              </div>
            </div>
          </div>

          {/* 4. Frontier Intelligence */}
          <div
            onClick={() => codingModel && setModalModel(codingModel)}
            className={`p-5 rounded-2xl border flex flex-col justify-between cursor-pointer transition-all hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 ${darkMode ? 'bg-[#121212] border-[#222]' : 'bg-white border-gray-200'}`}
          >
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-purple-400">
                <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Frontier Intelligence</span>
                <span className="text-[10px] font-mono text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded-full">
                  {codingModel?.openrouter_volume_str || '1.10T'}/Day
                </span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <ProviderLogo provider={codingModel?.provider} modelId={codingModel?.id} size="md" />
                <h4 className={`text-sm font-bold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{codingModel?.display_name || 'Claude Opus 5.5'}</h4>
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed line-clamp-2">
                {getModelSummary(codingModel) || 'State of the art reasoning, complex coding, and multi-step agentic problem solving.'}
              </p>
            </div>
            <div className={`mt-4 pt-3 border-t flex items-center justify-between gap-3 ${darkMode ? 'border-[#222]' : 'border-gray-100'}`}>
              <span className="text-xs font-mono font-bold text-purple-400 shrink-0">
                ${(codingModel?.calculated_pricing?.prompt * 1000000 || 0).toFixed(2)}/1M
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    codingModel && startChat(codingModel.id);
                  }}
                  className="text-xs px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Chat
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (codingModel) {
                      if (onSelectCompare) onSelectCompare(codingModel);
                      else navigate(`/app/models?view=compare&modelA=${encodeURIComponent(codingModel.id)}`);
                    }
                  }}
                  className={`text-xs px-2.5 py-1.5 rounded-xl border font-medium flex items-center gap-1 transition-colors ${
                    darkMode ? 'border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white' : 'border-gray-200 hover:border-gray-300 bg-gray-50 text-gray-700'
                  }`}
                >
                  <Scale className="w-3.5 h-3.5 text-purple-400" /> Compare
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Fleet Domain Pillars ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Chat & Reasoning LLMs',
            desc: '310+ frontier text foundation models from Anthropic, OpenAI, DeepSeek & Meta.',
            icon: MessageSquare,
            badge: 'Text & Code',
            color: 'blue',
            modality: 'chat',
          },
          {
            title: 'Studio Image Generation',
            desc: 'Ultra-fast FLUX.1, Gemini Flash Image, Recraft V20, and GPT-5 Image generation.',
            icon: ImageIcon,
            badge: 'Creative Studio',
            color: 'pink',
            modality: 'image_gen',
          },
          {
            title: '1080p Cinematic Video',
            desc: 'Photorealistic motion with Gemini Omni Flash, Kling 1.5 Pro, and Luma Ray 2.',
            icon: Film,
            badge: '1080p Cinema',
            color: 'purple',
            modality: 'video',
          },
          {
            title: 'Voice Clone & Hi-Fi Audio',
            desc: 'Instant voice synthesis with GPT Audio, Lyria 3, and F5-TTS music & voice.',
            icon: Volume2,
            badge: 'Studio Sound',
            color: 'amber',
            modality: 'audio',
          },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={i}
              onClick={() => onSwitchToCatalog && onSwitchToCatalog(item.modality)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer hover:-translate-y-1 ${
                darkMode
                  ? 'bg-[#121212] border-[#222] hover:border-blue-500/40 hover:bg-[#161616]'
                  : 'bg-white border-gray-200 hover:border-blue-300 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-xl ${
                  item.color === 'blue' ? 'bg-blue-500/10 text-blue-400' :
                  item.color === 'pink' ? 'bg-pink-500/10 text-pink-400' :
                  item.color === 'purple' ? 'bg-purple-500/10 text-purple-400' :
                  'bg-amber-500/10 text-amber-400'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-300">
                  {item.badge}
                </span>
              </div>
              <h4 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.title}</h4>
              <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{item.desc}</p>
            </div>
          );
        })}
      </div>

      {/* ── Call To Action Banner: Switch to Direct Catalog ── */}
      <div className={`p-6 sm:p-8 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-6 ${
        darkMode ? 'bg-gradient-to-r from-blue-950/30 via-[#141418] to-purple-950/30 border-blue-500/30' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
      }`}>
        <div className="space-y-1.5 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/20 mb-1">
            <Layers className="w-3.5 h-3.5" /> Full AI Infrastructure Fleet
          </div>
          <h3 className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Ready to explore all 470+ models with live filters?
          </h3>
          <p className={`text-xs sm:text-sm max-w-2xl ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Jump directly into the Model Catalog with quick search, modality filters, pricing tiers, and side-by-side comparison.
          </p>
        </div>
        <button
          onClick={onSwitchToCatalog}
          className="px-6 py-3 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 transition-all hover:scale-105 whitespace-nowrap flex items-center gap-2"
        >
          <span>Open Full Catalog</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── Modals ── */}
      <ModelDetailModal
        model={modalModel}
        isOpen={Boolean(modalModel)}
        onClose={() => setModalModel(null)}
        darkMode={darkMode}
        onSelectCompare={m => {
          setModalModel(null);
          if (onSelectCompare) onSelectCompare(m);
        }}
      />

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

      {falModalModel && (
        <FalMediaModal
          model={falModalModel}
          darkMode={darkMode}
          onClose={() => setFalModalModel(null)}
        />
      )}
    </div>
  );
}
