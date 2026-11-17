import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Film,
  Play,
  Volume2,
  VolumeX,
  Copy,
  Check,
  X,
  ArrowRight,
  Sparkles,
  Zap,
  Image as ImageIcon,
  Layers,
} from 'lucide-react';
import LoginGateModal from '../common/LoginGateModal';

const APP_URL = '';

// ── 12 Real 4K AI-Generated Images from the User's Library ──
export const AI_IMAGES = [
  {
    id: 'img-1',
    fileName: 'image1_26f1c759.jpg',
    src: '/images/image1_26f1c759.jpg?v=clean2',
    title: 'Cybernetic Titanium Android',
    prompt: 'Hyper-detailed cybernetic android portrait, subsurface scattering, iridescent titanium conduits, studio softbox lighting.',
    model: 'FLUX.1 Schnell',
    resolution: '4K UHD',
    type: 'image',
  },
  {
    id: 'img-2',
    fileName: 'image2_8e32b66f.jpg',
    src: '/images/image2_8e32b66f.jpg?v=clean2',
    title: 'Desert Parametric Glass Pavilion',
    prompt: 'Parametric organic architecture in golden hour sand dunes, floor-to-ceiling reflective glass, cinematic ray tracing.',
    model: 'Midjourney v6.1',
    resolution: '4K UHD',
    type: 'image',
  },
  {
    id: 'img-3',
    fileName: 'image3_ab155cfe.jpg',
    src: '/images/image3_ab155cfe.jpg?v=clean2',
    title: 'Bioluminescent Alien Flora Macro',
    prompt: 'Macro photograph of glowing bioluminescent alien flora, micro water droplets, neon chromatic bokeh.',
    model: 'Ideogram v2',
    resolution: '4K UHD',
    type: 'image',
  },
  {
    id: 'img-4',
    fileName: 'image4_31bbb3bd.jpg',
    src: '/images/image4_31bbb3bd.jpg?v=clean2',
    title: 'Prismatic Crystal Mineral Geode',
    prompt: 'Prismatic crystal geode refractions on dark obsidian stone, studio macro lens, caustic volumetric lighting.',
    model: 'DALL-E 3 HD',
    resolution: '4K UHD',
    type: 'image',
  },
  {
    id: 'img-5',
    fileName: 'image5_744e27cf.jpg',
    src: '/images/image5_744e27cf.jpg?v=clean2',
    title: 'Mythic Fire-Breathing Cliff Dragon',
    prompt: 'Mythic red dragon unleashing incandescent flame storm over gothic coastal fortress, dramatic thunder lightning, photorealistic storm clouds.',
    model: 'SD 3.5 Large',
    resolution: '4K UHD',
    type: 'image',
  },
  {
    id: 'img-6',
    fileName: 'image6_4d682ece.jpg',
    src: '/images/image6_4d682ece.jpg?v=clean2',
    title: 'Deep Space Planetary Orbital Station',
    prompt: 'Gigantic space station orbiting a ringed gas giant, solar panel reflections, hard directional cosmic sunlight.',
    model: 'FLUX.1 Dev 4K',
    resolution: '4K UHD',
    type: 'image',
  },
  {
    id: 'img-7',
    fileName: 'image7_abc071bc.jpg',
    src: '/images/image7_abc071bc.jpg?v=clean2',
    title: 'Zero-G Liquid Chrome Mercury',
    prompt: 'Liquid chrome mercury sculpture suspended in zero gravity, studio reflective lighting, monochrome high contrast.',
    model: 'Recraft 20B',
    resolution: '4K UHD',
    type: 'image',
  },
  {
    id: 'img-8',
    fileName: 'image8_bce62bd4.jpg',
    src: '/images/image8_bce62bd4.jpg?v=clean2',
    title: 'Neo-Tokyo Rainy Neon Alley',
    prompt: 'Atmospheric street photography of rainy neon-lit alley in Neo-Tokyo, steam rising from grates, vibrant reflections.',
    model: 'Midjourney v6.1',
    resolution: '4K UHD',
    type: 'image',
  },
  {
    id: 'img-9',
    fileName: 'image9_2aa6de9a.jpg',
    src: '/images/image9_2aa6de9a.jpg?v=clean2',
    title: 'Obsidian Mythic Crystalline Dragon',
    prompt: 'Mythological crystalline creature carved from dark obsidian, glowing internal energy runes, cinematic depth of field.',
    model: 'FLUX.1 Schnell',
    resolution: '4K UHD',
    type: 'image',
  },
  {
    id: 'img-10',
    fileName: 'image10_b9485823.jpg',
    src: '/images/image10_b9485823.jpg?v=clean2',
    title: 'Alpine Peak Sunrise Cloud Inversion',
    prompt: 'Panoramic landscape of jagged alpine peaks rising above a sea of morning clouds, golden hour sunrise rim light.',
    model: 'SD 3.5 Large',
    resolution: '4K UHD',
    type: 'image',
  },
  {
    id: 'img-11',
    fileName: 'image11_0cf27274.jpg',
    src: '/images/image11_0cf27274.jpg?v=clean2',
    title: 'Volumetric Spatial Data Matrix',
    prompt: 'Volumetric 3D spatial computing wireframe with floating financial metrics, glowing cobalt blue glyphs.',
    model: 'FLUX.1 Dev 4K',
    resolution: '4K UHD',
    type: 'image',
  },
  {
    id: 'img-12',
    fileName: 'image12_2c92ad7c.jpg',
    src: '/images/image12_2c92ad7c.jpg?v=clean2',
    title: 'Enchanted Twilight Redwood Canopy',
    prompt: 'Ancient misty redwood forest at twilight, volumetric god rays piercing the canopy, glowing bioluminescent spores.',
    model: 'DALL-E 3 HD',
    resolution: '4K UHD',
    type: 'image',
  },
];

// ── 19 Real AI-Generated Videos from the User's Library ──
export const AI_VIDEOS = [
  {
    id: 'vid-1',
    fileName: 'video1_4feda0c6.mp4',
    src: '/videos/video1_4feda0c6.mp4',
    title: 'Cyberpunk Hyper-Speed Metropolis',
    prompt: 'Ultra-cinematic drone sweep over a neon-drenched Tokyo 2099 metropolis, volumetric rain reflections, 60fps fluid motion.',
    model: 'FLUX.1 Motion',
    fps: '60 FPS',
    resolution: '4K UHD',
    latency: '1.8s',
    type: 'video',
  },
  {
    id: 'vid-2',
    fileName: 'video2_ffbd9471.mp4',
    src: '/videos/video2_ffbd9471.mp4',
    title: 'Bioluminescent Oceanic Wonder',
    prompt: 'Deep abyssal oceanic dive, glowing jellyfish tendrils with chromatic refractions, macro underwater cinematography.',
    model: 'Runway Gen-3',
    fps: '60 FPS',
    resolution: '4K UHD',
    latency: '2.1s',
    type: 'video',
  },
  {
    id: 'vid-3',
    fileName: 'video3_bc0cbd56.mp4',
    src: '/videos/video3_bc0cbd56.mp4',
    title: 'Quantum Neural Particle Flow',
    prompt: 'Microscopic quantum energy weave, iridescent light particles swirling into artificial intelligence neural synapse.',
    model: 'Luma Dream',
    fps: '60 FPS',
    resolution: '4K UHD',
    latency: '1.9s',
    type: 'video',
  },
  {
    id: 'vid-4',
    fileName: 'video4_fb64c5c6.mp4',
    src: '/videos/video4_fb64c5c6.mp4',
    title: 'Autonomous Mech Engineering Rig',
    prompt: 'Futuristic mechanical assembly bay, robotic arms welding carbon-fiber exoskeleton with realistic orange sparks.',
    model: 'CogVideoX',
    fps: '60 FPS',
    resolution: '4K UHD',
    latency: '2.4s',
    type: 'video',
  },
  {
    id: 'vid-5',
    fileName: 'video5_075c20e4.mp4',
    src: '/videos/video5_075c20e4.mp4',
    title: 'Desert Parametric Glass Oasis',
    prompt: 'Aerial drone orbit around organic parametric curved glass pavilion in Dubai sand dunes, cinematic lens flare.',
    model: 'Sora Cinema',
    fps: '60 FPS',
    resolution: '4K UHD',
    latency: '2.0s',
    type: 'video',
  },
  {
    id: 'vid-6',
    fileName: 'video6_ff044ec9.mp4',
    src: '/videos/video6_ff044ec9.mp4',
    title: 'Fluid Obsidian Liquid Geometry',
    prompt: 'Zero-gravity floating chrome mercury droplets morphing into crystalline polygons with raytraced studio softboxes.',
    model: 'FLUX.1 Motion',
    fps: '60 FPS',
    resolution: '4K UHD',
    latency: '1.7s',
    type: 'video',
  },
  {
    id: 'vid-7',
    fileName: 'video7_0c3f1aac.mp4',
    src: '/videos/video7_0c3f1aac.mp4',
    title: 'Solar Nebula Planetary Ring Orbit',
    prompt: 'Hyper-detailed planetary system flyby, asteroid ring belt scattering cosmic starlight, deep interstellar void.',
    model: 'Kling 1.5 Pro',
    fps: '60 FPS',
    resolution: '4K UHD',
    latency: '2.2s',
    type: 'video',
  },
  {
    id: 'vid-8',
    fileName: 'video8_f1b95ebd.mp4',
    src: '/videos/video8_f1b95ebd.mp4',
    title: 'Ethereal Forest Spore Motion',
    prompt: 'Ancient misty redwood forest at twilight, floating glowing spores dancing around moss-covered roots.',
    model: 'Wan 2.1 4K',
    fps: '60 FPS',
    resolution: '4K UHD',
    latency: '2.3s',
    type: 'video',
  },
  {
    id: 'vid-9',
    fileName: 'video9_f550563b.mp4',
    src: '/videos/video9_f550563b.mp4',
    title: 'Autonomous Hypercar Speed Run',
    prompt: 'Autonomous electric hypercar speeding across elevated neon highway, motion blur and reflective road tarmac.',
    model: 'Runway Gen-3',
    fps: '60 FPS',
    resolution: '4K UHD',
    latency: '1.9s',
    type: 'video',
  },
  {
    id: 'vid-10',
    fileName: 'video10_983dd0fd.mp4',
    src: '/videos/video10_983dd0fd.mp4',
    title: 'Crystalline Geometric Unfurling',
    prompt: 'Prismatic crystal geode unfurling into geometric sacred patterns, subsurface scattering and refractive caustic light.',
    model: 'Luma Dream',
    fps: '60 FPS',
    resolution: '4K UHD',
    latency: '1.8s',
    type: 'video',
  },
  {
    id: 'vid-11',
    fileName: 'video11_4b2976ac.mp4',
    src: '/videos/video11_4b2976ac.mp4',
    title: 'Alpine Sunrise Cloud Inversion',
    prompt: 'FPV mountain ridge dive through cloud inversion at sunrise, sharp mountain peaks kissed by golden morning light.',
    model: 'Sora Cinema',
    fps: '60 FPS',
    resolution: '4K UHD',
    latency: '2.0s',
    type: 'video',
  },
  {
    id: 'vid-12',
    fileName: 'video12_153c1514.mp4',
    src: '/videos/video12_153c1514.mp4',
    title: 'Spatial Holographic Interface',
    prompt: 'Floating multi-layered spatial computing interface with interactive financial data telemetry and volumetric graphs.',
    model: 'FLUX.1 Motion',
    fps: '60 FPS',
    resolution: '4K UHD',
    latency: '1.6s',
    type: 'video',
  },
  {
    id: 'vid-13',
    fileName: 'video13_14691bff.mp4',
    src: '/videos/video13_14691bff.mp4',
    title: 'Volcanic Molten Basalt Flow',
    prompt: 'Close cinematic macro tracking of incandescent molten magma cooling into black basalt rock, glowing heat distortion.',
    model: 'CogVideoX',
    fps: '60 FPS',
    resolution: '4K UHD',
    latency: '2.5s',
    type: 'video',
  },
  {
    id: 'vid-14',
    fileName: 'vidoe14_10f29f3d.mp4',
    src: '/videos/vidoe14_10f29f3d.mp4',
    title: 'Zero-G Orbital Flora Blossom',
    prompt: 'Time-lapse of alien bioluminescent orchid blossoming in orbital glass terrarium, pollen glowing under ultraviolet.',
    model: 'Wan 2.1 4K',
    fps: '60 FPS',
    resolution: '4K UHD',
    latency: '2.2s',
    type: 'video',
  },
  {
    id: 'vid-15',
    fileName: 'video15_5b960daa.mp4',
    src: '/videos/video15_5b960daa.mp4',
    title: 'Deep Space Energy Core Pulsar',
    prompt: 'Orbital energy generator generating rhythmic gravitational pulses, space dust bending around event horizon.',
    model: 'Kling 1.5 Pro',
    fps: '60 FPS',
    resolution: '4K UHD',
    latency: '2.4s',
    type: 'video',
  },
  {
    id: 'vid-16',
    fileName: 'video16_ac61683e.mp4',
    src: '/videos/video16_ac61683e.mp4',
    title: 'Cybernetic Synthetic Portrait',
    prompt: 'Studio portrait of synthetic human with exposed fiber-optic neck conduits, ocular sensor focusing with blue laser ring.',
    model: 'Runway Gen-3',
    fps: '60 FPS',
    resolution: '4K UHD',
    latency: '1.9s',
    type: 'video',
  },
  {
    id: 'vid-17',
    fileName: 'video17_360c25a1.mp4',
    src: '/videos/video17_360c25a1.mp4',
    title: 'Supercell Storm Northern Lights',
    prompt: 'Supercell lightning storm swirling under radiant auroral lights over Scandinavian archipelago.',
    model: 'Sora Cinema',
    fps: '60 FPS',
    resolution: '4K UHD',
    latency: '2.1s',
    type: 'video',
  },
  {
    id: 'vid-18',
    fileName: 'video18_f3e5f2cf.mp4',
    src: '/videos/video18_f3e5f2cf.mp4',
    title: 'Parametric Spiral Architecture',
    prompt: 'Slow upward spiraling crane shot inside futuristic museum atrium with sweeping concrete curves and skylight shadows.',
    model: 'Luma Dream',
    fps: '60 FPS',
    resolution: '4K UHD',
    latency: '2.0s',
    type: 'video',
  },
  {
    id: 'vid-19',
    fileName: 'video19_e6160789.mp4',
    src: '/videos/video19_e6160789.mp4',
    title: 'Iridescent Quantum Silk Waves',
    prompt: 'Silk nano-mesh fabric billowing in zero-gravity wind tunnel, holographic rainbow color shift on matte obsidian void.',
    model: 'FLUX.1 Motion',
    fps: '60 FPS',
    resolution: '4K UHD',
    latency: '1.7s',
    type: 'video',
  },
];

const FLOAT_CLASSES = ['animate-orbit-1', 'animate-orbit-2', 'animate-orbit-3', 'animate-orbit-4'];

export default function LandingFloatingVideosShowcase({ fixedMode = 'videos' }) {
  const [activeModalItem, setActiveModalItem] = useState(null);
  const [copiedPromptId, setCopiedPromptId] = useState(null);
  const [isModalMuted, setIsModalMuted] = useState(true);
  const [showAuthGate, setShowAuthGate] = useState(false);

  const handleCopyPrompt = (promptText, id) => {
    navigator.clipboard?.writeText(promptText);
    setCopiedPromptId(id);
    setTimeout(() => setCopiedPromptId(null), 2000);
  };

  // ── Step 2: Clean Page-Level Separation ──
  // Homepage floats 100% 60FPS Videos across both lines
  // Media Studio floats 100% 4K Images across both lines
  const isVideoMode = fixedMode === 'videos';
  const row1Items = isVideoMode ? AI_VIDEOS.slice(0, 10) : AI_IMAGES.slice(0, 6);
  const row2Items = isVideoMode ? AI_VIDEOS.slice(10, 19) : AI_IMAGES.slice(6, 12);

  return (
    <section className="py-8 sm:py-10 relative overflow-hidden isolate select-none border-y border-white/[0.05] bg-[#090a0f]">
      {/* ── Compact & Focused Header ── */}
      <div className="flex flex-col items-center justify-center text-center px-4 mb-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/10 text-[11px] font-medium text-slate-300 shadow-sm mb-2.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>
            {isVideoMode
              ? '60FPS Cinematic Motion Video Reel'
              : '4K AI Image Studio Showcase'}
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-blue-300 font-mono text-[10px]">
            {isVideoMode ? '19 Motion Clips' : '12 4K Renders'}
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-blue-400 font-mono text-[10px]">
            {isVideoMode ? 'Hover to Play' : 'Click to Inspect'}
          </span>
        </div>

        <div className="text-xs text-slate-400 max-w-xl mx-auto flex flex-wrap items-center justify-center gap-2">
          <span>
            {isVideoMode
              ? 'Move cursor over any clip to stream in 60FPS.'
              : 'Click any card to inspect prompt and download 4K output.'}
          </span>
          {isVideoMode ? (
            <Link
              to="/showcase/image"
              className="text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1 transition-colors underline underline-offset-4"
            >
              <span>Explore 4K Image Studio</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          ) : (
            <Link
              to="/"
              className="text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1 transition-colors underline underline-offset-4"
            >
              <span>View 60FPS Video Reel</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          2 LINES (DUAL OPPOSING ROWS) - BALANCED MEDIUM SIZE
         ══════════════════════════════════════════════════════════════════ */}
      <div
        className="relative w-full space-y-3.5 overflow-hidden py-1"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 7%, black 93%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 7%, black 93%, transparent)',
          transform: 'translateZ(0)',
          contain: 'paint layout',
        }}
      >
        {/* ── LINE 1: FLOATS LEFTWARDS ── */}
        <div className="animate-video-marquee-forward gap-3.5 sm:gap-4 hover:[animation-play-state:paused]">
          {[...row1Items, ...row1Items].map((item, idx) => {
            return item.type === 'image' ? (
              <ImageCard
                key={`line1-img-${item.id}-${idx}`}
                image={item}
                floatClass=""
                onCardClick={() => setActiveModalItem(item)}
              />
            ) : (
              <VideoCard
                key={`line1-vid-${item.id}-${idx}`}
                video={item}
                floatClass=""
                onCardClick={() => setActiveModalItem(item)}
              />
            );
          })}
        </div>

        {/* ── LINE 2: FLOATS RIGHTWARDS ── */}
        <div className="animate-video-marquee-reverse gap-3.5 sm:gap-4 hover:[animation-play-state:paused]">
          {[...row2Items, ...row2Items].map((item, idx) => {
            return item.type === 'image' ? (
              <ImageCard
                key={`line2-img-${item.id}-${idx}`}
                image={item}
                floatClass=""
                onCardClick={() => setActiveModalItem(item)}
              />
            ) : (
              <VideoCard
                key={`line2-vid-${item.id}-${idx}`}
                video={item}
                floatClass=""
                onCardClick={() => setActiveModalItem(item)}
              />
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          FULLSCREEN MEDIA LIGHTBOX MODAL (IMAGE OR VIDEO)
         ══════════════════════════════════════════════════════════════════ */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-2xl bg-[#0c0f18] border border-white/10 shadow-2xl shadow-black overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#0a0c14]/90">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <h3 className="text-xs sm:text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
                  {activeModalItem.title}
                </h3>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-blue-300 border border-white/10">
                  {activeModalItem.model}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {activeModalItem.type === 'video' && (
                  <button
                    onClick={() => setIsModalMuted(!isModalMuted)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                    title={isModalMuted ? 'Unmute' : 'Mute'}
                  >
                    {isModalMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-blue-400" />}
                  </button>
                )}

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
            <div className="p-4 space-y-3 overflow-y-auto">
              {activeModalItem.type === 'video' ? (
                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/10 shadow-inner">
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
                <div className="relative w-full rounded-2xl overflow-hidden bg-[#07090e] border border-white/10 shadow-inner flex items-center justify-center p-2 sm:p-3 min-h-[320px] max-h-[60vh]">
                  {/* Subtle blurred ambient backdrop to eliminate empty black void */}
                  <div
                    className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-25 scale-125 pointer-events-none"
                    style={{ backgroundImage: `url(${activeModalItem.src})` }}
                  />
                  <img
                    src={activeModalItem.src}
                    alt={activeModalItem.title}
                    className="relative max-h-[54vh] w-auto max-w-full rounded-lg object-contain shadow-2xl z-10 border border-white/10"
                  />
                </div>
              )}

              {/* Prompt Box */}
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-blue-400" />
                    AI Generation Prompt
                  </span>

                  <button
                    onClick={() => handleCopyPrompt(activeModalItem.prompt, activeModalItem.id)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[10px] text-slate-300 hover:text-white transition-all"
                  >
                    {copiedPromptId === activeModalItem.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-blue-400 font-semibold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Prompt</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-slate-300 font-mono leading-relaxed bg-[#07090e] p-2.5 rounded-lg border border-white/5 select-text">
                  {activeModalItem.prompt}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-white/10 bg-[#0a0c14]/90 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-400 font-mono">
                {activeModalItem.resolution} {activeModalItem.fps ? `• ${activeModalItem.fps}` : ''}
              </span>

              <button
                onClick={() => {
                  setActiveModalItem(null);
                  setShowAuthGate(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-sm shadow-blue-500/20 flex items-center gap-1.5 transition-all"
              >
                <span>{activeModalItem.type === 'video' ? 'Try Video Studio' : 'Try Image Studio'}</span>
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
        title="Unlock 4K AI Media Studio"
        subtitle="Sign in to generate photorealistic imagery, animate still images, and tap into FLUX.1, Midjourney, and Sora."
        badge="PRO MEDIA SUITE"
        feature="media"
        redirectUrl={`${APP_URL}/login`}
      />
    </section>
  );
}

// ── 4K AI Image Card (Balanced Medium Size: ~260px × 155px) ──
function ImageCard({ image, floatClass, onCardClick }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={onCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative w-[235px] sm:w-[260px] md:w-[275px] h-[140px] sm:h-[155px] md:h-[160px] rounded-2xl overflow-hidden bg-[#0c0f18]/95 border transition-all duration-300 cursor-pointer group/card shrink-0 ${
        isHovered
          ? 'border-blue-500 shadow-xl shadow-blue-950/60 scale-[1.04] z-30'
          : 'border-white/10 hover:border-white/20 shadow-lg shadow-black/80'
      } ${floatClass}`}
    >
      {/* High-Fidelity 4K AI Image */}
      <img
        src={image.src}
        alt={image.title}
        className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
      />

      {/* Top Floating Badges (Model & Resolution) */}
      <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10">
        <div className="px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md border border-white/15 text-[9px] font-mono font-medium text-slate-200 flex items-center gap-1 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <span>{image.model}</span>
        </div>

        <div className="px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-md border border-white/10 text-[8.5px] font-mono text-blue-300 font-bold">
          4K IMAGE
        </div>
      </div>

      {/* Bottom Floating Glass Drawer: Title & Prompt Snippet */}
      <div className="absolute inset-x-0 bottom-0 p-2 sm:p-2.5 bg-gradient-to-t from-black/95 via-black/60 to-transparent z-10 space-y-0.5">
        <div className="text-[11px] sm:text-xs font-bold text-white truncate drop-shadow-md flex items-center justify-between">
          <span>{image.title}</span>
          {isHovered && <span className="text-[9px] font-normal text-blue-300 font-mono">Inspect ↗</span>}
        </div>
        <div className="text-[9.5px] text-slate-300 font-mono line-clamp-1 opacity-80">
          "{image.prompt}"
        </div>
      </div>
    </div>
  );
}

// ── 60FPS Video Card with Viewport Visibility & Hardware Accelerated Smooth Playback ──
function VideoCard({ video, floatClass, onCardClick }) {
  const cardRef = useRef(null);
  const videoRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // IntersectionObserver: Only play when card is currently within viewport
  useEffect(() => {
    const cardEl = cardRef.current;
    if (!cardEl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setIsVisible(entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: '100px 0px', // Pre-activate slightly before entering viewport
        threshold: 0.1,
      }
    );

    observer.observe(cardEl);
    return () => {
      observer.disconnect();
    };
  }, []);

  // Manage playback based on viewport visibility
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    if (isVisible) {
      const playPromise = v.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    } else {
      v.pause();
    }
  }, [isVisible]);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <div
      ref={cardRef}
      onClick={onCardClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative w-[235px] sm:w-[260px] md:w-[275px] h-[140px] sm:h-[155px] md:h-[160px] rounded-2xl overflow-hidden bg-[#0c0f18]/95 border transition-all duration-300 cursor-pointer group/card shrink-0 will-change-transform ${
        isHovered
          ? 'border-blue-500 shadow-xl shadow-blue-950/60 scale-[1.04] z-30'
          : 'border-white/10 hover:border-white/20 shadow-lg shadow-black/80'
      } ${floatClass}`}
      style={{ transform: 'translateZ(0)' }}
    >
      {/* Video Element: Viewport-active, muted, looped, metadata preloaded */}
      <video
        ref={videoRef}
        src={video.src}
        loop
        muted
        playsInline
        preload="metadata"
        className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
      />

      {/* Top Floating Badges (Model & Live Status) */}
      <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10">
        <div className="px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md border border-white/15 text-[9px] font-mono font-medium text-slate-200 flex items-center gap-1 shadow-sm">
          <span className={`w-1.5 h-1.5 rounded-full ${isHovered ? 'bg-blue-500 animate-pulse' : 'bg-slate-400'}`} />
          <span>{video.model}</span>
        </div>

        <div
          className={`px-1.5 py-0.5 rounded-md backdrop-blur-md border text-[8.5px] font-mono font-bold transition-colors ${
            isHovered
              ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
              : 'bg-black/75 border-white/10 text-slate-400'
          }`}
        >
          {isHovered ? 'PLAYING' : video.fps}
        </div>
      </div>



      {/* Bottom Floating Glass Drawer: Title & Prompt Snippet */}
      <div className="absolute inset-x-0 bottom-0 p-2 sm:p-2.5 bg-gradient-to-t from-black/95 via-black/60 to-transparent z-10 space-y-0.5">
        <div className="text-[11px] sm:text-xs font-bold text-white truncate drop-shadow-md flex items-center justify-between">
          <span>{video.title}</span>
          {isHovered && <span className="text-[9px] font-normal text-blue-300 font-mono">Click to expand ↗</span>}
        </div>
        <div className="text-[9.5px] text-slate-300 font-mono line-clamp-1 opacity-80">
          "{video.prompt}"
        </div>
      </div>
    </div>
  );
}
