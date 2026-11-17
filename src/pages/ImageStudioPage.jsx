import { useState, useRef, useEffect } from 'react';
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
  Upload,
} from 'lucide-react';

const VIDEO_MODEL = 'Magic Hour Text-to-Video';
const VIDEO_ASPECT_RATIOS = ['16:9', '9:16'];
const IMAGE_STUDIO_CACHE_TTL = 5 * 60 * 1000;
const IMAGE_STUDIO_PAGE_SIZE = 10;
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = ['image/png', 'image/jpeg'];
const imageStudioGalleryCache = new Map();

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

const IMAGE_EXAMPLES = [
  {
    key: 'retroPortrait',
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=700&q=80',
    prompt: 'A confident musician in a colorful 1980s outfit, vintage editorial portrait, warm film grain, dramatic indoor lighting',
    style: STYLES.find((style) => style.label === 'Photorealistic').value,
  },
  {
    key: 'childhoodPortrait',
    imageUrl: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=700&q=80',
    prompt: 'A tender childhood portrait of siblings playing together at home, soft afternoon window light, nostalgic family photography',
    style: STYLES.find((style) => style.label === 'Photorealistic').value,
  },
  {
    key: 'moviePoster',
    imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=700&q=80',
    prompt: 'An adventurous travel movie poster featuring a winding mountain road at golden hour, cinematic composition, vivid colors, no text',
    style: STYLES.find((style) => style.label === 'Digital Art').value,
  },
  {
    key: 'comicHero',
    imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=700&q=80',
    prompt: 'A joyful young hero flying a kite above a colorful neighborhood, hand-painted vintage comic book cover, expressive ink lines',
    style: STYLES.find((style) => style.label === 'Digital Art').value,
  },
  // {
  //   key: 'indieMixtape',
  //   imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff1d?auto=format&fit=crop&w=700&q=80',
  //   prompt: 'A nostalgic indie music mixtape cover, retro cassette on a desk at blue hour, warm amber lights, dreamy analog film look',
  //   style: STYLES.find((style) => style.label === 'Digital Art').value,
  // },
  {
    key: 'goodMorning',
    imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=700&q=80',
    prompt: 'A peaceful good morning scene with a steaming cup of coffee by a sunlit window, soft golden rays, calm and cozy atmosphere',
    style: STYLES.find((style) => style.label === 'Photorealistic').value,
  },
  {
    key: 'botanicalDream',
    imageUrl: 'https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=700&q=80',
    prompt: 'A dreamy botanical greenhouse filled with lush tropical leaves, tiny water droplets, soft morning sunlight, tranquil editorial photography',
    style: STYLES.find((style) => style.label === 'Photorealistic').value,
  },
  {
    key: 'productGlow',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=80',
    prompt: 'A premium minimalist wristwatch floating above a reflective surface, elegant studio product photography, soft dramatic highlights, clean background',
    style: STYLES.find((style) => style.label === '3D Render').value,
  },
  {
    key: 'spaceExplorer',
    imageUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=700&q=80',
    prompt: 'A lone astronaut looking out at a brilliant blue planet from orbit, cinematic science fiction scene, deep space, awe-inspiring scale',
    style: STYLES.find((style) => style.label === 'Digital Art').value,
  },
  {
    key: 'streetwearEditorial',
    imageUrl: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=700&q=80',
    prompt: 'A bold streetwear fashion editorial on a colorful city street, confident pose, dynamic framing, modern magazine photography',
    style: STYLES.find((style) => style.label === 'Photorealistic').value,
  },
  {
    key: 'sweetTreat',
    imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=700&q=80',
    prompt: 'A beautifully plated berry dessert with fresh fruit and cream, bright natural window light, elegant food photography, appetizing details',
    style: STYLES.find((style) => style.label === 'Photorealistic').value,
  },
  {
    key: 'watercolorGarden',
    imageUrl: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=700&q=80',
    prompt: 'A charming spring garden bursting with wildflowers, painted in delicate translucent washes, gentle colors, visible watercolor paper texture',
    style: STYLES.find((style) => style.label === 'Watercolor').value,
  },
  {
    key: 'neonCity',
    imageUrl: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=700&q=80',
    prompt: 'A futuristic city street after dark, glowing neon signs reflected in rain-soaked pavement, atmospheric cyberpunk scene, vivid magenta and cyan',
    style: STYLES.find((style) => style.label === 'Cyberpunk').value,
  },
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
  const [gallery, setGallery] = useState(() =>
    user?.id ? imageStudioGalleryCache.get(user.id)?.items || [] : []
  );
  const [loadingGallery, setLoadingGallery] = useState(() =>
    Boolean(user?.id && !imageStudioGalleryCache.has(user.id))
  );
  const [hasMoreGallery, setHasMoreGallery] = useState(false);
  const [loadingMoreGallery, setLoadingMoreGallery] = useState(false);
  const [galleryView, setGalleryView] = useState('examples');
  const [previewImage, setPreviewImage] = useState(null);
  const [previewExample, setPreviewExample] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [shareMessage, setShareMessage] = useState('');
  const promptRef = useRef(null);
  const uploadInputRef = useRef(null);

  useEffect(() => {
    if (!uploadedImage?.previewUrl) return undefined;
    return () => URL.revokeObjectURL(uploadedImage.previewUrl);
  }, [uploadedImage]);

  useEffect(() => {
    if (!user?.id) {
      setGallery([]);
      setHasMoreGallery(false);
      setLoadingGallery(false);
      return;
    }

    const userId = user.id;
    const cachedGallery = imageStudioGalleryCache.get(userId);
    const hasCachedGallery = Boolean(cachedGallery);
    const isCacheFresh = hasCachedGallery &&
      Date.now() - cachedGallery.cachedAt < IMAGE_STUDIO_CACHE_TTL;
    setGallery(cachedGallery?.items || []);
    setHasMoreGallery(cachedGallery?.hasMore || false);
    setLoadingGallery(!hasCachedGallery);
    if (isCacheFresh) return;

    let isCurrent = true;

    async function refreshGallery() {
      const { data, error: queryError } = await supabase
        .from('image_studio')
        .select('id, user_id, prompt, image_url, size, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(0, IMAGE_STUDIO_PAGE_SIZE);

      if (!isCurrent) return;
      if (queryError) {
        if (!hasCachedGallery) setError(`Could not load image history: ${queryError.message}`);
        setLoadingGallery(false);
        return;
      }

      const refreshedGallery = data || [];
      const hasMore = refreshedGallery.length > IMAGE_STUDIO_PAGE_SIZE;
      const items = refreshedGallery.slice(0, IMAGE_STUDIO_PAGE_SIZE);
      imageStudioGalleryCache.set(userId, {
        items,
        cachedAt: Date.now(),
        hasMore,
      });
      setGallery(items);
      setHasMoreGallery(hasMore);
      setError(null);
      setLoadingGallery(false);
    }

    refreshGallery();
    return () => {
      isCurrent = false;
    };
  }, [user?.id]);

  async function loadMoreGallery() {
    if (!user?.id || loadingMoreGallery || !hasMoreGallery) return;
    setLoadingMoreGallery(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('image_studio')
        .select('id, user_id, prompt, image_url, size, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(gallery.length, gallery.length + IMAGE_STUDIO_PAGE_SIZE);

      if (queryError) throw queryError;

      const nextPage = data || [];
      const hasMore = nextPage.length > IMAGE_STUDIO_PAGE_SIZE;
      const updatedGallery = [
        ...gallery,
        ...nextPage.slice(0, IMAGE_STUDIO_PAGE_SIZE),
      ];
      imageStudioGalleryCache.set(user.id, {
        items: updatedGallery,
        cachedAt: Date.now(),
        hasMore,
      });
      setGallery(updatedGallery);
      setHasMoreGallery(hasMore);
    } catch (loadError) {
      setError(`Could not load more image history: ${loadError.message}`);
    } finally {
      setLoadingMoreGallery(false);
    }
  }

  function updateGalleryCache(update) {
    const cachedGallery = imageStudioGalleryCache.get(user.id);
    const currentGallery = cachedGallery?.items || gallery;
    const updatedGallery = update(currentGallery);
    imageStudioGalleryCache.set(user.id, {
      items: updatedGallery,
      cachedAt: Date.now(),
      hasMore: cachedGallery?.hasMore || hasMoreGallery,
    });
    setGallery(updatedGallery);
  }

  const visibleGallery = gallery.filter((item) => (
    mode === 'video' ? isVideoRecord(item) : !isVideoRecord(item)
  ));

  function handleImageSelection(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      setError(t('imageStudio.uploadTypeError'));
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError(t('imageStudio.uploadSizeError'));
      return;
    }

    setError(null);
    setUploadedImage({ file, previewUrl: URL.createObjectURL(file) });
  }

  async function handleGenerate() {
    if (!prompt.trim() || !user) return;

    setGenerating(true);
    setError(null);

    try {
      const fullPrompt = selectedStyle
        ? `${prompt.trim()}, ${selectedStyle}`
        : prompt.trim();

      const isEditing = mode === 'image' && Boolean(uploadedImage);
      const endpoint = mode === 'video'
        ? `${API_BASE}/api/video-generation`
        : isEditing
          ? `${API_BASE.replace(/\/+$/, '')}/api/image-studio/edit`
          : `${API_BASE}/api/image-studio`;
      const requestBody = {
        prompt: fullPrompt,
        size: selectedSize,
        aspectRatio: selectedVideoAspectRatio,
        email: user.email,
      };
      if (isEditing) requestBody.image = await readFileAsDataUrl(uploadedImage.file);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const data = await response.json();
        if (isEditing && response.status === 404) {
          throw new Error(t('imageStudio.editUnavailable'));
        }
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

        updateGalleryCache((prev) => [inserted, ...prev]);
        setPrompt('');
      } else {
        const data = await response.json();
        if (!data.imageUrl) throw new Error('Image generation completed without returning an image.');
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

        if (insertError) throw new Error(`Could not add generated image to history: ${insertError.message}`);
        if (!inserted) throw new Error('Could not add generated image to history.');
        updateGalleryCache((prev) => [inserted, ...prev]);
        setPrompt('');
        if (isEditing) {
          setUploadedImage(null);
          setGalleryView('creations');
        }
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

    updateGalleryCache((prev) => prev.filter((entry) => entry.id !== id));
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

  function useExample(example) {
    setMode('image');
    setPrompt(example.prompt);
    setSelectedStyle(example.style);
    setError(null);
    promptRef.current?.focus();
  }

  const examplesSection = (
    <section aria-labelledby="image-examples-title" className="mb-6">
      <div className="mb-4">
        <h2 id="image-examples-title" className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {t('imageStudio.examplesTitle')}
        </h2>
        <p className={`mt-1 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
          {t('imageStudio.examplesDescription')}
        </p>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
        {IMAGE_EXAMPLES.map((example) => (
          <button
            key={example.key}
            type="button"
            onClick={() => setPreviewExample(example)}
            aria-label={t('imageStudio.viewExample', { title: t(`imageStudio.examples.${example.key}`) })}
            className={`group relative aspect-square overflow-hidden rounded-2xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${darkMode ? 'focus-visible:ring-offset-[#0e0e0e]' : 'focus-visible:ring-offset-gray-50'}`}
          >
            <img
              src={example.imageUrl}
              alt=""
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent" />
            <span className="absolute inset-x-0 bottom-0 p-3 text-sm font-semibold text-white">
              {t(`imageStudio.examples.${example.key}`)}
            </span>
          </button>
        ))}
      </div>
    </section>
  );

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#0e0e0e] text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
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

        <div className="mt-6 grid min-w-0 grid-cols-1 gap-6 lg:mt-8 lg:grid-cols-[minmax(320px,400px)_minmax(0,1fr)]">
          {/* Left: Controls */}
          <div className={`h-fit min-w-0 rounded-2xl border p-4 sm:p-5 lg:sticky lg:top-6 ${darkMode ? 'border-[#222] bg-[#111]' : 'border-gray-200 bg-white'}`}>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {['image', 'video'].map((value) => (
                <button key={value} onClick={() => setMode(value)} className={`rounded-lg border py-2 text-sm font-semibold capitalize ${mode === value ? 'bg-blue-500 border-blue-500 text-white' : darkMode ? 'border-[#2a2a2a] text-gray-400' : 'border-gray-200 text-gray-600'}`}>
                  {t(`imageStudio.${value}`)}
                </button>
              ))}
            </div>
            {mode === 'video' && <p className={`mb-4 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{t('imageStudio.model')} {VIDEO_MODEL}</p>}
            {mode === 'image' && (
              <div className={`mb-5 rounded-xl border p-3 ${darkMode ? 'border-[#2a2a2a] bg-[#1a1a1a]' : 'border-gray-200 bg-gray-50'}`}>
                <input
                  ref={uploadInputRef}
                  type="file"
                  accept="image/png,image/jpeg,.png,.jpg,.jpeg"
                  onChange={handleImageSelection}
                  className="hidden"
                />
                {uploadedImage ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={uploadedImage.previewUrl}
                      alt={t('imageStudio.uploadedPhoto')}
                      className="h-16 w-16 shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        {uploadedImage.file.name}
                      </p>
                      <p className={`mt-1 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        {t('imageStudio.uploadedPhoto')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUploadedImage(null)}
                      aria-label={t('imageStudio.removePhoto')}
                      title={t('imageStudio.removePhoto')}
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${darkMode ? 'text-gray-400 hover:bg-white/10 hover:text-white' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-900'}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => uploadInputRef.current?.click()}
                    className={`flex w-full items-center gap-3 rounded-lg text-left ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`}
                  >
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${darkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                      <Upload className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">{t('imageStudio.uploadPhoto')}</span>
                      <span className={`mt-1 block text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        {t('imageStudio.uploadHint')}
                      </span>
                    </span>
                  </button>
                )}
              </div>
            )}
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {t('imageStudio.descriptionLabel')}
            </label>
            <textarea
              ref={promptRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t(uploadedImage ? 'imageStudio.editPromptPlaceholder' : 'imageStudio.promptPlaceholder')}
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
                  {t(mode === 'video' ? 'imageStudio.generateVideo' : uploadedImage ? 'imageStudio.editImage' : 'imageStudio.generateImage')}
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
            {mode === 'image' && (
              <div role="tablist" aria-label={t('imageStudio.galleryViews')} className="mb-5 flex gap-2">
                {['examples', 'creations'].map((view) => (
                  <button
                    key={view}
                    type="button"
                    role="tab"
                    aria-selected={galleryView === view}
                    onClick={() => setGalleryView(view)}
                    className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                      galleryView === view
                        ? 'bg-blue-500 text-white'
                        : darkMode
                          ? 'bg-[#1a1a1a] text-gray-400 hover:text-white'
                          : 'bg-gray-100 text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {t(view === 'examples' ? 'imageStudio.examplesTab' : 'imageStudio.creations')}
                  </button>
                ))}
              </div>
            )}
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

            {mode === 'image' && galleryView === 'examples' ? examplesSection : loadingGallery ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className={`w-6 h-6 animate-spin ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              </div>
            ) : visibleGallery.length === 0 && !generating ? (
              mode === 'image' ? null : (
                <div className={`rounded-2xl border flex flex-col items-center justify-center py-20 ${darkMode ? 'border-[#222] bg-[#111]' : 'border-gray-200 bg-white'}`}>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${darkMode ? 'bg-[#1a1a1a]' : 'bg-gray-100'}`}>
                    <ImageIcon className={`w-7 h-7 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                  </div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                    {t('imageStudio.noVideos')}
                  </p>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                    {t('imageStudio.firstCreate', { mode: t('imageStudio.video') })}
                  </p>
                  {hasMoreGallery && (
                    <button
                      type="button"
                      onClick={loadMoreGallery}
                      disabled={loadingMoreGallery}
                      className={`mt-4 rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
                        darkMode
                          ? 'border-[#2a2a2a] text-gray-300 hover:bg-white/5'
                          : 'border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {loadingMoreGallery ? t('common.loading') : t('imageStudio.loadMore', { defaultValue: 'Load more' })}
                    </button>
                  )}
                </div>
              )
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
                {hasMoreGallery && (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={loadMoreGallery}
                      disabled={loadingMoreGallery}
                      className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
                        darkMode
                          ? 'border-[#2a2a2a] text-gray-300 hover:bg-white/5'
                          : 'border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {loadingMoreGallery ? t('common.loading') : t('imageStudio.loadMore', { defaultValue: 'Load more' })}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Example preview */}
      {previewExample && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
          onClick={() => setPreviewExample(null)}
        >
          <button
            type="button"
            aria-label={t('common.close')}
            className="absolute top-5 right-5 text-white/70 hover:text-white transition-colors"
            onClick={() => setPreviewExample(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <div className="max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={previewExample.imageUrl}
              alt={t(`imageStudio.examples.${previewExample.key}`)}
              className="max-h-[70vh] w-full rounded-xl object-contain"
            />
            <p className="text-white text-base font-semibold mt-4 text-center">
              {t(`imageStudio.examples.${previewExample.key}`)}
            </p>
            <div className="flex justify-center mt-4">
              <button
                type="button"
                onClick={() => {
                  useExample(previewExample);
                  setPreviewExample(null);
                }}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
              >
                <Wand2 className="w-4 h-4" />
                {t('imageStudio.useExamplePrompt')}
              </button>
            </div>
          </div>
        </div>
      )}

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

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Could not read the selected image.'));
      }
    };
    reader.onerror = () => reject(new Error('Could not read the selected image.'));
    reader.readAsDataURL(file);
  });
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
