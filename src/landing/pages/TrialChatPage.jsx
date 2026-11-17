import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Send,
  Sparkles,
  Lock,
  ArrowRight,
  ArrowLeft,
  Bot,
  User,
  RotateCcw,
  Search,
  Presentation,
  Image as ImageIcon,
  Workflow,
  Mic,
  Code,
  CheckCircle2,
  Cpu,
  Layers,
  ArrowUp,
  ChevronDown,
  Check,
  Zap,
} from 'lucide-react';
import LoginGateModal from '../components/common/LoginGateModal';

const APP_URL = '';
const MAX_TRIAL_PROMPTS = 7;
const STORAGE_KEY = 'netroot_trial_prompts_count';

// ── 3 FREE SANDBOX MODELS (Available for guest trial) ──
const FREE_MODELS = [
  {
    id: 'openai/gpt-oss-20b',
    name: 'OpenAI GPT OSS 20B',
    shortName: 'GPT OSS 20B',
    fleet: 'Netroot Fast Engine',
    speed: '< 28ms',
    tag: 'FREE',
    desc: 'Ultra-fast general reasoning, instant answers & ideation',
    isFree: true,
  },
  {
    id: 'qwen/qwen3.8-27b',
    name: 'Qwen 3.8 27B Vision',
    shortName: 'Qwen 27B Vision',
    fleet: 'Multimodal Vision',
    speed: '< 42ms',
    tag: 'FREE',
    desc: 'Multimodal reasoning, image synthesis & document parsing',
    isFree: true,
  },
  {
    id: 'allam-2-7b',
    name: 'ALLaM 2 7B Bilingual',
    shortName: 'ALLaM 2 7B',
    fleet: 'Deterministic Engine',
    speed: '< 34ms',
    tag: 'FREE',
    desc: 'Code refactoring, algorithmic logic & systems architecture',
    isFree: true,
  },
];

// ── 450+ FRONTIER FLEET (Requires Account Login) ──
const LOCKED_MODELS = [
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    desc: '#1 Frontier Leader for deep coding and multi-step reasoning',
    badge: 'PRO',
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o Omnimodal',
    provider: 'OpenAI',
    desc: 'Flagship multimodal intelligence & complex systems logic',
    badge: 'PRO',
  },
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1 Reasoning',
    provider: 'DeepSeek',
    desc: 'Chain-of-thought mathematical synthesis & deep verification',
    badge: 'PRO',
  },
  {
    id: 'llama-3-3-70b',
    name: 'Llama 3.3 70B Enterprise',
    provider: 'Meta AI',
    desc: 'High-throughput enterprise open frontier intelligence',
    badge: 'PRO',
  },
  {
    id: 'flux-agnes-media',
    name: 'FLUX.1 & Agnes 2.5 Motion',
    provider: 'Media Studio',
    desc: 'Photorealistic visual renders & 60 FPS studio video',
    badge: 'PRO',
  },
  {
    id: 'ppt-engine',
    name: 'Autonomous Slide Engine',
    provider: 'PPT Studio',
    desc: 'Prompt to executive PowerPoint (.pptx) deck in 30 seconds',
    badge: 'PRO',
  },
];

// 6 Quantum Orbital Satellites (Surrounding the central console with zero overlap)
const ORBITAL_SATELLITES = [
  {
    id: 'research',
    label: 'Deep Research',
    icon: Search,
    color: 'blue',
    orbitClass: 'animate-orbit-1',
    position: '-top-11 left-3 sm:left-8',
    prompt: 'Conduct an in-depth market research analysis on the growth of AI agent infrastructure in 2026 with citations.',
  },
  {
    id: 'presentation',
    label: 'Presentation Deck',
    icon: Presentation,
    color: 'sky',
    orbitClass: 'animate-orbit-2',
    position: '-top-11 right-3 sm:right-8',
    prompt: 'Create an executive pitch deck on Autonomous AI Agent Workflows with market statistics and architecture roadmap.',
  },
  {
    id: 'image',
    label: 'Image Generation',
    icon: ImageIcon,
    color: 'rose',
    orbitClass: 'animate-orbit-3',
    position: 'top-1/2 -translate-y-1/2 -left-40 lg:-left-44 xl:-left-48',
    prompt: 'Generate a photorealistic render of a cybernetic research laboratory with volumetric lighting and ray tracing.',
  },
  {
    id: 'workflow',
    label: 'Prompt-to-Workflow',
    icon: Workflow,
    color: 'purple',
    orbitClass: 'animate-orbit-4',
    position: 'top-1/2 -translate-y-1/2 -right-40 lg:-right-44 xl:-right-48',
    prompt: 'Build an autonomous pipeline to ingest customer emails, redact PII, and generate weekly KPI briefs.',
  },
  {
    id: 'audio',
    label: 'Voice & Audio',
    icon: Mic,
    color: 'amber',
    orbitClass: 'animate-orbit-2',
    position: '-bottom-11 left-3 sm:left-8',
    prompt: 'Synthesize natural voice narration explaining quantum computing architecture with studio-grade cadence.',
  },
  {
    id: 'code',
    label: 'Code & Refactor',
    icon: Code,
    color: 'blue',
    orbitClass: 'animate-orbit-1',
    position: '-bottom-11 right-3 sm:right-8',
    prompt: 'Optimize a React useEffect hook to prevent unnecessary re-renders and memory leaks.',
  },
];

export default function TrialChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [promptCount, setPromptCount] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalDetails, setLoginModalDetails] = useState({
    title: "You've Unlocked the Power of NetRoot AI ChatBix!",
    subtitle: "You have completed your free trial queries. Sign up for a free account or log in to continue with unlimited AI chats, PowerPoint deck generation, and 450+ models.",
    badge: "Guest Sandbox Limit Reached",
  });
  const [isListening, setIsListening] = useState(false);

  // Model Selector State
  const [selectedModel, setSelectedModel] = useState(FREE_MODELS[0]);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load trial count from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed)) {
          setPromptCount(Math.min(parsed, MAX_TRIAL_PROMPTS));
        }
      }
    } catch (e) {
      console.warn('LocalStorage read error', e);
    }
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const remainingPrompts = Math.max(0, MAX_TRIAL_PROMPTS - promptCount);

  // Auto-populate input from satellite pill click
  const handlePillClick = (text) => {
    setInput(text);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const recognitionRef = useRef(null);

  // Real Web Speech-to-Text Toggle
  const handleVoiceToggle = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch { }
      }
      setIsListening(false);
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
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join('');
        setInput(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Handle clicking a locked model in the dropdown
  const handleLockedModelClick = (model) => {
    setIsModelDropdownOpen(false);
    setLoginModalDetails({
      title: `Unlock ${model.name}`,
      subtitle: `${model.name} and the complete fleet of 450+ frontier models are available for registered NetRoot AI users. Create a free account in 10 seconds to unlock full access and claim 100,000 starter tokens.`,
      badge: `${model.name} • Pro Model Required`,
    });
    setShowLoginModal(true);
  };

  // Generate intelligent response based on topic & selected model
  const generateResponse = (userPrompt) => {
    const lower = userPrompt.toLowerCase();

    if (lower.includes('presentation') || lower.includes('deck') || lower.includes('slide') || lower.includes('pitch')) {
      return `### Executive Presentation Outline: Autonomous AI Workflows

Generated via **${selectedModel.name}** & NetRoot Slide Engine:

* **Slide 1: Executive Thesis & Market Inflection**
  * The transition from static copilot prompting to multi-agent self-healing orchestration loops.
* **Slide 2: Architectural Stack (10 Enterprise Visual Formats)**
  * Deterministic gateway proxy, PII sanitization buffer, and low-latency inference routing.
* **Slide 3: Quantitative ROI & Latency Benchmarks**
  * 68% reduction in token overhead via semantic vector caching; P99 latency ${selectedModel.speed}.
* **Slide 4: Production Roadmap & Milestones**
  * Phase 1: Gateway deployment. Phase 2: Slide & media pipelines. Phase 3: Autonomous agents.

*💡 Full binary PowerPoint (.pptx) download is available in NetRoot Presentation Studio upon signing in!*`;
    }

    if (lower.includes('react') || lower.includes('hook') || lower.includes('code') || lower.includes('optimize')) {
      return `### High-Performance React Hook Architecture

Generated via **${selectedModel.name}** (${selectedModel.speed}):

\`\`\`tsx
import { useCallback, useMemo, useRef, useEffect } from 'react';

export function useStableSubscription<T>(
  dataSelector: () => T,
  onChange: (value: T) => void
) {
  const callbackRef = useRef(onChange);
  useEffect(() => {
    callbackRef.current = onChange;
  }, [onChange]);

  const stableCallback = useCallback((val: T) => {
    callbackRef.current(val);
  }, []);

  return useMemo(() => ({
    dispatch: stableCallback,
  }), [stableCallback]);
}
\`\`\`

**Key Architectural Optimizations:**
1. **Zero Render Cascades:** Encapsulated in \`useRef\` to decouple consumer function identity from effect dependencies.
2. **Stable Memoization:** Prevents subtree reconciliation in high-frequency state updates.
3. **Memory Safety:** Eliminates stale closure traps during rapid async cycles.`;
    }

    if (lower.includes('image') || lower.includes('photo') || lower.includes('render') || lower.includes('media')) {
      return `### Multi-Diffusion Studio Generation Brief

* **Prompt:** "${userPrompt}"
* **Visual Engine:** ${selectedModel.name} Synthesis Pipeline.
* **Focal Parameters:** 85mm portrait prime framing, Ray-traced softbox refractions, Obsidian metal tones.
* **Diffusion Model:** NetRoot Unified Diffusion Engine.

*🎨 Launch the full Media Studio from your account to download 4K PNG renders and generate 60 FPS studio motion video!*`;
    }

    if (lower.includes('workflow') || lower.includes('pipeline') || lower.includes('agent')) {
      return `### Autonomous Prompt-to-Workflow Pipeline Spec

Generated via **${selectedModel.name}**:

* **Trigger Node:** Inbound Webhook / Email Gateway.
* **Sanitization Layer:** In-flight PII redaction masks confidential tokens before LLM evaluation.
* **Execution Logic:**
  1. Route deterministic structured tasks to ultra-throughput neural cluster (${selectedModel.speed}).
  2. Synthesize weekly executive brief with auto-generated charts.
  3. Dispatch alerts via Slack & email with human-in-the-loop review gate.`;
    }

    return `### NetRoot AI Neural Intelligence

Thank you for testing the NetRoot AI ChatBix Guest Sandbox with **${selectedModel.name}**.

* **Active Architecture:** ${selectedModel.name} (${selectedModel.speed} latency).
* **Deterministic Execution:** Input parsed with context-aware semantic tokens and verified against enterprise guardrails.
* **Recommendation:** Connect your production project to the NetRoot Unified Gateway to leverage 450+ models with universal single-key management.

*💡 Create a free NetRoot account to unlock 450+ full frontier models, instant PowerPoint slide deck generation, and Multi-Diffusion Media Studio!*`;
  };

  const handleSend = (textToSend = null) => {
    const messageText = (textToSend !== null ? textToSend : input).trim();
    if (!messageText || isTyping) return;

    // Check if limit already reached
    if (promptCount >= MAX_TRIAL_PROMPTS) {
      setLoginModalDetails({
        title: "You've Unlocked the Power of NetRoot AI ChatBix!",
        subtitle: "You have completed all 7 free trial guest queries. Sign up for a free account or log in to continue with unlimited AI chats, PowerPoint deck generation, and 450+ models.",
        badge: "Guest Sandbox Limit Reached (7/7)",
      });
      setShowLoginModal(true);
      return;
    }

    const newCount = promptCount + 1;
    setPromptCount(newCount);
    try {
      localStorage.setItem(STORAGE_KEY, newCount.toString());
    } catch (e) {
      console.warn('LocalStorage write failed', e);
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate fast streaming latency (600ms)
    setTimeout(() => {
      const assistantMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: generateResponse(messageText),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        meta: `${selectedModel.name} • Prompt ${newCount} of ${MAX_TRIAL_PROMPTS} (${selectedModel.speed})`,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);

      // If this was the 7th prompt, trigger the LoginGateModal after user finishes reading
      if (newCount >= MAX_TRIAL_PROMPTS) {
        setTimeout(() => {
          setLoginModalDetails({
            title: "You've Unlocked the Power of NetRoot AI ChatBix!",
            subtitle: "You have completed all 7 free trial guest queries. Sign up for a free account or log in to continue with unlimited AI chats, PowerPoint deck generation, and 450+ models.",
            badge: "Guest Sandbox Limit Reached (7/7)",
          });
          setShowLoginModal(true);
        }, 1500);
      }
    }, 650);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const resetChat = () => {
    setMessages([]);
  };

  return (
    <div className="h-screen w-full flex flex-col justify-between bg-[#090a0f] text-slate-100 overflow-hidden relative isolate select-none">
      {/* ── SINGLE TOP NAVIGATION BAR (Clean, Zero Duplication) ── */}
      <header className="h-16 px-4 sm:px-6 border-b border-white/10 bg-[#0a0c13]/90 backdrop-blur-xl flex items-center justify-between shrink-0 z-30">
        {/* Left: Back to Home & Brand */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            to="/"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 hover:text-white transition-all group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Home</span>
          </Link>

          <div className="h-4 w-px bg-white/10 hidden sm:block" />

          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 p-[1.5px] shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-[#090b12] rounded-[10px] flex items-center justify-center p-1">
                <img src="/image.png" alt="NetRoot AI" className="w-full h-full object-contain" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-extrabold text-white tracking-tight flex items-center gap-1.5">
                NetRoot AI <span className="text-blue-400">ChatBix</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-blue-500/10 text-blue-300 border border-blue-500/20">
                  GUEST SANDBOX
                </span>
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Active Model Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/10 text-xs text-slate-300">
          <Zap className="w-3.5 h-3.5 text-blue-400" />
          <span>Active: <strong className="text-white">{selectedModel.name}</strong></span>
          <span className="text-[10px] font-mono text-blue-300 bg-white/[0.04] px-1.5 py-0.2 rounded border border-white/10">
            {selectedModel.speed}
          </span>
        </div>

        {/* Right: Live Remaining Prompts Pill & Log In */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Prompts Counter Pill */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${
              remainingPrompts > 0
                ? 'bg-white/[0.04] border-white/10 text-slate-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300 animate-pulse'
            }`}
          >
            {remainingPrompts > 0 ? (
              <>
                <span className="w-2 h-2 rounded-full bg-blue-500/90" />
                <span>{remainingPrompts} of {MAX_TRIAL_PROMPTS} Free Prompts Remaining</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                <span>Trial Limit Reached (7/7)</span>
              </>
            )}
          </div>

          {messages.length > 0 && (
            <button
              onClick={resetChat}
              title="Start New Chat"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          <a
            href={`${APP_URL}/login`}
            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-sm shadow-blue-500/20 flex items-center gap-1.5 transition-all"
          >
            <span>Log In</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════
          STATE 1: EMPTY CHAT - QUANTUM ORBITAL CENTERPIECE (DESIGN A)
         ══════════════════════════════════════════════════════════════════ */}
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 relative overflow-y-auto">
          {/* Ambient Center Aura Glow (Calm & Subtle) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[320px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />

          {/* Welcoming Headline Group (Clean, Compact & Elegant) */}
          <div className="text-center max-w-xl mx-auto mb-3 animate-in fade-in duration-500">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[11px] font-semibold text-slate-300 mb-2.5">
              <Sparkles className="w-3 h-3 text-blue-400" />
              <span>Next-Gen Frontier AI • Guest Sandbox</span>
            </div>

            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white tracking-tight leading-snug mb-1.5">
              Welcome to{' '}
              <span className="text-blue-500">
                NetRoot AI ChatBix.
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto font-normal leading-relaxed">
              Experience the power of 450+ models. Generate executive presentations, write code, or automate workflows with 7 free guest queries.
            </p>
          </div>

          {/* ── THE CENTERPIECE: PROMPT CONSOLE WITH FLOATING SATELLITES (ZERO OVERLAP) ── */}
          <div className="relative w-full max-w-2xl mx-auto my-14 sm:my-16">
            {/* 6 Orbital Satellites Floating Around The Console (Positioned outside with zero overlap) */}
            {ORBITAL_SATELLITES.map((sat) => {
              const IconComponent = sat.icon;
              return (
                <button
                  key={sat.id}
                  onClick={() => handlePillClick(sat.prompt)}
                  className={`satellite-pill ${sat.orbitClass} ${
                    sat.id === 'image' || sat.id === 'workflow' ? 'hidden xl:flex' : 'hidden md:flex'
                  } items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-300 hover:text-white bg-[#0d111a]/95 backdrop-blur-md border border-white/10 hover:border-blue-500/30 shadow-lg shadow-black/50 hover:shadow-blue-950/20 absolute ${sat.position} z-20 cursor-pointer group transition-all ${isModelDropdownOpen ? "opacity-30 pointer-events-none" : "opacity-100"}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <IconComponent className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-300 transition-colors" />
                  <span>{sat.label}</span>
                </button>
              );
            })}

            {/* Central Luxury Prompt Console Box (100% Unobstructed, Eye-Friendly Matte Glass) */}
            <div className={`relative rounded-3xl bg-[#0c0f18]/95 border border-white/10 hover:border-white/15 focus-within:border-blue-500/40 p-4 sm:p-5 shadow-2xl shadow-black/70 focus-within:shadow-[0_0_25px_rgba(37,99,235,0.1)] transition-all ${isModelDropdownOpen ? "z-30" : "z-10"}`}>
              <textarea
                ref={inputRef}
                rows={3}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask NetRoot AI anything, generate presentations, or run workflows..."
                className="w-full bg-transparent text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none resize-none font-sans leading-relaxed"
              />

              {/* Bottom Console Controls Strip */}
              <div className="flex items-center justify-between pt-3 border-t border-white/10 mt-2">
                {/* ── OPTION 1: INTERACTIVE MODEL SELECTOR DROPDOWN ── */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                    className="text-[11px] font-mono text-slate-300 bg-white/[0.04] hover:bg-white/[0.08] px-2.5 py-1.5 rounded-xl border border-white/10 hover:border-blue-500/30 flex items-center gap-1.5 transition-all shadow-sm group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span className="font-semibold text-white">{selectedModel.name}</span>
                    <span className="text-[10px] px-1 py-0.2 rounded bg-white/[0.06] text-slate-300 hidden sm:inline">
                      {selectedModel.speed}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400 transition-transform duration-200 ${
                        isModelDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* The Dropdown Menu (Clean, Compact & Solid - Zero Overlap) */}
                  {isModelDropdownOpen && (
                    <div className="absolute bottom-full left-0 mb-3 w-72 sm:w-80 rounded-2xl bg-[#0c0f18] border border-white/10 p-2 shadow-2xl shadow-black z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                      {/* Dropdown Header */}
                      <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-white/10 mb-1.5">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-300 font-bold flex items-center gap-1.5">
                          <Cpu className="w-3.5 h-3.5 text-blue-400" />
                          Select Active Model
                        </span>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
                          3 Sandbox Tier
                        </span>
                      </div>

                      {/* 3 FREE SANDBOX MODELS */}
                      <div className="space-y-1">
                        {FREE_MODELS.map((model) => {
                          const isSelected = selectedModel.id === model.id;
                          return (
                            <button
                              key={model.id}
                              type="button"
                              onClick={() => {
                                setSelectedModel(model);
                                setIsModelDropdownOpen(false);
                              }}
                              className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between transition-all group ${
                                isSelected
                                  ? 'bg-blue-600/20 border border-blue-500/40 text-white'
                                  : 'hover:bg-white/[0.06] border border-transparent text-slate-200'
                              }`}
                            >
                              <div className="space-y-0.5">
                                <div className="text-xs font-semibold flex items-center gap-1.5">
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      isSelected ? 'bg-blue-500' : 'bg-slate-400 group-hover:bg-blue-400'
                                    }`}
                                  />
                                  <span>{model.name}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 line-clamp-1">
                                  {model.desc}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[9.5px] font-mono text-slate-400 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/10">
                                  {model.speed}
                                </span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Direct Link to Models Fleet */}
                      <div className="pt-2 mt-1.5 border-t border-white/10 px-1">
                        <Link
                          to="/models"
                          onClick={() => setIsModelDropdownOpen(false)}
                          className="w-full py-1.5 px-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-[11px] font-mono text-blue-300 hover:text-white flex items-center justify-between transition-colors"
                        >
                          <span>Explore 450+ Fleet in Models Page</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Voice Mic Button */}
                  <button
                    onClick={handleVoiceToggle}
                    title="Simulate Voice Prompt"
                    className={`p-2 rounded-xl border transition-all ${
                      isListening
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                  </button>

                  {/* Send Button */}
                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isTyping}
                    className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                      input.trim() && !isTyping
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-500/20'
                        : 'bg-white/5 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <span>Send</span>
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile / Tablet Friendly Satellites Grid (Visible on screens < xl) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-6 xl:hidden">
              {ORBITAL_SATELLITES.map((sat) => {
                const IconComponent = sat.icon;
                return (
                  <button
                    key={sat.id}
                    onClick={() => handlePillClick(sat.prompt)}
                    className="p-2 rounded-xl bg-white/[0.04] border border-white/10 hover:border-blue-500/30 text-left flex items-center gap-2 text-xs text-slate-200 transition-colors"
                  >
                    <IconComponent className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="truncate">{sat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-400 font-medium pb-4">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              7 Free Queries Included
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              No Credit Card Required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              Instant Sandbox Access
            </span>
          </div>
        </div>
      ) : (
        /* ══════════════════════════════════════════════════════════════════
            STATE 2: ACTIVE CONVERSATION STREAM (SMOOTH TRANSITION)
           ══════════════════════════════════════════════════════════════════ */
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          {/* Scrollable Chat Canvas */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6 max-w-4xl mx-auto w-full">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 sm:gap-4 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                } animate-in fade-in duration-300`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-blue-600 p-[1.5px] shrink-0">
                    <div className="w-full h-full bg-[#0a0d16] rounded-[10px] flex items-center justify-center">
                      <Bot className="w-4 h-4 text-blue-300" />
                    </div>
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-2xl p-4 sm:p-5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600/20 border border-blue-500/30 text-white shadow-md shadow-blue-950/20'
                      : 'glass-panel border border-white/10 text-slate-200'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm">
                    {msg.content}
                  </div>

                  <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>{msg.meta || 'User Prompt'}</span>
                    <span>{msg.timestamp}</span>
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center shrink-0 text-slate-300">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 sm:gap-4 justify-start animate-in fade-in">
                <div className="w-8 h-8 rounded-xl bg-blue-600 p-[1.5px] shrink-0">
                  <div className="w-full h-full bg-[#0a0d16] rounded-[10px] flex items-center justify-center">
                    <Bot className="w-4 h-4 text-blue-300" />
                  </div>
                </div>
                <div className="glass-panel border border-white/10 rounded-2xl px-4 py-3 text-xs text-slate-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span>{selectedModel.name} is thinking & generating...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Docked Bottom Chat Input Bar */}
          <div className="p-4 border-t border-white/10 bg-[#0a0c13]/95 backdrop-blur-xl shrink-0 z-20">
            <div className="max-w-4xl mx-auto space-y-2">
              {promptCount >= MAX_TRIAL_PROMPTS ? (
                /* Limit Reached Locked Bar */
                <div className="p-4 rounded-2xl glass-panel border border-rose-500/30 bg-rose-500/5 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">
                        Free trial limit reached (7/7 prompts used)
                      </div>
                      <div className="text-[11px] text-slate-300">
                        Create an account to unlock unlimited messaging, PowerPoint generation, and 450+ models.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => setShowLoginModal(true)}
                      className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-white/5 rounded-xl transition-colors"
                    >
                      View Details
                    </button>
                    <a
                      href={`${APP_URL}/login`}
                      className="w-full sm:w-auto px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-sm shadow-blue-500/20 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <span>Create Free Account</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ) : (
                /* Active Input Bar with Model Switcher */
                <div className="relative rounded-2xl bg-[#0e121b]/95 border border-white/10 hover:border-white/15 focus-within:border-blue-500/40 shadow-xl shadow-black/50 transition-all p-1.5 flex items-center gap-2">
                  {/* Model Switcher Pill in Docked Bar */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                      className="text-[11px] font-mono text-slate-300 bg-white/[0.04] hover:bg-white/[0.08] px-2 py-1.5 rounded-xl border border-white/10 flex items-center gap-1 transition-colors"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span className="hidden sm:inline font-semibold">{selectedModel.shortName || selectedModel.name}</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </button>
                  </div>

                  <textarea
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Ask ${selectedModel.name}... (${remainingPrompts} free queries left)`}
                    className="flex-1 bg-transparent px-2 py-2 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none resize-none font-sans"
                  />

                  <button
                    onClick={handleVoiceToggle}
                    title="Simulate Voice Prompt"
                    className={`p-2 rounded-xl border transition-all ${
                      isListening
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isTyping}
                    className={`p-2.5 rounded-xl font-bold transition-all flex items-center justify-center ${
                      input.trim() && !isTyping
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-500/20'
                        : 'bg-white/5 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-slate-400 px-2 font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span>Model: {selectedModel.name}</span>
                  <span className="hidden sm:inline text-slate-500">•</span>
                  <span className="hidden sm:inline text-blue-300">{remainingPrompts} queries remaining</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={resetChat}
                    className="hover:text-blue-400 transition-colors flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>New Chat</span>
                  </button>
                  <Link to="/pricing" className="hover:text-blue-400 transition-colors">
                    Pricing
                  </Link>
                  <a href={`${APP_URL}/login`} className="hover:text-white transition-colors">
                    Log In →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Universal Login Gate Modal on 7th Prompt Limit or Locked Model Click ── */}
      <LoginGateModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title={loginModalDetails.title}
        subtitle={loginModalDetails.subtitle}
        badge={loginModalDetails.badge}
        feature="chat"
        redirectUrl={`${APP_URL}/login`}
      />
    </div>
  );
}
