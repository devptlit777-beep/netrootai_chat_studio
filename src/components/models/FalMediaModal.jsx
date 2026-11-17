import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Download,
  Copy,
  Check,
  Play,
  Pause,
  Film,
  Image as ImageIcon,
  Volume2,
  RefreshCw,
  Sliders,
  ExternalLink,
  Lock,
} from 'lucide-react';
import API_BASE from '../../lib/api';
import ProviderLogo from '../common/ProviderLogo';
import { usePlan } from '../../contexts/PlanContext';
import { useAuth } from '../../contexts/AuthContext';
import WalletTopUpModal from '../common/WalletTopUpModal';

export default function FalMediaModal({ model, darkMode, onClose }) {
  if (!model) return null;

  const { plan, setWalletBalance } = usePlan();
  const { user } = useAuth();
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const isPro = plan === 'pro' || plan === 'enterprise';

  const isVideo = (model.modalities || []).includes('video') || model.id?.includes('video') || model.media_category === 'video';
  const isAudio = (model.modalities || []).includes('audio') || model.id?.includes('audio') || model.id?.includes('tts') || model.media_category === 'audio';
  const isImage = !isVideo && !isAudio;

  const defaultPrompt = isVideo
    ? 'Cinematic drone shot flying through a golden autumn forest with morning mist and soft sun rays, 4k ultra realistic'
    : isAudio
    ? 'Upbeat lofi chillhop beat with jazzy piano chords and warm vinyl crackle, 85 bpm relax study vibe'
    : 'A majestic cybernetic white tiger in an enchanted luminescent neon forest, hyper detailed 8k photography';

  const [prompt, setPrompt] = useState(defaultPrompt);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [duration, setDuration] = useState(isVideo ? '5' : '30');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`${API_BASE}/api/media/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || '',
        },
        body: JSON.stringify({
          modelId: model.id,
          email: user?.email || '',
          prompt: prompt.trim(),
          options: {
            aspectRatio,
            duration,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        if (data.requiresTopUp || res.status === 402) {
          setIsTopUpOpen(true);
        }
        throw new Error(data.error || 'Failed to generate media.');
      }

      if (data.walletBalance !== undefined && data.walletBalance !== null) {
        setWalletBalance(data.walletBalance);
      }

      setResult(data);
    } catch (err) {
      setError(err.message || 'Media generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!result?.url) return;
    navigator.clipboard.writeText(result.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className={`relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          darkMode ? 'bg-[#121212] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'
        }`}
      >
        {/* Modal Header */}
        <div className={`p-5 px-6 border-b flex items-center justify-between ${
          darkMode ? 'border-[#222] bg-[#161616]' : 'border-gray-100 bg-gray-50'
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            <ProviderLogo provider={model.provider} modelId={model.id} size="md" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold truncate">
                  {model.display_name || model.name}
                </h2>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  isVideo
                    ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20'
                    : isAudio
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                    : 'bg-pink-500/15 text-pink-400 border border-pink-500/20'
                }`}>
                  {isVideo ? '🎬 Video Gen' : isAudio ? '🎙️ Audio Studio' : '🎨 Image Gen'}
                </span>
                {model.is_free ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                    Free Tier
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-500/15 text-blue-400 border border-blue-500/20">
                    Pro Studio
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 font-mono truncate mt-0.5">{model.id}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              darkMode ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-200 text-gray-500 hover:text-gray-900'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Prompt Section */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">
              Prompt Specification
            </label>
            <div className={`rounded-2xl border p-3 transition-colors ${
              darkMode ? 'bg-[#181818] border-[#2e2e2e] focus-within:border-blue-500' : 'bg-gray-50 border-gray-200 focus-within:border-blue-500'
            }`}>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                placeholder="Describe what you want to generate in detail..."
                className={`w-full bg-transparent text-sm outline-none resize-none ${
                  darkMode ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
                }`}
              />

              <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-gray-500">
                <span>Supports natural language descriptive prompts</span>
                <span>{prompt.length} chars</span>
              </div>
            </div>
          </div>

          {/* Options Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Aspect Ratio */}
            {!isAudio && (
              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1.5">
                  Aspect Ratio
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: '16:9', label: '16:9 (Landscape)' },
                    { id: '9:16', label: '9:16 (Portrait)' },
                    { id: '1:1', label: '1:1 (Square)' },
                    { id: '4:3', label: '4:3 (Standard)' },
                  ].map(ar => (
                    <button
                      key={ar.id}
                      type="button"
                      onClick={() => setAspectRatio(ar.id)}
                      className={`py-2 px-2 rounded-xl text-xs font-medium border text-center transition-all ${
                        aspectRatio === ar.id
                          ? 'bg-blue-600 border-blue-500 text-white font-bold shadow-md shadow-blue-500/20'
                          : darkMode
                          ? 'bg-[#181818] border-[#2a2a2a] text-gray-400 hover:text-white'
                          : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {ar.id}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Duration for video/audio */}
            {(isVideo || isAudio) && (
              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1.5">
                  Duration
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(isVideo ? ['5', '10'] : ['15', '30']).map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDuration(d)}
                      className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all ${
                        duration === d
                          ? 'bg-purple-600 border-purple-500 text-white font-bold shadow-md shadow-purple-500/20'
                          : darkMode
                          ? 'bg-[#181818] border-[#2a2a2a] text-gray-400 hover:text-white'
                          : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {d} Seconds
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Trigger */}
          <button
            type="button"
            disabled={loading || !prompt.trim()}
            onClick={handleGenerate}
            className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
              loading || !prompt.trim()
                ? 'opacity-60 cursor-not-allowed bg-gray-700 text-gray-400'
                : isVideo
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-500/25'
                : isAudio
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-amber-500/25'
                : 'bg-gradient-to-r from-blue-600 to-pink-600 hover:from-blue-500 hover:to-pink-500 text-white shadow-blue-500/25'
            }`}
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Rendering on dedicated GPU cluster...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>
                  Generate with {model.display_name || model.name}
                </span>
              </>
            )}
          </button>

          {/* Error Message */}
          {error && (
            <div className={`p-4 rounded-2xl border text-xs flex items-center gap-3 ${
              darkMode ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-600'
            }`}>
              <X className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Generation Result Display */}
          {result && (
            <div className={`p-5 rounded-2xl border space-y-4 ${
              darkMode ? 'bg-[#161616] border-[#282828]' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-4 h-4" /> Generation Completed Successfully
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyLink}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                      darkMode ? 'border-[#333] hover:bg-white/5 text-gray-300' : 'border-gray-200 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy URL'}</span>
                  </button>

                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                </div>
              </div>

              {/* Render Media */}
              <div className="rounded-xl overflow-hidden border border-black/20 bg-black/50 flex items-center justify-center max-h-[480px]">
                {result.mediaType === 'video' ? (
                  <video
                    src={result.url}
                    controls
                    autoPlay
                    loop
                    className="max-h-[450px] w-auto mx-auto rounded-lg shadow-xl"
                  />
                ) : result.mediaType === 'audio' ? (
                  <div className="p-8 w-full flex flex-col items-center justify-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <Volume2 className="w-8 h-8" />
                    </div>
                    <audio src={result.url} controls className="w-full max-w-md" autoPlay />
                  </div>
                ) : (
                  <img
                    src={result.url}
                    alt={prompt}
                    className="max-h-[450px] w-auto object-contain mx-auto rounded-lg shadow-xl"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <WalletTopUpModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        darkMode={darkMode}
      />
    </div>
  );
}

