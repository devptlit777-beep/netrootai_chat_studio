import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Cpu,
  Search,
  Zap,
  Flame,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  SlidersHorizontal,
  ExternalLink,
  Shield,
  Clock,
  Layers,
} from 'lucide-react';

const APP_URL = '';

const ALL_MODELS = [
  {
    id: 'openai/gpt-oss-20b',
    name: 'GPT OSS 20B',
    provider: 'OpenAI (Open Weight)',
    category: 'free',
    badge: '100% Free Forever',
    badgeColor: 'blue',
    latency: '< 38ms',
    throughput: '148 tok/s',
    context: '131k',
    pricing: '$0.00 / 1M tokens',
    desc: 'High-speed open-weight model running natively on NetRoot Accelerated Neural Clusters with deterministic execution.',
  },
  {
    id: 'qwen/qwen3.8-27b',
    name: 'Qwen 3.8 27B Vision',
    provider: 'Alibaba Cloud',
    category: 'free',
    badge: '100% Free Vision',
    badgeColor: 'blue',
    latency: '48ms',
    throughput: '124 tok/s',
    context: '131k',
    pricing: '$0.00 / 1M tokens',
    desc: 'Multimodal vision model capable of analyzing charts, diagrams, and image inputs.',
  },
  {
    id: 'allam-2-7b',
    name: 'ALLaM 2 7B',
    provider: 'SDAIA',
    category: 'free',
    badge: '100% Free Fast',
    badgeColor: 'blue',
    latency: '28ms',
    throughput: '162 tok/s',
    context: '131k',
    pricing: '$0.00 / 1M tokens',
    desc: 'Ultra-lightweight bilingual English/Arabic intelligence tuned for low-latency turns.',
  },
  {
    id: 'netroot/compound-mini',
    name: 'NetRoot Compound Mini',
    provider: 'NetRoot AI',
    category: 'free',
    badge: '100% Free Agent',
    badgeColor: 'amber',
    latency: '34ms',
    throughput: '150 tok/s',
    context: '131k',
    pricing: '$0.00 / 1M tokens',
    desc: 'Versatile agent model designed for multi-step logic and structured tool execution.',
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    category: 'titans',
    badge: 'Frontier Leader',
    badgeColor: 'purple',
    latency: '420ms',
    throughput: '72 tok/s',
    context: '200k',
    pricing: '$3.00 / $15.00',
    desc: 'The industry benchmark for autonomous coding, complex multi-step reasoning, and vision.',
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o Omnimodel',
    provider: 'OpenAI',
    category: 'titans',
    badge: 'Flagship Omni',
    badgeColor: 'blue',
    latency: '380ms',
    throughput: '86 tok/s',
    context: '128k',
    pricing: '$2.50 / $10.00',
    desc: 'Industry standard omnimodel with rapid multimodal comprehension across text and images.',
  },
  {
    id: 'deepseek/deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'DeepSeek',
    category: 'titans',
    badge: 'Reasoning King',
    badgeColor: 'blue',
    latency: '520ms',
    throughput: '64 tok/s',
    context: '64k',
    pricing: '$0.55 / $2.19',
    desc: 'Breakthrough reinforcement reasoning model matching top proprietary models at a fraction of cost.',
  },
  {
    id: 'google/gemini-pro-1.5',
    name: 'Gemini 1.5 Pro',
    provider: 'Google AI',
    category: 'titans',
    badge: '2M Giant Context',
    badgeColor: 'blue',
    latency: '450ms',
    throughput: '68 tok/s',
    context: '2M Ctx',
    pricing: '$3.50 / $10.50',
    desc: 'Massive two-million token context window for ingesting complete codebases and extensive research.',
  },
  {
    id: 'nvidia/llama-3.1-nemotron-70b',
    name: 'Nemotron 70B',
    provider: 'NVIDIA',
    category: 'titans',
    badge: 'NVIDIA Alignment',
    badgeColor: 'blue',
    latency: '240ms',
    throughput: '92 tok/s',
    context: '128k',
    pricing: '$0.80 / $2.40',
    desc: 'Engineered by NVIDIA for maximum instruction alignment and synthetic dataset creation.',
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B Instruct',
    provider: 'Meta AI',
    category: 'titans',
    badge: 'Open Flagship',
    badgeColor: 'sky',
    latency: '180ms',
    throughput: '110 tok/s',
    context: '128k',
    pricing: '$0.40 / $0.40',
    desc: 'Meta latest open-weight titan offering near-frontier performance with low operational overhead.',
  },
  {
    id: 'black-forest-labs/flux.1-schnell',
    name: 'FLUX.1 Schnell 4K',
    provider: 'Black Forest Labs',
    category: 'media',
    badge: 'Generative Art',
    badgeColor: 'rose',
    latency: '1.2s',
    throughput: '4-step flow',
    context: '4K Res',
    pricing: '10 free/mo on Pro',
    desc: 'Rectified flow 12B parameter image generator producing ultra-high fidelity photography.',
  },
  {
    id: 'agnes/video-2.5-flash',
    name: 'Agnes Video 2.5 Flash',
    provider: 'Fal.ai / Agnes',
    category: 'media',
    badge: 'Motion Engine',
    badgeColor: 'purple',
    latency: '4.8s',
    throughput: '60 FPS',
    context: '16:9 / 9:16',
    pricing: 'Usage Wallet',
    desc: 'Generative video model delivering cinematic camera orbit and realistic physics motion.',
  },
];

export default function ModelsPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState('all'); // 'all' | 'free' | 'titans' | 'media'
  const [search, setSearch] = useState('');

  const filteredModels = ALL_MODELS.filter((m) => {
    const matchFilter = filter === 'all' || m.category === filter;
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.provider.toLowerCase().includes(search.toLowerCase()) ||
      m.desc.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="pt-32 pb-24 overflow-hidden">
      {/* Background Aurora */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Page Hero */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel border border-indigo-500/30 text-xs font-semibold text-indigo-300">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>NetRoot AI Fleet Directory</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
            Unified Access to{' '}
            <span className="text-blue-500">
              470+ AI Models.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            One API key, one studio interface. Switch seamlessly between 100% free open-weight models running on NetRoot Neural Architecture, frontier flagships, and multimodal generative tools.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to={user ? "/dashboard" : "/chat"}
              className="px-7 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs sm:text-sm shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all"
            >
              <span>{user ? "Open Studio Dashboard" : "Try Free in Trial Chat"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to={user ? "/workspace?tab=keys" : "/login"}
              className="px-6 py-3.5 rounded-2xl glass-panel hover:bg-white/10 text-slate-200 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors"
            >
              <span>{user ? "Manage API Keys" : "Get Developer Access"}</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>
        </div>

        {/* ── Search & Filter Controls ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-3xl glass-panel border border-white/10">
          {/* Search Bar */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search model name, provider or task..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filter === 'all'
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              All Models ({ALL_MODELS.length})
            </button>
            <button
              onClick={() => setFilter('free')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filter === 'free'
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              100% Free Forever
            </button>
            <button
              onClick={() => setFilter('titans')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filter === 'titans'
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Industry Titans
            </button>
            <button
              onClick={() => setFilter('media')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filter === 'media'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Image & Video
            </button>
          </div>
        </div>

        {/* ── Models Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModels.map((model) => (
            <div
              key={model.id}
              className="rounded-3xl glass-panel p-6 border border-white/10 glass-panel-hover flex flex-col justify-between hologram-card group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase font-mono tracking-wider px-2.5 py-0.5 rounded bg-white/[0.06] text-slate-300 border border-white/10">
                    {model.badge}
                  </span>
                  <span className="text-xs font-mono text-blue-400 font-bold">{model.latency}</span>
                </div>

                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-300 transition-colors">
                  {model.name}
                </h3>
                <div className="text-xs text-slate-400 mb-3">{model.provider}</div>

                <p className="text-xs text-slate-300 leading-relaxed mb-4">{model.desc}</p>
              </div>

              <div className="pt-4 border-t border-white/10 space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-mono">
                  <div className="p-2 rounded-xl bg-white/[0.03]">
                    <div className="text-slate-400 text-[10px]">Context</div>
                    <div className="font-bold text-white">{model.context}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-white/[0.03]">
                    <div className="text-slate-400 text-[10px]">Speed</div>
                    <div className="font-bold text-slate-200">{model.throughput}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-white/[0.03]">
                    <div className="text-slate-400 text-[10px]">Pricing</div>
                    <div className="font-bold text-blue-300 truncate">{model.pricing}</div>
                  </div>
                </div>

                <Link
                  to={user ? "/app/models" : "/login"}
                  className="w-full py-2.5 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/25 text-xs font-medium flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>{user ? "Deploy in Studio" : "Sign in to Deploy"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
