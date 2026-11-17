import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Presentation,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Shield,
  Layers,
  Cpu,
  Zap,
  BarChart3,
  Calendar,
  Briefcase,
  Lightbulb,
  Maximize2,
  Share2,
  FileText,
} from 'lucide-react';
import LoginGateModal from '../components/common/LoginGateModal';

const APP_URL = '';

const TEMPLATES = [
  {
    id: 'saas-pitch',
    title: 'AI SaaS & Autonomous Agent Pitch Deck',
    subtitle: 'Series A Investor Deck • 6 Boardroom Slides',
    category: 'Venture Capital & SaaS',
    badge: '6 Slides • Pitch Ready',
    themeName: 'Royal Blue & High-Tech Onyx',
    themeStyle: {
      stageBg: 'bg-[#080d1a] border-blue-500/30',
      radialGlow: 'from-blue-600/18 via-blue-950/10 to-transparent',
      accentColor: 'text-blue-400',
      accentBg: 'bg-blue-500/10 border-blue-500/25',
      cardBg: 'bg-blue-950/20 border-white/10 hover:border-blue-500/30',
      pillColor: 'bg-blue-500',
      chartBarColor: 'bg-blue-500',
      buttonBg: 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20',
      tabActive: 'bg-blue-600 text-white border-blue-500 shadow-blue-600/30',
      tabBadge: 'bg-blue-950/60 text-blue-200 border-blue-400/30',
      dotActive: 'bg-blue-600 text-white shadow-blue-600/30',
    },
    slides: [
      {
        slideNum: 1,
        type: 'cover',
        badge: 'CONFIDENTIAL • SERIES A INVESTMENT MEMO',
        title: 'NetRoot Neural Systems',
        subtitle: 'Autonomous Foundation Infrastructure for Multi-Model Enterprise Workflows',
        meta: [
          { label: 'Target Raise', val: '$15.0M Capital' },
          { label: 'Pre-Money Valuation', val: '$60.0M' },
          { label: 'Lead Syndicate', val: 'Venture Syndicate Ready' },
          { label: 'Execution Horizon', val: '2026 - 2028' },
        ],
      },
      {
        slideNum: 2,
        type: 'problem',
        badge: 'THE MARKET INEFFICIENCY',
        title: 'The Enterprise AI Fragility & Sprawl Gap',
        subtitle: 'Modern enterprise knowledge teams are overwhelmed by subscription sprawl, brittle scripts, and high GPU costs.',
        cards: [
          {
            num: '01',
            tag: 'Subscription Fragmentation',
            title: '8+ Siloed AI Logins',
            desc: 'Founders and teams pay for ChatGPT, Claude, Midjourney, and slide generators separately with 42% average unused seat waste.',
          },
          {
            num: '02',
            tag: 'Production Brittleness',
            title: 'Zero Deterministic Output',
            desc: 'Unpredictable raw LLM outputs break automated pipelines. Enterprise leaders demand strict JSON schema, binary PPTX, and verified compliance.',
          },
          {
            num: '03',
            tag: 'Inference Latency Spikes',
            title: '3200ms+ Cold Bottlenecks',
            desc: 'Direct third-party API rate limits and unpredictable throttles cause critical mission workflows to fail in executive boardrooms.',
          },
        ],
      },
      {
        slideNum: 3,
        type: 'metrics',
        badge: 'TRACTION & OPERATING VELOCITY',
        title: 'Hypergrowth Engine: 2025 to 2026',
        subtitle: 'NetRoot delivers compounding network effects across enterprise workspaces and automated generation pipelines.',
        metrics: [
          {
            label: 'Annual Recurring Revenue',
            val: '$2.4M',
            change: '+184% YoY Growth',
            sub: 'Pure subscription & API margin',
          },
          {
            label: 'Gateway Edge Uptime',
            val: '99.98%',
            change: 'Sub-18ms Latency',
            sub: 'Distributed semantic cache mesh',
          },
          {
            label: 'Active Workspaces',
            val: '14,200+',
            change: '68 Enterprise Contracts',
            sub: 'Zero recorded platform churn',
          },
          {
            label: 'Daily Tokens Processed',
            val: '112M+',
            change: '450+ Models Routed',
            sub: '100% PII masked & sandboxed',
          },
        ],
      },
      {
        slideNum: 4,
        type: 'architecture',
        badge: 'DEEP TECH MOAT',
        title: 'Unified Neural Gateway Architecture',
        subtitle: 'Our single high-throughput abstraction layer intelligently decouples prompt logic from provider fragility.',
        nodes: [
          {
            step: 'STAGE 1',
            name: 'Client Edge Ingestion',
            detail: 'Drop-in OpenAI SDK endpoint with sub-5ms semantic hashing and automated PII token masking.',
          },
          {
            step: 'STAGE 2',
            name: 'Dynamic Neural Mesh',
            detail: 'Intelligent cost/latency router dynamically selects among 470+ frontier models (Claude 3.5, GPT-4o, DeepSeek).',
          },
          {
            step: 'STAGE 3',
            name: 'Autonomous Studio Engine',
            detail: 'Deterministic compilers emit native Microsoft .pptx binaries, 1080p landscape video, and studio imagery.',
          },
        ],
      },
      {
        slideNum: 5,
        type: 'comparison',
        badge: 'COMPETITIVE LANDSCAPE',
        title: 'Why NetRoot Wins The Enterprise Market',
        subtitle: 'Direct side-by-side comparison between legacy point solutions and our unified autonomous workspace.',
        features: [
          { name: 'Model Fleet Coverage', legacy: '1 Model vendor locked', netroot: '470+ Frontier & Open-weight models' },
          { name: 'Slide Generation Quality', legacy: 'Flat images or locked PDF only', netroot: 'Native binary .pptx with vector shapes' },
          { name: 'Developer Gateway Support', legacy: 'Proprietary non-standard API', netroot: '100% Drop-in OpenAI API compatible' },
          { name: 'Security & PII Masking', legacy: 'Standard cloud transmission', netroot: 'Zero-retention client PII scrubbing' },
          { name: 'Cost Optimization Layer', legacy: 'Full list price token billing', netroot: 'Semantic caching saves up to 60% compute' },
        ],
      },
      {
        slideNum: 6,
        type: 'capital',
        badge: 'USE OF FUNDS & ROADMAP',
        title: 'Series A Capital Deployment ($15.0M)',
        subtitle: 'Strategic execution priorities targeted at scaling enterprise market dominance over the next 18 months.',
        pillars: [
          {
            pct: '50%',
            title: 'GPU Cluster & Low-Latency Routing',
            desc: 'Expanding edge gateway PoPs across Frankfurt, Singapore, and Virginia to achieve sub-12ms global latency.',
          },
          {
            pct: '30%',
            title: 'Enterprise GTM & Developer Relations',
            desc: 'Scaling enterprise sales engineers and direct developer tooling for Fortune 500 workflow integration.',
          },
          {
            pct: '20%',
            title: 'SOC2 Type II & Sovereign AI Cloud',
            desc: 'Completing FedRAMP compliance and private air-gapped on-premise deployments for defense and banking.',
          },
        ],
      },
    ],
  },
  {
    id: 'board-strategy',
    title: 'Executive Board Strategy & Q4 Execution Plan',
    subtitle: 'Strategic Review & Growth Mandate • 5 Boardroom Slides',
    category: 'Corporate Strategy & Governance',
    badge: '5 Slides • Board Ready',
    themeName: 'Minimalist Slate & Frost Silver',
    themeStyle: {
      stageBg: 'bg-[#0e1219] border-slate-600/40',
      radialGlow: 'from-slate-400/12 via-slate-800/10 to-transparent',
      accentColor: 'text-slate-200',
      accentBg: 'bg-white/[0.08] border-white/20',
      cardBg: 'bg-slate-900/40 border-slate-700/50 hover:border-slate-500/50',
      pillColor: 'bg-slate-300',
      chartBarColor: 'bg-slate-300',
      buttonBg: 'bg-slate-700 hover:bg-slate-600 text-white shadow-slate-700/20',
      tabActive: 'bg-slate-700 text-white border-slate-500 shadow-slate-700/30',
      tabBadge: 'bg-slate-800 text-slate-200 border-slate-600/40',
      dotActive: 'bg-slate-600 text-white shadow-slate-600/30',
    },
    slides: [
      {
        slideNum: 1,
        type: 'cover',
        badge: 'EXECUTIVE COMMITTEE • BOARD OF DIRECTORS',
        title: 'Strategic Horizon 2026 - 2027',
        subtitle: 'Consolidating Multi-Model Intelligence into High-Margin Enterprise Workspaces',
        meta: [
          { label: 'Session Type', val: 'Q4 Annual Strategic Review' },
          { label: 'Presenter', val: 'Office of the CEO & CTO' },
          { label: 'Classification', val: 'Board Confidential' },
          { label: 'Fiscal Focus', val: 'FY2027 Operating Budget' },
        ],
      },
      {
        slideNum: 2,
        type: 'problem',
        badge: 'STRATEGIC INFLECTION',
        title: 'Executive Boardroom Takeaways: Q3 to Q4',
        subtitle: 'Critical leadership observations on profitability, customer expansion, and market positioning.',
        cards: [
          {
            num: '01',
            tag: 'Margin Expansion',
            title: 'EBITDA At +32.4%',
            desc: 'Gross operating margin expanded by 640 bps due to automated inference routing and semantic caching efficiencies.',
          },
          {
            num: '02',
            tag: 'Consolidated Accounts',
            title: '134% Net Revenue Retention',
            desc: 'Enterprise customers who started with PPT Studio expanded usage into the Developer Gateway within 90 days.',
          },
          {
            num: '03',
            tag: 'Strong Runway',
            title: '28 Months Cash Runway',
            desc: 'Current operating cash flows allow sustainable product innovation with zero dilutive capital requirements.',
          },
        ],
      },
      {
        slideNum: 3,
        type: 'architecture',
        badge: 'CORE STRATEGIC PILLARS',
        title: 'The 3 Pillars of Global Market Execution',
        subtitle: 'Alignment of engineering capacity and commercial distribution for sustainable market leadership.',
        nodes: [
          {
            step: 'PILLAR 1',
            name: 'Sovereign Enterprise AI Deployments',
            detail: 'Deploying isolated VPC instances for regulated financial institutions and defense healthcare partners.',
          },
          {
            step: 'PILLAR 2',
            name: 'Developer Gateway Monetization',
            detail: 'Capturing developer wallet share with unified API keys, granular rate limits, and custom credit wallets.',
          },
          {
            step: 'PILLAR 3',
            name: 'Autonomous Media Studio Flywheel',
            detail: 'High-margin visual and presentation creation suites acting as self-serve enterprise lead funnels.',
          },
        ],
      },
      {
        slideNum: 4,
        type: 'chart',
        badge: 'REVENUE ACCELERATION',
        title: 'Quarterly Revenue Performance & Projections ($M)',
        subtitle: 'Demonstrating consistent quarterly growth with strong expansion in high-ticket enterprise contracts.',
        chartData: [
          { q: 'Q1 FY25', val: 0.85, height: '28%', label: '$0.85M' },
          { q: 'Q2 FY25', val: 1.40, height: '45%', label: '$1.40M' },
          { q: 'Q3 FY25', val: 2.15, height: '68%', label: '$2.15M' },
          { q: 'Q4 FY25 (Est)', val: 3.20, height: '95%', label: '$3.20M' },
        ],
        chartCallout: {
          highlight: '+276% Annual Trajectory',
          desc: 'Projected to close FY2026 with run-rate exceeding $12.8M ARR on sustained enterprise contract velocity.',
        },
      },
      {
        slideNum: 5,
        type: 'capital',
        badge: 'GOVERNANCE & HORIZON',
        title: '2027 Key Milestone Deliverables',
        subtitle: 'Board-approved governance checklist and operational expansion timeline.',
        pillars: [
          {
            pct: 'Q1',
            title: 'European Sovereignty Hub',
            desc: 'Complete full GDPR and local EU datacenter hosting in Frankfurt and Dublin.',
          },
          {
            pct: 'Q2',
            title: 'Enterprise Single Sign-On & SCIM',
            desc: 'Integrate Okta, Azure AD, and automated employee directory lifecycle synchronization.',
          },
          {
            pct: 'Q3-Q4',
            title: 'Series B & Public Readiness',
            desc: 'Engage top-tier audit partners for Big 4 financial attestation and audit readiness.',
          },
        ],
      },
    ],
  },
  {
    id: 'product-roadmap',
    title: 'Product Architecture & Engineering Blueprint',
    subtitle: 'Technical Infrastructure & Scalability • 5 Technical Slides',
    category: 'Engineering & Deep Tech',
    badge: '5 Slides • Tech Specs',
    themeName: 'Cyber Obsidian & Emerald Green',
    themeStyle: {
      stageBg: 'bg-[#06130e] border-emerald-500/30',
      radialGlow: 'from-emerald-500/15 via-emerald-950/10 to-transparent',
      accentColor: 'text-emerald-400',
      accentBg: 'bg-emerald-500/10 border-emerald-500/25',
      cardBg: 'bg-emerald-950/20 border-white/10 hover:border-emerald-500/30',
      pillColor: 'bg-emerald-500',
      chartBarColor: 'bg-emerald-500',
      buttonBg: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20',
      tabActive: 'bg-emerald-700 text-white border-emerald-500 shadow-emerald-700/30',
      tabBadge: 'bg-emerald-950/60 text-emerald-200 border-emerald-400/30',
      dotActive: 'bg-emerald-600 text-white shadow-emerald-600/30',
    },
    slides: [
      {
        slideNum: 1,
        type: 'cover',
        badge: 'ENGINEERING SPECIFICATION • ARCHITECTURE DOC',
        title: 'Enterprise Neural Gateway v3.0',
        subtitle: 'High-Throughput, Sub-20ms Multi-Provider Load Balancing and Vector Synthesis Core',
        meta: [
          { label: 'System Owner', val: 'Core Infrastructure Group' },
          { label: 'Target Latency', val: 'Sub-20ms P95 Response' },
          { label: 'Concurrent Capacity', val: '250,000 req/sec' },
          { label: 'Compliance', val: 'Zero-Retention In-Memory' },
        ],
      },
      {
        slideNum: 2,
        type: 'architecture',
        badge: 'INFERENCE LIFECYCLE',
        title: 'Deterministic Request Lifecycle Flow',
        subtitle: 'Every incoming prompt passes through a sub-5ms inspection and routing sequence.',
        nodes: [
          {
            step: '01. INGESTION',
            name: 'PII Tokenization & Sanitization',
            detail: 'Regex and neural NER scrub SSNs, credit cards, and confidential names in-memory before leaving edge node.',
          },
          {
            step: '02. SEMANTIC CACHE',
            name: 'Sub-3ms Vector Lookup',
            detail: 'Cosine similarity query against Redis cluster. Repeated questions return instantly at 0 GPU token cost.',
          },
          {
            step: '03. ROUTING & SYNTH',
            name: 'Dynamic Model Dispatcher',
            detail: 'Workload dispatched to optimal provider cluster (OpenAI, Anthropic, DeepSeek, or NetRoot Fast OSS).',
          },
        ],
      },
      {
        slideNum: 3,
        type: 'metrics',
        badge: 'PERFORMANCE BENCHMARKS',
        title: 'Production Reliability & SLA Metrics',
        subtitle: 'Stress-tested across 50 million synthetic transactions during enterprise soak testing.',
        metrics: [
          { label: 'Time To First Token (TTFT)', val: '< 18ms', change: '8x Faster', sub: 'Streaming edge buffers' },
          { label: 'Service Level Agreement', val: '99.99%', change: 'Financial Grade', sub: 'Multi-region failover' },
          { label: 'PII Leakage Rate', val: '0.000%', change: 'Zero Breaches', sub: 'Client verified audits' },
          { label: 'Failover Switch Time', val: '< 250ms', change: 'Seamless', sub: 'Zero dropped connections' },
        ],
      },
      {
        slideNum: 4,
        type: 'problem',
        badge: 'SECURITY & ENCRYPTION',
        title: 'Zero-Trust Enterprise Guardrails',
        subtitle: 'Built from day one to exceed the most stringent cybersecurity and privacy protocols.',
        cards: [
          {
            num: '01',
            tag: 'At Rest & In Transit',
            title: 'AES-256 & TLS 1.3 Strict',
            desc: 'All payload frames are encrypted using hardware security modules with customer-managed keys (BYOK).',
          },
          {
            num: '02',
            tag: 'Zero Data Training',
            title: 'Contractual Data Isolation',
            desc: 'Prompts, embeddings, and generated presentations are never used for downstream model weight training.',
          },
          {
            num: '03',
            tag: 'Granular RBAC',
            title: 'Role-Based API Quotas',
            desc: 'Admins allocate granular monthly spending caps and department model allowances from a centralized console.',
          },
        ],
      },
      {
        slideNum: 5,
        type: 'capital',
        badge: 'ENGINEERING HORIZON',
        title: 'Next-Generation Infrastructure Roadmap',
        subtitle: 'Planned architectural milestones scheduled for deployment over the next three quarters.',
        pillars: [
          {
            pct: 'Phase 1',
            title: 'Local Small Language Model (SLM) Edge Cache',
            desc: 'Deploying distilled 7B models directly on edge nodes for instant document parsing.',
          },
          {
            pct: 'Phase 2',
            title: 'Multi-Modal Vector RAG Pipeline',
            desc: 'Native indexing of audio transcripts, PDF schemas, and binary .pptx presentation layouts.',
          },
          {
            pct: 'Phase 3',
            title: 'Automated Red-Teaming & Guardrail Loops',
            desc: 'Continuous real-time adversarial prompt evaluation to prevent prompt injection and data exfiltration.',
          },
        ],
      },
    ],
  },
  {
    id: 'financial-growth',
    title: 'Financial Unit Economics & Investor Metrics',
    subtitle: 'SaaS Metrics, Cohorts & Capital Efficiency • 5 Financial Slides',
    category: 'Finance & Venture Metrics',
    badge: '5 Slides • Financial KPIs',
    themeName: 'Midnight Charcoal & Amber Gold',
    themeStyle: {
      stageBg: 'bg-[#140f09] border-amber-500/30',
      radialGlow: 'from-amber-500/15 via-amber-950/10 to-transparent',
      accentColor: 'text-amber-400',
      accentBg: 'bg-amber-500/10 border-amber-500/25',
      cardBg: 'bg-amber-950/20 border-white/10 hover:border-amber-500/30',
      pillColor: 'bg-amber-500',
      chartBarColor: 'bg-amber-500',
      buttonBg: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-500/20',
      tabActive: 'bg-amber-700 text-white border-amber-500 shadow-amber-700/30',
      tabBadge: 'bg-amber-950/60 text-amber-200 border-amber-400/30',
      dotActive: 'bg-amber-600 text-white shadow-amber-600/30',
    },
    slides: [
      {
        slideNum: 1,
        type: 'cover',
        badge: 'COMMERCIAL DYNAMICS • UNIT ECONOMICS MEMO',
        title: 'Scalable SaaS Unit Economics',
        subtitle: 'Demonstrating Superior Gross Margins, Rapid Payback, and Negative Net Churn',
        meta: [
          { label: 'Evaluation Period', val: 'FY2025 - Q3 FY2026' },
          { label: 'LTV / CAC Ratio', val: '7.8x Enterprise' },
          { label: 'Gross Margin', val: '82.4% Blended' },
          { label: 'Payback Period', val: '3.2 Months' },
        ],
      },
      {
        slideNum: 2,
        type: 'metrics',
        badge: 'CORE OPERATING METRICS',
        title: 'World-Class Efficiency Ratios',
        subtitle: 'Benchmark comparison against top-quartile enterprise cloud and generative AI companies.',
        metrics: [
          { label: 'Lifetime Value (LTV)', val: '$14,200', change: '7.8x CAC', sub: 'Average enterprise seat pack' },
          { label: 'Net Revenue Retention', val: '138%', change: 'Top 5% Cohort', sub: 'Expansion via developer keys' },
          { label: 'Blended Gross Margin', val: '82.4%', change: '+8% vs Industry', sub: 'Powered by semantic cache' },
          { label: 'Magic Number (Sales)', val: '1.42', change: 'High Efficiency', sub: '$1 S&M produces $1.42 ARR' },
        ],
      },
      {
        slideNum: 3,
        type: 'problem',
        badge: 'REVENUE BREAKDOWN',
        title: 'Diversified Multi-Channel Monetization',
        subtitle: 'Three robust revenue engines minimize customer concentration risk.',
        cards: [
          {
            num: '62%',
            tag: 'Enterprise Subscriptions',
            title: 'Annual Multi-Seat Contracts',
            desc: '$25k to $100k annual recurring commitments from financial firms, consulting agencies, and tech scale-ups.',
          },
          {
            num: '26%',
            tag: 'Pro Self-Serve Tier',
            title: '$19 / Month Subscriptions',
            desc: 'High-volume viral adoption by solo creators, founders, and consultants generating monthly presentations.',
          },
          {
            num: '12%',
            tag: 'Pay-As-You-Go Wallet',
            title: 'Developer Gateway Top-ups',
            desc: 'Elastic Stripe pre-paid credits deposited by engineering teams running high-throughput API workloads.',
          },
        ],
      },
      {
        slideNum: 4,
        type: 'chart',
        badge: 'MARGIN TRAJECTORY',
        title: 'Gross Margin Expansion Over Time (%)',
        subtitle: 'As platform volume scales, proprietary token routing reduces unit compute expense.',
        chartData: [
          { q: 'Q1 FY25', val: 0.62, height: '40%', label: '62%' },
          { q: 'Q2 FY25', val: 0.71, height: '58%', label: '71%' },
          { q: 'Q3 FY25', val: 0.78, height: '76%', label: '78%' },
          { q: 'Q4 FY25', val: 0.82, height: '90%', label: '82.4%' },
        ],
        chartCallout: {
          highlight: '+2,040 bps Expansion',
          desc: 'Achieved through high cache hit rates (48%) and dynamic fallback to high-speed open-weight models.',
        },
      },
      {
        slideNum: 5,
        type: 'capital',
        badge: 'RULE OF 40 & BEYOND',
        title: 'Capital Efficiency & Sustainable Profitability',
        subtitle: 'Path to sustained GAAP free cash flow generation upon Series A scale.',
        pillars: [
          {
            pct: '68%',
            title: 'Rule of 40 Score',
            desc: '184% YoY revenue growth paired with low -116% net burn rate delivers elite capital velocity.',
          },
          {
            pct: '$1.80',
            title: 'ARR Generated Per Dollar Burned',
            desc: 'Demonstrates disciplined product-led sales motion with zero bloated executive overhead.',
          },
          {
            pct: 'Q2 2027',
            title: 'Target Free Cash Flow Breakeven',
            desc: 'Predictable recurring cash flows allow optionality between hyper-expansion and early profitability.',
          },
        ],
      },
    ],
  },
  {
    id: 'deep-research',
    title: 'Enterprise Research & AI Frontier Whitepaper',
    subtitle: 'Multi-Agent Benchmarks & Empirical Evaluations • 5 Research Slides',
    category: 'AI Research & Frontier Science',
    badge: '5 Slides • Whitepaper',
    themeName: 'Cosmic Indigo & Violet Aurora',
    themeStyle: {
      stageBg: 'bg-[#0f0c1d] border-indigo-500/30',
      radialGlow: 'from-indigo-600/18 via-indigo-950/10 to-transparent',
      accentColor: 'text-indigo-400',
      accentBg: 'bg-indigo-500/10 border-indigo-500/25',
      cardBg: 'bg-indigo-950/20 border-white/10 hover:border-indigo-500/30',
      pillColor: 'bg-indigo-500',
      chartBarColor: 'bg-indigo-500',
      buttonBg: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20',
      tabActive: 'bg-indigo-700 text-white border-indigo-500 shadow-indigo-700/30',
      tabBadge: 'bg-indigo-950/60 text-indigo-200 border-indigo-400/30',
      dotActive: 'bg-indigo-600 text-white shadow-indigo-600/30',
    },
    slides: [
      {
        slideNum: 1,
        type: 'cover',
        badge: 'TECHNICAL WHITEPAPER • PEER BENCHMARK SUITE',
        title: 'Evaluation of Multi-Agent Systems in Production',
        subtitle: 'Empirical Accuracy, Hallucination Mitigations, and Cost Profiles Across 450+ Foundation Models',
        meta: [
          { label: 'Research Division', val: 'NetRoot AI Applied Research Lab' },
          { label: 'Sample Corpus', val: '2.5M Verified Evaluation Runs' },
          { label: 'Primary Benchmarks', val: 'MMLU-Pro, HumanEval, GSM8K' },
          { label: 'Publication Date', val: 'November 2026' },
        ],
      },
      {
        slideNum: 2,
        type: 'comparison',
        badge: 'EMPIRICAL BENCHMARKS',
        title: 'Frontier Model Reasoning & Code Synthesis',
        subtitle: 'Standardized accuracy ratings measured under identical temperature and token budget parameters.',
        features: [
          { name: 'SWE-Bench Verified (Coding)', legacy: 'Industry Avg: 38.4%', netroot: 'NetRoot Ensemble: 64.2%' },
          { name: 'MMLU-Pro (Multi-Domain Reasoning)', legacy: 'Industry Avg: 68.1%', netroot: 'NetRoot Ensemble: 89.6%' },
          { name: 'Hallucination Rate (Factuality)', legacy: 'Standard LLM: 8.4%', netroot: 'NetRoot Guarded: 0.42%' },
          { name: 'Structured JSON Adherence', legacy: 'Industry Avg: 88.0%', netroot: 'Deterministic Schema: 99.98%' },
          { name: 'Cost per 1M Reasoning Tokens', legacy: 'Frontier Direct: $15 - $30', netroot: 'NetRoot Routed: $3.80' },
        ],
      },
      {
        slideNum: 3,
        type: 'architecture',
        badge: 'SCIENTIFIC METHODOLOGY',
        title: 'Tri-Tier Verification & Consensus Pipeline',
        subtitle: 'How NetRoot eliminates hallucinations before emitting enterprise slide deliverables.',
        nodes: [
          {
            step: 'TIER 1: DRAFTING',
            name: 'Specialist Generator Agents',
            detail: 'Three independent subagents create outline proposals focusing on quantitative metrics and narrative flow.',
          },
          {
            step: 'TIER 2: CRITIQUE',
            name: 'Adversarial Critic Loop',
            detail: 'A dedicated fact-checking agent cross-references cited claims against verified live web knowledge bases.',
          },
          {
            step: 'TIER 3: SYNTHESIS',
            name: 'Binary Layout Compiler',
            detail: 'The verified content is compiled into native vector shapes, styling rules, and typography coordinates.',
          },
        ],
      },
      {
        slideNum: 4,
        type: 'problem',
        badge: 'EMPIRICAL FINDINGS',
        title: 'Key Enterprise AI Discoveries',
        subtitle: 'Core learnings from deploying multi-agent generation systems into production enterprise environments.',
        cards: [
          {
            num: '01',
            tag: 'Ensemble Superiority',
            title: 'Multi-Agent Beats Single Mega-Model',
            desc: 'Routing subtasks to specialized smaller models yields 24% higher factuality at 65% lower total compute cost.',
          },
          {
            num: '02',
            tag: 'Native Formatting',
            title: 'Visual Semantics Drive Comprehension',
            desc: 'Boardroom executives absorb quantitative metrics 3.4x faster when structured in bento grids rather than raw prose.',
          },
          {
            num: '03',
            tag: 'Deterministic Schemas',
            title: 'Zero Tolerance for Output Hallucination',
            desc: 'Enforcing strict runtime type validation is essential to prevent corporate governance and compliance liability.',
          },
        ],
      },
      {
        slideNum: 5,
        type: 'capital',
        badge: 'RECOMMENDATIONS',
        title: 'Enterprise Deployment Best Practices',
        subtitle: 'Actionable steps for engineering and executive leaders adopting generative presentation workflows.',
        pillars: [
          {
            pct: 'Guideline 1',
            title: 'Implement Multi-Provider Redundancy',
            desc: 'Never bind mission-critical business workflows to a single proprietary foundation model vendor.',
          },
          {
            pct: 'Guideline 2',
            title: 'Enforce Local PII Scrubbing',
            desc: 'Ensure all proprietary financial numbers and personal identities are tokenized before cloud transit.',
          },
          {
            pct: 'Guideline 3',
            title: 'Adopt Open Binary Standards',
            desc: 'Demand true binary .pptx exports to guarantee lifelong document ownership and cross-platform fidelity.',
          },
        ],
      },
    ],
  },
];

export default function PptStudioPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTemplate, setActiveTemplate] = useState(TEMPLATES[0]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleLaunchStudio = () => {
    if (user) {
      navigate('/ppt-studio');
    } else {
      setShowAuthModal(true);
    }
  };

  const totalSlides = activeTemplate.slides.length;
  const currentSlide = activeTemplate.slides[currentSlideIndex] || activeTemplate.slides[0];
  const st = activeTemplate.themeStyle;

  const handleTemplateSelect = (template) => {
    setActiveTemplate(template);
    setCurrentSlideIndex(0);
  };

  const handlePrevSlide = () => {
    setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : totalSlides - 1));
  };

  const handleNextSlide = () => {
    setCurrentSlideIndex((prev) => (prev < totalSlides - 1 ? prev + 1 : 0));
  };

  return (
    <div className="pt-32 pb-24 overflow-hidden">
      {/* Background Aurora */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Page Hero */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-blue-500/30 text-xs font-semibold text-blue-300">
            <Presentation className="w-3.5 h-3.5 text-blue-400" />
            <span>NetRoot AI Autonomous Presentation Studio</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-extrabold text-white tracking-tight leading-snug">
            Prompt to Executive PowerPoint Deck in{' '}
            <span className="text-blue-500">
              30 Seconds.
            </span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Stop wasting hours formatting slides. NetRoot AI translates raw ideas into executive boardroom presentations with smart adaptive visual hierarchy, boardroom typography, and full lifetime edits.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={handleLaunchStudio}
              className="px-7 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs sm:text-sm shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all group"
            >
              <span>Launch PPT Studio</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
              <span>Full PowerPoint Compatibility • Unlimited Edits</span>
            </div>
          </div>
        </div>

        {/* ── INTERACTIVE SLIDE DECK SHOWCASE (Gamma.app Style Live Player) ── */}
        <div className="space-y-6">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-mono text-blue-400 font-bold mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>5 Distinct Curated Presentation Themes</span>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white">
                Live Interactive Deck Previewer
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-md">
              Switch between 5 completely distinct boardroom themes. Click slide numbers below to explore full multi-slide presentation decks.
            </p>
          </div>

          {/* 5 Template Switcher Tabs (Each with its distinct active style) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {TEMPLATES.map((tmpl) => {
              const isActive = tmpl.id === activeTemplate.id;
              return (
                <button
                  key={tmpl.id}
                  onClick={() => handleTemplateSelect(tmpl)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-2 border ${
                    isActive
                      ? `${tmpl.themeStyle.tabActive} font-semibold shadow-lg`
                      : 'bg-white/[0.04] text-slate-300 hover:text-white border-white/10 hover:bg-white/[0.08]'
                  }`}
                >
                  <span>{tmpl.title}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${
                      isActive ? tmpl.themeStyle.tabBadge : 'bg-white/10 text-slate-400 border-transparent'
                    }`}
                  >
                    {tmpl.badge.split(' • ')[0]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── 16:9 Interactive Presentation Canvas (The Dynamic Stage) ── */}
          <div className={`rounded-3xl border shadow-2xl overflow-hidden relative transition-colors duration-300 ${st.stageBg}`}>
            {/* Top Presentation Bar */}
            <div className="px-6 py-3.5 border-b border-white/10 flex items-center justify-between bg-black/30 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                </div>
                <div className="h-4 w-px bg-white/10" />
                <span className="text-xs font-mono text-slate-200 font-semibold truncate max-w-[180px] sm:max-w-md">
                  {activeTemplate.title}
                </span>
                <span className={`hidden sm:inline-block text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border ${st.accentBg} ${st.accentColor} font-semibold`}>
                  {activeTemplate.themeName}
                </span>
              </div>

              {/* Slide Counter & Category Pill */}
              <div className="flex items-center gap-3">
                <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border bg-white/5 border-white/10 ${st.accentColor}`}>
                  Slide {currentSlideIndex + 1} of {totalSlides}
                </span>
                <span className="hidden md:inline-block text-[10px] font-mono text-slate-400">
                  {activeTemplate.category}
                </span>
              </div>
            </div>

            {/* 16:9 Dynamic Slide Canvas Area */}
            <div className={`p-6 sm:p-10 md:p-12 min-h-[440px] sm:min-h-[500px] flex flex-col justify-between relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] ${st.radialGlow}`}>
              {/* Slide Watermark / Category Pill */}
              <div className="flex items-center justify-between pb-4 border-b border-white/5 text-[10px] font-mono text-slate-400">
                <span className={`flex items-center gap-1.5 font-bold uppercase tracking-wider ${st.accentColor}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${st.pillColor}`} />
                  {currentSlide.badge || activeTemplate.badge}
                </span>
                <span className="text-slate-400">NetRoot AI Autonomous Studio • 16:9 Widescreen</span>
              </div>

              {/* ── DYNAMIC SLIDE CONTENT RENDERER ── */}
              <div className="my-auto py-6">
                {/* 1. Cover Slide */}
                {currentSlide.type === 'cover' && (
                  <div className="space-y-6 max-w-3xl">
                    <div className="space-y-3">
                      <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                        {currentSlide.title}
                      </h3>
                      <p className="text-xs sm:text-sm md:text-base text-slate-300 leading-relaxed max-w-2xl">
                        {currentSlide.subtitle}
                      </p>
                    </div>

                    {currentSlide.meta && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/10">
                        {currentSlide.meta.map((m, idx) => (
                          <div key={idx} className={`p-3 rounded-xl border ${st.cardBg}`}>
                            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-0.5">
                              {m.label}
                            </div>
                            <div className={`text-xs sm:text-sm font-bold font-mono ${st.accentColor}`}>
                              {m.val}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Problem / Cards Slide */}
                {currentSlide.type === 'problem' && (
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white">
                        {currentSlide.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
                        {currentSlide.subtitle}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                      {currentSlide.cards?.map((card, idx) => (
                        <div
                          key={idx}
                          className={`p-5 rounded-2xl border flex flex-col justify-between space-y-3 ${st.cardBg}`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-xs font-mono font-bold ${st.accentColor}`}>{card.num}</span>
                              <span className="text-[10px] font-mono text-slate-400 uppercase">{card.tag}</span>
                            </div>
                            <h4 className="text-sm font-bold text-white mb-1.5">{card.title}</h4>
                            <p className="text-xs text-slate-300 leading-relaxed">{card.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Bento Metrics Slide */}
                {currentSlide.type === 'metrics' && (
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white">
                        {currentSlide.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
                        {currentSlide.subtitle}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                      {currentSlide.metrics?.map((metric, idx) => (
                        <div
                          key={idx}
                          className={`p-5 rounded-2xl border flex flex-col justify-between space-y-3 ${st.cardBg}`}
                        >
                          <div className="text-[11px] text-slate-400 font-mono">{metric.label}</div>
                          <div>
                            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
                              {metric.val}
                            </div>
                            <div className={`inline-flex items-center gap-1 text-[11px] font-semibold mt-1 ${st.accentColor}`}>
                              <TrendingUp className="w-3 h-3" />
                              <span>{metric.change}</span>
                            </div>
                          </div>
                          <div className="text-[10px] text-slate-400 border-t border-white/5 pt-2 font-mono">
                            {metric.sub}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Architecture / Flow Nodes Slide */}
                {currentSlide.type === 'architecture' && (
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white">
                        {currentSlide.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
                        {currentSlide.subtitle}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 relative">
                      {currentSlide.nodes?.map((node, idx) => (
                        <div
                          key={idx}
                          className={`p-5 rounded-2xl border space-y-2 relative ${st.cardBg}`}
                        >
                          <div className={`text-[10px] font-mono font-bold uppercase tracking-wider ${st.accentColor}`}>
                            {node.step}
                          </div>
                          <h4 className="text-sm font-bold text-white">{node.name}</h4>
                          <p className="text-xs text-slate-300 leading-relaxed">{node.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Comparison Matrix Slide */}
                {currentSlide.type === 'comparison' && (
                  <div className="space-y-5">
                    <div className="space-y-1">
                      <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white">
                        {currentSlide.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
                        {currentSlide.subtitle}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 overflow-hidden bg-black/20">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400 font-mono text-[11px]">
                            <th className="p-3.5">Capability / Requirement</th>
                            <th className="p-3.5 text-slate-400">Legacy AI Point Tools</th>
                            <th className={`p-3.5 font-bold ${st.accentColor} bg-white/[0.03]`}>NetRoot Unified Autonomous Mesh</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {currentSlide.features?.map((f, idx) => (
                            <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                              <td className="p-3.5 font-semibold text-white">{f.name}</td>
                              <td className="p-3.5 text-slate-400 flex items-center gap-1.5">
                                <XCircle className="w-3.5 h-3.5 text-red-400/80 shrink-0" />
                                <span>{f.legacy}</span>
                              </td>
                              <td className={`p-3.5 font-semibold bg-white/[0.02] ${st.accentColor}`}>
                                <span className="inline-flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                  <span>{f.netroot}</span>
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 6. Dynamic SVG Chart Slide */}
                {currentSlide.type === 'chart' && (
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white">
                        {currentSlide.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
                        {currentSlide.subtitle}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 items-center">
                      {/* Bar Visualization */}
                      <div className={`md:col-span-2 p-6 rounded-2xl border space-y-4 ${st.cardBg}`}>
                        <div className="flex items-end justify-between gap-4 h-44 pt-6 px-4 border-b border-white/10">
                          {currentSlide.chartData?.map((item, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                              <span className="text-[11px] font-mono text-white font-bold">{item.label}</span>
                              <div
                                style={{ height: item.height }}
                                className={`w-full max-w-[60px] rounded-t-xl transition-all ${
                                  idx === (currentSlide.chartData?.length || 0) - 1
                                    ? `${st.chartBarColor} shadow-lg`
                                    : 'bg-white/20'
                                }`}
                              />
                              <span className="text-[10px] font-mono text-slate-400">{item.q}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Callout box */}
                      {currentSlide.chartCallout && (
                        <div className={`p-5 rounded-2xl border space-y-3 ${st.accentBg}`}>
                          <div className={`text-xs font-mono font-bold uppercase tracking-wider ${st.accentColor}`}>
                            Performance Insight
                          </div>
                          <div className="text-xl font-bold text-white font-mono">
                            {currentSlide.chartCallout.highlight}
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {currentSlide.chartCallout.desc}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 7. Capital Allocation / Pillars Slide */}
                {currentSlide.type === 'capital' && (
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white">
                        {currentSlide.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
                        {currentSlide.subtitle}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                      {currentSlide.pillars?.map((p, idx) => (
                        <div
                          key={idx}
                          className={`p-5 rounded-2xl border space-y-3 ${st.cardBg}`}
                        >
                          <div className={`text-2xl sm:text-3xl font-extrabold font-mono ${st.accentColor}`}>
                            {p.pct}
                          </div>
                          <h4 className="text-sm font-bold text-white">{p.title}</h4>
                          <p className="text-xs text-slate-300 leading-relaxed">{p.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Slide Footer Stamp */}
              <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span className={st.accentColor}>{activeTemplate.themeName}</span>
                <span>Slide {currentSlideIndex + 1} of {totalSlides}</span>
              </div>
            </div>

            {/* Bottom Controls Bar (Slide-Through Controls - ZERO DOWNLOAD BUTTONS) */}
            <div className="px-6 py-4 bg-black/40 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Slide Dots Indicator */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400 mr-2">Jump to Slide:</span>
                {activeTemplate.slides.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlideIndex(idx)}
                    className={`w-7 h-7 rounded-lg text-xs font-mono flex items-center justify-center transition-all ${
                      currentSlideIndex === idx
                        ? `${st.dotActive} font-bold shadow-md`
                        : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              {/* Prev / Next & Launch Studio Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrevSlide}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-medium border border-white/10 flex items-center gap-1.5 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous Slide</span>
                </button>

                <button
                  onClick={handleNextSlide}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-medium border border-white/10 flex items-center gap-1.5 transition-colors"
                >
                  <span>Next Slide</span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setShowAuthModal(true)}
                  className={`px-5 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all shadow-md ${st.buttonBg}`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Launch in PPT Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── 3 INFINITE ADAPTIVE AI ENGINE HIGHLIGHTS ── */}
        <div className="space-y-6 pt-4">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Zero Rigid Constraints. Infinite Smart Layouts.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Unlike legacy tools with fixed templates, NetRoot AI dynamically synthesizes custom layouts based strictly on the semantic meaning of your content.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl glass-panel border border-white/10 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Content-Adaptive Synthesis</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Whether you need a quantitative financial comparison, a complex decision flowchart, or a bento KPI grid, the AI invents the ideal visual hierarchy on the fly.
              </p>
            </div>

            <div className="p-6 rounded-3xl glass-panel border border-white/10 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Boardroom Design Standards</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Automated WCAG contrast ratios, executive typography pairings, and structured whitespace ensure your presentations impress partners and board members.
              </p>
            </div>

            <div className="p-6 rounded-3xl glass-panel border border-white/10 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Vector PowerPoint Precision</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Never get locked into flat images or proprietary cloud viewers. Enjoy true vector shapes, editable typographic hierarchies, and full Microsoft PowerPoint fidelity.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom CTA Banner */}
        <div className="rounded-3xl p-8 sm:p-10 bg-[#0c0f18] border border-slate-800 text-center space-y-6 laser-border">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            Ready to Build Your Next Presentation?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
            Experience the speed of NetRoot presentation planning. Free tier users get instant outline and slide drafting with zero credit card required.
          </p>
          <button
            onClick={handleLaunchStudio}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm shadow-md shadow-blue-500/20 transition-all"
          >
            <span>Launch PPT Studio Free</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PPT Studio Auth Modal */}
      <LoginGateModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="NetRoot Autonomous Presentation Studio"
        subtitle="Create an account or sign in to generate complete boardroom-ready PowerPoint (.pptx) decks in 30 seconds."
        badge="Presentation Studio • Sign In Required"
        feature="ppt"
        redirectUrl={`${APP_URL}/login?redirect=/ppt-studio`}
      />
    </div>
  );
}
