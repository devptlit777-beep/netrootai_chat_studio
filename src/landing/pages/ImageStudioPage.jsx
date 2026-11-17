import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Image as ImageIcon,
  Sparkles,
  Sliders,
  ArrowRight,
  Eye,
  Copy,
  Check,
  X,
  Cpu,
  Layers,
  ChevronRight,
  Zap,
  Palette,
  Maximize2
} from 'lucide-react';
import LoginGateModal from '../components/common/LoginGateModal';

const APP_URL = '';

// ── 7 Signature Image Models with Custom Showcase Artworks (fal.ai Style) ──
const FEATURED_MODELS = [
  {
    id: 'flux-1',
    name: 'FLUX.1 Pro',
    tagline: 'Black Forest Labs Frontier Generative Model',
    tags: ['text-to-image', 'stylized', 'High Resolution', 'photoreal'],
    desc: 'FLUX.1 Pro is the world-leading diffusion model for photorealistic human portraits, cinematic lighting, complex raytraced reflections, and flawless text rendering in sub-2 seconds.',
    latency: '⚡ 1.6s',
    resolution: 'High Resolution (3840×2160)',
    heroImage: '/images/image1_26f1c759.jpg?v=clean2',
    prompt: 'Hyper-detailed cybernetic android portrait, subsurface scattering, iridescent titanium conduits, studio softbox lighting.',
  },
  {
    id: 'midjourney-6',
    name: 'Midjourney v6.1',
    tagline: 'Artistic & Architectural Gold Standard',
    tags: ['photorealistic', 'stylized', 'High Resolution', 'architecture'],
    desc: 'Unrivaled artistic composition, realistic atmospheric haze, organic materials, and dramatic volumetric lighting trusted by concept artists and architects worldwide.',
    latency: '⚡ 2.8s',
    resolution: 'High Resolution (3840×2160)',
    heroImage: '/images/image2_8e32b66f.jpg?v=clean2',
    prompt: 'Parametric organic architecture in golden hour sand dunes, floor-to-ceiling reflective glass, cinematic ray tracing.',
  },
  {
    id: 'imagen-3',
    name: 'Google Imagen 3',
    tagline: 'DeepMind Precision & Micro-Detail Synthesis',
    tags: ['photorealism', 'micro-detail', 'High Resolution', 'macro'],
    desc: 'Google DeepMind’s highest-quality image generation model, generating rich textures, vivid natural colors, and precise prompt adherence without synthetic artifacts.',
    latency: '⚡ 1.9s',
    resolution: 'High Resolution (3840×2160)',
    heroImage: '/images/image3_ab155cfe.jpg?v=clean2',
    prompt: 'Macro photograph of glowing bioluminescent alien flora, micro water droplets, neon chromatic bokeh.',
  },
  {
    id: 'dalle-3',
    name: 'OpenAI DALL-E 3 HD',
    tagline: 'Natural Language Nuance & Crystal Geometry',
    tags: ['prompt-faithful', 'crystal-sharp', 'High Resolution'],
    desc: 'Understands intricate descriptive nuances natively without prompt engineering, turning elaborate conceptual prompts into crystal-sharp high-definition visuals.',
    latency: '⚡ 2.4s',
    resolution: 'High Resolution (3840×2160)',
    heroImage: '/images/image4_31bbb3bd.jpg?v=clean2',
    prompt: 'Prismatic crystal geode refractions on dark obsidian stone, studio macro lens, caustic volumetric lighting.',
  },
  {
    id: 'sd-35',
    name: 'SD 3.5 Large',
    tagline: 'Stability AI Multimodal Diffusion Transformer',
    tags: ['open-weights', 'cinematic-scale', 'High Resolution'],
    desc: 'A massive 8B parameter diffusion transformer designed for expansive cinematic scenes, complex multi-subject interactions, and rich mythical landscapes.',
    latency: '⚡ 2.1s',
    resolution: 'High Resolution (3840×2160)',
    heroImage: '/images/image5_744e27cf.jpg?v=clean2',
    prompt: 'Mythic red dragon unleashing incandescent flame storm over gothic coastal fortress, dramatic thunder lightning, photorealistic storm clouds.',
  },
  {
    id: 'ideogram-2',
    name: 'Ideogram v2',
    tagline: 'Flawless Typography & Graphic Layouts',
    tags: ['typography', 'graphic-design', 'High Resolution'],
    desc: 'The undisputed champion for rendering legible typography, logos, and graphic layouts directly inside generated visual compositions.',
    latency: '⚡ 1.7s',
    resolution: 'High Resolution (3840×2160)',
    heroImage: '/images/image8_bce62bd4.jpg?v=clean2',
    prompt: 'Atmospheric street photography of rainy neon-lit alley in Neo-Tokyo, steam rising from grates, vibrant reflections.',
  },
  {
    id: 'recraft-3',
    name: 'Recraft v3',
    tagline: 'Vector & 3D Industrial Asset Synthesis',
    tags: ['vector-ready', '3d-surfaces', 'High Resolution'],
    desc: 'Specialized in clean vector styles, 3D icon sets, packaging renders, and brand imagery with fine-grained color palette and brand control.',
    latency: '⚡ 1.5s',
    resolution: 'High Resolution (3840×2160)',
    heroImage: '/images/image7_abc071bc.jpg?v=clean2',
    prompt: 'Liquid chrome mercury sculpture suspended in zero gravity, studio reflective lighting, monochrome high contrast.',
  },
];

// ── 12 Curated Real 4K AI Images from NetRoot Library ──
export const CURATED_IMAGES = [
  {
    id: 'img-1',
    fileName: 'image1_26f1c759.jpg',
    src: '/images/image1_26f1c759.jpg?v=clean2',
    title: 'Cybernetic Titanium Android',
    prompt: 'Hyper-detailed cybernetic android portrait, subsurface scattering, iridescent titanium conduits, studio softbox lighting.',
    model: 'FLUX.1 Pro',
    category: 'Photorealistic',
    resolution: 'High Resolution (3840×2160)',
  },
  {
    id: 'img-2',
    fileName: 'image2_8e32b66f.jpg',
    src: '/images/image2_8e32b66f.jpg?v=clean2',
    title: 'Desert Parametric Glass Pavilion',
    prompt: 'Parametric organic architecture in golden hour sand dunes, floor-to-ceiling reflective glass, cinematic ray tracing.',
    model: 'Midjourney v6.1',
    category: 'Architecture',
    resolution: 'High Resolution (3840×2160)',
  },
  {
    id: 'img-3',
    fileName: 'image3_ab155cfe.jpg',
    src: '/images/image3_ab155cfe.jpg?v=clean2',
    title: 'Bioluminescent Alien Flora Macro',
    prompt: 'Macro photograph of glowing bioluminescent alien flora, micro water droplets, neon chromatic bokeh.',
    model: 'Google Imagen 3',
    category: 'Macro & Nature',
    resolution: 'High Resolution (3840×2160)',
  },
  {
    id: 'img-4',
    fileName: 'image4_31bbb3bd.jpg',
    src: '/images/image4_31bbb3bd.jpg?v=clean2',
    title: 'Prismatic Crystal Mineral Geode',
    prompt: 'Prismatic crystal geode refractions on dark obsidian stone, studio macro lens, caustic volumetric lighting.',
    model: 'DALL-E 3 HD',
    category: 'Macro & Nature',
    resolution: 'High Resolution (3840×2160)',
  },
  {
    id: 'img-5',
    fileName: 'image5_744e27cf.jpg',
    src: '/images/image5_744e27cf.jpg?v=clean2',
    title: 'Mythic Fire-Breathing Cliff Dragon',
    prompt: 'Mythic red dragon unleashing incandescent flame storm over gothic coastal fortress, dramatic thunder lightning, photorealistic storm clouds.',
    model: 'SD 3.5 Large',
    category: 'Digital Art',
    resolution: 'High Resolution (3840×2160)',
  },
  {
    id: 'img-6',
    fileName: 'image6_4d682ece.jpg',
    src: '/images/image6_4d682ece.jpg?v=clean2',
    title: 'Deep Space Planetary Orbital Station',
    prompt: 'Gigantic space station orbiting a ringed gas giant, solar panel reflections, hard directional cosmic sunlight.',
    model: 'FLUX.1 Pro',
    category: 'Sci-Fi & Cyberpunk',
    resolution: 'High Resolution (3840×2160)',
  },
  {
    id: 'img-7',
    fileName: 'image7_abc071bc.jpg',
    src: '/images/image7_abc071bc.jpg?v=clean2',
    title: 'Zero-G Liquid Chrome Mercury',
    prompt: 'Liquid chrome mercury sculpture suspended in zero gravity, studio reflective lighting, monochrome high contrast.',
    model: 'Recraft v3',
    category: 'Digital Art',
    resolution: 'High Resolution (3840×2160)',
  },
  {
    id: 'img-8',
    fileName: 'image8_bce62bd4.jpg',
    src: '/images/image8_bce62bd4.jpg?v=clean2',
    title: 'Neo-Tokyo Rainy Neon Alley',
    prompt: 'Atmospheric street photography of rainy neon-lit alley in Neo-Tokyo, steam rising from grates, vibrant reflections.',
    model: 'Ideogram v2',
    category: 'Sci-Fi & Cyberpunk',
    resolution: 'High Resolution (3840×2160)',
  },
  {
    id: 'img-9',
    fileName: 'image9_2aa6de9a.jpg',
    src: '/images/image9_2aa6de9a.jpg?v=clean2',
    title: 'Quantum Computing Golden Synapse',
    prompt: 'Extreme macro of quantum optical circuit, glowing gold interconnects, microscopic sapphire substrate.',
    model: 'FLUX.1 Pro',
    category: 'Sci-Fi & Cyberpunk',
    resolution: 'High Resolution (3840×2160)',
  },
  {
    id: 'img-10',
    fileName: 'image10_b9485823.jpg',
    src: '/images/image10_b9485823.jpg?v=clean2',
    title: 'Autumn Mountain Zen Temple',
    prompt: 'Traditional Japanese wooden pagoda surrounded by fiery red maple trees, morning mountain mist, serene koi pond reflection.',
    model: 'Midjourney v6.1',
    category: 'Architecture',
    resolution: 'High Resolution (3840×2160)',
  },
  {
    id: 'img-11',
    fileName: 'image11_0cf27274.jpg',
    src: '/images/image11_0cf27274.jpg?v=clean2',
    title: 'Cyberpunk Hypercar Neon Garage',
    prompt: 'Wide studio shot of matte carbon fiber hypercar in futuristic workshop, neon overhead light bars, wet glossy floor reflections.',
    model: 'DALL-E 3 HD',
    category: 'Sci-Fi & Cyberpunk',
    resolution: 'High Resolution (3840×2160)',
  },
  {
    id: 'img-12',
    fileName: 'image12_2c92ad7c.jpg',
    src: '/images/image12_2c92ad7c.jpg?v=clean2',
    title: 'Enchanted Twilight Redwood Canopy',
    prompt: 'Ancient misty redwood forest at twilight, volumetric god rays piercing the canopy, glowing bioluminescent spores.',
    model: 'Google Imagen 3',
    category: 'Macro & Nature',
    resolution: 'High Resolution (3840×2160)',
  },
];

const CATEGORIES = ['All Styles', 'Photorealistic', 'Sci-Fi & Cyberpunk', 'Architecture', 'Macro & Nature', 'Digital Art'];

export default function ImageStudioPage() {
  const [activeModelIndex, setActiveModelIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('All Styles');
  const [copiedPromptId, setCopiedPromptId] = useState(null);
  const [activeModalItem, setActiveModalItem] = useState(null);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLaunchStudio = () => {
    if (user) {
      navigate('/image-studio');
    } else {
      setShowAuthGate(true);
    }
  };
  const [sliderPos, setSliderPos] = useState(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);

  const activeModel = FEATURED_MODELS[activeModelIndex];

  const handleCopyPrompt = (promptText, id) => {
    navigator.clipboard.writeText(promptText);
    setCopiedPromptId(id);
    setTimeout(() => setCopiedPromptId(null), 2500);
  };

  const filteredImages = selectedCategory === 'All Styles'
    ? CURATED_IMAGES
    : CURATED_IMAGES.filter((img) => img.category === selectedCategory);

  // Drag logic for Latent Diffusion Slider
  const handleSliderMove = (e) => {
    if (!isDraggingSlider) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    if (!clientX) return;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(5, Math.min((x / rect.width) * 100, 95));
    setSliderPos(percent);
  };

  return (
    <div className="pt-20 pb-24 overflow-hidden bg-[#07080c] min-h-screen text-slate-200">
      
      {/* ── Top Announcement Banner (like fal.ai) ── */}
      <div className="w-full bg-blue-950/40 border-b border-blue-500/20 py-2 px-4 text-center">
        <Link
          to="/models"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-blue-300 hover:text-white transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Try FLUX.1 Pro & Midjourney v6.1 — High Resolution Diffusion Renders</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          1. HERO STAGE (FAL.AI INSPIRED MULTI-MODEL COMMAND CENTER)
         ══════════════════════════════════════════════════════════════════ */}
      <section className="relative w-full min-h-[560px] lg:min-h-[640px] flex items-center overflow-hidden border-b border-white/[0.08]">
        {/* Full-bleed Ambient Background Art */}
        <div className="absolute inset-0 w-full h-full overflow-hidden bg-black">
          <img
            key={activeModel.heroImage}
            src={activeModel.heroImage}
            alt={activeModel.name}
            className="w-full h-full object-cover filter brightness-[0.75] contrast-[1.1] scale-105 transition-all duration-700"
          />
        </div>

        {/* High-tech Gradient Overlays (fal.ai signature dark style) */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#07080c] via-[#07080c]/90 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#07080c] via-[#07080c]/70 to-transparent pointer-events-none" />

        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 flex flex-col justify-between h-full">
          
          <div className="max-w-2xl space-y-4">
            {/* Capability Badges above Title (like fal.ai) */}
            <div className="flex flex-wrap items-center gap-2">
              {activeModel.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-md bg-white/[0.08] backdrop-blur-md border border-white/10 text-[10px] font-mono text-blue-300 uppercase tracking-wider font-semibold"
                >
                  {tag}
                </span>
              ))}
              <span className="px-2.5 py-1 rounded-md bg-blue-600/30 border border-blue-500/40 text-[10px] font-mono text-white font-bold">
                {activeModel.latency}
              </span>
            </div>

            {/* Dynamic Model Title */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-none">
              {activeModel.name}
            </h1>

            <p className="text-sm font-mono text-blue-400 font-medium">
              {activeModel.tagline}
            </p>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
              {activeModel.desc}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={handleLaunchStudio}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs sm:text-sm shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Launch Image Studio</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Redirect to /models as requested! */}
              <Link
                to="/models"
                className="px-5 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white font-medium text-xs sm:text-sm flex items-center gap-2 transition-all hover:border-white/20"
              >
                <Cpu className="w-4 h-4 text-blue-400" />
                <span>Explore 450+ Models Catalog</span>
              </Link>
            </div>
          </div>

          {/* ── Signature fal.ai Bottom Model Switcher Tabs ── */}
          <div className="mt-8 pt-4 border-t border-white/10">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2.5 flex flex-wrap items-center justify-between gap-2">
              <span>Select Model Playground:</span>
              <span className="text-blue-400 font-semibold text-[10px]">Click to preview model render</span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {FEATURED_MODELS.map((m, idx) => (
                <button
                  key={m.id}
                  onClick={() => setActiveModelIndex(idx)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-mono font-medium transition-all shrink-0 flex items-center gap-2 ${
                    activeModelIndex === idx
                      ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30 border border-blue-400/50'
                      : 'bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] border border-white/10'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${activeModelIndex === idx ? 'bg-white' : 'bg-slate-400'}`} />
                  <span>{m.name}</span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          2. LATENT DIFFUSION FIDELITY SLIDER (SKETCH VS HIGH-RES)
         ══════════════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 pb-4 border-b border-white/[0.08]">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-blue-400 font-semibold uppercase tracking-wider mb-1">
              <Sliders className="w-3.5 h-3.5" />
              <span>Diffusion Process Reveal</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Latent Diffusion Fidelity Lens
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Drag the interactive slider to compare raw latent tensor concepts against final High Resolution renders.
            </p>
          </div>

          <Link
            to="/video-studio"
            className="text-xs font-mono text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors shrink-0"
          >
            <span>Switch to Video Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Interactive Comparison Slider */}
        <div
          onMouseDown={() => setIsDraggingSlider(true)}
          onMouseUp={() => setIsDraggingSlider(false)}
          onMouseLeave={() => setIsDraggingSlider(false)}
          onMouseMove={handleSliderMove}
          onTouchStart={() => setIsDraggingSlider(true)}
          onTouchEnd={() => setIsDraggingSlider(false)}
          onTouchMove={handleSliderMove}
          className="relative max-w-4xl mx-auto aspect-video rounded-3xl overflow-hidden select-none border border-white/10 shadow-2xl bg-black cursor-ew-resize"
        >
          {/* Right Side: High Resolution Final Render */}
          <img
            src={activeModel.heroImage}
            alt={activeModel.name}
            className="absolute inset-0 w-full h-full object-cover"
          />

          <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md text-[10px] font-mono text-blue-300 border border-blue-500/30 flex items-center gap-1.5 shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span>High Resolution Multi-Diffusion</span>
          </div>

          {/* Left Side: Latent Input Concept (Clipped) */}
          <div
            style={{ width: `${sliderPos}%` }}
            className="absolute inset-y-0 left-0 overflow-hidden border-r-2 border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.5)]"
          >
            <img
              src={activeModel.heroImage}
              alt="Raw Latent Stage"
              className="absolute inset-0 w-full h-full object-cover filter grayscale contrast-150 brightness-90"
              style={{ width: '100%', minWidth: '100%' }}
            />
            {/* Cyberpunk Grid Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#2563eb15_1px,transparent_1px),linear-gradient(to_bottom,#2563eb15_1px,transparent_1px)] bg-[size:2rem_2rem] pointer-events-none" />

            <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md text-[10px] font-mono text-slate-300 border border-white/15 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              <span>Latent Input Concept</span>
            </div>
          </div>

          {/* Draggable Divider Handle */}
          <div
            style={{ left: `${sliderPos}%` }}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-blue-600 text-white border-2 border-white/40 shadow-xl flex items-center justify-center pointer-events-none transition-transform active:scale-110"
          >
            <div className="flex gap-0.5">
              <span className="w-0.5 h-3 bg-white/80 rounded-full" />
              <span className="w-0.5 h-3 bg-white/80 rounded-full" />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          3. CURATED 12 HIGH RESOLUTION IMAGES GALLERY
         ══════════════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-blue-400 font-semibold uppercase tracking-wider mb-1">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>High Resolution Gallery</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Explore 12 Curated Masterpieces
            </h2>
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredImages.map((image) => (
            <div
              key={image.id}
              onClick={() => setActiveModalItem(image)}
              className="group rounded-2xl glass-panel border border-white/10 hover:border-blue-500/50 bg-[#0c0f18] overflow-hidden flex flex-col justify-between cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-blue-950/40 hover:-translate-y-1"
            >
              <div className="aspect-video w-full relative overflow-hidden bg-black/80">
                <img
                  src={image.src}
                  alt={image.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[9px] font-mono text-slate-200 border border-white/10">
                  {image.model}
                </div>

                <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-blue-600/80 backdrop-blur-md text-[9px] font-mono text-white font-semibold">
                  Full HD
                </div>
              </div>

              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>{image.title}</span>
                  <span className="text-[9px] font-mono text-blue-300 group-hover:underline">Inspect ↗</span>
                </div>
                <p className="text-[11px] text-slate-300 font-mono line-clamp-2 opacity-80 leading-relaxed italic">
                  "{image.prompt}"
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Global CTA Banner */}
        <div className="rounded-3xl p-8 sm:p-10 bg-[#0c0f18] border border-slate-800 text-center space-y-5 mt-16 mb-6">
          <h3 className="text-xl sm:text-3xl font-extrabold text-white">
            Create Studio-Grade High Resolution Artworks
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
            Generate photorealistic portraits, cinematic fantasy scenes, and vector graphics with one unified API and workspace.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setShowAuthGate(true)}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs sm:text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all"
            >
              <span>Launch Image Studio Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <Link
              to="/models"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all"
            >
              <span>Explore All 450+ Models</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          4. FULLSCREEN IMAGE LIGHTBOX MODAL (NO DOWNLOAD BUTTON)
         ══════════════════════════════════════════════════════════════════ */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-2xl bg-[#0c0f18] border border-white/15 shadow-2xl shadow-black overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#0a0c14]/90">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <h3 className="text-xs sm:text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
                  {activeModalItem.title}
                </h3>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                  {activeModalItem.model}
                </span>
              </div>

              <button
                onClick={() => setActiveModalItem(null)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Media Body */}
            <div className="p-4 space-y-4 overflow-y-auto">
              <div className="relative w-full rounded-2xl overflow-hidden bg-[#07090e] border border-white/10 shadow-inner flex items-center justify-center p-2 min-h-[300px] max-h-[55vh]">
                <img
                  src={activeModalItem.src}
                  alt={activeModalItem.title}
                  className="relative max-h-[50vh] w-auto max-w-full rounded-lg object-contain shadow-2xl z-10"
                />
              </div>

              {/* Prompt Box with 1-Click Copy */}
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    AI Generation Prompt
                  </span>

                  <button
                    onClick={() => handleCopyPrompt(activeModalItem.prompt, activeModalItem.id)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 hover:text-white transition-all"
                  >
                    {copiedPromptId === activeModalItem.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-blue-300 font-semibold font-mono">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="font-mono">Copy Prompt</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-slate-200 font-mono leading-relaxed bg-[#08090f] p-3 rounded-lg border border-white/5 select-text">
                  {activeModalItem.prompt}
                </p>
              </div>
            </div>

            {/* Footer (NO DOWNLOAD BUTTON) */}
            <div className="px-4 py-3 border-t border-white/10 bg-[#0a0c14]/90 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-400 font-mono">
                {activeModalItem.resolution}
              </span>

              <button
                onClick={() => {
                  setActiveModalItem(null);
                  setShowAuthGate(true);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-sm shadow-blue-500/20 flex items-center gap-1.5 transition-all"
              >
                <span>Generate Similar in Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Gate Modal */}
      <LoginGateModal
        isOpen={showAuthGate}
        onClose={() => setShowAuthGate(false)}
        title="Unlock High Resolution Image Studio"
        subtitle="Sign in to generate photorealistic imagery with FLUX.1 Pro, Midjourney v6.1, and Google Imagen 3."
        badge="PRO IMAGE SUITE"
        feature="image"
        redirectUrl="/login?redirect=/image-studio"
      />
    </div>
  );
}
