import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Sparkles,
  Shield,
  Cpu,
  Globe,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  ArrowRight,
  Layers,
  Zap,
  Cloud,
  Quote,
  Target,
  Lightbulb,
  Workflow,
  Leaf,
  Compass,
  TrendingUp,
  Brain,
  Star,
  Send,
  Check,
  Presentation,
  Image as ImageIcon,
  Terminal,
  FolderGit2
} from 'lucide-react';

const APP_URL = '';

export default function AboutUsPage() {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitFeedback = (e) => {
    e.preventDefault();
    if (!feedbackMsg.trim()) return;
    setSubmitted(true);
  };

  const handleResetFeedback = () => {
    setSubmitted(false);
    setFeedbackMsg('');
    setRating(5);
  };

  return (
    <div className="pt-28 pb-24 overflow-hidden bg-[#090a0f]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        
        {/* ══════════════════════════════════════════════════════════════════
            HERO: THE UNIFIED AI PLATFORM & HOLISTIC FRAMEWORK
           ══════════════════════════════════════════════════════════════════ */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel border border-blue-500/30 text-xs font-semibold text-blue-300">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>The Unified AI Platform & Holistic Framework</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            One Unified Workspace for{' '}
            <span className="text-blue-500">Creators, Developers & Enterprises.</span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Netroot.AI brings together everything you need in one place. Instead of juggling multiple tools, our platform combines presentation generation, creative media synthesis, 450+ top AI models, developer APIs, and sustainable cloud infrastructure into a single seamless workspace.
          </p>

          {/* Key Platform Highlights */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <span className="px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono text-slate-300 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>Unified All-in-One Suite</span>
            </span>
            <span className="px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono text-slate-300 flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span>450+ Frontier AI Models</span>
            </span>
            <span className="px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono text-slate-300 flex items-center gap-2">
              <Cloud className="w-3.5 h-3.5 text-blue-400" />
              <span>Azure, AWS & GCP Certified</span>
            </span>
            <span className="px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono text-slate-300 flex items-center gap-2">
              <Leaf className="w-3.5 h-3.5 text-blue-400" />
              <span>Green & Sustainable Cloud</span>
            </span>
          </div>

          {/* Slogan Quote from NetRoot.ai */}
          <div className="max-w-2xl mx-auto mt-6 p-6 rounded-2xl glass-panel border border-blue-500/20 bg-blue-950/15 relative text-left">
            <Quote className="w-8 h-8 text-blue-500/25 absolute top-4 right-4" />
            <p className="text-sm sm:text-base text-slate-100 font-medium italic leading-relaxed">
              “Data is like trash. You should understand what you'll do with it before you gather it.”
            </p>
            <div className="mt-3 text-xs font-mono text-blue-300 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>NetRoot.AI Guiding Principle on Data Utility & Purpose</span>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 1: UNIFIED PLATFORM — WHAT MAKES US ALL-IN-ONE
           ══════════════════════════════════════════════════════════════════ */}
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-blue-400 font-semibold uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5" />
              <span>Unified Workspace Suite</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Why Choose a Unified Platform?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Stop paying for 5 different subscriptions. Netroot.AI unifies every creative and technical tool into one account.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* 1. PPT Studio */}
            <div className="p-6 rounded-2xl glass-panel border border-white/10 bg-[#0c0f18]/90 flex flex-col justify-between space-y-4 hover:border-blue-500/40 transition-colors">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                  <Presentation className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">PPT & Presentation Studio</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Turn ideas and outlines into polished, executive PowerPoint decks (.pptx) in under 30 seconds.
                </p>
              </div>
              <Link to="/showcase/ppt" className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1.5 pt-2">
                <span>Explore PPT Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* 2. Video & Image Studios */}
            <div className="p-6 rounded-2xl glass-panel border border-white/10 bg-[#0c0f18]/90 flex flex-col justify-between space-y-4 hover:border-blue-500/40 transition-colors">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Video & Image Studios</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Generate Full HD cinematic videos and high-resolution visuals using Google Veo 2, Sora, and FLUX.1 Pro.
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2 text-xs font-medium">
                <Link to="/video-studio" className="text-blue-400 hover:text-blue-300 flex items-center gap-1">
                  <span>Video Studio</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
                <span className="text-slate-600">•</span>
                <Link to="/showcase/image" className="text-blue-400 hover:text-blue-300 flex items-center gap-1">
                  <span>Image Studio</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* 3. 450+ Models Fleet */}
            <div className="p-6 rounded-2xl glass-panel border border-white/10 bg-[#0c0f18]/90 flex flex-col justify-between space-y-4 hover:border-blue-500/40 transition-colors">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                  <Cpu className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">450+ AI Models Fleet</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Access every leading language and vision model on demand with smart model routing and zero setup.
                </p>
              </div>
              <Link to="/models" className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1.5 pt-2">
                <span>Browse Models Fleet</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* 4. Developer API Gateway */}
            <div className="p-6 rounded-2xl glass-panel border border-white/10 bg-[#0c0f18]/90 flex flex-col justify-between space-y-4 hover:border-blue-500/40 transition-colors">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                  <Terminal className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Developer API Gateway</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Drop-in OpenAI-compatible API endpoints with pay-as-you-go billing, high speed, and 99.99% uptime.
                </p>
              </div>
              <Link to="/developers" className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1.5 pt-2">
                <span>View API Docs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 2: ENVIRONMENTAL FOOTPRINT & GREEN COMPUTING
           ══════════════════════════════════════════════════════════════════ */}
        <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-white/10 bg-[#0c0f18]/95 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5 text-blue-400 font-bold text-sm">
              <Leaf className="w-4 h-4 text-blue-400" />
              <span>Environmental Footprint & Sustainable Cloud</span>
            </div>
            <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-300 text-xs font-mono border border-blue-500/20">
              Green Computing
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            We believe powerful AI should also be responsible and eco-friendly. The Netroot.ai Holistic Framework actively monitors compute power and server efficiency, helping companies lower energy waste and reduce carbon emissions across public and private clouds.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Smart Resource Planning</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Automatically matches GPU and CPU power to current demand, preventing idle servers from wasting electricity.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Eco-Friendly Cloud Routing</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Intelligently routes heavy workloads to high-efficiency data centers across Azure, AWS, and Google Cloud.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Clear Carbon Reports</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Straightforward reports on energy savings and compute efficiency to support modern sustainability goals.
              </p>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 3: OUR VISION FOR AI AND ML
           ══════════════════════════════════════════════════════════════════ */}
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-blue-400 font-semibold uppercase tracking-wider">
              <Target className="w-3.5 h-3.5" />
              <span>Our Vision</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Netroot.AI's Vision for AI and Machine Learning
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Building intelligent, reliable AI that assists human creativity and solves tough challenges.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {/* Vision 1 */}
            <div className="p-6 rounded-2xl glass-panel border border-white/10 bg-[#0c0f18]/90 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                  <Brain className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Augmenting Human Capabilities</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  We build AI systems that assist human perception, reasoning, and decision-making, helping you understand complex data and act on it with confidence.
                </p>
              </div>
              <div className="pt-3 border-t border-white/5 text-[11px] font-mono text-blue-300">
                Intuitive Decision Support
              </div>
            </div>

            {/* Vision 2 */}
            <div className="p-6 rounded-2xl glass-panel border border-white/10 bg-[#0c0f18]/90 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Solving Complex Problems</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Our AI engine tackles problems that are difficult to solve manually — like optimizing supply chains, speeding up medical research, and discovering new materials.
                </p>
              </div>
              <div className="pt-3 border-t border-white/5 text-[11px] font-mono text-blue-300">
                Healthcare & Global Supply
              </div>
            </div>

            {/* Vision 3 */}
            <div className="p-6 rounded-2xl glass-panel border border-white/10 bg-[#0c0f18]/90 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                  <Workflow className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Autonomous Automation</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Netroot.AI agents handle tedious, repetitive workflows automatically, allowing your team to focus on creativity, strategy, and business growth.
                </p>
              </div>
              <div className="pt-3 border-t border-white/5 text-[11px] font-mono text-blue-300">
                Smooth Workflow Automation
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 4: FOUR GUIDING PILLARS
           ══════════════════════════════════════════════════════════════════ */}
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-blue-400 font-semibold uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5" />
              <span>Core Values</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Four Guiding Pillars
            </h2>
            <p className="text-xs text-slate-400">
              The principles that drive every feature and update we release.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl glass-panel border border-white/10 bg-[#0c0f18]/90 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs">
                01
              </div>
              <h3 className="text-sm font-bold text-white">Alignment with Goals</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                We build practical tools that deliver real benefits and help you reach your goals faster.
              </p>
            </div>

            <div className="p-5 rounded-2xl glass-panel border border-white/10 bg-[#0c0f18]/90 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs">
                02
              </div>
              <h3 className="text-sm font-bold text-white">Long-term Aspirations</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                We develop future-ready AI solutions that combine deep technical strength with genuine ease of use.
              </p>
            </div>

            <div className="p-5 rounded-2xl glass-panel border border-white/10 bg-[#0c0f18]/90 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs">
                03
              </div>
              <h3 className="text-sm font-bold text-white">Purpose & Impact</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                We turn complex data and models into simple tools that make a positive difference in your daily work.
              </p>
            </div>

            <div className="p-5 rounded-2xl glass-panel border border-white/10 bg-[#0c0f18]/90 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs">
                04
              </div>
              <h3 className="text-sm font-bold text-white">Innovation & Growth</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                We constantly learn, listen to your feedback, and keep our platform at the cutting edge of AI.
              </p>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 5: MISSION, THINKING & INNOVATION
           ══════════════════════════════════════════════════════════════════ */}
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-blue-400 font-semibold uppercase tracking-wider">
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Strategic Focus</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Mission, Thinking, & Innovation
            </h2>
            <p className="text-xs text-slate-400">
              How Netroot.AI turns modern technology into everyday solutions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {/* Mission */}
            <div className="p-6 rounded-2xl glass-panel border border-white/10 bg-[#0c0f18]/90 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-mono text-blue-300 font-semibold">
                  <Target className="w-3.5 h-3.5 text-blue-400" />
                  <span>Our Mission</span>
                </div>
                <h3 className="text-lg font-bold text-white">Accelerating Planned Growth</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  To speed up business success by delivering practical AI tools that provide actionable insights and measurable value for every team.
                </p>
              </div>
              <div className="pt-3 border-t border-white/5 text-[11px] font-mono text-slate-400">
                Result: Practical, Measurable Value
              </div>
            </div>

            {/* Thinking */}
            <div className="p-6 rounded-2xl glass-panel border border-white/10 bg-[#0c0f18]/90 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-mono text-blue-300 font-semibold">
                  <Brain className="w-3.5 h-3.5 text-blue-400" />
                  <span>Our Thinking</span>
                </div>
                <h3 className="text-lg font-bold text-white">Practical AI Skills for Everyone</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  We empower users and companies with accessible AI capabilities so they can solve real business problems without needing deep technical complexity.
                </p>
              </div>
              <div className="pt-3 border-t border-white/5 text-[11px] font-mono text-slate-400">
                Focus: Solving Real Everyday Problems
              </div>
            </div>

            {/* Innovation */}
            <div className="p-6 rounded-2xl glass-panel border border-white/10 bg-[#0c0f18]/90 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-mono text-blue-300 font-semibold">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                  <span>Our Innovation</span>
                </div>
                <h3 className="text-lg font-bold text-white">Fresh, Impactful Answers</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  We bridge the gap between fresh AI ideas and practical daily use, converting raw technological power into simple, intuitive workflows.
                </p>
              </div>
              <div className="pt-3 border-t border-white/5 text-[11px] font-mono text-slate-400">
                Outcome: Clear, Intuitive Workflows
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 6: CLOUD CERTIFIED INFRASTRUCTURE
           ══════════════════════════════════════════════════════════════════ */}
        <div className="rounded-3xl glass-panel p-8 sm:p-10 border border-white/10 bg-[#0c0f18] space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/10">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-mono text-blue-400 font-bold mb-1">
                <Cloud className="w-4 h-4" />
                <span>Enterprise Engine</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white">
                Certified Across the World's Leading Cloud Platforms
              </h3>
            </div>

            <span className="px-3.5 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs font-mono text-blue-300">
              Multi-Cloud Certified
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
            The Netroot.AI Engine is a cloud-native platform optimized and certified exclusively across Microsoft Azure, Amazon Web Services (AWS), and Google Cloud Platform (GCP).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
              <div className="text-sm font-bold text-white flex items-center justify-between">
                <span>Microsoft Azure</span>
                <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">Certified</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Full compatibility with Azure OpenAI services, secure containers, and enterprise governance.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
              <div className="text-sm font-bold text-white flex items-center justify-between">
                <span>Amazon Web Services</span>
                <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">Certified</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Optimized with AWS Bedrock, SageMaker models, and reliable high-speed GPU infrastructure.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
              <div className="text-sm font-bold text-white flex items-center justify-between">
                <span>Google Cloud Platform</span>
                <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">Certified</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Low-latency Vertex AI connectivity, TPU acceleration, and high-availability endpoints.
              </p>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 7: CONTACT DIRECTORY & SIMPLE FEEDBACK
           ══════════════════════════════════════════════════════════════════ */}
        <div id="contact-directory" className="space-y-8 scroll-mt-24">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-blue-400 font-semibold uppercase tracking-wider">
              <Globe className="w-3.5 h-3.5" />
              <span>Contact & Support</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Connect with NetRoot.AI
            </h2>
            <p className="text-xs text-slate-400">
              Get in touch with our team or share your feedback directly with us.
            </p>
          </div>

          {/* 3 Core Contact Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Headquarters */}
            <div className="p-6 rounded-2xl glass-panel border border-white/10 bg-[#0c0f18]/90 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="text-sm font-bold text-white">Headquarters</div>
              <p className="text-xs text-slate-300 leading-relaxed font-mono">
                2495 Bennett Way<br />
                Tracy, CA 95377<br />
                United States of America
              </p>
            </div>

            {/* Direct Phone Numbers */}
            <div className="p-6 rounded-2xl glass-panel border border-white/10 bg-[#0c0f18]/90 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <div className="text-sm font-bold text-white">Phone Numbers</div>
              <div className="space-y-2 text-xs font-mono text-slate-300">
                <div>
                  <span className="text-slate-500 block text-[10px]">United States:</span>
                  <a href="tel:+12096660704" className="hover:text-blue-400 transition-colors font-semibold">
                    +1 (209) 666-0704
                  </a>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">India & Global:</span>
                  <a href="tel:+919243410992" className="hover:text-blue-400 transition-colors font-semibold">
                    +91 92434 10992
                  </a>
                </div>
              </div>
            </div>

            {/* Direct Emails */}
            <div className="p-6 rounded-2xl glass-panel border border-white/10 bg-[#0c0f18]/90 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <div className="text-sm font-bold text-white">Email Inquiries</div>
              <div className="space-y-1.5 text-xs font-mono text-slate-300">
                <div>
                  <span className="text-slate-500 block text-[10px]">General:</span>
                  <a href="mailto:info@netrootai.com" className="hover:text-blue-400 transition-colors">
                    info@netrootai.com
                  </a>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Support:</span>
                  <a href="mailto:support@netrootai.com" className="hover:text-blue-400 transition-colors">
                    support@netrootai.com
                  </a>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Feedback:</span>
                  <a href="mailto:feedback@netrootai.com" className="hover:text-blue-400 transition-colors text-blue-300 font-semibold">
                    feedback@netrootai.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* ── SIMPLE & CLEAN FEEDBACK CARD ── */}
          <div className="max-w-2xl mx-auto rounded-3xl glass-panel p-6 sm:p-8 border border-white/10 bg-[#0c0f18]/95 shadow-xl">
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div>
                  <h3 className="text-lg font-bold text-white">Quick Feedback</h3>
                  <p className="text-xs text-slate-400">Rate your experience and tell us what you think.</p>
                </div>

                {/* 5-Star Simple Rating */}
                <div className="flex items-center gap-1 bg-white/[0.04] px-3 py-1.5 rounded-xl border border-white/10">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                      title={`${star} Star${star > 1 ? 's' : ''}`}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          star <= rating
                            ? 'text-blue-400 fill-blue-500'
                            : 'text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {submitted ? (
                <div className="py-6 text-center space-y-3 animate-in fade-in duration-300">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/40 mx-auto flex items-center justify-center">
                    <Check className="w-5 h-5 text-blue-400" />
                  </div>
                  <h4 className="text-base font-bold text-white">Thank You for Your Feedback!</h4>
                  <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                    We appreciate your input. It helps us keep improving the Netroot.AI experience.
                  </p>
                  <button
                    onClick={handleResetFeedback}
                    className="mt-2 px-4 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-medium text-slate-300 transition-colors"
                  >
                    Send Another Response
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitFeedback} className="space-y-4">
                  <div>
                    <textarea
                      rows={3}
                      value={feedbackMsg}
                      onChange={(e) => setFeedbackMsg(e.target.value)}
                      required
                      placeholder="Write your feedback or suggestions here..."
                      className="w-full p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <span className="text-[11px] text-slate-500">
                      Direct channel: <span className="text-blue-400">feedback@netrootai.com</span>
                    </span>

                    <button
                      type="submit"
                      disabled={!feedbackMsg.trim()}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <span>Submit</span>
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            BOTTOM CTA: EXPERIENCE THE UNIFIED PLATFORM
           ══════════════════════════════════════════════════════════════════ */}
        <div className="rounded-3xl p-8 sm:p-10 bg-[#0c0f18] border border-slate-800 text-center space-y-6">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            Experience the Unified Netroot.AI Workspace
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Create presentations in seconds, generate rich media, run top AI models, or integrate with our developer API. Get started today for free.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={user ? "/dashboard" : "/login"}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs sm:text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all"
            >
              <span>{user ? "Open Studio Dashboard" : "Launch Studio Free"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/showcase/ppt"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all"
            >
              <span>Explore Studios</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
