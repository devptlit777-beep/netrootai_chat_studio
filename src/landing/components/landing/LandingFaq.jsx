import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const FAQS = [
  {
    q: 'How does NetRoot AI generate native PowerPoint presentations?',
    a: 'NetRoot AI uses an integrated presentation engine: an autonomous outline planner formats slides into executive visual layouts (Hero, Stats, Flowchart, Timeline, SVG charts). Our dedicated presentation service then compiles this directly into real Microsoft PowerPoint (.pptx) binary files with embedded shapes, colors, and auto-sourced Wikipedia/Unsplash images, making them 100% editable in PowerPoint, Keynote, and Google Slides.',
  },
  {
    q: 'Are the free models really 100% free with no credit card required?',
    a: 'Yes, completely free forever! You can immediately use open-weight models including GPT OSS 20B, Qwen 3.8 27B Vision, ALLaM 2 7B, and Compound Mini with up to 50,000 tokens daily on NetRoot Accelerated Neural Clusters without entering any credit card or payment information.',
  },
  {
    q: 'How does the Developer API Gateway work as an OpenAI drop-in replacement?',
    a: 'Our API endpoint (/api/v1/chat/completions) implements 100% of the standard OpenAI Chat Completions specification. You simply keep your existing OpenAI client library (Python, Node.js, Go, or cURL) and change the baseURL to https://api.netrootai.tech/v1 with your NetRoot API key. You can then route to Claude 3.5 Sonnet, GPT-4o, DeepSeek R1, or Llama 3.3 by simply specifying the model name.',
  },
  {
    q: 'Can I Bring My Own Keys (BYOK)?',
    a: 'Yes! NetRoot AI supports BYOK for OpenAI, Anthropic, Google Gemini, and custom enterprise endpoints. When you configure your own upstream API keys in your Workspace Settings, requests routed through your keys incur zero platform token markups while still benefiting from our semantic caching, PII masking guardrails, and audit logs.',
  },
  {
    q: 'What image and video models are supported in Media Studio?',
    a: 'Media Studio natively supports leading multi-diffusion architectures for photorealistic image generation, along with cinematic video generation across landscape and vertical mobile aspect ratios.',
  },
  {
    q: 'What is the Pay-as-you-go Credit Wallet?',
    a: 'If you prefer not to have a monthly subscription, our Credit Wallet allows you to deposit pre-paid balance ($10, $25, $50, $100) via Stripe. As you or your applications consume tokens or generate media, the exact cost is deducted per request with zero expiration and full audit visibility.',
  },
];

export default function LandingFaq() {
  const [openIdx, setOpenIdx] = useState(null);

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel border border-blue-500/30 text-xs font-semibold text-blue-300 mb-4">
            <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
            <span>Got Questions?</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-slate-300">
            Everything you need to know about NetRoot AI's studios, model catalog, and developer gateway.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl glass-panel border border-white/10 overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left text-sm font-bold text-white hover:text-blue-300 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-blue-400 transition-transform duration-200 shrink-0 ml-4 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/5 animate-in fade-in duration-200">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
