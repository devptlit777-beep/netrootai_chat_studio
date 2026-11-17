import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import {
  Sparkles,
  ArrowRight,
  Shield,
  Activity,
  Heart,
  Globe,
  ExternalLink,
} from 'lucide-react';

const APP_URL = '';

export default function LandingFooter() {
  const { user } = useAuth();
  return (
    <footer className="border-t border-white/10 bg-[#06070a] relative overflow-hidden pt-16 pb-12">
      {/* Background Subtle Gradient */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[300px] bg-blue-900/5 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 pb-12 border-b border-white/10">
          {/* Brand Column */}
          <div className="md:col-span-5 lg:col-span-4 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 p-[1.5px] shadow-lg shadow-blue-500/20">
                <div className="w-full h-full bg-[#090b12] rounded-[10px] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              </div>
              <span className="font-extrabold text-lg tracking-tight text-white flex items-center">
                NetRoot&nbsp;<span className="text-blue-500">AI</span>&nbsp;<span className="text-slate-200 font-semibold text-base">ChatBix</span>
              </span>
            </Link>

            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              The unified next-generation frontier AI workspace for executive presentations, generative media, and drop-in developer model gateway.
            </p>

            <div className="flex items-center gap-2 text-[11px] font-mono text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 w-fit">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              <span>All Systems Operational • 99.98% Uptime</span>
            </div>
          </div>

          <div className="md:col-span-7 lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-8">
            {/* Column 1: Studios */}
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold mb-3">Studios</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><Link to="/video-studio" className="hover:text-blue-400 transition-colors">Video Studio (Full HD Cinema)</Link></li>
                <li><Link to="/showcase/image" className="hover:text-blue-400 transition-colors">Image Studio (High Resolution)</Link></li>
                <li><Link to="/showcase/ppt" className="hover:text-blue-400 transition-colors">PPT Studio (Slide Decks)</Link></li>
                <li><Link to="/chat" className="hover:text-blue-400 transition-colors">Trial Chat Sandbox (7 Free Prompts)</Link></li>
                <li><Link to="/developers" className="hover:text-blue-400 transition-colors">Developer Gateway</Link></li>
                <li><Link to="/models" className="hover:text-blue-400 transition-colors">Models Fleet</Link></li>
              </ul>
            </div>

            {/* Column 2: Developers */}
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold mb-3">Developers</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><Link to="/developers" className="hover:text-blue-400 transition-colors">OpenAI Drop-In SDK</Link></li>
                <li><Link to={user ? "/workspace?tab=keys" : "/developers"} className="hover:text-blue-400 transition-colors">API Keys & Quotas</Link></li>
                <li><Link to={user ? "/workspace?tab=guardrails" : "/developers"} className="hover:text-blue-400 transition-colors">PII Masking & Safety</Link></li>
                <li><Link to={user ? "/workspace?tab=byok" : "/developers"} className="hover:text-blue-400 transition-colors">BYOK Integration</Link></li>
                <li><Link to="/docs" className="hover:text-blue-400 transition-colors">Documentation</Link></li>
              </ul>
            </div>

            {/* Column 3: Trust & Legal */}
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold mb-3">Company & Trust</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><Link to="/about-us" className="hover:text-blue-400 transition-colors font-medium text-slate-300">About Us (NetRoot.AI)</Link></li>
                <li><Link to="/pricing" className="hover:text-blue-400 transition-colors">Pricing & Wallet</Link></li>
                <li><Link to="/docs#account-settings" className="hover:text-blue-400 transition-colors">Privacy & Compliance</Link></li>
                <li><Link to="/docs#introduction" className="hover:text-blue-400 transition-colors">Terms of Service</Link></li>
                <li><Link to="/docs#project-settings" className="hover:text-blue-400 transition-colors">Security Standards</Link></li>
                <li><a href="mailto:support@netrootai.com" className="hover:text-blue-400 transition-colors">Enterprise Support</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div className="flex items-center gap-2">
            <span>© 2026 NetRoot AI ChatBix. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              15 Global Languages Supported
            </span>
            {user ? (
              <Link
                to="/dashboard"
                className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
              >
                <span>Open Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
              >
                <span>Launch Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
