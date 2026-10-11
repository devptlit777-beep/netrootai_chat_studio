import React, { useState } from 'react';
import {
  Search,
  X,
  Upload,
  Link as LinkIcon,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';

export default function UnsplashModal({
  isOpen = false,
  onClose,
  initialQuery = '',
  onSelectImage,
}) {
  const [query, setQuery] = useState(initialQuery || 'enterprise cloud technology');
  const [candidates, setCandidates] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      const targetQuery = initialQuery?.trim() || 'enterprise business technology';
      setQuery(targetQuery);
      fetchCandidates(targetQuery);
    }
  }, [isOpen, initialQuery]);

  const fetchCandidates = async (searchTopic) => {
    if (!searchTopic?.trim()) return;
    setIsSearching(true);
    setErrorMsg('');

    try {
      const PPT_API_BASE = import.meta.env.VITE_PPT_API_URL || 'http://127.0.0.1:8001';
      const res = await fetch(
        `${PPT_API_BASE}/api/search-image-candidates?query=${encodeURIComponent(searchTopic.trim())}`
      );
      if (!res.ok) throw new Error('Failed to fetch image candidates');
      const data = await res.json();
      setCandidates(data.candidates || []);
    } catch (err) {
      setErrorMsg(err.message || 'Error searching images');
    } finally {
      setIsSearching(false);
    }
  };

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim() || isSearching) return;
    fetchCandidates(query.trim());
  };

  const handleSelectCandidate = async (cand) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setErrorMsg('');

    const targetUrl = cand.regular_url || cand.thumb_url || cand.url || cand.thumb;

    try {
      const PPT_API_BASE = import.meta.env.VITE_PPT_API_URL || 'http://127.0.0.1:8001';
      // Fetch base64 data uri via backend
      const res = await fetch(`${PPT_API_BASE}/api/fetch-candidate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      });

      if (!res.ok) throw new Error('Could not download image');
      const data = await res.json();
      if (data.data_uri) {
        onSelectImage(data.data_uri, query);
        onClose();
        return;
      }
    } catch (err) {
      // Fallback directly to URL if backend fetch fails
    } finally {
      setIsProcessing(false);
    }

    onSelectImage(targetUrl, query);
    onClose();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      onSelectImage(reader.result, file.name);
      onClose();
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    onSelectImage(urlInput.trim(), 'Web Image');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
      <div className="w-full max-w-2xl bg-[#141416] border border-[#26262a] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#26262a] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Add Slide Visual</h2>
              <p className="text-xs text-slate-400">Search free high-res photos or upload</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search topic photo (e.g. cloud security, analytics, AI)..."
                className="w-full bg-[#18181b] border border-[#2b2b30] focus:border-sky-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition"
              />
            </div>
            <button
              type="submit"
              disabled={!query.trim() || isSearching}
              className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>Search</span>
            </button>
          </form>

          {/* Candidate grid */}
          {candidates.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
              {candidates.map((cand, idx) => {
                const imgSrc = cand.thumb_url || cand.regular_url || cand.thumb || cand.url;
                return (
                  <div
                    key={idx}
                    onClick={() => handleSelectCandidate(cand)}
                    className="group relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-sky-400 cursor-pointer transition"
                  >
                    <img
                      src={imgSrc}
                      alt={cand.title || 'Candidate'}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                      onError={(e) => {
                        if (cand.regular_url && e.currentTarget.src !== cand.regular_url) {
                          e.currentTarget.src = cand.regular_url;
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                      <span className="text-[11px] font-bold text-white bg-sky-500/90 px-2.5 py-1 rounded-full shadow">
                        Select
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-slate-500">
              Type keywords and click Search to browse images
            </div>
          )}

          {/* Alternative: Upload or Direct URL */}
          <div className="pt-3 border-t border-[#26262a] grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-[#2b2b30] hover:border-sky-500/50 bg-[#18181b] text-slate-300 hover:text-white cursor-pointer transition text-xs font-semibold">
              <Upload className="w-4 h-4 text-sky-400" />
              <span>Upload Local Image</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="sr-only" />
            </label>

            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Or paste direct image URL..."
                className="flex-1 bg-[#18181b] border border-[#2b2b30] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none"
              />
              <button
                type="button"
                onClick={handleApplyUrl}
                disabled={!urlInput.trim()}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold text-slate-200"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
