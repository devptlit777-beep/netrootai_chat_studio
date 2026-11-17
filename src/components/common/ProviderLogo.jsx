import React, { useState } from 'react';

// Authentic high-fidelity vector SVGs with brand colors (zero latency, crystal-clear across dark and light themes)
const INLINE_SVGS = {
  openai: (
    <svg viewBox="0 0 24 24" fill="#10a37f" className="w-full h-full">
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 8.647a4.485 4.485 0 0 1 2.339-1.973v5.683a.784.784 0 0 0 .388.677l5.834 3.37-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 8.647zm16.597 3.855l-5.833-3.37 2.019-1.169a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.411-.679zm2.019-4.524l-.14-.085-4.78-2.759a.776.776 0 0 0-.784 0L9.409 8.503V6.171a.08.08 0 0 1 .033-.062l4.84-2.794a4.504 4.504 0 0 1 6.674 4.663l-.001.143zM8.307 10.33l-2.02-1.168a.076.076 0 0 1-.038-.052V3.527a4.5 4.5 0 0 1 7.37-3.454l-.142.08-4.778 2.76a.794.794 0 0 0-.392.681v6.736zm1.099-1.077l3.22-1.859 3.22 1.859v3.717l-3.22 1.859-3.22-1.859V9.253z" />
    </svg>
  ),
  anthropic: (
    <svg viewBox="0 0 24 24" fill="#d97706" className="w-full h-full">
      <path d="M13.827 3.516h3.458L24 20.484h-3.458l-1.89-4.63H11.51l-1.89 4.63H6.162L13.827 3.516zm2.392 9.544l-2.618-6.417-2.618 6.417h5.236zM3.458 20.484H0L7.665 3.516h3.458L3.458 20.484z" />
    </svg>
  ),
  google: (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.66-5.17 3.66-9.12z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.44 7.33 24 12 24z" />
      <path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.13z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.56 1.24 6.58l4.04 3.13c.95-2.83 3.6-4.96 6.72-4.96z" />
    </svg>
  ),
  deepseek: (
    <svg viewBox="0 0 24 24" fill="#0066ff" className="w-full h-full">
      <path d="M21.75 14.25c-.4 2.45-2.12 4.56-4.5 5.5-2.58 1.02-5.59.62-7.8-1.05-1.55-1.17-2.65-2.91-3.15-4.8-.5-1.9-.3-3.92.57-5.67.87-1.75 2.37-3.1 4.2-3.8 2.2-.84 4.67-.6 6.67.65 1.34.84 2.38 2.1 2.96 3.57.4.99.6 2.05.6 3.12 0 .83-.12 1.66-.35 2.48zM12 4a8 8 0 1 0 8 8 8 8 0 0 0-8-8zm1.5 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm4.5 4a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />
    </svg>
  ),
  meta: (
    <svg viewBox="0 0 24 24" fill="#0668e1" className="w-full h-full">
      <path d="M12 15.8c-2.3 0-4.1-1.6-4.5-3.8.4-2.2 2.2-3.8 4.5-3.8 2.3 0 4.1 1.6 4.5 3.8-.4 2.2-2.2 3.8-4.5 3.8zM18.8 6.5c-1.8 0-3.5 1-4.4 2.6-.9-1.6-2.6-2.6-4.4-2.6-3.1 0-5.6 2.5-5.6 5.5s2.5 5.5 5.6 5.5c1.8 0 3.5-1 4.4-2.6.9 1.6 2.6 2.6 4.4 2.6 3.1 0 5.6-2.5 5.6-5.5s-2.5-5.5-5.6-5.5z" />
    </svg>
  ),
  mistral: (
    <svg viewBox="0 0 24 24" fill="#ff7000" className="w-full h-full">
      <path d="M2 3h4v4H2V3zm7 0h6v4H9V3zm9 0h4v4h-4V3zM2 9h4v6H2V9zm16 0h4v6h-4V9zM2 17h4v4H2v-4zm7 0h6v4H9v-4zm9 0h4v4h-4v-4zM6 10h12v4H6v-4z" />
    </svg>
  ),
  xai: (
    <svg viewBox="0 0 24 24" fill="#ffffff" className="w-full h-full">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  qwen: (
    <svg viewBox="0 0 24 24" fill="#6366f1" className="w-full h-full">
      <path d="M12 2L3 7v10l9 5 9-5V7l-9-5zm0 2.8l6.5 3.6L12 12 5.5 8.4 12 4.8zm-7 5.2l6 3.3v6.9l-6-3.3v-6.9zm8 10.2v-6.9l6-3.3v6.9l-6 3.3z" />
    </svg>
  ),
  cohere: (
    <svg viewBox="0 0 24 24" fill="#ff7759" className="w-full h-full">
      <path d="M7.5 4.5a5.5 5.5 0 0 0-5.5 5.5c0 4.2 4.4 7.5 7.5 9.5 3.1-2 7.5-5.3 7.5-9.5a5.5 5.5 0 0 0-5.5-5.5c-1.8 0-3.3.8-4 2.1-.7-1.3-2.2-2.1-4-2.1z" />
    </svg>
  ),
  minimax: (
    <svg viewBox="0 0 24 24" fill="#ec4899" className="w-full h-full">
      <rect x="2" y="9" width="3.5" height="6" rx="1.75" />
      <rect x="8" y="5" width="3.5" height="14" rx="1.75" />
      <rect x="14" y="3" width="3.5" height="18" rx="1.75" />
      <rect x="20" y="8" width="3.5" height="8" rx="1.75" />
    </svg>
  ),
  bytedance: (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <rect x="3" y="4" width="4.5" height="9" rx="1" fill="#00e5ff" />
      <rect x="9.5" y="8" width="4.5" height="12" rx="1" fill="#3b82f6" />
      <rect x="16" y="2" width="4.5" height="10" rx="1" fill="#00e5ff" />
      <rect x="3" y="15" width="4.5" height="5" rx="1" fill="#3b82f6" />
    </svg>
  ),
  nvidia: (
    <svg viewBox="0 0 24 24" fill="#76b900" className="w-full h-full">
      <path d="M7.784 15.698c.553.11 1.157.172 1.76.172 2.688 0 4.25-1.458 4.25-3.869 0-2.311-1.612-3.82-4.2-3.82-1.91 0-3.216 1.055-3.769 2.764h-3.417C2.955 7.437 5.769 5 9.844 5c4.673 0 7.789 2.864 7.789 6.985 0 4.372-3.367 7.035-7.99 7.035-1.156 0-2.312-.151-3.367-.452l1.508-2.87z" />
    </svg>
  ),
  perplexity: (
    <svg viewBox="0 0 24 24" fill="#20b2aa" className="w-full h-full">
      <path d="M12 2a2 2 0 0 0-2 2v3.1l-2.2-2.2a2 2 0 1 0-2.83 2.83L7.1 9.9H4a2 2 0 1 0 0 4h3.1l-2.13 2.17a2 2 0 1 0 2.83 2.83L10 16.7V20a2 2 0 1 0 4 0v-3.3l2.2 2.2a2 2 0 1 0 2.83-2.83L16.9 13.9H20a2 2 0 1 0 0-4h-3.1l2.13-2.17a2 2 0 1 0-2.83-2.83L14 7.1V4a2 2 0 0 0-2-2z" />
    </svg>
  ),
  amazon: (
    <svg viewBox="0 0 24 24" fill="#ff9900" className="w-full h-full">
      <path d="M13.92 14.77c-2.35 1.77-5.75 2.73-8.68 2.73-4.12 0-7.83-1.54-10.64-4.13-.22-.2-.02-.48.24-.33 3.03 1.75 6.78 2.8 10.63 2.8 2.62 0 5.48-.63 8.08-1.92.39-.2.72.24.37.85z" />
      <path d="M14.65 13.56c-.29-.39-1.99-.21-2.76-.1-.23.03-.26-.17-.06-.31 1.34-.96 3.53-.68 3.79-.34.25.35-.07 2.58-1.34 3.63-.19.16-.36.07-.28-.14.28-.71.94-2.35.65-2.74z" />
    </svg>
  ),
  microsoft: (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <rect x="2" y="2" width="9.5" height="9.5" fill="#f25022" />
      <rect x="12.5" y="2" width="9.5" height="9.5" fill="#7fba00" />
      <rect x="2" y="12.5" width="9.5" height="9.5" fill="#00a4ef" />
      <rect x="12.5" y="12.5" width="9.5" height="9.5" fill="#ffb900" />
    </svg>
  ),
  liquid: (
    <svg viewBox="0 0 24 24" fill="#06b6d4" className="w-full h-full">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  ),
  zhipu: (
    <svg viewBox="0 0 24 24" fill="#1e88e5" className="w-full h-full">
      <circle cx="12" cy="12" r="8" fill="none" stroke="#1e88e5" strokeWidth="3" />
      <circle cx="12" cy="12" r="3" fill="#1e88e5" />
    </svg>
  ),
  moonshot: (
    <svg viewBox="0 0 24 24" fill="#6366f1" className="w-full h-full">
      <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-5.4-5.4c0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z" />
    </svg>
  ),
  tencent: (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <path fill="#0052d9" d="M3 4.5h18v3.5h-6.8v12h-4.4V8H3V4.5z" />
    </svg>
  ),
  recursive: (
    <svg viewBox="0 0 24 24" fill="#a855f7" className="w-full h-full">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 17c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7zm-2-11h4v4h-4zm0 6h4v2h-4z" />
    </svg>
  ),
  openrouter: (
    <svg viewBox="0 0 24 24" fill="#6366f1" className="w-full h-full">
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="18" cy="18" r="3" />
      <path d="M6 12h6l6-6M12 12l6 6" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  blackforest: (
    <svg viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <path d="M12 2L2 22h20L12 2z" fill="#083344" />
      <path d="M12 6L5.5 19h13L12 6z" fill="#0e7490" />
      <path d="M12 11l-3.5 7h7L12 11z" fill="#22d3ee" />
    </svg>
  ),
  kuaishou: (
    <svg viewBox="0 0 24 24" fill="#ff5000" className="w-full h-full">
      <path d="M12 3a9 9 0 0 0-9 9c0 4.97 4.03 9 9 9s9-4.03 9-9a9 9 0 0 0-9-9zm-1.5 5.5l5 3.5-5 3.5v-7z" />
    </svg>
  ),
  luma: (
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
      <circle cx="12" cy="12" r="9" stroke="#ec4899" strokeWidth="2" />
      <path d="M8 12a4 4 0 1 1 8 0 4 4 0 0 1-8 0z" fill="#8b5cf6" />
      <path d="M12 4v4m0 8v4m-8-8h4m8 0h4" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  stability: (
    <svg viewBox="0 0 24 24" fill="#a855f7" className="w-full h-full">
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="5" r="2" />
      <circle cx="12" cy="19" r="2" />
      <circle cx="5" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
      <circle cx="7" cy="7" r="1.5" />
      <circle cx="17" cy="17" r="1.5" />
      <circle cx="7" cy="17" r="1.5" />
      <circle cx="17" cy="7" r="1.5" />
    </svg>
  ),
  recraft: (
    <svg viewBox="0 0 24 24" fill="#38bdf8" className="w-full h-full">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
    </svg>
  ),
  openaudio: (
    <svg viewBox="0 0 24 24" fill="#10b981" className="w-full h-full">
      <rect x="3" y="9" width="3" height="6" rx="1.5" />
      <rect x="8.5" y="5" width="3" height="14" rx="1.5" />
      <rect x="14" y="3" width="3" height="18" rx="1.5" />
      <rect x="19.5" y="8" width="3" height="8" rx="1.5" />
    </svg>
  ),
  studio: (
    <svg viewBox="0 0 24 24" fill="#8b5cf6" className="w-full h-full">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
};

// Known provider metadata with fallback styling
const PROVIDER_INFO = {
  openai: {
    name: 'OpenAI',
    color: '#10a37f',
    textColor: 'text-emerald-400',
    bgBadge: 'bg-emerald-500/10 border-emerald-500/20',
  },
  anthropic: {
    name: 'Anthropic',
    color: '#d97706',
    textColor: 'text-amber-400',
    bgBadge: 'bg-amber-500/10 border-amber-500/20',
  },
  google: {
    name: 'Google AI',
    color: '#4285f4',
    textColor: 'text-blue-400',
    bgBadge: 'bg-blue-500/10 border-blue-500/20',
  },
  deepseek: {
    name: 'DeepSeek',
    color: '#0066ff',
    textColor: 'text-sky-400',
    bgBadge: 'bg-sky-500/10 border-sky-500/20',
  },
  'meta-llama': {
    name: 'Meta Llama',
    color: '#0668e1',
    textColor: 'text-blue-400',
    bgBadge: 'bg-blue-500/10 border-blue-500/20',
  },
  meta: {
    name: 'Meta',
    color: '#0668e1',
    textColor: 'text-blue-400',
    bgBadge: 'bg-blue-500/10 border-blue-500/20',
  },
  mistralai: {
    name: 'Mistral AI',
    color: '#ff7000',
    textColor: 'text-orange-400',
    bgBadge: 'bg-orange-500/10 border-orange-500/20',
  },
  mistral: {
    name: 'Mistral',
    color: '#ff7000',
    textColor: 'text-orange-400',
    bgBadge: 'bg-orange-500/10 border-orange-500/20',
  },
  cohere: {
    name: 'Cohere',
    color: '#ff7759',
    textColor: 'text-rose-400',
    bgBadge: 'bg-rose-500/10 border-rose-500/20',
  },
  qwen: {
    name: 'Qwen',
    color: '#6366f1',
    textColor: 'text-indigo-400',
    bgBadge: 'bg-indigo-500/10 border-indigo-500/20',
  },
  minimax: {
    name: 'MiniMax',
    color: '#ec4899',
    textColor: 'text-pink-400',
    bgBadge: 'bg-pink-500/10 border-pink-500/20',
  },
  liquid: {
    name: 'Liquid AI',
    color: '#06b6d4',
    textColor: 'text-cyan-400',
    bgBadge: 'bg-cyan-500/10 border-cyan-500/20',
  },
  'x-ai': {
    name: 'xAI',
    color: '#ffffff',
    textColor: 'text-white',
    bgBadge: 'bg-white/10 border-white/20',
  },
  xai: {
    name: 'xAI',
    color: '#ffffff',
    textColor: 'text-white',
    bgBadge: 'bg-white/10 border-white/20',
  },
  bytedance: {
    name: 'ByteDance',
    color: '#00e5ff',
    textColor: 'text-cyan-400',
    bgBadge: 'bg-cyan-500/10 border-cyan-500/20',
  },
  nvidia: {
    name: 'Nvidia',
    color: '#76b900',
    textColor: 'text-lime-400',
    bgBadge: 'bg-lime-500/10 border-lime-500/20',
  },
  perplexity: {
    name: 'Perplexity',
    color: '#20b2aa',
    textColor: 'text-emerald-400',
    bgBadge: 'bg-emerald-500/10 border-emerald-500/20',
  },
  amazon: {
    name: 'Amazon',
    color: '#ff9900',
    textColor: 'text-amber-400',
    bgBadge: 'bg-amber-500/10 border-amber-500/20',
  },
  microsoft: {
    name: 'Microsoft',
    color: '#00a4ef',
    textColor: 'text-cyan-400',
    bgBadge: 'bg-cyan-500/10 border-cyan-500/20',
  },
  zhipu: {
    name: 'Zhipu AI',
    color: '#1e88e5',
    textColor: 'text-blue-400',
    bgBadge: 'bg-blue-500/10 border-blue-500/20',
  },
  moonshot: {
    name: 'Moonshot AI',
    color: '#6366f1',
    textColor: 'text-indigo-400',
    bgBadge: 'bg-indigo-500/10 border-indigo-500/20',
  },
  tencent: {
    name: 'Tencent',
    color: '#0052d9',
    textColor: 'text-blue-500',
    bgBadge: 'bg-blue-600/10 border-blue-600/20',
  },
  fal: {
    name: 'Fal.ai',
    color: '#ec4899',
    textColor: 'text-pink-400',
    bgBadge: 'bg-pink-500/10 border-pink-500/20',
  },
  recursive: {
    name: 'Recursive',
    color: '#a855f7',
    textColor: 'text-purple-400',
    bgBadge: 'bg-purple-500/10 border-purple-500/20',
  },
  openrouter: {
    name: 'OpenRouter',
    color: '#6366f1',
    textColor: 'text-indigo-400',
    bgBadge: 'bg-indigo-500/10 border-indigo-500/20',
  },
  blackforest: {
    name: 'Black Forest Labs',
    color: '#06b6d4',
    textColor: 'text-cyan-400',
    bgBadge: 'bg-cyan-500/10 border-cyan-500/20',
  },
  kuaishou: {
    name: 'Kuaishou AI',
    color: '#ff5000',
    textColor: 'text-orange-400',
    bgBadge: 'bg-orange-500/10 border-orange-500/20',
  },
  luma: {
    name: 'Luma AI',
    color: '#ec4899',
    textColor: 'text-pink-400',
    bgBadge: 'bg-pink-500/10 border-pink-500/20',
  },
  stability: {
    name: 'Stability AI',
    color: '#a855f7',
    textColor: 'text-purple-400',
    bgBadge: 'bg-purple-500/10 border-purple-500/20',
  },
  recraft: {
    name: 'Recraft AI',
    color: '#38bdf8',
    textColor: 'text-sky-400',
    bgBadge: 'bg-sky-500/10 border-sky-500/20',
  },
  openaudio: {
    name: 'SWIFT OpenAudio',
    color: '#10b981',
    textColor: 'text-emerald-400',
    bgBadge: 'bg-emerald-500/10 border-emerald-500/20',
  },
  studio: {
    name: 'Creative Studio',
    color: '#8b5cf6',
    textColor: 'text-purple-400',
    bgBadge: 'bg-purple-500/10 border-purple-500/20',
  },
};

export function normalizeProviderSlug(providerOrModelId) {
  if (!providerOrModelId) return 'ai';
  let full = String(providerOrModelId).toLowerCase().trim();
  let raw = full.includes('/') ? full.split('/')[0] : full;

  if (full.includes('black-forest') || full.includes('flux')) return 'blackforest';
  if (full.includes('kuaishou') || full.includes('kling')) return 'kuaishou';
  if (full.includes('luma')) return 'luma';
  if (full.includes('recraft')) return 'recraft';
  if (full.includes('stability')) return 'stability';
  if (full.includes('openaudio') || full.includes('f5-tts')) return 'openaudio';
  if (full.includes('cogvideo') || full.includes('zhipu') || full.includes('glm')) return 'zhipu';
  if (full.includes('whisper')) return 'openai';
  if (raw.includes('openai')) return 'openai';
  if (raw.includes('anthropic') || raw.includes('claude')) return 'anthropic';
  if (raw.includes('google') || raw.includes('gemini')) return 'google';
  if (raw.includes('deepseek')) return 'deepseek';
  if (raw.includes('meta') || raw.includes('llama')) return 'meta';
  if (raw.includes('mistral') || raw.includes('codestral')) return 'mistral';
  if (raw.includes('cohere') || raw.includes('command')) return 'cohere';
  if (raw.includes('qwen') || raw.includes('alibaba')) return 'qwen';
  if (raw.includes('xai') || raw.includes('x-ai') || raw.includes('grok')) return 'xai';
  if (raw.includes('minimax')) return 'minimax';
  if (raw.includes('liquid')) return 'liquid';
  if (raw.includes('bytedance') || raw.includes('doubao')) return 'bytedance';
  if (raw.includes('nvidia') || raw.includes('nemotron')) return 'nvidia';
  if (raw.includes('perplexity') || raw.includes('sonar')) return 'perplexity';
  if (raw.includes('amazon') || raw.includes('nova')) return 'amazon';
  if (raw.includes('microsoft')) return 'microsoft';
  if (raw.includes('zhipu') || raw.includes('z-ai') || raw.includes('glm') || raw.includes('chatglm') || raw.includes('bigmodel')) return 'zhipu';
  if (raw.includes('tencent') || raw.includes('hunyuan')) return 'tencent';
  if (raw.includes('moonshot') || raw.includes('kimi')) return 'moonshot';
  if (raw.includes('recursive') || raw.includes('flint')) return 'recursive';
  if (raw.includes('openrouter')) return 'openrouter';
  if (raw.includes('fal')) return 'studio';

  return raw.replace(/[^a-z0-9-]/g, '');
}

export default function ProviderLogo({
  provider,
  modelId,
  className = '',
  size = 'sm', // 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  darkMode = true,
  showName = false,
}) {
  const [imgError, setImgError] = useState(false);

  const slug = normalizeProviderSlug(provider || modelId);
  const info = PROVIDER_INFO[slug] || {
    name: provider || slug,
    color: '#6366f1',
    textColor: 'text-indigo-400',
    bgBadge: 'bg-indigo-500/10 border-indigo-500/20',
  };

  // Dimensions with increased clarity so icons are easily legible
  const sizeMap = {
    xs: { box: 'w-5 h-5', icon: 'w-3.5 h-3.5', text: 'text-[10px]' },
    sm: { box: 'w-6 h-6', icon: 'w-4 h-4', text: 'text-xs' },
    md: { box: 'w-8 h-8', icon: 'w-5 h-5', text: 'text-sm' },
    lg: { box: 'w-11 h-11', icon: 'w-7 h-7', text: 'text-base font-bold' },
    xl: { box: 'w-14 h-14', icon: 'w-9 h-9', text: 'text-lg font-bold' },
  };

  const s = sizeMap[size] || sizeMap.sm;
  const inlineSvg = INLINE_SVGS[slug];
  const monogram = (provider || slug).slice(0, 2).toUpperCase();

  return (
    <div className={`inline-flex items-center gap-1.5 select-none ${className}`}>
      <div
        className={`${s.box} rounded-lg flex items-center justify-center shrink-0 overflow-hidden shadow-sm transition-transform duration-150 ${
          darkMode ? 'bg-[#18181b] border border-[#2a2a2e]' : 'bg-gray-100 border border-gray-200'
        }`}
        title={info.name || provider}
      >
        {inlineSvg ? (
          <div className={`${s.icon} flex items-center justify-center p-0.5`}>
            {inlineSvg}
          </div>
        ) : !imgError ? (
          <img
            src={`https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${slug}.com&size=128`}
            alt={info.name || provider}
            className={`${s.icon} object-contain`}
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <span className={`${s.text} font-mono font-bold ${info.textColor || 'text-gray-300'}`}>
            {monogram}
          </span>
        )}
      </div>

      {showName && (
        <span className={`font-semibold truncate ${s.text} ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
          {info.name || provider}
        </span>
      )}
    </div>
  );
}
