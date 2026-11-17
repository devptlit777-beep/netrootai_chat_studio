import React from 'react';
import { Sparkles, Layers, Cpu, ArrowUpRight } from 'lucide-react';

const APP_URL = '';

// ── High-Fidelity Official Vector SVGs for AI Providers ──
const PROVIDER_SVGS = {
  openai: (
    <svg viewBox="0 0 24 24" fill="#10a37f" className="w-5 h-5">
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 8.647a4.485 4.485 0 0 1 2.339-1.973v5.683a.784.784 0 0 0 .388.677l5.834 3.37-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 8.647zm16.597 3.855l-5.833-3.37 2.019-1.169a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.411-.679zm2.019-4.524l-.14-.085-4.78-2.759a.776.776 0 0 0-.784 0L9.409 8.503V6.171a.08.08 0 0 1 .033-.062l4.84-2.794a4.504 4.504 0 0 1 6.674 4.663l-.001.143zM8.307 10.33l-2.02-1.168a.076.076 0 0 1-.038-.052V3.527a4.5 4.5 0 0 1 7.37-3.454l-.142.08-4.778 2.76a.794.794 0 0 0-.392.681v6.736zm1.099-1.077l3.22-1.859 3.22 1.859v3.717l-3.22 1.859-3.22-1.859V9.253z" />
    </svg>
  ),
  anthropic: (
    <svg viewBox="0 0 24 24" fill="#d97706" className="w-5 h-5">
      <path d="M13.827 3.516h3.458L24 20.484h-3.458l-1.89-4.63H11.51l-1.89 4.63H6.162L13.827 3.516zm2.392 9.544l-2.618-6.417-2.618 6.417h5.236zM3.458 20.484H0L7.665 3.516h3.458L3.458 20.484z" />
    </svg>
  ),
  google: (
    <svg viewBox="0 0 24 24" className="w-5 h-5">
      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.66-5.17 3.66-9.12z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.44 7.33 24 12 24z" />
      <path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.13z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.56 1.24 6.58l4.04 3.13c.95-2.83 3.6-4.96 6.72-4.96z" />
    </svg>
  ),
  meta: (
    <svg viewBox="0 0 24 24" fill="#0668e1" className="w-5 h-5">
      <path d="M12 15.8c-2.3 0-4.1-1.6-4.5-3.8.4-2.2 2.2-3.8 4.5-3.8 2.3 0 4.1 1.6 4.5 3.8-.4 2.2-2.2 3.8-4.5 3.8zM18.8 6.5c-1.8 0-3.5 1-4.4 2.6-.9-1.6-2.6-2.6-4.4-2.6-3.1 0-5.6 2.5-5.6 5.5s2.5 5.5 5.6 5.5c1.8 0 3.5-1 4.4-2.6.9 1.6 2.6 2.6 4.4 2.6 3.1 0 5.6-2.5 5.6-5.5s-2.5-5.5-5.6-5.5z" />
    </svg>
  ),
  deepseek: (
    <svg viewBox="0 0 24 24" fill="#0066ff" className="w-5 h-5">
      <path d="M21.75 14.25c-.4 2.45-2.12 4.56-4.5 5.5-2.58 1.02-5.59.62-7.8-1.05-1.55-1.17-2.65-2.91-3.15-4.8-.5-1.9-.3-3.92.57-5.67.87-1.75 2.37-3.1 4.2-3.8 2.2-.84 4.67-.6 6.67.65 1.34.84 2.38 2.1 2.96 3.57.4.99.6 2.05.6 3.12 0 .83-.12 1.66-.35 2.48zM12 4a8 8 0 1 0 8 8 8 8 0 0 0-8-8zm1.5 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm4.5 4a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />
    </svg>
  ),
  groq: (
    <svg viewBox="0 0 24 24" className="w-5 h-5">
      <defs>
        <linearGradient id="groq-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f55036" />
          <stop offset="100%" stopColor="#ff7849" />
        </linearGradient>
      </defs>
      <rect x="2" y="4" width="20" height="16" rx="4" fill="none" stroke="url(#groq-grad)" strokeWidth="2" />
      <path d="M13 7l-5 6h4l-1 5 5-6h-4l1-5z" fill="url(#groq-grad)" />
    </svg>
  ),
  xai: (
    <svg viewBox="0 0 24 24" fill="#ffffff" className="w-5 h-5">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  mistral: (
    <svg viewBox="0 0 24 24" fill="#ff7000" className="w-5 h-5">
      <path d="M2 3h4v4H2V3zm7 0h6v4H9V3zm9 0h4v4h-4V3zM2 9h4v6H2V9zm16 0h4v6h-4V9zM2 17h4v4H2v-4zm7 0h6v4H9v-4zm9 0h4v4h-4v-4zM6 10h12v4H6v-4z" />
    </svg>
  ),
  fal: (
    <svg viewBox="0 0 24 24" className="w-5 h-5">
      <defs>
        <linearGradient id="fal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill="none" stroke="url(#fal-grad)" strokeWidth="2" />
      <path d="M8 8h8M8 12h5M8 16h3" stroke="url(#fal-grad)" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  ),
  blackforest: (
    <svg viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M12 2L2 22h20L12 2z" fill="#083344" />
      <path d="M12 6L5.5 19h13L12 6z" fill="#0e7490" />
      <path d="M12 11l-3.5 7h7L12 11z" fill="#22d3ee" />
    </svg>
  ),
  qwen: (
    <svg viewBox="0 0 24 24" fill="#6366f1" className="w-5 h-5">
      <path d="M12 2L3 7v10l9 5 9-5V7l-9-5zm0 2.8l6.5 3.6L12 12 5.5 8.4 12 4.8zm-7 5.2l6 3.3v6.9l-6-3.3v-6.9zm8 10.2v-6.9l6-3.3v6.9l-6 3.3z" />
    </svg>
  ),
  nvidia: (
    <svg viewBox="0 0 24 24" fill="#76b900" className="w-5 h-5">
      <path d="M7.784 15.698c.553.11 1.157.172 1.76.172 2.688 0 4.25-1.458 4.25-3.869 0-2.311-1.612-3.82-4.2-3.82-1.91 0-3.216 1.055-3.769 2.764h-3.417C2.955 7.437 5.769 5 9.844 5c4.673 0 7.789 2.864 7.789 6.985 0 4.372-3.367 7.035-7.99 7.035-1.156 0-2.312-.151-3.367-.452l1.508-2.87z" />
    </svg>
  ),
  cohere: (
    <svg viewBox="0 0 24 24" fill="#ff7759" className="w-5 h-5">
      <path d="M7.5 4.5a5.5 5.5 0 0 0-5.5 5.5c0 4.2 4.4 7.5 7.5 9.5 3.1-2 7.5-5.3 7.5-9.5a5.5 5.5 0 0 0-5.5-5.5c-1.8 0-3.3.8-4 2.1-.7-1.3-2.2-2.1-4-2.1z" />
    </svg>
  ),
  perplexity: (
    <svg viewBox="0 0 24 24" fill="#20b2aa" className="w-5 h-5">
      <path d="M12 2a2 2 0 0 0-2 2v3.1l-2.2-2.2a2 2 0 1 0-2.83 2.83L7.1 9.9H4a2 2 0 1 0 0 4h3.1l-2.13 2.17a2 2 0 1 0 2.83 2.83L10 16.7V20a2 2 0 1 0 4 0v-3.3l2.2 2.2a2 2 0 1 0 2.83-2.83L16.9 13.9H20a2 2 0 1 0 0-4h-3.1l2.13-2.17a2 2 0 1 0-2.83-2.83L14 7.1V4a2 2 0 0 0-2-2z" />
    </svg>
  ),
  microsoft: (
    <svg viewBox="0 0 24 24" className="w-5 h-5">
      <rect x="2" y="2" width="9.5" height="9.5" fill="#f25022" />
      <rect x="12.5" y="2" width="9.5" height="9.5" fill="#7fba00" />
      <rect x="2" y="12.5" width="9.5" height="9.5" fill="#00a4ef" />
      <rect x="12.5" y="12.5" width="9.5" height="9.5" fill="#ffb900" />
    </svg>
  ),
  bytedance: (
    <svg viewBox="0 0 24 24" className="w-5 h-5">
      <rect x="3" y="4" width="4.5" height="9" rx="1" fill="#00e5ff" />
      <rect x="9.5" y="8" width="4.5" height="12" rx="1" fill="#3b82f6" />
      <rect x="16" y="2" width="4.5" height="10" rx="1" fill="#00e5ff" />
      <rect x="3" y="15" width="4.5" height="5" rx="1" fill="#3b82f6" />
    </svg>
  ),
};

// ── 16 Frontier Providers Metadata ──
const TRACK_ONE_PROVIDERS = [
  { id: 'openai', name: 'OpenAI', badge: 'o1 • GPT-4o', color: '#10a37f', glow: 'rgba(16,163,127,0.3)' },
  { id: 'anthropic', name: 'Anthropic', badge: 'Claude 3.5 Sonnet', color: '#d97706', glow: 'rgba(217,119,6,0.3)' },
  { id: 'google', name: 'Google DeepMind', badge: 'Gemini 2.0 Flash', color: '#4285f4', glow: 'rgba(66,133,244,0.3)' },
  { id: 'groq', name: 'NetRoot Neural Core', badge: 'Ultra-Throughput', color: '#06b6d4', glow: 'rgba(6,182,212,0.35)' },
  { id: 'meta', name: 'Meta AI', badge: 'Llama 3.3 70B', color: '#0668e1', glow: 'rgba(6,104,225,0.3)' },
  { id: 'deepseek', name: 'DeepSeek', badge: 'DeepSeek R1', color: '#0066ff', glow: 'rgba(0,102,255,0.35)' },
  { id: 'xai', name: 'xAI', badge: 'Grok-2 Vision', color: '#ffffff', glow: 'rgba(255,255,255,0.25)' },
  { id: 'mistral', name: 'Mistral AI', badge: 'Mistral Large 2', color: '#ff7000', glow: 'rgba(255,112,0,0.3)' },
];

const TRACK_TWO_PROVIDERS = [
  { id: 'fal', name: 'Fal.ai', badge: 'Lightning Media', color: '#c084fc', glow: 'rgba(192,132,252,0.3)' },
  { id: 'blackforest', name: 'Black Forest Labs', badge: 'Photorealism Engine', color: '#22d3ee', glow: 'rgba(34,211,238,0.3)' },
  { id: 'qwen', name: 'Alibaba Qwen', badge: 'Qwen 27B Vision', color: '#6366f1', glow: 'rgba(99,102,241,0.3)' },
  { id: 'nvidia', name: 'NVIDIA', badge: 'Nemotron 70B', color: '#76b900', glow: 'rgba(118,185,0,0.3)' },
  { id: 'cohere', name: 'Cohere', badge: 'Command R+', color: '#ff7759', glow: 'rgba(255,119,89,0.3)' },
  { id: 'perplexity', name: 'Perplexity', badge: 'Sonar Live Citations', color: '#20b2aa', glow: 'rgba(32,178,170,0.3)' },
  { id: 'microsoft', name: 'Microsoft Azure', badge: 'Phi-4 Multimodal', color: '#00a4ef', glow: 'rgba(0,164,239,0.3)' },
  { id: 'bytedance', name: 'ByteDance', badge: 'Skylark Intelligence', color: '#00e5ff', glow: 'rgba(0,229,255,0.3)' },
];

// Duplicate for continuous seamless infinite loop
const TRACK_ONE_DOUBLED = [...TRACK_ONE_PROVIDERS, ...TRACK_ONE_PROVIDERS];
const TRACK_TWO_DOUBLED = [...TRACK_TWO_PROVIDERS, ...TRACK_TWO_PROVIDERS];

export default function LandingProvidersMarquee() {
  return (
    <section className="relative py-12 md:py-16 overflow-hidden border-y border-white/[0.06] bg-[#06070a]/60 backdrop-blur-sm isolate">
      {/* ── Ambient Radial Atmosphere ── */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[300px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[500px] h-[300px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* ── Section Micro Header (Bridge from Hero to Models) ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel border border-blue-500/20 text-[11px] font-semibold text-slate-300 mb-2.5 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="tracking-wider uppercase text-blue-300">Unified Model Ecosystem</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">470+ Models Across 15+ Frontier Labs</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto font-normal">
          Direct native access to proprietary flagship intelligence, open-weight titans, and next-gen generative media engines.
        </p>
      </div>

      {/* ── Dual-Track Infinite Floating Marquee Container ── */}
      <div 
        className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent_0%,black_10%,black_90%,transparent_100%)]"
        style={{ transform: 'translateZ(0)', contain: 'paint layout' }}
      >
        {/* Track 1: Moving Forward (Left to Right - 44s) */}
        <div className="animate-marquee-forward gap-3.5 sm:gap-4 pb-3 sm:pb-3.5">
          {TRACK_ONE_DOUBLED.map((p, idx) => (
            <div
              key={`track1-${p.id}-${idx}`}
              className="flex items-center gap-2.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl glass-panel border border-white/[0.08] hover:border-blue-500/40 bg-[#0c101a]/85 backdrop-blur-md shadow-lg shadow-black/40 transition-all duration-300 hover:scale-[1.04] cursor-pointer group select-none whitespace-nowrap"
              style={{
                '--hover-glow': p.glow,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 10px 24px -5px ${p.glow}, inset 0 0 12px ${p.glow}`;
                e.currentTarget.style.borderColor = p.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '';
                e.currentTarget.style.borderColor = '';
              }}
            >
              <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-white/[0.04] border border-white/[0.06] p-1 flex-shrink-0 group-hover:scale-110 transition-transform">
                {PROVIDER_SVGS[p.id]}
              </div>
              <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
                {p.name}
              </span>
              <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/[0.05] group-hover:text-slate-200 group-hover:border-white/10 transition-colors">
                {p.badge}
              </span>
            </div>
          ))}
        </div>

        {/* Track 2: Moving Reverse (Right to Left - 38s) */}
        <div className="animate-marquee-reverse gap-3.5 sm:gap-4 pt-1">
          {TRACK_TWO_DOUBLED.map((p, idx) => (
            <div
              key={`track2-${p.id}-${idx}`}
              className="flex items-center gap-2.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl glass-panel border border-white/[0.08] hover:border-purple-400/50 bg-[#0c101a]/85 backdrop-blur-md shadow-lg shadow-black/40 transition-all duration-300 hover:scale-[1.04] cursor-pointer group select-none whitespace-nowrap"
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 10px 24px -5px ${p.glow}, inset 0 0 12px ${p.glow}`;
                e.currentTarget.style.borderColor = p.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '';
                e.currentTarget.style.borderColor = '';
              }}
            >
              <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-white/[0.04] border border-white/[0.06] p-1 flex-shrink-0 group-hover:scale-110 transition-transform">
                {PROVIDER_SVGS[p.id]}
              </div>
              <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
                {p.name}
              </span>
              <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/[0.05] group-hover:text-slate-200 group-hover:border-white/10 transition-colors">
                {p.badge}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
