import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Lock,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  X,
  Presentation,
  Image as ImageIcon,
  Key,
  Shield,
  Zap,
} from 'lucide-react';

const APP_URL = '';

/**
 * Universal 2027 Futuristic Auth Gate Modal for NetRoot AI ChatBix
 * Displays when a guest reaches their 7-prompt trial limit or attempts
 * to access non-chat studios (PPT Studio, Media Studio, API Keys).
 */
export default function LoginGateModal({
  isOpen,
  onClose,
  title = "Unlock Unlimited NetRoot AI ChatBix",
  subtitle = "You've experienced the power of NetRoot AI. Create a free account or sign in to continue with unlimited conversations and full autonomous studios.",
  badge = "Free Guest Sandbox • Sign In Required",
  feature = "chat", // 'chat' | 'ppt' | 'media' | 'api'
  redirectUrl = "/login",
}) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto isolate animate-in fade-in duration-200">
      {/* Backdrop with Deep Obsidian Blur */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-xl transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-lg rounded-3xl bg-[#090b14]/95 border border-white/10 p-6 sm:p-8 shadow-2xl shadow-black/80 text-slate-100 z-10 space-y-6 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon & Pill */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel border border-blue-500/30 text-[11px] font-semibold text-blue-300">
            <Lock className="w-3.5 h-3.5 text-blue-400" />
            <span>{badge}</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-snug">
            {title}
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
            {subtitle}
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="rounded-2xl p-4 bg-white/[0.03] border border-white/[0.08] space-y-2.5">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-2">
            What you unlock with a free account:
          </div>

          <div className="grid grid-cols-1 gap-2 text-xs text-slate-200">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
              <span>
                <strong className="text-white">Unlimited Chats:</strong> Access 450+ frontier reasoning & vision models.
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
              <span>
                <strong className="text-white">PowerPoint Studio:</strong> Prompt to editable .pptx slide decks in 30s.
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
              <span>
                <strong className="text-white">Media Studio:</strong> Generate cinematic 4K images and studio motion video.
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
              <span>
                <strong className="text-white">Developer API:</strong> Drop-in OpenAI proxy with 100k free starter tokens.
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-1">
          <a
            href={redirectUrl}
            className="w-full py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all"
          >
            <span>Create Free Account / Log In</span>
            <ArrowRight className="w-4 h-4" />
          </a>

          <div className="flex items-center justify-between text-xs text-slate-400 px-1 pt-1">
            <Link
              to="/pricing"
              onClick={onClose}
              className="hover:text-blue-300 underline underline-offset-4 transition-colors"
            >
              View Pricing & Enterprise Plans
            </Link>

            <span className="text-[11px] text-slate-400">
              No credit card required
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
