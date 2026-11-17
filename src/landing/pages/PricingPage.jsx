import React from 'react';
import {
  CreditCard,
  Check,
  X,
  Sparkles,
  ArrowRight,
  Shield,
  HelpCircle,
  Zap,
} from 'lucide-react';
import LandingPricingWallet from '../components/landing/LandingPricingWallet';
import LandingFaq from '../components/landing/LandingFaq';

const APP_URL = '';

const COMPARISON_ROWS = [
  { feature: 'Daily Token Limit', free: '50,000 tokens', pro: '200,000 tokens', enterprise: 'Unlimited / Custom' },
  { feature: 'Monthly Free Wallet Credits', free: '—', pro: '$12.00 / month ($35 / 3 mo)', enterprise: 'Custom allocation' },
  { feature: 'NetRoot High-Speed Models', free: 'Included (100% Free)', pro: 'Included', enterprise: 'Included' },
  { feature: 'Frontier Models (Claude 3.5, GPT-4o)', free: 'Preview only', pro: 'All 470+ Unlocked', enterprise: 'All 470+ Unlocked' },
  { feature: 'PPT Studio Presentation Generation', free: '2 Lifetime Presentations', pro: 'Unlimited AI Presentations & Edits', enterprise: 'Unlimited Lifetime Edits' },
  { feature: 'Binary .pptx PowerPoint Export', free: 'Included (.pptx)', pro: 'Full Unrestricted (.pptx)', enterprise: 'Full Unrestricted (.pptx)' },
  { feature: 'Studio-Grade Image Generation', free: '—', pro: '10 FLUX images / month', enterprise: 'Custom allocation' },
  { feature: 'Plugins (Web Search, PDF.js, Math)', free: 'Core plugins', pro: 'All 13+ plugins', enterprise: 'All 13+ plugins' },
  { feature: 'Developer API Keys', free: 'Sandbox only', pro: 'Production Keys', enterprise: 'Multi-Key Quotas' },
  { feature: 'PII Masking & Safety Guardrails', free: 'Standard', pro: 'Included', enterprise: 'Custom Rules' },
  { feature: 'Semantic Caching (sub-5ms)', free: '—', pro: 'Included', enterprise: 'Dedicated Cache' },
  { feature: 'BYOK (Bring Your Own Key)', free: '—', pro: '0% Platform Fee', enterprise: '0% Platform Fee' },
  { feature: 'Audit Logs Retention', free: '24 hours', pro: '30 days', enterprise: 'Unlimited' },
  { feature: 'Support Level', free: 'Community', pro: 'Priority Email', enterprise: 'Dedicated SLA' },
];

export default function PricingPage() {
  return (
    <div className="pt-32 pb-24 overflow-hidden">
      {/* Background Aurora */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        {/* Main Pricing Cards & Estimator */}
        <LandingPricingWallet />

        {/* ── Feature Comparison Matrix Table ── */}
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">Full Feature Comparison</h3>
            <p className="text-xs text-slate-400">Detailed breakdown of quotas, models, and capabilities across tiers.</p>
          </div>

          <div className="rounded-3xl glass-panel border border-white/10 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    <th className="p-4 sm:p-5 font-bold text-white text-sm">Capabilities & Features</th>
                    <th className="p-4 sm:p-5 font-bold text-slate-300 w-1/4">Free ($0/mo)</th>
                    <th className="p-4 sm:p-5 font-bold text-blue-300 w-1/4 bg-blue-500/10">NetRoot Pro ($19/mo)</th>
                    <th className="p-4 sm:p-5 font-bold text-purple-300 w-1/4">Wallet / Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {COMPARISON_ROWS.map((row, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 font-sans font-semibold text-slate-200">{row.feature}</td>
                      <td className="p-4 text-slate-400">{row.free}</td>
                      <td className="p-4 text-blue-200 font-semibold bg-blue-500/5">{row.pro}</td>
                      <td className="p-4 text-purple-200">{row.enterprise}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── FAQ ── */}
        <LandingFaq />
      </div>
    </div>
  );
}
