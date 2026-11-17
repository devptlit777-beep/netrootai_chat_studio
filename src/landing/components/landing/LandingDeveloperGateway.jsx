import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
} from 'lucide-react';
import LoginGateModal from '../common/LoginGateModal';

const APP_URL = '';

const SNIPPETS = {
  python: `from openai import OpenAI

# 1. Point to NetRoot AI Drop-in Gateway
client = OpenAI(
    base_url="https://api.netrootai.tech/v1",
    api_key="netroot_sk_live_enterprise_xxxx"
)

# 2. Call any of 470+ models with native OpenAI SDK syntax
response = client.chat.completions.create(
    model="anthropic/claude-3.5-sonnet",
    messages=[
        {"role": "system", "content": "You are an autonomous engineering agent."},
        {"role": "user", "content": "Refactor distributed queue architecture"}
    ],
    temperature=0.2
)

print(response.choices[0].message.content)`,

  node: `import OpenAI from 'openai';

// 1. Point to NetRoot AI Drop-in Gateway
const client = new OpenAI({
  baseURL: 'https://api.netrootai.tech/v1',
  apiKey: process.env.NETROOT_API_KEY,
});

// 2. Call any of 470+ models with native OpenAI SDK syntax
const response = await client.chat.completions.create({
  model: 'anthropic/claude-3.5-sonnet',
  messages: [
    { role: 'system', content: 'You are an autonomous engineering agent.' },
    { role: 'user', content: 'Refactor distributed queue architecture' },
  ],
  temperature: 0.2,
});

console.log(response.choices[0].message.content);`,

  curl: `curl https://api.netrootai.tech/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer netroot_sk_live_enterprise_xxxx" \\
  -d '{
    "model": "anthropic/claude-3.5-sonnet",
    "messages": [
      {"role": "user", "content": "Refactor distributed queue architecture"}
    ]
  }'`,
};

export default function LandingDeveloperGateway() {
  const [lang, setLang] = useState('node'); // 'python' | 'node' | 'curl'
  const [copied, setCopied] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(SNIPPETS[lang]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="developer-gateway" className="py-24 relative overflow-hidden">
      {/* Background Subtle Mesh */}
      <div className="absolute top-1/2 right-1/4 w-[600px] h-[400px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Description & Enterprise Pillars */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel border border-blue-500/30 text-xs font-semibold text-blue-300">
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              <span>Developer API Gateway</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              One Unified API for{' '}
              <span className="text-blue-500">
                Every AI Model.
              </span>
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Drop-in replacement for OpenAI’s SDK. Simply swap your <code className="text-blue-300 font-mono bg-white/5 px-1.5 py-0.5 rounded">baseURL</code> to route requests across Claude 3.5 Sonnet, GPT-4o, DeepSeek R1, Llama 3.3, and 470+ models with enterprise governance.
            </p>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl glass-panel border border-white/10 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span>PII Masking</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Real-time redacting of confidential emails, credit cards, and tokens.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl glass-panel border border-white/10 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Zap className="w-4 h-4 text-blue-400" />
                  <span>Semantic Caching</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Sub-5ms response serving and up to 58% recurring token savings.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl glass-panel border border-white/10 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Server className="w-4 h-4 text-indigo-400" />
                  <span>BYOK Support</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Bring your own keys for OpenAI, Anthropic, and Google with zero markup.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl glass-panel border border-white/10 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Activity className="w-4 h-4 text-amber-400" />
                  <span>Live Observability</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Audit logs, token attribution, latency tracking, and spend limits.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-4">
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all"
              >
                <span>Generate API Key</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <Link
                to="/docs"
                className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 transition-colors"
              >
                View API Docs →
              </Link>
            </div>
          </div>

          {/* Right Column: Interactive Code Console */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl bg-[#090b10] border border-slate-800 shadow-2xl shadow-black/60 p-4 sm:p-6 laser-border">
              {/* Window Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>

                  {/* Language Selector */}
                  <div className="flex gap-1 ml-3 bg-white/5 p-1 rounded-xl border border-white/5">
                    <button
                      onClick={() => setLang('node')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-colors ${
                        lang === 'node'
                          ? 'bg-blue-600 text-white font-medium'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Node.js
                    </button>
                    <button
                      onClick={() => setLang('python')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-colors ${
                        lang === 'python'
                          ? 'bg-blue-600 text-white font-medium'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Python
                    </button>
                    <button
                      onClick={() => setLang('curl')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-colors ${
                        lang === 'curl'
                          ? 'bg-blue-600 text-white font-medium'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      cURL
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white font-mono px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-blue-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Code'}</span>
                </button>
              </div>

              {/* Code Snippet Box */}
              <div className="relative">
                <pre className="font-mono text-xs sm:text-[13px] text-slate-200 overflow-x-auto p-3 leading-relaxed rounded-xl bg-black/40 border border-white/5">
                  <code>{SNIPPETS[lang]}</code>
                </pre>
              </div>

              {/* Bottom Simulated Execution Strip */}
              <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                  <span className="text-blue-400 font-bold">Live Proxy Endpoint Active</span>
                </div>
                <div className="flex items-center gap-4 text-[11px]">
                  <span>P99: 42ms</span>
                  <span>Uptime: 99.98%</span>
                  <span className="text-blue-400">Zero Cold Start</span>
                </div>
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
    </section>
  );
}
