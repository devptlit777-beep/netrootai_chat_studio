import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scale,
  Plus,
  Search,
  X,
  Check,
  Sparkles,
  Zap,
  TrendingUp,
  Award,
  Layers,
  ChevronDown,
  Info,
  Eye,
  CreditCard,
  BarChart3,
  Brain,
  Code2,
  FileText,
  Lightbulb,
  CheckCircle2,
  DollarSign,
  ShieldCheck,
  Trophy,
  ArrowUpRight,
  Lock,
  MessageSquare,
  ArrowLeftRight,
  RotateCcw,
  Film,
  Volume2,
} from 'lucide-react';
import API_BASE from '../../lib/api';
import { usePlan } from '../../contexts/PlanContext';
import ModelDetailModal from './ModelDetailModal';
import ProUpgradeModal from './ProUpgradeModal';
import FalMediaModal from './FalMediaModal';
import { getFullModelDescription } from '../../lib/modelDescriptions';
import { getModelBenchmarks } from '../../lib/modelBenchmarks';
import ProviderLogo from '../common/ProviderLogo';

export default function ModelCompare({ darkMode, initialModelA, onSwitchToCatalog }) {
  const navigate = useNavigate();
  const { plan } = usePlan();
  const isPro = plan === 'pro' || plan === 'enterprise';

  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guardrails, setGuardrails] = useState({ blocked_providers: [], disallowed_models: [] });

  const [modelA, setModelA] = useState(null);
  const [modelB, setModelB] = useState(null);

  // Detail Modal selection
  const [selectedDetailModel, setSelectedDetailModel] = useState(null);
  const [upgradeTargetModel, setUpgradeTargetModel] = useState(null);
  const [falMediaModel, setFalMediaModel] = useState(null);

  // Modal selector state
  const [activeSlot, setActiveSlot] = useState(null); // 'A' or 'B' or null
  const [modalSearch, setModalSearch] = useState('');
  const [modalFilter, setModalFilter] = useState('all'); // all, free, vision, text
  const [hoveredModel, setHoveredModel] = useState(null);

  useEffect(() => {
    fetchModels();
  }, []);

  useEffect(() => {
    if (initialModelA && !modelA) {
      setModelA(initialModelA);
    }
  }, [initialModelA]);

  // Sync active comparison contenders with URL search parameters
  useEffect(() => {
    if (!loading) {
      const params = new URLSearchParams(window.location.search);
      let changed = false;
      if (modelA?.id) {
        if (params.get('modelA') !== modelA.id) {
          params.set('modelA', modelA.id);
          changed = true;
        }
      } else if (params.has('modelA')) {
        params.delete('modelA');
        changed = true;
      }

      if (modelB?.id) {
        if (params.get('modelB') !== modelB.id) {
          params.set('modelB', modelB.id);
          changed = true;
        }
      } else if (params.has('modelB')) {
        params.delete('modelB');
        changed = true;
      }

      if (changed) {
        window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
      }
    }
  }, [modelA, modelB, loading]);

  async function fetchModels() {
    setLoading(true);
    try {
      const [modelsRes, grRes] = await Promise.all([
        fetch(`${API_BASE}/api/models`),
        fetch(`${API_BASE}/api/workspace/guardrails`).catch(() => null),
      ]);
      const data = await modelsRes.json();
      let grData = null;
      if (grRes && grRes.ok) {
        grData = await grRes.json();
        if (grData?.guardrails) {
          setGuardrails(grData.guardrails);
        }
      }

      if (data.models && data.models.length > 0) {
        const disallowed = (grData?.guardrails?.disallowed_models || []).map(x => x.toLowerCase().trim());
        const blockedProv = (grData?.guardrails?.blocked_providers || []).map(x => x.toLowerCase().trim());

        const allowed = data.models.filter(m => {
          if (!m || !m.id) return false;
          const modelId = m.id.toLowerCase().trim();
          const modelBase = modelId.split(':')[0].replace(/-\d{8}$/, '');
          const shortId = modelId.includes('/') ? modelId.split('/')[1] : modelId;
          const shortBase = modelBase.includes('/') ? modelBase.split('/')[1] : modelBase;

          const isDisallowed = disallowed.some(blocked => {
            const blockedBase = blocked.split(':')[0].replace(/-\d{8}$/, '');
            const blockedShort = blocked.includes('/') ? blocked.split('/')[1] : blocked;
            const blockedShortBase = blockedBase.includes('/') ? blockedBase.split('/')[1] : blockedBase;

            if (
              modelId === blocked ||
              modelBase === blockedBase ||
              shortId === blockedShort ||
              shortBase === blockedShortBase ||
              modelId.startsWith(blockedBase + ':') ||
              modelBase === blocked ||
              blocked.startsWith(modelBase + ':')
            ) {
              return true;
            }

            if (blocked.length >= 4 && (modelId.includes(blocked) || shortId.includes(blocked))) {
              return true;
            }

            return false;
          });
          if (isDisallowed) return false;

          const slug = (m.id.split('/')[0] || '').toLowerCase();
          const name = (m.provider || '').toLowerCase();
          if (blockedProv.includes(slug) || blockedProv.includes(name)) return false;
          return true;
        });

        setModels(allowed);

        // Check URL search parameters for deep linking
        const searchParams = new URLSearchParams(window.location.search);
        const paramA = searchParams.get('modelA');
        const paramB = searchParams.get('modelB');

        let resolvedA = null;
        let resolvedB = null;

        if (paramA) {
          resolvedA = allowed.find(m => m.id === paramA || m.id.toLowerCase() === paramA.toLowerCase());
        } else if (initialModelA) {
          resolvedA = allowed.find(m => m.id === initialModelA.id) || null;
        }

        if (paramB) {
          resolvedB = allowed.find(m => m.id === paramB || m.id.toLowerCase() === paramB.toLowerCase());
        }

        if (resolvedA) setModelA(resolvedA);
        if (resolvedB && resolvedB.id !== resolvedA?.id) setModelB(resolvedB);
      }
    } catch (err) {
      console.error('Failed to load models:', err);
    } finally {
      setLoading(false);
    }
  }

  // Swap contenders between slots
  function handleSwap() {
    const temp = modelA;
    setModelA(modelB);
    setModelB(temp);
  }

  // Reset comparison state
  function handleReset() {
    setModelA(null);
    setModelB(null);
  }

  // Open slot picker modal with preselected preview
  function openSlotPicker(slot) {
    setActiveSlot(slot);
    const curr = slot === 'A' ? modelA : modelB;
    setHoveredModel(curr || (modalFiltered.length > 0 ? modalFiltered[0] : models[0]));
  }

  // Preset Card Handlers with strict uniqueness guarantee
  function applyPreset(type) {
    if (!models.length) return;
    if (type === 'flagship') {
      const a = models.find(m => m.id.includes('claude-3.5-sonnet') || m.id.includes('opus')) || models[0];
      const b = models.find(m => m.id !== a?.id && (m.id.includes('gpt-4o') || m.id.includes('o3') || m.id.includes('chatgpt'))) || models.find(m => m.id !== a?.id);
      setModelA(a);
      setModelB(b);
    } else if (type === 'code') {
      const a = models.find(m => m.custom_badge === 'Coding Pro' || m.id.includes('claude')) || models[0];
      const b = models.find(m => m.id !== a?.id && (m.id.includes('deepseek') || m.name.toLowerCase().includes('code'))) || models.find(m => m.id !== a?.id);
      setModelA(a);
      setModelB(b);
    } else if (type === 'affordable') {
      const a = models.find(m => m.id.includes('deepseek-v4') || m.id.includes('flash') || m.is_free) || models[0];
      const b = models.find(m => m.id !== a?.id && (m.is_free || m.id.includes('llama-3') || m.id.includes('flash'))) || models.find(m => m.id !== a?.id);
      setModelA(a);
      setModelB(b);
    } else if (type === 'creative') {
      const visionModels = models.filter(m => Array.isArray(m.modalities) && m.modalities.includes('image'));
      const a = visionModels.find(m => m.id.includes('claude') || m.id.includes('gpt-4o')) || visionModels[0] || models[0];
      const b = visionModels.find(m => m.id !== a?.id && (m.id.includes('gpt-4o') || m.id.includes('gemini') || m.id.includes('vision'))) || visionModels.find(m => m.id !== a?.id) || models.find(m => m.id !== a?.id);
      setModelA(a);
      setModelB(b);
    }
  }

  function handleSelectFromModal(m) {
    if (activeSlot === 'A') {
      setModelA(m);
      if (modelB?.id === m.id) {
        setModelB(null);
      }
    }
    if (activeSlot === 'B') {
      setModelB(m);
      if (modelA?.id === m.id) {
        setModelA(null);
      }
    }
    setActiveSlot(null);
  }

  function startChat(id) {
    navigate(`/dashboard?model=${encodeURIComponent(id)}`);
  }

  // Filter models inside picker modal
  const modalFiltered = models.filter(m => {
    const s = modalSearch.toLowerCase();
    const match =
      !s ||
      m.name?.toLowerCase().includes(s) ||
      m.display_name?.toLowerCase().includes(s) ||
      m.provider?.toLowerCase().includes(s) ||
      m.id?.toLowerCase().includes(s);

    if (!match) return false;
    if (modalFilter === 'free') return m.is_free;
    if (modalFilter === 'vision') return Array.isArray(m.modalities) && m.modalities.includes('image');
    if (modalFilter === 'text') return Array.isArray(m.modalities) && m.modalities.includes('text');
    if (modalFilter === 'video') return m.media_category === 'video' || m.id?.startsWith('fal-ai/kling') || m.id?.startsWith('fal-ai/luma') || m.id?.startsWith('fal-ai/minimax-video') || m.id?.startsWith('fal-ai/cogvideo');
    return true;
  });

  // Media & Multimodal helpers
  const isMediaModel = (m) => Boolean(
    m?.media_category === 'video' ||
    m?.media_category === 'image' ||
    m?.media_category === 'audio' ||
    m?.id?.startsWith('fal-ai/')
  );
  const isVideoModel = (m) => Boolean(m?.media_category === 'video' || m?.id?.startsWith('fal-ai/kling') || m?.id?.startsWith('fal-ai/luma') || m?.id?.startsWith('fal-ai/minimax-video') || m?.id?.startsWith('fal-ai/cogvideo'));
  const isAudioModel = (m) => Boolean(m?.media_category === 'audio' || m?.id?.startsWith('fal-ai/f5-tts') || m?.id?.startsWith('fal-ai/stable-audio') || m?.id?.startsWith('fal-ai/whisper'));
  const isImageModel = (m) => Boolean(m?.media_category === 'image' || m?.id?.startsWith('fal-ai/flux') || m?.id?.startsWith('fal-ai/recraft') || m?.id?.startsWith('fal-ai/stable-diffusion'));

  // Calculate comparative rates and metrics
  const promptRateA = modelA?.calculated_pricing?.prompt
    ? modelA.calculated_pricing.prompt * 1000000
    : 0;
  const compRateA = modelA?.calculated_pricing?.completion
    ? modelA.calculated_pricing.completion * 1000000
    : 0;
  const promptRateB = modelB?.calculated_pricing?.prompt
    ? modelB.calculated_pricing.prompt * 1000000
    : 0;
  const compRateB = modelB?.calculated_pricing?.completion
    ? modelB.calculated_pricing.completion * 1000000
    : 0;

  // Blended effective rate (standard industry 75% prompt + 25% completion benchmark)
  const blendedRateA = modelA?.is_free ? 0 : (promptRateA * 0.75 + compRateA * 0.25);
  const blendedRateB = modelB?.is_free ? 0 : (promptRateB * 0.75 + compRateB * 0.25);

  const ctxA = modelA?.context_length || 0;
  const ctxB = modelB?.context_length || 0;
  const maxCtx = Math.max(ctxA, ctxB, 100000);

  // Authentic benchmark ratings from modelBenchmarks utility
  const benchA = getModelBenchmarks(modelA);
  const benchB = getModelBenchmarks(modelB);
  const intellA = benchA.intelligence;
  const intellB = benchB.intelligence;
  const codingA = benchA.coding;
  const codingB = benchB.coding;

  const maxPrompt = Math.max(promptRateA, promptRateB, 0.5);
  const maxComp = Math.max(compRateA, compRateB, 0.5);

  let priceVerdict = '';
  if (modelA && modelB) {
    if (isMediaModel(modelA) && isMediaModel(modelB)) {
      const costA = modelA.calculated_pricing?.image || (isVideoModel(modelA) ? 0.25 : isAudioModel(modelA) ? 0.05 : 0.04);
      const costB = modelB.calculated_pricing?.image || (isVideoModel(modelB) ? 0.25 : isAudioModel(modelB) ? 0.05 : 0.04);
      if (costA < costB) {
        priceVerdict = `${modelA.display_name || modelA.name} is cheaper ($${Number(costA).toFixed(3)} vs $${Number(costB).toFixed(3)}/render)`;
      } else if (costB < costA) {
        priceVerdict = `${modelB.display_name || modelB.name} is cheaper ($${Number(costB).toFixed(3)} vs $${Number(costA).toFixed(3)}/render)`;
      } else {
        priceVerdict = `Equivalent generation cost ($${Number(costA).toFixed(3)}/render)`;
      }
    } else if (modelA.is_free && !modelB.is_free) {
      priceVerdict = `${modelA.display_name || modelA.name} is 100% Free on Netroot AI`;
    } else if (modelB.is_free && !modelA.is_free) {
      priceVerdict = `${modelB.display_name || modelB.name} is 100% Free on Netroot AI`;
    } else if (modelA.is_free && modelB.is_free) {
      priceVerdict = 'Both models provide 100% Free access';
    } else if (blendedRateA < blendedRateB) {
      const pct = Math.round(((blendedRateB - blendedRateA) / blendedRateB) * 100);
      priceVerdict = `${modelA.display_name || modelA.name} is ~${pct}% cheaper overall`;
    } else if (blendedRateB < blendedRateA) {
      const pct = Math.round(((blendedRateA - blendedRateB) / blendedRateA) * 100);
      priceVerdict = `${modelB.display_name || modelB.name} is ~${pct}% cheaper overall`;
    } else {
      priceVerdict = 'Equivalent blended token pricing';
    }
  }

  let compVerdict = 'Equivalent output cost';
  if (modelA && modelB) {
    if (isMediaModel(modelA) && isMediaModel(modelB)) {
      compVerdict = isVideoModel(modelA) && isVideoModel(modelB)
        ? 'High-definition video rendering pipeline'
        : 'Dedicated media synthesis pipeline';
    } else if (modelA.is_free && modelB.is_free) {
      compVerdict = 'Both models provide 100% Free output';
    } else if (modelA.is_free) {
      compVerdict = `${modelA.display_name || modelA.name} is 100% Free (Zero cost)`;
    } else if (modelB.is_free) {
      compVerdict = `${modelB.display_name || modelB.name} is 100% Free (Zero cost)`;
    } else if (compRateA < compRateB) {
      const pct = compRateB > 0 ? Math.round(((compRateB - compRateA) / compRateB) * 100) : 100;
      compVerdict = `${modelA.display_name || modelA.name} is ~${pct}% cheaper`;
    } else if (compRateB < compRateA) {
      const pct = compRateA > 0 ? Math.round(((compRateA - compRateB) / compRateA) * 100) : 100;
      compVerdict = `${modelB.display_name || modelB.name} is ~${pct}% cheaper`;
    } else {
      compVerdict = 'Equivalent output cost';
    }
  }

  let ctxVerdict = '';
  if (modelA && modelB) {
    const nameA = modelA.display_name || modelA.name;
    const nameB = modelB.display_name || modelB.name;
    if (isMediaModel(modelA) && isMediaModel(modelB)) {
      if (isVideoModel(modelA) && isVideoModel(modelB)) {
        ctxVerdict = 'Generative Video (Cinematic 1080p motion & temporal physics)';
      } else if (isAudioModel(modelA) && isAudioModel(modelB)) {
        ctxVerdict = 'Generative Audio (44.1kHz studio speech synthesis)';
      } else {
        ctxVerdict = 'Generative Media Synthesis Models';
      }
    } else if (ctxA > ctxB) {
      const diffWords = Math.round((ctxA - ctxB) * 0.75).toLocaleString();
      ctxVerdict = `${nameA} leads (+${diffWords} words) 🏆`;
    } else if (ctxB > ctxA) {
      const diffWords = Math.round((ctxB - ctxA) * 0.75).toLocaleString();
      ctxVerdict = `${nameB} leads (+${diffWords} words) 🏆`;
    } else {
      ctxVerdict = 'Identical memory capacity';
    }
  }

  const isBothFree = modelA?.is_free && modelB?.is_free;
  const isBothEqualPrice = Math.abs(blendedRateA - blendedRateB) < 0.001;

  const budgetLeader = (!modelA?.is_free && modelB?.is_free)
    ? modelB
    : (modelA?.is_free && !modelB?.is_free)
      ? modelA
      : (blendedRateA < blendedRateB ? modelA : blendedRateB < blendedRateA ? modelB : null);

  const contextLeader = (ctxA > ctxB ? modelA : ctxB > ctxA ? modelB : null);
  const reasoningLeader = (intellA > intellB ? modelA : intellB > intellA ? modelB : null);

  // Dynamic decision verdict evaluating real pricing and intelligence
  let decisionRecommendation = '';
  if (modelA && modelB) {
    const aStrengths = [];
    const bStrengths = [];

    if (modelA.is_free && !modelB.is_free) aStrengths.push('zero-cost free tier access');
    else if (blendedRateA < blendedRateB * 0.7) aStrengths.push('significantly lower token costs');
    else if (blendedRateA < blendedRateB) aStrengths.push('better overall affordability');

    if (modelB.is_free && !modelA.is_free) bStrengths.push('zero-cost free tier access');
    else if (blendedRateB < blendedRateA * 0.7) bStrengths.push('significantly lower token costs');
    else if (blendedRateB < blendedRateA) bStrengths.push('better overall affordability');

    if (ctxA > ctxB * 1.5) aStrengths.push('substantially larger context window');
    else if (ctxA > ctxB) aStrengths.push('larger document context');

    if (ctxB > ctxA * 1.5) bStrengths.push('substantially larger context window');
    else if (ctxB > ctxA) bStrengths.push('larger document context');

    if (intellA > intellB + 3) aStrengths.push('superior reasoning and coding capability');
    else if (intellA > intellB) aStrengths.push('higher intelligence benchmark');

    if (intellB > intellA + 3) bStrengths.push('superior reasoning and coding capability');
    else if (intellB > intellA) bStrengths.push('higher intelligence benchmark');

    const aName = modelA.display_name || modelA.name;
    const bName = modelB.display_name || modelB.name;
    const aSummary = aStrengths.length > 0 ? aStrengths.join(' and ') : 'its balanced architecture';
    const bSummary = bStrengths.length > 0 ? bStrengths.join(' and ') : 'its specialized performance';

    decisionRecommendation = `Choose ${aName} for ${aSummary}, or select ${bName} if you need ${bSummary}.`;
  }

  return (
    <div className="space-y-10 pb-20">
      {/* ── Header ── */}
      <div>
        <h1 className={`text-3xl font-extrabold flex items-center gap-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          <Scale className="w-8 h-8 text-blue-500" />
          AI Model Comparison
        </h1>
        <p className={`text-sm mt-2 max-w-3xl leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Compare AI models side-by-side with real-time visual charts, unabridged architecture profiles, and cost benchmarks.
          Inspect complete model specifications or acquire token credits directly.
        </p>
      </div>

      {/* ── 4 Quick Preset Cards (Screenshot 3 Style) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            id: 'flagship',
            title: 'Flagship models',
            desc: 'The latest top-tier models from major frontier AI labs.',
            tags: 'Claude 3.5 Sonnet • GPT-4o',
            color: 'purple',
          },
          {
            id: 'code',
            title: 'Best for code',
            desc: 'Top scores on the Artificial Analysis coding index.',
            tags: 'Claude Sonnet • DeepSeek Coder',
            color: 'blue',
          },
          {
            id: 'affordable',
            title: 'Most affordable',
            desc: 'High efficiency, lowest-cost models for heavy workloads.',
            tags: 'DeepSeek Flash • Llama 3 Free',
            color: 'emerald',
          },
          {
            id: 'creative',
            title: 'Multimodal & Vision',
            desc: 'Frontier vision-language models for image analysis, charts, and document OCR.',
            tags: 'Claude 3.5 Sonnet (Vision) • GPT-4o (Vision)',
            color: 'amber',
          },
        ].map(p => (
          <div
            key={p.id}
            onClick={() => applyPreset(p.id)}
            className={`p-5 rounded-2xl border cursor-pointer transition-all hover:-translate-y-1 ${
              darkMode
                ? 'bg-[#121212] border-[#222] hover:border-blue-500/40 hover:bg-[#161616]'
                : 'bg-white border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{p.title}</span>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">{p.desc}</p>
            <div className="mt-3 pt-3 border-t border-[#1e1e1e] text-[11px] font-mono text-gray-500">
              {p.tags}
            </div>
          </div>
        ))}
      </div>

      {/* ── Slot Selector Header & Controls ── */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
          Arena Contenders
        </span>
        <div className="flex items-center gap-2">
          {onSwitchToCatalog && (
            <button
              onClick={onSwitchToCatalog}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                darkMode
                  ? 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-200'
                  : 'bg-gray-100 border-gray-200 hover:bg-gray-200 text-gray-700'
              }`}
              title="Return to Model Catalog"
            >
              <span>🗂️</span>
              <span>Browse Catalog</span>
            </button>
          )}
          {modelA && modelB && (
            <button
              onClick={handleSwap}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                darkMode
                  ? 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-200'
                  : 'bg-gray-100 border-gray-200 hover:bg-gray-200 text-gray-700'
              }`}
              title="Swap Slot A and Slot B"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-blue-400" />
              <span>Swap Models</span>
            </button>
          )}
          {(modelA || modelB) && (
            <button
              onClick={handleReset}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                darkMode
                  ? 'bg-white/5 border-white/10 hover:bg-red-500/10 hover:border-red-500/30 text-gray-400 hover:text-red-400'
                  : 'bg-gray-100 border-gray-200 hover:bg-red-50 hover:border-red-200 text-gray-600 hover:text-red-600'
              }`}
              title="Reset comparison"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* ── 2 Slots: Model A vs Model B (Dual Slot Selectors) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
        {/* Slot A */}
        <div
          onClick={() => openSlotPicker('A')}
          className={`p-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all flex items-center justify-between ${
            modelA
              ? darkMode ? 'bg-[#141414] border-blue-500/40' : 'bg-blue-50/30 border-blue-300'
              : darkMode ? 'bg-[#111] border-[#333] hover:border-[#555]' : 'bg-gray-50 border-gray-300'
          }`}
        >
          {modelA ? (
            <div className="flex items-center gap-4">
              <ProviderLogo provider={modelA.provider} modelId={modelA.id} size="xl" />
              <div>
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">{modelA.provider}</span>
                <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{modelA.display_name || modelA.name}</h3>
                <p className="text-xs text-gray-500 font-mono mt-0.5">{modelA.id}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-gray-400">
              <Plus className="w-5 h-5" />
              <span className="font-semibold text-sm">Select Model A</span>
            </div>
          )}
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 border border-[#333]">
            Change
          </span>
        </div>

        {/* Slot B */}
        <div
          onClick={() => openSlotPicker('B')}
          className={`p-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all flex items-center justify-between ${
            modelB
              ? darkMode ? 'bg-[#141414] border-purple-500/40' : 'bg-purple-50/30 border-purple-300'
              : darkMode ? 'bg-[#111] border-[#333] hover:border-[#555]' : 'bg-gray-50 border-gray-300'
          }`}
        >
          {modelB ? (
            <div className="flex items-center gap-4">
              <ProviderLogo provider={modelB.provider} modelId={modelB.id} size="xl" />
              <div>
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">{modelB.provider}</span>
                <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{modelB.display_name || modelB.name}</h3>
                <p className="text-xs text-gray-500 font-mono mt-0.5">{modelB.id}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-gray-400">
              <Plus className="w-5 h-5" />
              <span className="font-semibold text-sm">Select Model B</span>
            </div>
          )}
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 border border-[#333]">
            Change
          </span>
        </div>
      </div>

      {/* ── Empty State / Selector Helper when either model is missing ── */}
      {(!modelA || !modelB) && (
        <div className={`p-10 rounded-2xl border text-center ${darkMode ? 'bg-[#121214] border-[#222]' : 'bg-white border-gray-200'} space-y-4`}>
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mx-auto flex items-center justify-center">
            <Scale className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {!modelA && !modelB
                ? 'Select Two Models to Compare'
                : !modelA
                ? 'Select Model A to Complete Comparison'
                : 'Select Model B to Complete Comparison'}
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              {!modelA && !modelB
                ? 'Pick two AI models from the slots above or click one of the quick presets to analyze architecture, token rates, and performance benchmarks side-by-side.'
                : `You have selected ${(!modelA ? modelB : modelA).display_name || (!modelA ? modelB : modelA).name}. Click the empty slot above to choose a second model.`}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            {!modelA && (
              <button
                onClick={() => openSlotPicker('A')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all hover:scale-105"
              >
                <Plus className="w-4 h-4" /> Pick Model A
              </button>
            )}
            {!modelB && (
              <button
                onClick={() => openSlotPicker('B')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-2 shadow-md shadow-purple-500/20 transition-all hover:scale-105"
              >
                <Plus className="w-4 h-4" /> Pick Model B
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Side-by-Side Comparison Matrix Table ── */}
      {modelA && modelB && (
        <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-[#111] border-[#222]' : 'bg-white border-gray-200'}`}>
          <div className="overflow-x-auto min-w-full">
            <div className="min-w-[680px]">
              {/* Header Action Row */}
              <div className="grid grid-cols-12 border-b border-[#222] p-5 items-center">
                <div className="col-span-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Metric & Features
                </div>
                <div className="col-span-4 flex items-center justify-between pr-4 gap-2">
                  <span className={`font-bold text-sm line-clamp-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{modelA.display_name || modelA.name}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setSelectedDetailModel(modelA)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-200 hover:text-white border border-[#333] flex items-center gap-1 transition-colors"
                      title="View full specs & benchmarks"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-400" /> Details
                    </button>
                    {isMediaModel(modelA) ? (
                      <button
                        onClick={() => setFalMediaModel(modelA)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white flex items-center gap-1 shadow-sm transition-all hover:scale-[1.02]"
                        title="Launch Media Generation Studio"
                      >
                        {isVideoModel(modelA) ? <Film className="w-3.5 h-3.5" /> : isAudioModel(modelA) ? <Volume2 className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                        Generate
                      </button>
                    ) : modelA.is_free ? (
                      <button
                        onClick={() => navigate(`/dashboard?model=${encodeURIComponent(modelA.id)}`)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 transition-colors"
                        title="Chat with free model"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Chat Free
                      </button>
                    ) : isPro ? (
                      <button
                        onClick={() => navigate(`/dashboard?model=${encodeURIComponent(modelA.id)}`)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1 shadow-sm transition-all hover:scale-[1.02]"
                        title="Chat with model in Studio"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Chat
                      </button>
                    ) : (
                      <button
                        onClick={() => setUpgradeTargetModel(modelA)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white flex items-center gap-1 shadow-sm transition-all hover:scale-[1.02]"
                        title="Unlock with Netroot Pro"
                      >
                        <Lock className="w-3.5 h-3.5" /> Unlock Pro
                      </button>
                    )}
                  </div>
                </div>
                <div className="col-span-4 flex items-center justify-between pr-4 gap-2">
                  <span className={`font-bold text-sm line-clamp-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{modelB.display_name || modelB.name}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setSelectedDetailModel(modelB)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-200 hover:text-white border border-[#333] flex items-center gap-1 transition-colors"
                      title="View full specs & benchmarks"
                    >
                      <Eye className="w-3.5 h-3.5 text-purple-400" /> Details
                    </button>
                    {isMediaModel(modelB) ? (
                      <button
                        onClick={() => setFalMediaModel(modelB)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white flex items-center gap-1 shadow-sm transition-all hover:scale-[1.02]"
                        title="Launch Media Generation Studio"
                      >
                        {isVideoModel(modelB) ? <Film className="w-3.5 h-3.5" /> : isAudioModel(modelB) ? <Volume2 className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                        Generate
                      </button>
                    ) : modelB.is_free ? (
                      <button
                        onClick={() => navigate(`/dashboard?model=${encodeURIComponent(modelB.id)}`)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 transition-colors"
                        title="Chat with free model"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Chat Free
                      </button>
                    ) : isPro ? (
                      <button
                        onClick={() => navigate(`/dashboard?model=${encodeURIComponent(modelB.id)}`)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1 shadow-sm transition-all hover:scale-[1.02]"
                        title="Chat with model in Studio"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Chat
                      </button>
                    ) : (
                      <button
                        onClick={() => setUpgradeTargetModel(modelB)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white flex items-center gap-1 shadow-sm transition-all hover:scale-[1.02]"
                        title="Unlock with Netroot Pro"
                      >
                        <Lock className="w-3.5 h-3.5" /> Unlock Pro
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Section: Overview */}
              <div className="divide-y divide-[#1c1c1c] text-xs">
                {/* Provider */}
                <div className="grid grid-cols-12 p-4 items-center">
                  <span className="col-span-4 text-gray-400 font-medium">Provider & Lab</span>
                  <span className={`col-span-4 font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{modelA.provider}</span>
                  <span className={`col-span-4 font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{modelB.provider}</span>
                </div>

                {/* Context length / Resolution */}
                <div className="grid grid-cols-12 p-4 items-center">
                  <span className="col-span-4 text-gray-400 font-medium">
                    {isMediaModel(modelA) || isMediaModel(modelB) ? 'Capacity / Resolution' : 'Context Window'}
                  </span>
                  <span className={`col-span-4 font-mono font-bold ${
                    isMediaModel(modelA) ? 'text-purple-400' : (modelA.context_length || 0) >= (modelB.context_length || 0) ? 'text-emerald-400' : 'text-gray-300'
                  }`}>
                    {isMediaModel(modelA)
                      ? (isVideoModel(modelA) ? '1080p HD Motion' : isAudioModel(modelA) ? '44.1kHz Stereo' : 'Up to 2K High-Res')
                      : (modelA.context_length ? `${Math.round(modelA.context_length / 1000)}k tokens` : '—')}
                    {!isMediaModel(modelA) && !isMediaModel(modelB) && (modelA.context_length || 0) > (modelB.context_length || 0) && ' 🏆'}
                  </span>
                  <span className={`col-span-4 font-mono font-bold ${
                    isMediaModel(modelB) ? 'text-purple-400' : (modelB.context_length || 0) >= (modelA.context_length || 0) ? 'text-emerald-400' : 'text-gray-300'
                  }`}>
                    {isMediaModel(modelB)
                      ? (isVideoModel(modelB) ? '1080p HD Motion' : isAudioModel(modelB) ? '44.1kHz Stereo' : 'Up to 2K High-Res')
                      : (modelB.context_length ? `${Math.round(modelB.context_length / 1000)}k tokens` : '—')}
                    {!isMediaModel(modelA) && !isMediaModel(modelB) && (modelB.context_length || 0) > (modelA.context_length || 0) && ' 🏆'}
                  </span>
                </div>

                {/* Pricing Section */}
                <div className="grid grid-cols-12 p-4 items-center bg-[#141414]">
                  <span className="col-span-4 font-bold text-blue-400 uppercase tracking-wider text-[11px]">
                    {isMediaModel(modelA) || isMediaModel(modelB) ? 'Pricing (Per Render / 1M)' : 'Pricing (Per 1M Tokens)'}
                  </span>
                  <div className="col-span-4 font-mono">
                    {isMediaModel(modelA) ? (
                      <span className="text-purple-400 font-bold">
                        ${modelA.calculated_pricing?.image ? Number(modelA.calculated_pricing.image).toFixed(3) : (isVideoModel(modelA) ? '0.250' : '0.050')} / render
                      </span>
                    ) : modelA.is_free ? (
                      <span className="text-emerald-400 font-bold">100% FREE</span>
                    ) : (
                      <div>
                        <span className="text-white font-bold">${(modelA.calculated_pricing?.prompt * 1000000 || 0).toFixed(2)} in</span>
                        <span className="text-gray-500 mx-1.5">/</span>
                        <span className="text-white font-bold">${(modelA.calculated_pricing?.completion * 1000000 || 0).toFixed(2)} out</span>
                      </div>
                    )}
                  </div>
                  <div className="col-span-4 font-mono">
                    {isMediaModel(modelB) ? (
                      <span className="text-purple-400 font-bold">
                        ${modelB.calculated_pricing?.image ? Number(modelB.calculated_pricing.image).toFixed(3) : (isVideoModel(modelB) ? '0.250' : '0.050')} / render
                      </span>
                    ) : modelB.is_free ? (
                      <span className="text-emerald-400 font-bold">100% FREE</span>
                    ) : (
                      <div>
                        <span className="text-white font-bold">${(modelB.calculated_pricing?.prompt * 1000000 || 0).toFixed(2)} in</span>
                        <span className="text-gray-500 mx-1.5">/</span>
                        <span className="text-white font-bold">${(modelB.calculated_pricing?.completion * 1000000 || 0).toFixed(2)} out</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Modalities */}
                <div className="grid grid-cols-12 p-4 items-center">
                  <span className="col-span-4 text-gray-400 font-medium">Supported Modalities</span>
                  <span className="col-span-4 text-gray-200">{(modelA.modalities || ['text']).join(', ')}</span>
                  <span className="col-span-4 text-gray-200">{(modelB.modalities || ['text']).join(', ')}</span>
                </div>

                {/* Benchmarks / Intelligence */}
                <div className="grid grid-cols-12 p-4 items-center">
                  <span className="col-span-4 text-gray-400 font-medium">Intelligence Index (0-100)</span>
                  <span className="col-span-4 font-mono font-bold text-gray-200">
                    {intellA} / 100 {benchA.isVerified && '✓'}
                  </span>
                  <span className="col-span-4 font-mono font-bold text-gray-200">
                    {intellB} / 100 {benchB.isVerified && '✓'}
                  </span>
                </div>

                {/* Coding Benchmark */}
                <div className="grid grid-cols-12 p-4 items-center">
                  <span className="col-span-4 text-gray-400 font-medium">Coding Benchmark (0-100)</span>
                  <span className="col-span-4 font-mono font-bold text-gray-200">
                    {codingA} / 100 {benchA.isVerified && '✓'}
                  </span>
                  <span className="col-span-4 font-mono font-bold text-gray-200">
                    {codingB} / 100 {benchB.isVerified && '✓'}
                  </span>
                </div>

                {/* Tool / Function calling */}
                <div className="grid grid-cols-12 p-4 items-center">
                  <span className="col-span-4 text-gray-400 font-medium">Tool Use / Function Calling</span>
                  <span className="col-span-4 font-medium text-emerald-400">
                    {modelA.supported_parameters?.includes('tools') ? '✅ Supported' : '—'}
                  </span>
                  <span className="col-span-4 font-medium text-emerald-400">
                    {modelB.supported_parameters?.includes('tools') ? '✅ Supported' : '—'}
                  </span>
                </div>

                {/* Structured Output */}
                <div className="grid grid-cols-12 p-4 items-center">
                  <span className="col-span-4 text-gray-400 font-medium">Structured Outputs / JSON</span>
                  <span className="col-span-4 font-medium text-gray-300">
                    {modelA.supported_parameters?.includes('structured_outputs') ? '✅ Supported' : '—'}
                  </span>
                  <span className="col-span-4 font-medium text-gray-300">
                    {modelB.supported_parameters?.includes('structured_outputs') ? '✅ Supported' : '—'}
                  </span>
                </div>

                {/* Uptime / Reliability */}
                <div className="grid grid-cols-12 p-4 items-center">
                  <span className="col-span-4 text-gray-400 font-medium">Uptime & Latency Reliability</span>
                  <div className="col-span-4 flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[...Array(8)].map((_, i) => (
                        <div key={i} className="w-1.5 h-3.5 rounded-sm bg-emerald-400" />
                      ))}
                    </div>
                    <span className="text-gray-400 font-mono text-[11px]">{modelA.uptime_pct || 99.8}%</span>
                  </div>
                  <div className="col-span-4 flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[...Array(8)].map((_, i) => (
                        <div key={i} className="w-1.5 h-3.5 rounded-sm bg-emerald-400" />
                      ))}
                    </div>
                    <span className="text-gray-400 font-mono text-[11px]">{modelB.uptime_pct || 99.8}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Section 1: Visual Comparison & Benchmark Charts ── */}
      {modelA && modelB && (
        <div className={`p-6 sm:p-8 rounded-2xl border ${darkMode ? 'bg-[#111113] border-[#222]' : 'bg-white border-gray-200'} space-y-8`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222] pb-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h2 className={`text-lg font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Visual Performance & Pricing Benchmarks
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Direct graphical comparison across token rates, context capacity, and reasoning benchmarks
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-blue-400" /> {modelA.display_name || modelA.name}
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-purple-400" /> {modelB.display_name || modelB.name}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Chart 1: Cost per 1M Prompt Tokens or Media Render */}
            <div className="p-5 rounded-xl bg-black/40 border border-[#1f1f23] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    {isMediaModel(modelA) && isMediaModel(modelB) ? 'Media Generation Cost (per Render)' : 'Prompt Input Cost (per 1M)'}
                  </span>
                  <span className="text-[10px] text-gray-500 font-normal">
                    {isMediaModel(modelA) && isMediaModel(modelB) ? 'Direct compute inference cost' : 'Lower rate = More affordable'}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                  {priceVerdict}
                </span>
              </div>

              {/* Model A Prompt Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate max-w-[200px]">
                    <span className="text-gray-400 truncate">{modelA.display_name || modelA.name}</span>
                    {promptRateA < promptRateB && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-emerald-500/20 text-emerald-400 shrink-0">
                        🟢 Best Value
                      </span>
                    )}
                  </div>
                  <span className="font-mono font-bold text-blue-400 shrink-0">
                    {isMediaModel(modelA)
                      ? `$${Number(modelA.calculated_pricing?.image || (isVideoModel(modelA) ? 0.25 : 0.05)).toFixed(3)}`
                      : (modelA.is_free ? 'FREE' : `$${promptRateA.toFixed(2)}`)}
                  </span>
                </div>
                <div className="h-3 rounded-full bg-[#1a1a1e] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      modelA.is_free || promptRateA < promptRateB
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-500'
                    }`}
                    style={{ width: `${modelA.is_free ? 0 : Math.max(6, Math.min(100, (promptRateA / (maxPrompt || 1)) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Model B Prompt Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate max-w-[200px]">
                    <span className="text-gray-400 truncate">{modelB.display_name || modelB.name}</span>
                    {promptRateB < promptRateA && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-emerald-500/20 text-emerald-400 shrink-0">
                        🟢 Best Value
                      </span>
                    )}
                  </div>
                  <span className="font-mono font-bold text-purple-400 shrink-0">
                    {isMediaModel(modelB)
                      ? `$${Number(modelB.calculated_pricing?.image || (isVideoModel(modelB) ? 0.25 : 0.05)).toFixed(3)}`
                      : (modelB.is_free ? 'FREE' : `$${promptRateB.toFixed(2)}`)}
                  </span>
                </div>
                <div className="h-3 rounded-full bg-[#1a1a1e] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      modelB.is_free || promptRateB < promptRateA
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        : 'bg-gradient-to-r from-purple-600 to-pink-500'
                    }`}
                    style={{ width: `${modelB.is_free ? 0 : Math.max(6, Math.min(100, (promptRateB / (maxPrompt || 1)) * 100))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Chart 2: Cost per 1M Completion Tokens */}
            <div className="p-5 rounded-xl bg-black/40 border border-[#1f1f23] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-400" /> Completion Output Cost (per 1M)
                  </span>
                  <span className="text-[10px] text-gray-500 font-normal">Output token generation rate</span>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                  {compVerdict}
                </span>
              </div>

              {/* Model A Completion Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate max-w-[200px]">
                    <span className="text-gray-400 truncate">{modelA.display_name || modelA.name}</span>
                    {compRateA < compRateB && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-emerald-500/20 text-emerald-400 shrink-0">
                        🟢 Best Value
                      </span>
                    )}
                  </div>
                  <span className="font-mono font-bold text-blue-400 shrink-0">
                    {modelA.is_free ? 'FREE' : `$${compRateA.toFixed(2)}`}
                  </span>
                </div>
                <div className="h-3 rounded-full bg-[#1a1a1e] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      modelA.is_free || compRateA < compRateB
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        : 'bg-gradient-to-r from-blue-600 to-cyan-400'
                    }`}
                    style={{ width: `${modelA.is_free ? 0 : Math.max(6, Math.min(100, (compRateA / (maxComp || 1)) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Model B Completion Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate max-w-[200px]">
                    <span className="text-gray-400 truncate">{modelB.display_name || modelB.name}</span>
                    {compRateB < compRateA && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-emerald-500/20 text-emerald-400 shrink-0">
                        🟢 Best Value
                      </span>
                    )}
                  </div>
                  <span className="font-mono font-bold text-purple-400 shrink-0">
                    {modelB.is_free ? 'FREE' : `$${compRateB.toFixed(2)}`}
                  </span>
                </div>
                <div className="h-3 rounded-full bg-[#1a1a1e] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      modelB.is_free || compRateB < compRateA
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        : 'bg-gradient-to-r from-purple-600 to-pink-400'
                    }`}
                    style={{ width: `${modelB.is_free ? 0 : Math.max(6, Math.min(100, (compRateB / (maxComp || 1)) * 100))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Chart 3: Context Window Scale (Capacity) or Resolution */}
            <div className="p-5 rounded-xl bg-black/40 border border-[#1f1f23] space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-gray-300 flex items-center gap-2 shrink-0">
                  <Layers className="w-4 h-4 text-blue-400" />
                  {isMediaModel(modelA) || isMediaModel(modelB) ? 'Capacity & Resolution Output' : 'Context Window Memory (Tokens)'}
                </span>
                <span className="text-[11px] font-mono text-blue-400 font-semibold text-right shrink-0">
                  {ctxVerdict}
                </span>
              </div>

              {/* Model A Context Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400 truncate max-w-[200px]">{modelA.display_name || modelA.name}</span>
                  <span className={`font-mono font-bold flex items-center gap-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {isMediaModel(modelA)
                      ? (isVideoModel(modelA) ? '1080p HD Motion' : isAudioModel(modelA) ? '44.1kHz Stereo' : 'Up to 2K High-Res')
                      : (ctxA >= 1000000 ? `${(ctxA / 1000000).toFixed(1)}M` : `${Math.round(ctxA / 1000)}k tokens`)}
                    {!isMediaModel(modelA) && !isMediaModel(modelB) && ctxA > ctxB && ' 🏆'}
                  </span>
                </div>
                <div className="h-3 rounded-full bg-[#1a1a1e] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-400 transition-all duration-500"
                    style={{ width: `${isMediaModel(modelA) ? 100 : Math.max(6, Math.min(100, (ctxA / maxCtx) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Model B Context Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400 truncate max-w-[200px]">{modelB.display_name || modelB.name}</span>
                  <span className={`font-mono font-bold flex items-center gap-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {isMediaModel(modelB)
                      ? (isVideoModel(modelB) ? '1080p HD Motion' : isAudioModel(modelB) ? '44.1kHz Stereo' : 'Up to 2K High-Res')
                      : (ctxB >= 1000000 ? `${(ctxB / 1000000).toFixed(1)}M` : `${Math.round(ctxB / 1000)}k tokens`)}
                    {!isMediaModel(modelA) && !isMediaModel(modelB) && ctxB > ctxA && ' 🏆'}
                  </span>
                </div>
                <div className="h-3 rounded-full bg-[#1a1a1e] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-600 to-violet-400 transition-all duration-500"
                    style={{ width: `${isMediaModel(modelB) ? 100 : Math.max(6, Math.min(100, (ctxB / maxCtx) * 100))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Chart 4: Intelligence & Reasoning Benchmark */}
            <div className="p-5 rounded-xl bg-black/40 border border-[#1f1f23] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                    <Brain className="w-4 h-4 text-purple-400" /> Artificial Analysis Intelligence Score
                  </span>
                  <span className="text-[10px] text-gray-500 font-normal">Standardized frontier rating (0 - 100)</span>
                </div>
                <span className="text-[11px] font-mono text-purple-400 font-semibold">
                  {intellA > intellB
                    ? `${modelA.display_name || modelA.name} leads (+${intellA - intellB} pts)`
                    : intellB > intellA
                    ? `${modelB.display_name || modelB.name} leads (+${intellB - intellA} pts)`
                    : 'Equivalent Intelligence'}
                </span>
              </div>

              {/* Model A Intelligence */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400 truncate max-w-[200px]">{modelA.display_name || modelA.name}</span>
                  <span className="font-mono font-bold text-blue-400">
                    {intellA} / 100 {benchA.isVerified && '⭐'}
                  </span>
                </div>
                <div className="h-3 rounded-full bg-[#1a1a1e] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(10, intellA))}%` }}
                  />
                </div>
              </div>

              {/* Model B Intelligence */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400 truncate max-w-[200px]">{modelB.display_name || modelB.name}</span>
                  <span className="font-mono font-bold text-purple-400">
                    {intellB} / 100 {benchB.isVerified && '⭐'}
                  </span>
                </div>
                <div className="h-3 rounded-full bg-[#1a1a1e] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(10, intellB))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Section 2: Full Model Profiles & Architecture Overview (Aakhu Dekhay Evu) ── */}
      {modelA && modelB && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Full Model Architecture & Technical Descriptions</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Complete, unabridged official model documentation, capability breakdown, and architectural notes
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400">
              Unabridged Documentation
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Model A Full Card */}
            <div
              className={`p-6 rounded-2xl border flex flex-col justify-between transition-all ${
                darkMode ? 'bg-[#121215] border-[#222]' : 'bg-white border-gray-200 shadow-sm'
              }`}
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400 text-sm">
                      {modelA.provider?.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">{modelA.provider}</span>
                        {modelA.custom_badge && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                            {modelA.custom_badge}
                          </span>
                        )}
                        {modelA.is_free && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                            100% Free
                          </span>
                        )}
                      </div>
                      <h3 className={`text-base font-bold mt-0.5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{modelA.display_name || modelA.name}</h3>
                      <p className="text-xs text-gray-500 font-mono">{modelA.id}</p>
                    </div>
                  </div>
                </div>

                {/* Complete Unabridged Description Box (Aakhu Dekhay Evu) */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-blue-400" /> Full Description & Architecture
                  </span>
                  <div className="p-4 rounded-xl bg-[#09090b] border border-[#222] text-xs text-gray-300 leading-relaxed whitespace-pre-line text-left select-text">
                    {getFullModelDescription(modelA) || 'Full technical description is not available in the model index.'}
                  </div>
                </div>

                {/* Key Feature Badges */}
                <div className="space-y-2 pt-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Supported Capabilities</span>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2 py-1 rounded-lg text-[11px] bg-white/5 border border-white/10 text-gray-300">
                      Context: {modelA.context_length ? `${Math.round(modelA.context_length / 1000)}k tokens` : '—'}
                    </span>
                    {(modelA.modalities || ['text']).map(m => (
                      <span key={m} className="px-2 py-1 rounded-lg text-[11px] bg-blue-500/10 border border-blue-500/20 text-blue-300 capitalize">
                        {m}
                      </span>
                    ))}
                    {modelA.supported_parameters?.includes('tools') && (
                      <span className="px-2 py-1 rounded-lg text-[11px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                        Function Calling
                      </span>
                    )}
                    {modelA.supported_parameters?.includes('structured_outputs') && (
                      <span className="px-2 py-1 rounded-lg text-[11px] bg-purple-500/10 border border-purple-500/20 text-purple-300">
                        Structured JSON
                      </span>
                    )}
                    {modelA.supported_parameters?.includes('reasoning') && (
                      <span className="px-2 py-1 rounded-lg text-[11px] bg-amber-500/10 border border-amber-500/20 text-amber-300">
                        Chain of Thought
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="mt-6 pt-4 border-t border-[#1f1f23] flex items-center justify-between gap-3">
                <button
                  onClick={() => setSelectedDetailModel(modelA)}
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-white border border-[#333] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-400" /> View Full Specs Modal
                </button>
                {isMediaModel(modelA) ? (
                  <button
                    onClick={() => setFalMediaModel(modelA)}
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 transition-all hover:scale-[1.01]"
                  >
                    {isVideoModel(modelA) ? <Film className="w-3.5 h-3.5" /> : isAudioModel(modelA) ? <Volume2 className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                    {isVideoModel(modelA) ? 'Generate Video' : isAudioModel(modelA) ? 'Generate Audio' : 'Generate Image'}
                  </button>
                ) : modelA.is_free ? (
                  <button
                    onClick={() => startChat(modelA.id)}
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Start Free Chat
                  </button>
                ) : isPro ? (
                  <button
                    onClick={() => startChat(modelA.id)}
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 transition-all hover:scale-[1.01]"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Chat in Studio
                  </button>
                ) : (
                  <button
                    onClick={() => setUpgradeTargetModel(modelA)}
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 transition-all hover:scale-[1.01]"
                  >
                    <CreditCard className="w-3.5 h-3.5" /> Unlock / Pro Credits
                  </button>
                )}
              </div>
            </div>

            {/* Model B Full Card */}
            <div
              className={`p-6 rounded-2xl border flex flex-col justify-between transition-all ${
                darkMode ? 'bg-[#121215] border-[#222]' : 'bg-white border-gray-200 shadow-sm'
              }`}
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center font-bold text-purple-400 text-sm">
                      {modelB.provider?.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">{modelB.provider}</span>
                        {modelB.custom_badge && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                            {modelB.custom_badge}
                          </span>
                        )}
                        {modelB.is_free && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                            100% Free
                          </span>
                        )}
                      </div>
                      <h3 className={`text-base font-bold mt-0.5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{modelB.display_name || modelB.name}</h3>
                      <p className="text-xs text-gray-500 font-mono">{modelB.id}</p>
                    </div>
                  </div>
                </div>

                {/* Complete Unabridged Description Box (Aakhu Dekhay Evu) */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-purple-400" /> Full Description & Architecture
                  </span>
                  <div className="p-4 rounded-xl bg-[#09090b] border border-[#222] text-xs text-gray-300 leading-relaxed whitespace-pre-line text-left select-text">
                    {getFullModelDescription(modelB) || 'Full technical description is not available in the model index.'}
                  </div>
                </div>

                {/* Key Feature Badges */}
                <div className="space-y-2 pt-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Supported Capabilities</span>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2 py-1 rounded-lg text-[11px] bg-white/5 border border-white/10 text-gray-300">
                      Context: {modelB.context_length ? `${Math.round(modelB.context_length / 1000)}k tokens` : '—'}
                    </span>
                    {(modelB.modalities || ['text']).map(m => (
                      <span key={m} className="px-2 py-1 rounded-lg text-[11px] bg-purple-500/10 border border-purple-500/20 text-purple-300 capitalize">
                        {m}
                      </span>
                    ))}
                    {modelB.supported_parameters?.includes('tools') && (
                      <span className="px-2 py-1 rounded-lg text-[11px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                        Function Calling
                      </span>
                    )}
                    {modelB.supported_parameters?.includes('structured_outputs') && (
                      <span className="px-2 py-1 rounded-lg text-[11px] bg-purple-500/10 border border-purple-500/20 text-purple-300">
                        Structured JSON
                      </span>
                    )}
                    {modelB.supported_parameters?.includes('reasoning') && (
                      <span className="px-2 py-1 rounded-lg text-[11px] bg-amber-500/10 border border-amber-500/20 text-amber-300">
                        Chain of Thought
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="mt-6 pt-4 border-t border-[#1f1f23] flex items-center justify-between gap-3">
                <button
                  onClick={() => setSelectedDetailModel(modelB)}
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-white border border-[#333] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-purple-400" /> View Full Specs Modal
                </button>
                {isMediaModel(modelB) ? (
                  <button
                    onClick={() => setFalMediaModel(modelB)}
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/20 transition-all hover:scale-[1.01]"
                  >
                    {isVideoModel(modelB) ? <Film className="w-3.5 h-3.5" /> : isAudioModel(modelB) ? <Volume2 className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                    {isVideoModel(modelB) ? 'Generate Video' : isAudioModel(modelB) ? 'Generate Audio' : 'Generate Image'}
                  </button>
                ) : modelB.is_free ? (
                  <button
                    onClick={() => startChat(modelB.id)}
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Start Free Chat
                  </button>
                ) : isPro ? (
                  <button
                    onClick={() => startChat(modelB.id)}
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/20 transition-all hover:scale-[1.01]"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Chat in Studio
                  </button>
                ) : (
                  <button
                    onClick={() => setUpgradeTargetModel(modelB)}
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/20 transition-all hover:scale-[1.01]"
                  >
                    <CreditCard className="w-3.5 h-3.5" /> Unlock / Pro Credits
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Section 3: Netroot AI Recommendation & Purchase Advisory ── */}
      {modelA && modelB && (
        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-950/20 via-[#121216] to-purple-950/20 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h3 className={`text-lg font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Netroot AI Recommendation & Advisory
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Automated comparison verdict to help you select and purchase the right AI architecture
                </p>
              </div>
            </div>
          </div>

          {/* 3 Comparative Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1: Budget Leader */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <DollarSign className="w-4 h-4" /> Cost & Budget Leader
              </div>
              <h4 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {budgetLeader ? (budgetLeader.display_name || budgetLeader.name) : isBothFree ? 'Both Models (100% Free)' : 'Equal Token Pricing'}
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                {isBothFree
                  ? 'Both models provide 100% Free access on Netroot AI with zero credit deductions.'
                  : budgetLeader
                  ? (budgetLeader.is_free
                      ? 'Free tier available without credit deductions. Perfect for testing, development, and low-scale workloads.'
                      : `Provides lowest blended token rates ($${(budgetLeader === modelA ? blendedRateA : blendedRateB).toFixed(2)}/1M blended). Optimal for high-throughput batch inference.`)
                  : `Both architectures feature equivalent blended token costs ($${blendedRateA.toFixed(2)}/1M).`}
              </p>
              {budgetLeader && (
                <button
                  onClick={() => setSelectedDetailModel(budgetLeader)}
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 pt-1"
                >
                  Inspect Pricing <ArrowUpRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* 2: Context Window Leader */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
                <Zap className="w-4 h-4" /> Large Context Leader
              </div>
              <h4 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {contextLeader ? (contextLeader.display_name || contextLeader.name) : `Equal Memory (${ctxA >= 1000000 ? `${(ctxA / 1000000).toFixed(1)}M` : `${Math.round(ctxA / 1000)}k`} tokens)`}
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                {contextLeader
                  ? `Features ${contextLeader.context_length ? `${Math.round(contextLeader.context_length / 1000)}k tokens` : 'massive memory'}. Ideal for processing full code repositories, large PDFs, and long conversation threads.`
                  : 'Both models feature the exact same context window memory capacity.'}
              </p>
              {contextLeader && (
                <button
                  onClick={() => setSelectedDetailModel(contextLeader)}
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 pt-1"
                >
                  Inspect Context <ArrowUpRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* 3: Reasoning Leader */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
                <Brain className="w-4 h-4" /> Intelligence & Reasoning
              </div>
              <h4 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {reasoningLeader ? (reasoningLeader.display_name || reasoningLeader.name) : `Balanced (${intellA}/100 Index)`}
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                {reasoningLeader
                  ? 'Scores highest on complex logic synthesis, autonomous tool use, and multi-step reasoning capabilities.'
                  : 'Both models demonstrate equivalent benchmark ratings on logical reasoning and synthetic intelligence tasks.'}
              </p>
              {reasoningLeader && (
                <button
                  onClick={() => setSelectedDetailModel(reasoningLeader)}
                  className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 pt-1"
                >
                  Inspect Benchmarks <ArrowUpRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Action Recommendation Banner */}
          <div className="p-4 sm:p-5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 shrink-0">
                <Lightbulb className="w-5 h-5" />
              </div>
              <div>
                <h4 className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-white' : 'text-gray-900'}`}>Final Decision Verdict</h4>
                <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                  {decisionRecommendation}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
              <button
                onClick={() => setSelectedDetailModel(modelA)}
                className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02] flex items-center justify-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" /> View {modelA.display_name || modelA.name}
              </button>
              <button
                onClick={() => setSelectedDetailModel(modelB)}
                className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/20 transition-all hover:scale-[1.02] flex items-center justify-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" /> View {modelB.display_name || modelB.name}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Split Master-Detail Model Picker Modal (Screenshot 2 Style) ── */}
      {activeSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`w-full max-w-4xl h-[620px] rounded-2xl border flex flex-col overflow-hidden shadow-2xl ${
              darkMode ? 'bg-[#0d0d0d] border-[#222]' : 'bg-white border-gray-200'
            }`}
          >
            {/* Modal Header */}
            <div className={`p-4 border-b flex items-center justify-between ${darkMode ? 'border-[#222]' : 'border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>Select Model {activeSlot}</h3>
                <span className="text-xs text-gray-500">({modalFiltered.length} models available)</span>
              </div>
              <button
                onClick={() => setActiveSlot(null)}
                className={`p-1 rounded-lg ${darkMode ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search and Filters */}
            <div className={`p-4 border-b flex items-center justify-between gap-3 ${darkMode ? 'border-[#222]' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2 overflow-x-auto">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'free', label: '🟢 Free' },
                  { id: 'vision', label: '👁️ Vision' },
                  { id: 'text', label: '📝 Text' },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setModalFilter(f.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      modalFilter === f.id
                        ? 'bg-blue-600 text-white'
                        : darkMode
                        ? 'bg-[#181818] text-gray-400 hover:text-white'
                        : 'bg-gray-100 text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className={`flex items-center gap-2 border rounded-lg px-3 py-1.5 w-60 ${darkMode ? 'border-[#333] bg-[#141414]' : 'border-gray-300 bg-gray-50'}`}>
                <Search className="w-3.5 h-3.5 text-gray-500" />
                <input
                  type="text"
                  value={modalSearch}
                  onChange={e => setModalSearch(e.target.value)}
                  placeholder="Search models..."
                  className={`bg-transparent text-xs outline-none w-full placeholder-gray-500 ${darkMode ? 'text-white' : 'text-gray-900'}`}
                  autoFocus
                />
              </div>
            </div>

            {/* Split Body: Left List & Right Live Preview */}
            <div className="flex-1 grid grid-cols-12 overflow-hidden">
              {/* Left Column: Scrollable Models List */}
              <div className={`col-span-7 border-r overflow-y-auto ${darkMode ? 'border-[#222] divide-y divide-[#181818]' : 'border-gray-200 divide-y divide-gray-100'}`}>
                {modalFiltered.map(m => {
                  const isSelected = (activeSlot === 'A' ? modelA?.id : modelB?.id) === m.id;
                  const isHovered = (hoveredModel?.id || (activeSlot === 'A' ? modelA?.id : modelB?.id)) === m.id;

                  return (
                    <div
                      key={m.id}
                      onMouseEnter={() => setHoveredModel(m)}
                      onClick={() => handleSelectFromModal(m)}
                      className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                        isHovered
                          ? 'bg-blue-600/10'
                          : darkMode
                          ? 'hover:bg-white/[0.03]'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-bold ${
                          darkMode ? 'bg-white/5 border-white/10 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-700'
                        }`}>
                          {m.provider?.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className={`text-xs font-semibold leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {m.display_name || m.name}
                          </div>
                          <div className="text-[10px] text-gray-500 font-mono mt-0.5">{m.provider}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {m.is_free ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-emerald-500/10 text-emerald-400">
                            FREE
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-400 font-mono">
                            ${(m.calculated_pricing?.prompt * 1000000 || 0).toFixed(2)}/M
                          </span>
                        )}
                        {isSelected && <Check className="w-4 h-4 text-blue-500" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Live Hover Preview (Screenshot 2 Masterpiece) */}
              {(() => {
                const activePreview = hoveredModel || modalFiltered[0] || (activeSlot === 'A' ? modelA : modelB);
                return (
                  <div className={`col-span-5 p-6 overflow-y-auto flex flex-col justify-between ${darkMode ? 'bg-[#0e0e0e]' : 'bg-gray-50'}`}>
                    {activePreview ? (
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <ProviderLogo provider={activePreview.provider} modelId={activePreview.id} size="lg" />
                          <div>
                            <h4 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{activePreview.display_name || activePreview.name}</h4>
                            <span className="text-[10px] text-gray-500 font-mono">{activePreview.id}</span>
                          </div>
                        </div>

                        <p className="text-xs text-gray-400 leading-relaxed mt-3">
                          {getFullModelDescription(activePreview) || 'Multimodal reasoning model optimized for low latency and high quality outputs.'}
                        </p>

                        <div className="space-y-3 mt-6 pt-4 border-t border-[#222] text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Context Window</span>
                            <span className="font-mono text-gray-300 font-bold">
                              {activePreview.context_length ? `${Math.round(activePreview.context_length / 1000)}k tokens` : '—'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Input Price</span>
                            <span className="font-mono text-gray-300 font-bold">
                              {activePreview.is_free ? 'FREE' : `$${(activePreview.calculated_pricing?.prompt * 1000000 || 0).toFixed(2)} / 1M`}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Output Price</span>
                            <span className="font-mono text-gray-300 font-bold">
                              {activePreview.is_free ? 'FREE' : `$${(activePreview.calculated_pricing?.completion * 1000000 || 0).toFixed(2)} / 1M`}
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-gray-500">Uptime Status</span>
                            <div className="flex gap-0.5">
                              {[...Array(10)].map((_, i) => (
                                <div key={i} className="w-1.5 h-3.5 rounded-sm bg-emerald-400" />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-gray-500">
                        Select or hover over a model to see live details
                      </div>
                    )}

                    {activePreview && (
                      <button
                        onClick={() => handleSelectFromModal(activePreview)}
                        className="w-full py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-500/20 mt-6"
                      >
                        Select this Model
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── Deep-Dive Centered Modal with Tabs ── */}
      <ModelDetailModal
        model={selectedDetailModel}
        isOpen={Boolean(selectedDetailModel)}
        onClose={() => setSelectedDetailModel(null)}
        darkMode={darkMode}
      />

      {/* ── Netroot Pro Upgrade Modal ── */}
      <ProUpgradeModal
        isOpen={Boolean(upgradeTargetModel)}
        onClose={() => setUpgradeTargetModel(null)}
        model={upgradeTargetModel}
        darkMode={darkMode}
        onSelectFreeModel={() => {
          setUpgradeTargetModel(null);
          navigate('/dashboard?model=minimax/minimax-m3.1-flash:free');
        }}
      />

      {/* ── Fal.ai Media Studio Modal ── */}
      {falMediaModel && (
        <FalMediaModal
          model={falMediaModel}
          darkMode={darkMode}
          onClose={() => setFalMediaModel(null)}
        />
      )}
    </div>
  );
}
