import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import {
  Sparkles,
  Zap,
  Mic,
  ArrowRight,
  ChevronDown,
  Search,
  Presentation,
  Image as ImageIcon,
  Play,
  Volume2,
  Workflow,
  Scale,
  CheckCircle2,
  Loader2,
  Download,
} from 'lucide-react';

const APP_URL = '';

const FREE_MODELS = [
  { id: 'openai/gpt-oss-20b', name: 'GPT OSS 20B', tag: 'NetRoot Fast Tier', speed: '< 38ms' },
  { id: 'qwen/qwen3.8-27b', name: 'Qwen 27B Vision', tag: 'Multimodal Vision', speed: '48ms' },
  { id: 'allam-2-7b', name: 'ALLaM 2 7B', tag: 'Bilingual Leader', speed: '28ms' },
];

export default function HeroPromptConsole() {
  const { user } = useAuth();
  const [selectedModel, setSelectedModel] = useState(FREE_MODELS[0]);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [trialResult, setTrialResult] = useState(null);
  const [activeType, setActiveType] = useState('text');
  const [isRecording, setIsRecording] = useState(false);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  const handlePillClick = (presetText, type) => {
    setPrompt(presetText);
    setActiveType(type);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleVoiceToggle = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch { }
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join('');
        setPrompt(transcript);
        if (transcript.toLowerCase().includes('presentation') || transcript.toLowerCase().includes('slide')) {
          setActiveType('ppt');
        } else if (transcript.toLowerCase().includes('image') || transcript.toLowerCase().includes('render')) {
          setActiveType('media');
        }
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsRecording(false);
    }
  };

  const handleGenerate = () => {
    if (!prompt.trim()) {
      setPrompt('Create an executive 16:9 pitch deck on Autonomous AI Agent Workflows');
      setActiveType('ppt');
    }

    setIsGenerating(true);
    setTrialResult(null);

    setTimeout(() => {
      setIsGenerating(false);
      setTrialResult({
        model: selectedModel.name,
        latency: '36ms',
        tokensSec: '148 tok/s',
        type: activeType,
        query: prompt || 'Autonomous AI Agent Workflows',
      });
    }, 900);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto my-4">
      {/* ── Ambient Radial Halo Behind Console ── */}
      <div className="absolute inset-0 bg-blue-600/5 rounded-3xl blur-2xl -z-10 pointer-events-none" />

      {/* ══════════════════════════════════════════════════════════════════
          2027 QUANTUM GYROSCOPE ORBITAL SATELLITES (DOCKED ON LASER RINGS)
         ══════════════════════════════════════════════════════════════════ */}

      {/* Top-Left Pill: Deep Research */}
      <button
        onClick={() => handlePillClick('Conduct an in-depth market research analysis on the growth of AI agent infrastructure in 2026 with citations.', 'research')}
        className="satellite-pill animate-orbit-1 hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-200 bg-[#0c101a]/90 backdrop-blur-md border border-blue-500/30 hover:border-blue-400 shadow-xl shadow-blue-950/30 absolute -top-5 left-10 lg:left-14 z-20 cursor-pointer group"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
        <Search className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
        <span>Deep Research</span>
      </button>

      {/* Mid-Left Pill: Image Generation */}
      <button
        onClick={() => handlePillClick('Generate a photorealistic render of a cybernetic research laboratory with volumetric lighting and architectural depth.', 'media')}
        className="satellite-pill animate-orbit-2 hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-200 bg-[#0c101a]/90 backdrop-blur-md border border-rose-500/40 hover:border-rose-300 shadow-xl shadow-rose-950/50 absolute top-1/2 -translate-y-1/2 -left-4 sm:-left-8 lg:-left-16 xl:-left-20 z-20 cursor-pointer group"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
        <ImageIcon className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
        <span>Image Generation</span>
      </button>

      {/* Bottom-Left Pill: Audio Synthesis */}
      <button
        onClick={() => handlePillClick('Synthesize natural voice narration explaining quantum computing architecture with studio-grade cadence.', 'audio')}
        className="satellite-pill animate-orbit-3 hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-200 bg-[#0c101a]/90 backdrop-blur-md border border-amber-500/40 hover:border-amber-300 shadow-xl shadow-amber-950/50 absolute -bottom-5 left-10 lg:left-14 z-20 cursor-pointer group"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        <Volume2 className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
        <span>Audio Synthesis</span>
      </button>

      {/* Top-Right Pill: Executive Presentations */}
      <button
        onClick={() => handlePillClick('Create an executive presentation on Autonomous AI Agent Workflows and Latency Reduction.', 'ppt')}
        className="satellite-pill animate-orbit-1 hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-200 bg-[#0c101a]/90 backdrop-blur-md border border-sky-500/40 hover:border-sky-300 shadow-xl shadow-sky-950/50 absolute -top-5 right-10 lg:right-14 z-20 cursor-pointer group"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
        <Presentation className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
        <span>Executive Presentations</span>
      </button>

      {/* Mid-Right Pill: Video & Motion */}
      <button
        onClick={() => handlePillClick('Cinematic camera orbit across futuristic glass skyscrapers at dusk, realistic atmospheric motion.', 'media')}
        className="satellite-pill animate-orbit-4 hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-200 bg-[#0c101a]/90 backdrop-blur-md border border-purple-500/40 hover:border-purple-300 shadow-xl shadow-purple-950/50 absolute top-1/2 -translate-y-1/2 -right-4 sm:-right-8 lg:-right-16 xl:-right-20 z-20 cursor-pointer group"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
        <Play className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
        <span>Video & Motion</span>
      </button>

      {/* Bottom-Right Pill: Autonomous Workflows */}
      <button
        onClick={() => handlePillClick('Design an automated multi-step RAG pipeline connecting PDF document parsing, vector indexing, and Claude 3.5 routing.', 'workflow')}
        className="satellite-pill animate-orbit-2 hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-200 bg-[#0c101a]/90 backdrop-blur-md border border-blue-500/30 hover:border-blue-400 shadow-xl shadow-blue-950/30 absolute -bottom-5 right-10 lg:right-14 z-20 cursor-pointer group"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
        <Workflow className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
        <span>Autonomous Workflows</span>
      </button>

      {/* ── Main Glassmorphic Trial Prompt Console ── */}
      <div className="relative rounded-3xl glass-panel border border-slate-800 p-3.5 sm:p-5 shadow-2xl shadow-black/70 laser-border z-10">
        {/* Top Model Selection Strip */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3 px-1 sm:px-2">
          {/* Dropdown for 2-3 Free Models */}
          <div className="relative">
            <button
              onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-slate-200 transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-blue-400 fill-blue-500" />
              <span>{selectedModel.name}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-300 font-mono">
                100% Free
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${modelDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {modelDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 p-1.5 rounded-2xl bg-[#0c0f18] shadow-2xl border border-white/15 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="text-[10px] font-mono text-slate-400 px-2.5 py-1 uppercase tracking-wider">
                  Select Free Trial Model:
                </div>
                {FREE_MODELS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedModel(m);
                      setModelDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-colors ${
                      selectedModel.id === m.id
                        ? 'bg-blue-600 text-white font-medium'
                        : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-left">{m.name}</div>
                      <div className="text-[10px] text-slate-400 text-left">{m.tag}</div>
                    </div>
                    <span className="text-[10px] font-mono text-blue-400">{m.speed}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Trial Mode Indicator */}
          <div className="flex items-center gap-2 text-[11px] text-blue-300 font-mono">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            <span className="hidden sm:inline">Instant Sandbox Mode</span>
            <span className="text-slate-500">•</span>
            <span>No Signup Required</span>
          </div>
        </div>

        {/* Input Bar with Voice Mic & Generate CTA */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 px-1 sm:px-2">
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything, design a 16:9 presentation deck, or generate 4K visuals..."
              className="w-full bg-transparent text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none resize-none pt-1"
            />
          </div>

          <div className="flex items-center justify-end gap-2 shrink-0">
            {/* Voice Mic Button */}
            <button
              onClick={handleVoiceToggle}
              title="Speak prompt with Voice AI"
              className={`p-3 rounded-2xl border transition-all ${
                isRecording
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border-white/10'
              }`}
            >
              <Mic className="w-4 h-4" />
            </button>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-medium shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Inferring...</span>
                </>
              ) : (
                <>
                  <span>Generate Free</span>
                  <Sparkles className="w-4 h-4 text-white" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Live Simulated Trial Output Tray ── */}
        {trialResult && (
          <div className="mt-4 pt-4 border-t border-white/10 animate-in fade-in slide-in-from-top-3 duration-300">
            <div className="rounded-2xl bg-[#090d16] border border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2 text-blue-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Success: {trialResult.model}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                  <span>Latency: <strong className="text-blue-300">{trialResult.latency}</strong></span>
                  <span>Throughput: <strong className="text-blue-300">{trialResult.tokensSec}</strong></span>
                </div>
              </div>

              {/* Dynamic Content based on Trial Type */}
              {trialResult.type === 'ppt' ? (
                <div className="space-y-3">
                  <div className="aspect-[16/9] w-full rounded-xl bg-slate-900/80 border border-white/10 p-5 flex flex-col justify-between relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-sky-500/20 text-sky-300">
                        Slide 1: Executive Overview
                      </span>
                      <span className="text-xs text-sky-400 font-mono flex items-center gap-1">
                        <Presentation className="w-3.5 h-3.5" />
                        <span>Executive Deck Format</span>
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-lg sm:text-xl font-bold text-white">
                        Autonomous AI Agent Orchestration & Enterprise Workflows
                      </h4>
                      <p className="text-xs text-slate-300 max-w-xl">
                        Deterministic multi-step reasoning delivering low-latency tool execution and automated slide composition.
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10px] text-slate-400 font-mono">
                      <span>Palette: Midnight Sky</span>
                      <span className="text-blue-400">Ready to download in Full Studio</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <span className="text-xs text-slate-400">
                      Want to customize all 10 slides and download editable .pptx?
                    </span>
                    <Link
                      to="/showcase/ppt"
                      className="px-4 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <span>Explore PPT Studio Showcase</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ) : trialResult.type === 'media' ? (
                <div className="space-y-3">
                  <div className="aspect-video w-full max-h-60 rounded-xl overflow-hidden relative">
                    <img
                      src="/images/image1_26f1c759.jpg"
                      alt="Trial Media Render"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                      <span className="text-xs text-slate-200">
                        Prompt: "{trialResult.query}"
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Generated via Multi-Diffusion Studio</span>
                    <Link
                      to="/showcase/image"
                      className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <span>Explore Image Studio Showcase</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs text-slate-200">
                  <p className="leading-relaxed">
                    NetRoot AI's high-speed neural engine delivers deterministic, token-efficient intelligence. Whether generating comprehensive executive presentations, orchestrating autonomous agent workflows, or running deep research queries across arXiv, responses complete instantly without compute bottlenecks.
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <span className="text-[11px] text-slate-400">Tokens used: 142 • Cost: $0.00 (100% Free)</span>
                    <Link
                      to={user ? "/dashboard" : "/login"}
                      className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      <span>{user ? "Continue Conversation in Dashboard →" : "Continue Conversation in Full Chat Studio →"}</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom-Center Satellite: Compare Models (Desktop) ── */}
      <div className="hidden lg:flex justify-center pt-3">
        <button
          onClick={() => handlePillClick('Compare Claude 3.5 Sonnet vs DeepSeek R1 vs GPT-4o on mathematical reasoning and token throughput.', 'compare')}
          className="satellite-pill animate-orbit-3 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium text-slate-300 bg-[#0c101a]/90 backdrop-blur-md border border-indigo-500/30 hover:border-indigo-400 shadow-xl shadow-indigo-950/40 cursor-pointer"
        >
          <Scale className="w-3.5 h-3.5 text-indigo-400" />
          <span>Compare Models Fleet</span>
        </button>
      </div>

      {/* ── Responsive Pill Cluster (Visible on screens < LG) ── */}
      <div className="flex lg:hidden flex-wrap items-center justify-center gap-2 pt-4 px-2">
        <button
          onClick={() => handlePillClick('Conduct an in-depth market research analysis on the growth of AI agent infrastructure in 2026 with citations.', 'research')}
          className="satellite-pill flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-slate-300 bg-white/[0.04] border border-blue-500/20"
        >
          <Search className="w-3 h-3 text-blue-400" />
          <span>Deep Research</span>
        </button>

        <button
          onClick={() => handlePillClick('Create an executive 16:9 pitch deck on Autonomous AI Agent Workflows and Latency Reduction with Bento layout.', 'ppt')}
          className="satellite-pill flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-slate-300 bg-white/[0.04] border border-sky-500/20"
        >
          <Presentation className="w-3 h-3 text-sky-400" />
          <span>Presentation Deck</span>
        </button>

        <button
          onClick={() => handlePillClick('Generate a photorealistic 4K render of a cybernetic research laboratory with volumetric lighting, 8k.', 'media')}
          className="satellite-pill flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-slate-300 bg-white/[0.04] border border-rose-500/20"
        >
          <ImageIcon className="w-3 h-3 text-rose-400" />
          <span>Image Gen 4K</span>
        </button>

        <button
          onClick={() => handlePillClick('Cinematic drone orbit across futuristic glass skyscrapers at dusk, hyper-realistic 60 FPS motion.', 'media')}
          className="satellite-pill flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-slate-300 bg-white/[0.04] border border-purple-500/20"
        >
          <Play className="w-3 h-3 text-purple-400" />
          <span>Video Gen</span>
        </button>

        <button
          onClick={() => handlePillClick('Synthesize natural voice narration explaining quantum computing architecture with studio-grade cadence.', 'audio')}
          className="satellite-pill flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-slate-300 bg-white/[0.04] border border-amber-500/20"
        >
          <Volume2 className="w-3 h-3 text-amber-400" />
          <span>Audio Synthesis</span>
        </button>

        <button
          onClick={() => handlePillClick('Design an automated multi-step RAG pipeline connecting PDF document parsing, vector indexing, and Claude 3.5 routing.', 'workflow')}
          className="satellite-pill flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-slate-300 bg-white/[0.04] border border-blue-500/20"
        >
          <Workflow className="w-3 h-3 text-blue-400" />
          <span>Prompt to Workflow</span>
        </button>

        <button
          onClick={() => handlePillClick('Compare Claude 3.5 Sonnet vs DeepSeek R1 vs GPT-4o on mathematical reasoning and token throughput.', 'compare')}
          className="satellite-pill flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-slate-300 bg-white/[0.04] border border-indigo-500/20"
        >
          <Scale className="w-3 h-3 text-indigo-400" />
          <span>Compare Models</span>
        </button>
      </div>
    </div>
  );
}
