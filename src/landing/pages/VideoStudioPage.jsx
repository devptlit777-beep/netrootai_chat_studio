import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Film,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  X,
  Volume2,
  VolumeX,
  Cpu,
  Layers,
  ChevronRight,
  Eye,
  Sliders,
  Maximize2
} from 'lucide-react';
import LoginGateModal from '../components/common/LoginGateModal';

const APP_URL = '';

// ── 8 Real 16:9 Landscape Videos (1280x720) from the NetRoot Library ──
export const LANDSCAPE_VIDEOS = [
  {
    id: 'l-vid-18',
    fileName: 'video18_f3e5f2cf.mp4',
    src: '/videos/video18_f3e5f2cf.mp4',
    title: 'Fighter Jets Low Desert Flight',
    prompt: 'Three fighter jets roar low over a woman on a desert plateau, releasing twin plumes of vibrant orange and cyan smoke, cinematic 35mm lens, golden hour haze.',
    model: 'Google Veo 2',
    resolution: 'Full HD 1080p',
    ratio: '16:9 Landscape',
    fps: '60 FPS',
    duration: '10s',
    category: 'Cinematic Action',
  },
  {
    id: 'l-vid-7',
    fileName: 'video7_0c3f1aac.mp4',
    src: '/videos/video7_0c3f1aac.mp4',
    title: 'Solar Nebula Planetary Ring Orbit',
    prompt: 'Hyper-detailed planetary system flyby, asteroid ring belt scattering cosmic starlight, deep interstellar void, photorealistic raytraced celestial shadows.',
    model: 'Kling 4.0 Pro',
    resolution: 'Full HD 1080p',
    ratio: '16:9 Landscape',
    fps: '60 FPS',
    duration: '8s',
    category: 'Sci-Fi Cosmos',
  },
  {
    id: 'l-vid-8',
    fileName: 'video8_f1b95ebd.mp4',
    src: '/videos/video8_f1b95ebd.mp4',
    title: 'Ethereal Forest Spore Motion',
    prompt: 'Ancient misty redwood forest at twilight, floating glowing spores dancing around moss-covered roots, volumetric atmospheric fog, slow steady-cam push in.',
    model: 'Runway Gen-3 Alpha',
    resolution: 'Full HD 1080p',
    ratio: '16:9 Landscape',
    fps: '60 FPS',
    duration: '10s',
    category: 'Atmospheric Nature',
  },
  {
    id: 'l-vid-9',
    fileName: 'video9_f550563b.mp4',
    src: '/videos/video9_f550563b.mp4',
    title: 'Autonomous Hypercar Highway Run',
    prompt: 'Autonomous electric hypercar speeding across elevated neon highway, motion blur and reflective road tarmac, wet asphalt reflections, wide anamorphic angle.',
    model: 'OpenAI Sora Cinema',
    resolution: 'Full HD 1080p',
    ratio: '16:9 Landscape',
    fps: '60 FPS',
    duration: '12s',
    category: 'Automotive Speed',
  },
  {
    id: 'l-vid-10',
    fileName: 'video10_983dd0fd.mp4',
    src: '/videos/video10_983dd0fd.mp4',
    title: 'Futuristic Maglev Transit Hub',
    prompt: 'Ultra-modern glass terminal overlooking magnetic levitation bullet trains departing during sunset, architectural reflections, realistic human silhouettes.',
    model: 'Luma Dream Ray 2',
    resolution: 'Full HD 1080p',
    ratio: '16:9 Landscape',
    fps: '60 FPS',
    duration: '8s',
    category: 'Architecture',
  },
  {
    id: 'l-vid-11',
    fileName: 'video11_4b2976ac.mp4',
    src: '/videos/video11_4b2976ac.mp4',
    title: 'Glacial Aurora Borealis Flight',
    prompt: 'Cinematic FPV drone sweeping over sharp Arctic glacier crevasses under emerald green aurora borealis, reflective sea ice, crisp crisp arctic chill.',
    model: 'Wan 2.1 Studio',
    resolution: 'Full HD 1080p',
    ratio: '16:9 Landscape',
    fps: '60 FPS',
    duration: '10s',
    category: 'Atmospheric Nature',
  },
  {
    id: 'l-vid-12',
    fileName: 'video12_153c1514.mp4',
    src: '/videos/video12_153c1514.mp4',
    title: 'Volcanic Lava Flow Surge',
    prompt: 'Extreme close up of molten incandescent basalt lava crust fracturing and spilling into sea foam, steam billows, macro thermal refraction.',
    model: 'Hailuo AI MiniMax',
    resolution: 'Full HD 1080p',
    ratio: '16:9 Landscape',
    fps: '60 FPS',
    duration: '7s',
    category: 'Cinematic Nature',
  },
  {
    id: 'l-vid-19',
    fileName: 'video19_e6160789.mp4',
    src: '/videos/video19_e6160789.mp4',
    title: 'Deep Ocean Bioluminescent Trench',
    prompt: 'Submersible spotlight illuminating translucent abyssal jellyfish with rhythmic pulsating cilia, particle backscatter, deep ocean blue gradient.',
    model: 'CogVideoX High-Def',
    resolution: 'Full HD 1080p',
    ratio: '16:9 Landscape',
    fps: '60 FPS',
    duration: '8s',
    category: 'Underwater Macro',
  },
];

// ── 11 Real 9:16 Portrait Reels (720x1280) from the NetRoot Library ──
export const PORTRAIT_VIDEOS = [
  {
    id: 'p-vid-1',
    fileName: 'video1_4feda0c6.mp4',
    src: '/videos/video1_4feda0c6.mp4',
    title: 'Neon Tokyo Rain Strut',
    prompt: 'Vertical portrait of high-fashion cybernetic model standing in rain-drenched Neo Tokyo street, neon sign reflections on wet silk trench coat, 85mm lens portrait.',
    model: 'Google Veo 2',
    resolution: 'Full HD 1080p',
    ratio: '9:16 Portrait Reel',
    fps: '60 FPS',
    duration: '10s',
    category: 'Fashion & Character',
  },
  {
    id: 'p-vid-2',
    fileName: 'video2_ffbd9471.mp4',
    src: '/videos/video2_ffbd9471.mp4',
    title: 'Bioluminescent Coral Bloom',
    prompt: 'Vertical macro tracking shot of neon polyps pulsing underwater, iridescent sea tendrils, floating marine dust particles, ultra-shallow depth of field.',
    model: 'Runway Gen-3 Alpha',
    resolution: 'Full HD 1080p',
    ratio: '9:16 Portrait Reel',
    fps: '60 FPS',
    duration: '9s',
    category: 'Nature Reel',
  },
  {
    id: 'p-vid-3',
    fileName: 'video3_bc0cbd56.mp4',
    src: '/videos/video3_bc0cbd56.mp4',
    title: 'Quantum Synaptic Neural Burst',
    prompt: 'Vertical microscopic zoom into synthetic brain synapse firing glowing gold electrical dendrites, quantum computing visual concept.',
    model: 'Luma Ray 2',
    resolution: 'Full HD 1080p',
    ratio: '9:16 Portrait Reel',
    fps: '60 FPS',
    duration: '8s',
    category: 'Sci-Fi Abstract',
  },
  {
    id: 'p-vid-4',
    fileName: 'video4_fb64c5c6.mp4',
    src: '/videos/video4_fb64c5c6.mp4',
    title: 'Exoskeleton Robot Welding',
    prompt: 'Vertical industrial camera angle of automated titanium robotic hand welding precision joints, realistic orange spark showers bouncing off steel floor.',
    model: 'Kling 4.0 Pro',
    resolution: 'Full HD 1080p',
    ratio: '9:16 Portrait Reel',
    fps: '60 FPS',
    duration: '10s',
    category: 'Robotics',
  },
  {
    id: 'p-vid-5',
    fileName: 'video5_075c20e4.mp4',
    src: '/videos/video5_075c20e4.mp4',
    title: 'Golden Desert Dune Sunset',
    prompt: 'Vertical slow crane down revealing lone traveler overlooking cascading wind-swept sand ridges in the Sahara, warm atmospheric sunset glow.',
    model: 'OpenAI Sora',
    resolution: 'Full HD 1080p',
    ratio: '9:16 Portrait Reel',
    fps: '60 FPS',
    duration: '11s',
    category: 'Cinematic Reel',
  },
  {
    id: 'p-vid-6',
    fileName: 'video6_ff044ec9.mp4',
    src: '/videos/video6_ff044ec9.mp4',
    title: 'Chrome Liquid Mercury Morph',
    prompt: 'Vertical studio render of floating zero-gravity liquid chrome morphing into intricate geometric helix structures, monochrome studio softbox highlights.',
    model: 'Wan 2.1 Studio',
    resolution: 'Full HD 1080p',
    ratio: '9:16 Portrait Reel',
    fps: '60 FPS',
    duration: '8s',
    category: '3D Art Motion',
  },
  {
    id: 'p-vid-13',
    fileName: 'video13_14691bff.mp4',
    src: '/videos/video13_14691bff.mp4',
    title: 'Cyberpunk Alleyway Hoverbike',
    prompt: 'Vertical tracking shot behind futuristic hoverbike gliding over misty steam grates in crowded futuristic Asian night market, vibrant red lanterns.',
    model: 'Hailuo AI MiniMax',
    resolution: 'Full HD 1080p',
    ratio: '9:16 Portrait Reel',
    fps: '60 FPS',
    duration: '9s',
    category: 'Cyberpunk Action',
  },
  {
    id: 'p-vid-14',
    fileName: 'vidoe14_10f29f3d.mp4',
    src: '/videos/vidoe14_10f29f3d.mp4',
    title: 'Crystalline Mineral Fracture',
    prompt: 'Vertical macro timelapse of translucent amethyst geode crystals growing and reflecting prism rainbow caustics under dark studio lighting.',
    model: 'Google Veo 2',
    resolution: 'Full HD 1080p',
    ratio: '9:16 Portrait Reel',
    fps: '60 FPS',
    duration: '9s',
    category: 'Macro Crystal',
  },
  {
    id: 'p-vid-15',
    fileName: 'video15_5b960daa.mp4',
    src: '/videos/video15_5b960daa.mp4',
    title: 'High-Altitude Cloud Surge',
    prompt: 'Vertical time-lapse soaring through dense cumulonimbus thunderhead anvil with internal lightning strikes illuminating violet storm clouds.',
    model: 'Runway Gen-3 Alpha',
    resolution: 'Full HD 1080p',
    ratio: '9:16 Portrait Reel',
    fps: '60 FPS',
    duration: '12s',
    category: 'Storm Nature',
  },
  {
    id: 'p-vid-16',
    fileName: 'video16_ac61683e.mp4',
    src: '/videos/video16_ac61683e.mp4',
    title: 'Cybernetic Samurai Stance',
    prompt: 'Vertical full-body portrait of futuristic armored warrior drawing an energized plasma katana in misty bamboo forest, atmospheric rain drops.',
    model: 'Kling 4.0 Pro',
    resolution: 'Full HD 1080p',
    ratio: '9:16 Portrait Reel',
    fps: '60 FPS',
    duration: '10s',
    category: 'Character Reel',
  },
  {
    id: 'p-vid-17',
    fileName: 'video17_360c25a1.mp4',
    src: '/videos/video17_360c25a1.mp4',
    title: 'Infinite Cosmic Warp Tunnel',
    prompt: 'Vertical hypersonic hyperspace tunnel travel, streaks of starlight bending and refracting around event horizon singularity, hyper-fluid motion.',
    model: 'Luma Ray 2',
    resolution: 'Full HD 1080p',
    ratio: '9:16 Portrait Reel',
    fps: '60 FPS',
    duration: '11s',
    category: 'Hyperspace Sci-Fi',
  },
];

// Market AI Video Models Catalog
const MARKET_VIDEO_MODELS = [
  { name: 'Google Veo 2', provider: 'Google DeepMind', badge: 'Flagship Cinema', desc: 'Industry-leading prompt adherence, natural physics, and up to 30s coherent takes.' },
  { name: 'Kling 4.0 Pro', provider: 'Kuaishou AI', badge: 'Ultra Motion', desc: 'World-renowned for cinematic action choreography and high-speed motion consistency.' },
  { name: 'Runway Gen-3 Alpha', provider: 'RunwayML', badge: 'Director Controls', desc: 'Precision camera control (Pan, Zoom, Tilt, Roll) with expressive human emotion.' },
  { name: 'OpenAI Sora Cinema', provider: 'OpenAI', badge: '1080p Long-Form', desc: 'High resolution visual physics with complex multi-character scene composition.' },
  { name: 'Hailuo AI (MiniMax)', provider: 'MiniMax', badge: 'Hyper-Realistic', desc: 'Remarkable facial micro-expressions, hair physics, and fluid cloth simulation.' },
  { name: 'Luma Ray 2', provider: 'Luma Dream Machine', badge: 'Natural Lighting', desc: 'Rapid generation speed with camera movement paths and volumetric atmosphere.' },
];

export default function VideoStudioPage() {
  const [heroIndex, setHeroIndex] = useState(0);
  const [copiedPromptId, setCopiedPromptId] = useState(null);
  const [activeModalItem, setActiveModalItem] = useState(null);
  const [isModalMuted, setIsModalMuted] = useState(false);
  const [showAuthGate, setShowAuthGate] = useState(false);

  // Auto-advance to next model and landscape video when current video completes (or every 9 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % LANDSCAPE_VIDEOS.length);
    }, 9000);
    return () => clearInterval(timer);
  }, []);

  const handleHeroEnded = () => {
    setHeroIndex((prev) => (prev + 1) % LANDSCAPE_VIDEOS.length);
  };

  // Active video used as the full-bleed hero (Strictly 16:9 Landscape)
  const activeHero = LANDSCAPE_VIDEOS[heroIndex] || LANDSCAPE_VIDEOS[0];

  const handleCopyPrompt = (promptText, id) => {
    navigator.clipboard.writeText(promptText);
    setCopiedPromptId(id);
    setTimeout(() => setCopiedPromptId(null), 2500);
  };

  return (
    <div className="pt-20 pb-24 overflow-hidden bg-[#07080c] min-h-screen text-slate-200">
      
      {/* ══════════════════════════════════════════════════════════════════
          1. HERO STAGE (IDEA.AI INSPIRED FULL-BLEED AMBIENT CINEMA)
         ══════════════════════════════════════════════════════════════════ */}
      <section className="relative w-full min-h-[580px] lg:min-h-[660px] flex items-center overflow-hidden border-b border-white/[0.08]">
        {/* Full-bleed Ambient Background Video */}
        <div className="absolute inset-0 w-full h-full overflow-hidden bg-black">
          {/* Subtle CSS Crop: Scale 1.08 & Translate to hide left watermark cleanly */}
          <video
            key={activeHero.src}
            src={activeHero.src}
            autoPlay
            muted
            playsInline
            onEnded={handleHeroEnded}
            className="w-full h-full object-cover transform scale-105 translate-x-2 transition-all duration-700 filter brightness-[0.88] contrast-[1.05]"
          />
        </div>

        {/* Ambient Left & Bottom Gradients for crystal-clear text readability (like idea.ai) */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#07080c] via-[#07080c]/85 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#07080c] via-[#07080c]/60 to-transparent pointer-events-none" />

        {/* Hero Content Container */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col justify-between h-full">
          
          {/* Left Text Block */}
          <div className="max-w-2xl space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] backdrop-blur-md border border-white/10 text-xs font-mono text-slate-300">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span>{activeHero.model} • Full HD Video Generation</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.08]">
              Cinematic video.<br />
              <span className="text-blue-500">Up to 30 seconds.</span>
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-xl leading-relaxed">
              High resolution, film-grade motion, crisp text, and longer takes in a single generation. Tap into the world's most advanced video AI models.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setShowAuthGate(true)}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs sm:text-sm shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Launch Video Studio</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <Link
                to="/models"
                className="px-5 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white font-medium text-xs sm:text-sm flex items-center gap-2 transition-all hover:border-white/20"
              >
                <Cpu className="w-4 h-4 text-blue-400" />
                <span>Explore 450+ AI Models</span>
              </Link>
            </div>

            {/* Hero Video Quick-Switch Chips */}
            <div className="pt-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                Featured:
              </span>
              {LANDSCAPE_VIDEOS.map((v, idx) => (
                <button
                  key={v.id}
                  onClick={() => setHeroIndex(idx)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-all shrink-0 ${
                    heroIndex === idx
                      ? 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-600/40 border border-blue-400/40'
                      : 'bg-white/[0.04] text-slate-300 hover:text-white border border-white/10'
                  }`}
                >
                  {v.title.split(' ')[0]} {v.title.split(' ')[1]}
                </button>
              ))}
            </div>
          </div>

          {/* Right Bottom Floating Glass Prompt Pill */}
          <div className="mt-6 lg:mt-0 lg:absolute lg:bottom-8 lg:right-8 max-w-lg w-full">
            <div className="p-3.5 rounded-2xl bg-black/70 backdrop-blur-xl border border-white/15 shadow-2xl flex items-center justify-between gap-3 group hover:border-blue-500/40 transition-colors">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                  <Sparkles className="w-3 h-3 text-blue-400 shrink-0" />
                  <span className="text-white font-semibold">{activeHero.model}</span>
                  <span>•</span>
                  <span>Full HD 1080p</span>
                  <span>•</span>
                  <span>16:9 Landscape</span>
                </div>
                <p className="text-xs text-slate-200 line-clamp-1 font-mono italic">
                  "{activeHero.prompt}"
                </p>
              </div>

              <button
                onClick={() => handleCopyPrompt(activeHero.prompt, 'hero')}
                className="shrink-0 p-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-slate-200 hover:text-white transition-all text-xs flex items-center gap-1.5"
                title="Copy Prompt"
              >
                {copiedPromptId === 'hero' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-[10px] text-blue-300 font-mono">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-300" />
                    <span className="text-[10px] text-slate-300 font-mono hidden sm:inline">Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          2. IDEA.AI SIGNATURE HEADLINE & CONTINUOUS AUTO-PLAY STREAMS
         ══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 space-y-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Main Idea.ai Style Punchline */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 pb-6 border-b border-white/[0.08]">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono text-blue-400 font-semibold uppercase tracking-wider mb-1">
                <Film className="w-3.5 h-3.5" />
                <span>Endless Generation Showcase</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                The distance from idea to done is one sentence
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                All showcase clips play continuously in High Resolution Full HD. Click any clip to inspect full prompt and parameters.
              </p>
            </div>

            <Link
              to="/models"
              className="text-xs font-mono text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors shrink-0"
            >
              <span>Compare All Video Models</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* ── ROW 1: 16:9 LANDSCAPE CINEMA STREAM (Continuous Infinite Gliding Marquee) ── */}
        <div className="space-y-3">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <strong className="text-white">16:9 Landscape Cinema</strong> (YouTube, Displays, Keynotes)
            </span>
            <span className="text-[11px] font-mono text-slate-500">Auto-Gliding • Hover to Pause</span>
          </div>

          <div className="relative w-full overflow-hidden py-2 group/marquee">
            {/* Edge Fades */}
            <div className="absolute inset-y-0 left-0 w-12 sm:w-28 bg-gradient-to-r from-[#07080c] to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-12 sm:w-28 bg-gradient-to-l from-[#07080c] to-transparent z-10 pointer-events-none" />

            <div className="animate-video-marquee-forward flex gap-4 pl-4">
              {[...LANDSCAPE_VIDEOS, ...LANDSCAPE_VIDEOS].map((video, idx) => (
                <div
                  key={`${video.id}-${idx}`}
                  onClick={() => setActiveModalItem(video)}
                  className="group relative w-[280px] sm:w-[320px] md:w-[350px] aspect-video rounded-2xl overflow-hidden bg-[#0c0f18] border border-white/10 hover:border-blue-500 shadow-lg shadow-black/80 cursor-pointer shrink-0 transition-all duration-300 hover:scale-[1.03] hover:z-20"
                >
                  {/* CSS Crop to cleanly conceal left watermark */}
                  <div className="w-full h-full overflow-hidden relative">
                    <video
                      src={video.src}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover transform scale-108 translate-x-[3%]"
                    />
                  </div>

                  {/* Top Floating Badge */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
                    <span className="px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[9px] font-mono text-slate-200 border border-white/10">
                      {video.model}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-blue-600/80 backdrop-blur-md text-[9px] font-mono text-white font-semibold">
                      1080p Full HD
                    </span>
                  </div>

                  {/* Bottom Glass Drawer */}
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/95 via-black/70 to-transparent space-y-0.5 z-10">
                    <div className="text-xs font-bold text-white truncate flex items-center justify-between">
                      <span>{video.title}</span>
                      <span className="text-[9px] font-mono text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity">
                        Inspect ↗
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-300 font-mono line-clamp-1 opacity-80 italic">
                      "{video.prompt}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── ROW 2: 9:16 PORTRAIT REELS STREAM (Continuous Reverse Gliding Marquee) ── */}
        <div className="space-y-4 pt-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <strong className="text-white">9:16 Portrait Reels & Shorts</strong> (TikTok, Instagram, Mobile Feeds)
            </span>
            <span className="text-[11px] font-mono text-slate-500">Auto-Gliding • Hover to Pause</span>
          </div>

          <div className="relative w-full overflow-hidden py-2 group/marquee">
            {/* Edge Fades */}
            <div className="absolute inset-y-0 left-0 w-12 sm:w-28 bg-gradient-to-r from-[#07080c] to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-12 sm:w-28 bg-gradient-to-l from-[#07080c] to-transparent z-10 pointer-events-none" />

            <div className="animate-video-marquee-reverse flex gap-4 pl-4">
              {[...PORTRAIT_VIDEOS, ...PORTRAIT_VIDEOS].map((video, idx) => (
                <div
                  key={`${video.id}-${idx}`}
                  onClick={() => setActiveModalItem(video)}
                  className="group relative w-[170px] sm:w-[195px] md:w-[215px] aspect-[9/16] rounded-2xl overflow-hidden bg-[#0c0f18] border border-white/10 hover:border-blue-500 shadow-lg shadow-black/80 cursor-pointer shrink-0 transition-all duration-300 hover:scale-[1.03] hover:z-20"
                >
                  {/* CSS Crop to cleanly conceal bottom watermark */}
                  <div className="w-full h-full overflow-hidden relative">
                    <video
                      src={video.src}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover transform scale-108 origin-top"
                    />
                  </div>

                  {/* Top Badge */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
                    <span className="px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[8.5px] font-mono text-slate-200 border border-white/10 truncate max-w-[100px]">
                      {video.model}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md bg-black/75 text-[8.5px] font-mono text-blue-300 border border-white/10">
                      9:16
                    </span>
                  </div>

                  {/* Bottom Glass Drawer */}
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/95 via-black/80 to-transparent space-y-0.5 z-10">
                    <div className="text-[11px] font-bold text-white truncate flex items-center justify-between">
                      <span>{video.title}</span>
                    </div>
                    <p className="text-[9.5px] text-slate-300 font-mono line-clamp-2 opacity-80 italic">
                      "{video.prompt}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </section>

      {/* ══════════════════════════════════════════════════════════════════
          3. MARKET VIDEO MODELS HUB (DIRECT REDIRECT TO /MODELS)
         ══════════════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono text-blue-400 font-semibold uppercase tracking-wider">
            <Cpu className="w-3.5 h-3.5" />
            <span>State-of-the-Art Video Engines</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Access Every Leading AI Video Model
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Compare latency, pricing, and visual fidelity across the world's frontier video generation models.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {MARKET_VIDEO_MODELS.map((m) => (
            <div
              key={m.name}
              className="p-6 rounded-2xl glass-panel border border-white/10 bg-[#0c0f18]/90 flex flex-col justify-between space-y-4 hover:border-blue-500/40 transition-colors"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">{m.name}</span>
                  <span className="text-[10px] font-mono text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                    {m.badge}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-400">{m.provider}</div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {m.desc}
                </p>
              </div>

              {/* Redirect to /models as requested! */}
              <Link
                to="/models"
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 pt-3 border-t border-white/5 transition-colors"
              >
                <span>View Model Specs in Models Fleet</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>

        {/* Global CTA Banner */}
        <div className="rounded-3xl p-8 sm:p-10 bg-[#0c0f18] border border-slate-800 text-center space-y-5">
          <h3 className="text-xl sm:text-3xl font-extrabold text-white">
            Ready to Generate Full HD AI Videos?
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
            From single-sentence prompts to 60fps high-resolution takes, start creating in Netroot AI Video Studio today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setShowAuthGate(true)}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs sm:text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all"
            >
              <span>Launch Studio Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <Link
              to="/showcase/image"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all"
            >
              <span>Switch to Image Studio</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          4. FULLSCREEN VIDEO LIGHTBOX (NO DOWNLOAD BUTTON)
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

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsModalMuted(!isModalMuted)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                  title={isModalMuted ? 'Unmute' : 'Mute'}
                >
                  {isModalMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-blue-400" />}
                </button>

                <button
                  onClick={() => setActiveModalItem(null)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  title="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Media Body */}
            <div className="p-4 space-y-4 overflow-y-auto">
              <div className="relative w-full rounded-xl overflow-hidden bg-black border border-white/10 shadow-inner flex items-center justify-center">
                <video
                  src={activeModalItem.src}
                  autoPlay
                  loop
                  muted={isModalMuted}
                  controls
                  playsInline
                  className={`w-full ${activeModalItem.ratio.includes('9:16') ? 'max-h-[55vh] object-contain' : 'aspect-video object-cover'}`}
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
                {activeModalItem.resolution} • {activeModalItem.fps} • {activeModalItem.ratio}
              </span>

              <button
                onClick={() => {
                  setActiveModalItem(null);
                  setShowAuthGate(true);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-sm shadow-blue-500/20 flex items-center gap-1.5 transition-all"
              >
                <span>Generate with this Model</span>
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
        title="Unlock High Resolution Video Studio"
        subtitle="Sign in to generate cinematic videos with Google Veo 2, OpenAI Sora, and Kling 4.0."
        badge="PRO VIDEO SUITE"
        feature="video"
        redirectUrl={`${APP_URL}/login`}
      />
    </div>
  );
}
