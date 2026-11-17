import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import {
  CreditCard,
  Check,
  Sparkles,
  Zap,
  ArrowRight,
  Shield,
  Wallet,
  HelpCircle,
} from 'lucide-react';

const APP_URL = '';

export default function LandingPricingWallet() {
  const { user } = useAuth();
  const [months, setMonths] = useState(1); // 1 or 3 months toggle synced with Studio Pricing

  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel border border-amber-500/30 text-xs font-semibold text-amber-300 mb-4">
            <CreditCard className="w-3.5 h-3.5 text-blue-400" />
            <span>Predictable, Transparent Pricing</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Simple Plans.{' '}
            <span className="text-blue-500">
              Zero Surprise Bills.
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Start completely free with zero credit card required. Upgrade to Pro for full 470+ model access or deposit flexible credits in your pay-as-you-go wallet.
          </p>

          {/* ── Billing Cycle Duration Switcher (Synced with Dashboard Pricing) ── */}
          <div className="mt-8 inline-flex items-center gap-2 p-1.5 rounded-2xl bg-white/[0.04] border border-white/10 shadow-xl backdrop-blur-md">
            <button
              type="button"
              onClick={() => setMonths(1)}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                months === 1
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly Billing ($19/mo)
            </button>
            <button
              type="button"
              onClick={() => setMonths(3)}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                months === 3
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>3 Months ($49/3mo)</span>
              <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Save $8
              </span>
            </button>
          </div>
          <p className="text-xs mt-3 font-medium text-emerald-400">
            {months === 3
              ? '✨ Special: $49 billed every 3 months (Includes $35 Free Wallet Credits)'
              : '✨ $19 billed every month (Includes $12 Free Wallet Credits)'}
          </p>
        </div>

        {/* ── 3 Main Plan Cards ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {/* Plan 1: Free Tier */}
          <div className="rounded-3xl glass-panel p-7 border border-white/10 flex flex-col justify-between glass-panel-hover">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase font-mono tracking-wider px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/25">
                  Free Forever
                </span>
                <span className="text-xs text-slate-400">No card required</span>
              </div>

              <h3 className="text-2xl font-bold text-white mb-2">Free Starter</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-6">
                Perfect for personal exploration, quick research queries, and drafting presentation outlines.
              </p>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold text-white">$0</span>
                <span className="text-xs text-slate-400">/ forever</span>
              </div>

              <ul className="space-y-3 border-t border-white/10 pt-6 mb-8 text-xs text-slate-200">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>50,000 daily tokens on open-weight models</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>NetRoot High-Speed Models (GPT OSS 20B, Qwen 27B)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Core plugins: Web Search, Calculator & PDF.js</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>2 Lifetime AI Presentations (.pptx export)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Standard community support</span>
                </li>
              </ul>
            </div>

            <Link
              to={user ? "/dashboard" : "/login"}
              className="w-full py-3 rounded-2xl bg-white/[0.06] hover:bg-white/10 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-white/10"
            >
              <span>{user ? "Open Studio Dashboard" : "Get Started Free"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Plan 2: Pro Tier (Featured / Highlighted) */}
          <div className="rounded-3xl glass-panel p-7 border-2 border-blue-500/40 flex flex-col justify-between shadow-2xl shadow-blue-950/40 relative laser-border">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-blue-600 text-white text-[10px] font-extrabold tracking-wider uppercase shadow-md flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Most Popular Choice</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4 mt-1">
                <span className="text-xs uppercase font-mono tracking-wider px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/25">
                  Pro Unlimited
                </span>
                <span className="text-xs text-blue-400 font-semibold">Priority Queue</span>
              </div>

              <h3 className="text-2xl font-bold text-white mb-2">NetRoot Pro</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-6">
                Engineered for founders, consultants, developers, and power creators who need full model freedom.
              </p>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold text-white">
                  ${months === 3 ? '49' : '19'}
                </span>
                <span className="text-xs text-slate-400">
                  /{months === 3 ? '3 months' : 'month'}
                </span>
              </div>

              <div className="mb-4">
                <span className="inline-block text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-mono">
                  + ${months === 3 ? '35.00' : '12.00'} Free Wallet Credits Included
                </span>
              </div>

              <ul className="space-y-3 border-t border-white/10 pt-6 mb-8 text-xs text-slate-100">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="font-semibold text-white">200,000 daily tokens</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="font-semibold text-white">
                    Includes ${months === 3 ? '35.00' : '12.00'} Free Wallet Credits
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="font-semibold text-white">All 470+ Models unlocked (Claude 3.5, GPT-4o)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="font-semibold text-white">PPT Studio Lifetime Unlimited Edits & .pptx export</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>10 Studio-grade image credits included monthly</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>All 13+ plugins including arXiv, Linear, Slack</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Priority GPU cluster routing & dedicated email support</span>
                </li>
              </ul>
            </div>

            <Link
              to={user ? `/workspace?tab=billing&months=${months}` : `/login?redirect=/workspace?tab=billing`}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all"
            >
              <span>{user ? `Upgrade to Pro ($${months === 3 ? '49' : '19'}) in Billing` : "Upgrade to Pro — Instant Activation"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Plan 3: Pay-As-You-Go Wallet & Enterprise */}
          <div className="rounded-3xl glass-panel p-7 border border-white/10 flex flex-col justify-between glass-panel-hover">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase font-mono tracking-wider px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/25">
                  Credit Wallet
                </span>
                <span className="text-xs text-slate-400">Zero recurring commitment</span>
              </div>

              <h3 className="text-2xl font-bold text-white mb-2">Pay-as-you-go</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-6">
                Flexible developer ledger. Deposit pre-paid credits via Stripe and pay strictly for exact token usage.
              </p>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold text-white">Custom</span>
                <span className="text-xs text-slate-400">/ top-up</span>
              </div>

              <ul className="space-y-3 border-t border-white/10 pt-6 mb-8 text-xs text-slate-200">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Stripe instant credit top-up ($10, $25, $50, $100)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>No monthly subscription expiration</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Developer Gateway API keys with custom spend caps</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>BYOK (Bring Your Own Key) with zero platform fee</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Team workspaces and multi-key role management</span>
                </li>
              </ul>
            </div>

            <Link
              to={user ? "/workspace?tab=billing" : "/login"}
              className="w-full py-3 rounded-2xl bg-white/[0.06] hover:bg-white/10 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-white/10"
            >
              <span>{user ? "Manage Credit Wallet" : "Sign in for Wallet"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        </div>
    </section>
  );
}
