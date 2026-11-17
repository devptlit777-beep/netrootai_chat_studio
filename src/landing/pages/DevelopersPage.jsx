import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Terminal,
  Copy,
  Check,
  Shield,
  Zap,
  Server,
  Activity,
  ArrowRight,
  Key,
  Database,
  Lock,
  Layers,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import LandingDeveloperGateway from '../components/landing/LandingDeveloperGateway';
import LoginGateModal from '../components/common/LoginGateModal';

const APP_URL = '';

export default function DevelopersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [piiInput, setPiiInput] = useState('Client John Doe (john.doe@enterprise.com, CC: 4532-8921-3412-9012) requests Q3 audit.');
  const [piiMasked, setPiiMasked] = useState('Client John Doe ([EMAIL REDACTED], CC: [CREDIT CARD REDACTED]) requests Q3 audit.');
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleKeyClick = () => {
    if (user) {
      navigate('/workspace?tab=keys');
    } else {
      setShowAuthModal(true);
    }
  };

  const handlePiiChange = (val) => {
    setPiiInput(val);
    const masked = val
      .replace(/[\w.-]+@[\w.-]+\.\w+/g, '[EMAIL REDACTED]')
      .replace(/\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, '[CREDIT CARD REDACTED]');
    setPiiMasked(masked);
  };

  return (
    <div className="pt-32 pb-24 overflow-hidden">
      {/* Background Aurora */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        {/* Page Hero */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel border border-blue-500/30 text-xs font-semibold text-blue-300">
            <Terminal className="w-3.5 h-3.5 text-blue-400" />
            <span>NetRoot AI Developer Gateway & Governance</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-extrabold text-white tracking-tight leading-snug">
            Drop-in OpenAI Gateway for{' '}
            <span className="text-blue-500">
              470+ Frontier Models.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Eliminate vendor lock-in. Route any request through our low-latency proxy with PII masking, semantic caching, rate limit enforcement, and custom BYOK upstream keys.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={handleKeyClick}
              className="px-7 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs sm:text-sm shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all"
            >
              <span>Generate API Key</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <Link
              to="/docs"
              className="px-6 py-3.5 rounded-2xl glass-panel hover:bg-white/10 text-slate-200 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors"
            >
              <span>Explore Full API Docs</span>
            </Link>
          </div>
        </div>

        {/* ── Interactive Code Playground ── */}
        <LandingDeveloperGateway />

        {/* ── Live PII Masking Demonstration ── */}
        <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-white/10 space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-blue-400">
              <Shield className="w-4 h-4" />
              <span>Real-Time PII & Sensitive Data Redaction</span>
            </div>
            <h3 className="text-2xl font-bold text-white">Test Automated Guardrails</h3>
            <p className="text-xs text-slate-400">
              Type sensitive information below to see how NetRoot AI masks confidential tokens before passing to upstream LLMs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            <div className="space-y-2 flex flex-col">
              <label className="text-xs font-mono text-slate-400">Incoming Application Prompt (Unsanitized):</label>
              <textarea
                rows={4}
                value={piiInput}
                onChange={(e) => handlePiiChange(e.target.value)}
                className="w-full flex-1 p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500 resize-none min-h-[110px]"
              />
            </div>

            <div className="space-y-2 flex flex-col">
              <label className="text-xs font-mono text-blue-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Upstream Forwarded Prompt (Sanitized via Guardrails):</span>
              </label>
              <div className="w-full flex-1 p-4 rounded-2xl bg-blue-950/20 border border-blue-500/30 text-xs font-mono text-blue-200 min-h-[110px] flex items-center">
                {piiMasked}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Developer API Key Auth Modal */}
      <LoginGateModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="NetRoot Developer API Key"
        subtitle="Create a developer account or sign in to generate live production API keys and claim 100,000 free starter tokens with drop-in OpenAI SDK compatibility."
        badge="Developer Gateway • Authentication Required"
        feature="api"
        redirectUrl={`${APP_URL}/login?redirect=/workspace?tab=keys`}
      />
    </div>
  );
}
