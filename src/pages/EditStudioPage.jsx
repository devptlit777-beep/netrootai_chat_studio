import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import {
    Sparkles, Download, Loader2, X, XCircle, Settings, Play,
    ZoomIn, ZoomOut, Maximize2, Cpu, Eye, RefreshCw, ChevronUp,
    ChevronDown, CheckCircle2, AlertTriangle, Info, ArrowRight,
    ArrowLeft, Image as ImageIcon, Layers, Wand2, Undo2, Redo2,
    Layout, Search, Plus, Zap, Grid3X3, Trash2, Eraser,
    Upload, Camera, ChevronLeft, ChevronRight, Video, Music, Type,
    Save, FolderOpen, Film, Headphones, Copy
} from 'lucide-react';

import { PYTHON_API_BASE as API_BASE } from '../lib/api';

// ─── Node Types (Expanded for Video/Audio/Text) 
const NODE_TYPES = {
    // ── AI Editing (Image) 
    ai_image_edit:        { label: 'AI Image Edit',        cat: 'AI EDITING',  color: '#a855f7', hasInputs: true,  hasOutputs: true,  isAI: true },
    ai_background_edit:   { label: 'AI Background Edit',   cat: 'AI EDITING',  color: '#6d28d9', hasInputs: true,  hasOutputs: true,  isAI: true },
    ai_object_replacement:{ label: 'AI Object Replace',    cat: 'AI EDITING',  color: '#7c3aed', hasInputs: true,  hasOutputs: true,  isAI: true },
    ai_multi_image_edit:  { label: 'AI Multi-Image Edit',  cat: 'AI EDITING',  color: '#a855f7', hasInputs: true,  hasOutputs: true,  isAI: true, multiInput: true },

    // ── Image (Basics) ──────────────────────────────────────────────────────
    image_input:          { label: 'Image Input',          cat: 'IMAGE',       color: '#10b981', hasInputs: false, hasOutputs: true  },
    multiple_image_input: { label: 'Multiple Image Input', cat: 'IMAGE',       color: '#059669', hasInputs: false, hasOutputs: true  },
    image_preview:        { label: 'Image Preview',        cat: 'IMAGE',       color: '#0d9488', hasInputs: true,  hasOutputs: true  },
    image_output:         { label: 'Image Output',         cat: 'IMAGE',       color: '#f43f5e', hasInputs: true,  hasOutputs: false },

    // ── Adjust ──────────────────────────────────────────────────────────────
    brightness:    { label: 'Image Brightness',  cat: 'ADJUST',  color: '#8b5cf6', hasInputs: true, hasOutputs: true },
    contrast:      { label: 'Image Contrast',    cat: 'ADJUST',  color: '#8b5cf6', hasInputs: true, hasOutputs: true },
    saturation:    { label: 'Image Saturation',  cat: 'ADJUST',  color: '#8b5cf6', hasInputs: true, hasOutputs: true },
    grayscale:     { label: 'Grayscale',         cat: 'ADJUST',  color: '#8b5cf6', hasInputs: true, hasOutputs: true },
    color_balance: { label: 'Color Balance',     cat: 'ADJUST',  color: '#8b5cf6', hasInputs: true, hasOutputs: true },
    auto_contrast: { label: 'Auto Contrast',     cat: 'ADJUST',  color: '#8b5cf6', hasInputs: true, hasOutputs: true },

    // ── Filter ──────────────────────────────────────────────────────────────
    blur:           { label: 'Gaussian Blur',    cat: 'FILTER',  color: '#0ea5e9', hasInputs: true, hasOutputs: true },
    sharpen:        { label: 'Sharpen Image',    cat: 'FILTER',  color: '#0ea5e9', hasInputs: true, hasOutputs: true },
    edge_detection: { label: 'Canny Edges',      cat: 'FILTER',  color: '#0ea5e9', hasInputs: true, hasOutputs: true },
    sepia:          { label: 'Sepia',            cat: 'FILTER',  color: '#0ea5e9', hasInputs: true, hasOutputs: true },
    vignette:       { label: 'Vignette',         cat: 'FILTER',  color: '#0ea5e9', hasInputs: true, hasOutputs: true },
    invert:         { label: 'Invert Colors',    cat: 'FILTER',  color: '#0ea5e9', hasInputs: true, hasOutputs: true },
    threshold:      { label: 'Threshold',        cat: 'FILTER',  color: '#0ea5e9', hasInputs: true, hasOutputs: true },

    // ── Transform ───────────────────────────────────────────────────────────
    resize: { label: 'Resize Image', cat: 'TRANSFORM', color: '#f59e0b', hasInputs: true, hasOutputs: true },
    crop:   { label: 'Crop Image',   cat: 'TRANSFORM', color: '#f59e0b', hasInputs: true, hasOutputs: true },
    rotate: { label: 'Rotate Image', cat: 'TRANSFORM', color: '#f59e0b', hasInputs: true, hasOutputs: true },
    flip:   { label: 'Flip Image',   cat: 'TRANSFORM', color: '#f59e0b', hasInputs: true, hasOutputs: true },

    // ── 1. Video Input Nodes ────────────────────────────────────────────────
    video_input:        { label: 'Upload Video',         cat: 'VIDEO INPUT',      color: '#ec4899', hasInputs: false, hasOutputs: true },
    video_image_ref:    { label: 'Upload Image',         cat: 'VIDEO INPUT',      color: '#ec4899', hasInputs: false, hasOutputs: true },
    video_audio_ref:    { label: 'Upload Audio',         cat: 'VIDEO INPUT',      color: '#ec4899', hasInputs: false, hasOutputs: true },
    video_url:          { label: 'Video URL',            cat: 'VIDEO INPUT',      color: '#ec4899', hasInputs: false, hasOutputs: true },

    // ── 2. Video Generation Nodes ───────────────────────────────────────────
    text_to_video:      { label: 'Text to Video',        cat: 'VIDEO GENERATION', color: '#f43f5e', hasInputs: false, hasOutputs: true, isAI: true, isVideoGen: true },
    image_to_video:     { label: 'Image to Video',       cat: 'VIDEO GENERATION', color: '#f43f5e', hasInputs: true,  hasOutputs: true, isAI: true, isVideoGen: true },
    multi_image_to_video:{ label: 'Multi-Image to Video',cat: 'VIDEO GENERATION', color: '#f43f5e', hasInputs: true,  hasOutputs: true, isAI: true, isVideoGen: true, multiInput: true },
    video_from_script:  { label: 'Video from Script',    cat: 'VIDEO GENERATION', color: '#f43f5e', hasInputs: false, hasOutputs: true, isAI: true, isVideoGen: true },
    video_preview:      { label: 'Video Preview',        cat: 'VIDEO OUTPUT',     color: '#fb7185', hasInputs: true,  hasOutputs: true },
    video_output:       { label: 'Video Output',         cat: 'VIDEO OUTPUT',     color: '#e11d48', hasInputs: true,  hasOutputs: false },

    // ── 3. Video Editing Nodes ──────────────────────────────────────────────
    ai_video_edit:      { label: 'AI Video Edit',        cat: 'VIDEO EDITING',    color: '#e11d48', hasInputs: true,  hasOutputs: true, isAI: true, isVideoGen: true },
    video_trim:         { label: 'Trim / Cut',           cat: 'VIDEO EDITING',    color: '#e11d48', hasInputs: true,  hasOutputs: true },
    replace_scene:      { label: 'Replace Scene',        cat: 'VIDEO EDITING',    color: '#e11d48', hasInputs: true,  hasOutputs: true, isAI: true },
    remove_object_video:{ label: 'Remove Object',        cat: 'VIDEO EDITING',    color: '#e11d48', hasInputs: true,  hasOutputs: true, isAI: true },
    video_upscale:      { label: 'Video Upscale',        cat: 'VIDEO EDITING',    color: '#e11d48', hasInputs: true,  hasOutputs: true, isAI: true },
    video_reframe:      { label: 'Resize / Reframe',     cat: 'VIDEO EDITING',    color: '#e11d48', hasInputs: true,  hasOutputs: true },
    video_audio_merge:  { label: 'Video + Voice',        cat: 'VIDEO EDITING',    color: '#e11d48', hasInputs: true,  hasOutputs: true },

    // ── 4. Audio Nodes ──────────────────────────────────────────────────────
    text_to_speech:     { label: 'Text to Speech',       cat: 'AUDIO',            color: '#14b8a6', hasInputs: false, hasOutputs: true, isAI: true },
    voiceover:          { label: 'Voiceover',            cat: 'AUDIO',            color: '#14b8a6', hasInputs: true,  hasOutputs: true },
    sound_effects:      { label: 'Sound Effects',        cat: 'AUDIO',            color: '#14b8a6', hasInputs: false, hasOutputs: true, isAI: true },
    bg_music:           { label: 'Background Music',     cat: 'AUDIO',            color: '#14b8a6', hasInputs: true,  hasOutputs: true },
    remove_audio:       { label: 'Remove Audio',         cat: 'AUDIO',            color: '#14b8a6', hasInputs: true,  hasOutputs: true },
    audio_mixer:        { label: 'Audio Mixer',          cat: 'AUDIO',            color: '#14b8a6', hasInputs: true,  hasOutputs: true },
    audio_input:        { label: 'Audio Input',          cat: 'AUDIO',            color: '#14b8a6', hasInputs: false, hasOutputs: true },
    audio_trim:         { label: 'Trim Audio',           cat: 'AUDIO',            color: '#14b8a6', hasInputs: true,  hasOutputs: true },
    audio_volume:       { label: 'Adjust Volume',        cat: 'AUDIO',            color: '#14b8a6', hasInputs: true,  hasOutputs: true },
    audio_fade:         { label: 'Fade In/Out',          cat: 'AUDIO',            color: '#14b8a6', hasInputs: true,  hasOutputs: true },
    audio_pitch:        { label: 'Pitch & Speed',        cat: 'AUDIO',            color: '#14b8a6', hasInputs: true,  hasOutputs: true },
    audio_denoise:      { label: 'Noise Reduction',      cat: 'AUDIO',            color: '#14b8a6', hasInputs: true,  hasOutputs: true },
    audio_output:       { label: 'Audio Output',         cat: 'AUDIO',            color: '#14b8a6', hasInputs: true,  hasOutputs: false },

    // ── 5. Text and Subtitle Nodes ──────────────────────────────────────────
    auto_subtitles:     { label: 'Auto Subtitles',       cat: 'TEXT & SUBTITLES', color: '#06b6d4', hasInputs: true,  hasOutputs: true, isAI: true },
    video_text:         { label: 'Add Text',             cat: 'TEXT & SUBTITLES', color: '#06b6d4', hasInputs: true,  hasOutputs: true },
    translate_subtitles:{ label: 'Translate Subtitles',  cat: 'TEXT & SUBTITLES', color: '#06b6d4', hasInputs: true,  hasOutputs: true, isAI: true },
    animated_text:      { label: 'Animated Text',        cat: 'TEXT & SUBTITLES', color: '#06b6d4', hasInputs: true,  hasOutputs: true },
    speech_to_text:     { label: 'Speech to Text',       cat: 'TEXT & SUBTITLES', color: '#06b6d4', hasInputs: true,  hasOutputs: true, isAI: true },
    subtitle_styling:   { label: 'Subtitle Styling',     cat: 'TEXT & SUBTITLES', color: '#06b6d4', hasInputs: true,  hasOutputs: true },

    // ── 6. Visual Effects Nodes ─────────────────────────────────────────────
    video_color_correction: { label: 'Color Correction', cat: 'VISUAL EFFECTS',   color: '#8b5cf6', hasInputs: true,  hasOutputs: true },
    video_color_grading:    { label: 'Color Grading',    cat: 'VISUAL EFFECTS',   color: '#8b5cf6', hasInputs: true,  hasOutputs: true },
    video_transitions:      { label: 'Transitions',      cat: 'VISUAL EFFECTS',   color: '#8b5cf6', hasInputs: true,  hasOutputs: true },
    video_slow_motion:      { label: 'Slow Motion',      cat: 'VISUAL EFFECTS',   color: '#8b5cf6', hasInputs: true,  hasOutputs: true },
    video_loop:             { label: 'Loop Video',       cat: 'VISUAL EFFECTS',   color: '#8b5cf6', hasInputs: true,  hasOutputs: true },
    video_overlay:          { label: 'Overlay',          cat: 'VISUAL EFFECTS',   color: '#8b5cf6', hasInputs: true,  hasOutputs: true },
    video_bg_removal:       { label: 'Background Removal', cat: 'VISUAL EFFECTS', color: '#8b5cf6', hasInputs: true,  hasOutputs: true, isAI: true },
    video_ai_effects:       { label: 'AI Effects',       cat: 'VISUAL EFFECTS',   color: '#8b5cf6', hasInputs: true,  hasOutputs: true, isAI: true },

    // ── TEXT ────────────────────────────────────────────────────────────────
    ai_text_to_image:   { label: 'Text to Image',        cat: 'TEXT', color: '#f97316', hasInputs: false, hasOutputs: true, isAI: true },
    prompt_enhancer:    { label: 'Prompt Enhancer',      cat: 'TEXT', color: '#f97316', hasInputs: false, hasOutputs: true, isAI: true },
    style_preset:       { label: 'Style Preset',         cat: 'TEXT', color: '#f97316', hasInputs: true,  hasOutputs: true },
    text_output:        { label: 'Output',               cat: 'TEXT', color: '#f97316', hasInputs: true,  hasOutputs: false },
};

const DEFAULT_PARAMS = {
    image_input: {}, multiple_image_input: { slotCount: 2, slot1: null, slot2: null, slot3: null, slot4: null }, image_preview: {}, image_output: { format: 'PNG', quality: 95 },
    ai_image_edit: { prompt: '', model: 'black-forest-labs/flux-3-image-klein' },
    ai_background_edit: { prompt: '', model: 'black-forest-labs/flux-3-image-klein' },
    ai_object_replacement: { prompt: '', target_object: '', replacement_object: '', model: 'black-forest-labs/flux-3-image-klein' },
    ai_multi_image_edit: { prompt: '', model: 'bytedance-seed/seedream-5.5' },
    resize: { width: 1080, height: 1080, mode: 'fit' }, crop: { aspect_ratio: '1:1', left: 0, top: 0, width: 800, height: 800 },
    rotate: { angle: 90, expand: true }, flip: { direction: 'horizontal' }, brightness: { factor: 1.25 },
    contrast: { factor: 1.25 }, saturation: { factor: 1.3 }, grayscale: {}, color_balance: { red: 1.15, green: 1.0, blue: 0.9 },
    auto_contrast: { cutoff: 1 }, blur: { radius: 3.0, type: 'gaussian' }, sharpen: { factor: 1.6 },
    edge_detection: { threshold1: 100, threshold2: 200, tint: 'cyan' },
    sepia: { intensity: 0.8 }, vignette: { radius: 0.75, intensity: 0.6 },
    invert: {}, threshold: { thresh: 128 },
    video_input: {}, video_image_ref: {}, video_audio_ref: {}, video_url: { url: '' },
    text_to_video: { prompt: 'Cinematic aerial view of futuristic city at sunrise, 4k ultra-realistic', model: 'alibaba/wan-3.0', duration: 5, aspect_ratio: '16:9', resolution: '720p' },
    image_to_video: { prompt: 'Subtle atmospheric camera zoom and gentle motion', model: 'alibaba/wan-3.0', duration: 5, aspect_ratio: '16:9', resolution: '720p' },
    multi_image_to_video: { prompt: 'Seamless transition between reference scenes', model: 'alibaba/wan-3.0', duration: 6, aspect_ratio: '16:9', resolution: '720p' },
    video_from_script: { script: 'Scene 1: An introduction to our high tech future.\nScene 2: Showing the transformation.', model: 'alibaba/wan-3.0', duration: 5, aspect_ratio: '16:9', resolution: '720p' },
    video_preview: {},
    video_output: { format: 'MP4' },
    ai_video_edit: { prompt: 'Change scene lighting to golden hour sunset', model: 'alibaba/wan-3.0' },
    video_trim: { start: 0, end: 15 },
    replace_scene: { scene_description: 'Replace with futuristic interior', model: 'alibaba/wan-3.0' },
    remove_object_video: { target_object: 'microphone wire' },
    video_upscale: { target_resolution: '4K', model: 'alibaba/wan-3.0' },
    video_reframe: { aspect_ratio: '9:16' },
    video_audio_merge: {},
    text_to_speech: { text: 'Welcome to the NetRoot Studio video production suite.', voice: 'Natural English Male', voice_model: 'heygen/heygen-voice-1-turbo:free', speed: 1.0 },
    voiceover: { text: 'Narrate over video timeline', volume: 1.0, voice: 'Natural English Female', voice_model: 'heygen/heygen-voice-1-turbo:free', speed: 1.0 },
    sound_effects: { effect_type: 'Cinematic Whoosh', prompt: '', volume: 0.8, voice_model: 'bytedance-seed/seed-audio-1-0' },
    bg_music: { genre: 'Ambient Synthwave', prompt: '', volume: 0.4, voice_model: 'bytedance-seed/seed-audio-1-0' },
    remove_audio: {},
    audio_mixer: { original_volume: 0.5, bg_volume: 0.5 },
    audio_input: {}, audio_trim: { start: 0, end: 30 }, audio_volume: { factor: 1.0 },
    audio_fade: { in_duration: 2.0, out_duration: 2.0 }, audio_pitch: { pitch: 1.0, speed: 1.0 },
    audio_denoise: { level: 50 },
    audio_output: {},
    auto_subtitles: { language: 'en', font_size: 24, font_color: '#ffffff' },
    video_text: { text: 'NetRoot Studio', size: 36, position: 'bottom', color: '#ffffff' },
    translate_subtitles: { target_language: 'Spanish' },
    animated_text: { text: 'Trending Now', animation: 'Fade In' },
    speech_to_text: { model: 'Whisper Large' },
    subtitle_styling: { font: 'Inter', color: '#ffff00', bg_box: true },
    video_color_correction: { brightness: 1.1, contrast: 1.15, saturation: 1.2 },
    video_color_grading: { preset: 'Cinematic Teal & Orange' },
    video_transitions: { transition: 'Cross Dissolve', duration: 1.0 },
    video_slow_motion: { factor: 0.5 },
    video_loop: { loops: 3 },
    video_overlay: { opacity: 0.8, blend_mode: 'Overlay' },
    video_bg_removal: { replace_with: 'Transparent' },
    video_ai_effects: { effect: 'Cyberpunk Glow' },
    ai_text_to_image: { prompt: 'A futuristic cybernetic city at twilight, cinematic lighting, ultra-detailed 8k', model: 'black-forest-labs/flux-3-image-klein', aspect_ratio: '1:1', quality: 'standard' },
    prompt_enhancer: { prompt: 'A beautiful landscape', style: 'hyperrealistic, volumetric lighting, photorealistic' },
    style_preset: { style: 'Cinematic', strength: 80 },
    text_output: {},
};

const OPENROUTER_MODELS = [
    { id: 'black-forest-labs/flux-3-image-klein', label: 'FLUX 3 Image Klein', tag: 'Fast', desc: 'Precision Generation & Edit' },
    { id: 'meta/muse-image', label: 'Muse Image', tag: 'Agentic', desc: 'Inpainting & Editing' },
    { id: 'bytedance-seed/seedream-5.0-flash', label: 'Seedream 5.0 Flash', tag: 'Speed', desc: 'High-Volume Edit' },
    { id: 'bytedance-seed/seedream-5.5', label: 'Seedream 5.5', tag: 'Composite', desc: 'Multi-Image Blend' },
    { id: 'krea/k3-edit', label: 'Krea K3 Edit', tag: 'Creative', desc: 'Style & Refinement' },
];

const VIDEO_MODELS = [
    { id: 'heygen/heygen-video-1', label: 'HeyGen Video', tag: 'Video Gen', desc: 'Avatar & AI Video Synthesis' },
    { id: 'alibaba/wan-3.0', label: 'Alibaba Wan 3.0', tag: 'Recommended', desc: 'Text / Image to Video, up to 1080p' },
];

// Capabilities mirror OpenRouter's /api/v1/videos/models metadata.
const VIDEO_MODEL_CAPS = {
    'alibaba/wan-3.0': { durations: [2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30], resolutions: ['480p', '720p', '1080p'], aspectRatios: ['16:9', '4:3', '1:1', '3:4', '9:16', '21:9'], defaultResolution: '720p' },
    'heygen/heygen-video-1': { durations: [5, 8, 10, 15, 20, 30], resolutions: ['480p', '768p', '1080p', '2K'], aspectRatios: ['21:9', '16:9', '4:3', '1:1', '3:4', '9:16'], defaultResolution: '768p' },
};
const DEFAULT_VIDEO_CAPS = { durations: [5, 10, 15, 20, 30], resolutions: ['480p', '720p', '1080p'], aspectRatios: ['16:9', '4:3', '1:1', '3:4', '9:16'], defaultResolution: '720p' };
const getVideoCaps = (modelId) => VIDEO_MODEL_CAPS[modelId] || DEFAULT_VIDEO_CAPS;

const VIDEO_GEN_NODE_TYPES = new Set(['text_to_video', 'image_to_video', 'multi_image_to_video', 'video_from_script']);
const TEXT_ONLY_NODE_TYPES = new Set(['ai_text_to_image', 'text_to_video', 'video_from_script']);
const AUDIO_GEN_NODE_TYPES = new Set(['text_to_speech', 'voiceover', 'sound_effects', 'bg_music']);

// OpenRouter audio models.
const AUDIO_MODEL_OPTIONS = [
    { id: 'heygen/heygen-voice-1-turbo:free', label: 'HeyGen Voice 1 Turbo (Free)' },
    { id: 'bytedance-seed/seed-audio-1-0', label: 'Seed Audio 1.0' },
];
const DEFAULT_AUDIO_MODEL = AUDIO_MODEL_OPTIONS[0].id;

const MODELS = [
    { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash', tag: 'Reasoning' },
    { id: 'gemini-3.7-flash', label: 'Gemini 3.7 Flash', tag: 'Balanced' }
];

const STORAGE_KEY = 'netroot_edit_studio_workflow';

export default function EditStudioPage() {
    const { user } = useAuth();
    const { theme } = useTheme();
    const darkMode = theme === 'dark';

    const [mode, setMode] = useState('workflow');
    const [activeTab, setActiveTab] = useState('image');
    const [expandedSections, setExpandedSections] = useState({
        'AI EDITING': true, 'IMAGE': true, 'ADJUST': true,
        'VIDEO INPUT': true, 'VIDEO GENERATION': true, 'VIDEO OUTPUT': true,
        'TEXT': true,
    });

    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [assets, setAssets] = useState([]);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [connectingSource, setConnectingSource] = useState(null);
    const [nodeStatuses, setNodeStatuses] = useState({});
    const [pan, setPan] = useState({ x: 100, y: 80 });
    const [zoom, setZoom] = useState(1);
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
    const [showGenModelMenu, setShowGenModelMenu] = useState(false);
    const [activeModelDropdownNodeId, setActiveModelDropdownNodeId] = useState(null);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [showInspector, setShowInspector] = useState(true);
    const [aiNodeResults, setAiNodeResults] = useState({});
    const [nodeRunning, setNodeRunning] = useState({});
    const [outputDimensions, setOutputDimensions] = useState(null);
    const [secondAsset, setSecondAsset] = useState(null);
    const [webcamModalOpen, setWebcamModalOpen] = useState(false);
    const [webcamStream, setWebcamStream] = useState(null);
    const videoRef = useRef(null);

    // Simple Mode States
    const [simplePrompt, setSimplePrompt] = useState('');
    const [simplePlan, setSimplePlan] = useState([]);
    const [simpleOriginalUrl, setSimpleOriginalUrl] = useState(null);
    const [simpleResultUrl, setSimpleResultUrl] = useState(null);
    const [simpleCompareSlider, setSimpleCompareSlider] = useState(50);
    const [simpleViewMode, setSimpleViewMode] = useState('split');
    const [simpleLoading, setSimpleLoading] = useState(false);
    const [quickAdjust, setQuickAdjust] = useState({ brightness: 1.0, contrast: 1.0, saturation: 1.0, sharpen: 1.0, blur: 0 });

    const [isRunning, setIsRunning] = useState(false);
    const [logs, setLogs] = useState([]);
    const [logsOpen, setLogsOpen] = useState(false);
    const [workflowResultUrl, setWorkflowResultUrl] = useState(null);
    const [workflowResultType, setWorkflowResultType] = useState('image');
    const [workflowResultText, setWorkflowResultText] = useState('');
    const [previewImageUrl, setPreviewImageUrl] = useState(null);
    const [templatesOpen, setTemplatesOpen] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [savedWorkflows, setSavedWorkflows] = useState([]);
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [galleryTab, setGalleryTab] = useState('images'); // 'images', 'videos', 'audios', 'workflows'
    const [saveModalOpen, setSaveModalOpen] = useState(false);
    const [workflowNameInput, setWorkflowNameInput] = useState('');
    const [toasts, setToasts] = useState([]);

    const addToast = (msg, type = 'info') => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, msg, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
    };

    const addLog = useCallback((message, type = 'info') => {
        setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text: message, type }]);
        setTimeout(() => {
            const logContainer = document.getElementById('log-container');
            if (logContainer) logContainer.scrollTop = logContainer.scrollHeight;
        }, 100);
    }, []);

    const canvasRef = useRef(null);

    useEffect(() => {
        fetchAssets();
        fetchTemplates();
        fetchSavedWorkflows();
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.nodes && parsed.edges) {
                    setNodes(parsed.nodes); setEdges(parsed.edges);
                    setHistory([JSON.stringify({ nodes: parsed.nodes, edges: parsed.edges })]);
                    setHistoryIndex(0);
                }
            }
        } catch (e) {}
    }, []);

    useEffect(() => {
        if (nodes.length > 0 || edges.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges }));
        }
    }, [nodes, edges]);

    useEffect(() => {
        return () => { if (webcamStream) webcamStream.getTracks().forEach(track => track.stop()); };
    }, [webcamStream]);

    const saveState = (newNodes, newEdges) => {
        const state = JSON.stringify({ nodes: newNodes, edges: newEdges });
        setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push(state);
            return newHistory;
        });
        setHistoryIndex(prev => prev + 1);
    };

    const updateState = (newNodes, newEdges) => {
        setNodes(newNodes); setEdges(newEdges); saveState(newNodes, newEdges);
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            const prevState = JSON.parse(history[historyIndex - 1]);
            setNodes(prevState.nodes); setEdges(prevState.edges); setHistoryIndex(prev => prev - 1);
            addLog('Undo action performed', 'info');
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            const nextState = JSON.parse(history[historyIndex + 1]);
            setNodes(nextState.nodes); setEdges(nextState.edges); setHistoryIndex(prev => prev + 1);
            addLog('Redo action performed', 'info');
        }
    };

    const handleClearCanvas = () => {
        setNodes([]); setEdges([]); setNodeStatuses({}); setWorkflowResultUrl(null); setAiNodeResults({});
        setWorkflowResultText(''); setOutputDimensions(null);
        localStorage.removeItem(STORAGE_KEY); setHistory([]); setHistoryIndex(-1);
        addToast('Canvas cleared', 'info'); addLog('Canvas cleared by user', 'warning');
    };

    const handleLoadTemplate = (tpl) => {
        if (!tpl?.workflow) return;
        resetRunResults();
        setSelectedNodeId(null);
        setLogsOpen(false);
        updateState(tpl.workflow.nodes, tpl.workflow.edges);
        setMode('workflow');
        setTemplatesOpen(false);
        fitNodesView(tpl.workflow.nodes);
        addToast(`Loaded "${tpl.name}" template`, 'success');
        addLog(`Loaded template: ${tpl.name}`, 'info');
    };

    const handleAutoLayout = () => {
        if (nodes.length === 0) return;
        const startX = 80; const startY = 160; const spacingX = 280;
        const newNodes = nodes.map((node, index) => ({ ...node, position: { x: startX + index * spacingX, y: startY } }));
        updateState(newNodes, edges); addToast('Auto-layout applied', 'success');
    };

    const fetchAssets = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/assets`);
            const data = await res.json().catch(() => ({ assets: [] }));
            setAssets(data.assets || []);
        } catch (err) {}
    };

    const fetchTemplates = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/templates`);
            const data = await res.json();
            setTemplates(data.templates || []);
        } catch (err) {}
    };

    const fetchSavedWorkflows = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/saved-workflows`);
            const data = await res.json();
            setSavedWorkflows(data.workflows || []);
        } catch (err) {}
    };

    const handleSaveWorkflow = async () => {
        if (nodes.length === 0) return addToast('No nodes to save', 'warning');
        const name = workflowNameInput.trim() || `Workflow ${new Date().toLocaleDateString()}`;
        try {
            const res = await fetch(`${API_BASE}/api/saved-workflows`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, nodes, edges })
            });
            const data = await res.json();
            if (data.success) {
                addToast(`Workflow "${name}" saved!`, 'success');
                setSaveModalOpen(false);
                setWorkflowNameInput('');
                await fetchSavedWorkflows();
            } else {
                throw new Error('Save failed');
            }
        } catch (err) {
            addToast('Could not save workflow', 'error');
        }
    };

    const handleDeleteSavedWorkflow = async (id, e) => {
        e?.stopPropagation();
        try {
            const res = await fetch(`${API_BASE}/api/saved-workflows/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setSavedWorkflows(prev => prev.filter(w => w.id !== id));
                addToast('Workflow removed', 'info');
            }
        } catch (err) {}
    };

    const handleDeleteAsset = async (filename, e) => {
        e?.stopPropagation();
        try {
            const res = await fetch(`${API_BASE}/api/assets/${filename}`, { method: 'DELETE' });
            if (res.ok) {
                setAssets(prev => prev.filter(a => a.id !== filename && a.url !== filename));
                addToast(`Removed "${filename}"`, 'info');
            }
        } catch (err) {}
    };

    const saveAssetToLibrary = async (url) => {
        if (!url) return;
        const filename = String(url).split('?')[0].split('#')[0].split('/').pop();
        if (!filename) return;
        try {
            const res = await fetch(`${API_BASE}/api/library/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename }),
            });
            if (!res.ok) throw new Error('Could not save to Library');
            addToast('Saved to Library!', 'success');
            await fetchAssets();
        } catch (err) {
            addToast(err.message || 'Could not save to Library', 'error');
        }
    };

    const handleSaveImageToLibrary = saveAssetToLibrary;

    const handleSaveToLibrary = saveAssetToLibrary;

    const assetSrc = (url) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return `${API_BASE}/api/asset/${encodeURIComponent(url)}`;
    };

    const nodeVideoUrl = (nodeId) => {
        const direct = aiNodeResults[nodeId];
        if (direct && /\.(mp4|webm|mov)$/i.test(direct)) return direct;
        const fromRun = nodeStatuses?.[nodeId]?.asset_url;
        if (fromRun && /\.(mp4|webm|mov)$/i.test(fromRun)) return fromRun;
        return null;
    };

    const nodeAssetUrl = (nodeId) => aiNodeResults[nodeId] || nodeStatuses?.[nodeId]?.asset_url || null;

    const fitNodesView = (list) => {
        if (!list || list.length === 0) return;
        const minX = Math.min(...list.map(n => n.position.x));
        const minY = Math.min(...list.map(n => n.position.y));
        const maxX = Math.max(...list.map(n => n.position.x + 240));
        const maxY = Math.max(...list.map(n => n.position.y + 330));
        const availW = (canvasRef.current?.clientWidth || 1200) - 160;
        const availH = (canvasRef.current?.clientHeight || 800) - 200;
        const nextZoom = Math.min(1, Math.max(0.45,
            Math.min(availW / Math.max(1, maxX - minX), availH / Math.max(1, maxY - minY))));
        setZoom(Number(nextZoom.toFixed(2)));
        setPan({ x: 70 - minX * nextZoom, y: 130 - minY * nextZoom });
    };

    const resetRunResults = () => {
        setNodeStatuses({});
        setWorkflowResultUrl(null);
        setWorkflowResultText('');
        setWorkflowResultType('image');
        setOutputDimensions(null);
        setAiNodeResults({});
    };

    const handleFileUpload = async (e, nodeId = null) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const formData = new FormData(); formData.append('file', file);
        try {
            const res = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: formData });
            if (!res.ok) throw new Error('Upload failed');
            const data = await res.json();
            if (nodeId) {
                const target = nodes.find(n => n.id === nodeId);
                if (target?.type === 'video_input') handleUpdateNodeParams(nodeId, { video_id: data.id, image_id: data.id });
                else if (target?.type === 'video_audio_ref' || target?.type === 'audio_input') handleUpdateNodeParams(nodeId, { audio_id: data.id, image_id: data.id });
                else handleUpdateNodeParam(nodeId, 'image_id', data.id);
            }
            setSelectedAsset(data);
            setSimpleOriginalUrl(data.url || data.id);
            setSimpleResultUrl(null);
            addToast('Asset uploaded successfully!', 'success');
            await fetchAssets();
        } catch (err) {
            addToast(err.message, 'error');
        }
    };

    const openWebcam = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setWebcamStream(stream); setWebcamModalOpen(true);
            setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
        } catch (err) {
            addToast('Could not access webcam.', 'error');
        }
    };

    const captureWebcam = async () => {
        if (!videoRef.current) return;
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth; canvas.height = videoRef.current.videoHeight;
        canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
        canvas.toBlob(async (blob) => {
            const file = new File([blob], `webcam_${Date.now()}.png`, { type: 'image/png' });
            const formData = new FormData(); formData.append('file', file);
            try {
                const res = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: formData });
                const data = await res.json();
                setSelectedAsset(data); 
                setSimpleOriginalUrl(data.url || data.id);
                setSimpleResultUrl(null);
                await fetchAssets();
                addToast('Webcam image captured!', 'success');
            } catch (err) { addToast('Failed to upload webcam image', 'error'); } finally { closeWebcam(); }
        }, 'image/png');
    };

    const closeWebcam = () => {
        if (webcamStream) { webcamStream.getTracks().forEach(track => track.stop()); setWebcamStream(null); }
        setWebcamModalOpen(false);
    };

    const handleDownloadImage = async (url, filename = "result.png") => {
        try {
            const assetUrl = url.startsWith('http')
                ? url
                : `${API_BASE}${url.startsWith('/api/asset/')
                    ? url
                    : `/api/asset/${encodeURIComponent(url)}`}`;
            const response = await fetch(assetUrl);
            if (!response.ok) throw new Error(`Download failed (${response.status})`);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a'); link.href = blobUrl; link.download = filename;
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
            window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
            addToast('Download started.', 'success');
        } catch (err) {
            addToast(err.message || 'Download failed.', 'error');
        }
    };

    const handleGenerateWorkflow = async () => {
        if (!aiPrompt.trim()) return;
        setIsGenerating(true); addLog(`Generating workflow...`, 'info');
        try {
            const res = await fetch(`${API_BASE}/api/workflow/generate`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: aiPrompt, model: selectedModel, asset_id: selectedAsset?.id })
            });
            const data = await res.json();
            if (data.status === 'ok' && data.workflow) {
                resetRunResults();
                setSelectedNodeId(null);
                updateState(data.workflow.nodes, data.workflow.edges);
                fitNodesView(data.workflow.nodes);
                addToast('Workflow generated!', 'success');
            } else {
                addToast(data.detail?.message || data.detail || 'Could not generate a workflow.', 'error');
            }
        } catch (err) { addToast(err.message, 'error'); } finally { setIsGenerating(false); }
    };

    const handleRunAINode = async (node) => {
        const spec = NODE_TYPES[node.type] || {};
        const isVideo = !!spec.isVideoGen;
        const isAudioGen = AUDIO_GEN_NODE_TYPES.has(node.type);
        let sourceImgId = node.data?.parameters?.image_id || null;
        let secondImgId = null;
        let extraImageIds = [];

        // Gather reference images from every connected input first (multi-image slots and separate image nodes)
        const refIds = [];
        const incomingEdges = edges.filter(e => e.target === node.id);
        for (const edge of incomingEdges) {
            const parentNode = nodes.find(n => n.id === edge.source);
            const p = parentNode?.data?.parameters;
            if (!p) continue;
            if (parentNode.type === 'multiple_image_input') {
                const slotCount = p.slotCount || 2;
                for (let i = 0; i < slotCount; i++) {
                    const slotVal = p[`slot${i + 1}`];
                    if (slotVal) refIds.push(slotVal);
                }
            } else if (p.image_id) {
                refIds.push(p.image_id);
            } else if (p.video_id) {
                refIds.push(p.video_id);
            }
        }
        const uniqueRefs = [...new Set(refIds.filter(Boolean))];
        if (!sourceImgId && uniqueRefs.length) sourceImgId = uniqueRefs[0];
        const otherRefs = uniqueRefs.filter(id => id !== sourceImgId);
        secondImgId = otherRefs[0] || null;
        extraImageIds = otherRefs.slice(1);

        if (!sourceImgId && !isVideo && !isAudioGen && selectedAsset?.id) {
            const looksLikeMedia = /\.(mp4|webm|mov|mp3|wav|ogg|aac|m4a|txt)$/i.test(selectedAsset.id);
            if (!looksLikeMedia) sourceImgId = selectedAsset.id;
        }

        const textOnly = TEXT_ONLY_NODE_TYPES.has(node.type) || isAudioGen;
        if (!textOnly && node.type !== 'multi_image_to_video' && !sourceImgId) {
            addToast(isVideo ? 'Connect an image before generating video.' : 'Upload an image to the input node first.', 'warning');
            return;
        }
        if (node.type === 'multi_image_to_video' && !sourceImgId) {
            addToast('Upload at least one reference image.', 'warning');
            return;
        }

        setNodeRunning(prev => ({ ...prev, [node.id]: true }));
        try {
            const params = node.data?.parameters || {};
            let promptText = params.prompt || params.script || '';
            if (node.type === 'sound_effects' && !promptText) promptText = `Sound effect: ${params.effect_type || 'cinematic whoosh'}`;
            if (node.type === 'bg_music' && !promptText) promptText = `Background music: ${params.genre || 'ambient synthwave'}`;
            if (isAudioGen && !promptText) promptText = params.text || '';
            const payload = {
                image_id: sourceImgId || '',
                image_ids: extraImageIds,
                reference_image_id: secondImgId || null,
                prompt: promptText,
                script: params.script || '',
                node_type: node.type,
                model: isVideo
                    ? (VIDEO_MODELS.some(m => m.id === params.model) ? params.model : 'alibaba/wan-3.0')
                    : (OPENROUTER_MODELS.some(m => m.id === params.model)
                        ? params.model
                        : (node.type === 'ai_multi_image_edit' ? 'bytedance-seed/seedream-5.5' : 'black-forest-labs/flux-3-image-klein')),
                target_object: params.target_object || '',
                replacement_object: params.replacement_object || '',
                aspect_ratio: params.aspect_ratio || (isVideo ? '16:9' : '1:1'),
                duration: params.duration || 5,
                resolution: params.resolution || (isVideo ? '720p' : '768p'),
                quality: params.quality || 'standard',
                voice: params.voice || null,
                voice_model: isAudioGen
                    ? (AUDIO_MODEL_OPTIONS.some(m => m.id === params.voice_model) ? params.voice_model : DEFAULT_AUDIO_MODEL)
                    : (params.voice_model || null),
                speed: params.speed || null,
            };
            const res = await fetch(`${API_BASE}/api/ai/edit-node`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                const detail = data.detail;
                const message = typeof detail === 'string' ? detail : (detail?.message || detail?.error || data.error || 'Generation failed');
                throw new Error(message);
            }
            if (data.result_url) {
                setAiNodeResults(prev => ({ ...prev, [node.id]: data.result_url }));
                if (data.media_type === 'video' || data.media_type === 'audio') {
                    setWorkflowResultUrl(data.result_url);
                    setWorkflowResultType(data.media_type);
                }
                addToast(
                    data.media_type === 'video' ? 'Video generated!' :
                    data.media_type === 'audio' ? 'Audio generated!' :
                    node.type === 'ai_text_to_image' ? 'Image generated!' : 'AI node completed!',
                    'success'
                );
                await fetchAssets();
            }
        } catch (err) { addToast(err.message || 'AI node error', 'error'); } finally { setNodeRunning(prev => ({ ...prev, [node.id]: false })); }
    };

    // --- SIMPLE MODE LOGIC ---
    const handleSimpleEditSubmit = async (promptOverride) => {
        const textPrompt = promptOverride || simplePrompt;
        if (!textPrompt.trim() || (!selectedAsset && !simpleOriginalUrl)) {
            addToast('Please provide a prompt and an image.', 'warning'); return;
        }
        setSimpleLoading(true);
        try {
            const understandRes = await fetch(`${API_BASE}/api/ai/understand`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: textPrompt })
            });
            const understandData = await understandRes.json();
            setSimplePlan(understandData.plan || []);

            const imageId = selectedAsset ? selectedAsset.id : 'sample_sunset';
            const editRes = await fetch(`${API_BASE}/api/image/edit`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image_id: imageId, prompt: textPrompt, plan: understandData.plan })
            });
            const editData = await editRes.json();
            if (!editData.success) throw new Error(editData.detail || 'Editing failed');

            setSimpleResultUrl(editData.result_url);
            setWorkflowResultUrl(editData.result_url);
            addToast(`Edit applied!`, 'success');
            await fetchAssets();
        } catch (err) { addToast(err.message, 'error'); } finally { setSimpleLoading(false); }
    };

    const handleQuickAdjustApply = async () => {
        if (!selectedAsset) return;
        const plan = [];
        if (quickAdjust.brightness !== 1.0) plan.push({ operation: 'brightness', parameters: { factor: quickAdjust.brightness } });
        if (quickAdjust.contrast !== 1.0) plan.push({ operation: 'contrast', parameters: { factor: quickAdjust.contrast } });
        if (quickAdjust.saturation !== 1.0) plan.push({ operation: 'saturation', parameters: { factor: quickAdjust.saturation } });
        if (quickAdjust.sharpen > 1.0) plan.push({ operation: 'sharpen', parameters: { factor: quickAdjust.sharpen } });
        if (quickAdjust.blur > 0) plan.push({ operation: 'blur', parameters: { radius: quickAdjust.blur } });
        plan.push({ operation: 'convert_format', parameters: { format: 'PNG' } });

        if (plan.length <= 1) return addToast('Change at least one slider', 'info');

        setSimpleLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/image/edit`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image_id: selectedAsset.id, plan })
            });
            const data = await res.json();
            if (data.success) {
                setSimpleResultUrl(data.result_url);
                addToast('Quick adjustments rendered!', 'success');
                await fetchAssets();
            }
        } catch (err) { addToast(err.message, 'error'); } finally { setSimpleLoading(false); }
    };

    const handleSendSimpleToWorkflow = () => {
        if (simplePlan.length === 0) return addToast('Apply an edit plan first', 'info');
        let curX = 80; const y = 160; const newNodes = []; const newEdges = [];
        const inId = `node_in_${Date.now()}`;
        newNodes.push({ id: inId, type: 'image_input', position: { x: curX, y }, data: { label: 'Source Image', parameters: { image_id: selectedAsset?.id } } });
        let prev = inId;
        simplePlan.forEach((step, idx) => {
            curX += 280; const nid = `node_${step.operation}_${idx}`;
            newNodes.push({ id: nid, type: step.operation, position: { x: curX, y }, data: { label: step.operation.replace('_', ' ').toUpperCase(), parameters: step.parameters } });
            newEdges.push({ id: `e_${prev}_${nid}`, source: prev, target: nid });
            prev = nid;
        });
        curX += 280; const outId = `node_save_${Date.now()}`;
        newNodes.push({ id: outId, type: 'save_image', position: { x: curX, y }, data: { label: 'Save Result', parameters: { format: 'PNG' } } });
        newEdges.push({ id: `e_${prev}_${outId}`, source: prev, target: outId });
        updateState(newNodes, newEdges); setMode('workflow');
        addToast('Transferred to Node Workflow!', 'success');
    };

    const handleRunWorkflow = async () => {
        if (nodes.length === 0) return;
        resetRunResults();
        setIsRunning(true);
        try {
            // Prefer images stored inside the workflow nodes (saved workflows), then fall back to the sidebar selection
            let effectiveImageId = null;
            for (const n of nodes) {
                if (n.data?.parameters) {
                    const p = n.data.parameters;
                    const slotCandidates = Array.from({ length: p.slotCount || 12 }, (_, i) => p[`slot${i + 1}`]);
                    const candidate = [p.image_id, p.video_id, ...slotCandidates].find(Boolean);
                    if (candidate) {
                        effectiveImageId = candidate;
                        break;
                    }
                }
            }
            if (!effectiveImageId && selectedAsset?.id) {
                const looksLikeMedia = /\.(mp4|webm|mov|mp3|wav|ogg|aac|m4a|txt)$/i.test(selectedAsset.id);
                if (!looksLikeMedia) effectiveImageId = selectedAsset.id;
            }

            const execRes = await fetch(`${API_BASE}/api/workflow/execute`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nodes, edges, image_id: effectiveImageId })
            });
            const execData = await execRes.json();
            if (!execData.success) {
                const detail = execData.detail;
                const errMsg = typeof detail === 'string'
                    ? detail
                    : [detail?.message, detail?.error].filter(Boolean).join(': ') || detail?.errors?.join(', ') || 'Execution error';
                throw new Error(errMsg);
            }
            setNodeStatuses(execData.node_statuses || {});
            setWorkflowResultUrl(execData.output_url);
            const resultUrl = execData.output_url || '';
            const resultIsVideo = execData.output_type === 'video' || /\.(mp4|webm|mov)$/i.test(resultUrl);
            const resultIsAudio = execData.output_type === 'audio' || /\.(mp3|wav|ogg|aac|m4a)$/i.test(resultUrl);
            const resultIsText = execData.output_type === 'text' || /\.txt$/i.test(resultUrl);
            setWorkflowResultType(resultIsVideo ? 'video' : resultIsAudio ? 'audio' : resultIsText ? 'text' : 'image');
            if (resultIsText && resultUrl) {
                fetch(`${API_BASE}/api/asset/${resultUrl}`)
                    .then(r => (r.ok ? r.text() : ''))
                    .then(t => setWorkflowResultText(t))
                    .catch(() => setWorkflowResultText(''));
            } else {
                setWorkflowResultText('');
            }
            setLogsOpen(true);
            if (resultUrl && !resultIsVideo && !resultIsAudio && !resultIsText) {
                const img = new Image();
                img.onload = () => setOutputDimensions(`${img.width} x ${img.height}`);
                img.src = `${API_BASE}/api/asset/${resultUrl}`;
            } else {
                setOutputDimensions(resultIsVideo ? 'video' : resultIsAudio ? 'audio' : resultIsText ? 'text' : null);
            }
            addToast(resultIsVideo ? 'Video workflow completed!' : resultIsAudio ? 'Audio workflow completed!' : resultIsText ? 'Prompt workflow completed!' : 'Workflow completed!', 'success');
            if (resultIsVideo || resultIsAudio) await fetchAssets();
        } catch (err) { addToast(err.message, 'error'); } finally { setIsRunning(false); }
    };

    const handleAddNode = (type) => {
        const id = `node_${type}_${Date.now()}`;
        const spec = NODE_TYPES[type] || { label: type, cat: 'Filter' };
        const defaultParam = DEFAULT_PARAMS[type] ? JSON.parse(JSON.stringify(DEFAULT_PARAMS[type])) : {};
        const newX = Math.round((-pan.x + 300) / zoom); const newY = Math.round((-pan.y + 150) / zoom);
        const newNode = { id, type, position: { x: newX, y: newY }, data: { label: spec.label, parameters: defaultParam } };
        updateState([...nodes, newNode], edges); setSelectedNodeId(id);
        addToast(`Added ${spec.label}`, 'info');
    };

    const handleDeleteNode = (id) => {
        const newNodes = nodes.filter(n => n.id !== id);
        const newEdges = edges.filter(e => e.source !== id && e.target !== id);
        updateState(newNodes, newEdges); if (selectedNodeId === id) setSelectedNodeId(null);
    };

    const handleDuplicateNode = (id) => {
        const source = nodes.find(n => n.id === id);
        if (!source) return;
        const newId = `${source.type}_copy_${Date.now()}`;
        const copy = {
            ...source,
            id: newId,
            position: { x: source.position.x + 40, y: source.position.y + 40 },
            data: JSON.parse(JSON.stringify(source.data || {})),
        };
        updateState([...nodes, copy], edges);
        setSelectedNodeId(newId);
        addToast('Node duplicated', 'success');
    };

    const handleDeleteEdge = (edgeId) => {
        updateState(nodes, edges.filter(e => e.id !== edgeId));
        addLog('Connection removed', 'info');
    };

    const handleUpdateNodeParam = (nodeId, key, val) => {
        handleUpdateNodeParams(nodeId, { [key]: val });
    };

    const handleUpdateNodeParams = (nodeId, updates) => {
        const newNodes = nodes.map(n => n.id === nodeId ? { ...n, data: { ...n.data, parameters: { ...n.data.parameters, ...updates } } } : n);
        updateState(newNodes, edges);
    };

    const handleStartConnection = (e, sourceNodeId) => { e.stopPropagation(); setConnectingSource(sourceNodeId); };
    const handleEndConnection = (e, targetNodeId) => {
        e.stopPropagation();
        if (connectingSource && connectingSource !== targetNodeId) {
            if (!edges.some(edge => edge.source === connectingSource && edge.target === targetNodeId)) {
                updateState(nodes, [...edges, { id: `edge_${connectingSource}_${targetNodeId}`, source: connectingSource, target: targetNodeId }]);
            }
        }
        setConnectingSource(null);
    };

    const handleCanvasMouseDown = (e) => {
        if (e.target.closest('.node-card') || e.target.closest('.canvas-control') || e.target.closest('.left-sidebar')) return;
        setIsPanning(true); setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        setConnectingSource(null); setSelectedNodeId(null);
    };
    const handleCanvasMouseMove = (e) => { if (isPanning) setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y }); };
    const handleCanvasMouseUp = () => setIsPanning(false);

    const [draggingNode, setDraggingNode] = useState(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const handleNodeMouseDown = (e, node) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'BUTTON' || e.target.closest('.node-port')) return;
        e.stopPropagation(); setSelectedNodeId(node.id); setDraggingNode(node.id);
        const mouseX = (e.clientX - pan.x) / zoom; const mouseY = (e.clientY - pan.y) / zoom;
        setDragOffset({ x: mouseX - node.position.x, y: mouseY - node.position.y });
    };

    const handleWindowMouseMove = (e) => {
        if (draggingNode) {
            const mouseX = (e.clientX - pan.x) / zoom; const mouseY = (e.clientY - pan.y) / zoom;
            setNodes(prev => prev.map(n => n.id === draggingNode ? { ...n, position: { x: Math.round(mouseX - dragOffset.x), y: Math.round(mouseY - dragOffset.y) } } : n));
        }
    };
    const handleWindowMouseUp = () => { if (draggingNode) saveState(nodes, edges); setDraggingNode(null); };

    useEffect(() => {
        window.addEventListener('mousemove', handleWindowMouseMove);
        window.addEventListener('mouseup', handleWindowMouseUp);
        return () => { window.removeEventListener('mousemove', handleWindowMouseMove); window.removeEventListener('mouseup', handleWindowMouseUp); };
    }, [draggingNode, dragOffset, pan, zoom]);

    const handleZoom = (delta) => setZoom(prev => Math.min(2.0, Math.max(0.4, Number((prev + delta).toFixed(2)))));

    const handleFitView = () => fitNodesView(nodes);

    const selectedNode = nodes.find(n => n.id === selectedNodeId);

    const getTabsForCategory = () => {
        if (activeTab === 'image') return ['AI EDITING', 'IMAGE', 'ADJUST', 'FILTER', 'TRANSFORM'];
        if (activeTab === 'video') return ['VIDEO INPUT', 'VIDEO GENERATION', 'VIDEO OUTPUT', 'VIDEO EDITING', 'TEXT & SUBTITLES', 'VISUAL EFFECTS'];
        if (activeTab === 'audio') return ['AUDIO'];
        if (activeTab === 'text') return ['TEXT'];
        return [];
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const filteredTools = Object.entries(NODE_TYPES).filter(([key, value]) => 
        value.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={`flex flex-col h-screen w-full overflow-hidden relative ${darkMode ? 'bg-[#0a0a0f] text-white' : 'bg-gray-50 text-gray-900'} select-none`}>
            
            {/* DOT GRID & BLUE-BLACK RADIAL GLOW (DASHBOARD AESTHETIC) */}
            {darkMode && (
                <>
                    {/* Subtle Blue Radial Glow */}
                    <div 
                        className="absolute inset-0 pointer-events-none z-0"
                        style={{
                            background: 'radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.12) 0%, rgba(14, 165, 233, 0.05) 35%, transparent 70%)'
                        }}
                    />
                    {/* Clean Dot Grid Overlay */}
                    <div 
                        className="absolute inset-0 pointer-events-none z-0"
                        style={{
                            backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px)',
                            backgroundSize: '24px 24px',
                            backgroundPosition: '0 0',
                            maskImage: 'radial-gradient(ellipse at center, black 60%, transparent 100%)',
                            WebkitMaskImage: 'radial-gradient(ellipse at center, black 60%, transparent 100%)'
                        }}
                    />
                </>
            )}

            <style>{`@keyframes dash-flow { from { stroke-dashoffset: 24; } to { stroke-dashoffset: 0; } } .animated-wire { stroke-dasharray: 6 6; animation: dash-flow 0.8s linear infinite; } .wire-active { stroke-dasharray: 6 6; animation: dash-flow 0.4s linear infinite; stroke: #3b82f6; }`}</style>

            <header className={`h-14 border-b px-6 flex items-center justify-between z-30 relative shrink-0 ${darkMode ? 'border-[#1f1f1f] bg-[#0e0e0e]' : 'border-gray-200 bg-white/90 backdrop-blur'}`}>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        {/* BOLD WHITE TITLE */}
                        <span className={`font-semibold text-lg tracking-wide ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Edit Studio
                        </span>
                    </div>
                </div>

                <div className={`p-1 rounded-xl border flex items-center shadow-inner relative ${darkMode ? 'bg-[#141414] border-[#222222]' : 'bg-gray-100 border-gray-200'}`}>
                    <button
                        onClick={() => setMode('simple')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ease-in-out flex items-center space-x-2 ${
                            mode === 'simple'
                                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-600/30'
                                : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        <Wand2 className="w-3.5 h-3.5" /><span>Simple Edit</span>
                    </button>
                    <button
                        onClick={() => setMode('workflow')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ease-in-out flex items-center space-x-2 ${
                            mode === 'workflow'
                                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-600/30'
                                : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        <Layers className="w-3.5 h-3.5" /><span>Node Workflow</span>
                    </button>
                </div>

                <div className="flex items-center space-x-2">
                    {mode === 'workflow' && (
                        <div className={`flex items-center space-x-1 border rounded-xl p-1 shadow-sm ${darkMode ? 'bg-[#141414] border-[#222222]' : 'bg-gray-50 border-gray-200'}`}>
                            <button onClick={handleClearCanvas} className={`flex items-center space-x-1 px-2 py-1.5 rounded-lg text-xs font-medium transition ${darkMode ? 'hover:bg-white/5 text-gray-400 hover:text-white' : 'hover:bg-gray-200 text-gray-500'}`}><Eraser className="w-3.5 h-3.5" /><span>Clear</span></button>
                            <div className={`w-px h-4 ${darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-300'}`}></div>
                            <button onClick={() => setSaveModalOpen(true)} className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${darkMode ? 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30' : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200'}`}><Save className="w-3.5 h-3.5" /><span>Save Workflow</span></button>
                        </div>
                    )}
                    <button onClick={() => { fetchTemplates(); setTemplatesOpen(true); }} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center space-x-1.5 border ${darkMode ? 'bg-[#1a1a1a] hover:bg-[#252525] text-gray-300 hover:text-white border-[#2a2a2a]' : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 border-gray-200'}`}><Grid3X3 className="w-3.5 h-3.5" /><span>Templates</span></button>
                    <button onClick={() => { fetchAssets(); fetchSavedWorkflows(); setGalleryOpen(true); }} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center space-x-1.5 border ${darkMode ? 'bg-[#1a1a1a] hover:bg-[#252525] text-gray-300 hover:text-white border-[#2a2a2a]' : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 border-gray-200'}`}><FolderOpen className="w-3.5 h-3.5 text-cyan-400" /><span>Saved Library</span></button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden relative z-10">
                
                {/* SIMPLE EDIT MODE */}
                {mode === 'simple' && (
                    <div className={`flex-1 flex overflow-hidden ${darkMode ? 'bg-transparent' : 'bg-gray-50'}`}>
                        <div className="flex-1 flex flex-col p-4 overflow-hidden">
                            <div className="h-10 flex items-center justify-between mb-3 px-2">
                                <div className="flex items-center space-x-3">
                                    <span className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Preview Canvas</span>
                                    <div className={`border rounded-lg p-0.5 flex text-xs ${darkMode ? 'bg-[#141414] border-[#222222]' : 'bg-gray-100 border-gray-200'}`}>
                                        <button onClick={() => setSimpleViewMode('split')} className={`px-2.5 py-1 rounded transition-colors ${simpleViewMode === 'split' ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md' : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500'}`}>Curtain Slider</button>
                                        <button onClick={() => setSimpleViewMode('side-by-side')} className={`px-2.5 py-1 rounded transition-colors ${simpleViewMode === 'side-by-side' ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md' : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500'}`}>Side-by-Side</button>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <label className={`cursor-pointer px-3 py-1.5 border rounded-lg text-xs font-medium flex items-center space-x-1.5 transition ${darkMode ? 'bg-[#1a1a1a] hover:bg-[#252525] border-[#2a2a2a] text-gray-200' : 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700'}`}>
                                        <Download className="w-3.5 h-3.5" /><span>Upload</span>
                                        <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e)} className="hidden" />
                                    </label>
                                    {simpleResultUrl && (
                                        <>
                                            <button onClick={() => handleSaveImageToLibrary(simpleResultUrl)} className={`px-3 py-1.5 border rounded-lg text-xs font-medium transition flex items-center space-x-1 ${darkMode ? 'bg-[#1a1a1a] hover:bg-[#252525] border-[#2a2a2a] text-cyan-400' : 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-cyan-700'}`}>
                                                <Save className="w-3.5 h-3.5" /><span>Save to Library</span>
                                            </button>
                                            <button onClick={() => handleDownloadImage(simpleResultUrl, 'ai_result.png')} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition flex items-center space-x-1 shadow-md shadow-emerald-600/20">
                                                <Download className="w-3.5 h-3.5" /><span>Download</span>
                                            </button>
                                        </>
                                    )}
                                    <button onClick={handleSendSimpleToWorkflow} className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-medium transition flex items-center space-x-1.5 shadow-md shadow-blue-500/20">
                                        <Layers className="w-3.5 h-3.5" /><span>To Node Workflow</span>
                                    </button>
                                </div>
                            </div>

                            <div className={`flex-1 rounded-2xl border p-4 overflow-hidden flex items-center justify-center relative ${darkMode ? 'border-[#1f1f1f] bg-[#0e0e0e]/90 backdrop-blur' : 'border-gray-200 bg-white'}`}>
                                {simpleViewMode === 'split' ? (
                                    <div className={`relative max-h-full max-w-full rounded-xl overflow-hidden shadow-2xl border ${darkMode ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
                                        {simpleOriginalUrl ? (
                                            <div className="relative">
                                                <img src={`${API_BASE}/api/asset/${simpleOriginalUrl}`} alt="Source" className="max-h-[68vh] max-w-full object-contain block" />
                                                {simpleResultUrl && (
                                                    <div className="absolute inset-0 overflow-hidden" style={{ width: `${simpleCompareSlider}%` }}>
                                                        <img src={`${API_BASE}/api/asset/${simpleResultUrl}`} alt="Result" className="max-h-[68vh] max-w-none object-contain block" style={{ width: '100%', height: '100%' }} />
                                                    </div>
                                                )}
                                                {simpleResultUrl && (
                                                    <div className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)] z-10" style={{ left: `${simpleCompareSlider}%` }}>
                                                        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-cyan-400 text-[#07090e] flex items-center justify-center text-xs font-black shadow-lg"><ArrowRight className="w-3 h-3 -rotate-90" /></div>
                                                    </div>
                                                )}
                                                {simpleResultUrl && <input type="range" min="0" max="100" value={simpleCompareSlider} onChange={(e) => setSimpleCompareSlider(e.target.value)} className="absolute inset-0 opacity-0 cursor-ew-resize z-20" />}
                                                <div className={`absolute top-3 left-3 backdrop-blur px-2.5 py-1 rounded-md text-[11px] font-mono border ${darkMode ? 'bg-black/70 border-white/10 text-gray-300' : 'bg-white/80 border-gray-200 text-gray-600'}`}>
                                                    {simpleResultUrl ? 'BEFORE (Right) / AFTER (Left)' : 'ORIGINAL'}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={`p-12 text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                                <ImageIcon className="w-10 h-10 mx-auto mb-3 opacity-40" /><p className="text-sm">No source image selected.</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4 w-full h-full">
                                        <div className={`border rounded-xl p-3 flex flex-col ${darkMode ? 'border-[#1f1f1f] bg-[#141414]' : 'border-gray-200 bg-gray-50'}`}>
                                            <span className={`text-xs font-semibold uppercase mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Original</span>
                                            <div className={`flex-1 flex items-center justify-center rounded-lg overflow-hidden ${darkMode ? 'bg-[#0a0a0f]' : 'bg-gray-100'}`}>
                                                {simpleOriginalUrl ? <img src={`${API_BASE}/api/asset/${simpleOriginalUrl}`} alt="Source" className="max-h-[58vh] max-w-full object-contain" /> : <span className="text-xs">No image</span>}
                                            </div>
                                        </div>
                                        <div className={`border rounded-xl p-3 flex flex-col ${darkMode ? 'border-[#1f1f1f] bg-[#141414]' : 'border-gray-200 bg-gray-50'}`}>
                                            <span className="text-xs font-semibold text-emerald-400 uppercase mb-2">Result</span>
                                            <div className={`flex-1 flex items-center justify-center rounded-lg overflow-hidden ${darkMode ? 'bg-[#0a0a0f]' : 'bg-gray-100'}`}>
                                                {simpleLoading ? <Loader2 className="w-8 h-8 animate-spin text-blue-500" /> : simpleResultUrl ? <img src={`${API_BASE}/api/asset/${simpleResultUrl}`} alt="Result" className="max-h-[58vh] max-w-full object-contain" /> : <span className="text-xs text-gray-500">Awaiting result</span>}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <aside className={`w-96 border-l flex flex-col overflow-y-auto ${darkMode ? 'border-[#1f1f1f] bg-[#0e0e0e]/95 backdrop-blur' : 'border-gray-200 bg-white'}`}>
                            <div className={`p-4 border-b ${darkMode ? 'border-[#1f1f1f]' : 'border-gray-200'}`}>
                                <span className={`text-[11px] font-semibold uppercase tracking-wider block mb-2.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Quick Inspiration</span>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { title: 'Dramatic & Sharp', prompt: 'Increase contrast by 30%, sharpen the image, and boost saturation slightly' },
                                        { title: '1080x1080 Square', prompt: 'Resize image to 1080 by 1080 with high sharpness for social media' },
                                        { title: 'Noir B&W Film', prompt: 'Convert to black and white with deep contrast and subtle vignette' },
                                        { title: 'Golden Hour', prompt: 'Warm color balance, vintage sepia tone, and boost brightness' },
                                    ].map((item, idx) => (
                                        <button key={idx} onClick={() => { setSimplePrompt(item.prompt); handleSimpleEditSubmit(item.prompt); }} className={`p-2 border rounded-lg text-left text-xs transition group ${darkMode ? 'bg-[#141414] hover:bg-[#1a1a24] border-[#22222a] hover:border-blue-500/50' : 'bg-gray-50 hover:bg-gray-100 border-gray-200'}`}>
                                            <div className={`font-medium ${darkMode ? 'text-gray-300 group-hover:text-blue-400' : 'text-gray-700 group-hover:text-indigo-600'}`}>{item.title}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className={`p-4 border-b flex flex-col space-y-3 ${darkMode ? 'border-[#1f1f1f]' : 'border-gray-200'}`}>
                                <label className={`text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>What should change?</label>
                                <textarea rows="3" value={simplePrompt} onChange={(e) => setSimplePrompt(e.target.value)} placeholder="e.g. Make the image brighter..." className={`w-full border rounded-xl p-3 text-xs focus:outline-none focus:border-blue-500 ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`} />
                                <button onClick={() => handleSimpleEditSubmit()} disabled={simpleLoading} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold transition flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/20">
                                    {simpleLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                                    <span>{simpleLoading ? 'Processing...' : 'Apply Edit'}</span>
                                </button>
                            </div>

                            <div className="p-4 flex flex-col space-y-4">
                                <span className={`text-[11px] font-semibold uppercase tracking-wider block ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Manual Fine-Tuning</span>
                                <div>
                                    <div className="flex justify-between text-xs mb-1.5"><span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Brightness</span><span className={`font-mono text-[11px] font-bold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{quickAdjust.brightness.toFixed(2)}x</span></div>
                                    <input type="range" min="0.2" max="2.0" step="0.05" value={quickAdjust.brightness} onChange={(e) => setQuickAdjust({ ...quickAdjust, brightness: parseFloat(e.target.value) })} className="w-full accent-blue-500" />
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1.5"><span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Contrast</span><span className={`font-mono text-[11px] font-bold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{quickAdjust.contrast.toFixed(2)}x</span></div>
                                    <input type="range" min="0.2" max="2.0" step="0.05" value={quickAdjust.contrast} onChange={(e) => setQuickAdjust({ ...quickAdjust, contrast: parseFloat(e.target.value) })} className="w-full accent-blue-500" />
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1.5"><span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Saturation</span><span className={`font-mono text-[11px] font-bold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{quickAdjust.saturation.toFixed(2)}x</span></div>
                                    <input type="range" min="0.0" max="2.5" step="0.05" value={quickAdjust.saturation} onChange={(e) => setQuickAdjust({ ...quickAdjust, saturation: parseFloat(e.target.value) })} className="w-full accent-blue-500" />
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1.5"><span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Sharpen</span><span className={`font-mono text-[11px] font-bold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{quickAdjust.sharpen.toFixed(1)}x</span></div>
                                    <input type="range" min="1.0" max="3.0" step="0.1" value={quickAdjust.sharpen} onChange={(e) => setQuickAdjust({ ...quickAdjust, sharpen: parseFloat(e.target.value) })} className="w-full accent-blue-500" />
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1.5"><span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Blur</span><span className={`font-mono text-[11px] font-bold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{quickAdjust.blur}px</span></div>
                                    <input type="range" min="0" max="20" step="1" value={quickAdjust.blur} onChange={(e) => setQuickAdjust({ ...quickAdjust, blur: parseInt(e.target.value) })} className="w-full accent-blue-500" />
                                </div>
                                <button onClick={handleQuickAdjustApply} disabled={simpleLoading} className={`w-full py-2 rounded-lg border text-xs font-semibold transition mt-2 ${darkMode ? 'bg-[#161616] hover:bg-[#202020] border-[#2a2a2a] text-gray-200' : 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700'}`}>Render Adjustments</button>
                            </div>
                        </aside>
                    </div>
                )}

                {/* NODE WORKFLOW MODE */}
                {mode === 'workflow' && (
                    <div className="flex-1 flex overflow-hidden relative">
                        
                        <div className={`w-72 border-r flex flex-col z-20 flex-shrink-0 ${darkMode ? 'border-[#1f1f1f] bg-[#0e0e0e]/95 backdrop-blur' : 'border-gray-200 bg-white'}`}>
                            <div className={`flex border-b ${darkMode ? 'border-[#1f1f1f]' : 'border-gray-200'}`}>
                                {['image', 'video', 'audio', 'text'].map(tab => (
                                    <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-colors ${activeTab === tab ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-500/10' : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}>
                                        {tab === 'image' && <ImageIcon className="w-3.5 h-3.5" />}
                                        {tab === 'video' && <Video className="w-3.5 h-3.5" />}
                                        {tab === 'audio' && <Music className="w-3.5 h-3.5" />}
                                        {tab === 'text' && <Type className="w-3.5 h-3.5" />}
                                        <span>{tab}</span>
                                    </button>
                                ))}
                            </div>
                            <div className={`p-3 border-b ${darkMode ? 'border-[#1f1f1f]' : 'border-gray-200'}`}>
                                <div className="relative">
                                    <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                                    <input type="text" placeholder="Search tools..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`w-full pl-8 pr-2 py-1.5 border rounded-lg text-xs focus:outline-none focus:border-blue-500 ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900'}`} />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                {getTabsForCategory().map(section => {
                                    const sectionTools = filteredTools.filter(([_, spec]) => spec.cat === section);
                                    if (sectionTools.length === 0) return null;
                                    return (
                                        <div key={section} className="border border-transparent">
                                            <button onClick={() => toggleSection(section)} className={`w-full flex items-center justify-between px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-left rounded-lg transition ${darkMode ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:bg-gray-100'}`}>
                                                <span>{section}</span>
                                                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedSections[section] ? 'rotate-180' : ''}`} />
                                            </button>
                                            {expandedSections[section] && (
                                                <div className="mt-1 space-y-1 pl-1">
                                                    {sectionTools.map(([key, spec]) => (
                                                        <div key={key} onClick={() => handleAddNode(key)} className={`flex items-center justify-between px-3 py-1.5 rounded-lg cursor-pointer transition border group ${darkMode ? 'bg-[#141414] border-[#222222] hover:border-blue-500/60 hover:bg-[#1a1a2e]' : 'bg-white border-gray-200 hover:border-indigo-300 hover:bg-gray-50'}`}>
                                                            <span className={`text-xs font-medium truncate ${darkMode ? 'text-gray-200 group-hover:text-white' : 'text-gray-700'}`}>{spec.label}</span>
                                                            <Plus className={`w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ${darkMode ? 'text-blue-400' : 'text-indigo-600'}`} />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div ref={canvasRef} onMouseDown={handleCanvasMouseDown} onMouseMove={handleCanvasMouseMove} onMouseUp={handleCanvasMouseUp} className={`flex-1 h-full relative overflow-hidden cursor-grab active:cursor-grabbing ${darkMode ? 'bg-transparent' : 'bg-gray-100'}`} style={{ backgroundImage: darkMode ? 'none' : 'radial-gradient(rgba(0, 0, 0, 0.08) 1px, transparent 0)', backgroundSize: '24px 24px', backgroundPosition: '-12px -12px' }}>
                            
                            {/* AI WORKFLOW GENERATOR (Dashboard Aesthetic) */}
                            <div className={`absolute top-4 left-1/2 -translate-x-1/2 w-[520px] z-30 border rounded-xl p-3 shadow-2xl backdrop-blur-md ${darkMode ? 'bg-[#111116]/95 border-[#22222a]' : 'bg-white/95 border-gray-200'}`}>
                                <div className="flex flex-col space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className={`text-[10px] font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>AI Workflow Generator</span>
                                        
                                        {/* Dashboard-style Custom Model Selector */}
                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={() => setShowGenModelMenu(v => !v)}
                                                className={`flex items-center gap-1.5 transition-colors text-[11px] font-medium border rounded-lg px-2.5 py-1 ${
                                                    darkMode ? 'text-gray-300 hover:text-white bg-[#161616] border-[#2a2a2a] hover:border-[#3a3a3a]' : 'text-gray-700 hover:text-gray-900 bg-gray-50 border-gray-300 hover:border-gray-400'
                                                }`}
                                            >
                                                <span>{MODELS.find(m => m.id === selectedModel)?.label || selectedModel}</span>
                                                <ChevronDown className="w-3 h-3 text-gray-400" />
                                            </button>

                                            {showGenModelMenu && (
                                                <div className={`absolute right-0 top-full mt-1.5 border rounded-xl py-1.5 w-60 shadow-2xl z-50 ${
                                                    darkMode ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
                                                }`}>
                                                    <p className={`px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                                        Select model
                                                    </p>
                                                    {MODELS.map(m => (
                                                        <button
                                                            key={m.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedModel(m.id);
                                                                setShowGenModelMenu(false);
                                                            }}
                                                            className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 transition-colors ${
                                                                selectedModel === m.id
                                                                    ? darkMode ? 'bg-blue-500/10 text-white' : 'bg-blue-50 text-gray-900'
                                                                    : darkMode ? 'text-gray-300 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                                            }`}
                                                        >
                                                            <span className="text-xs font-medium">{m.label}</span>
                                                            <span className={`text-[10px] shrink-0 rounded-full px-2 py-0.5 ${
                                                                selectedModel === m.id
                                                                    ? 'bg-blue-500/20 text-blue-400'
                                                                    : darkMode ? 'bg-[#252525] text-gray-400' : 'bg-gray-100 text-gray-600'
                                                            }`}>
                                                                {m.tag}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <textarea rows="2" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="Describe your workflow..." className={`w-full border rounded-lg p-2 pr-10 text-xs focus:outline-none focus:border-blue-500 resize-none ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`} />
                                        <button onClick={handleGenerateWorkflow} disabled={isGenerating} className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition disabled:opacity-50" title="Generate Workflow">
                                            {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <svg className="absolute inset-0 pointer-events-none w-full h-full z-0" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0' }}>
                                {edges.map(edge => {
                                    const srcNode = nodes.find(n => n.id === edge.source); const tgtNode = nodes.find(n => n.id === edge.target);
                                    if (!srcNode || !tgtNode) return null;
                                    const x1 = srcNode.position.x + 240; const y1 = srcNode.position.y + 36;
                                    const x2 = tgtNode.position.x; const y2 = tgtNode.position.y + 36;
                                    const dx = Math.abs(x2 - x1) * 0.5;
                                    const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
                                    return (
                                        <g key={edge.id} className="pointer-events-auto" onClick={() => handleDeleteEdge(edge.id)}>
                                            <path d={d} fill="none" stroke={isRunning ? '#10b981' : '#6366f1'} strokeWidth="2.5" className={isRunning ? 'wire-active' : 'animated-wire'} style={{ strokeLinecap: 'round', cursor: 'pointer' }} />
                                        </g>
                                    );
                                })}
                            </svg>

                            <div className="absolute inset-0 pointer-events-none" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0' }}>
                                {nodes.map(node => {
                                    const spec = NODE_TYPES[node.type] || { label: node.type, color: '#6366f1' };
                                    const isSelected = selectedNodeId === node.id;
                                    const status = nodeStatuses[node.id];
                                    const paramImageId = node.data?.parameters?.image_id || node.data?.parameters?.video_id || node.data?.parameters?.audio_id;
                                    const displayAsset = paramImageId 
                                        ? (assets.find(a => a.id === paramImageId) || {
                                            id: paramImageId,
                                            url: paramImageId,
                                            thumbnail_url: paramImageId,
                                            type: /\.(mp4|webm|mov)$/i.test(paramImageId) ? 'video' : /\.(mp3|wav|ogg|aac|m4a)$/i.test(paramImageId) ? 'audio' : 'image',
                                        })
                                        : null;

                                    return (
                                        <div key={node.id} onMouseDown={(e) => handleNodeMouseDown(e, node)} className={`node-card absolute pointer-events-auto w-60 rounded-xl backdrop-blur-md border shadow-2xl transition-all ${darkMode ? 'bg-[#111116]/95' : 'bg-white/95'} ${isSelected ? 'border-blue-500 shadow-blue-500/20 ring-1 ring-blue-500/30' : darkMode ? 'border-[#22222a] hover:border-[#33333f]' : 'border-gray-200 hover:border-gray-300'}`} style={{ left: `${node.position.x}px`, top: `${node.position.y}px` }}>
                                            
                                            {spec.hasInputs !== false && (
                                                <div onClick={(e) => handleEndConnection(e, node.id)} className="node-port absolute -left-3 top-8 w-6 h-6 rounded-full bg-[#0a0a0f] border-2 border-emerald-500 hover:bg-emerald-500/40 cursor-crosshair flex items-center justify-center z-10 transition shadow-lg" title="Connect input here">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                </div>
                                            )}
                                            {spec.hasOutputs !== false && (
                                                <div onClick={(e) => handleStartConnection(e, node.id)} className="node-port absolute -right-3 top-8 w-6 h-6 rounded-full bg-[#0a0a0f] border-2 border-blue-500 hover:bg-blue-500/40 cursor-crosshair flex items-center justify-center z-10 transition shadow-lg" title="Drag connection to another node">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                </div>
                                            )}

                                            <div className={`px-3 py-2 rounded-t-xl flex items-center justify-between border-b cursor-move ${darkMode ? 'border-[#1f1f28]' : 'border-gray-200'}`} style={{ borderTop: `3px solid ${spec.color}` }}>
                                                <div className="flex items-center space-x-2"><span className={`font-semibold text-xs tracking-wide ${darkMode ? 'text-white' : 'text-gray-900'}`}>{node.data?.label || spec.label}</span></div>
                                                <div className="flex items-center space-x-1">
                                                    {status && <span className={`text-[10px] px-1 rounded ${status.status === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>{status.status === 'success' ? 'OK' : 'ERR'}</span>}
                                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteNode(node.id); }} className={`text-xs px-1 ${darkMode ? 'text-gray-400 hover:text-rose-400' : 'text-gray-400 hover:text-rose-500'}`}>×</button>
                                                </div>
                                            </div>

                                            <div className="p-3 text-xs flex flex-col space-y-2.5">
                                                {(node.type === 'image_input' || node.type === 'load_image' || node.type === 'video_image_ref') && (
                                                    <div className="flex flex-col space-y-2">
                                                        {displayAsset ? (
                                                            <div className={`h-28 rounded-lg overflow-hidden border relative group ${darkMode ? 'bg-black/40 border-white/5' : 'bg-gray-100 border-gray-200'}`}>
                                                                <img src={`${API_BASE}/api/asset/${displayAsset.thumbnail_url || displayAsset.url}`} alt="Input" className="h-full w-full object-cover" />
                                                                <button 
                                                                    type="button"
                                                                    onClick={(e) => { 
                                                                        e.stopPropagation(); 
                                                                        handleUpdateNodeParam(node.id, 'image_id', null); 
                                                                        setSelectedAsset(null);
                                                                    }} 
                                                                    className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-rose-600 text-white rounded p-1 opacity-90 hover:opacity-100 transition z-10 shadow-md cursor-pointer"
                                                                    title="Remove image"
                                                                >
                                                                    <X className="w-3.5 h-3.5"/>
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className={`h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center ${darkMode ? 'border-white/10 bg-black/20' : 'border-gray-300 bg-gray-50'}`}>
                                                                <p className={`text-[10px] mb-2 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Drop image here</p>
                                                                <div className="flex items-center space-x-2">
                                                                    <label className={`px-2 py-1 rounded cursor-pointer text-[10px] font-semibold flex items-center space-x-1 ${darkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}>
                                                                        <Upload className="w-3 h-3" /><span>Upload</span>
                                                                        <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, node.id)} className="hidden" />
                                                                    </label>
                                                                    <button onClick={openWebcam} className={`px-2 py-1 rounded text-[10px] font-semibold flex items-center space-x-1 ${darkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}>
                                                                        <Camera className="w-3 h-3" /><span>Webcam</span>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {node.type === 'multiple_image_input' && (
                                                    <div className="flex flex-col space-y-2.5">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-1">
                                                                <span className={`text-[10px] font-semibold ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>Slots:</span>
                                                                <span className="text-[11px] font-mono font-bold text-emerald-400">{node.data?.parameters?.slotCount || 2}</span>
                                                            </div>
                                                            <div className="flex items-center space-x-1.5">
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const cur = node.data?.parameters?.slotCount || 2;
                                                                        if (cur > 1) {
                                                                            handleUpdateNodeParam(node.id, 'slotCount', cur - 1);
                                                                        }
                                                                    }}
                                                                    className={`w-5 h-5 rounded flex items-center justify-center font-bold text-xs border transition ${
                                                                        darkMode ? 'bg-[#18181b] hover:bg-[#252525] text-gray-300 border-[#2a2a2a]' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
                                                                    }`}
                                                                    title="Remove slot"
                                                                >
                                                                    -
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const cur = node.data?.parameters?.slotCount || 2;
                                                                        if (cur < 12) {
                                                                            handleUpdateNodeParam(node.id, 'slotCount', cur + 1);
                                                                        }
                                                                    }}
                                                                    className={`w-5 h-5 rounded flex items-center justify-center font-bold text-xs border transition ${
                                                                        darkMode ? 'bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border-emerald-500/40' : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-emerald-300'
                                                                    }`}
                                                                    title="Add slot (+)"
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-0.5">
                                                            {Array.from({ length: node.data?.parameters?.slotCount || 2 }).map((_, idx) => {
                                                                const slotKey = `slot${idx + 1}`;
                                                                const slotImgId = node.data?.parameters?.[slotKey];
                                                                const slotAsset = slotImgId ? assets.find(a => a.id === slotImgId) : null;
                                                                return (
                                                                    <div key={slotKey} className={`relative rounded-lg border p-1.5 flex flex-col items-center justify-center min-h-[80px] ${darkMode ? 'bg-black/40 border-[#2a2a2a]' : 'bg-gray-50 border-gray-200'}`}>
                                                                        {slotImgId ? (
                                                                            <div className="relative w-full h-16 rounded overflow-hidden group">
                                                                                <img src={`${API_BASE}/api/asset/${slotAsset?.url || slotImgId}`} alt={`Slot ${idx + 1}`} className="w-full h-full object-cover" />
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleUpdateNodeParam(node.id, slotKey, null);
                                                                                    }}
                                                                                    className="absolute top-1 right-1 bg-black/80 hover:bg-rose-600 text-white rounded p-0.5 transition shadow"
                                                                                    title="Remove image"
                                                                                >
                                                                                    <X className="w-3 h-3" />
                                                                                </button>
                                                                                <span className="absolute bottom-1 left-1 bg-black/70 text-[9px] px-1 rounded text-white font-mono">#{idx + 1}</span>
                                                                            </div>
                                                                        ) : (
                                                                            <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full py-2 hover:opacity-80">
                                                                                <Upload className="w-3.5 h-3.5 text-gray-400 mb-1" />
                                                                                <span className="text-[9px] text-gray-400 font-medium">Slot #{idx + 1}</span>
                                                                                <input
                                                                                    type="file"
                                                                                    accept="image/*"
                                                                                    onChange={async (e) => {
                                                                                        const file = e.target.files?.[0];
                                                                                        if (!file) return;
                                                                                        const formData = new FormData(); formData.append('file', file);
                                                                                        try {
                                                                                            const res = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: formData });
                                                                                            const data = await res.json();
                                                                                            handleUpdateNodeParam(node.id, slotKey, data.id);
                                                                                            await fetchAssets();
                                                                                            addToast(`Uploaded to Slot #${idx + 1}`, 'success');
                                                                                        } catch (err) { addToast('Upload failed', 'error'); }
                                                                                    }}
                                                                                    className="hidden"
                                                                                />
                                                                            </label>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* VIDEO MODEL SELECTOR FOR VIDEO GENERATION / EDITING NODES */}
                                                {spec.isVideoGen && (() => {
                                                    const currentVideoModelId = node.data?.parameters?.model || 'alibaba/wan-3.0';
                                                    const currentVideoModel = VIDEO_MODELS.find(m => m.id === currentVideoModelId) || VIDEO_MODELS[0];
                                                    const caps = getVideoCaps(currentVideoModelId);
                                                    const isOpen = activeModelDropdownNodeId === node.id;
                                                    const resultUrl = aiNodeResults[node.id];
                                                    return (
                                                    <div className="flex flex-col space-y-2">
                                                        <div>
                                                            <div className="flex justify-between items-center mb-1">
                                                                <label className={`text-[10px] font-semibold ${darkMode ? 'text-pink-300' : 'text-pink-700'}`}>Video Model</label>
                                                            </div>
                                                            <div className="relative">
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setActiveModelDropdownNodeId(isOpen ? null : node.id);
                                                                    }}
                                                                    className={`w-full flex items-center justify-between gap-1.5 border rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                                                                        darkMode ? 'bg-[#161616] border-[#2a2a2a] hover:border-[#3a3a3a] text-gray-200' : 'bg-gray-50 border-gray-300 hover:border-gray-400 text-gray-800'
                                                                    }`}
                                                                >
                                                                    <span className="truncate font-medium">{currentVideoModel.label}</span>
                                                                    <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                                </button>

                                                                {isOpen && (
                                                                    <div
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className={`absolute left-0 top-full mt-1.5 border rounded-xl py-1.5 w-60 shadow-2xl z-50 ${
                                                                            darkMode ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
                                                                        }`}
                                                                    >
                                                                        <p className={`px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                                                            Select video model
                                                                        </p>
                                                                        {VIDEO_MODELS.map(m => (
                                                                            <button
                                                                                key={m.id}
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const nextCaps = getVideoCaps(m.id);
                                                                                    const updates = { model: m.id };
                                                                                    if (!nextCaps.resolutions.includes(node.data?.parameters?.resolution)) {
                                                                                        updates.resolution = nextCaps.defaultResolution;
                                                                                    }
                                                                                    if (!nextCaps.durations.includes(node.data?.parameters?.duration)) {
                                                                                        updates.duration = nextCaps.durations[Math.min(3, nextCaps.durations.length - 1)];
                                                                                    }
                                                                                    if (!nextCaps.aspectRatios.includes(node.data?.parameters?.aspect_ratio)) {
                                                                                        updates.aspect_ratio = nextCaps.aspectRatios[0];
                                                                                    }
                                                                                    handleUpdateNodeParams(node.id, updates);
                                                                                    setActiveModelDropdownNodeId(null);
                                                                                }}
                                                                                className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 transition-colors ${
                                                                                    currentVideoModelId === m.id
                                                                                        ? darkMode ? 'bg-pink-500/10 text-white' : 'bg-pink-50 text-gray-900'
                                                                                        : darkMode ? 'text-gray-300 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                                                                }`}
                                                                            >
                                                                                <div>
                                                                                    <div className="text-xs font-medium">{m.label}</div>
                                                                                    <div className="text-[10px] text-gray-500">{m.desc}</div>
                                                                                </div>
                                                                                <span className={`text-[10px] shrink-0 rounded-full px-2 py-0.5 ${
                                                                                    currentVideoModelId === m.id
                                                                                        ? 'bg-pink-500/20 text-pink-400'
                                                                                        : darkMode ? 'bg-[#252525] text-gray-400' : 'bg-gray-100 text-gray-600'
                                                                                }`}>
                                                                                    {m.tag}
                                                                                </span>
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {resultUrl && (
                                                            <div className={`rounded-lg overflow-hidden border ${darkMode ? 'border-pink-500/40 bg-black/40' : 'border-pink-300 bg-gray-50'}`}>
                                                                <video src={`${API_BASE}/api/asset/${resultUrl}`} controls className="w-full h-32 object-contain bg-black" />
                                                            </div>
                                                        )}

                                                        <div className="grid grid-cols-3 gap-1.5">
                                                            <div>
                                                                <label className={`text-[9px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Duration</label>
                                                                <select
                                                                    value={node.data?.parameters?.duration ?? 5}
                                                                    onChange={(e) => handleUpdateNodeParam(node.id, 'duration', parseInt(e.target.value))}
                                                                    className={`w-full border rounded px-1 py-1 text-[11px] outline-none ${darkMode ? 'bg-[#18181b] border-[#2a2a2a] text-slate-200' : 'bg-white border-gray-200 text-gray-700'}`}
                                                                >
                                                                    {caps.durations.map(d => <option key={d} value={d}>{d}s</option>)}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className={`text-[9px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Resolution</label>
                                                                <select
                                                                    value={node.data?.parameters?.resolution || caps.defaultResolution}
                                                                    onChange={(e) => handleUpdateNodeParam(node.id, 'resolution', e.target.value)}
                                                                    className={`w-full border rounded px-1 py-1 text-[11px] outline-none ${darkMode ? 'bg-[#18181b] border-[#2a2a2a] text-slate-200' : 'bg-white border-gray-200 text-gray-700'}`}
                                                                >
                                                                    {caps.resolutions.map(r => <option key={r} value={r}>{r}</option>)}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className={`text-[9px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Aspect</label>
                                                                <select
                                                                    value={node.data?.parameters?.aspect_ratio || '16:9'}
                                                                    onChange={(e) => handleUpdateNodeParam(node.id, 'aspect_ratio', e.target.value)}
                                                                    className={`w-full border rounded px-1 py-1 text-[11px] outline-none ${darkMode ? 'bg-[#18181b] border-[#2a2a2a] text-slate-200' : 'bg-white border-gray-200 text-gray-700'}`}
                                                                >
                                                                    {caps.aspectRatios.map(r => <option key={r} value={r}>{r}</option>)}
                                                                </select>
                                                            </div>
                                                        </div>

                                                        {node.data?.parameters?.prompt !== undefined && (
                                                            <div>
                                                                <label className={`text-[10px] font-semibold block mb-1 ${darkMode ? 'text-pink-300' : 'text-pink-700'}`}>
                                                                    Video Prompt
                                                                </label>
                                                                <textarea
                                                                    rows="2"
                                                                    value={node.data?.parameters?.prompt || ''}
                                                                    onChange={(e) => handleUpdateNodeParam(node.id, 'prompt', e.target.value)}
                                                                    placeholder="Describe the motion, camera angle, and scene dynamics..."
                                                                    className={`w-full border rounded-lg p-1.5 text-xs focus:outline-none focus:border-pink-500 resize-none ${darkMode ? 'bg-black/40 border-white/10 text-white placeholder-slate-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`}
                                                                />
                                                            </div>
                                                        )}

                                                    </div>
                                                    );
                                                })()}

                                                {node.type.startsWith('ai_') && !spec.isVideoGen && (
                                                    <div className="flex flex-col space-y-2">
                                                        {aiNodeResults[node.id] && (
                                                            <div className={`h-24 rounded-lg overflow-hidden border relative group ${darkMode ? 'border-purple-500/40 bg-black/40' : 'border-purple-300 bg-gray-50'}`}>
                                                                <img src={`${API_BASE}/api/asset/${aiNodeResults[node.id]}`} alt="Node Result" className="h-full w-full object-cover" />
                                                                <button onClick={(e) => { e.stopPropagation(); handleDownloadImage(aiNodeResults[node.id], 'ai_node_output.png'); }} className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[10px] bg-purple-600 hover:bg-purple-500 text-white font-medium">Save</button>
                                                            </div>
                                                        )}

                                                        <div>
                                                            <div className="flex justify-between items-center mb-1">
                                                                <label className={`text-[10px] font-semibold ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>AI Model</label>
                                                            </div>
                                                            <div className="relative">
                                                                {(() => {
                                                                    const currentModelId = node.data?.parameters?.model || (node.type === 'ai_multi_image_edit' ? 'bytedance-seed/seedream-5.5' : 'black-forest-labs/flux-3-image-klein');
                                                                    const currentModel = OPENROUTER_MODELS.find(m => m.id === currentModelId) || OPENROUTER_MODELS[0];
                                                                    const isOpen = activeModelDropdownNodeId === node.id;
                                                                    return (
                                                                        <>
                                                                            <button
                                                                                type="button"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setActiveModelDropdownNodeId(isOpen ? null : node.id);
                                                                                }}
                                                                                className={`w-full flex items-center justify-between gap-1.5 border rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                                                                                    darkMode ? 'bg-[#161616] border-[#2a2a2a] hover:border-[#3a3a3a] text-gray-200' : 'bg-gray-50 border-gray-300 hover:border-gray-400 text-gray-800'
                                                                                }`}
                                                                            >
                                                                                <span className="truncate font-medium">{currentModel.label}</span>
                                                                                <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                                            </button>

                                                                            {isOpen && (
                                                                                <div 
                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                    className={`absolute left-0 top-full mt-1.5 border rounded-xl py-1.5 w-60 shadow-2xl z-50 ${
                                                                                        darkMode ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
                                                                                    }`}
                                                                                >
                                                                                    <p className={`px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                                                                        Select model
                                                                                    </p>
                                                                                    {OPENROUTER_MODELS.map(m => (
                                                                                        <button
                                                                                            key={m.id}
                                                                                            type="button"
                                                                                            onClick={() => {
                                                                                                handleUpdateNodeParam(node.id, 'model', m.id);
                                                                                                setActiveModelDropdownNodeId(null);
                                                                                            }}
                                                                                            className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 transition-colors ${
                                                                                                currentModelId === m.id
                                                                                                    ? darkMode ? 'bg-blue-500/10 text-white' : 'bg-blue-50 text-gray-900'
                                                                                                    : darkMode ? 'text-gray-300 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                                                                            }`}
                                                                                        >
                                                                                            <div>
                                                                                                <div className="text-xs font-medium">{m.label}</div>
                                                                                                <div className="text-[10px] text-gray-500">{m.desc}</div>
                                                                                            </div>
                                                                                            <span className={`text-[10px] shrink-0 rounded-full px-2 py-0.5 ${
                                                                                                currentModelId === m.id
                                                                                                    ? 'bg-blue-500/20 text-blue-400'
                                                                                                    : darkMode ? 'bg-[#252525] text-gray-400' : 'bg-gray-100 text-gray-600'
                                                                                            }`}>
                                                                                                {m.tag}
                                                                                            </span>
                                                                                        </button>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </>
                                                                    );
                                                                })()}
                                                            </div>
                                                        </div>

                                                        {node.type === 'ai_text_to_image' && (
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div>
                                                                    <label className={`text-[9px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Aspect Ratio</label>
                                                                    <select
                                                                        value={node.data?.parameters?.aspect_ratio || '1:1'}
                                                                        onChange={(e) => handleUpdateNodeParam(node.id, 'aspect_ratio', e.target.value)}
                                                                        className={`w-full border rounded px-1.5 py-1 text-xs outline-none ${darkMode ? 'bg-[#18181b] border-[#2a2a2a] text-slate-200' : 'bg-white border-gray-200 text-gray-700'}`}
                                                                    >
                                                                        <option value="1:1" className="bg-[#18181b] text-white">1:1 Square</option>
                                                                        <option value="16:9" className="bg-[#18181b] text-white">16:9 Landscape</option>
                                                                        <option value="9:16" className="bg-[#18181b] text-white">9:16 Portrait</option>
                                                                        <option value="4:3" className="bg-[#18181b] text-white">4:3 Standard</option>
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className={`text-[9px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Quality</label>
                                                                    <select
                                                                        value={node.data?.parameters?.quality || 'standard'}
                                                                        onChange={(e) => handleUpdateNodeParam(node.id, 'quality', e.target.value)}
                                                                        className={`w-full border rounded px-1.5 py-1 text-xs outline-none ${darkMode ? 'bg-[#18181b] border-[#2a2a2a] text-slate-200' : 'bg-white border-gray-200 text-gray-700'}`}
                                                                    >
                                                                        <option value="standard" className="bg-[#18181b] text-white">Standard</option>
                                                                        <option value="hd" className="bg-[#18181b] text-white">Ultra HD</option>
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {node.type === 'ai_object_replacement' && (
                                                            <div className="grid grid-cols-2 gap-1.5">
                                                                <div>
                                                                    <label className={`text-[9px] font-medium block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Replace Target</label>
                                                                    <input
                                                                        type="text"
                                                                        value={node.data?.parameters?.target_object || ''}
                                                                        onChange={(e) => handleUpdateNodeParam(node.id, 'target_object', e.target.value)}
                                                                        placeholder="e.g. car"
                                                                        className={`w-full border rounded p-1 text-xs ${darkMode ? 'bg-black/40 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className={`text-[9px] font-medium block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>With</label>
                                                                    <input
                                                                        type="text"
                                                                        value={node.data?.parameters?.replacement_object || ''}
                                                                        onChange={(e) => handleUpdateNodeParam(node.id, 'replacement_object', e.target.value)}
                                                                        placeholder="e.g. sports bike"
                                                                        className={`w-full border rounded p-1 text-xs ${darkMode ? 'bg-black/40 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div>
                                                            <label className={`text-[10px] font-semibold block mb-1 ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                                                                {node.type === 'ai_text_to_image' ? 'Image Prompt' :
                                                                 node.type === 'ai_background_edit' ? 'Background Instruction' :
                                                                 node.type === 'ai_multi_image_edit' ? 'Blending Instruction' :
                                                                 node.type === 'ai_object_replacement' ? 'Additional Details' : 'AI Edit Instruction'}
                                                            </label>
                                                            <textarea
                                                                rows="2"
                                                                value={node.data?.parameters?.prompt || ''}
                                                                onChange={(e) => handleUpdateNodeParam(node.id, 'prompt', e.target.value)}
                                                                placeholder={
                                                                    node.type === 'ai_text_to_image' ? "Describe the image you want to generate in detail..." :
                                                                    node.type === 'ai_background_edit' ? "e.g. Sunny modern penthouse terrace with city skyline..." :
                                                                    node.type === 'ai_multi_image_edit' ? "e.g. Place person from image 1 naturally into image 2 background..." :
                                                                    "Describe the desired AI edit..."
                                                                }
                                                                className={`w-full border rounded-lg p-1.5 text-xs focus:outline-none focus:border-purple-500 resize-none ${darkMode ? 'bg-black/40 border-white/10 text-white placeholder-slate-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`}
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* VIDEO NODES */}
                                                {node.type === 'video_input' && (
                                                    <div className="flex flex-col space-y-2">
                                                        {displayAsset && (displayAsset.type === 'video' || displayAsset.url?.match(/\.(mp4|webm|mov)$/i)) ? (
                                                            <div className={`rounded-lg overflow-hidden border relative group p-2 ${darkMode ? 'bg-black/40 border-white/5' : 'bg-gray-100 border-gray-200'}`}>
                                                                <video src={`${API_BASE}/api/asset/${displayAsset.url}`} controls className="w-full h-28 object-contain rounded bg-black" />
                                                                <button 
                                                                    type="button"
                                                                    onClick={(e) => { 
                                                                        e.stopPropagation(); 
                                                                        handleUpdateNodeParam(node.id, 'video_id', null); 
                                                                        setSelectedAsset(null);
                                                                    }} 
                                                                    className="absolute top-2 right-2 bg-black/70 hover:bg-rose-600 text-white rounded p-1 opacity-90 transition shadow-md"
                                                                    title="Remove video"
                                                                >
                                                                    <X className="w-3.5 h-3.5"/>
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className={`h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center ${darkMode ? 'border-white/10 bg-black/20' : 'border-gray-300 bg-gray-50'}`}>
                                                                <p className={`text-[10px] mb-2 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Drop video here (MP4, WEBM)</p>
                                                                <label className={`px-2 py-1 rounded cursor-pointer text-[10px] font-semibold flex items-center space-x-1 ${darkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}>
                                                                    <Upload className="w-3 h-3" /><span>Upload Video</span>
                                                                    <input type="file" accept="video/*" onChange={(e) => handleFileUpload(e, node.id)} className="hidden" />
                                                                </label>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {node.type === 'video_trim' && (
                                                    <div className="space-y-2">
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <span className={`text-[10px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Start (sec)</span>
                                                                <input type="number" step="0.5" min="0" value={node.data.parameters?.start ?? 0} onChange={(e) => handleUpdateNodeParam(node.id, 'start', parseFloat(e.target.value) || 0)} className={`w-full border rounded px-2 py-1 text-xs ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'}`} />
                                                            </div>
                                                            <div>
                                                                <span className={`text-[10px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>End (sec)</span>
                                                                <input type="number" step="0.5" min="1" value={node.data.parameters?.end ?? 15} onChange={(e) => handleUpdateNodeParam(node.id, 'end', parseFloat(e.target.value) || 15)} className={`w-full border rounded px-2 py-1 text-xs ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'}`} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {node.type === 'video_url' && (
                                                    <div className="space-y-1.5">
                                                        <span className={`text-[10px] block ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Video URL</span>
                                                        <input type="text" value={node.data.parameters?.url || ''} onChange={(e) => handleUpdateNodeParam(node.id, 'url', e.target.value)} placeholder="https://..." className={`w-full border rounded px-2 py-1 text-xs ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'}`} />
                                                    </div>
                                                )}

                                                {node.type === 'video_from_script' && (
                                                    <div className="space-y-1.5">
                                                        <span className={`text-[10px] block ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Script / Scenes</span>
                                                        <textarea rows="3" value={node.data.parameters?.script || ''} onChange={(e) => handleUpdateNodeParam(node.id, 'script', e.target.value)} placeholder="Scene breakdown..." className={`w-full border rounded p-1.5 text-xs resize-none ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'}`} />
                                                    </div>
                                                )}

                                                {node.type === 'replace_scene' && (
                                                    <div className="space-y-1.5">
                                                        <span className={`text-[10px] block ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Scene Replacement Description</span>
                                                        <input type="text" value={node.data.parameters?.scene_description || ''} onChange={(e) => handleUpdateNodeParam(node.id, 'scene_description', e.target.value)} placeholder="e.g. Modern neon interior" className={`w-full border rounded px-2 py-1 text-xs ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'}`} />
                                                    </div>
                                                )}

                                                {node.type === 'remove_object_video' && (
                                                    <div className="space-y-1.5">
                                                        <span className={`text-[10px] block ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Object to Remove</span>
                                                        <input type="text" value={node.data.parameters?.target_object || ''} onChange={(e) => handleUpdateNodeParam(node.id, 'target_object', e.target.value)} placeholder="e.g. microphone wire" className={`w-full border rounded px-2 py-1 text-xs ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'}`} />
                                                    </div>
                                                )}

                                                {node.type === 'video_reframe' && (
                                                    <div className="space-y-1.5">
                                                        <span className={`text-[10px] block ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Aspect Ratio</span>
                                                        <select value={node.data.parameters?.aspect_ratio || '9:16'} onChange={(e) => handleUpdateNodeParam(node.id, 'aspect_ratio', e.target.value)} className={`w-full border rounded px-1.5 py-1 text-xs outline-none ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-gray-200' : 'bg-white border-gray-200 text-gray-700'}`}>
                                                            <option value="9:16" className="bg-[#1a1a1a] text-white">9:16 Vertical (Reels / TikTok)</option>
                                                            <option value="16:9" className="bg-[#1a1a1a] text-white">16:9 Landscape (YouTube)</option>
                                                            <option value="1:1" className="bg-[#1a1a1a] text-white">1:1 Square (Instagram)</option>
                                                        </select>
                                                    </div>
                                                )}

                                                {node.type === 'text_to_speech' && (
                                                    <div className="space-y-2">
                                                        <div>
                                                            <span className={`text-[10px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Text to Speak</span>
                                                            <textarea rows="2" value={node.data.parameters?.text || ''} onChange={(e) => handleUpdateNodeParam(node.id, 'text', e.target.value)} placeholder="Text script..." className={`w-full border rounded p-1.5 text-xs resize-none ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'}`} />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <span className={`text-[10px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Voice</span>
                                                                <select value={node.data.parameters?.voice || 'Natural English Male'} onChange={(e) => handleUpdateNodeParam(node.id, 'voice', e.target.value)} className={`w-full border rounded px-1.5 py-1 text-xs outline-none ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-gray-200' : 'bg-white border-gray-200 text-gray-700'}`}>
                                                                    <option value="Natural English Male" className="bg-[#1a1a1a] text-white">Natural Male</option>
                                                                    <option value="Natural English Female" className="bg-[#1a1a1a] text-white">Natural Female</option>
                                                                    <option value="Cinematic Narrator" className="bg-[#1a1a1a] text-white">Cinematic Narrator</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <span className={`text-[10px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Speed</span>
                                                                <input type="number" step="0.1" min="0.5" max="2.0" value={node.data.parameters?.speed ?? 1.0} onChange={(e) => handleUpdateNodeParam(node.id, 'speed', parseFloat(e.target.value) || 1.0)} className={`w-full border rounded px-2 py-1 text-xs ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'}`} />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <span className={`text-[10px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Audio Model</span>
                                                            <select value={AUDIO_MODEL_OPTIONS.some(m => m.id === node.data.parameters?.voice_model) ? node.data.parameters.voice_model : DEFAULT_AUDIO_MODEL} onChange={(e) => handleUpdateNodeParam(node.id, 'voice_model', e.target.value)} className={`w-full border rounded px-1.5 py-1 text-xs outline-none ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-gray-200' : 'bg-white border-gray-200 text-gray-700'}`}>
                                                                {AUDIO_MODEL_OPTIONS.map(m => <option key={m.id} value={m.id} className="bg-[#1a1a1a] text-white">{m.label}</option>)}
                                                            </select>
                                                        </div>
                                                    </div>
                                                )}

                                                {node.type === 'voiceover' && (
                                                    <div className="space-y-2">
                                                        <span className={`text-[10px] block ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Narration Script</span>
                                                        <textarea rows="2" value={node.data.parameters?.text || ''} onChange={(e) => handleUpdateNodeParam(node.id, 'text', e.target.value)} placeholder="Narrate over video timeline..." className={`w-full border rounded p-1.5 text-xs resize-none ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'}`} />
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <span className={`text-[10px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Voice</span>
                                                                <select value={node.data.parameters?.voice || 'Natural English Female'} onChange={(e) => handleUpdateNodeParam(node.id, 'voice', e.target.value)} className={`w-full border rounded px-1.5 py-1 text-xs outline-none ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-gray-200' : 'bg-white border-gray-200 text-gray-700'}`}>
                                                                    <option value="Natural English Male" className="bg-[#1a1a1a] text-white">Natural Male</option>
                                                                    <option value="Natural English Female" className="bg-[#1a1a1a] text-white">Natural Female</option>
                                                                    <option value="Cinematic Narrator" className="bg-[#1a1a1a] text-white">Cinematic Narrator</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <span className={`text-[10px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Speed</span>
                                                                <input type="number" step="0.1" min="0.5" max="2.0" value={node.data.parameters?.speed ?? 1.0} onChange={(e) => handleUpdateNodeParam(node.id, 'speed', parseFloat(e.target.value) || 1.0)} className={`w-full border rounded px-2 py-1 text-xs ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'}`} />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <span className={`text-[10px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Audio Model</span>
                                                            <select value={AUDIO_MODEL_OPTIONS.some(m => m.id === node.data.parameters?.voice_model) ? node.data.parameters.voice_model : DEFAULT_AUDIO_MODEL} onChange={(e) => handleUpdateNodeParam(node.id, 'voice_model', e.target.value)} className={`w-full border rounded px-1.5 py-1 text-xs outline-none ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-gray-200' : 'bg-white border-gray-200 text-gray-700'}`}>
                                                                {AUDIO_MODEL_OPTIONS.map(m => <option key={m.id} value={m.id} className="bg-[#1a1a1a] text-white">{m.label}</option>)}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <div className="flex justify-between text-[11px] mb-1"><span>Volume</span><span className="font-mono">{Math.round((node.data.parameters?.volume ?? 1.0) * 100)}%</span></div>
                                                            <input type="range" min="0" max="1" step="0.05" value={node.data.parameters?.volume ?? 1.0} onChange={(e) => handleUpdateNodeParam(node.id, 'volume', parseFloat(e.target.value))} className="w-full accent-teal-500" />
                                                        </div>
                                                    </div>
                                                )}

                                                {node.type === 'sound_effects' && (
                                                    <div className="space-y-2">
                                                        <div>
                                                            <span className={`text-[10px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Effect</span>
                                                            <select value={node.data.parameters?.effect_type || 'Cinematic Whoosh'} onChange={(e) => handleUpdateNodeParam(node.id, 'effect_type', e.target.value)} className={`w-full border rounded px-1.5 py-1 text-xs outline-none ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-gray-200' : 'bg-white border-gray-200 text-gray-700'}`}>
                                                                {['Cinematic Whoosh', 'Deep Impact Boom', 'Sci-Fi Interface', 'Rain & Thunder', 'Footsteps', 'Crowd Applause'].map(v => <option key={v} value={v} className="bg-[#1a1a1a] text-white">{v}</option>)}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <span className={`text-[10px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Custom Description</span>
                                                            <textarea rows="2" value={node.data.parameters?.prompt || ''} onChange={(e) => handleUpdateNodeParam(node.id, 'prompt', e.target.value)} placeholder="Describe the sound..." className={`w-full border rounded p-1.5 text-xs resize-none ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'}`} />
                                                        </div>
                                                        <div>
                                                            <span className={`text-[10px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Audio Model</span>
                                                            <select value={AUDIO_MODEL_OPTIONS.some(m => m.id === node.data.parameters?.voice_model) ? node.data.parameters.voice_model : DEFAULT_AUDIO_MODEL} onChange={(e) => handleUpdateNodeParam(node.id, 'voice_model', e.target.value)} className={`w-full border rounded px-1.5 py-1 text-xs outline-none ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-gray-200' : 'bg-white border-gray-200 text-gray-700'}`}>
                                                                {AUDIO_MODEL_OPTIONS.map(m => <option key={m.id} value={m.id} className="bg-[#1a1a1a] text-white">{m.label}</option>)}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <div className="flex justify-between text-[11px] mb-1"><span>Volume</span><span className="font-mono">{Math.round((node.data.parameters?.volume ?? 0.8) * 100)}%</span></div>
                                                            <input type="range" min="0" max="1" step="0.05" value={node.data.parameters?.volume ?? 0.8} onChange={(e) => handleUpdateNodeParam(node.id, 'volume', parseFloat(e.target.value))} className="w-full accent-teal-500" />
                                                        </div>
                                                    </div>
                                                )}

                                                {node.type === 'bg_music' && (
                                                    <div className="space-y-2">
                                                        <div>
                                                            <span className={`text-[10px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Genre</span>
                                                            <select value={node.data.parameters?.genre || 'Ambient Synthwave'} onChange={(e) => handleUpdateNodeParam(node.id, 'genre', e.target.value)} className={`w-full border rounded px-1.5 py-1 text-xs outline-none ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-gray-200' : 'bg-white border-gray-200 text-gray-700'}`}>
                                                                {['Ambient Synthwave', 'Epic Orchestral', 'Lo-Fi Chill', 'Corporate Uplifting', 'Cinematic Trailer', 'Jazz Lounge'].map(v => <option key={v} value={v} className="bg-[#1a1a1a] text-white">{v}</option>)}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <span className={`text-[10px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Custom Description</span>
                                                            <textarea rows="2" value={node.data.parameters?.prompt || ''} onChange={(e) => handleUpdateNodeParam(node.id, 'prompt', e.target.value)} placeholder="Describe the music mood..." className={`w-full border rounded p-1.5 text-xs resize-none ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'}`} />
                                                        </div>
                                                        <div>
                                                            <span className={`text-[10px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Audio Model</span>
                                                            <select value={AUDIO_MODEL_OPTIONS.some(m => m.id === node.data.parameters?.voice_model) ? node.data.parameters.voice_model : DEFAULT_AUDIO_MODEL} onChange={(e) => handleUpdateNodeParam(node.id, 'voice_model', e.target.value)} className={`w-full border rounded px-1.5 py-1 text-xs outline-none ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-gray-200' : 'bg-white border-gray-200 text-gray-700'}`}>
                                                                {AUDIO_MODEL_OPTIONS.map(m => <option key={m.id} value={m.id} className="bg-[#1a1a1a] text-white">{m.label}</option>)}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <div className="flex justify-between text-[11px] mb-1"><span>Volume</span><span className="font-mono">{Math.round((node.data.parameters?.volume ?? 0.4) * 100)}%</span></div>
                                                            <input type="range" min="0" max="1" step="0.05" value={node.data.parameters?.volume ?? 0.4} onChange={(e) => handleUpdateNodeParam(node.id, 'volume', parseFloat(e.target.value))} className="w-full accent-teal-500" />
                                                        </div>
                                                    </div>
                                                )}

                                                {AUDIO_GEN_NODE_TYPES.has(node.type) && (() => {
                                                    const previewAudio = nodeAssetUrl(node.id);
                                                    return (
                                                    <div className="flex flex-col space-y-2">
                                                        {previewAudio && (
                                                            <div className={`rounded-lg border p-2 ${darkMode ? 'border-teal-500/40 bg-black/40' : 'border-teal-300 bg-gray-50'}`}>
                                                                <audio src={`${API_BASE}/api/asset/${previewAudio}`} controls className="w-full h-9" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    );
                                                })()}

                                                {node.type === 'audio_output' && (() => {
                                                    const globalAudio = workflowResultType === 'audio' ? workflowResultUrl : null;
                                                    const audioUrl = nodeAssetUrl(node.id) || globalAudio || null;
                                                    return (
                                                    <div className="flex flex-col space-y-1.5">
                                                        {audioUrl ? (
                                                            <>
                                                                <audio src={`${API_BASE}/api/asset/${audioUrl}`} controls className="w-full h-9" />
                                                                <button onClick={(e) => { e.stopPropagation(); handleSaveToLibrary(audioUrl); }} className={`w-full py-1.5 border rounded-lg text-[10px] font-medium transition flex items-center justify-center space-x-1 ${darkMode ? 'border-cyan-500/30 text-cyan-400 bg-cyan-950/20 hover:bg-cyan-900/30' : 'border-cyan-300 text-cyan-700 bg-cyan-50 hover:bg-cyan-100'}`}>
                                                                    <Save className="w-3 h-3" /><span>Save to Library</span>
                                                                </button>
                                                                <button onClick={(e) => { e.stopPropagation(); handleDownloadImage(audioUrl, 'netrootai_audio.mp3'); }} className="w-full py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg text-[10px] transition flex items-center justify-center space-x-1">
                                                                    <Download className="w-3 h-3" /><span>Download Audio</span>
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <div className={`h-16 rounded-lg border border-dashed flex items-center justify-center text-[10px] ${darkMode ? 'border-white/10 text-slate-500' : 'border-gray-300 text-gray-400'}`}>
                                                                Connect a voice or audio node, then Run Workflow
                                                            </div>
                                                        )}
                                                    </div>
                                                    );
                                                })()}

                                                {node.type === 'video_color_correction' && (
                                                    <div className="space-y-1.5">
                                                        <div className="flex justify-between text-[10px]"><span>Brightness</span><span className="font-mono">{node.data.parameters?.brightness || 1.1}x</span></div>
                                                        <input type="range" min="0.5" max="1.8" step="0.05" value={node.data.parameters?.brightness ?? 1.1} onChange={(e) => handleUpdateNodeParam(node.id, 'brightness', parseFloat(e.target.value))} className="w-full accent-purple-500" />
                                                        <div className="flex justify-between text-[10px]"><span>Contrast</span><span className="font-mono">{node.data.parameters?.contrast || 1.15}x</span></div>
                                                        <input type="range" min="0.5" max="1.8" step="0.05" value={node.data.parameters?.contrast ?? 1.15} onChange={(e) => handleUpdateNodeParam(node.id, 'contrast', parseFloat(e.target.value))} className="w-full accent-purple-500" />
                                                        <div className="flex justify-between text-[10px]"><span>Saturation</span><span className="font-mono">{node.data.parameters?.saturation || 1.2}x</span></div>
                                                        <input type="range" min="0.5" max="2.0" step="0.05" value={node.data.parameters?.saturation ?? 1.2} onChange={(e) => handleUpdateNodeParam(node.id, 'saturation', parseFloat(e.target.value))} className="w-full accent-purple-500" />
                                                    </div>
                                                )}

                                                {node.type === 'video_color_grading' && (
                                                    <div className="space-y-1.5">
                                                        <span className={`text-[10px] block ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Cinematic Grade</span>
                                                        <select value={node.data.parameters?.preset || 'Cinematic Teal & Orange'} onChange={(e) => handleUpdateNodeParam(node.id, 'preset', e.target.value)} className={`w-full border rounded px-1.5 py-1 text-xs outline-none ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-gray-200' : 'bg-white border-gray-200 text-gray-700'}`}>
                                                            <option value="Cinematic Teal & Orange" className="bg-[#1a1a1a] text-white">Teal & Orange</option>
                                                            <option value="Vintage Film 70s" className="bg-[#1a1a1a] text-white">Vintage Film 70s</option>
                                                            <option value="Moody Noir" className="bg-[#1a1a1a] text-white">Moody Noir</option>
                                                            <option value="Cyberpunk Neon" className="bg-[#1a1a1a] text-white">Cyberpunk Neon</option>
                                                        </select>
                                                    </div>
                                                )}

                                                {node.type === 'video_slow_motion' && (
                                                    <div>
                                                        <div className="flex justify-between text-[11px] mb-1"><span>Slow Motion Factor</span><span className="font-mono">{node.data.parameters?.factor || 0.5}x</span></div>
                                                        <input type="range" min="0.1" max="1.0" step="0.05" value={node.data.parameters?.factor ?? 0.5} onChange={(e) => handleUpdateNodeParam(node.id, 'factor', parseFloat(e.target.value))} className="w-full accent-purple-500" />
                                                    </div>
                                                )}

                                                {node.type === 'video_transitions' && (
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <span className={`text-[10px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Transition</span>
                                                            <select value={node.data.parameters?.transition || 'Cross Dissolve'} onChange={(e) => handleUpdateNodeParam(node.id, 'transition', e.target.value)} className={`w-full border rounded px-1.5 py-1 text-xs outline-none ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-gray-200' : 'bg-white border-gray-200 text-gray-700'}`}>
                                                                {['Cross Dissolve', 'Fade to Black', 'Slide Left', 'Zoom In', 'Wipe'].map(v => <option key={v} value={v} className="bg-[#1a1a1a] text-white">{v}</option>)}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <span className={`text-[10px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Duration (sec)</span>
                                                            <input type="number" step="0.1" min="0.1" value={node.data.parameters?.duration ?? 1.0} onChange={(e) => handleUpdateNodeParam(node.id, 'duration', parseFloat(e.target.value) || 1.0)} className={`w-full border rounded px-2 py-1 text-xs ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'}`} />
                                                        </div>
                                                    </div>
                                                )}

                                                {node.type === 'video_overlay' && (
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between text-[11px]"><span>Opacity</span><span className="font-mono">{Math.round((node.data.parameters?.opacity ?? 0.8) * 100)}%</span></div>
                                                        <input type="range" min="0" max="1" step="0.05" value={node.data.parameters?.opacity ?? 0.8} onChange={(e) => handleUpdateNodeParam(node.id, 'opacity', parseFloat(e.target.value))} className="w-full accent-purple-500" />
                                                        <div>
                                                            <span className={`text-[10px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Blend Mode</span>
                                                            <select value={node.data.parameters?.blend_mode || 'Overlay'} onChange={(e) => handleUpdateNodeParam(node.id, 'blend_mode', e.target.value)} className={`w-full border rounded px-1.5 py-1 text-xs outline-none ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-gray-200' : 'bg-white border-gray-200 text-gray-700'}`}>
                                                                {['Overlay', 'Normal', 'Screen', 'Multiply', 'Add'].map(v => <option key={v} value={v} className="bg-[#1a1a1a] text-white">{v}</option>)}
                                                            </select>
                                                        </div>
                                                    </div>
                                                )}

                                                {node.type === 'video_loop' && (
                                                    <div>
                                                        <div className="flex justify-between text-[11px] mb-1"><span>Loops</span><span className="font-mono">{node.data.parameters?.loops ?? 3}</span></div>
                                                        <input type="range" min="1" max="10" step="1" value={node.data.parameters?.loops ?? 3} onChange={(e) => handleUpdateNodeParam(node.id, 'loops', parseInt(e.target.value))} className="w-full accent-purple-500" />
                                                    </div>
                                                )}

                                                {node.type === 'video_bg_removal' && (
                                                    <div>
                                                        <span className={`text-[10px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Replace Background With</span>
                                                        <select value={node.data.parameters?.replace_with || 'Transparent'} onChange={(e) => handleUpdateNodeParam(node.id, 'replace_with', e.target.value)} className={`w-full border rounded px-1.5 py-1 text-xs outline-none ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-gray-200' : 'bg-white border-gray-200 text-gray-700'}`}>
                                                            {['Transparent', 'Green Screen', 'Blur', 'Black', 'White', 'Custom Color'].map(v => <option key={v} value={v} className="bg-[#1a1a1a] text-white">{v}</option>)}
                                                        </select>
                                                    </div>
                                                )}

                                                {node.type === 'video_ai_effects' && (
                                                    <div>
                                                        <span className={`text-[10px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>AI Effect</span>
                                                        <select value={node.data.parameters?.effect || 'Cyberpunk Glow'} onChange={(e) => handleUpdateNodeParam(node.id, 'effect', e.target.value)} className={`w-full border rounded px-1.5 py-1 text-xs outline-none ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-gray-200' : 'bg-white border-gray-200 text-gray-700'}`}>
                                                            {['Cyberpunk Glow', 'Dreamy Bloom', 'VHS Retro', 'Anime Style', 'Film Grain', 'Neon Trails'].map(v => <option key={v} value={v} className="bg-[#1a1a1a] text-white">{v}</option>)}
                                                        </select>
                                                    </div>
                                                )}

                                                {node.type === 'video_upscale' && (
                                                    <div>
                                                        <span className={`text-[10px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Target Resolution</span>
                                                        <select value={node.data.parameters?.target_resolution || '4K'} onChange={(e) => handleUpdateNodeParam(node.id, 'target_resolution', e.target.value)} className={`w-full border rounded px-1.5 py-1 text-xs outline-none ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-gray-200' : 'bg-white border-gray-200 text-gray-700'}`}>
                                                            {['1080p', '1440p', '2K', '4K'].map(v => <option key={v} value={v} className="bg-[#1a1a1a] text-white">{v}</option>)}
                                                        </select>
                                                    </div>
                                                )}

                                                {node.type === 'auto_subtitles' && (
                                                    <div className="space-y-2">
                                                        <div>
                                                            <span className={`text-[10px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Language</span>
                                                            <select value={node.data.parameters?.language || 'en'} onChange={(e) => handleUpdateNodeParam(node.id, 'language', e.target.value)} className={`w-full border rounded px-1.5 py-1 text-xs outline-none ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-gray-200' : 'bg-white border-gray-200 text-gray-700'}`}>
                                                                <option value="en" className="bg-[#1a1a1a] text-white">English (Auto Detect)</option>
                                                                <option value="es" className="bg-[#1a1a1a] text-white">Spanish</option>
                                                                <option value="fr" className="bg-[#1a1a1a] text-white">French</option>
                                                                <option value="de" className="bg-[#1a1a1a] text-white">German</option>
                                                                <option value="hi" className="bg-[#1a1a1a] text-white">Hindi</option>
                                                            </select>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <span className={`text-[10px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Font Size</span>
                                                                <input type="number" min="10" max="72" value={node.data.parameters?.font_size ?? 24} onChange={(e) => handleUpdateNodeParam(node.id, 'font_size', parseInt(e.target.value) || 24)} className={`w-full border rounded px-2 py-1 text-xs ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'}`} />
                                                            </div>
                                                            <div>
                                                                <span className={`text-[10px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Color</span>
                                                                <input type="color" value={node.data.parameters?.font_color || '#ffffff'} onChange={(e) => handleUpdateNodeParam(node.id, 'font_color', e.target.value)} className="w-full h-7 border rounded bg-transparent" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {node.type === 'video_text' && (
                                                    <div className="space-y-2">
                                                        <div>
                                                            <span className={`text-[10px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Overlay Text</span>
                                                            <input type="text" value={node.data.parameters?.text || ''} onChange={(e) => handleUpdateNodeParam(node.id, 'text', e.target.value)} placeholder="Text on video..." className={`w-full border rounded px-2 py-1 text-xs ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'}`} />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <span className={`text-[10px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Position</span>
                                                                <select value={node.data.parameters?.position || 'bottom'} onChange={(e) => handleUpdateNodeParam(node.id, 'position', e.target.value)} className={`w-full border rounded px-1.5 py-1 text-xs outline-none ${darkMode ? 'bg-[#18181b] border-[#2a2a2a] text-slate-200' : 'bg-white border-gray-200 text-gray-700'}`}>
                                                                    <option value="top">Top</option>
                                                                    <option value="center">Center</option>
                                                                    <option value="bottom">Bottom</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <span className={`text-[10px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Size (px)</span>
                                                                <input type="number" value={node.data.parameters?.size || 36} onChange={(e) => handleUpdateNodeParam(node.id, 'size', parseInt(e.target.value) || 36)} className={`w-full border rounded px-2 py-1 text-xs ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'}`} />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <span className={`text-[10px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Text Color</span>
                                                            <input type="color" value={node.data.parameters?.color || '#ffffff'} onChange={(e) => handleUpdateNodeParam(node.id, 'color', e.target.value)} className="w-full h-7 border rounded bg-transparent" />
                                                        </div>
                                                    </div>
                                                )}

                                                {node.type === 'translate_subtitles' && (
                                                    <div>
                                                        <span className={`text-[10px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Target Language</span>
                                                        <select value={node.data.parameters?.target_language || 'Spanish'} onChange={(e) => handleUpdateNodeParam(node.id, 'target_language', e.target.value)} className={`w-full border rounded px-1.5 py-1 text-xs outline-none ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-gray-200' : 'bg-white border-gray-200 text-gray-700'}`}>
                                                            {['Spanish', 'French', 'German', 'Hindi', 'Japanese', 'Arabic', 'Portuguese'].map(v => <option key={v} value={v} className="bg-[#1a1a1a] text-white">{v}</option>)}
                                                        </select>
                                                    </div>
                                                )}

                                                {node.type === 'animated_text' && (
                                                    <div className="space-y-2">
                                                        <div>
                                                            <span className={`text-[10px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Text</span>
                                                            <input type="text" value={node.data.parameters?.text || ''} onChange={(e) => handleUpdateNodeParam(node.id, 'text', e.target.value)} placeholder="Trending Now" className={`w-full border rounded px-2 py-1 text-xs ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'}`} />
                                                        </div>
                                                        <div>
                                                            <span className={`text-[10px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Animation</span>
                                                            <select value={node.data.parameters?.animation || 'Fade In'} onChange={(e) => handleUpdateNodeParam(node.id, 'animation', e.target.value)} className={`w-full border rounded px-1.5 py-1 text-xs outline-none ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-gray-200' : 'bg-white border-gray-200 text-gray-700'}`}>
                                                                {['Fade In', 'Slide Up', 'Typewriter', 'Bounce', 'Glitch', 'Zoom'].map(v => <option key={v} value={v} className="bg-[#1a1a1a] text-white">{v}</option>)}
                                                            </select>
                                                        </div>
                                                    </div>
                                                )}

                                                {node.type === 'speech_to_text' && (
                                                    <div>
                                                        <span className={`text-[10px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Transcription Model</span>
                                                        <select value={node.data.parameters?.model || 'Whisper Large'} onChange={(e) => handleUpdateNodeParam(node.id, 'model', e.target.value)} className={`w-full border rounded px-1.5 py-1 text-xs outline-none ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-gray-200' : 'bg-white border-gray-200 text-gray-700'}`}>
                                                            {['Whisper Large', 'Whisper Turbo', 'Whisper Small'].map(v => <option key={v} value={v} className="bg-[#1a1a1a] text-white">{v}</option>)}
                                                        </select>
                                                    </div>
                                                )}

                                                {node.type === 'subtitle_styling' && (
                                                    <div className="space-y-2">
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <span className={`text-[10px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Font</span>
                                                                <select value={node.data.parameters?.font || 'Inter'} onChange={(e) => handleUpdateNodeParam(node.id, 'font', e.target.value)} className={`w-full border rounded px-1.5 py-1 text-xs outline-none ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-gray-200' : 'bg-white border-gray-200 text-gray-700'}`}>
                                                                    {['Inter', 'Roboto', 'Poppins', 'Montserrat', 'Arial'].map(v => <option key={v} value={v} className="bg-[#1a1a1a] text-white">{v}</option>)}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <span className={`text-[10px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Color</span>
                                                                <input type="color" value={node.data.parameters?.color || '#ffff00'} onChange={(e) => handleUpdateNodeParam(node.id, 'color', e.target.value)} className="w-full h-7 border rounded bg-transparent" />
                                                            </div>
                                                        </div>
                                                        <label className="flex items-center space-x-2 text-[11px] cursor-pointer">
                                                            <input type="checkbox" checked={node.data.parameters?.bg_box ?? true} onChange={(e) => handleUpdateNodeParam(node.id, 'bg_box', e.target.checked)} className="accent-cyan-500" />
                                                            <span>Background box</span>
                                                        </label>
                                                    </div>
                                                )}

                                                {node.type === 'video_audio_extract' && (                                                    <div className="space-y-2">
                                                        <div>
                                                            <span className={`text-[10px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Audio Format</span>
                                                            <select value={node.data.parameters?.format || 'mp3'} onChange={(e) => handleUpdateNodeParam(node.id, 'format', e.target.value)} className={`w-full border rounded px-1.5 py-1 text-xs outline-none ${darkMode ? 'bg-[#18181b] border-[#2a2a2a] text-slate-200' : 'bg-white border-gray-200 text-gray-700'}`}>
                                                                <option value="mp3">MP3 (Universal Audio)</option>
                                                                <option value="wav">WAV (Lossless High Quality)</option>
                                                                <option value="aac">AAC (Modern Streaming)</option>
                                                            </select>
                                                        </div>
                                                        <div className="flex justify-between items-center text-[10px]">
                                                            <span className={darkMode ? 'text-slate-400' : 'text-gray-500'}>Bitrate</span>
                                                            <span className="font-mono text-pink-400">320 kbps</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {node.type === 'video_resolution' && (
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <span className={`text-[10px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Resolution</span>
                                                            <select value={node.data.parameters?.resolution || '1080p'} onChange={(e) => handleUpdateNodeParam(node.id, 'resolution', e.target.value)} className={`w-full border rounded px-1.5 py-1 text-xs outline-none ${darkMode ? 'bg-[#18181b] border-[#2a2a2a] text-slate-200' : 'bg-white border-gray-200 text-gray-700'}`}>
                                                                <option value="720p">720p (HD)</option>
                                                                <option value="1080p">1080p (Full HD)</option>
                                                                <option value="4k">4K (UHD)</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <span className={`text-[10px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Frame Rate</span>
                                                            <select value={node.data.parameters?.fps || 30} onChange={(e) => handleUpdateNodeParam(node.id, 'fps', parseInt(e.target.value))} className={`w-full border rounded px-1.5 py-1 text-xs outline-none ${darkMode ? 'bg-[#18181b] border-[#2a2a2a] text-slate-200' : 'bg-white border-gray-200 text-gray-700'}`}>
                                                                <option value="24">24 FPS (Cinematic)</option>
                                                                <option value="30">30 FPS (Standard)</option>
                                                                <option value="60">60 FPS (Smooth)</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* AUDIO NODES */}
                                                {(node.type === 'audio_input' || node.type === 'video_audio_ref') && (
                                                    <div className="flex flex-col space-y-2">
                                                        {displayAsset && (displayAsset.type === 'audio' || displayAsset.url?.match(/\.(mp3|wav|ogg|aac)$/i)) ? (
                                                            <div className={`rounded-lg overflow-hidden border relative group p-2.5 ${darkMode ? 'bg-black/40 border-white/5' : 'bg-gray-100 border-gray-200'}`}>
                                                                <audio src={`${API_BASE}/api/asset/${displayAsset.url}`} controls className="w-full h-10" />
                                                                <button 
                                                                    type="button"
                                                                    onClick={(e) => { 
                                                                        e.stopPropagation(); 
                                                                        handleUpdateNodeParam(node.id, 'audio_id', null); 
                                                                        setSelectedAsset(null);
                                                                    }} 
                                                                    className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-rose-600 text-white rounded p-1 opacity-90 transition shadow-md"
                                                                    title="Remove audio"
                                                                >
                                                                    <X className="w-3.5 h-3.5"/>
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className={`h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center ${darkMode ? 'border-white/10 bg-black/20' : 'border-gray-300 bg-gray-50'}`}>
                                                                <p className={`text-[10px] mb-2 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Drop audio here (MP3, WAV)</p>
                                                                <label className={`px-2 py-1 rounded cursor-pointer text-[10px] font-semibold flex items-center space-x-1 ${darkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}>
                                                                    <Upload className="w-3 h-3" /><span>Upload Audio</span>
                                                                    <input type="file" accept="audio/*" onChange={(e) => handleFileUpload(e, node.id)} className="hidden" />
                                                                </label>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {node.type === 'audio_trim' && (
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <span className={`text-[10px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Start (sec)</span>
                                                            <input type="number" step="0.5" min="0" value={node.data.parameters?.start ?? 0} onChange={(e) => handleUpdateNodeParam(node.id, 'start', parseFloat(e.target.value) || 0)} className={`w-full border rounded px-2 py-1 text-xs ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'}`} />
                                                        </div>
                                                        <div>
                                                            <span className={`text-[10px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>End (sec)</span>
                                                            <input type="number" step="0.5" min="1" value={node.data.parameters?.end ?? 30} onChange={(e) => handleUpdateNodeParam(node.id, 'end', parseFloat(e.target.value) || 30)} className={`w-full border rounded px-2 py-1 text-xs ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'}`} />
                                                        </div>
                                                    </div>
                                                )}

                                                {node.type === 'audio_volume' && (
                                                    <div>
                                                        <div className={`flex justify-between text-[11px] mb-1 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}><span>Gain Level</span><span className={`font-mono ${darkMode ? 'text-slate-200' : 'text-gray-700'}`}>{Math.round((node.data.parameters?.factor || 1.0) * 100)}%</span></div>
                                                        <input type="range" min="0.0" max="2.0" step="0.05" value={node.data.parameters?.factor ?? 1.0} onChange={(e) => handleUpdateNodeParam(node.id, 'factor', parseFloat(e.target.value))} className="w-full accent-teal-500" />
                                                    </div>
                                                )}

                                                {node.type === 'audio_fade' && (
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <span className={`text-[10px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Fade In (sec)</span>
                                                            <input type="number" step="0.5" min="0" max="10" value={node.data.parameters?.in_duration ?? 2.0} onChange={(e) => handleUpdateNodeParam(node.id, 'in_duration', parseFloat(e.target.value) || 0)} className={`w-full border rounded px-2 py-1 text-xs ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'}`} />
                                                        </div>
                                                        <div>
                                                            <span className={`text-[10px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Fade Out (sec)</span>
                                                            <input type="number" step="0.5" min="0" max="10" value={node.data.parameters?.out_duration ?? 2.0} onChange={(e) => handleUpdateNodeParam(node.id, 'out_duration', parseFloat(e.target.value) || 0)} className={`w-full border rounded px-2 py-1 text-xs ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'}`} />
                                                        </div>
                                                    </div>
                                                )}

                                                {node.type === 'audio_pitch' && (
                                                    <div className="space-y-2">
                                                        <div>
                                                            <div className={`flex justify-between text-[11px] mb-1 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}><span>Pitch Scale</span><span className={`font-mono ${darkMode ? 'text-slate-200' : 'text-gray-700'}`}>{node.data.parameters?.pitch || 1.0}x</span></div>
                                                            <input type="range" min="0.5" max="2.0" step="0.05" value={node.data.parameters?.pitch ?? 1.0} onChange={(e) => handleUpdateNodeParam(node.id, 'pitch', parseFloat(e.target.value))} className="w-full accent-teal-500" />
                                                        </div>
                                                        <div>
                                                            <div className={`flex justify-between text-[11px] mb-1 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}><span>Tempo / Speed</span><span className={`font-mono ${darkMode ? 'text-slate-200' : 'text-gray-700'}`}>{node.data.parameters?.speed || 1.0}x</span></div>
                                                            <input type="range" min="0.5" max="2.0" step="0.05" value={node.data.parameters?.speed ?? 1.0} onChange={(e) => handleUpdateNodeParam(node.id, 'speed', parseFloat(e.target.value))} className="w-full accent-teal-500" />
                                                        </div>
                                                    </div>
                                                )}

                                                {node.type === 'audio_denoise' && (
                                                    <div>
                                                        <div className={`flex justify-between text-[11px] mb-1 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}><span>Denoise Strength</span><span className={`font-mono ${darkMode ? 'text-slate-200' : 'text-gray-700'}`}>{node.data.parameters?.level || 50}%</span></div>
                                                        <input type="range" min="0" max="100" step="5" value={node.data.parameters?.level ?? 50} onChange={(e) => handleUpdateNodeParam(node.id, 'level', parseInt(e.target.value))} className="w-full accent-teal-500" />
                                                    </div>
                                                )}

                                                {node.type === 'audio_mixer' && (
                                                    <div className="space-y-2">
                                                        <div>
                                                            <div className="flex justify-between text-[11px] mb-1"><span>Original Audio</span><span className="font-mono">{Math.round((node.data.parameters?.original_volume ?? 0.5) * 100)}%</span></div>
                                                            <input type="range" min="0" max="2" step="0.05" value={node.data.parameters?.original_volume ?? 0.5} onChange={(e) => handleUpdateNodeParam(node.id, 'original_volume', parseFloat(e.target.value))} className="w-full accent-teal-500" />
                                                        </div>
                                                        <div>
                                                            <div className="flex justify-between text-[11px] mb-1"><span>Music / Voice Track</span><span className="font-mono">{Math.round((node.data.parameters?.bg_volume ?? 0.5) * 100)}%</span></div>
                                                            <input type="range" min="0" max="2" step="0.05" value={node.data.parameters?.bg_volume ?? 0.5} onChange={(e) => handleUpdateNodeParam(node.id, 'bg_volume', parseFloat(e.target.value))} className="w-full accent-teal-500" />
                                                        </div>
                                                    </div>
                                                )}

                                                {node.type === 'prompt_enhancer' && (
                                                    <div className="space-y-2">
                                                        <div>
                                                            <span className={`text-[10px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Base Concept</span>
                                                            <input type="text" value={node.data.parameters?.prompt || ''} onChange={(e) => handleUpdateNodeParam(node.id, 'prompt', e.target.value)} placeholder="e.g. A mountain castle..." className={`w-full border rounded px-2 py-1 text-xs ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'}`} />
                                                        </div>
                                                        <div>
                                                            <span className={`text-[10px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Enhancement Modifiers</span>
                                                            <input type="text" value={node.data.parameters?.style || ''} onChange={(e) => handleUpdateNodeParam(node.id, 'style', e.target.value)} placeholder="photorealistic, 8k, dramatic lighting..." className={`w-full border rounded px-2 py-1 text-xs ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'}`} />
                                                        </div>
                                                    </div>
                                                )}

                                                {node.type === 'style_preset' && (
                                                    <div className="space-y-2">
                                                        <div>
                                                            <span className={`text-[10px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Aesthetic Style</span>
                                                            <select value={node.data.parameters?.style || 'Cinematic'} onChange={(e) => handleUpdateNodeParam(node.id, 'style', e.target.value)} className={`w-full border rounded px-1.5 py-1 text-xs outline-none ${darkMode ? 'bg-[#18181b] border-[#2a2a2a] text-slate-200' : 'bg-white border-gray-200 text-gray-700'}`}>
                                                                <option value="Cinematic">Cinematic 35mm</option>
                                                                <option value="Anime">Anime / Studio Ghibli</option>
                                                                <option value="Cyberpunk">Cyberpunk Neon</option>
                                                                <option value="Fantasy">Fantasy Digital Art</option>
                                                                <option value="Minimalist">Minimalist Vector</option>
                                                                <option value="OilPainting">Classic Oil Painting</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <div className={`flex justify-between text-[11px] mb-1 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}><span>Style Strength</span><span className={`font-mono ${darkMode ? 'text-slate-200' : 'text-gray-700'}`}>{node.data.parameters?.strength || 80}%</span></div>
                                                            <input type="range" min="10" max="100" step="5" value={node.data.parameters?.strength ?? 80} onChange={(e) => handleUpdateNodeParam(node.id, 'strength', parseInt(e.target.value))} className="w-full accent-orange-500" />
                                                        </div>
                                                    </div>
                                                )}

                                                {node.type === 'text_output' && (
                                                    <div className="space-y-1.5">
                                                        <span className={`text-[10px] block ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Output Text</span>
                                                        <div className={`min-h-[4.5rem] max-h-40 overflow-y-auto rounded-lg border p-2 text-[11px] whitespace-pre-wrap break-words ${darkMode ? 'bg-black/40 border-white/10 text-gray-200' : 'bg-white border-gray-200 text-gray-800'}`}>
                                                            {workflowResultText || <span className={darkMode ? 'text-slate-500' : 'text-gray-400'}>Run the workflow to see the text output.</span>}
                                                        </div>
                                                        {workflowResultText && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); navigator.clipboard?.writeText(workflowResultText); addToast('Text copied', 'success'); }}
                                                                className={`w-full py-1.5 border rounded-lg text-[10px] font-medium transition flex items-center justify-center space-x-1 ${darkMode ? 'border-white/10 text-gray-300 hover:bg-white/5' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                                                            >
                                                                <Copy className="w-3 h-3" /><span>Copy Text</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                )}

                                                {node.type === 'brightness' && (
                                                    <div>
                                                        <div className={`flex justify-between text-[11px] mb-1 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}><span>Factor</span><span className={`font-mono ${darkMode ? 'text-slate-200' : 'text-gray-700'}`}>{node.data.parameters?.factor || 1.0}</span></div>
                                                        <input type="range" min="0.1" max="2.5" step="0.05" value={node.data.parameters?.factor ?? 1.0} onChange={(e) => handleUpdateNodeParam(node.id, 'factor', parseFloat(e.target.value))} className="w-full accent-indigo-500" />
                                                    </div>
                                                )}

                                                {node.type === 'contrast' && (
                                                    <div>
                                                        <div className={`flex justify-between text-[11px] mb-1 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}><span>Factor</span><span className={`font-mono ${darkMode ? 'text-slate-200' : 'text-gray-700'}`}>{node.data.parameters?.factor || 1.0}</span></div>
                                                        <input type="range" min="0.1" max="2.5" step="0.05" value={node.data.parameters?.factor ?? 1.0} onChange={(e) => handleUpdateNodeParam(node.id, 'factor', parseFloat(e.target.value))} className="w-full accent-indigo-500" />
                                                    </div>
                                                )}

                                                {node.type === 'saturation' && (
                                                    <div>
                                                        <div className={`flex justify-between text-[11px] mb-1 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}><span>Factor</span><span className={`font-mono ${darkMode ? 'text-slate-200' : 'text-gray-700'}`}>{node.data.parameters?.factor || 1.0}</span></div>
                                                        <input type="range" min="0.0" max="3.0" step="0.05" value={node.data.parameters?.factor ?? 1.0} onChange={(e) => handleUpdateNodeParam(node.id, 'factor', parseFloat(e.target.value))} className="w-full accent-indigo-500" />
                                                    </div>
                                                )}

                                                {node.type === 'blur' && (
                                                    <div>
                                                        <div className={`flex justify-between text-[11px] mb-1 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}><span>Radius</span><span className={`font-mono ${darkMode ? 'text-slate-200' : 'text-gray-700'}`}>{node.data.parameters?.radius || 2}px</span></div>
                                                        <input type="range" min="0.5" max="20" step="0.5" value={node.data.parameters?.radius ?? 2} onChange={(e) => handleUpdateNodeParam(node.id, 'radius', parseFloat(e.target.value))} className="w-full accent-indigo-500" />
                                                    </div>
                                                )}

                                                {node.type === 'sharpen' && (
                                                    <div>
                                                        <div className={`flex justify-between text-[11px] mb-1 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}><span>Intensity</span><span className={`font-mono ${darkMode ? 'text-slate-200' : 'text-gray-700'}`}>{node.data.parameters?.factor || 1.5}x</span></div>
                                                        <input type="range" min="1.0" max="4.0" step="0.1" value={node.data.parameters?.factor ?? 1.5} onChange={(e) => handleUpdateNodeParam(node.id, 'factor', parseFloat(e.target.value))} className="w-full accent-indigo-500" />
                                                    </div>
                                                )}

                                                {node.type === 'color_balance' && (
                                                    <div className="space-y-2">
                                                        <div>
                                                            <div className={`flex justify-between text-[11px] mb-1 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                                                <span className="text-rose-400">Red Channel</span>
                                                                <span className={`font-mono ${darkMode ? 'text-slate-200' : 'text-gray-700'}`}>{node.data.parameters?.red || 1.0}x</span>
                                                            </div>
                                                            <input type="range" min="0.0" max="2.0" step="0.05" value={node.data.parameters?.red ?? 1.0} onChange={(e) => handleUpdateNodeParam(node.id, 'red', parseFloat(e.target.value))} className="w-full accent-rose-500" />
                                                        </div>
                                                        <div>
                                                            <div className={`flex justify-between text-[11px] mb-1 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                                                <span className="text-emerald-400">Green Channel</span>
                                                                <span className={`font-mono ${darkMode ? 'text-slate-200' : 'text-gray-700'}`}>{node.data.parameters?.green || 1.0}x</span>
                                                            </div>
                                                            <input type="range" min="0.0" max="2.0" step="0.05" value={node.data.parameters?.green ?? 1.0} onChange={(e) => handleUpdateNodeParam(node.id, 'green', parseFloat(e.target.value))} className="w-full accent-emerald-500" />
                                                        </div>
                                                        <div>
                                                            <div className={`flex justify-between text-[11px] mb-1 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                                                <span className="text-sky-400">Blue Channel</span>
                                                                <span className={`font-mono ${darkMode ? 'text-slate-200' : 'text-gray-700'}`}>{node.data.parameters?.blue || 1.0}x</span>
                                                            </div>
                                                            <input type="range" min="0.0" max="2.0" step="0.05" value={node.data.parameters?.blue ?? 1.0} onChange={(e) => handleUpdateNodeParam(node.id, 'blue', parseFloat(e.target.value))} className="w-full accent-sky-500" />
                                                        </div>
                                                    </div>
                                                )}

                                                {node.type === 'auto_contrast' && (
                                                    <div>
                                                        <div className={`flex justify-between text-[11px] mb-1 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                                            <span>Cutoff Percentage</span>
                                                            <span className={`font-mono ${darkMode ? 'text-slate-200' : 'text-gray-700'}`}>{node.data.parameters?.cutoff || 1}%</span>
                                                        </div>
                                                        <input type="range" min="0" max="10" step="1" value={node.data.parameters?.cutoff ?? 1} onChange={(e) => handleUpdateNodeParam(node.id, 'cutoff', parseInt(e.target.value))} className="w-full accent-indigo-500" />
                                                    </div>
                                                )}

                                                {node.type === 'crop' && (
                                                    <div className="space-y-2">
                                                        <div>
                                                            <label className={`text-[10px] block mb-1 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Aspect Ratio</label>
                                                            <select
                                                                value={node.data.parameters?.aspect_ratio || '1:1'}
                                                                onChange={(e) => handleUpdateNodeParam(node.id, 'aspect_ratio', e.target.value)}
                                                                className={`w-full border rounded px-2 py-1 text-xs outline-none ${darkMode ? 'bg-[#18181b] border-[#2a2a2a] text-slate-200' : 'bg-white border-gray-200 text-gray-700'}`}
                                                            >
                                                                <option value="1:1" className="bg-[#18181b] text-white">1:1 (Square)</option>
                                                                <option value="16:9" className="bg-[#18181b] text-white">16:9 (Landscape / YouTube)</option>
                                                                <option value="9:16" className="bg-[#18181b] text-white">9:16 (Portrait / Reels / Story)</option>
                                                                <option value="4:3" className="bg-[#18181b] text-white">4:3 (Standard Photo)</option>
                                                                <option value="3:2" className="bg-[#18181b] text-white">3:2 (Classic 35mm)</option>
                                                                <option value="custom" className="bg-[#18181b] text-white">Custom Box (Left/Top/W/H)</option>
                                                            </select>
                                                        </div>
                                                        {node.data.parameters?.aspect_ratio === 'custom' && (
                                                            <div className="grid grid-cols-2 gap-1.5 pt-1">
                                                                <div>
                                                                    <span className={`text-[9px] block ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Left</span>
                                                                    <input type="number" value={node.data.parameters?.left || 0} onChange={(e) => handleUpdateNodeParam(node.id, 'left', parseInt(e.target.value) || 0)} className={`w-full border rounded px-1.5 py-0.5 text-xs ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'}`} />
                                                                </div>
                                                                <div>
                                                                    <span className={`text-[9px] block ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Top</span>
                                                                    <input type="number" value={node.data.parameters?.top || 0} onChange={(e) => handleUpdateNodeParam(node.id, 'top', parseInt(e.target.value) || 0)} className={`w-full border rounded px-1.5 py-0.5 text-xs ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'}`} />
                                                                </div>
                                                                <div>
                                                                    <span className={`text-[9px] block ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Width</span>
                                                                    <input type="number" value={node.data.parameters?.width || 800} onChange={(e) => handleUpdateNodeParam(node.id, 'width', parseInt(e.target.value) || 100)} className={`w-full border rounded px-1.5 py-0.5 text-xs ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'}`} />
                                                                </div>
                                                                <div>
                                                                    <span className={`text-[9px] block ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Height</span>
                                                                    <input type="number" value={node.data.parameters?.height || 800} onChange={(e) => handleUpdateNodeParam(node.id, 'height', parseInt(e.target.value) || 100)} className={`w-full border rounded px-1.5 py-0.5 text-xs ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'}`} />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {node.type === 'edge_detection' && (
                                                    <div className="space-y-1.5">
                                                        <div className={`flex justify-between text-[10px] ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}><span>Thresholds: {node.data.parameters?.threshold1 || 100} / {node.data.parameters?.threshold2 || 200}</span></div>
                                                        <select value={node.data.parameters?.tint || 'cyan'} onChange={(e) => handleUpdateNodeParam(node.id, 'tint', e.target.value)} className={`w-full border rounded px-2 py-1 text-xs outline-none ${darkMode ? 'bg-[#18181b] border-[#2a2a2a] text-slate-200' : 'bg-white border-gray-200 text-gray-700'}`}>
                                                            <option value="cyan" className="bg-[#18181b] text-white">Tint: Cyan Neon</option>
                                                            <option value="green" className="bg-[#18181b] text-white">Tint: Green Matrix</option>
                                                            <option value="white" className="bg-[#18181b] text-white">Tint: White High Contrast</option>
                                                        </select>
                                                    </div>
                                                )}

                                                {node.type === 'sepia' && (
                                                    <div>
                                                        <div className={`flex justify-between text-[11px] mb-1 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}><span>Intensity</span><span className={`font-mono ${darkMode ? 'text-slate-200' : 'text-gray-700'}`}>{Math.round((node.data.parameters?.intensity || 0.8) * 100)}%</span></div>
                                                        <input type="range" min="0.0" max="1.0" step="0.05" value={node.data.parameters?.intensity ?? 0.8} onChange={(e) => handleUpdateNodeParam(node.id, 'intensity', parseFloat(e.target.value))} className="w-full accent-indigo-500" />
                                                    </div>
                                                )}

                                                {node.type === 'vignette' && (
                                                    <div>
                                                        <div className={`flex justify-between text-[11px] mb-1 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}><span>Intensity</span><span className={`font-mono ${darkMode ? 'text-slate-200' : 'text-gray-700'}`}>{Math.round((node.data.parameters?.intensity || 0.6) * 100)}%</span></div>
                                                        <input type="range" min="0.0" max="1.0" step="0.05" value={node.data.parameters?.intensity ?? 0.6} onChange={(e) => handleUpdateNodeParam(node.id, 'intensity', parseFloat(e.target.value))} className="w-full accent-indigo-500" />
                                                    </div>
                                                )}

                                                {node.type === 'threshold' && (
                                                    <div>
                                                        <div className={`flex justify-between text-[11px] mb-1 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}><span>Thresh</span><span className={`font-mono ${darkMode ? 'text-slate-200' : 'text-gray-700'}`}>{node.data.parameters?.thresh || 128}</span></div>
                                                        <input type="range" min="0" max="255" step="1" value={node.data.parameters?.thresh ?? 128} onChange={(e) => handleUpdateNodeParam(node.id, 'thresh', parseInt(e.target.value))} className="w-full accent-indigo-500" />
                                                    </div>
                                                )}

                                                {node.type === 'resize' && (
                                                    <div className="space-y-2">
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <span className={`text-[10px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Width</span>
                                                                <input type="number" value={node.data.parameters?.width || 1080} onChange={(e) => handleUpdateNodeParam(node.id, 'width', parseInt(e.target.value))} className={`w-full border rounded px-2 py-1 text-xs ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'}`} />
                                                            </div>
                                                            <div>
                                                                <span className={`text-[10px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Height</span>
                                                                <input type="number" value={node.data.parameters?.height || 1080} onChange={(e) => handleUpdateNodeParam(node.id, 'height', parseInt(e.target.value))} className={`w-full border rounded px-2 py-1 text-xs ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'}`} />
                                                            </div>
                                                        </div>
                                                        <select value={node.data.parameters?.mode || 'fit'} onChange={(e) => handleUpdateNodeParam(node.id, 'mode', e.target.value)} className={`w-full border rounded px-2 py-1 text-xs outline-none ${darkMode ? 'bg-[#18181b] border-[#2a2a2a] text-slate-200' : 'bg-white border-gray-200 text-gray-700'}`}>
                                                            <option value="fit" className="bg-[#18181b] text-white">Mode: Fit</option>
                                                            <option value="fill" className="bg-[#18181b] text-white">Mode: Fill & Crop</option>
                                                            <option value="stretch" className="bg-[#18181b] text-white">Mode: Stretch</option>
                                                            <option value="pad" className="bg-[#18181b] text-white">Mode: Fit with Padding</option>
                                                        </select>
                                                    </div>
                                                )}

                                                {node.type === 'rotate' && (
                                                    <div className="space-y-2">
                                                        <div>
                                                            <div className={`flex justify-between text-[11px] mb-1 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}><span>Angle</span><span className={`font-mono ${darkMode ? 'text-slate-200' : 'text-gray-700'}`}>{node.data.parameters?.angle || 90}°</span></div>
                                                            <input type="range" min="-180" max="180" step="1" value={node.data.parameters?.angle ?? 90} onChange={(e) => handleUpdateNodeParam(node.id, 'angle', parseInt(e.target.value))} className="w-full accent-indigo-500" />
                                                        </div>
                                                        <label className={`flex items-center space-x-1.5 text-[10px] ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                                            <input type="checkbox" checked={node.data.parameters?.expand ?? true} onChange={(e) => handleUpdateNodeParam(node.id, 'expand', e.target.checked)} className="accent-indigo-500" />
                                                            <span>Expand canvas to fit rotated image</span>
                                                        </label>
                                                    </div>
                                                )}

                                                {node.type === 'flip' && (
                                                    <div className="space-y-1.5">
                                                        <select value={node.data.parameters?.direction || 'horizontal'} onChange={(e) => handleUpdateNodeParam(node.id, 'direction', e.target.value)} className={`w-full border rounded px-2 py-1 text-xs outline-none ${darkMode ? 'bg-[#18181b] border-[#2a2a2a] text-slate-200' : 'bg-white border-gray-200 text-gray-700'}`}>
                                                            <option value="horizontal" className="bg-[#18181b] text-white">Horizontal</option>
                                                            <option value="vertical" className="bg-[#18181b] text-white">Vertical</option>
                                                            <option value="both" className="bg-[#18181b] text-white">Both</option>
                                                        </select>
                                                    </div>
                                                )}

                                                {node.type === 'video_audio_merge' && (
                                                    <div className={`rounded-lg border border-dashed p-2 text-[10px] leading-relaxed ${darkMode ? 'border-white/10 text-slate-400' : 'border-gray-300 text-gray-500'}`}>
                                                        Connect a video (generated or uploaded) and a voice/audio node. The merged MP4 keeps the video and adds the audio track. Requires ffmpeg (<span className="font-mono">pip install imageio-ffmpeg</span>).
                                                    </div>
                                                )}

                                                {(node.type === 'video_output' || node.type === 'video_preview' || node.type === 'video_audio_merge') && (() => {
                                                    const parentIds = edges.filter(e => e.target === node.id).map(e => e.source);
                                                    const upstreamVideo = parentIds.map(pid => nodeVideoUrl(pid) || aiNodeResults[pid]).find(u => u && /\.(mp4|webm|mov)$/i.test(u));
                                                    const globalVideo = (node.type === 'video_output' || node.type === 'video_audio_merge') && workflowResultType === 'video' ? workflowResultUrl : null;
                                                    const videoUrl = nodeVideoUrl(node.id) || upstreamVideo || globalVideo || null;
                                                    return (
                                                    <div className="space-y-2">
                                                        <div className={`h-32 rounded-lg overflow-hidden flex flex-col items-center justify-center border relative ${darkMode ? 'bg-black/40 border-white/5' : 'bg-gray-100 border-gray-200'}`}>
                                                            {videoUrl ? (
                                                                <>
                                                                    <video src={assetSrc(videoUrl)} controls className="h-full w-full object-contain bg-black" />
                                                                    <div className="absolute top-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded backdrop-blur-sm">Video Output</div>
                                                                </>
                                                            ) : <span className={`text-[10px] ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Awaiting Run</span>}
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center justify-between">
                                                                <span className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Format</span>
                                                                <select value={node.data.parameters?.format || 'MP4'} onChange={(e) => handleUpdateNodeParam(node.id, 'format', e.target.value)} className={`border rounded px-1.5 py-1 text-xs outline-none ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-gray-200' : 'bg-white border-gray-200 text-gray-700'}`}>
                                                                    <option value="MP4">MP4 (H.264)</option>
                                                                    <option value="WEBM">WEBM (VP9)</option>
                                                                    <option value="MOV">MOV (QuickTime)</option>
                                                                </select>
                                                            </div>
                                                            {videoUrl && (
                                                                <div className="flex flex-col space-y-1.5">
                                                                    <button onClick={(e) => { e.stopPropagation(); handleDownloadImage(videoUrl, `netrootai_video.${(node.data.parameters?.format || 'mp4').toLowerCase()}`); }} className="w-full py-1.5 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-lg text-[10px] transition flex items-center justify-center space-x-1 shadow-md shadow-pink-600/20">
                                                                        <Download className="w-3 h-3" /><span>Download Video</span>
                                                                    </button>
                                                                    <button onClick={(e) => { e.stopPropagation(); handleSaveToLibrary(videoUrl); }} className={`w-full py-1.5 border rounded-lg text-[10px] font-medium transition flex items-center justify-center space-x-1 ${darkMode ? 'border-cyan-500/30 text-cyan-400 bg-cyan-950/20 hover:bg-cyan-900/30' : 'border-cyan-300 text-cyan-700 bg-cyan-50 hover:bg-cyan-100'}`}>
                                                                        <Save className="w-3 h-3" /><span>Save to Library</span>
                                                                    </button>
                                                                    <button onClick={(e) => { e.stopPropagation(); setPreviewImageUrl(videoUrl); }} className={`w-full py-1.5 border rounded-lg text-[10px] font-medium transition flex items-center justify-center space-x-1 ${darkMode ? 'border-white/10 text-gray-300 hover:bg-white/5' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>
                                                                        <Eye className="w-3 h-3" /><span>Preview Full Size</span>
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    );
                                                })()}

                                                {node.type === 'image_output' && (
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <span className={`text-[10px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Format</span>
                                                            <select value={node.data.parameters?.format || 'PNG'} onChange={(e) => handleUpdateNodeParam(node.id, 'format', e.target.value)} className={`w-full border rounded px-1.5 py-1 text-xs outline-none ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-gray-200' : 'bg-white border-gray-200 text-gray-700'}`}>
                                                                {['PNG', 'JPG', 'WEBP'].map(v => <option key={v} value={v} className="bg-[#1a1a1a] text-white">{v}</option>)}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <span className={`text-[10px] block mb-0.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Quality</span>
                                                            <input type="number" min="1" max="100" value={node.data.parameters?.quality ?? 95} onChange={(e) => handleUpdateNodeParam(node.id, 'quality', parseInt(e.target.value) || 95)} className={`w-full border rounded px-2 py-1 text-xs ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'}`} />
                                                        </div>
                                                    </div>
                                                )}

                                                {(node.type === 'save_image' || node.type === 'image_output' || node.type === 'image_preview') && (() => {
                                                    const globalImage = workflowResultType === 'image' ? workflowResultUrl : null;
                                                    const imageUrl = nodeAssetUrl(node.id) || globalImage || null;
                                                    return (
                                                    <div className="space-y-2">
                                                        <div className={`h-32 rounded-lg overflow-hidden flex flex-col items-center justify-center border relative ${darkMode ? 'bg-black/40 border-white/5' : 'bg-gray-100 border-gray-200'}`}>
                                                            {imageUrl ? (
                                                                <>
                                                                    <img src={`${API_BASE}/api/asset/${imageUrl}`} alt="Workflow Result" className="h-full w-full object-contain" />
                                                                    {outputDimensions && outputDimensions.includes('x') && <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded backdrop-blur-sm">{outputDimensions}</div>}
                                                                </>
                                                            ) : <span className={`text-[10px] ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Awaiting Run</span>}
                                                        </div>
                                                        {imageUrl && (
                                                            <div className="flex flex-col space-y-1.5 mt-1">
                                                                <button onClick={(e) => { e.stopPropagation(); handleSaveImageToLibrary(imageUrl); }} className={`w-full py-1.5 border rounded-lg text-[10px] font-medium transition flex items-center justify-center space-x-1 ${darkMode ? 'border-cyan-500/30 text-cyan-400 bg-cyan-950/20 hover:bg-cyan-900/30' : 'border-cyan-300 text-cyan-700 bg-cyan-50 hover:bg-cyan-100'}`}>
                                                                    <Save className="w-3 h-3" /><span>Save to Library</span>
                                                                </button>
                                                                <button onClick={(e) => { e.stopPropagation(); handleDownloadImage(imageUrl, 'netrootai_result.png'); }} className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[10px] transition flex items-center justify-center space-x-1 shadow-md shadow-emerald-600/20">
                                                                    <Download className="w-3 h-3" /><span>Download Image</span>
                                                                </button>
                                                                <button onClick={(e) => { e.stopPropagation(); setPreviewImageUrl(imageUrl); }} className={`w-full py-1.5 border rounded-lg text-[10px] font-medium transition flex items-center justify-center space-x-1 ${darkMode ? 'border-white/10 text-gray-300 hover:bg-white/5' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>
                                                                    <Eye className="w-3 h-3" /><span>Preview Full Size</span>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className={`canvas-control absolute top-4 left-4 flex flex-col space-y-1 border rounded-xl p-1 shadow-2xl z-20 ${darkMode ? 'bg-[#111116]/90 border-[#22222a]' : 'bg-white/95 border-gray-200'}`}>
                                <button onClick={() => handleZoom(0.15)} className={`w-8 h-8 rounded-lg flex items-center justify-center ${darkMode ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}><ZoomIn className="w-4 h-4" /></button>
                                <button onClick={() => handleZoom(-0.15)} className={`w-8 h-8 rounded-lg flex items-center justify-center ${darkMode ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}><ZoomOut className="w-4 h-4" /></button>
                                <button onClick={handleFitView} className={`w-8 h-8 rounded-lg flex items-center justify-center ${darkMode ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}><Maximize2 className="w-3.5 h-3.5" /></button>
                                <div className={`w-5 mx-auto my-0.5 border-t ${darkMode ? 'border-[#2a2a2a]' : 'border-gray-200'}`}></div>
                                <button title="Undo" onClick={handleUndo} disabled={historyIndex <= 0} className={`w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-30 ${darkMode ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}><Undo2 className="w-4 h-4" /></button>
                                <button title="Redo" onClick={handleRedo} disabled={historyIndex >= history.length - 1} className={`w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-30 ${darkMode ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}><Redo2 className="w-4 h-4" /></button>
                                <button title="Auto-Layout" onClick={handleAutoLayout} className={`w-8 h-8 rounded-lg flex items-center justify-center ${darkMode ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}><Layout className="w-4 h-4" /></button>
                            </div>

                            <div className={`canvas-control absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center space-x-3 backdrop-blur-md border rounded-2xl p-2 shadow-2xl z-20 ${darkMode ? 'bg-[#111116]/95 border-[#22222a]' : 'bg-white/95 border-gray-200'}`}>
                                <div className={`flex items-center space-x-1 border-r pr-3 ${darkMode ? 'border-[#22222a]' : 'border-gray-200'}`}>
                                    <span className={`text-[11px] font-semibold uppercase tracking-wider pl-1 pr-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Add Node:</span>
                                    <button title="Add image input" onClick={() => handleAddNode('image_input')} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition inline-flex items-center space-x-1 ${darkMode ? 'bg-[#1a1a1a] hover:bg-[#252525] text-gray-200 border-[#2a2a2a]' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'}`}><ImageIcon className="w-3 h-3" /><span>Image</span></button>
                                    <button title="Add video input" onClick={() => handleAddNode('video_input')} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition inline-flex items-center space-x-1 ${darkMode ? 'bg-[#1a1a1a] hover:bg-[#252525] text-gray-200 border-[#2a2a2a]' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'}`}><Video className="w-3 h-3" /><span>Video</span></button>
                                    <button title="Add audio input" onClick={() => handleAddNode('audio_input')} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition inline-flex items-center space-x-1 ${darkMode ? 'bg-[#1a1a1a] hover:bg-[#252525] text-gray-200 border-[#2a2a2a]' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'}`}><Music className="w-3 h-3" /><span>Audio</span></button>
                                    <button title="Add text node" onClick={() => handleAddNode('ai_text_to_image')} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition inline-flex items-center space-x-1 ${darkMode ? 'bg-[#1a1a1a] hover:bg-[#252525] text-gray-200 border-[#2a2a2a]' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'}`}><Type className="w-3 h-3" /><span>Text</span></button>
                                </div>
                                <button onClick={handleRunWorkflow} disabled={isRunning} className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-medium text-xs transition flex items-center space-x-1.5 shadow-lg shadow-blue-500/25">
                                    {isRunning ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Running...</span></> : <><Play className="w-3.5 h-3.5 fill-current" /><span>Run Workflow</span></>}
                                </button>
                            </div>

                            <div className={`absolute bottom-4 left-4 z-40 transition-all duration-300 flex flex-col ${logsOpen ? 'w-[400px] h-48' : 'w-32 h-8'} ${darkMode ? 'bg-[#111116]/95 border-[#22222a]' : 'bg-white/95 border-gray-200'} border rounded-xl shadow-2xl overflow-hidden backdrop-blur-md`}>
                                <button onClick={() => setLogsOpen(!logsOpen)} className={`flex items-center justify-between px-3 py-1.5 text-xs font-semibold ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'} w-full`}>
                                    <span className="flex items-center space-x-1.5"><Settings className="w-3.5 h-3.5" /><span>Logs ({logs.length})</span></span>
                                    {logsOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                                </button>
                                {logsOpen && <div id="log-container" className="flex-1 p-2 overflow-y-auto font-mono text-[10px] space-y-1">{logs.map((log, i) => <div key={i} className="flex space-x-2"><span>{log.time}</span><span className={log.type === 'error' ? 'text-rose-400' : log.type === 'success' ? 'text-emerald-400' : ''}>{log.text}</span></div>)}</div>}
                            </div>
                        </div>

                        <div className={`flex h-full transition-all duration-300 ${showInspector ? 'w-80' : 'w-0'}`}>
                            {showInspector && (
                                <aside className={`w-80 border-l flex flex-col overflow-y-auto relative ${darkMode ? 'border-[#1f1f1f] bg-[#0e0e0e]/95 backdrop-blur' : 'border-gray-200 bg-white'}`}>
                                    <div className={`p-4 border-b ${darkMode ? 'border-[#1f1f1f]' : 'border-gray-200'}`}>
                                        <h2 className={`text-sm font-semibold flex items-center space-x-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}><Settings className="w-4 h-4" /><span>Node Inspector</span></h2>
                                        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{selectedNode ? `Parameters for "${selectedNode.data?.label || selectedNode.type}"` : 'Select any node to configure'}</p>
                                    </div>
                                    {selectedNode ? (
                                        <div className="p-4 flex flex-col space-y-4">
                                            <div className={`p-3 rounded-xl border ${darkMode ? 'bg-[#161616] border-[#222222]' : 'bg-gray-50 border-gray-200'}`}>
                                                <div className="flex justify-between items-center text-xs mb-1"><span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Node ID</span><span className={`font-mono text-[11px] ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{selectedNode.id}</span></div>
                                                <div className="flex justify-between items-center text-xs"><span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Category</span><span className="text-blue-400 font-semibold">{NODE_TYPES[selectedNode.type]?.cat || 'Generic'}</span></div>
                                            </div>
                                            <div>
                                                <label className={`text-xs font-semibold block mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Custom Label</label>
                                                <input type="text" value={selectedNode.data?.label || ''} onChange={(e) => { const lbl = e.target.value; const newNodes = nodes.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, label: lbl } } : n); updateState(newNodes, edges); }} className={`w-full border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'}`} />
                                            </div>
                                            <div className="space-y-3">
                                                <span className={`text-[11px] font-semibold uppercase tracking-wider block ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Parameters</span>
                                                {Object.entries(selectedNode.data?.parameters || {}).map(([key, val]) => (
                                                    <div key={key} className="space-y-1">
                                                        <div className={`flex justify-between text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}><span className="capitalize">{key.replace('_', ' ')}</span><span className={`font-mono ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>{val}</span></div>
                                                        {typeof val === 'number' ? (
                                                            <input type="number" step={val % 1 !== 0 ? 0.05 : 1} value={val} onChange={(e) => handleUpdateNodeParam(selectedNode.id, key, parseFloat(e.target.value))} className={`w-full border rounded px-2.5 py-1 text-xs ${darkMode ? 'bg-black/40 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'}`} />
                                                        ) : key === 'prompt' ? (
                                                            <textarea rows="3" value={val} onChange={(e) => handleUpdateNodeParam(selectedNode.id, key, e.target.value)} className={`w-full border rounded-lg p-2 text-xs resize-none focus:outline-none focus:border-purple-500 ${darkMode ? 'bg-black/40 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'}`} placeholder="Enter AI prompt instruction..." />
                                                        ) : (
                                                            <input type="text" value={val} onChange={(e) => handleUpdateNodeParam(selectedNode.id, key, e.target.value)} className={`w-full border rounded px-2.5 py-1 text-xs ${darkMode ? 'bg-black/40 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'}`} />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            <div className={`pt-4 border-t flex space-x-2 ${darkMode ? 'border-white/5' : 'border-gray-200'}`}>
                                                <button onClick={() => handleDuplicateNode(selectedNode.id)} className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${darkMode ? 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/5' : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border-gray-200'}`}>Duplicate</button>
                                                <button onClick={() => handleDeleteNode(selectedNode.id)} className="flex-1 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs font-medium border border-rose-500/30">Delete</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={`p-4 space-y-4 text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                            <div className={`p-3 rounded-xl border space-y-2 ${darkMode ? 'bg-black/40 border-white/5' : 'bg-gray-50 border-gray-200'}`}>
                                                <div className="flex justify-between"><span>Total Nodes</span><span className={`font-mono ${darkMode ? 'text-white' : 'text-gray-900'}`}>{nodes.length}</span></div>
                                                <div className="flex justify-between"><span>Connections (Edges)</span><span className={`font-mono ${darkMode ? 'text-white' : 'text-gray-900'}`}>{edges.length}</span></div>
                                            </div>
                                        </div>
                                    )}
                                </aside>
                            )}
                        </div>

                        <button 
                            onClick={() => setShowInspector(!showInspector)}
                            className={`absolute top-1/2 -translate-y-1/2 z-30 w-6 h-12 flex items-center justify-center border-y shadow-md transition-all ${darkMode ? 'bg-[#0c0f17] border-white/10 text-slate-400 hover:text-white hover:bg-white/10' : 'bg-white border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                            style={{
                                right: showInspector ? '320px' : '0',
                                borderLeftWidth: '1px',
                                borderRightWidth: showInspector ? '1px' : '1px',
                                borderTopLeftRadius: showInspector ? '0' : '6px',
                                borderBottomLeftRadius: showInspector ? '0' : '6px',
                                borderTopRightRadius: showInspector ? '6px' : '0',
                                borderBottomRightRadius: showInspector ? '6px' : '0',
                            }}
                            title={showInspector ? "Close Inspector" : "Open Inspector"}
                        >
                            {showInspector ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                        </button>
                    </div>
                )}
            </div>

            {/* SAVE WORKFLOW MODAL */}
            {saveModalOpen && (
                <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className={`w-full max-w-md border rounded-2xl shadow-2xl p-6 flex flex-col space-y-4 ${darkMode ? 'bg-[#0e0e14] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                                <Save className="w-5 h-5 text-blue-400" />
                                <h3 className={`font-bold text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}>Save Workflow</h3>
                            </div>
                            <button onClick={() => setSaveModalOpen(false)} className={darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-700'}>
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Save this current node structure ({nodes.length} nodes, {edges.length} connections) to your library so you can reload it anytime.
                        </p>
                        <div>
                            <label className={`text-xs font-semibold block mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Workflow Name</label>
                            <input
                                type="text"
                                value={workflowNameInput}
                                onChange={(e) => setWorkflowNameInput(e.target.value)}
                                placeholder="e.g. My Color Grading Pipeline"
                                className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 ${darkMode ? 'bg-[#161616] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                            />
                        </div>
                        <div className="flex space-x-3 pt-2">
                            <button onClick={() => setSaveModalOpen(false)} className={`flex-1 py-2 rounded-xl text-xs font-medium border transition ${darkMode ? 'bg-white/5 hover:bg-white/10 text-gray-300 border-[#2a2a2a]' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'}`}>
                                Cancel
                            </button>
                            <button onClick={handleSaveWorkflow} className="flex-1 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs shadow-md shadow-blue-500/20">
                                Save Workflow
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SAVED LIBRARY MODAL (IMAGES, VIDEOS, AUDIOS, WORKFLOWS) */}
            {galleryOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className={`w-full max-w-4xl border rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden ${darkMode ? 'bg-[#0d0d12] border-[#22222a]' : 'bg-white border-gray-200'}`}>
                        {/* Header */}
                        <div className={`p-4 border-b flex items-center justify-between ${darkMode ? 'border-[#1f1f28]' : 'border-gray-200'}`}>
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                                    <FolderOpen className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className={`font-bold text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}>Saved Library</h3>
                                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Results you saved to the library, plus your saved workflows (workflow inputs stay attached but are hidden here)</p>
                                </div>
                            </div>
                            <button onClick={() => setGalleryOpen(false)} className={darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-700'}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Section Tabs */}
                        <div className={`flex border-b px-4 ${darkMode ? 'border-[#1f1f28] bg-[#111116]' : 'border-gray-200 bg-gray-50'}`}>
                            {[
                                { id: 'images', label: 'Images', icon: ImageIcon, count: assets.filter(a => a.type === 'image' || (!a.type && !a.filename?.match(/\.(mp4|webm|mov|mp3|wav|ogg)$/i))).length },
                                { id: 'videos', label: 'Videos', icon: Film, count: assets.filter(a => a.type === 'video' || a.filename?.match(/\.(mp4|webm|mov)$/i)).length },
                                { id: 'audios', label: 'Audio', icon: Headphones, count: assets.filter(a => a.type === 'audio' || a.filename?.match(/\.(mp3|wav|ogg|aac)$/i)).length },
                                { id: 'workflows', label: 'Saved Workflows', icon: Layers, count: savedWorkflows.length },
                            ].map(tab => {
                                const Icon = tab.icon;
                                const isActive = galleryTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setGalleryTab(tab.id)}
                                        className={`py-3 px-4 text-xs font-bold transition flex items-center space-x-2 border-b-2 ${
                                            isActive
                                                ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                                                : darkMode ? 'border-transparent text-gray-400 hover:text-gray-200' : 'border-transparent text-gray-500 hover:text-gray-900'
                                        }`}
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                        <span>{tab.label}</span>
                                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-blue-500/20 text-blue-300' : darkMode ? 'bg-white/5 text-gray-500' : 'bg-gray-200 text-gray-600'}`}>{tab.count}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 p-6 overflow-y-auto">
                            {/* IMAGES TAB */}
                            {galleryTab === 'images' && (
                                <div className="grid grid-cols-4 gap-4">
                                    {assets.filter(a => a.type === 'image' || (!a.type && !a.filename?.match(/\.(mp4|webm|mov|mp3|wav|ogg)$/i))).length === 0 ? (
                                        <div className="col-span-4 py-16 text-center text-xs text-gray-500">No saved images yet.</div>
                                    ) : (
                                        assets.filter(a => a.type === 'image' || (!a.type && !a.filename?.match(/\.(mp4|webm|mov|mp3|wav|ogg)$/i))).map(a => (
                                            <div key={a.id} className={`rounded-xl border overflow-hidden flex flex-col group relative ${darkMode ? 'bg-[#14141a] border-[#22222a]' : 'bg-gray-50 border-gray-200'}`}>
                                                <div className="h-36 overflow-hidden bg-black/40 flex items-center justify-center relative">
                                                    <img src={`${API_BASE}/api/asset/${a.url}`} alt={a.filename} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                                                        <button onClick={() => setPreviewImageUrl(a.url)} className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white"><Eye className="w-4 h-4" /></button>
                                                        <button onClick={() => handleDownloadImage(a.url, a.filename)} className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"><Download className="w-4 h-4" /></button>
                                                    </div>
                                                </div>
                                                <div className="p-2.5 flex items-center justify-between">
                                                    <span className="text-[11px] truncate font-medium max-w-[100px]">{a.filename}</span>
                                                    <div className="flex items-center space-x-1.5">
                                                        <button onClick={() => { setSelectedAsset(a); setSimpleOriginalUrl(a.url); setGalleryOpen(false); addToast(`Loaded "${a.filename}" into studio`, 'success'); }} className="text-[10px] text-blue-400 font-semibold hover:underline">Use</button>
                                                        <button onClick={(e) => handleDeleteAsset(a.filename, e)} className="text-gray-400 hover:text-rose-400 p-0.5" title="Delete asset"><Trash2 className="w-3.5 h-3.5" /></button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* VIDEOS TAB */}
                            {galleryTab === 'videos' && (
                                <div className="grid grid-cols-3 gap-4">
                                    {assets.filter(a => a.type === 'video' || a.filename?.match(/\.(mp4|webm|mov)$/i)).length === 0 ? (
                                        <div className="col-span-3 py-16 text-center text-xs text-gray-500">No saved videos yet.</div>
                                    ) : (
                                        assets.filter(a => a.type === 'video' || a.filename?.match(/\.(mp4|webm|mov)$/i)).map(a => (
                                            <div key={a.id} className={`rounded-xl border overflow-hidden flex flex-col ${darkMode ? 'bg-[#14141a] border-[#22222a]' : 'bg-gray-50 border-gray-200'}`}>
                                                <video src={`${API_BASE}/api/asset/${a.url}`} controls className="w-full h-36 object-contain bg-black" />
                                                <div className="p-2.5 flex items-center justify-between">
                                                    <span className="text-[11px] truncate font-medium max-w-[120px]">{a.filename}</span>
                                                    <div className="flex items-center space-x-2">
                                                        <button onClick={() => handleDownloadImage(a.url, a.filename)} className="text-[10px] text-pink-400 font-semibold hover:underline flex items-center space-x-1"><Download className="w-3 h-3" /><span>Save</span></button>
                                                        <button onClick={(e) => handleDeleteAsset(a.filename, e)} className="text-gray-400 hover:text-rose-400 p-0.5" title="Delete video"><Trash2 className="w-3.5 h-3.5" /></button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* AUDIOS TAB */}
                            {galleryTab === 'audios' && (
                                <div className="space-y-3">
                                    {assets.filter(a => a.type === 'audio' || a.filename?.match(/\.(mp3|wav|ogg|aac)$/i)).length === 0 ? (
                                        <div className="py-16 text-center text-xs text-gray-500">No saved audio files yet.</div>
                                    ) : (
                                        assets.filter(a => a.type === 'audio' || a.filename?.match(/\.(mp3|wav|ogg|aac)$/i)).map(a => (
                                            <div key={a.id} className={`p-3 rounded-xl border flex items-center justify-between ${darkMode ? 'bg-[#14141a] border-[#22222a]' : 'bg-gray-50 border-gray-200'}`}>
                                                <div className="flex items-center space-x-3 flex-1 min-w-0 mr-4">
                                                    <Headphones className="w-4 h-4 text-teal-400 shrink-0" />
                                                    <span className="text-xs truncate font-medium">{a.filename}</span>
                                                    <audio src={`${API_BASE}/api/asset/${a.url}`} controls className="h-8 max-w-xs ml-auto" />
                                                </div>
                                                <div className="flex items-center space-x-1.5">
                                                    <button onClick={() => handleDownloadImage(a.url, a.filename)} className="p-1.5 rounded-lg border text-xs text-teal-400 hover:bg-teal-500/10 border-teal-500/20"><Download className="w-3.5 h-3.5" /></button>
                                                    <button onClick={(e) => handleDeleteAsset(a.filename, e)} className="p-1.5 rounded-lg border text-xs text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 border-[#2a2a2a]"><Trash2 className="w-3.5 h-3.5" /></button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* WORKFLOWS TAB */}
                            {galleryTab === 'workflows' && (
                                <div className="grid grid-cols-2 gap-4">
                                    {savedWorkflows.length === 0 ? (
                                        <div className="col-span-2 py-16 text-center text-xs text-gray-500">No saved workflows yet. Click "Save Workflow" in the top bar to save one.</div>
                                    ) : (
                                        savedWorkflows.map(wf => (
                                            <div key={wf.id} className={`p-4 border rounded-xl flex flex-col justify-between group transition ${darkMode ? 'bg-[#14141a] hover:bg-[#1a1a24] border-[#22222a]' : 'bg-gray-50 hover:bg-gray-100 border-gray-200'}`}>
                                                <div>
                                                    <div className="flex items-start justify-between">
                                                        <h4 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{wf.name}</h4>
                                                        <button onClick={(e) => handleDeleteSavedWorkflow(wf.id, e)} className="text-gray-400 hover:text-rose-400 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                                                    </div>
                                                    <p className={`text-xs mt-1 leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{wf.description || 'Custom user pipeline'}</p>
                                                </div>
                                                <div className="mt-4 pt-3 border-t flex items-center justify-between border-white/5">
                                                    <span className="text-[11px] text-gray-500 font-mono">{wf.nodes?.length || 0} Nodes</span>
                                                    <button
                                                        onClick={() => {
                                                            resetRunResults();
                                                            setSelectedNodeId(null);
                                                            setLogsOpen(false);
                                                            updateState(wf.nodes || [], wf.edges || []);
                                                            setMode('workflow');
                                                            setGalleryOpen(false);
                                                            fitNodesView(wf.nodes || []);
                                                            addToast(`Loaded workflow "${wf.name}"`, 'success');
                                                        }}
                                                        className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md shadow-blue-500/20"
                                                    >
                                                        Load Workflow
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {templatesOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className={`w-full max-w-2xl border rounded-2xl shadow-2xl p-6 flex flex-col space-y-4 max-h-[80vh] ${darkMode ? 'bg-[#0c0f17] border-white/10' : 'bg-white border-gray-200'}`}>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2"><Grid3X3 className="w-5 h-5 text-indigo-400" /><h3 className={`font-bold text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}>Workflow Templates</h3></div>
                            <button onClick={() => setTemplatesOpen(false)} className={darkMode ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-700'}><X className="w-4 h-4" /></button>
                        </div>
                        {templates.length === 0 ? (
                            <div className={`py-10 text-center text-xs ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>No templates available from the backend yet.</div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3 overflow-y-auto pr-1">
                                {templates.map(tpl => (
                                    <div key={tpl.id} onClick={() => handleLoadTemplate(tpl)} className={`p-4 border rounded-xl cursor-pointer transition flex flex-col justify-between group ${darkMode ? 'bg-black/40 hover:bg-white/5 border-white/5' : 'bg-gray-50 hover:bg-gray-100 border-gray-200'}`}>
                                        <div><h4 className={`font-semibold text-sm transition ${darkMode ? 'text-slate-200 group-hover:text-indigo-400' : 'text-gray-700 group-hover:text-indigo-600'}`}>{tpl.name}</h4><p className={`text-xs mt-1 leading-relaxed ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{tpl.description}</p></div>
                                        <div className={`mt-4 flex items-center justify-between text-[11px] ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}><span>{tpl.workflow.nodes.length} Nodes</span><span className="text-indigo-400 font-semibold group-hover:underline">Load Workflow</span></div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {webcamModalOpen && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
                    <div className={`w-full max-w-lg rounded-2xl border shadow-2xl p-6 flex flex-col items-center ${darkMode ? 'bg-[#0c0f17] border-white/10' : 'bg-white border-gray-200'}`}>
                        <h3 className={`font-bold text-lg mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Take a Photo</h3>
                        <div className={`w-full aspect-video rounded-xl overflow-hidden bg-black mb-4 relative`}>
                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        </div>
                        <div className="flex space-x-3 w-full">
                            <button onClick={closeWebcam} className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition ${darkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>Cancel</button>
                            <button onClick={captureWebcam} className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition flex items-center justify-center space-x-2">
                                <Camera className="w-4 h-4" /><span>Capture</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {previewImageUrl && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setPreviewImageUrl(null)}>
                    <button className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors" onClick={() => setPreviewImageUrl(null)}><X className="w-8 h-8" /></button>
                    <div className="max-w-5xl w-full max-h-[90vh] flex items-center justify-center relative" onClick={(e) => e.stopPropagation()}>
                        {/\.(mp4|webm|mov)$/i.test(previewImageUrl)
                            ? <video src={`${API_BASE}/api/asset/${previewImageUrl}`} controls autoPlay className="max-w-full max-h-[85vh] rounded-xl shadow-2xl bg-black" />
                            : <img src={`${API_BASE}/api/asset/${previewImageUrl}`} alt="Preview" className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" />}
                    </div>
                </div>
            )}

            <div className="fixed bottom-12 right-6 z-50 flex flex-col space-y-2 pointer-events-none">
                {toasts.map(t => (
                    <div key={t.id} className={`pointer-events-auto px-4 py-2.5 rounded-xl text-xs font-semibold shadow-2xl border flex items-center space-x-2 backdrop-blur-md transition-all ${t.type === 'success' ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40' : t.type === 'error' ? 'bg-rose-950/90 text-rose-300 border-rose-500/40' : t.type === 'warning' ? 'bg-amber-950/90 text-amber-300 border-amber-500/40' : darkMode ? 'bg-black/60 text-slate-200 border-white/10' : 'bg-white/90 text-gray-700 border-gray-200'}`}>
                        {t.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : t.type === 'error' ? <XCircle className="w-3.5 h-3.5" /> : t.type === 'warning' ? <AlertTriangle className="w-3.5 h-3.5" /> : <Info className="w-3.5 h-3.5" />}
                        <span>{t.msg}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}