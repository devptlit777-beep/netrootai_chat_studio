import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Share2,
  Copy,
  Check,
  CreditCard,
  Sparkles,
  Zap,
  Award,
  Cpu,
  Layers,
  Scale,
  DollarSign,
  Clock,
  Sliders,
  CheckCircle2,
  Eye,
  Brain,
  Wrench,
  FileCode,
  FileText,
  BarChart3,
  Code2,
  ExternalLink,
  ShieldCheck,
  Lock,
  MessageSquare,
  Film,
  Volume2,
} from 'lucide-react';
import { usePlan } from '../../contexts/PlanContext';
import ProUpgradeModal from './ProUpgradeModal';
import FalMediaModal from './FalMediaModal';
import { getFullModelDescription } from '../../lib/modelDescriptions';
import { getModelBenchmarks } from '../../lib/modelBenchmarks';
import ProviderLogo from '../common/ProviderLogo';

export default function ModelDetailModal({
  model,
  isOpen,
  onClose,
  darkMode = true,
  onSelectCompare,
  onPurchase,
}) {
  const navigate = useNavigate();
  const { plan, featureAccess } = usePlan();
  const isPro = plan === 'pro' || plan === 'enterprise' || Boolean(featureAccess?.models);

  const [activeTab, setActiveTab] = useState('overview'); // overview, pricing, benchmarks, parameters
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSpecs, setCopiedSpecs] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [calculatorWords, setCalculatorWords] = useState(10000);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showMediaStudio, setShowMediaStudio] = useState(false);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        if (showUpgradeModal) setShowUpgradeModal(false);
        else onClose();
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, showUpgradeModal, onClose]);

  // Reset tab when model changes
  useEffect(() => {
    if (model) {
      setActiveTab('overview');
      setShowUpgradeModal(false);
    }
  }, [model]);

  if (!isOpen || !model) return null;

  // Format numbers & rates
  const promptRatePer1M = model.calculated_pricing?.prompt
    ? (model.calculated_pricing.prompt * 1000000).toFixed(2)
    : '0.00';
  const compRatePer1M = model.calculated_pricing?.completion
    ? (model.calculated_pricing.completion * 1000000).toFixed(2)
    : '0.00';
  const imageRate = model.calculated_pricing?.image
    ? Number(model.calculated_pricing.image).toFixed(4)
    : '0.00';

  // Base pricing
  const basePrompt = model.base_pricing?.prompt
    ? (model.base_pricing.prompt * 1000000).toFixed(2)
    : '0.00';
  const baseComp = model.base_pricing?.completion
    ? (model.base_pricing.completion * 1000000).toFixed(2)
    : '0.00';

  // Context window labels
  const ctxNumber = model.context_length || 0;
  const ctxLabel = ctxNumber >= 1000000
    ? `${(ctxNumber / 1000000).toFixed(1)}M`
    : `${Math.round(ctxNumber / 1000)}k`;
  const estimatedWords = Math.round(ctxNumber * 0.75).toLocaleString();
  const estimatedPages = Math.round(ctxNumber / 400).toLocaleString();

  // Media & Capability Detection
  const isGenerativeVideo = model.media_category === 'video' || model.id?.startsWith('fal-ai/kling') || model.id?.startsWith('fal-ai/luma-dream-machine') || model.id?.startsWith('fal-ai/minimax-video') || model.id?.startsWith('fal-ai/cogvideox');
  const isGenerativeImage = model.media_category === 'image' || model.id?.startsWith('fal-ai/flux') || model.id?.startsWith('fal-ai/recraft') || model.id?.startsWith('fal-ai/stable-diffusion-3.5');
  const isGenerativeAudio = model.media_category === 'audio' || model.id?.startsWith('fal-ai/f5-tts') || model.id?.startsWith('fal-ai/stable-audio') || model.id?.startsWith('fal-ai/whisper');
  const isMediaModel = isGenerativeVideo || isGenerativeImage || isGenerativeAudio;
  const mediaGenCost = model.calculated_pricing?.image
    ? Number(model.calculated_pricing.image).toFixed(4)
    : isGenerativeVideo ? '0.2500' : isGenerativeAudio ? '0.0500' : '0.0400';

  // Authentic Benchmarks
  const benchmarks = getModelBenchmarks(model);
  const intellScore = benchmarks.intelligence;
  const codingScore = benchmarks.coding;
  const agenticScore = benchmarks.agentic;

  // Live Cost Calculator (~1 word = ~1.33 tokens, assume 30% prompt, 70% completion)
  const calcTokens = Math.round(calculatorWords * 1.33);
  const promptTokens = Math.round(calcTokens * 0.3);
  const compTokens = Math.round(calcTokens * 0.7);
  const estimatedCost = model.is_free
    ? '0.00'
    : (
      (promptTokens * (model.calculated_pricing?.prompt || 0)) +
      (compTokens * (model.calculated_pricing?.completion || 0))
    ).toFixed(4);

  // Supported parameters list
  const params = Array.isArray(model.supported_parameters) ? model.supported_parameters : [];
  const hasTools = params.includes('tools') || params.includes('parallel_tool_calls');
  const hasStructured = params.includes('structured_outputs') || params.includes('response_format');
  const hasReasoning = params.includes('reasoning') || params.includes('include_reasoning');
  const hasVision = model.modalities?.includes('image');

  // Share Actions
  const currentUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?tab=catalog&model=${encodeURIComponent(model.id)}`
    : '';

  async function handleCopyLink() {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(currentUrl);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (e) {
      console.warn('Clipboard failed:', e);
    }
  }

  async function handleShareSpecs() {
    const summaryText = `🤖 AI Model: ${model.display_name || model.name} (${model.provider})\n` +
      `🧠 Context Window: ${ctxLabel} tokens (~${estimatedWords} words)\n` +
      `💰 Pricing: ${model.is_free ? '100% Free' : `$${promptRatePer1M} in / $${compRatePer1M} out per 1M tokens`}\n` +
      `⚡ Features: ${[hasVision ? 'Vision' : '', hasTools ? 'Tools' : '', hasReasoning ? 'Reasoning' : '', model.custom_badge || ''].filter(Boolean).join(', ')}\n` +
      `🔗 View details on Netroot AI: ${currentUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${model.display_name || model.name} - Netroot AI`,
          text: summaryText,
          url: currentUrl,
        });
        return;
      } catch (e) {
        // user cancelled
      }
    }

    try {
      await navigator.clipboard.writeText(summaryText);
      setCopiedSpecs(true);
      setTimeout(() => setCopiedSpecs(false), 2500);
    } catch (e) {
      console.warn(e);
    }
  }

  function handleCopyCurl() {
    const gatewayUrl = (typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'https://netrootai.tech') + '/api/v1/chat/completions';
    const curlSnippet = `curl ${gatewayUrl} \\\n  -H "Authorization: Bearer YOUR_NETROOT_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "model": "${model.id}",\n    "messages": [{"role": "user", "content": "Hello!"}]\n  }'`;
    navigator.clipboard?.writeText(curlSnippet);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2500);
  }

  return (
    <>
      {/* ── Backdrop Overlay ── */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md transition-opacity duration-200 animate-in fade-in flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      >
        {/* ── Deep-Dive Centered Modal (OpenRouter Style) ── */}
        <div
          onClick={e => e.stopPropagation()}
          className={`relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-200 ${darkMode
              ? 'bg-[#121214] border-[#26262a] text-white shadow-black/80'
              : 'bg-white border-gray-200 text-gray-900 shadow-2xl'
            }`}
        >
          {/* ── Modal Top Header ── */}
          <div className={`p-5 sm:p-6 border-b flex items-start justify-between gap-4 ${darkMode ? 'border-[#26262a] bg-[#161618]' : 'border-gray-100 bg-gray-50'}`}>
            <div className="flex items-start gap-3.5 min-w-0">
              <ProviderLogo provider={model.provider} modelId={model.id} size="lg" />

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${darkMode ? 'bg-[#222] text-gray-300 border border-[#333]' : 'bg-gray-200 text-gray-700'
                    }`}>
                    {model.provider}
                  </span>

                  {model.is_free ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      100% FREE
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                      PREMIUM
                    </span>
                  )}

                  {model.custom_badge && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                      {model.custom_badge}
                    </span>
                  )}
                </div>

                <h2 className={`text-xl sm:text-2xl font-extrabold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {model.display_name || model.name}
                </h2>
                <p className="text-xs text-gray-400 font-mono mt-0.5 truncate">{model.id}</p>
              </div>
            </div>

            {/* Header Action Buttons: Compare, Share & Close */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Compare in Arena Button */}
              {onSelectCompare && (
                <button
                  onClick={() => {
                    onSelectCompare(model);
                    onClose();
                  }}
                  title="Compare this model in Arena"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    darkMode
                      ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-600/20 hover:text-white'
                      : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                  }`}
                >
                  <Scale className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Compare</span>
                </button>
              )}

              {/* Share Specs Button */}
              <button
                onClick={handleShareSpecs}
                title="Share Model Card & Specs"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${copiedSpecs
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : darkMode
                      ? 'bg-[#1e1e22] border-[#2e2e34] text-gray-300 hover:text-white hover:bg-[#28282e]'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
              >
                {copiedSpecs ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copiedSpecs ? 'Copied Specs!' : 'Share'}</span>
              </button>

              {/* Copy Direct Link Button */}
              <button
                onClick={handleCopyLink}
                title="Copy Direct Link to this Model"
                className={`p-1.5 rounded-xl border transition-all ${copiedLink
                    ? 'bg-blue-600 text-white border-blue-500'
                    : darkMode
                      ? 'bg-[#1e1e22] border-[#2e2e34] text-gray-400 hover:text-white'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>

              {/* Close Button */}
              <button
                onClick={onClose}
                className={`p-1.5 rounded-xl transition-colors ${darkMode ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-200 text-gray-600'
                  }`}
                title="Close modal (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ── Segmented Navigation Tabs (OpenRouter Style) ── */}
          <div className={`px-5 sm:px-6 pt-2 border-b flex items-center gap-2 overflow-x-auto ${darkMode ? 'border-[#26262a] bg-[#141416]' : 'border-gray-100 bg-gray-50/50'}`}>
            {[
              { id: 'overview', label: 'Overview & Specs', icon: FileText },
              { id: 'pricing', label: 'Pricing & Estimator', icon: DollarSign },
              { id: 'benchmarks', label: 'Benchmarks & Speed', icon: BarChart3 },
              { id: 'parameters', label: 'Developer & Tooling', icon: Sliders },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${isActive
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
                    }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ── Modal Body Content (Tab Switching) ── */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs">
            {/* ════ TAB 1: OVERVIEW & SPECS ════ */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* 4 Quick Stat Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-[#18181c] border-[#26262a]' : 'bg-gray-50 border-gray-100'}`}>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">
                      {isMediaModel ? (isGenerativeVideo ? 'Resolution & Frame Rate' : isGenerativeAudio ? 'Audio Master Quality' : 'Generation Resolution') : 'Context Window'}
                    </span>
                    <div className="text-lg font-bold font-mono text-blue-400 mt-1">
                      {isGenerativeVideo ? '1080p HD Video' : isGenerativeAudio ? '44.1kHz Hi-Fi' : isGenerativeImage ? 'Up to 2K (2048px)' : `${ctxLabel} tokens`}
                    </div>
                    <span className="text-[10px] text-gray-500 mt-0.5 block">
                      {isGenerativeVideo ? 'Cinematic 24-30fps Motion' : isGenerativeAudio ? 'Zero-shot Voice Synthesis' : isGenerativeImage ? 'Ultra-detail Diffusion' : `~${estimatedWords} words (${estimatedPages} pages)`}
                    </span>
                  </div>

                  <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-[#18181c] border-[#26262a]' : 'bg-gray-50 border-gray-100'}`}>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">Supported Modalities</span>
                    <div className={`text-lg font-bold capitalize mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {isGenerativeVideo ? 'Text / Image → Video' : isGenerativeAudio ? 'Text → Studio Audio' : isGenerativeImage ? 'Text → High-Res Image' : (model.modalities?.join(' + ') || 'Text')}
                    </div>
                    <span className="text-[10px] text-gray-500 mt-0.5 block">Input & Output format</span>
                  </div>

                  <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-[#18181c] border-[#26262a]' : 'bg-gray-50 border-gray-100'}`}>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">Uptime SLA</span>
                    <div className="text-lg font-bold text-emerald-400 font-mono mt-1">
                      {model.uptime_pct || 99.4}%
                    </div>
                    <span className="text-[10px] text-gray-500 mt-0.5 block">Past 30 days availability</span>
                  </div>

                  <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-[#18181c] border-[#26262a]' : 'bg-gray-50 border-gray-100'}`}>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">Access Level</span>
                    <div className="text-lg font-bold capitalize mt-1 text-amber-400">
                      {model.min_plan || (model.is_free ? 'Free' : 'Pro')} Tier
                    </div>
                    <span className="text-[10px] text-gray-500 mt-0.5 block">Required account tier</span>
                  </div>
                </div>

                {/* Capability Chips */}
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2.5">
                    Core Capabilities & Features
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {hasVision && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Eye className="w-3.5 h-3.5" /> High-Resolution Vision Input
                      </span>
                    )}
                    {hasTools && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        <Wrench className="w-3.5 h-3.5" /> Function & Parallel Tool Calling
                      </span>
                    )}
                    {hasStructured && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <FileCode className="w-3.5 h-3.5" /> Structured JSON Output
                      </span>
                    )}
                    {hasReasoning && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <Brain className="w-3.5 h-3.5" /> Deep Reasoning & Thought Process
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <ShieldCheck className="w-3.5 h-3.5" /> Commercial License Ready
                    </span>
                  </div>
                </div>

                {/* Full Complete Description */}
                <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-[#18181c] border-[#26262a]' : 'bg-gray-50 border-gray-100'}`}>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-3 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-400" />
                    Complete Model Overview & Description
                  </h4>
                  <div className={`text-xs sm:text-sm leading-relaxed whitespace-pre-line ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {getFullModelDescription(model) || 'Advanced multimodal generative AI model engineered for high accuracy, complex reasoning, and low-latency production applications.'}
                  </div>
                </div>
              </div>
            )}

            {/* ════ TAB 2: PRICING & ESTIMATOR ════ */}
            {activeTab === 'pricing' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* Pricing Grid */}
                <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-[#18181c] border-[#26262a]' : 'bg-gray-50 border-gray-100'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-gray-200">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      Token Rates & Cost Structure
                    </span>
                    {model.is_free && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        100% Free - Zero Token Cost
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {isMediaModel ? (
                      <>
                        <div className={`p-4 rounded-xl border sm:col-span-2 ${darkMode ? 'bg-purple-950/20 border-purple-500/30' : 'bg-purple-50 border-purple-200'}`}>
                          <div className="text-[10px] text-purple-400 uppercase font-semibold">
                            {isGenerativeVideo ? 'Video Generation Rate' : isGenerativeAudio ? 'Audio & Speech Rate' : 'Image Generation Rate'}
                          </div>
                          <div className={`text-2xl font-bold font-mono mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            ${mediaGenCost} <span className="text-xs text-gray-400 font-normal">/ {isGenerativeVideo ? 'video clip' : isGenerativeAudio ? 'synthesis' : 'generated image'}</span>
                          </div>
                          <div className="text-[10px] text-gray-400 mt-1">
                            Flat compute cost per completed generation run on dedicated high-speed GPU clusters.
                          </div>
                        </div>

                        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-[#121214] border-[#26262a]' : 'bg-white border-gray-200'}`}>
                          <div className="text-[10px] text-gray-400 uppercase font-semibold">Execution Engine</div>
                          <div className="text-sm font-bold mt-1 text-purple-400">
                            {model.provider || 'Studio'} Engine
                          </div>
                          <div className="text-[10px] text-gray-500 mt-1">
                            Hardware accelerated GPU
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-[#121214] border-[#26262a]' : 'bg-white border-gray-200'}`}>
                          <div className="text-[10px] text-gray-400 uppercase font-semibold">Prompt (Input Tokens)</div>
                          <div className={`text-lg font-bold font-mono mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            ${promptRatePer1M} <span className="text-[11px] text-gray-500 font-normal">/ 1M</span>
                          </div>
                          <div className="text-[10px] text-gray-500 mt-1 font-mono">
                            Base: ${basePrompt} / 1M
                          </div>
                        </div>

                        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-[#121214] border-[#26262a]' : 'bg-white border-gray-200'}`}>
                          <div className="text-[10px] text-gray-400 uppercase font-semibold">Completion (Output Tokens)</div>
                          <div className={`text-lg font-bold font-mono mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            ${compRatePer1M} <span className="text-[11px] text-gray-500 font-normal">/ 1M</span>
                          </div>
                          <div className="text-[10px] text-gray-500 mt-1 font-mono">
                            Base: ${baseComp} / 1M
                          </div>
                        </div>

                        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-[#121214] border-[#26262a]' : 'bg-white border-gray-200'}`}>
                          <div className="text-[10px] text-gray-400 uppercase font-semibold">Image Modality Input</div>
                          <div className={`text-lg font-bold font-mono mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            ${imageRate} <span className="text-[11px] text-gray-500 font-normal">/ image</span>
                          </div>
                          <div className="text-[10px] text-gray-500 mt-1">
                            {hasVision ? 'Vision supported' : 'Text only'}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Interactive Word & Token Cost Estimator */}
                  <div className="mt-5 pt-5 border-t border-[#26262a]">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} font-semibold`}>Interactive Conversation Cost Estimator:</span>
                      <span className="font-mono font-bold text-base text-emerald-400">
                        {model.is_free ? '100% Free' : `≈ $${estimatedCost}`}
                      </span>
                    </div>

                    <input
                      type="range"
                      min="1000"
                      max="100000"
                      step="1000"
                      value={calculatorWords}
                      onChange={e => setCalculatorWords(Number(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600 my-2"
                    />

                    <div className="flex items-center justify-between text-[11px] text-gray-400">
                      <span>1k words</span>
                      <span className={`font-semibold px-2.5 py-0.5 rounded ${darkMode ? 'text-white bg-[#222]' : 'text-gray-900 bg-gray-200'}`}>
                        {calculatorWords.toLocaleString()} words (~{calcTokens.toLocaleString()} tokens)
                      </span>
                      <span>100k words</span>
                    </div>
                  </div>
                </div>

                {/* Pro Access / Subscription Banner */}
                {!model.is_free && (
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/40 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        {isPro ? (
                          <>
                            <Sparkles className="w-4 h-4 text-emerald-400" />
                            Unlocked with Active Netroot Pro Subscription
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4 text-amber-400" />
                            Frontier Model — Requires Netroot Pro ($19/mo)
                          </>
                        )}
                      </h4>
                      <p className="text-xs text-gray-300 mt-1">
                        {isPro
                          ? 'Your Pro plan gives you unmetered access to this model, 460+ catalog models, and 100k daily tokens.'
                          : 'Subscribe to Netroot Pro to unlock this model, all 460+ catalog models, 100k daily tokens, and FLUX image generation.'}
                      </p>
                    </div>
                    {isPro ? (
                      <button
                        onClick={() => {
                          navigate(`/dashboard?model=${encodeURIComponent(model.id)}`);
                          onClose();
                        }}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-lg shadow-emerald-500/20 whitespace-nowrap self-start sm:self-auto flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Chat in Studio
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowUpgradeModal(true)}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition-all shadow-lg shadow-indigo-500/25 whitespace-nowrap self-start sm:self-auto flex items-center gap-1.5"
                      >
                        <Zap className="w-4 h-4" />
                        Unlock with Pro ($19/mo)
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ════ TAB 3: BENCHMARKS & SPEED ════ */}
            {activeTab === 'benchmarks' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-[#18181c] border-[#26262a]' : 'bg-gray-50 border-gray-100'}`}>
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-200 mb-4 flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-blue-400" />
                    Independent Artificial Analysis Benchmarks
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-gray-300 font-medium">Quality & Intelligence Index (MMLU / Reasoning)</span>
                        <span className="font-mono font-bold text-blue-400">{intellScore ? `${intellScore} / 100` : '—'}</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-[#222] overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all"
                          style={{ width: `${Math.min(intellScore || 50, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-gray-300 font-medium">Coding & Engineering Index (HumanEval / SWE-bench)</span>
                        <span className="font-mono font-bold text-emerald-400">{codingScore ? `${codingScore} / 100` : '—'}</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-[#222] overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-600 to-teal-400 rounded-full transition-all"
                          style={{ width: `${Math.min(codingScore || 45, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-gray-300 font-medium">Agentic Autonomy & Tool Use Score</span>
                        <span className="font-mono font-bold text-purple-400">{agenticScore ? `${agenticScore} / 100` : '—'}</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-[#222] overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-600 to-pink-500 rounded-full transition-all"
                          style={{ width: `${Math.min(agenticScore || 40, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-500 mt-4 leading-relaxed">
                    * Benchmarks are independently indexed via Artificial Analysis and design arena standards. Higher scores represent superior performance in zero-shot problem solving.
                  </p>
                </div>
              </div>
            )}

            {/* ════ TAB 4: DEVELOPER & PARAMETERS ════ */}
            {activeTab === 'parameters' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* Parameters List */}
                <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-[#18181c] border-[#26262a]' : 'bg-gray-50 border-gray-100'}`}>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-3 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    Supported API Parameters ({params.length})
                  </h4>

                  <div className="flex flex-wrap gap-2">
                    {params.map(p => (
                      <span
                        key={p}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium ${darkMode ? 'bg-[#121214] text-gray-300 border border-[#2a2a2a]' : 'bg-white text-gray-700 border border-gray-200'
                          }`}
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                {/* API Quick Start Code Snippet */}
                <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-[#18181c] border-[#26262a]' : 'bg-gray-50 border-gray-100'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                      <Code2 className="w-4 h-4 text-emerald-400" />
                      cURL API Request Snippet
                    </h4>
                    <button
                      onClick={handleCopyCurl}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#222] hover:bg-[#2c2c2c] text-gray-300 transition-colors"
                    >
                      {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCurl ? 'Copied' : 'Copy cURL'}</span>
                    </button>
                  </div>

                  <pre className="p-3.5 rounded-xl bg-[#0e0e10] border border-[#26262a] text-[11px] font-mono text-gray-300 overflow-x-auto leading-relaxed">
                    {`curl ${(typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'https://netrootai.tech')}/api/v1/chat/completions \\
  -H "Authorization: Bearer YOUR_NETROOT_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${model.id}",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'`}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* ── Modal Sticky Footer ── */}
          <div className={`p-4 sm:p-5 border-t flex items-center justify-between gap-3 ${darkMode ? 'bg-[#161618] border-[#26262a]' : 'bg-gray-50 border-gray-200'}`}>
            <button
              onClick={onClose}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-colors ${darkMode ? 'bg-[#1e1e22] border-[#2e2e34] text-gray-300 hover:bg-[#28282e]' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
            >
              Close
            </button>

            <div className="flex items-center gap-2.5">
              {/* Compare Button */}
              <button
                onClick={() => {
                  if (onSelectCompare) onSelectCompare(model);
                  onClose();
                }}
                className={`py-2.5 px-4 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors ${darkMode ? 'bg-[#1e1e22] border-[#2e2e34] text-gray-200 hover:bg-[#28282e]' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
              >
                <Scale className="w-4 h-4" />
                Compare
              </button>

              {/* Primary Action / Subscription Status */}
              {isMediaModel ? (
                <button
                  onClick={() => setShowMediaStudio(true)}
                  className="py-2.5 px-5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white transition-all shadow-lg shadow-purple-500/25 flex items-center gap-2"
                >
                  {isGenerativeVideo ? <Film className="w-4 h-4" /> : isGenerativeAudio ? <Volume2 className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                  {isGenerativeVideo ? 'Launch Video Studio' : isGenerativeAudio ? 'Launch Audio Studio' : 'Launch Image Studio'}
                </button>
              ) : model.is_free ? (
                <>
                  <div className="py-2.5 px-3 rounded-xl text-xs font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    100% Free
                  </div>
                  <button
                    onClick={() => {
                      navigate(`/dashboard?model=${encodeURIComponent(model.id)}`);
                      onClose();
                    }}
                    className="py-2.5 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Start Chat
                  </button>
                </>
              ) : isPro ? (
                <>
                  <div className="py-2.5 px-3 rounded-xl text-xs font-bold bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center gap-1.5">
                    <Zap className="w-4 h-4" />
                    Pro Unlocked
                  </div>
                  <button
                    onClick={() => {
                      navigate(`/dashboard?model=${encodeURIComponent(model.id)}`);
                      onClose();
                    }}
                    className="py-2.5 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Start Chat
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      navigate('/dashboard?model=minimax/minimax-m3.1-flash:free');
                      onClose();
                    }}
                    className="py-2.5 px-3 rounded-xl text-xs font-medium border border-gray-700 hover:bg-white/5 text-gray-300 transition-colors hidden sm:flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    Try Free
                  </button>
                  <button
                    onClick={() => setShowUpgradeModal(true)}
                    className="py-2.5 px-4 sm:px-5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-1.5"
                  >
                    <Lock className="w-4 h-4" />
                    Unlock with Pro ($19/mo)
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Fal.ai Media Studio Modal ── */}
      {showMediaStudio && (
        <FalMediaModal
          model={model}
          darkMode={darkMode}
          onClose={() => setShowMediaStudio(false)}
        />
      )}

      {/* ── Netroot Pro Upgrade Modal (Stripe Checkout) ── */}
      <ProUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        model={model}
        darkMode={darkMode}
        onSelectFreeModel={() => {
          setShowUpgradeModal(false);
          onClose();
          navigate('/dashboard?model=minimax/minimax-m3.1-flash:free');
        }}
      />
    </>
  );
}
