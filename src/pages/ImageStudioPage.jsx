import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import API_BASE from '../lib/api';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  Image as ImageIcon,
  Download,
  Trash2,
  Loader2,
  Wand2,
  X,
  AlertCircle,
  Clock,
  Share2,
} from 'lucide-react';

const VIDEO_MODEL = 'Agnes Video 2.5 Flash';
const VIDEO_ASPECT_RATIOS = ['16:9', '9:16'];

const SIZES = [
  { label: 'Square', value: '1024x1024', ratio: '1:1' },
  { label: 'Landscape', value: '1536x1024', ratio: '3:2' },
  { label: 'Portrait', value: '1024x1536', ratio: '2:3' },
];

const STYLES = [
  { label: 'None', value: '' },
  { label: 'Photorealistic', value: 'photorealistic, high detail, sharp focus' },
  { label: 'Digital Art', value: 'digital art, vibrant colors, detailed' },
  { label: 'Oil Painting', value: 'oil painting, textured brushstrokes, classical' },
  { label: 'Anime', value: 'anime style, cel shading, vivid colors' },
  { label: '3D Render', value: '3D render, octane render, cinematic lighting' },
  { label: 'Watercolor', value: 'watercolor painting, soft edges, delicate' },
  { label: 'Cyberpunk', value: 'cyberpunk, neon lights, futuristic, dark atmosphere' },
];

export default function ImageStudioPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const darkMode = theme === 'dark';

  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState('image');
  const [selectedSize, setSelectedSize] = useState(SIZES[0].value);
  const [selectedVideoAspectRatio, setSelectedVideoAspectRatio] = useState(VIDEO_ASPECT_RATIOS[0]);
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0].value);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [loadingGallery, setLoadingGallery] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);
  const [shareMessage, setShareMessage] = useState('');
  const promptRef = useRef(null);

  const loadGallery = useCallback(async () => {
    if (!user) return;
    setLoadingGallery(true);
    const { data, error } = await supabase
      .from('image_studio')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!error) setGallery(data || []);
    setLoadingGallery(false);
  }, [user]);

  useEffect(() => {
    loadGallery();
  }, [loadGallery]);

  const visibleGallery = gallery.filter((item) => (
    mode === 'video' ? isVideoRecord(item) : !isVideoRecord(item)
  ));

  async function handleGenerate() {
    if (!prompt.trim() || !user) return;

    setGenerating(true);
    setError(null);

    try {
      const fullPrompt = selectedStyle
        ? `${prompt.trim()}, ${selectedStyle}`
        : prompt.trim();

      const endpoint = mode === 'video' ? `${API_BASE}/api/video-generation` : `${API_BASE}/api/image-studio`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: fullPrompt,
          size: selectedSize,
          aspectRatio: selectedVideoAspectRatio,
          email: user.email,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Image generation failed');
      }

      if (mode === 'video') {
        const videoBlob = await response.blob();
        if (!videoBlob.size) throw new Error('Video generation returned an empty video.');
        const contentType = videoBlob.type || 'video/mp4';
        if (!contentType.startsWith('video/')) throw new Error('Video generation returned an unsupported file type.');
        const extension = contentType.includes('webm') ? 'webm' : 'mp4';
        const storagePath = `${user.id}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(storagePath, videoBlob, { cacheControl: '3600', contentType, upsert: false });
        if (uploadError) throw new Error(`Could not save generated video: ${uploadError.message}`);

        const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(storagePath);
        const { data: inserted, error: insertError } = await supabase
          .from('image_studio')
          .insert({
            user_id: user.id,
            prompt: prompt.trim(),
            image_url: urlData.publicUrl,
            size: selectedVideoAspectRatio,
          })
          .select()
          .single();

        if (insertError) {
          const { error: cleanupError } = await supabase.storage.from('attachments').remove([storagePath]);
          const cleanupMessage = cleanupError ? ` Video cleanup also failed: ${cleanupError.message}` : '';
          throw new Error(`Could not add generated video to history: ${insertError.message}.${cleanupMessage}`);
        }

        setGallery((prev) => [inserted, ...prev]);
        setPrompt('');
      } else {
        const data = await response.json();
        if (!data.imageUrl) return;
        const { data: inserted, error: insertError } = await supabase
          .from('image_studio')
          .insert({
            user_id: user.id,
            prompt: prompt.trim(),
            image_url: data.imageUrl,
            size: selectedSize,
          })
          .select()
          .single();

        const newImage = inserted || {
          id: crypto.randomUUID(),
          user_id: user.id,
          prompt: prompt.trim(),
          image_url: data.imageUrl,
          size: selectedSize,
          created_at: new Date().toISOString(),
        };
        setGallery((prev) => [newImage, ...prev]);
        setPrompt('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleDelete(id) {
    setError(null);
    const item = gallery.find((entry) => entry.id === id);
    if (!item) return;

    if (isVideoRecord(item)) {
      const storagePath = getAttachmentStoragePath(item.image_url, user.id);
      if (storagePath) {
        const { error: storageError } = await supabase.storage.from('attachments').remove([storagePath]);
        if (storageError) {
          setError(`Could not delete generated video: ${storageError.message}`);
          return;
        }
      }
    }

    const { error: deleteError } = await supabase.from('image_studio').delete().eq('id', id);
    if (deleteError) {
      setError(`Could not delete item from history: ${deleteError.message}`);
      return;
    }

    setGallery((prev) => prev.filter((entry) => entry.id !== id));
  }

  function handleDownload(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'generated-image.png';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function handleShare(image) {
    setShareMessage('');

    try {
      const response = await fetch(image.image_url);
      if (!response.ok) throw new Error('Could not load this image.');
      const blob = await response.blob();
      const file = new File([blob], `netrootai-image-${image.id}.png`, {
        type: blob.type || 'image/png',
      });

      if (typeof navigator.share === 'function' && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        try {
          await navigator.share({
            files: [file],
            title: 'AI-generated image',
            text: image.prompt,
          });
          return;
        } catch (error) {
          if (error.name === 'AbortError') return;
        }
      }

      if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ [file.type]: blob }),
          ]);
          setShareMessage(t('imageStudio.copied'));
          return;
        } catch {
          // Fall back to downloading when clipboard access is unavailable.
        }
      }

      handleDownload(image.image_url, file.name);
      setShareMessage(t('imageStudio.downloaded'));
    } catch {
      handleDownload(image.image_url, `netrootai-image-${image.id}.png`);
      setShareMessage(t('imageStudio.downloaded'));
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleGenerate();
    }
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#0e0e0e] text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-6xl mx-auto px-6 py-8">
        {shareMessage && (
          <div role="status" className={`fixed bottom-5 right-5 z-50 max-w-sm rounded-lg border px-4 py-3 text-sm shadow-lg ${darkMode ? 'border-[#333] bg-[#171717] text-gray-200' : 'border-gray-200 bg-white text-gray-700'}`}>
            {shareMessage}
          </div>
        )}
        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
            <Sparkles className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {t('imageStudio.title')}
            </h1>
            <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              {/* Generate images or videos from text descriptions */}
              {t('imageStudio.description')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6 mt-8">
          {/* Left: Controls */}
          <div className={`rounded-2xl border p-5 h-fit lg:sticky lg:top-6 ${darkMode ? 'border-[#222] bg-[#111]' : 'border-gray-200 bg-white'}`}>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {['image', 'video'].map((value) => (
                <button key={value} onClick={() => setMode(value)} className={`rounded-lg border py-2 text-sm font-semibold capitalize ${mode === value ? 'bg-blue-500 border-blue-500 text-white' : darkMode ? 'border-[#2a2a2a] text-gray-400' : 'border-gray-200 text-gray-600'}`}>
                  {t(`imageStudio.${value}`)}
                </button>
              ))}
            </div>
            {mode === 'video' && <p className={`mb-4 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{t('imageStudio.model')} {VIDEO_MODEL}</p>}
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {t('imageStudio.descriptionLabel')}
            </label>
            <textarea
              ref={promptRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('imageStudio.promptPlaceholder')}
              rows={5}
              className={`w-full rounded-xl border px-4 py-3 text-sm outline-none resize-none transition-colors ${darkMode
                ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-gray-600 focus:border-blue-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                }`}
            />

            {/* Size selector */}
            <label className={`block text-xs font-semibold uppercase tracking-wider mt-5 mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              {t('imageStudio.aspectRatio')}
            </label>
            <div className={`grid gap-2 ${mode === 'video' ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {(mode === 'video' ? VIDEO_ASPECT_RATIOS.map((ratio) => ({ label: ratio === '16:9' ? 'Landscape' : 'Portrait', value: ratio, ratio })) : SIZES).map((size) => {
                const selected = mode === 'video'
                  ? selectedVideoAspectRatio === size.value
                  : selectedSize === size.value;
                return (
                <button
                  key={size.value}
                  onClick={() => mode === 'video' ? setSelectedVideoAspectRatio(size.value) : setSelectedSize(size.value)}
                  className={`rounded-lg py-2 px-2 text-xs font-medium transition-all border ${selected
                    ? 'bg-blue-500 text-white border-blue-500'
                    : darkMode
                      ? 'bg-[#1a1a1a] border-[#2a2a2a] text-gray-400 hover:border-[#444]'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                >
                  <div className="font-semibold">{t(`imageStudio.sizes.${size.label}`)}</div>
                  <div className={selected ? 'text-blue-100' : darkMode ? 'text-gray-600' : 'text-gray-400'}>
                    {size.ratio}
                  </div>
                </button>
                );
              })}
            </div>

            {/* Style selector */}
            <label className={`block text-xs font-semibold uppercase tracking-wider mt-5 mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              {t('imageStudio.style')}
            </label>
            <div className="flex flex-wrap gap-2">
              {STYLES.map((style) => (
                <button
                  key={style.label}
                  onClick={() => setSelectedStyle(style.value)}
                  className={`rounded-lg py-1.5 px-3 text-xs font-medium transition-all border ${selectedStyle === style.value
                    ? 'bg-blue-500 text-white border-blue-500'
                    : darkMode
                      ? 'bg-[#1a1a1a] border-[#2a2a2a] text-gray-400 hover:border-[#444]'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                >
                  {t(`imageStudio.styles.${style.label}`)}
                </button>
              ))}
            </div>

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={generating || !prompt.trim()}
              className="w-full mt-6 flex items-center justify-center gap-2 bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl py-3 text-sm font-semibold transition-colors"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('imageStudio.generating')}
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  {t(mode === 'video' ? 'imageStudio.generateVideo' : 'imageStudio.generateImage')}
                </>
              )}
            </button>

            <p className={`text-xs mt-3 text-center ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
              {t('imageStudio.shortcut')}
            </p>

            {error && (
              <div className={`flex items-start gap-2 rounded-lg px-3 py-2.5 mt-4 text-sm ${darkMode ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Right: Gallery */}
          <div>
            {generating && (
              <div className={`rounded-2xl border mb-4 flex flex-col items-center justify-center py-20 ${darkMode ? 'border-[#222] bg-[#111]' : 'border-gray-200 bg-white'}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${darkMode ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                </div>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t('imageStudio.creating', { mode: t(`imageStudio.${mode}`) })}
                </p>
                <p className={`text-xs mt-1 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                  {mode === 'video' ? t('imageStudio.videoWait') : t('imageStudio.imageWait')}
                </p>
              </div>
            )}

            {loadingGallery ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className={`w-6 h-6 animate-spin ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              </div>
            ) : visibleGallery.length === 0 && !generating ? (
              <div className={`rounded-2xl border flex flex-col items-center justify-center py-20 ${darkMode ? 'border-[#222] bg-[#111]' : 'border-gray-200 bg-white'}`}>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${darkMode ? 'bg-[#1a1a1a]' : 'bg-gray-100'}`}>
                  <ImageIcon className={`w-7 h-7 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                </div>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                  {mode === 'video' ? t('imageStudio.noVideos') : t('imageStudio.noImages')}
                </p>
                <p className={`text-xs mt-1 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                  {t('imageStudio.firstCreate', { mode: t(`imageStudio.${mode}`) })}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {visibleGallery.map((img) => {
                    const isVideo = isVideoRecord(img);
                    const extension = getVideoExtension(img.image_url);
                    return (
                      <div
                        key={img.id}
                        className={`group rounded-2xl border overflow-hidden transition-all hover:shadow-lg ${darkMode ? 'border-[#222] bg-[#111]' : 'border-gray-200 bg-white'}`}
                      >
                        {isVideo ? (
                          <video
                            src={img.image_url}
                            controls
                            preload="metadata"
                            aria-label={img.prompt}
                            className="w-full aspect-square object-cover"
                          />
                        ) : (
                          <div className="relative cursor-pointer" onClick={() => setPreviewImage(img)}>
                            <img
                              src={img.image_url}
                              alt={img.prompt}
                              className="w-full aspect-square object-cover transition-transform group-hover:scale-[1.02]"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end justify-center pb-3 opacity-0 group-hover:opacity-100">
                              <span className="text-white text-xs font-medium bg-black/50 rounded-full px-3 py-1">
                                {t('imageStudio.clickToView')}
                              </span>
                            </div>
                          </div>
                        )}
                        <div className="p-3">
                          <p className={`text-xs line-clamp-2 leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {img.prompt}
                          </p>
                          <div className="flex items-center justify-between mt-2.5">
                            <div className={`flex items-center gap-1 text-[11px] ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                              <Clock className="w-3 h-3" />
                              {formatDate(img.created_at, i18n.resolvedLanguage)}
                            </div>
                            <div className="flex items-center gap-1">
                              {!isVideo && (
                                <button
                                  onClick={() => handleShare(img)}
                                  title={t('imageStudio.shareImage')}
                                  aria-label={t('imageStudio.shareImage')}
                                  className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${darkMode ? 'text-gray-500 hover:text-white hover:bg-white/5' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
                                >
                                  <Share2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDownload(img.image_url, `${isVideo ? 'video' : 'image'}-${img.id}.${extension || 'png'}`)}
                                title={t('imageStudio.download')}
                                className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${darkMode ? 'text-gray-500 hover:text-white hover:bg-white/5' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(img.id)}
                                title={t('imageStudio.delete')}
                                className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${darkMode ? 'text-gray-500 hover:text-red-400 hover:bg-red-500/10' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox preview */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
          onClick={() => setPreviewImage(null)}
        >
          <button
            className="absolute top-5 right-5 text-white/70 hover:text-white transition-colors"
            onClick={() => setPreviewImage(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <div className="max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={previewImage.image_url}
              alt={previewImage.prompt}
              className="w-full rounded-xl"
            />
            <p className="text-white/80 text-sm mt-4 text-center">
              {previewImage.prompt}
            </p>
            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                onClick={() => handleShare(previewImage)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                <Share2 className="w-4 h-4" />
                {t('imageStudio.share')}
              </button>
              <button
                onClick={() => handleDownload(previewImage.image_url, `image-${previewImage.id}.png`)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                {t('imageStudio.download')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(iso, locale) {
  const d = new Date(iso);
  return d.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
  });
}

function getVideoExtension(url) {
  const pathname = new URL(url, window.location.origin).pathname.toLowerCase();
  return pathname.match(/\.(mp4|webm)$/)?.[1] || null;
}

function isVideoRecord(item) {
  return Boolean(getVideoExtension(item.image_url));
}

function getAttachmentStoragePath(url, userId) {
  const pathname = new URL(url, window.location.origin).pathname;
  const prefix = '/storage/v1/object/public/attachments/';
  if (!pathname.startsWith(prefix)) return null;
  const storagePath = decodeURIComponent(pathname.slice(prefix.length));
  return storagePath.startsWith(`${userId}/`) ? storagePath : null;
}
