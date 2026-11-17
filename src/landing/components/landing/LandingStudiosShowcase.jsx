import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Presentation,
  Image as ImageIcon,
  MessageSquare,
  Sparkles,
  Download,
  Layers,
  Palette,
  CheckCircle2,
  ArrowRight,
  FileText,
  Sliders,
  Globe,
  Code,
  Mic,
  Maximize2,
  FileCheck,
} from 'lucide-react';

const APP_URL = '';

export default function LandingStudiosShowcase() {
  const [sliderPos, setSliderPos] = useState(55); // For Before/After Media Slider

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-28">

        {/* ══════════════════════════════════════════════════════════════════
            STUDIO 1: NETROOT AI PPT STUDIO
           ══════════════════════════════════════════════════════════════════ */}
        <div id="ppt-studio" className="scroll-mt-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Content */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel border border-sky-500/30 text-xs font-semibold text-sky-300">
                <Presentation className="w-3.5 h-3.5 text-sky-400" />
                <span>Executive Presentation Engine</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                From One Prompt to{' '}
                <span className="text-blue-500">
                  Boardroom Presentations
                </span>{' '}
                in 30 Seconds.
              </h2>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Transform rough thoughts, meeting notes, or strategic briefs into stunning, boardroom-ready PowerPoint presentations with adaptive visual structures and automated visual curation.
              </p>

              {/* Feature Pills */}
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-sky-500/20 text-sky-400 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">10 Enterprise Visual Formats</h4>
                    <p className="text-[11px] text-slate-400">Executive Roadmaps, Financial KPIs, Timelines, Architecture Flowcharts, and SVG Data Charts.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-sky-500/20 text-sky-400 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Automated Web & Unsplash Imagery</h4>
                    <p className="text-[11px] text-slate-400">AI auto-sources high-resolution stock visuals and Wikipedia context with deduplication.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-sky-500/20 text-sky-400 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">True Binary .pptx Export</h4>
                    <p className="text-[11px] text-slate-400">Download native editable PowerPoint files compatible with Microsoft Office and Keynote.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap gap-4">
                <Link
                  to="/showcase/ppt"
                  className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all"
                >
                  <span>Explore PPT Studio</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Lifetime Unlimited on Pro</span>
                </div>
              </div>
            </div>

            {/* Right 3D Visual Deck Showcase */}
            <div className="lg:col-span-7">
              <div className="relative rounded-3xl glass-panel p-4 sm:p-6 border border-sky-500/20 shadow-2xl shadow-sky-950/40">
                {/* Visual Slide Deck Stack */}
                <div className="space-y-4">
                  {/* Slide 1 Preview */}
                  <div className="aspect-[16/9] w-full rounded-2xl bg-[#090d16] border border-white/10 p-5 flex flex-col justify-between relative overflow-hidden shadow-xl">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-sky-500/20 text-sky-300">
                        Slide 1: Strategy Hero
                      </span>
                      <span className="text-xs font-semibold text-sky-400 flex items-center gap-1 font-mono">
                        <Download className="w-3.5 h-3.5" />
                        <span>Ready for PPTX</span>
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="text-[11px] font-mono text-blue-400 uppercase tracking-wider">Executive Overview</div>
                      <h3 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
                        Next-Gen Multi-Agent Orchestration & Enterprise Growth
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                        Autonomous decision loops powered by NetRoot Autonomous Slide Engine, delivering continuous optimization across distributed clusters.
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10px] text-slate-400 font-mono">
                      <span>Executive Presentation Format</span>
                      <span>NetRoot AI Presentation Engine</span>
                    </div>
                  </div>

                  {/* Slide 2 Thumbnail Bento Strip */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-left">
                      <div className="text-[10px] font-mono text-blue-400">Slide 2</div>
                      <div className="text-xs font-bold text-white truncate">Q4 Milestones</div>
                      <div className="text-[10px] text-slate-400">Timeline Layout</div>
                    </div>

                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-left">
                      <div className="text-[10px] font-mono text-blue-400">Slide 3</div>
                      <div className="text-xs font-bold text-white truncate">Financial Benchmarks</div>
                      <div className="text-[10px] text-slate-400">Stats 4-Col Grid</div>
                    </div>

                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-left">
                      <div className="text-[10px] font-mono text-blue-400">Slide 4</div>
                      <div className="text-xs font-bold text-white truncate">Strategic Execution</div>
                      <div className="text-[10px] text-slate-400">System Flowchart</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            STUDIO 2: GENERATIVE MEDIA STUDIO (IMAGE & VIDEO)
           ══════════════════════════════════════════════════════════════════ */}
        <div id="media-studio" className="scroll-mt-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Interactive Lens / Comparison Slider */}
            <div className="lg:col-span-7 order-2 lg:order-1">
              <div className="rounded-3xl glass-panel p-4 sm:p-6 border border-white/10 shadow-2xl shadow-black/60 space-y-4">
                {/* Interactive Reveal Container with Real AI Generated Video */}
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden select-none border border-white/10">
                  {/* Background Full Color Real AI Generated Video */}
                  <video
                    src="/videos/video1_4feda0c6.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  />

                  {/* Foreground Wireframe / Grayscale Video (Clipped by sliderPos) */}
                  <div
                    style={{ width: `${sliderPos}%` }}
                    className="absolute inset-y-0 left-0 overflow-hidden border-r-2 border-blue-500 shadow-[0_0_15px_rgba(6,182,212,0.5)] bg-black"
                  >
                    <video
                      src="/videos/video1_4feda0c6.mp4"
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover grayscale contrast-150 brightness-90 filter"
                      style={{ width: '100%', minWidth: '100%' }}
                    />
                    <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-mono text-blue-300 border border-blue-500/30">
                      Concept Prompt
                    </div>
                  </div>

                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-mono text-blue-300 border border-blue-500/30 font-semibold">
                    FLUX.1 Motion 60FPS
                  </div>

                  {/* Slider Control Handle */}
                  <div
                    style={{ left: `${sliderPos}%` }}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-xl cursor-ew-resize pointer-events-none"
                  >
                    <Sliders className="w-4 h-4 rotate-90 text-slate-900" />
                  </div>
                </div>

                {/* Range Input Slider for interactive drag */}
                <div className="flex items-center gap-3 px-2">
                  <span className="text-[11px] text-slate-400 font-mono">Drag to inspect fidelity:</span>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={sliderPos}
                    onChange={(e) => setSliderPos(Number(e.target.value))}
                    className="flex-1 accent-blue-600 h-1.5 bg-white/10 rounded-lg cursor-pointer"
                  />
                  <span className="text-[11px] text-blue-400 font-mono font-bold">{sliderPos}%</span>
                </div>
              </div>
            </div>

            {/* Right Content */}
            <div className="lg:col-span-5 space-y-6 order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel border border-blue-500/30 text-xs font-semibold text-blue-300">
                <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                <span>Generative Media Studio</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Cinematic Visuals &{' '}
                <span className="text-blue-400">
                  Studio Motion
                </span>{' '}
                Generation.
              </h2>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Unified multi-model visual synthesis. Generate breathtaking photorealism, digital artwork, and cinematic motion clips with professional framing and style presets.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-blue-500/10 text-blue-400 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Multiple Aspect Ratios</h4>
                    <p className="text-[11px] text-slate-400">16:9 Landscape, 9:16 Mobile Story, and 1:1 High-Def Square.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-blue-500/10 text-blue-400 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Agnes Video 2.5 Flash Motion</h4>
                    <p className="text-[11px] text-slate-400">Prompt-to-video with physical consistency, camera orbit controls, and 60 FPS fluidity.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-blue-500/10 text-blue-400 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Cloud Gallery & Direct Download</h4>
                    <p className="text-[11px] text-slate-400">Instant full-resolution PNG & MP4 downloads with saved prompt history.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap items-center gap-3">
                <Link
                  to="/showcase/image"
                  className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-md shadow-blue-500/20 flex items-center gap-2 hover:scale-[1.02] transition-all"
                >
                  <span>Explore Image Studio</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/video-studio"
                  className="px-5 py-3 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-200 hover:text-white text-xs font-medium flex items-center gap-2 transition-all"
                >
                  <span>Explore Video Studio</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            STUDIO 3: OMNI-CHAT & VOICE COPILOT
           ══════════════════════════════════════════════════════════════════ */}
        <div id="chat-copilot" className="scroll-mt-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Content */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel border border-blue-500/30 text-xs font-semibold text-blue-300">
                <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                <span>Multimodal Chat Copilot</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Conversational AI with{' '}
                <span className="text-blue-500">
                  13+ Live Tools & Voice.
                </span>
              </h2>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Chat with low-latency LLMs, query live web searches, execute JavaScript, parse PDF documents with PDF.js, and export complete conversation briefs to Word, PDF, or PowerPoint.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl glass-panel border border-white/10">
                  <Globe className="w-4 h-4 text-blue-400 mb-1" />
                  <div className="text-xs font-bold text-white">Live Web Search</div>
                  <div className="text-[10px] text-slate-400">Real-time web retrieval</div>
                </div>

                <div className="p-3 rounded-xl glass-panel border border-white/10">
                  <FileText className="w-4 h-4 text-indigo-400 mb-1" />
                  <div className="text-xs font-bold text-white">PDF.js Deep Parse</div>
                  <div className="text-[10px] text-slate-400">Direct document QA</div>
                </div>

                <div className="p-3 rounded-xl glass-panel border border-white/10">
                  <Code className="w-4 h-4 text-blue-400 mb-1" />
                  <div className="text-xs font-bold text-white">Code Runner</div>
                  <div className="text-[10px] text-slate-400">Sandboxed Node.js VM</div>
                </div>

                <div className="p-3 rounded-xl glass-panel border border-white/10">
                  <Mic className="w-4 h-4 text-amber-400 mb-1" />
                  <div className="text-xs font-bold text-white">Voice Input</div>
                  <div className="text-[10px] text-slate-400">Audio Speech-to-Text</div>
                </div>
              </div>

              <div className="pt-4">
                <Link
                  to="/chat"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-md shadow-blue-500/20 transition-all"
                >
                  <span>Start Trial Chat (7 Prompts Free)</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Right Interactive Chat Mockup */}
            <div className="lg:col-span-7">
              <div className="rounded-3xl glass-panel p-4 sm:p-6 border border-slate-800 shadow-2xl shadow-black/50 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span className="text-xs font-bold text-white">Qwen 27B Vision & NetRoot Agentic Copilot</span>
                  </div>
                  <span className="text-[11px] font-mono text-blue-400">&lt; 38ms Latency</span>
                </div>

                <div className="space-y-3">
                  {/* Message 1 */}
                  <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-slate-200">
                    <div className="text-[10px] text-slate-400 font-mono mb-1">User Query:</div>
                    "Analyze the attached PDF on 2026 AI infrastructure and generate a 3-bullet summary with verified citations."
                  </div>

                  {/* Plugin Action Badge */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300 font-mono w-fit">
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>PDF.js Parsed: 'infrastructure_report_2026.pdf' (14 pages, 6.2k tokens)</span>
                  </div>

                  {/* Message 2 (AI Response) */}
                  <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/25 text-xs text-slate-100 space-y-2">
                    <div className="text-[10px] text-blue-400 font-mono font-bold flex items-center justify-between">
                      <span>NetRoot AI Copilot</span>
                      <span>Output Speed: 146 tok/sec</span>
                    </div>
                    <ul className="space-y-1.5 list-disc list-inside text-slate-200">
                      <li>NetRoot Neural Architecture delivers 10x throughput for structured presentation generation.</li>
                      <li>Semantic caching reduces enterprise recurring token costs by up to 58%.</li>
                      <li>Hybrid model routing switches between low-cost open weights and frontier Claude models dynamically.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
