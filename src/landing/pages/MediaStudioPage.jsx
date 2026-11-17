import React, { useState, useRef } from 'react';
import {
  Image as ImageIcon,
  Play,
  Sparkles,
  Sliders,
  Download,
  ArrowRight,
  Maximize2,
  CheckCircle2,
  Ratio,
  Palette,
  Film,
  Copy,
  Check,
  X,
  Volume2,
  VolumeX,
  Layers,
  Filter,
  Eye,
  Zap,
  Cpu,
  Compass,
} from 'lucide-react';
import LoginGateModal from '../components/common/LoginGateModal';
import LandingFloatingVideosShowcase, {
  AI_IMAGES,
  AI_VIDEOS,
} from '../components/landing/LandingFloatingVideosShowcase';

const APP_URL = '';

// ── Interactive Before & After Fidelity Presets ──
const COMPARISON_PRESETS = [
  {
    id: 'cybernetic',
    title: 'Cybernetic Titanium Android Portrait',
    prompt: 'Hyper-detailed cybernetic android portrait, subsurface scattering, iridescent titanium conduits, studio softbox lighting.',
    model: 'FLUX.1 Schnell',
    resolution: '4K UHD (3840×2160)',
    imageSrc: '/images/image1_26f1c759.jpg?v=clean2',
    steps: '30 Steps',
    sampler: 'Euler A • CFG 7.0',
    category: 'Photorealistic Synthetic',
  },
  {
    id: 'architecture',
    title: 'Desert Parametric Glass Pavilion',
    prompt: 'Parametric organic architecture in golden hour sand dunes, floor-to-ceiling reflective glass, cinematic ray tracing.',
    model: 'Midjourney v6.1',
    resolution: '4K UHD (3840×2160)',
    imageSrc: '/images/image2_8e32b66f.jpg?v=clean2',
    steps: '40 Steps',
    sampler: 'DPM++ 2M • Stylize 250',
    category: 'Architectural Render',
  },
  {
    id: 'space',
    title: 'Deep Space Planetary Orbital Station',
    prompt: 'Gigantic space station orbiting a ringed gas giant, solar panel reflections, hard directional cosmic sunlight.',
    model: 'FLUX.1 Dev 4K',
    resolution: '4K UHD (3840×2160)',
    imageSrc: '/images/image6_4d682ece.jpg?v=clean2',
    steps: '50 Steps',
    sampler: 'UniPC • CFG 8.5',
    category: 'Cinematic Sci-Fi',
  },
  {
    id: 'nature',
    title: 'Enchanted Twilight Redwood Canopy',
    prompt: 'Ancient misty redwood forest at twilight, volumetric god rays piercing the canopy, glowing bioluminescent spores.',
    model: 'DALL-E 3 HD',
    resolution: '4K UHD (3840×2160)',
    imageSrc: '/images/image12_2c92ad7c.jpg?v=clean2',
    steps: '35 Steps',
    sampler: 'Natural Vivid • HD Quality',
    category: 'Atmospheric Landscape',
  },
];

// ── Universal Aspect Ratio Presets ──
const RATIOS = [
  { label: '16:9 Landscape', ratio: '16:9', desc: 'YouTube, Keynotes & Desktop Displays', boxW: 'w-14', boxH: 'h-8' },
  { label: '9:16 Vertical', ratio: '9:16', desc: 'TikTok, Instagram Reels & YouTube Shorts', boxW: 'w-8', boxH: 'h-14' },
  { label: '1:1 Square', ratio: '1:1', desc: 'Instagram Feed, Avatars & App Store', boxW: 'w-10', boxH: 'h-10' },
  { label: '4:3 Classic', ratio: '4:3', desc: 'Editorial Magazines & Tablet Displays', boxW: 'w-12', boxH: 'h-9' },
  { label: '21:9 Ultra-Wide', ratio: '21:9', desc: 'Cinematic Anamorphic & Ultrawide Monitors', boxW: 'w-16', boxH: 'h-7' },
];

// ── Studio Image Card Component (Clean 2-Color Matte Style) ──
function StudioImageCard({ image, onCardClick, onCopyPrompt, isCopied }) {
  return (
    <div
      onClick={onCardClick}
      className="group rounded-2xl glass-panel border border-white/10 hover:border-blue-500/40 bg-[#0c0f18]/95 overflow-hidden flex flex-col justify-between cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-blue-950/30 hover:-translate-y-1"
    >
      {/* 4K Image Container */}
      <div className="aspect-video w-full relative overflow-hidden bg-black/70">
        <img
          src={image.src}
          alt={image.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Subtle Dark Gradient Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-mono font-bold text-blue-300 border border-blue-500/30 flex items-center gap-1">
            <ImageIcon className="w-3 h-3 text-blue-400" />
            <span>{image.model}</span>
          </span>
        </div>

        <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-mono text-slate-300 border border-white/15 font-semibold">
          4K UHD
        </div>

        {/* Hover Inspect Icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="px-3 py-1.5 rounded-full bg-black/85 backdrop-blur-md border border-blue-500/30 text-xs font-semibold text-white flex items-center gap-1.5 shadow-2xl">
            <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Inspect 4K</span>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-1">
            {image.title}
          </h4>
          <p className="text-[11px] text-slate-400 line-clamp-2 italic font-mono leading-relaxed">
            "{image.prompt}"
          </p>
        </div>

        <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
            <Zap className="w-3 h-3 text-blue-400" />
            <span>Photoreal 4K</span>
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopyPrompt(image.prompt, image.id);
            }}
            className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-[10px] font-mono font-medium text-slate-300 hover:text-white flex items-center gap-1 border border-white/10 transition-colors"
          >
            {isCopied ? (
              <>
                <Check className="w-3 h-3 text-blue-400" />
                <span className="text-blue-400 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-slate-400" />
                <span>Copy Prompt</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Studio Video Card Component (Hover-to-Play Architecture) ──
function StudioVideoCard({ video, onCardClick, onCopyPrompt, isCopied }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleMouseEnter = () => {
    if (videoRef.current) {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  return (
    <div
      onClick={onCardClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group rounded-2xl glass-panel border border-white/10 hover:border-blue-500/40 bg-[#0c0f18]/95 overflow-hidden flex flex-col justify-between cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-blue-950/30 hover:-translate-y-1"
    >
      {/* 60FPS Video Container with Hover-to-Play */}
      <div className="aspect-video w-full relative overflow-hidden bg-black/70">
        <video
          ref={videoRef}
          src={video.src}
          muted
          loop
          playsInline
          preload="metadata"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Subtle Dark Gradient Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30 pointer-events-none" />

        {/* Subtle Play Icon when paused */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 pointer-events-none ${
            isPlaying ? 'opacity-0' : 'opacity-80 group-hover:opacity-0'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
            <Play className="w-4 h-4 text-blue-400 fill-blue-500 ml-0.5" />
          </div>
        </div>

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-mono font-bold text-blue-300 border border-blue-500/30 flex items-center gap-1">
            <Film className="w-3 h-3 text-blue-400" />
            <span>{video.model}</span>
          </span>
        </div>

        <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
          <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-mono text-blue-300 border border-blue-500/30 font-bold">
            {video.fps || '60 FPS'}
          </span>
        </div>

        {/* Hover Status Indicator */}
        <div className="absolute bottom-2 left-2 pointer-events-none">
          <span
            className={`px-2 py-0.5 rounded text-[9px] font-mono font-semibold transition-opacity duration-200 ${
              isPlaying
                ? 'bg-blue-500/20 text-blue-200 border border-blue-500/40 opacity-100'
                : 'opacity-0'
            }`}
          >
            ▶ Playing on Hover
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-1">
            {video.title}
          </h4>
          <p className="text-[11px] text-slate-400 line-clamp-2 italic font-mono leading-relaxed">
            "{video.prompt}"
          </p>
        </div>

        <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
            <Cpu className="w-3 h-3 text-blue-400" />
            <span>{video.latency || '1.8s'} latency</span>
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopyPrompt(video.prompt, video.id);
            }}
            className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-[10px] font-mono font-medium text-slate-300 hover:text-white flex items-center gap-1 border border-white/10 transition-colors"
          >
            {isCopied ? (
              <>
                <Check className="w-3 h-3 text-blue-400" />
                <span className="text-blue-400 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-slate-400" />
                <span>Copy Prompt</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MediaStudioPage() {
  const [sliderPos, setSliderPos] = useState(50);
  const [activePresetIndex, setActivePresetIndex] = useState(0);
  const [selectedRatio, setSelectedRatio] = useState(RATIOS[0]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeModalItem, setActiveModalItem] = useState(null);
  const [isModalMuted, setIsModalMuted] = useState(true);
  const [copiedPromptId, setCopiedPromptId] = useState(null);

  const activePreset = COMPARISON_PRESETS[activePresetIndex];

  const handleCopyPrompt = (promptText, id) => {
    navigator.clipboard?.writeText(promptText);
    setCopiedPromptId(id);
    setTimeout(() => setCopiedPromptId(null), 2000);
  };

  return (
    <div className="pt-28 pb-24 overflow-hidden bg-[#090a0f]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        {/* ══════════════════════════════════════════════════════════════════
            HERO: DEDICATED 4K AI IMAGE STUDIO (2-COLOR CLEAN MATTE)
           ══════════════════════════════════════════════════════════════════ */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel border border-blue-500/30 text-xs font-semibold text-blue-300">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>NetRoot AI Dedicated 4K Image Studio • Photorealistic Visual Synthesis</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Cinematic Photography &{' '}
            <span className="text-blue-400">
              Studio-Grade 4K
            </span>{' '}
            AI Images.
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Harness leading multi-diffusion engines (FLUX.1 Dev, Midjourney v6.1, DALL-E 3 HD, and SD 3.5 Large) to synthesize ultra-high resolution photography, architecture, and character design from simple text.
          </p>

          {/* Quick Metrics Bar (Clean Monochrome & Cyan) */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono text-slate-300 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
              <span>12 Curated 4K Images</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono text-slate-300 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span>Multi-Diffusion Pipeline</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              <span>Sub-2s Latency</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono text-slate-300 flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Lossless Raw PNG Downloads</span>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3">
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs sm:text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all"
            >
              <span>Launch Image Generator</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>

            <a
              href="#studio-gallery"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all"
            >
              <Eye className="w-4 h-4 text-blue-400" />
              <span>Browse 12 4K Images</span>
            </a>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 1: INTERACTIVE BEFORE & AFTER FIDELITY REVEAL SLIDER
           ══════════════════════════════════════════════════════════════════ */}
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="text-center space-y-1 mb-2">
            <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center justify-center gap-2">
              <Sliders className="w-5 h-5 text-blue-400" />
              <span>Latent Diffusion Fidelity Lens</span>
            </h3>
            <p className="text-xs text-slate-400">
              Drag the interactive slider to compare raw latent concepts against 4K multi-diffusion renders.
            </p>
          </div>

          {/* Preset Selector Tabs (Clean 2-Color) */}
          <div className="flex flex-wrap items-center justify-center gap-2 pb-1">
            {COMPARISON_PRESETS.map((preset, idx) => (
              <button
                key={preset.id}
                onClick={() => setActivePresetIndex(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activePresetIndex === idx
                    ? 'bg-blue-500/20 text-blue-200 border border-blue-500/40 shadow-sm'
                    : 'bg-white/[0.03] text-slate-400 hover:text-white border border-white/10'
                }`}
              >
                <span>{preset.title.split(' ')[0]} {preset.title.split(' ')[1]}</span>
                <span className="text-[10px] font-mono opacity-60">({preset.model})</span>
              </button>
            ))}
          </div>

          {/* Slider Container */}
          <div className="rounded-3xl glass-panel p-4 sm:p-6 border border-white/10 shadow-2xl shadow-black/80 space-y-4 bg-[#0c0f18]/95">
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden select-none border border-white/10 bg-black">
              {/* Full Color 4K Render (Right Side) */}
              <img
                src={activePreset.imageSrc}
                alt={activePreset.title}
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Top Right Final Render Badge */}
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-[10px] font-mono text-blue-300 border border-blue-500/30 flex items-center gap-1.5 shadow-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span>4K Multi-Diffusion Render</span>
              </div>

              {/* Wireframe / Latent Stage Comparison (Left Side, clipped by sliderPos) */}
              <div
                style={{ width: `${sliderPos}%` }}
                className="absolute inset-y-0 left-0 overflow-hidden border-r-2 border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)]"
              >
                <img
                  src={activePreset.imageSrc}
                  alt="Raw Latent Concept"
                  className="absolute inset-0 w-full h-full object-cover filter grayscale contrast-150 brightness-90"
                  style={{ width: '100%', minWidth: '100%' }}
                />

                {/* Cyberpunk Grid Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#2563eb15_1px,transparent_1px),linear-gradient(to_bottom,#2563eb15_1px,transparent_1px)] bg-[size:2rem_2rem] pointer-events-none" />

                {/* Top Left Latent Badge */}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-[10px] font-mono text-slate-300 border border-white/15 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span>Latent Input Concept</span>
                </div>
              </div>

              {/* Draggable Handle */}
              <div
                style={{ left: `${sliderPos}%` }}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-2xl cursor-ew-resize pointer-events-none border-2 border-blue-500"
              >
                <Sliders className="w-4 h-4 rotate-90 text-slate-900" />
              </div>
            </div>

            {/* Slider Drag Controller */}
            <div className="flex items-center gap-3 px-2">
              <span className="text-xs text-slate-400 font-mono">Drag to inspect:</span>
              <input
                type="range"
                min="10"
                max="90"
                value={sliderPos}
                onChange={(e) => setSliderPos(Number(e.target.value))}
                className="flex-1 accent-blue-600 h-1.5 bg-white/10 rounded-lg cursor-pointer"
              />
              <span className="text-xs text-blue-400 font-mono font-bold">{sliderPos}%</span>
            </div>

            {/* Prompt Card with Quick Copy */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">{activePreset.title}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/25">
                    {activePreset.model}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {activePreset.steps} • {activePreset.sampler}
                  </span>
                </div>
                <p className="text-xs text-slate-300 italic font-mono">
                  "{activePreset.prompt}"
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleCopyPrompt(activePreset.prompt, activePreset.id)}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-xs font-mono font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 border border-white/10 transition-colors"
                >
                  {copiedPromptId === activePreset.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-blue-400 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy Prompt</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() =>
                    setActiveModalItem({
                      id: activePreset.id,
                      title: activePreset.title,
                      prompt: activePreset.prompt,
                      model: activePreset.model,
                      src: activePreset.imageSrc,
                      resolution: activePreset.resolution,
                      type: 'image',
                    })
                  }
                  className="p-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white border border-white/10 transition-colors"
                  title="Fullscreen 4K Inspect"
                >
                  <Maximize2 className="w-4 h-4 text-blue-400" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 2: UNIVERSAL ASPECT RATIO PRESETS (CLEAN 2-COLOR)
           ══════════════════════════════════════════════════════════════════ */}
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center justify-center gap-2">
              <Ratio className="w-5 h-5 text-blue-400" />
              <span>Universal Framing & Aspect Ratios</span>
            </h3>
            <p className="text-xs text-slate-400">One-click dimension switching for any platform destination.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {RATIOS.map((r, i) => (
              <div
                key={i}
                onClick={() => setSelectedRatio(r)}
                className={`p-4 rounded-2xl glass-panel border cursor-pointer transition-all flex flex-col justify-between ${
                  selectedRatio.ratio === r.ratio
                    ? 'border-blue-500 bg-blue-950/25 shadow-lg shadow-blue-950/40 -translate-y-1'
                    : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-mono text-blue-400 font-bold">{r.ratio}</div>
                  {/* Proportional Aspect Box Visualizer */}
                  <div className="h-10 w-16 flex items-center justify-center rounded-lg bg-black/40 border border-white/10">
                    <div
                      className={`${r.boxW} ${r.boxH} rounded border-2 transition-colors ${
                        selectedRatio.ratio === r.ratio
                          ? 'border-blue-500 bg-blue-500/20'
                          : 'border-white/20 bg-white/[0.03]'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold text-white mb-0.5">{r.label}</div>
                  <div className="text-[10px] text-slate-400 leading-tight">{r.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 3: CURATED 4K AI IMAGE SHOWCASE GALLERY (100% PURE IMAGES)
           ══════════════════════════════════════════════════════════════════ */}
        <div id="studio-gallery" className="space-y-8 scroll-mt-24">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div className="space-y-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono text-blue-400 font-semibold">
                <Palette className="w-3.5 h-3.5" />
                <span>Production Image Gallery</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white">
                4K Photorealistic AI Image Library
              </h3>
              <p className="text-xs text-slate-400">
                12 ultra-high-resolution AI generations crafted across FLUX.1 Dev, Midjourney v6.1, DALL-E 3 HD, and SD 3.5.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-mono text-blue-300 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                <span>12 4K Renders</span>
              </span>
            </div>
          </div>

          {/* Pure 4K Image Grid (12 Items) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {AI_IMAGES.map((item) => (
              <StudioImageCard
                key={item.id}
                image={item}
                onCardClick={() => setActiveModalItem(item)}
                onCopyPrompt={handleCopyPrompt}
                isCopied={copiedPromptId === item.id}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 4: 4K FLOATING REEL (PAGES SEPARATED)
         ══════════════════════════════════════════════════════════════════ */}
      <div className="mt-20">
        <LandingFloatingVideosShowcase fixedMode="images" />
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          FULLSCREEN LIGHTBOX MODAL (CLEAN 2-COLOR MATTE)
         ══════════════════════════════════════════════════════════════════ */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl rounded-3xl bg-[#0c0f18] border border-white/15 shadow-2xl shadow-black overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#090b12]/95">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <h3 className="text-sm sm:text-base font-bold text-white truncate max-w-sm sm:max-w-md">
                  {activeModalItem.title}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.05] text-blue-300 border border-white/10">
                  {activeModalItem.model}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {activeModalItem.type === 'video' && (
                  <button
                    onClick={() => setIsModalMuted(!isModalMuted)}
                    className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                    title={isModalMuted ? 'Unmute Audio' : 'Mute Audio'}
                  >
                    {isModalMuted ? (
                      <VolumeX className="w-4 h-4 text-slate-400" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-blue-400" />
                    )}
                  </button>
                )}

                <button
                  onClick={() => setActiveModalItem(null)}
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  title="Close Modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Media Body */}
            <div className="p-5 space-y-4 overflow-y-auto">
              {activeModalItem.type === 'video' ? (
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/10 shadow-inner flex items-center justify-center">
                  <video
                    src={activeModalItem.src}
                    autoPlay
                    loop
                    muted={isModalMuted}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="relative w-full rounded-2xl overflow-hidden bg-[#07090e] border border-white/10 shadow-inner flex items-center justify-center p-3 sm:p-4 min-h-[350px] max-h-[64vh]">
                  {/* Subtle blurred ambient backdrop to eliminate empty black void */}
                  <div
                    className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-25 scale-125 pointer-events-none"
                    style={{ backgroundImage: `url(${activeModalItem.src})` }}
                  />
                  <img
                    src={activeModalItem.src}
                    alt={activeModalItem.title}
                    className="relative max-h-[58vh] w-auto max-w-full rounded-xl object-contain shadow-2xl z-10 border border-white/10"
                  />
                </div>
              )}

              {/* Prompt Box */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono flex items-center gap-1.5 text-blue-300">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Exact Synthesis Prompt</span>
                  </span>

                  <button
                    onClick={() => handleCopyPrompt(activeModalItem.prompt, activeModalItem.id)}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-[11px] font-mono text-white flex items-center gap-1 transition-colors"
                  >
                    {copiedPromptId === activeModalItem.id ? (
                      <>
                        <Check className="w-3 h-3 text-blue-400" />
                        <span className="text-blue-400 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-300" />
                        <span>Copy Prompt</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs sm:text-sm text-slate-200 font-mono leading-relaxed bg-black/40 p-3 rounded-xl border border-white/5 select-text">
                  {activeModalItem.prompt}
                </p>
              </div>

              {/* Technical Specifications Grid (2-Color Clean) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="text-[10px] font-mono text-slate-400">Generation Type</div>
                  <div className="text-xs font-bold text-white capitalize">
                    {activeModalItem.type === 'image' ? '4K AI Image' : '60FPS Motion Video'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="text-[10px] font-mono text-slate-400">Diffusion Model</div>
                  <div className="text-xs font-bold text-blue-300 truncate">
                    {activeModalItem.model}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="text-[10px] font-mono text-slate-400">Resolution</div>
                  <div className="text-xs font-bold text-blue-300">
                    {activeModalItem.resolution || '3840 × 2160 UHD'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="text-[10px] font-mono text-slate-400">Color Pipeline</div>
                  <div className="text-xs font-bold text-slate-200">DCI-P3 10-bit</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10">
                <a
                  href={activeModalItem.src}
                  download={activeModalItem.fileName || `${activeModalItem.id}.${activeModalItem.type === 'image' ? 'jpg' : 'mp4'}`}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span>Download Full Resolution</span>
                </a>

                <button
                  onClick={() => {
                    setActiveModalItem(null);
                    setShowAuthModal(true);
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                  <span>Generate Similar in Studio</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Media Studio Auth Modal */}
      <LoginGateModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="NetRoot Multi-Diffusion Media Studio"
        subtitle="Create an account or sign in to generate photorealistic imagery, 3D assets, and high-definition studio motion video."
        badge="Media Studio • Sign In Required"
        feature="media"
        redirectUrl={`${APP_URL}/login?redirect=/media-studio`}
      />
    </div>
  );
}
