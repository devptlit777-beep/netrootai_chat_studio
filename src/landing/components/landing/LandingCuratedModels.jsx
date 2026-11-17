import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import {
  Sparkles,
  Zap,
  Cpu,
  Layers,
  ArrowRight,
  Shield,
  Eye,
  Activity,
  CheckCircle2,
  TrendingUp,
  ExternalLink,
  Flame,
  Radio,
} from 'lucide-react';

const APP_URL = '';

const FREE_MODELS = [
  {
    id: 'openai/gpt-oss-20b',
    name: 'GPT OSS 20B',
    provider: 'OpenAI (Open Weight)',
    badge: '100% Free',
    badgeColor: 'blue',
    speed: '< 38ms',
    context: '131k',
    desc: 'High-speed open-weight 20B model running natively on NetRoot Accelerated Neural Clusters for rapid coding, analysis, and conversation.',
    features: ['Zero Cost', 'Coding Ready', 'Ultra-Low Latency'],
  },
  {
    id: 'qwen/qwen3.8-27b',
    name: 'Qwen 3.8 27B Vision',
    provider: 'Alibaba Cloud',
    badge: 'Vision & Multimodal',
    badgeColor: 'blue',
    speed: '48ms',
    context: '131k',
    desc: 'State-of-the-art vision model for image comprehension, chart parsing, and multimodal reasoning.',
    features: ['Image Input', 'Chart Analysis', 'Free Tier'],
  },
  {
    id: 'allam-2-7b',
    name: 'ALLaM 2 7B',
    provider: 'SDAIA',
    badge: 'Bilingual Pro',
    badgeColor: 'blue',
    speed: '28ms',
    context: '131k',
    desc: 'Lightning-fast bilingual English/Arabic intelligence model optimized for instant response turnaround.',
    features: ['High Throughput', 'Multi-Language', 'Zero Cost'],
  },
  {
    id: 'netroot/compound-mini',
    name: 'NetRoot Compound Mini',
    provider: 'NetRoot AI',
    badge: 'Agent Special',
    badgeColor: 'amber',
    speed: '34ms',
    context: '131k',
    desc: 'Agent-tuned model designed for step-by-step logic, multi-tool orchestration, and structured tasks.',
    features: ['Agentic Flow', 'Structured Output', 'Free Forever'],
  },
];

const TITAN_MODELS = [
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    badge: 'Frontier Flagship',
    badgeColor: 'purple',
    score: '93.7 Coding',
    context: '200k',
    desc: 'The benchmark champion for autonomous coding, complex multi-step reasoning, and nuanced prose.',
    tags: ['Coding Leader', '200k Context', 'Vision'],
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o Omnimodel',
    provider: 'OpenAI',
    badge: 'Industry Standard',
    badgeColor: 'blue',
    score: '92.4 Reasoning',
    context: '128k',
    desc: 'Flagship omnimodel delivering seamless multimodal understanding across text, logic, and creative brainstorming.',
    tags: ['Omnimodal', 'Fast Inference', 'Enterprise'],
  },
  {
    id: 'deepseek/deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'DeepSeek',
    badge: 'Open Reasoning',
    badgeColor: 'blue',
    score: 'Math & Logic',
    context: '64k',
    desc: 'Breakthrough open-weight reinforcement reasoning model matching proprietary frontier tiers on math and science.',
    tags: ['Chain of Thought', 'Cost Efficient', 'High IQ'],
  },
  {
    id: 'google/gemini-pro-1.5',
    name: 'Gemini 1.5 Pro',
    provider: 'Google AI',
    badge: '2M Giant Window',
    badgeColor: 'blue',
    score: '2 Million Context',
    context: '2M Ctx',
    desc: 'Massive two-million token context window capable of ingesting entire codebases, audio libraries, and book archives.',
    tags: ['2M Context', 'Video Ingestion', 'Google Fleet'],
  },
  {
    id: 'nvidia/llama-3.1-nemotron-70b',
    name: 'Nemotron 70B',
    provider: 'NVIDIA',
    badge: 'Engineered Math',
    badgeColor: 'blue',
    score: 'NVIDIA Tuned',
    context: '128k',
    desc: 'Tuned by NVIDIA for maximum instruction-following precision, alignment, and synthetic dataset generation.',
    tags: ['NVIDIA Alignment', 'Enterprise', 'Math Leader'],
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B Instruct',
    provider: 'Meta AI',
    badge: 'Open Titan',
    badgeColor: 'sky',
    score: '88.6 MMLU',
    context: '128k',
    desc: 'Meta’s latest open heavyweight champion, offering near-frontier performance at a fraction of compute cost.',
    tags: ['Open Source', 'Meta Fleet', 'Cost Efficient'],
  },
];

const MEDIA_MODELS = [
  {
    id: 'black-forest-labs/flux.1-schnell',
    name: 'FLUX.1 Schnell',
    provider: 'Black Forest Labs',
    badge: 'Photorealism',
    badgeColor: 'rose',
    type: 'Image Generation',
    desc: 'Cutting-edge 12-billion parameter rectified flow transformer generating hyper-detailed, photorealistic visuals in 4 steps.',
  },
  {
    id: 'agnes/video-2.5-flash',
    name: 'Agnes Video 2.5 Flash',
    provider: 'Fal.ai / Agnes',
    badge: 'Motion & Physics',
    badgeColor: 'purple',
    type: 'Video Generation',
    desc: 'High-speed generative video engine producing smooth cinematic camera motion, realistic lighting, and 60 FPS output.',
  },
  {
    id: 'fal-ai/f5-tts',
    name: 'F5-TTS Voice Model',
    provider: 'Fal.ai',
    badge: 'Zero-Shot Voice',
    badgeColor: 'amber',
    type: 'Audio Synthesis',
    desc: 'Non-autoregressive speech synthesis delivering natural pacing, emotional intonation, and zero-shot voice cloning.',
  },
  {
    id: 'openai/whisper-large-v3',
    name: 'Whisper Large v3',
    provider: 'OpenAI',
    badge: 'Speech-to-Text',
    badgeColor: 'blue',
    type: 'Audio Transcription',
    desc: 'Multilingual automatic speech recognition engine with timestamp accuracy and robust noise suppression.',
  },
];

export default function LandingCuratedModels() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('free'); // 'free' | 'titans' | 'media'

  return (
    <section id="models" className="py-24 relative overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel border border-indigo-500/30 text-xs font-semibold text-indigo-300 mb-4">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>Curated Model Fleet</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Curated Intelligence.{' '}
            <span className="text-blue-500">
              Free & Frontier.
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Zero choice fatigue. Start immediately on 100% free open-weight models, or toggle to frontier flagships and creative generative media.
          </p>
        </div>

        {/* Category Switcher Tabs */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex p-1.5 rounded-2xl glass-panel border border-white/10 gap-1.5">
            <button
              onClick={() => setActiveCategory('free')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeCategory === 'free'
                  ? 'bg-blue-600 text-white font-medium shadow-sm shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span>100% Free Forever Tier</span>
            </button>

            <button
              onClick={() => setActiveCategory('titans')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeCategory === 'titans'
                  ? 'bg-blue-600 text-white font-medium shadow-sm shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Industry Titans</span>
            </button>

            <button
              onClick={() => setActiveCategory('media')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeCategory === 'media'
                  ? 'bg-blue-600 text-white font-medium shadow-sm shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-300" />
              <span>Image, Video & Audio</span>
            </button>
          </div>
        </div>

        {/* ── CATEGORY 1: FREE FOREVER FLEET ── */}
        {activeCategory === 'free' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {FREE_MODELS.map((model) => (
              <div
                key={model.id}
                className="rounded-2xl glass-panel p-5 border border-white/10 glass-panel-hover flex flex-col justify-between hologram-card group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/25">
                      {model.badge}
                    </span>
                    <span className="text-[11px] font-mono text-blue-400 flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {model.speed}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-1 group-hover:text-blue-300 transition-colors">
                    {model.name}
                  </h3>
                  <div className="text-[11px] text-slate-400 mb-3">{model.provider}</div>

                  <p className="text-xs text-slate-300 leading-relaxed mb-4">{model.desc}</p>
                </div>

                <div>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {model.features.map((f, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.04] text-slate-300 border border-white/5"
                      >
                        {f}
                      </span>
                    ))}
                  </div>

                  <a
                    href={`${APP_URL}/login`}
                    className="w-full py-2 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/25 text-xs font-medium flex items-center justify-center gap-1.5 transition-all"
                  >
                    <span>Use for Free</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── CATEGORY 2: INDUSTRY TITANS ── */}
        {activeCategory === 'titans' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {TITAN_MODELS.map((model) => (
              <div
                key={model.id}
                className="rounded-2xl glass-panel p-5 border border-white/10 glass-panel-hover flex flex-col justify-between hologram-card group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/30">
                      {model.badge}
                    </span>
                    <span className="text-[11px] font-mono text-indigo-300 font-bold">{model.score}</span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-300 transition-colors">
                    {model.name}
                  </h3>
                  <div className="text-[11px] text-slate-400 mb-3">{model.provider}</div>

                  <p className="text-xs text-slate-300 leading-relaxed mb-4">{model.desc}</p>
                </div>

                <div>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {model.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.04] text-slate-300 border border-white/5"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <a
                    href={`${APP_URL}/login`}
                    className="w-full py-2 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/25 text-xs font-medium flex items-center justify-center gap-1.5 transition-all"
                  >
                    <span>Deploy in Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── CATEGORY 3: MEDIA & MULTIMODAL FLEET ── */}
        {activeCategory === 'media' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {MEDIA_MODELS.map((model) => (
              <div
                key={model.id}
                className="rounded-2xl glass-panel p-5 border border-rose-500/20 glass-panel-hover flex flex-col justify-between hologram-card group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/25">
                      {model.badge}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{model.type}</span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-1 group-hover:text-rose-300 transition-colors">
                    {model.name}
                  </h3>
                  <div className="text-[11px] text-slate-400 mb-3">{model.provider}</div>

                  <p className="text-xs text-slate-300 leading-relaxed mb-4">{model.desc}</p>
                </div>

                <Link
                  to="/showcase/image"
                  className="w-full py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Launch Creator</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* ── 🚀 THE "UNLOCK 450+ FLEET" CYBER GATEWAY CARD ── */}
        <div className="mt-10 rounded-3xl p-6 sm:p-8 bg-[#0c0f18] border border-slate-800 relative overflow-hidden shadow-2xl laser-border">
          {/* Background Grid Accent */}
          <div className="absolute inset-0 bg-[radial-gradient(#2563eb_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center lg:text-left">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-blue-400 uppercase tracking-wider bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>The Unified Fleet Catalog</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                Looking for Mistral, Yi, Cohere, WizardLM or 450+ Specialized Models?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
                Access our complete open-source and proprietary fleet with a single drop-in OpenAI compatible API key or via the interactive studio compare workbench.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <Link
                to="/models"
                className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all"
              >
                <span>Explore Full 470+ Fleet</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to={user ? "/workspace?tab=keys" : "/login"}
                className="px-5 py-3 rounded-2xl glass-panel hover:bg-white/10 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors"
              >
                <span>{user ? "Manage API Keys" : "Get API Key"}</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
