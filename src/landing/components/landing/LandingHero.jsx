import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import {
  Sparkles,
  Zap,
  Presentation,
  Image as ImageIcon,
  Shield,
  ChevronRight,
  CheckCircle2,
  ArrowRight,
  Cpu,
} from 'lucide-react';
import NetrootLogoBrain from './NetrootLogoBrain';

const APP_URL = '';

export default function LandingHero() {
  const { user } = useAuth();
  return (
    <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden min-h-[920px] isolate">
      {/* ── 3D Cosmic Neural Galaxy & Constellation Backdrop ── */}
      <NetrootLogoBrain />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_35%,#000_70%,transparent_100%)] pointer-events-none z-0 opacity-40" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* ── Header Headline Group (100% Clean & Pristine - Zero Clutter) ── */}
        <div className="text-center max-w-4xl mx-auto mb-6 sm:mb-8">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs font-medium text-slate-300 mb-4 animate-in fade-in zoom-in duration-500">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Next-Gen Frontier AI Platform • Autonomous Workspace</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </div>

          {/* Main Title (Refined, Eye-Comfort Scale) */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-extrabold tracking-tight text-white leading-[1.2] mb-3.5">
            NetRoot AI ChatBix.{' '}
            <span className="block mt-1 sm:mt-1.5 text-blue-500">
              The All-in-One AI Workspace.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm md:text-base text-slate-300/90 max-w-2xl mx-auto font-normal leading-relaxed">
            Stop juggling multiple subscriptions. NetRoot AI ChatBix lets you build presentations instantly, automate prompt-to-workflow pipelines, and generate stunning images, video, and audio. Tap into the power of 450+ leading language and vision models on demand.
          </p>
        </div>

        {/* ── Single High-Converting CTA Button (Chat / Dashboard) ── */}
        <div className="flex items-center justify-center mt-6 sm:mt-7">
          {user ? (
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2.5 transition-all group"
            >
              <Sparkles className="w-4 h-4 text-white group-hover:rotate-12 transition-transform" />
              <span>Open Studio Dashboard</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </Link>
          ) : (
            <Link
              to="/chat"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2.5 transition-all group"
            >
              <Sparkles className="w-4 h-4 text-white group-hover:rotate-12 transition-transform" />
              <span>Get Started to Try Chat</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </Link>
          )}
        </div>

        {/* Guest Sandbox Free Callout Pill */}
        <div className="flex items-center justify-center gap-2 mt-4 text-xs text-slate-400 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <span>Instant Guest Sandbox • 7 Free Trial Prompts • No Credit Card Required</span>
        </div>

        {/* Bottom Trust & Key Guarantee Badges */}
        <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-8 mt-10 text-xs text-slate-400 font-medium">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
            100% Free Forever Tier Available
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
            No Credit Card Required
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
            Drop-in OpenAI Compatible Gateway
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
            Editable PowerPoint (.pptx) Decks
          </span>
        </div>
      </div>
    </section>
  );
}
