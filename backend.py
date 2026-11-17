import os
import io
import uuid
import re
import time
import base64
import json
import logging
import asyncio
import mimetypes
import shutil
import subprocess
import httpx
from pathlib import Path
from typing import Dict, List, Any, Optional

import uvicorn
from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.responses import FileResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image, ImageEnhance, ImageFilter, ImageOps
import cv2
import numpy as np

# ─── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ai-image-edit")

# ─── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "runtime" / "uploads"
OUTPUT_DIR = BASE_DIR / "runtime" / "outputs"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# ─── Load .env ────────────────────────────────────────────────────────────────
from dotenv import load_dotenv
load_dotenv(BASE_DIR / ".env")

# ─── AI Provider Config ───────────────────────────────────────────────────────
AI_PROVIDER = os.getenv("AI_PROVIDER", "groq").lower()
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct")
GROQ_VISION_MODEL = os.getenv("GROQ_VISION_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1")

# Dedicated AI Image Edit Providers (OpenRouter)
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_IMAGE_MODEL = os.getenv("OPENROUTER_IMAGE_MODEL", "black-forest-labs/flux-3-image-klein")
OPENROUTER_IMAGE_EDIT_MODEL = os.getenv("OPENROUTER_IMAGE_EDIT_MODEL", "black-forest-labs/flux-3-image-klein")
OPENROUTER_VIDEO_MODEL = os.getenv("OPENROUTER_VIDEO_MODEL", "alibaba/wan-3.0")
OPENROUTER_IMAGE_MODELS = {
    "black-forest-labs/flux-3-image-klein",
    "meta/muse-image",
    "bytedance-seed/seedream-5.0-flash",
    "bytedance-seed/seedream-5.5",
    "krea/k3-edit",
}
OPENROUTER_VIDEO_MODELS = {"heygen/heygen-video-1", "alibaba/wan-3.0"}
OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")

# Outbound clients use trust_env=False: a NO_PROXY value containing "[::1]" makes
# httpx raise "Invalid port: ':1]'" when it parses the environment proxy config.

IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif"}
VIDEO_EXTS = {".mp4", ".webm", ".mov"}
AUDIO_EXTS = {".mp3", ".wav", ".ogg", ".aac", ".m4a"}

# ─── Saved Library Index ──────────────────────────────────────────────────────
# Generated files always land in OUTPUT_DIR so nodes can preview them, but they
# are only listed in the Saved Library once the user explicitly saves them.
LIBRARY_FILE = BASE_DIR / "runtime" / "library.json"
LIBRARY_EXTS = IMAGE_EXTS | VIDEO_EXTS | AUDIO_EXTS


def _read_library() -> set:
    try:
        if LIBRARY_FILE.exists():
            data = json.loads(LIBRARY_FILE.read_text(encoding="utf-8"))
            if isinstance(data, dict):
                data = data.get("files", [])
            if isinstance(data, list):
                return {str(name) for name in data if name}
    except Exception as e:
        logger.error(f"Failed to read library index: {e}")
    return set()


def _write_library(names: set) -> None:
    try:
        LIBRARY_FILE.parent.mkdir(parents=True, exist_ok=True)
        LIBRARY_FILE.write_text(json.dumps(sorted(names), indent=2), encoding="utf-8")
    except Exception as e:
        logger.error(f"Failed to write library index: {e}")


def _ensure_library_index() -> None:
    """Create an empty saved-library index on first run. Existing output files
    stay on disk for workflows/previews but are not treated as saved."""
    if LIBRARY_FILE.exists():
        return
    _write_library(set())
VIDEO_GEN_TYPES = {"text_to_video", "image_to_video", "multi_image_to_video", "video_from_script"}
VIDEO_NODE_TYPES = VIDEO_GEN_TYPES | {
    "video_input", "video_url", "video_audio_ref", "video_output", "video_preview",
}
TEXT_NODE_TYPES = {"prompt_enhancer", "style_preset", "text_output"}
STYLE_PRESETS = {
    "Cinematic": "cinematic 35mm film look, dramatic lighting, shallow depth of field",
    "Anime": "anime illustration in the style of Studio Ghibli, hand-painted backgrounds",
    "Cyberpunk": "cyberpunk neon city aesthetic, magenta and cyan rim lighting",
    "Fantasy": "epic fantasy digital art, painterly detail, magical atmosphere",
    "Minimalist": "minimalist flat vector illustration, clean shapes, limited palette",
    "OilPainting": "classic oil painting, visible brush strokes, rich impasto texture",
}
AUDIO_GEN_TYPES = {"text_to_speech", "voiceover", "sound_effects", "bg_music"}
AUDIO_PASSTHROUGH_TYPES = {
    "audio_trim", "audio_volume", "audio_fade", "audio_pitch", "audio_denoise",
    "remove_audio", "audio_mixer", "audio_output",
}
# OpenRouter audio models (HeyGen voice TTS + ByteDance Seed Audio).
OPENROUTER_AUDIO_MODELS = {
    "heygen/heygen-voice-1-turbo:free": "HeyGen voice 1 turbo (free)",
    "bytedance-seed/seed-audio-1-0": "ByteDance Seed Audio 1.0",
}
# HeyGen TTS only accepts these provider voice ids (display names are UI labels only).
HEYGEN_VOICE_IDS = {
    "Natural English Male": "bram",
    "Natural English Female": "nadine",
    "Cinematic Narrator": "gareth",
}

# Mirrors OpenRouter's /api/v1/videos/models capability metadata.
VIDEO_MODEL_CAPS = {
    "alibaba/wan-3.0": {
        "durations": list(range(2, 31)), "resolutions": ["480p", "720p", "1080p"],
        "aspect_ratios": ["16:9", "4:3", "1:1", "3:4", "9:16", "21:9"],
        "default_resolution": "720p", "generate_audio": True,
    },
    "alibaba/wan-3.0-prime": {
        "durations": list(range(2, 31)), "resolutions": ["480p", "720p", "1080p"],
        "aspect_ratios": ["16:9", "4:3", "1:1", "3:4", "9:16", "21:9"],
        "default_resolution": "720p", "generate_audio": True,
    },
    "heygen/heygen-video-1": {
        "durations": list(range(5, 31)), "resolutions": ["480p", "768p", "1080p", "2K"],
        "aspect_ratios": ["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"],
        "default_resolution": "768p", "generate_audio": False,
    },
    "bytedance/seedance-2.5": {
        "durations": [4] + list(range(5, 31)), "resolutions": ["480p", "720p", "1080p"],
        "aspect_ratios": ["16:9", "4:3", "1:1", "3:4", "9:16", "21:9"],
        "default_resolution": "720p", "generate_audio": True,
    },
    "google/veo-3.1": {
        "durations": [4, 6, 8], "resolutions": ["720p", "1080p", "4K"],
        "aspect_ratios": ["16:9", "9:16"], "default_resolution": "720p", "generate_audio": True,
    },
}
DEFAULT_VIDEO_CAPS = {
    "durations": [5, 10, 15, 20, 30], "resolutions": ["480p", "720p", "1080p"],
    "aspect_ratios": ["16:9", "9:16", "1:1"], "default_resolution": "720p", "generate_audio": False,
}

def video_model_caps(model_id: str) -> dict:
    return VIDEO_MODEL_CAPS.get(str(model_id or ""), DEFAULT_VIDEO_CAPS)

mimetypes.add_type("video/mp4", ".mp4")
mimetypes.add_type("video/webm", ".webm")
mimetypes.add_type("video/quicktime", ".mov")
mimetypes.add_type("audio/mpeg", ".mp3")

# ─── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(title="AI Image Edit Studio Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Schemas ──────────────────────────────────────────────────────────────────
class WorkflowNodeData(BaseModel):
    label: str = ""
    parameters: Dict[str, Any] = {}

class WorkflowNode(BaseModel):
    id: str
    type: str
    position: Dict[str, Any] = {}
    data: WorkflowNodeData = WorkflowNodeData()

class WorkflowEdge(BaseModel):
    source: str
    target: str

class WorkflowPayload(BaseModel):
    nodes: List[WorkflowNode]
    edges: List[WorkflowEdge]
    image_id: Optional[str] = ""

class EditRequest(BaseModel):
    image_id: str
    prompt: Optional[str] = ""
    plan: Optional[List[Dict[str, Any]]] = None

class UnderstandRequest(BaseModel):
    prompt: str

class GenerateWorkflowRequest(BaseModel):
    prompt: str
    model: str = "gemini-3.8-flash"
    asset_id: Optional[str] = None

class AIEditNodeRequest(BaseModel):
    image_id: str = ""
    image_ids: Optional[List[str]] = None
    prompt: str = ""
    node_type: str = "ai_image_edit"
    mask_data: Optional[str] = None
    reference_image_id: Optional[str] = None
    strength: Optional[float] = 0.85
    model: Optional[str] = None
    aspect_ratio: Optional[str] = None
    duration: Optional[int] = None
    resolution: Optional[str] = None
    script: Optional[str] = None
    quality: Optional[str] = None
    voice: Optional[str] = None
    voice_model: Optional[str] = None
    speed: Optional[float] = None

class AIMultiEditRequest(BaseModel):
    image_ids: List[str]
    prompt: str
    node_type: str = "ai_multi_image_edit"
    model: Optional[str] = None

# ─── Helpers ──────────────────────────────────────────────────────────────────
def pil_to_cv(pil_img: Image.Image) -> np.ndarray:
    rgb = np.array(pil_img.convert("RGB"))
    return cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)

def cv_to_pil(cv_img: np.ndarray) -> Image.Image:
    rgb = cv2.cvtColor(cv_img, cv2.COLOR_BGR2RGB)
    return Image.fromarray(rgb)

def find_image(image_id: str) -> Optional[Path]:
    if not image_id:
        return None
    for d in [UPLOAD_DIR, OUTPUT_DIR]:
        candidate = d / image_id
        if candidate.exists():
            return candidate
    return None

def is_raster_file(path: Optional[Path]) -> bool:
    return bool(path and path.suffix.lower() in IMAGE_EXTS)

def open_raster(image_id: str) -> Optional[Image.Image]:
    src = find_image(image_id)
    if not is_raster_file(src):
        return None
    return Image.open(src).convert("RGB")

def image_from_output(item: Any) -> Optional[Image.Image]:
    if isinstance(item, Image.Image):
        return item
    if isinstance(item, dict) and item.get("kind") == "image" and isinstance(item.get("image"), Image.Image):
        return item["image"]
    return None

def save_output(img: Image.Image, prefix: str = "out") -> str:
    filename = f"{prefix}_{uuid.uuid4().hex[:10]}.png"
    path = OUTPUT_DIR / filename
    if img.mode in ("RGBA", "P", "L"):
        img = img.convert("RGB")
    img.save(path, "PNG")
    return filename

def image_to_base64(img: Image.Image) -> str:
    buf = io.BytesIO()
    img_rgb = img.convert("RGB")
    img_rgb.save(buf, format="JPEG", quality=90)
    return base64.b64encode(buf.getvalue()).decode("utf-8")

# ─── AI Provider Calls ────────────────────────────────────────────────────────
async def call_ai_vision(combined_prompt: str, image_b64: str, second_image_b64: Optional[str] = None) -> str:
    content = [
        {"type": "text", "text": combined_prompt},
        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"}},
    ]
    if second_image_b64:
        content.append({"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{second_image_b64}"}})

    messages = [{"role": "user", "content": content}]

    if AI_PROVIDER == "groq" and GROQ_API_KEY:
        async with httpx.AsyncClient(timeout=60.0, trust_env=False) as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
                json={"model": GROQ_VISION_MODEL, "messages": messages,
                      "max_tokens": 1024, "temperature": 0.3}
            )
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"]
    elif OPENAI_API_KEY:
        async with httpx.AsyncClient(timeout=60.0, trust_env=False) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"},
                json={"model": OPENAI_MODEL, "messages": messages, "max_tokens": 1024, "temperature": 0.3}
            )
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"]
    return ""

async def call_ai_text(system_prompt: str, user_prompt: str) -> str:
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]
    if AI_PROVIDER == "groq" and GROQ_API_KEY:
        async with httpx.AsyncClient(timeout=60.0, trust_env=False) as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
                json={"model": GROQ_MODEL, "messages": messages, "max_tokens": 2048, "temperature": 0.2}
            )
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"]
    elif OPENAI_API_KEY:
        async with httpx.AsyncClient(timeout=60.0, trust_env=False) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"},
                json={"model": OPENAI_MODEL, "messages": messages, "max_tokens": 2048, "temperature": 0.2}
            )
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"]
    return ""

# ─── OpenRouter Direct Image Edit Integration ────────────────────────────────
def optimize_image_for_ai(img: Image.Image, max_dim: int = 1024) -> str:
    """
    Downscale and optimize image (vector/size reduction) to drastically minimize token usage,
    network payload, and latency when sending to OpenRouter image models.
    """
    w, h = img.size
    if max(w, h) > max_dim:
        scale = max_dim / float(max(w, h))
        new_w = max(16, int(w * scale))
        new_h = max(16, int(h * scale))
        proc = img.resize((new_w, new_h), Image.LANCZOS)
    else:
        proc = img.copy()

    if proc.mode in ("RGBA", "P"):
        proc = proc.convert("RGB")

    buf = io.BytesIO()
    proc.save(buf, format="JPEG", quality=85, optimize=True)
    b64_str = base64.b64encode(buf.getvalue()).decode("utf-8")
    return f"data:image/jpeg;base64,{b64_str}"

async def call_openrouter_image_edit(
    img: Image.Image,
    prompt: str,
    second_img: Optional[Image.Image] = None,
    model: Optional[str] = None,
    extra_images: Optional[List[Image.Image]] = None,
) -> Optional[Image.Image]:
    """Call OpenRouter Image API (POST /api/v1/images) using input_references for image edit."""
    if not OPENROUTER_API_KEY:
        logger.warning("OPENROUTER_API_KEY is not configured.")
        return None

    target_model = model or OPENROUTER_IMAGE_EDIT_MODEL
    if target_model not in OPENROUTER_IMAGE_MODELS:
        target_model = "black-forest-labs/flux-3-image-klein"
    logger.info(f"Calling OpenRouter image edit with model '{target_model}' and prompt: '{prompt}'")

    input_refs = [
        {"type": "image_url", "image_url": {"url": optimize_image_for_ai(img, max_dim=1024)}}
    ]
    if second_img:
        input_refs.append(
            {"type": "image_url", "image_url": {"url": optimize_image_for_ai(second_img, max_dim=1024)}}
        )
    for extra in extra_images or []:
        input_refs.append(
            {"type": "image_url", "image_url": {"url": optimize_image_for_ai(extra, max_dim=1024)}}
        )
    input_refs = input_refs[:8]

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://netrootai.tech",
        "X-Title": "NetRoot AI Chat Studio"
    }

    # OpenRouter Unified Image Generation & Edit API
    payload = {
        "model": target_model,
        "prompt": prompt,
        "input_references": input_refs,
    }

    try:
        async with httpx.AsyncClient(timeout=90.0, trust_env=False) as client:
            resp = await client.post(
                f"{OPENROUTER_BASE_URL}/images",
                headers=headers,
                json=payload
            )
            if resp.status_code == 200:
                data = resp.json()
                items = data.get("data") or data.get("images") or []
                if items and isinstance(items, list):
                    first = items[0]
                    if isinstance(first, dict):
                        b64 = first.get("b64_json") or first.get("image")
                        if b64:
                            if b64.startswith("data:"):
                                b64 = b64.split(",", 1)[1]
                            return Image.open(io.BytesIO(base64.b64decode(b64))).convert("RGB")
                        url = first.get("url")
                        if url:
                            img_resp = await client.get(url)
                            if img_resp.status_code == 200:
                                return Image.open(io.BytesIO(img_resp.content)).convert("RGB")
                    elif isinstance(first, str):
                        if first.startswith("http"):
                            img_resp = await client.get(first)
                            if img_resp.status_code == 200:
                                return Image.open(io.BytesIO(img_resp.content)).convert("RGB")
                        else:
                            clean_b64 = first.split(",", 1)[1] if first.startswith("data:") else first
                            return Image.open(io.BytesIO(base64.b64decode(clean_b64))).convert("RGB")
            else:
                logger.warning(f"OpenRouter image API returned {resp.status_code}: {resp.text[:300]}")
    except Exception as e:
        logger.error(f"OpenRouter image API call failed: {e}")

    return None

# ─── AI Image Editing Operations ──────────────────────────────────────────────
async def execute_ai_image_edit(img: Image.Image, prompt: str, params: dict) -> Image.Image:
    logger.info(f"AI Image Edit: '{prompt}'")
    model_choice = params.get("model") or OPENROUTER_IMAGE_EDIT_MODEL

    # 1. Try OpenRouter direct image editing
    if OPENROUTER_API_KEY:
        res = await call_openrouter_image_edit(img, prompt, model=model_choice)
        if res is not None:
            logger.info("Successfully edited image via OpenRouter")
            return res

    # 2. Multimodal vision planning fallback (Groq / OpenAI)
    img_b64 = image_to_base64(img)
    system = (
        "You are an expert image editing AI. The user will describe an edit they want to make to an image. "
        "Analyze the image visually and return a JSON array of image processing operations to apply. "
        "Each operation must use ONLY these supported operations: "
        "resize, crop, rotate, flip, brightness, contrast, saturation, grayscale, blur, sharpen, "
        "edge_detection, sepia, vignette, invert, threshold, color_balance, emboss, posterize, solarize, auto_contrast. "
        "Return ONLY valid JSON like: [{\"operation\": \"brightness\", \"parameters\": {\"factor\": 1.3}}, ...]. "
        "No markdown, no explanation. Just the JSON array."
    )
    combined = system + f"\n\nInstruction: {prompt}\nAnalyze the image and return the best operations."

    try:
        raw = await call_ai_vision(combined, img_b64)
        match = re.search(r'\[[\s\S]*\]', raw)
        if match:
            plan = json.loads(match.group())
            result = img.copy()
            for step in plan:
                op = step.get("operation")
                p = step.get("parameters", {})
                if op in OPERATIONS_MAP:
                    result = OPERATIONS_MAP[op](result, p)
            logger.info(f"AI edit applied {len(plan)} operations via vision model")
            return result
    except Exception as e:
        logger.error(f"AI vision call failed: {e}")

    # 4. Fallback rule-based
    fallback_plan = build_plan_from_prompt(prompt).get("plan", [])
    result = img.copy()
    for step in fallback_plan:
        op = step.get("operation")
        p = step.get("parameters", {})
        if op in OPERATIONS_MAP:
            result = OPERATIONS_MAP[op](result, p)
    return result

async def execute_ai_multi_image_edit(img1: Image.Image, img2: Image.Image, prompt: str, params: dict,
                                      extra_images: Optional[List[Image.Image]] = None) -> Image.Image:
    logger.info(f"AI Multi-Image Edit: '{prompt}'")
    model_choice = params.get("model") or OPENROUTER_IMAGE_EDIT_MODEL

    if OPENROUTER_API_KEY:
        res = await call_openrouter_image_edit(img1, prompt, second_img=img2, model=model_choice,
                                               extra_images=extra_images)
        if res is not None:
            logger.info("Successfully combined images via OpenRouter")
            return res

    img1_b64 = image_to_base64(img1)
    img2_b64 = image_to_base64(img2)

    system = (
        "You are an image compositing AI. Given two images and an instruction, decide how to blend them. "
        "Return ONLY a JSON object with 'blend_mode' (one of: blend, overlay, screen, multiply, add, difference) "
        "and 'alpha' (0.0–1.0 for img2 weight). Example: {\"blend_mode\": \"blend\", \"alpha\": 0.5}"
    )
    combined = system + f"\n\nInstruction: {prompt}\nReturn the blend JSON."

    blend_mode = "blend"
    alpha = 0.5

    try:
        raw = await call_ai_vision(combined, img1_b64, img2_b64)
        match = re.search(r'\{[\s\S]*\}', raw)
        if match:
            parsed = json.loads(match.group())
            blend_mode = parsed.get("blend_mode", "blend")
            alpha = float(parsed.get("alpha", 0.5))
    except Exception as e:
        logger.error(f"AI multi-image call failed: {e}")

    if img2.size != img1.size:
        img2 = img2.resize(img1.size, Image.LANCZOS)

    arr1 = np.array(img1.convert("RGB"), dtype=np.float32)
    arr2 = np.array(img2.convert("RGB"), dtype=np.float32)

    if blend_mode == "overlay":
        mask = arr1 < 128
        result = np.where(mask, 2 * arr1 * arr2 / 255, 255 - 2 * (255 - arr1) * (255 - arr2) / 255)
        result = np.clip(result * (1 - alpha) + arr1 * alpha, 0, 255).astype(np.uint8)
    elif blend_mode == "screen":
        result = np.clip(255 - (255 - arr1) * (255 - arr2) / 255, 0, 255).astype(np.uint8)
    elif blend_mode == "multiply":
        result = np.clip(arr1 * arr2 / 255, 0, 255).astype(np.uint8)
    elif blend_mode == "add":
        result = np.clip(arr1 + arr2 * alpha, 0, 255).astype(np.uint8)
    elif blend_mode == "difference":
        result = np.clip(np.abs(arr1 - arr2), 0, 255).astype(np.uint8)
    else:
        result = np.clip(arr1 * (1 - alpha) + arr2 * alpha, 0, 255).astype(np.uint8)

    return Image.fromarray(result)

async def execute_ai_object_replacement(img: Image.Image, prompt: str, params: dict) -> Image.Image:
    logger.info(f"AI Object Replacement: '{prompt}'")
    target = params.get("target_object", "")
    replacement = params.get("replacement_object", "")
    if target and replacement:
        enhanced_prompt = f"Replace the {target} with {replacement} in this image. Keep everything else exactly identical."
    else:
        enhanced_prompt = prompt if "replace" in prompt.lower() else f"Replace object: {prompt}. Keep everything else identical."
    return await execute_ai_image_edit(img, enhanced_prompt, params)

async def execute_ai_background_edit(img: Image.Image, prompt: str, params: dict) -> Image.Image:
    logger.info(f"AI Background Edit: '{prompt}'")
    enhanced_prompt = f"Change only the background to: {prompt}. Keep the main subject and foreground untouched and perfectly integrated."
    return await execute_ai_image_edit(img, enhanced_prompt, params)

async def execute_ai_text_to_image(prompt: str, params: dict) -> Image.Image:
    """Generate image from text prompt via OpenRouter or create placeholder."""
    logger.info(f"AI Text to Image: '{prompt}'")
    model_choice = params.get("model") or "black-forest-labs/flux-3-image-klein"
    
    if OPENROUTER_API_KEY:
        try:
            headers = {
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://netrootai.tech",
                "X-Title": "NetRoot AI Chat Studio"
            }
            payload = {
                "model": model_choice,
                "prompt": prompt,
            }
            async with httpx.AsyncClient(timeout=90.0, trust_env=False) as client:
                resp = await client.post(f"{OPENROUTER_BASE_URL}/images", headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    items = data.get("data") or data.get("images") or []
                    if items and isinstance(items, list):
                        first = items[0]
                        if isinstance(first, dict):
                            b64 = first.get("b64_json") or first.get("image")
                            if b64:
                                if b64.startswith("data:"):
                                    b64 = b64.split(",", 1)[1]
                                return Image.open(io.BytesIO(base64.b64decode(b64))).convert("RGB")
                            url = first.get("url")
                            if url:
                                img_resp = await client.get(url)
                                if img_resp.status_code == 200:
                                    return Image.open(io.BytesIO(img_resp.content)).convert("RGB")
                        elif isinstance(first, str):
                            if first.startswith("http"):
                                img_resp = await client.get(first)
                                if img_resp.status_code == 200:
                                    return Image.open(io.BytesIO(img_resp.content)).convert("RGB")
                            else:
                                clean_b64 = first.split(",", 1)[1] if first.startswith("data:") else first
                                return Image.open(io.BytesIO(base64.b64decode(clean_b64))).convert("RGB")
                else:
                    logger.warning(f"OpenRouter text-to-image API returned {resp.status_code}: {resp.text[:300]}")
        except Exception as e:
            logger.error(f"OpenRouter text-to-image API call failed: {e}")

    # Fallback placeholder generator
    width = int(params.get("width") or 1024)
    height = int(params.get("height") or 1024)
    canvas = Image.new("RGB", (width, height), color=(18, 20, 29))
    draw = ImageDraw.Draw(canvas)
    # Draw simple gradient/abstract preview
    draw.rectangle([20, 20, width - 20, height - 20], outline=(59, 130, 246), width=3)
    text = f"Text to Image: {prompt[:40]}..." if len(prompt) > 40 else f"Text to Image: {prompt}"
    draw.text((40, 40), text, fill=(255, 255, 255))
    return canvas

def _frame_image_payload(img: Image.Image, frame_type: str = "first_frame") -> dict:
    return {
        "type": "image_url",
        "image_url": {"url": optimize_image_for_ai(img)},
        "frame_type": frame_type,
    }

def _reference_image_payload(img: Image.Image) -> dict:
    return {"type": "image_url", "image_url": {"url": optimize_image_for_ai(img)}}

def collect_reference_images(pred_outputs: List[Any], predecessor_nodes: Optional[List[WorkflowNode]] = None) -> List[Image.Image]:
    images: List[Image.Image] = []
    slot_nodes = [n for n in (predecessor_nodes or []) if n.type == "multiple_image_input"]
    if slot_nodes:
        for node in slot_nodes:
            params = node.data.parameters or {}
            for idx in range(1, 13):
                slot_id = params.get(f"slot{idx}") or (params.get("image_id") if idx == 1 else None)
                if not slot_id:
                    continue
                img = open_raster(str(slot_id))
                if img is not None:
                    images.append(img)
        return images[:8]
    for item in pred_outputs:
        if isinstance(item, dict) and item.get("kind") == "video" and item.get("path"):
            frame = first_video_frame(Path(item["path"]))
            if frame is not None:
                images.append(frame)
            continue
        img = image_from_output(item)
        if img is not None:
            images.append(img)
    return images[:8]

def first_video_frame(path: Path) -> Optional[Image.Image]:
    if not path.exists():
        return None
    capture = cv2.VideoCapture(str(path))
    try:
        ok, frame = capture.read()
    finally:
        capture.release()
    if not ok or frame is None:
        return None
    return cv_to_pil(frame)

async def generate_openrouter_video(
    prompt: str,
    params: dict,
    frame_images: Optional[List[dict]] = None,
    input_references: Optional[List[dict]] = None,
) -> str:
    if not OPENROUTER_API_KEY:
        raise RuntimeError("OPENROUTER_API_KEY is not configured, so video generation cannot run.")
    clean_prompt = (prompt or "").strip()
    if not clean_prompt and not frame_images:
        raise RuntimeError("Enter a video prompt or script before generating.")

    model_id = str(params.get("model") or OPENROUTER_VIDEO_MODEL)
    if model_id not in OPENROUTER_VIDEO_MODELS:
        model_id = "alibaba/wan-3.0"
    caps = video_model_caps(model_id)

    try:
        duration = int(params.get("duration") or 5)
    except (TypeError, ValueError):
        duration = 5
    if duration not in caps["durations"]:
        duration = min(caps["durations"], key=lambda value: abs(value - duration))
    aspect = str(params.get("aspect_ratio") or "16:9")
    if aspect not in caps["aspect_ratios"]:
        aspect = caps["aspect_ratios"][0]
    resolution = str(params.get("resolution") or caps["default_resolution"])
    if resolution not in caps["resolutions"]:
        resolution = caps["default_resolution"]

    body: Dict[str, Any] = {
        "model": model_id,
        "prompt": clean_prompt or "Animate the reference image with natural cinematic motion",
        "duration": duration,
        "aspect_ratio": aspect,
        "resolution": resolution,
    }
    if caps.get("generate_audio"):
        body["generate_audio"] = bool(params.get("generate_audio", False))
    if frame_images:
        body["frame_images"] = frame_images
    if input_references:
        body["input_references"] = input_references

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }
    logger.info("Submitting video job model=%s duration=%s aspect=%s", body["model"], duration, aspect)
    async with httpx.AsyncClient(timeout=httpx.Timeout(60.0, read=180.0), trust_env=False) as client:
        submit = await client.post(f"{OPENROUTER_BASE_URL}/videos", headers=headers, json=body)
        if submit.status_code not in (200, 202):
            raise RuntimeError(f"Video generation failed ({submit.status_code}): {submit.text[:400]}")
        job = submit.json()
        job_id = job.get("id")
        if not job_id:
            raise RuntimeError("Video provider did not return a job id.")

        status_data = job
        deadline = time.time() + 600
        while True:
            status = str(status_data.get("status") or "").lower()
            if status == "completed":
                break
            if status in ("failed", "cancelled", "expired"):
                raise RuntimeError(f"Video generation {status}: {status_data.get('error') or 'unknown error'}")
            if time.time() > deadline:
                raise RuntimeError("Video generation timed out after 10 minutes.")
            await asyncio.sleep(8)
            poll = await client.get(f"{OPENROUTER_BASE_URL}/videos/{job_id}", headers=headers)
            if poll.status_code != 200:
                raise RuntimeError(f"Video status check failed ({poll.status_code}): {poll.text[:300]}")
            status_data = poll.json()

        download = await client.get(
            f"{OPENROUTER_BASE_URL}/videos/{job_id}/content",
            headers={"Authorization": f"Bearer {OPENROUTER_API_KEY}"},
        )
        video_bytes = download.content if download.status_code == 200 else b""
        if not video_bytes:
            urls = status_data.get("urls") or []
            if urls:
                fallback = await client.get(urls[0])
                if fallback.status_code == 200:
                    video_bytes = fallback.content
        if not video_bytes:
            raise RuntimeError("Video completed but the file could not be downloaded.")

    filename = f"video_{uuid.uuid4().hex[:10]}.mp4"
    (OUTPUT_DIR / filename).write_bytes(video_bytes)
    logger.info("Saved generated video %s (%s bytes)", filename, len(video_bytes))
    return filename

async def _save_audio_bytes(audio_bytes: bytes, fmt: str = "mp3") -> str:
    if not audio_bytes:
        raise RuntimeError("Audio provider returned an empty file.")
    fmt = fmt if fmt in ("mp3", "wav", "ogg", "aac", "m4a") else "mp3"
    filename = f"speech_{uuid.uuid4().hex[:10]}.{fmt}"
    (OUTPUT_DIR / filename).write_bytes(audio_bytes)
    logger.info("Saved audio %s (%s bytes)", filename, len(audio_bytes))
    return filename

async def generate_openrouter_speech(prompt: str, model: str, voice: Optional[str] = None,
                                     speed: Optional[float] = None) -> str:
    """OpenAI-compatible speech endpoint used by voice models (e.g. HeyGen Voice)."""
    if not OPENROUTER_API_KEY:
        raise RuntimeError("OPENROUTER_API_KEY is not configured, so OpenRouter speech cannot run.")
    model_lower = str(model or "").lower()
    payload = {
        "model": model,
        "input": (prompt or "").strip()[:4096],
        "response_format": "mp3",
    }
    if voice:
        raw_voice = str(voice).strip()
        if model_lower.startswith("heygen/"):
            payload["voice"] = HEYGEN_VOICE_IDS.get(
                raw_voice, raw_voice if raw_voice.lower() in HEYGEN_VOICE_IDS.values() else "nadine"
            )
        elif " " not in raw_voice:
            payload["voice"] = raw_voice
    # HeyGen's speech endpoint only accepts model/input/voice/response_format.
    if speed and not model_lower.startswith("heygen/"):
        try:
            payload["speed"] = max(0.25, min(4.0, float(speed)))
        except (TypeError, ValueError):
            pass
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }
    logger.info("Submitting OpenRouter speech job model=%s", model)
    async with httpx.AsyncClient(timeout=httpx.Timeout(60.0, read=300.0), trust_env=False) as client:
        resp = await client.post(f"{OPENROUTER_BASE_URL}/audio/speech", headers=headers, json=payload)
        if resp.status_code != 200:
            raise RuntimeError(f"Speech generation failed ({resp.status_code}): {resp.text[:300]}")
        content_type = str(resp.headers.get("content-type") or "").lower()
        if "application/json" in content_type:
            data = resp.json()
            b64 = data.get("audio") or data.get("data") or ""
            if isinstance(b64, dict):
                b64 = b64.get("data") or ""
            if isinstance(b64, str) and b64:
                audio_bytes = base64.b64decode(b64.split(",", 1)[1] if b64.startswith("data:") else b64)
                return await _save_audio_bytes(audio_bytes, "mp3")
            url = data.get("url")
            if url:
                fetch = await client.get(url)
                if fetch.status_code == 200:
                    ext = str(url).rsplit(".", 1)[-1].split("?")[0].lower()
                    return await _save_audio_bytes(fetch.content, ext)
            raise RuntimeError("Speech provider returned no audio data.")
        return await _save_audio_bytes(resp.content, "mp3")

async def generate_openrouter_audio(prompt: str, model: str, voice: Optional[str] = None,
                                    speed: Optional[float] = None) -> str:
    if not OPENROUTER_API_KEY:
        raise RuntimeError("OPENROUTER_API_KEY is not configured, so OpenRouter audio generation cannot run.")
    clean_prompt = (prompt or "").strip()
    if not clean_prompt:
        raise RuntimeError("Enter a description for the audio clip.")

    speech_errors = []
    is_voice_model = "voice" in model.lower() or model.lower().endswith("tts")
    if is_voice_model:
        try:
            return await generate_openrouter_speech(clean_prompt, model, voice, speed)
        except Exception as exc:
            speech_errors.append(str(exc))
            logger.warning("OpenRouter speech endpoint failed, trying audio modality: %s", exc)

    body = {
        "model": model,
        "messages": [{"role": "user", "content": clean_prompt}],
        "modalities": ["text", "audio"],
    }
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }
    logger.info("Submitting OpenRouter audio job model=%s", model)
    async with httpx.AsyncClient(timeout=httpx.Timeout(60.0, read=300.0), trust_env=False) as client:
        resp = await client.post(f"{OPENROUTER_BASE_URL}/chat/completions", headers=headers, json=body)
        if resp.status_code != 200:
            speech_errors.append(f"Audio generation failed ({resp.status_code}): {resp.text[:300]}")
            if not is_voice_model:
                try:
                    return await generate_openrouter_speech(clean_prompt, model, voice, speed)
                except Exception as exc:
                    speech_errors.append(str(exc))
            raise RuntimeError("; ".join(speech_errors))
        data = resp.json()

    message = ((data.get("choices") or [{}])[0]).get("message") or {}
    audio = message.get("audio") or {}
    b64 = audio.get("data") or ""
    fmt = str(audio.get("format") or "mp3").lower()
    if not b64 and isinstance(message.get("content"), list):
        for part in message["content"]:
            if not isinstance(part, dict):
                continue
            part_audio = part.get("audio") or {}
            if part_audio.get("data"):
                b64 = part_audio["data"]
                fmt = str(part_audio.get("format") or fmt).lower()
                break
            if part.get("type") in ("audio", "output_audio") and part.get("audio_url", {}).get("url"):
                url = part["audio_url"]["url"]
                async with httpx.AsyncClient(timeout=120.0, trust_env=False) as fetch_client:
                    fetch = await fetch_client.get(url)
                if fetch.status_code == 200:
                    ext = url.rsplit(".", 1)[-1].split("?")[0].lower() or "mp3"
                    return await _save_audio_bytes(fetch.content, ext)
    if not b64:
        try:
            return await generate_openrouter_speech(clean_prompt, model, voice, speed)
        except Exception as exc:
            speech_errors.append(str(exc))
        raise RuntimeError("; ".join(speech_errors) or "Audio provider returned no audio data.")

    audio_bytes = base64.b64decode(b64.split(",", 1)[1] if b64.startswith("data:") else b64)
    return await _save_audio_bytes(audio_bytes, fmt)

async def generate_speech(text: str, voice: Optional[str] = None, speed: Optional[float] = None,
                          model: Optional[str] = None) -> str:
    if model:
        model_id = str(model)
        if model_id not in OPENROUTER_AUDIO_MODELS:
            # Migrate workflows saved with older audio models to the supported ones.
            looks_audio_gen = any(k in model_id.lower() for k in ("lyria", "music", "audio", "seed"))
            model_id = "bytedance-seed/seed-audio-1-0" if looks_audio_gen else "heygen/heygen-voice-1-turbo:free"
        return await generate_openrouter_audio(text, model_id, voice, speed)
    if not OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY is not configured, so text-to-speech cannot run. "
                           "Select a free OpenRouter audio model in the node to generate without OpenAI.")
    clean_text = (text or "").strip()
    if not clean_text:
        raise RuntimeError("Enter the text to convert to speech.")
    voice_map = {
        "Natural English Male": "onyx",
        "Natural English Female": "nova",
        "Cinematic Narrator": "fable",
    }
    voice_id = voice_map.get(str(voice or ""), "alloy")
    try:
        rate = max(0.25, min(4.0, float(speed or 1.0)))
    except (TypeError, ValueError):
        rate = 1.0

    payload = {
        "model": "tts-1",
        "voice": voice_id,
        "input": clean_text[:4096],
        "response_format": "mp3",
        "speed": rate,
    }
    headers = {"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"}
    async with httpx.AsyncClient(timeout=httpx.Timeout(60.0, read=180.0), trust_env=False) as client:
        resp = await client.post("https://api.openai.com/v1/audio/speech", headers=headers, json=payload)
        if resp.status_code != 200:
            raise RuntimeError(f"Text-to-speech failed ({resp.status_code}): {resp.text[:300]}")
        audio_bytes = resp.content
    if not audio_bytes:
        raise RuntimeError("Text-to-speech returned an empty audio file.")

    filename = f"speech_{uuid.uuid4().hex[:10]}.mp3"
    (OUTPUT_DIR / filename).write_bytes(audio_bytes)
    logger.info("Saved generated speech %s (%s bytes)", filename, len(audio_bytes))
    return filename

async def produce_video(ntype: str, params: dict, pred_outputs: List[Any], predecessor_nodes: Optional[List[WorkflowNode]] = None) -> dict:
    prompt = str(params.get("prompt") or "")
    if ntype == "video_from_script":
        prompt = str(params.get("script") or prompt)
    images = collect_reference_images(pred_outputs, predecessor_nodes)
    frame_images = None
    input_references = None
    if ntype == "image_to_video":
        if not images:
            raise RuntimeError("Image to Video needs a connected image.")
        frame_images = [_frame_image_payload(images[0], "first_frame")]
    elif ntype == "multi_image_to_video":
        if not images:
            raise RuntimeError("Multi-Image to Video needs at least one connected image.")
        input_references = [_reference_image_payload(img) for img in images]
    elif not prompt.strip():
        raise RuntimeError("Enter a prompt or script for video generation.")

    filename = await generate_openrouter_video(prompt, params, frame_images, input_references)
    return {"kind": "video", "filename": filename, "path": str(OUTPUT_DIR / filename)}

def passthrough_video(pred_outputs: List[Any]) -> dict:
    for item in pred_outputs:
        if isinstance(item, dict) and item.get("kind") == "video" and item.get("filename"):
            return item
    raise RuntimeError("Connect a video generation or upload node before this output.")

def predecessor_text(pred_outputs: List[Any]) -> str:
    parts = []
    for item in pred_outputs:
        if isinstance(item, dict) and item.get("kind") == "text":
            text = str(item.get("text") or "").strip()
            if text:
                parts.append(text)
    return ", ".join(parts)

async def build_text_node_output(ntype: str, params: dict, pred_outputs: List[Any]) -> str:
    base = str(params.get("prompt") or "").strip()
    style = str(params.get("style") or "").strip()
    upstream = predecessor_text(pred_outputs)
    if not base:
        base = upstream
    if ntype == "text_output":
        return base or upstream
    if ntype == "style_preset":
        style = STYLE_PRESETS.get(style, style)
    combined = ", ".join(part for part in (base, style) if part) or "A beautifully lit cinematic scene"
    if GROQ_API_KEY or OPENAI_API_KEY:
        try:
            enhanced = await call_ai_text(
                "You are a prompt engineer for AI image and video models. "
                "Rewrite the user's idea into one vivid, concrete generation prompt. Return only the prompt.",
                combined,
            )
            enhanced = (enhanced or "").strip()
            if enhanced:
                return enhanced
        except Exception as exc:
            logger.warning("Prompt enhancement fallback to plain text: %s", exc)
    return combined

def _ffmpeg_exe() -> Optional[str]:
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    try:
        import imageio_ffmpeg  # pip install imageio-ffmpeg (ships a static binary)
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return None


def mux_video_audio(video_path: Path, audio_path: Path) -> str:
    exe = _ffmpeg_exe()
    if not exe:
        raise RuntimeError(
            "Audio merging needs ffmpeg. Install it with: pip install imageio-ffmpeg"
        )
    if not video_path.exists() or not audio_path.exists():
        raise RuntimeError("Video or audio file is missing.")
    filename = f"merged_{uuid.uuid4().hex[:10]}.mp4"
    out_path = OUTPUT_DIR / filename
    base_cmd = [
        exe, "-y", "-i", str(video_path), "-i", str(audio_path),
        "-map", "0:v:0", "-map", "1:a:0", "-c:a", "aac", "-movflags", "+faststart",
    ]
    attempts = [
        base_cmd + ["-c:v", "copy", str(out_path)],
        base_cmd + ["-c:v", "libx264", "-pix_fmt", "yuv420p", str(out_path)],
    ]
    last_error = ""
    for cmd in attempts:
        try:
            proc = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        except Exception as e:
            last_error = str(e)
            continue
        if proc.returncode == 0 and out_path.exists() and out_path.stat().st_size > 0:
            return filename
        last_error = " | ".join((proc.stderr or "").strip().splitlines()[-3:])
    raise RuntimeError(f"Video + audio merge failed: {last_error or 'unknown ffmpeg error'}")

# ─── AI Operations Set ────────────────────────────────────────────────────────
AI_OPERATIONS = {
    "ai_image_edit", "ai_multi_image_edit", "ai_object_replacement", "ai_background_edit",
    "ai_text_to_image", "multiple_image_input",
    # Video generation & editing operations
    "text_to_video", "image_to_video", "multi_image_to_video", "video_from_script",
    "ai_video_edit", "replace_scene", "remove_object_video", "video_upscale",
    "text_to_speech", "auto_subtitles", "video_bg_removal", "video_ai_effects",
}

async def execute_ai_op(op_name: str, img: Optional[Image.Image], prompt: str, params: dict,
                         second_img: Optional[Image.Image] = None,
                         extra_images: Optional[List[Image.Image]] = None) -> Image.Image:
    if op_name == "ai_text_to_image":
        return await execute_ai_text_to_image(prompt, params)
    elif op_name in VIDEO_GEN_TYPES:
        raise RuntimeError("Video generation nodes return a video file, not an edited image.")
    elif op_name == "ai_image_edit":
        return await execute_ai_image_edit(img or Image.new("RGB", (512, 512), (20, 20, 20)), prompt, params)
    elif op_name == "ai_multi_image_edit":
        base_img = img or Image.new("RGB", (512, 512), (20, 20, 20))
        return await execute_ai_multi_image_edit(
            base_img, second_img or base_img, prompt, params, extra_images=extra_images
        )
    elif op_name == "ai_object_replacement":
        return await execute_ai_object_replacement(img or Image.new("RGB", (512, 512), (20, 20, 20)), prompt, params)
    elif op_name == "ai_background_edit":
        return await execute_ai_background_edit(img or Image.new("RGB", (512, 512), (20, 20, 20)), prompt, params)
    return img or Image.new("RGB", (512, 512), (20, 20, 20))

# ─── Image Operations ─────────────────────────────────────────────────────────
def execute_op_resize(img: Image.Image, p: dict) -> Image.Image:
    w = max(16, min(4096, int(p.get("width") or img.width)))
    h = max(16, min(4096, int(p.get("height") or img.height)))
    mode = p.get("mode", "fit")
    if mode == "stretch":
        return img.resize((w, h), Image.LANCZOS)
    if mode == "fill":
        img_ratio = img.width / img.height
        target_ratio = w / h
        if img_ratio > target_ratio:
            new_w = int(img.height * target_ratio)
            off = (img.width - new_w) // 2
            img = img.crop((off, 0, off + new_w, img.height))
        else:
            new_h = int(img.width / target_ratio)
            off = (img.height - new_h) // 2
            img = img.crop((0, off, img.width, off + new_h))
        return img.resize((w, h), Image.LANCZOS)
    if mode == "pad":
        copy = img.copy()
        copy.thumbnail((w, h), Image.LANCZOS)
        padded = Image.new("RGB", (w, h), (18, 20, 30))
        padded.paste(copy, ((w - copy.width) // 2, (h - copy.height) // 2))
        return padded
    copy = img.copy()
    copy.thumbnail((w, h), Image.LANCZOS)
    return copy

def execute_op_crop(img: Image.Image, p: dict) -> Image.Image:
    aspect = p.get("aspect_ratio")
    ratios = {"1:1": (1, 1), "16:9": (16, 9), "9:16": (9, 16), "4:3": (4, 3), "3:2": (3, 2)}
    if aspect in ratios:
        rw, rh = ratios[aspect]
        target = rw / rh
        cur = img.width / img.height
        if cur > target:
            new_w = int(img.height * target)
            off = (img.width - new_w) // 2
            return img.crop((off, 0, off + new_w, img.height))
        new_h = int(img.width / target)
        off = (img.height - new_h) // 2
        return img.crop((0, off, img.width, off + new_h))
    left = int(p.get("left", 0))
    top = int(p.get("top", 0))
    width = int(p.get("width", img.width))
    height = int(p.get("height", img.height))
    return img.crop((left, top, min(img.width, left + width), min(img.height, top + height)))

def execute_op_rotate(img: Image.Image, p: dict) -> Image.Image:
    return img.rotate(-float(p.get("angle", 0)), expand=bool(p.get("expand", True)), resample=Image.BICUBIC)

def execute_op_flip(img: Image.Image, p: dict) -> Image.Image:
    d = str(p.get("direction", "horizontal")).lower()
    if d in ("horizontal", "both"):
        img = ImageOps.mirror(img)
    if d in ("vertical", "both"):
        img = ImageOps.flip(img)
    return img

def execute_op_brightness(img, p):
    f = max(0.0, min(3.0, float(p.get("factor", 1.0))))
    return ImageEnhance.Brightness(img).enhance(f)

def execute_op_contrast(img, p):
    f = max(0.0, min(3.0, float(p.get("factor", 1.0))))
    return ImageEnhance.Contrast(img).enhance(f)

def execute_op_saturation(img, p):
    f = max(0.0, min(4.0, float(p.get("factor", 1.0))))
    return ImageEnhance.Color(img).enhance(f)

def execute_op_grayscale(img, p):
    return ImageOps.grayscale(img).convert("RGB")

def execute_op_blur(img, p):
    r = max(0.1, min(50.0, float(p.get("radius", 2.0))))
    btype = str(p.get("type", "gaussian")).lower()
    if btype == "median":
        k = int(r * 2) + 1
        cv = pil_to_cv(img)
        return cv_to_pil(cv2.medianBlur(cv, k))
    if btype == "box":
        return img.filter(ImageFilter.BoxBlur(r))
    return img.filter(ImageFilter.GaussianBlur(r))

def execute_op_sharpen(img, p):
    f = max(0.0, min(5.0, float(p.get("factor", 1.5))))
    return ImageEnhance.Sharpness(img).enhance(f)

def execute_op_edge_detection(img, p):
    t1 = int(p.get("threshold1", 100))
    t2 = int(p.get("threshold2", 200))
    tint = p.get("tint", "cyan")
    cv = pil_to_cv(img)
    gray = cv2.cvtColor(cv, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, t1, t2)
    out = np.zeros_like(cv)
    if tint == "cyan":
        out[edges > 0] = [230, 210, 0]
    elif tint == "green":
        out[edges > 0] = [80, 240, 50]
    else:
        out[edges > 0] = [255, 255, 255]
    return cv_to_pil(out)

def execute_op_sepia(img, p):
    i = max(0.0, min(1.0, float(p.get("intensity", 0.8))))
    cv = pil_to_cv(img)
    rgb = cv2.cvtColor(cv, cv2.COLOR_BGR2RGB)
    matrix = np.array([[0.272, 0.534, 0.131],
                       [0.349, 0.686, 0.168],
                       [0.393, 0.769, 0.189]])
    sep = np.clip(cv2.transform(rgb, matrix), 0, 255).astype(np.uint8)
    blended = cv2.addWeighted(sep, i, rgb, 1 - i, 0)
    return Image.fromarray(blended)

def execute_op_vignette(img, p):
    i = float(p.get("intensity", 0.6))
    r = float(p.get("radius", 0.75))
    cv = pil_to_cv(img)
    rows, cols = cv.shape[:2]
    X = cv2.getGaussianKernel(cols, cols * r)
    Y = cv2.getGaussianKernel(rows, rows * r)
    mask = Y * X.T
    mask = (1 - i) + i * (mask / mask.max())
    out = np.zeros_like(cv, dtype=np.float32)
    for c in range(3):
        out[:, :, c] = cv[:, :, c] * mask
    return cv_to_pil(np.clip(out, 0, 255).astype(np.uint8))

def execute_op_invert(img, p):
    return ImageOps.invert(img.convert("RGB"))

def execute_op_threshold(img, p):
    t = int(p.get("thresh", 128))
    cv = pil_to_cv(img)
    gray = cv2.cvtColor(cv, cv2.COLOR_BGR2GRAY)
    _, bin_img = cv2.threshold(gray, t, 255, cv2.THRESH_BINARY)
    return Image.fromarray(cv2.cvtColor(bin_img, cv2.COLOR_GRAY2RGB))

def execute_op_color_balance(img, p):
    rf = float(p.get("red", 1.0))
    gf = float(p.get("green", 1.0))
    bf = float(p.get("blue", 1.0))
    cv = pil_to_cv(img).astype(np.float32)
    cv[:, :, 0] *= bf
    cv[:, :, 1] *= gf
    cv[:, :, 2] *= rf
    return cv_to_pil(np.clip(cv, 0, 255).astype(np.uint8))

def execute_op_emboss(img, p):
    return img.filter(ImageFilter.EMBOSS)

def execute_op_posterize(img, p):
    bits = max(1, min(8, int(p.get("bits", 4))))
    return ImageOps.posterize(img.convert("RGB"), bits)

def execute_op_solarize(img, p):
    threshold = max(0, min(255, int(p.get("threshold", 128))))
    return ImageOps.solarize(img.convert("RGB"), threshold)

def execute_op_auto_contrast(img, p):
    cutoff = float(p.get("cutoff", 1))
    return ImageOps.autocontrast(img.convert("RGB"), cutoff=cutoff)


OPERATIONS_MAP = {
    "resize": execute_op_resize,
    "crop": execute_op_crop,
    "rotate": execute_op_rotate,
    "flip": execute_op_flip,
    "brightness": execute_op_brightness,
    "contrast": execute_op_contrast,
    "saturation": execute_op_saturation,
    "grayscale": execute_op_grayscale,
    "blur": execute_op_blur,
    "sharpen": execute_op_sharpen,
    "edge_detection": execute_op_edge_detection,
    "sepia": execute_op_sepia,
    "vignette": execute_op_vignette,
    "invert": execute_op_invert,
    "threshold": execute_op_threshold,
    "color_balance": execute_op_color_balance,
    "emboss": execute_op_emboss,
    "posterize": execute_op_posterize,
    "solarize": execute_op_solarize,
    "auto_contrast": execute_op_auto_contrast,
}

# ─── AI-Powered NLP Planner ───────────────────────────────────────────────────
async def build_plan_from_prompt_ai(prompt: str) -> dict:
    system = (
        "You are an expert multi-modal studio workflow planner. Given a user instruction across Image, Video, Audio, or Text generation, "
        "return a JSON array of steps. Each step must have 'operation' and 'parameters'.\n\n"
        "Supported operations by category:\n"
        "IMAGE AI: ai_image_edit, ai_background_edit, ai_object_replacement, ai_multi_image_edit, ai_text_to_image\n"
        "IMAGE CLASSICAL: resize, crop, rotate, flip, brightness, contrast, saturation, grayscale, blur, sharpen, edge_detection, sepia, vignette, color_balance, auto_contrast\n"
        "VIDEO GENERATION: text_to_video, image_to_video, multi_image_to_video, video_from_script\n"
        "VIDEO EDITING: ai_video_edit, video_trim, replace_scene, remove_object_video, video_upscale, video_reframe\n"
        "AUDIO: text_to_speech, voiceover, sound_effects, bg_music, remove_audio, audio_mixer, audio_trim, audio_volume, audio_fade, audio_pitch, audio_denoise\n"
        "TEXT & SUBTITLES: auto_subtitles, video_text, translate_subtitles, animated_text, speech_to_text, subtitle_styling\n"
        "VISUAL EFFECTS: video_color_correction, video_color_grading, video_transitions, video_slow_motion, video_loop, video_overlay, video_bg_removal, video_ai_effects\n\n"
        "Chaining rules:\n"
        "- Steps run left to right. A step consumes the previous step's output.\n"
        "- ai_text_to_image needs no input image; place it FIRST and do NOT add an image_input before it.\n"
        "- When both text-to-image and image-to-video are asked for, output ai_text_to_image then image_to_video; the generated image becomes the first frame.\n"
        "- Only add image_input / video_input / audio_input when the first operation edits an existing uploaded asset.\n"
        "- text_to_video and video_from_script produce video from a prompt alone; do not chain an uploaded video before them.\n"
        "- For voice in a video, include text_to_speech (or voiceover) as its own step; the studio merges it with the video.\n"
        "- Include model params: image ops use \"black-forest-labs/flux-3-image-klein\", video ops use \"alibaba/wan-3.0\", speech uses \"voice_model\": \"heygen/heygen-voice-1-turbo:free\" and \"voice\": \"Natural English Female\".\n\n"
        "Return ONLY the JSON array. No markdown, no explanation."
    )

    examples = (
        "Example 1 (Video): 'Generate a video of cybernetic Tokyo from prompt with upbeat background music and subtitles'\n"
        "-> [{\"operation\": \"text_to_video\", \"parameters\": {\"prompt\": \"Cybernetic Tokyo at dusk, neon reflections, 4k\"}}, {\"operation\": \"bg_music\", \"parameters\": {\"genre\": \"Synthwave Upbeat\"}}, {\"operation\": \"auto_subtitles\", \"parameters\": {\"language\": \"en\"}}]\n\n"
        "Example 2 (Audio): 'Convert script to natural speech and denoise'\n"
        "-> [{\"operation\": \"text_to_speech\", \"parameters\": {\"text\": \"Welcome to NetRoot Studio\", \"voice\": \"Natural English Male\"}}, {\"operation\": \"audio_denoise\", \"parameters\": {\"level\": 60}}]\n\n"
        "Example 3 (Text to Image): 'Generate an image of a futuristic floating island'\n"
        "-> [{\"operation\": \"ai_text_to_image\", \"parameters\": {\"prompt\": \"A magnificent futuristic floating island with waterfalls and sci-fi towers, ultra-detailed 8k\", \"model\": \"black-forest-labs/flux-3-image-klein\"}}]\n\n"
        "Example 4 (Image): 'Change the dress color to red and sharpen'\n"
        "-> [{\"operation\": \"ai_image_edit\", \"parameters\": {\"prompt\": \"Change the dress color to red, keep everything else unchanged\"}}, {\"operation\": \"sharpen\", \"parameters\": {\"factor\": 1.6}}]\n\n"
        "Example 5 (Text → Image → Video): 'Text to image and image to video'\n"
        "-> [{\"operation\": \"ai_text_to_image\", \"parameters\": {\"prompt\": \"Cinematic landscape, ultra detailed\", \"model\": \"black-forest-labs/flux-3-image-klein\"}}, {\"operation\": \"image_to_video\", \"parameters\": {\"prompt\": \"Slow cinematic camera push-in\", \"model\": \"alibaba/wan-3.0\"}}]\n\n"
        "Example 6 (Video + Voice): 'Make a video with a voiceover'\n"
        "-> [{\"operation\": \"text_to_video\", \"parameters\": {\"prompt\": \"Cinematic city at dusk\", \"model\": \"alibaba/wan-3.0\"}}, {\"operation\": \"text_to_speech\", \"parameters\": {\"text\": \"Narration script\", \"voice\": \"Natural English Female\", \"voice_model\": \"heygen/heygen-voice-1-turbo:free\"}}]\n\n"
    )

    user = examples + f"Now create a workflow for: {prompt}"

    try:
        raw = await call_ai_text(system, user)
        match = re.search(r'\[[\s\S]*\]', raw)
        if match:
            plan = json.loads(match.group())
            if isinstance(plan, list) and len(plan) > 0:
                return {
                    "supported": True,
                    "explanation": f"AI generated {len(plan)} operation(s) for: {prompt}",
                    "plan": plan,
                    "source": "ai_engine",
                }
    except Exception as e:
        logger.error(f"AI planner failed: {e}")

    return build_plan_from_prompt(prompt)

def build_plan_from_prompt(prompt: str) -> dict:
    p = prompt.lower()
    plan = []

    wants_text_to_image = any(kw in p for kw in [
        "text to image", "text-to-image", "generate image", "create image", "image of"])
    wants_image_to_video = any(kw in p for kw in [
        "image to video", "image-to-video", "animate the image", "animate that", "turn it into a video", "then video"])
    if wants_text_to_image and wants_image_to_video:
        plan.append({"operation": "ai_text_to_image", "parameters": {
            "prompt": prompt, "model": OPENROUTER_IMAGE_MODEL}})
        plan.append({"operation": "image_to_video", "parameters": {
            "prompt": prompt, "model": OPENROUTER_VIDEO_MODEL}})
        return {"supported": True, "explanation": f"Text → Image → Video workflow for: {prompt}",
                "plan": plan, "source": "rule_text_to_image_video"}

    if wants_text_to_image and any(kw in p for kw in ["voiceover", "voice over", "narrat", "text to speech"]):
        plan.append({"operation": "ai_text_to_image", "parameters": {
            "prompt": prompt, "model": OPENROUTER_IMAGE_MODEL}})
        plan.append({"operation": "image_to_video", "parameters": {
            "prompt": prompt, "model": OPENROUTER_VIDEO_MODEL}})
        plan.append({"operation": "text_to_speech", "parameters": {
            "text": prompt, "voice": "Natural English Female",
            "voice_model": "heygen/heygen-voice-1-turbo:free"}})
        return {"supported": True, "explanation": f"Text → Image → Video + Voice workflow for: {prompt}",
                "plan": plan, "source": "rule_text_to_image_voice"}

    # 1. Video editing / generation checks
    is_video_edit = any(kw in p for kw in ["edit video", "video edit", "trim video", "cut video", "replace scene", "video upscale", "reframe video"])
    is_video_gen = any(kw in p for kw in ["text to video", "generate video", "create video", "make video",
                                          "make a video", "a video of", "video with", "anime video", "produce video"])

    if is_video_edit:
        if "trim" in p or "cut" in p:
            plan.append({"operation": "video_trim", "parameters": {"start": 0, "end": 15}})
        else:
            plan.append({"operation": "ai_video_edit", "parameters": {"prompt": prompt, "model": OPENROUTER_VIDEO_MODEL}})
        if any(kw in p for kw in ["sound", "audio", "music", "bgm", "voice"]):
            plan.append({"operation": "bg_music", "parameters": {"genre": "Cinematic"}})
        if "subtitle" in p or "caption" in p:
            plan.append({"operation": "auto_subtitles", "parameters": {"language": "en"}})
        return {"supported": True, "explanation": f"Video editing workflow for: {prompt}", "plan": plan, "source": "rule_video_edit"}

    if is_video_gen:
        plan.append({"operation": "text_to_video", "parameters": {"prompt": prompt, "model": OPENROUTER_VIDEO_MODEL}})
        if any(kw in p for kw in ["music", "sound", "audio"]):
            plan.append({"operation": "bg_music", "parameters": {"genre": "Cinematic"}})
        if any(kw in p for kw in ["voiceover", "voice over", "narrat", "speech", "voice"]):
            plan.append({"operation": "text_to_speech", "parameters": {
                "text": prompt, "voice": "Natural English Female",
                "voice_model": "heygen/heygen-voice-1-turbo:free"}})
        if "subtitle" in p or "caption" in p:
            plan.append({"operation": "auto_subtitles", "parameters": {"language": "en"}})
        return {"supported": True, "explanation": f"Video generation workflow for: {prompt}", "plan": plan, "source": "rule_video"}

    if any(kw in p for kw in ["animate image", "image to video", "animate this"]):
        plan.append({"operation": "image_to_video", "parameters": {"prompt": prompt, "model": OPENROUTER_VIDEO_MODEL}})
        return {"supported": True, "explanation": f"Image to Video workflow for: {prompt}", "plan": plan, "source": "rule_video"}

    # 2. Audio checks
    if any(kw in p for kw in ["text to speech", "voiceover", "narrate", "speak", "tts"]):
        plan.append({"operation": "text_to_speech", "parameters": {"text": prompt, "voice": "Natural English Male"}})
        if "denoise" in p:
            plan.append({"operation": "audio_denoise", "parameters": {"level": 50}})
        return {"supported": True, "explanation": f"Audio speech workflow for: {prompt}", "plan": plan, "source": "rule_audio"}

    # 3. Text to image
    if any(kw in p for kw in ["generate image", "create image", "text to image", "draw", "render image"]):
        plan.append({"operation": "ai_text_to_image", "parameters": {"prompt": prompt, "model": "black-forest-labs/flux-3-image-klein"}})
        return {"supported": True, "explanation": f"Text to image workflow for: {prompt}", "plan": plan, "source": "rule_text_to_image"}

    # 4. Multi-Image Edit
    if any(kw in p for kw in ["combine", "merge", "blend two", "two images", "multiple images", "blend image"]):
        plan.append({"operation": "ai_multi_image_edit", "parameters": {"prompt": prompt, "model": OPENROUTER_IMAGE_EDIT_MODEL}})
        return {"supported": True, "explanation": f"Multi-image blend: {prompt}", "plan": plan, "source": "rule_multi_image"}

    ai_keywords = [
        "change", "replace", "remove", "add", "make it", "turn into",
        "dress", "color of", "background to", "object", "face", "hair", "sky", "road",
        "realistic", "cartoon", "painting", "sketch", "anime"
    ]
    if any(kw in p for kw in ai_keywords):
        plan.append({"operation": "ai_image_edit", "parameters": {"prompt": prompt}})
        return {"supported": True, "explanation": f"AI edit: {prompt}", "plan": plan, "source": "rule_based_ai_route"}

    m = re.search(r'(\d{3,4})\s*[xX×by, ]+\s*(\d{3,4})', p)
    if m:
        plan.append({"operation": "resize", "parameters": {"width": int(m.group(1)), "height": int(m.group(2)), "mode": "fit"}})
    elif "square" in p:
        plan.append({"operation": "crop", "parameters": {"aspect_ratio": "1:1"}})

    if "bright" in p:
        plan.append({"operation": "brightness", "parameters": {"factor": 1.25}})
    elif "dark" in p:
        plan.append({"operation": "brightness", "parameters": {"factor": 0.8}})
    if "contrast" in p:
        plan.append({"operation": "contrast", "parameters": {"factor": 1.25}})
    if any(k in p for k in ["black and white", "b&w", "grayscale", "grey", "monochrome"]):
        plan.append({"operation": "grayscale", "parameters": {}})
    elif "sepia" in p or "vintage" in p or "retro" in p:
        plan.append({"operation": "sepia", "parameters": {"intensity": 0.85}})
    elif "vibrant" in p or "saturat" in p:
        plan.append({"operation": "saturation", "parameters": {"factor": 1.35}})
    if "sharp" in p or "crisp" in p:
        plan.append({"operation": "sharpen", "parameters": {"factor": 1.6}})
    elif "blur" in p or "soft" in p:
        plan.append({"operation": "blur", "parameters": {"radius": 4.0, "type": "gaussian"}})
    if "rotate 90" in p or "rotate right" in p:
        plan.append({"operation": "rotate", "parameters": {"angle": 90, "expand": True}})
    elif "rotate 180" in p:
        plan.append({"operation": "rotate", "parameters": {"angle": 180, "expand": True}})
    elif "flip" in p or "mirror" in p:
        plan.append({"operation": "flip", "parameters": {"direction": "horizontal"}})
    if "edge" in p or "canny" in p or "blueprint" in p or "contour" in p:
        plan.append({"operation": "edge_detection", "parameters": {"threshold1": 100, "threshold2": 200, "tint": "cyan"}})
    if "vignette" in p:
        plan.append({"operation": "vignette", "parameters": {"radius": 0.75, "intensity": 0.6}})
    if "png" in p:
        plan.append({"operation": "convert_format", "parameters": {"format": "PNG"}})
    elif "webp" in p:
        plan.append({"operation": "convert_format", "parameters": {"format": "WEBP"}})
    elif "jpg" in p or "jpeg" in p:
        plan.append({"operation": "convert_format", "parameters": {"format": "JPEG"}})

    if not plan:
        plan = [
            {"operation": "brightness", "parameters": {"factor": 1.15}},
            {"operation": "contrast", "parameters": {"factor": 1.15}},
            {"operation": "sharpen", "parameters": {"factor": 1.3}},
        ]

    return {"supported": True, "explanation": f"Interpreted {len(plan)} operation(s).", "plan": plan, "source": "offline_engine"}

# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    return {
        "status": "healthy",
        "service": "ai-image-edit",
        "ai_provider": AI_PROVIDER,
        "ai_available": bool(OPENROUTER_API_KEY or GROQ_API_KEY or OPENAI_API_KEY),
        "openrouter_configured": bool(OPENROUTER_API_KEY),
        "groq_configured": bool(GROQ_API_KEY),
        "openai_configured": bool(OPENAI_API_KEY),
    }

@app.post("/api/upload")
async def upload_image(file: UploadFile = File(...)):
    allowed_types = [
        "image/jpeg", "image/png", "image/webp", "image/bmp",
        "video/mp4", "video/webm", "video/quicktime", "video/x-msvideo",
        "audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4", "audio/webm", "audio/aac"
    ]
    if file.content_type not in allowed_types:
        raise HTTPException(400, "Unsupported file format. Supported: Images (PNG/JPG/WEBP), Videos (MP4/WEBM/MOV), Audio (MP3/WAV/OGG).")
    contents = await file.read()
    if len(contents) > 100 * 1024 * 1024:
        raise HTTPException(400, "File too large (max 100MB).")
    
    is_video = file.content_type.startswith("video/")
    is_audio = file.content_type.startswith("audio/")
    is_image = file.content_type.startswith("image/")

    if is_image:
        try:
            img = Image.open(io.BytesIO(contents))
            img.verify()
        except Exception:
            raise HTTPException(400, "Invalid image file.")
    ext = Path(file.filename).suffix.lower() or (".mp4" if is_video else ".mp3" if is_audio else ".png")
    filename = f"{uuid.uuid4().hex[:12]}{ext}"
    path = UPLOAD_DIR / filename
    with open(path, "wb") as f:
        f.write(contents)
    
    w, h = 0, 0
    if is_image:
        try:
            with Image.open(path) as im:
                w, h = im.size
        except Exception:
            pass

    return {
        "id": filename, 
        "image_id": filename,
        "filename": file.filename, 
        "type": "video" if is_video else "audio" if is_audio else "image",
        "url": filename, 
        "thumbnail_url": filename if is_image else None, 
        "width": w, 
        "height": h
    }

@app.get("/api/assets")
async def list_assets():
    """Saved Library lists only results the user explicitly saved. Uploads and
    fresh generations stay on disk but are not listed until saved."""
    assets = []
    saved = _read_library()
    d = OUTPUT_DIR
    if d.exists():
        for f in d.iterdir():
            suf = f.suffix.lower()
            if f.name in saved and suf in LIBRARY_EXTS:
                try:
                    stat = f.stat()
                    media_type = "video" if suf in [".mp4", ".webm", ".mov"] else "audio" if suf in [".mp3", ".wav", ".ogg", ".aac"] else "image"
                    assets.append({
                        "id": f.name,
                        "filename": f.name,
                        "type": media_type,
                        "source": "processed",
                        "url": f.name,
                        "thumbnail_url": f.name if media_type == "image" else None,
                        "created_at": stat.st_mtime,
                        "size_bytes": stat.st_size
                    })
                except Exception:
                    pass
    assets.sort(key=lambda x: x["created_at"], reverse=True)
    return {"assets": assets}

@app.post("/api/library/save")
async def save_asset_to_library(payload: dict):
    raw = str(payload.get("filename") or "").strip()
    safe = Path(raw.split("?")[0].split("#")[0]).name
    if not safe or not (OUTPUT_DIR / safe).exists():
        raise HTTPException(404, "Generated asset not found.")
    saved = _read_library()
    if safe not in saved:
        saved.add(safe)
        _write_library(saved)
    return {"success": True, "filename": safe}

@app.delete("/api/assets/{filename}")
async def delete_asset(filename: str):
    safe = Path(filename).name
    deleted = False
    for d in [UPLOAD_DIR, OUTPUT_DIR]:
        p = d / safe
        if p.exists():
            try:
                p.unlink()
                deleted = True
            except Exception as e:
                logger.error(f"Failed to delete {p}: {e}")
    saved = _read_library()
    if safe in saved:
        saved.discard(safe)
        _write_library(saved)
    return {"success": deleted}

@app.get("/api/asset/{filename}")
async def serve_asset(filename: str):
    safe = Path(filename).name
    for d in [UPLOAD_DIR, OUTPUT_DIR]:
        p = d / safe
        if p.exists():
            return FileResponse(str(p))
    raise HTTPException(404, "Asset not found.")

@app.post("/api/ai/understand")
async def ai_understand(req: UnderstandRequest):
    if not req.prompt.strip():
        raise HTTPException(400, "Empty prompt.")
    if GROQ_API_KEY or OPENAI_API_KEY:
        return await build_plan_from_prompt_ai(req.prompt)
    return build_plan_from_prompt(req.prompt)

@app.post("/api/workflow/generate")
async def generate_workflow(req: GenerateWorkflowRequest):
    if not req.prompt.strip():
        raise HTTPException(400, "Prompt cannot be empty.")

    if GROQ_API_KEY or OPENAI_API_KEY:
        understood = await build_plan_from_prompt_ai(req.prompt)
    else:
        understood = build_plan_from_prompt(req.prompt)

    plan = understood.get("plan", [])
    op_aliases = {
        "text_to_image": "ai_text_to_image", "text2image": "ai_text_to_image",
        "image_generation": "ai_text_to_image", "generate_image": "ai_text_to_image",
        "tts": "text_to_speech", "voice_over": "voiceover", "narrate": "voiceover",
        "background_music": "bg_music", "music": "bg_music", "sfx": "sound_effects",
    }
    normalized_plan = []
    for step in plan:
        if not isinstance(step, dict):
            continue
        op = str(step.get("operation") or "").strip()
        step["operation"] = op_aliases.get(op, op)
        normalized_plan.append(step)
    plan = normalized_plan
    supported_ops = set(OPERATIONS_MAP.keys()) | set(VIDEO_NODE_TYPES) | set(AI_OPERATIONS) | set(AUDIO_GEN_TYPES) | set(AUDIO_PASSTHROUGH_TYPES) | {
        "video_audio_merge", "ai_video_edit", "replace_scene", "remove_object_video", "video_upscale",
        "video_reframe", "video_trim", "audio_input", "auto_subtitles", "video_text",
        "translate_subtitles", "animated_text", "speech_to_text", "subtitle_styling",
        "video_color_correction", "video_color_grading", "video_transitions", "video_slow_motion",
        "video_loop", "video_overlay", "video_bg_removal", "video_ai_effects", "prompt_enhancer",
        "style_preset", "text_output", "convert_format",
    }
    plan = [step for step in plan if isinstance(step, dict) and step.get("operation") in supported_ops
            and step.get("operation") not in
            {"image_output", "video_output", "audio_output", "text_output", "video_preview", "save_image"}]
    if not plan:
        raise HTTPException(400, "Could not map that prompt to a supported workflow. Mention an image, video, audio or text action.")

    nodes = []
    edges = []
    x_pos = 80
    y_pos = 160

    def plan_node(op, label, parameters, x, y):
        node_id = f"node_{op}_{uuid.uuid4().hex[:6]}"
        nodes.append({"id": node_id, "type": op, "position": {"x": x, "y": y},
                      "data": {"label": label, "parameters": parameters}})
        return node_id

    plan_ops = [step.get("operation") for step in plan]
    first_op = plan_ops[0]
    last_op = plan_ops[-1]

    no_source_ops = {"ai_text_to_image", "text_to_video", "video_from_script", "video_url",
                     "text_to_speech", "voiceover", "sound_effects", "bg_music",
                     "prompt_enhancer", "style_preset",
                     "image_input", "load_image", "multiple_image_input"}
    video_source_ops = {
        "ai_video_edit", "video_trim", "replace_scene", "remove_object_video", "video_upscale",
        "video_reframe", "video_color_correction", "video_color_grading", "video_transitions",
        "video_slow_motion", "video_loop", "video_overlay", "video_bg_removal", "video_ai_effects",
        "video_preview", "auto_subtitles", "video_text", "translate_subtitles", "animated_text",
        "speech_to_text", "subtitle_styling",
    }
    multi_source_ops = {"ai_multi_image_edit", "multi_image_to_video"}

    prev_id = None
    extra_source_ids: List[str] = []
    if first_op in multi_source_ops:
        extra_source_ids = [
            plan_node("multiple_image_input", "Multiple Image Input",
                      {"slotCount": 2, "slot1": req.asset_id or "", "slot2": ""}, x_pos, y_pos - 80),
            plan_node("multiple_image_input", "Reference Image", {"slotCount": 1, "slot1": ""},
                      x_pos, y_pos + 180),
        ]
        x_pos += 320
    elif first_op in no_source_ops:
        pass
    elif first_op in video_source_ops or first_op == "video_input":
        prev_id = plan_node("video_input", "Upload Video", {}, x_pos, y_pos)
        x_pos += 300
    elif first_op in AUDIO_PASSTHROUGH_TYPES or first_op == "audio_input":
        prev_id = plan_node("audio_input", "Audio Input", {}, x_pos, y_pos)
        x_pos += 300
    elif first_op == "image_to_video":
        prev_id = plan_node("video_image_ref", "Upload Image", {"image_id": req.asset_id or ""}, x_pos, y_pos)
        x_pos += 300
    else:
        prev_id = plan_node("image_input", "Source Image", {"image_id": req.asset_id or ""}, x_pos, y_pos)
        x_pos += 300

    ai_labels = {
        "ai_image_edit": "AI Image Edit",
        "ai_multi_image_edit": "AI Multi-Image Edit",
        "ai_object_replacement": "AI Object Replace",
        "ai_background_edit": "AI Background Edit",
        "ai_text_to_image": "Text to Image",
        "ai_video_edit": "AI Video Edit",
        "text_to_video": "Text to Video",
        "image_to_video": "Image to Video",
        "video_trim": "Trim / Cut",
        "bg_music": "Background Music",
        "text_to_speech": "Text to Speech",
        "voiceover": "Voiceover",
        "auto_subtitles": "Auto Subtitles",
        "video_text": "Add Text",
        "audio_denoise": "Noise Reduction",
        "video_audio_merge": "Video + Voice",
    }

    video_steps_in_plan = any(op in VIDEO_GEN_TYPES or op in video_source_ops for op in plan_ops)
    split_audio = video_steps_in_plan and any(op in AUDIO_GEN_TYPES for op in plan_ops)
    main_steps = [s for s in plan if not (split_audio and s.get("operation") in AUDIO_GEN_TYPES)]
    audio_steps = [s for s in plan if split_audio and s.get("operation") in AUDIO_GEN_TYPES]

    first_main = True
    for step in main_steps:
        op = step.get("operation")
        if op == "convert_format":
            continue
        step_params = dict(step.get("parameters") or {})
        if op in ("image_input", "load_image", "video_image_ref") and not step_params.get("image_id"):
            step_params["image_id"] = req.asset_id or ""
        if op in ("video_input", "audio_input") and req.asset_id and not step_params.get("image_id"):
            step_params["image_id"] = req.asset_id
        if op in VIDEO_GEN_TYPES and not step_params.get("model"):
            step_params["model"] = OPENROUTER_VIDEO_MODEL
        if op == "ai_text_to_image" and not step_params.get("model"):
            step_params["model"] = OPENROUTER_IMAGE_MODEL
        if op in ("text_to_speech", "voiceover") and not step_params.get("voice_model"):
            step_params["voice_model"] = "heygen/heygen-voice-1-turbo:free"
        if op in ("sound_effects", "bg_music") and not step_params.get("voice_model"):
            step_params["voice_model"] = "bytedance-seed/seed-audio-1-0"
        node_id = plan_node(op, ai_labels.get(op, op.replace("_", " ").title()),
                            step_params, x_pos, y_pos)
        sources = extra_source_ids if (first_main and extra_source_ids) else ([prev_id] if prev_id else [])
        for src in sources:
            edges.append({"id": f"edge_{src}_{node_id}", "source": src, "target": node_id})
        prev_id = node_id
        first_main = False
        x_pos += 300

    if audio_steps:
        voice_prev = None
        voice_y = y_pos + 260
        for step in audio_steps:
            op = step.get("operation")
            step_params = dict(step.get("parameters") or {})
            if op in ("text_to_speech", "voiceover") and not step_params.get("voice_model"):
                step_params["voice_model"] = "heygen/heygen-voice-1-turbo:free"
            if op in ("sound_effects", "bg_music") and not step_params.get("voice_model"):
                step_params["voice_model"] = "bytedance-seed/seed-audio-1-0"
            node_id = plan_node(op, ai_labels.get(op, op.replace("_", " ").title()),
                                step_params, x_pos, voice_y)
            if voice_prev:
                edges.append({"id": f"edge_{voice_prev}_{node_id}", "source": voice_prev, "target": node_id})
            voice_prev = node_id
            x_pos += 300
        if prev_id and voice_prev:
            merge_id = plan_node("video_audio_merge", "Video + Audio", {}, x_pos, y_pos)
            edges.append({"id": f"edge_{prev_id}_{merge_id}", "source": prev_id, "target": merge_id})
            edges.append({"id": f"edge_{voice_prev}_{merge_id}", "source": voice_prev, "target": merge_id})
            prev_id = merge_id
            x_pos += 300

    out_id = f"node_save_{uuid.uuid4().hex[:6]}"
    if split_audio or last_op in VIDEO_GEN_TYPES or last_op in video_source_ops or last_op in (
            "video_input", "video_audio_merge", "video_preview"):
        out_type, out_label, out_params = "video_output", "Video Output", {"format": "MP4"}
    elif last_op in AUDIO_GEN_TYPES or last_op in AUDIO_PASSTHROUGH_TYPES or last_op == "audio_input":
        out_type, out_label, out_params = "audio_output", "Audio Output", {}
    elif last_op in TEXT_NODE_TYPES:
        out_type, out_label, out_params = "text_output", "Output", {}
    else:
        out_format = "PNG"
        for step in plan:
            if step.get("operation") == "convert_format":
                out_format = step.get("parameters", {}).get("format", "PNG")
        out_type, out_label, out_params = "image_output", "Image Output", {"format": out_format, "quality": 95}

    nodes.append({"id": out_id, "type": out_type, "position": {"x": x_pos, "y": y_pos},
                  "data": {"label": out_label, "parameters": out_params}})
    if prev_id:
        edges.append({"id": f"edge_{prev_id}_{out_id}", "source": prev_id, "target": out_id})

    return {
        "status": "ok",
        "message": understood.get("explanation", "Workflow generated."),
        "source": understood.get("source", "engine"),
        "workflow": {"workflow_id": f"wf_{uuid.uuid4().hex[:6]}", "name": "AI Generated Workflow",
                     "nodes": nodes, "edges": edges}
    }

@app.post("/api/workflow/validate")
async def validate_workflow(payload: WorkflowPayload):
    errors = []
    warnings = []
    if not payload.nodes:
        return {"valid": False, "errors": ["Workflow contains no nodes."], "execution_order": []}

    allowed = set(OPERATIONS_MAP.keys()) | {
        "image_input", "load_image", "convert_format", "compress_image",
        "save_image", "export_image", "image_preview", "download_image",
        "image_output", "multiple_image_input",
        # Video & Audio & Text Nodes
        "video_input", "video_image_ref", "video_audio_ref", "video_url",
        "video_output", "video_preview",
        "text_to_video", "image_to_video", "multi_image_to_video", "video_from_script",
        "ai_video_edit", "video_trim", "replace_scene", "remove_object_video", "video_upscale", "video_reframe", "video_audio_merge",
        "text_to_speech", "voiceover", "sound_effects", "bg_music", "remove_audio", "audio_mixer",
        "audio_input", "audio_trim", "audio_volume", "audio_fade", "audio_pitch", "audio_denoise", "audio_output",
        "auto_subtitles", "video_text", "translate_subtitles", "animated_text", "speech_to_text", "subtitle_styling",
        "video_color_correction", "video_color_grading", "video_transitions", "video_slow_motion", "video_loop",
        "video_overlay", "video_bg_removal", "video_ai_effects",
        "ai_text_to_image", "prompt_enhancer", "style_preset", "text_output",
    } | AI_OPERATIONS

    for n in payload.nodes:
        if n.type not in allowed:
            errors.append(f"Unsupported node type: {n.type}")

    if not any(n.type in ("image_input", "load_image", "multiple_image_input") for n in payload.nodes):
        warnings.append("No explicit Image Input node found.")

    node_ids = {n.id for n in payload.nodes}
    adj = {n.id: [] for n in payload.nodes}
    indeg = {n.id: 0 for n in payload.nodes}
    for e in payload.edges:
        if e.source not in node_ids or e.target not in node_ids:
            errors.append(f"Edge references unknown node: {e.source} → {e.target}")
            continue
        adj[e.source].append(e.target)
        indeg[e.target] += 1

    queue = [nid for nid, d in indeg.items() if d == 0]
    order = []
    temp = dict(indeg)
    while queue:
        u = queue.pop(0)
        order.append(u)
        for v in adj[u]:
            temp[v] -= 1
            if temp[v] == 0:
                queue.append(v)

    if len(order) != len(node_ids):
        errors.append("Workflow contains a cycle.")

    return {"valid": len(errors) == 0, "errors": errors, "warnings": warnings,
            "execution_order": order if not errors else []}

@app.post("/api/workflow/execute")
async def execute_workflow(payload: WorkflowPayload):
    # Collect image ids stored inside the workflow first (saved workflows keep their inputs here).
    # The request-level image_id is only a fallback, so a stale sidebar selection can never hide
    # the images that are actually wired into the loaded workflow.
    node_image_candidates: List[str] = []
    for n in payload.nodes:
        if n.type in ("image_input", "load_image", "video_image_ref"):
            cfg_id = (n.data.parameters or {}).get("image_id", "")
            if cfg_id:
                node_image_candidates.append(cfg_id)
        elif n.type == "multiple_image_input":
            params = n.data.parameters or {}
            for k in ["image_id"] + [f"slot{i}" for i in range(1, 13)]:
                val = params.get(k)
                if val:
                    node_image_candidates.append(val)

    primary_image_id = None
    start_img = None
    candidates = node_image_candidates + ([payload.image_id] if payload.image_id else [])
    for candidate in candidates:
        try:
            opened = open_raster(candidate)
        except Exception:
            opened = None
        if opened is not None:
            primary_image_id = candidate
            start_img = opened
            break

    # If this is purely a text/video/audio generation workflow or start_img wasn't found yet
    has_text_or_video_gen = any(
        n.type in ("ai_text_to_image", "text_to_video", "video_from_script", "image_to_video",
                   "multi_image_to_video", "video_input", "video_output", "video_preview",
                   "text_to_speech", "voiceover", "audio_input", "bg_music", "sound_effects",
                   "prompt_enhancer", "style_preset")
        for n in payload.nodes
    )
    if start_img is None:
        if has_text_or_video_gen:
            start_img = Image.new("RGB", (1024, 1024), (18, 20, 29))
        else:
            raise HTTPException(400, "No valid source image found. Please upload or select an image in the image node first.")

    val = await validate_workflow(payload)
    if not val["valid"]:
        raise HTTPException(400, detail={"message": "Invalid workflow", "errors": val["errors"]})

    nodes = {n.id: n for n in payload.nodes}
    adj = {n.id: [] for n in payload.nodes}
    preds = {n.id: [] for n in payload.nodes}
    for e in payload.edges:
        if e.source in nodes and e.target in nodes:
            adj[e.source].append(e.target)
            preds[e.target].append(e.source)

    secondary_images: Dict[str, Image.Image] = {}
    for n in payload.nodes:
        if n.type == "multiple_image_input":
            params = n.data.parameters or {}
            target_id = params.get("slot1") or params.get("image_id")
            if target_id:
                img_path = find_image(target_id)
                if img_path:
                    try:
                        secondary_images[n.id] = Image.open(img_path).convert("RGB")
                    except Exception:
                        pass

    outputs: Dict[str, Any] = {}
    statuses: Dict[str, dict] = {}
    logs = []
    final_url = None
    output_type = "image"
    t0 = time.time()

    for nid in val["execution_order"]:
        node = nodes[nid]
        ntype = node.type
        params = node.data.parameters or {}
        n_start = time.time()

        try:
            pred_outputs = []
            for p in preds[nid]:
                if p in outputs and outputs[p] is not None:
                    pred_outputs.append(outputs[p])
                elif p in secondary_images:
                    pred_outputs.append(secondary_images[p])

            if ntype in TEXT_NODE_TYPES:
                text_out = await build_text_node_output(ntype, params, pred_outputs)
                outputs[nid] = {"kind": "text", "text": text_out}
                dur = round((time.time() - n_start) * 1000, 1)
                statuses[nid] = {"status": "success", "duration_ms": dur, "output_dimensions": "text"}
                logs.append({
                    "node_id": nid, "type": ntype,
                    "label": node.data.label or ntype,
                    "status": "success", "duration_ms": dur,
                    "message": f"Enhanced prompt in {dur}ms: {text_out[:120]}",
                })
                continue

            if ntype in AUDIO_GEN_TYPES or ntype == "audio_input" or ntype in AUDIO_PASSTHROUGH_TYPES:
                if ntype in AUDIO_GEN_TYPES:
                    text = str(params.get("text") or params.get("prompt") or "").strip()
                    if not text and ntype == "sound_effects":
                        text = f"Sound effect: {params.get('effect_type') or 'cinematic whoosh'}"
                    if not text and ntype == "bg_music":
                        text = f"Background music: {params.get('genre') or 'ambient synthwave'}"
                    if not text:
                        raise RuntimeError("Enter a text/description for audio generation.")
                    default_audio_model = ("bytedance-seed/seed-audio-1-0"
                                           if ntype in ("sound_effects", "bg_music")
                                           else "heygen/heygen-voice-1-turbo:free")
                    filename = await generate_speech(text, params.get("voice"), params.get("speed"),
                                                     params.get("voice_model") or default_audio_model)
                    out = {"kind": "audio", "filename": filename, "path": str(OUTPUT_DIR / filename)}
                    final_url = filename
                    output_type = "audio"
                elif ntype == "audio_input":
                    aid = params.get("audio_id") or params.get("image_id") or ""
                    path = find_image(str(aid)) if aid else None
                    if not path or path.suffix.lower() not in AUDIO_EXTS:
                        raise RuntimeError("Upload an audio file on the Audio Input node.")
                    out = {"kind": "audio", "filename": path.name, "path": str(path)}
                else:
                    out = next((item for item in pred_outputs
                                if isinstance(item, dict) and item.get("kind") == "audio" and item.get("filename")), None)
                    if out is None:
                        raise RuntimeError(f"Connect an audio input or Text to Speech node before {ntype}.")
                    if ntype == "audio_output":
                        final_url = out["filename"]
                        output_type = "audio"

                outputs[nid] = out
                dur = round((time.time() - n_start) * 1000, 1)
                statuses[nid] = {"status": "success", "duration_ms": dur, "output_dimensions": "audio"}
                if isinstance(out, dict) and out.get("filename"):
                    statuses[nid]["asset_url"] = out["filename"]
                logs.append({
                    "node_id": nid, "type": ntype,
                    "label": node.data.label or ntype,
                    "status": "success", "duration_ms": dur,
                    "message": f"Created audio with {ntype} in {dur}ms." if ntype in AUDIO_GEN_TYPES else f"Processed {ntype} in {dur}ms.",
                })
                continue

            if ntype == "video_audio_merge":
                video_item = next((item for item in pred_outputs
                                   if isinstance(item, dict) and item.get("kind") == "video" and item.get("path")), None)
                audio_item = next((item for item in pred_outputs
                                   if isinstance(item, dict) and item.get("kind") == "audio" and item.get("path")), None)
                if video_item is None:
                    raise RuntimeError("Connect a video generator or Video Input node to Video + Voice.")
                if audio_item is None:
                    raise RuntimeError("Connect a Voiceover, Text to Speech or Audio Input node to Video + Voice.")
                filename = mux_video_audio(Path(video_item["path"]), Path(audio_item["path"]))
                out = {"kind": "video", "filename": filename, "path": str(OUTPUT_DIR / filename)}
                final_url = filename
                output_type = "video"
                outputs[nid] = out
                dur = round((time.time() - n_start) * 1000, 1)
                statuses[nid] = {"status": "success", "duration_ms": dur, "output_dimensions": "video"}
                if out.get("filename"):
                    statuses[nid]["asset_url"] = out["filename"]
                logs.append({
                    "node_id": nid, "type": ntype,
                    "label": node.data.label or ntype,
                    "status": "success", "duration_ms": dur,
                    "message": f"Merged audio into video in {dur}ms.",
                })
                continue

            if ntype in VIDEO_NODE_TYPES:
                predecessor_nodes = [nodes[p] for p in preds[nid] if p in nodes]
                if ntype == "video_input":
                    vid = params.get("video_id") or params.get("image_id") or ""
                    path = find_image(str(vid)) if vid else None
                    if not path or path.suffix.lower() not in VIDEO_EXTS:
                        raise RuntimeError("Upload a video on the Upload Video node.")
                    out = {"kind": "video", "filename": path.name, "path": str(path)}
                elif ntype == "video_url":
                    url = str(params.get("url") or "").strip()
                    if not url.startswith("https://"):
                        raise RuntimeError("Enter an https video URL.")
                    out = {"kind": "video_url", "url": url}
                elif ntype == "video_audio_ref":
                    aid = params.get("audio_id") or params.get("image_id") or ""
                    path = find_image(str(aid)) if aid else None
                    if not path or path.suffix.lower() not in AUDIO_EXTS:
                        raise RuntimeError("Upload an audio file on the Upload Audio node.")
                    out = {"kind": "audio", "filename": path.name, "path": str(path)}
                elif ntype in ("video_output", "video_preview"):
                    out = passthrough_video(pred_outputs)
                    final_url = out["filename"]
                    output_type = "video"
                else:
                    gen_params = dict(params)
                    upstream_text = predecessor_text(pred_outputs)
                    if upstream_text:
                        gen_params["prompt"] = ", ".join(
                            part for part in (str(gen_params.get("prompt") or "").strip(), upstream_text) if part
                        )
                    out = await produce_video(ntype, gen_params, pred_outputs, predecessor_nodes)
                    final_url = out["filename"]
                    output_type = "video"

                outputs[nid] = out
                dur = round((time.time() - n_start) * 1000, 1)
                dims = "video" if out.get("kind") == "video" else out.get("kind", "media")
                statuses[nid] = {"status": "success", "duration_ms": dur, "output_dimensions": dims}
                if isinstance(out, dict) and out.get("filename"):
                    statuses[nid]["asset_url"] = out["filename"]
                logs.append({
                    "node_id": nid, "type": ntype,
                    "label": node.data.label or ntype,
                    "status": "success", "duration_ms": dur,
                    "message": f"Generated {dims} with {ntype} in {dur}ms." if ntype in VIDEO_GEN_TYPES else f"Processed {ntype} ({dims}) in {dur}ms.",
                })
                continue

            if pred_outputs:
                current = pred_outputs[0]
            elif start_img is not None:
                current = start_img.copy()
            else:
                raise RuntimeError("No input image connected.")
            if isinstance(current, dict):
                if current.get("kind") == "text" and ntype == "ai_text_to_image":
                    current = Image.new("RGB", (1024, 1024), (18, 20, 29))
                else:
                    raise RuntimeError(f"{ntype} needs an image, but the connected input is {current.get('kind', 'media')}.")
            second_img = None
            for candidate in pred_outputs[1:]:
                maybe = image_from_output(candidate)
                if maybe is not None:
                    second_img = maybe
                    break
            out = current
            preview_filename = None

            if ntype in ("image_input", "load_image", "video_image_ref"):
                cfg_id = params.get("image_id", "")
                if cfg_id:
                    p_img = find_image(cfg_id)
                    if p_img and is_raster_file(p_img):
                        out = Image.open(p_img).convert("RGB")
                    elif p_img:
                        raise RuntimeError("This input node needs an image file.")
                    else:
                        out = current
                else:
                    out = current

            elif ntype == "multiple_image_input":
                # Check slot1, slot2, slot3, slot4, or image_id
                target_img_id = params.get("slot1") or params.get("image_id") or params.get("slot2")
                if target_img_id:
                    slot_path = find_image(target_img_id)
                    out = Image.open(slot_path).convert("RGB") if slot_path else current
                else:
                    out = current

                # If there is also slot2, store as second image for downstream AI blending
                second_slot_id = params.get("slot2")
                if second_slot_id:
                    s2_path = find_image(second_slot_id)
                    if s2_path:
                        try:
                            secondary_images[nid] = Image.open(s2_path).convert("RGB")
                        except Exception:
                            pass

            elif ntype in AI_OPERATIONS:
                prompt_text = params.get("prompt", "")
                upstream_text = predecessor_text(pred_outputs)
                if upstream_text:
                    prompt_text = ", ".join(part for part in (str(prompt_text).strip(), upstream_text) if part)
                extra_images = None
                if ntype == "ai_multi_image_edit":
                    pred_nodes = [nodes[p] for p in preds[nid] if p in nodes]
                    ref_images = collect_reference_images(pred_outputs, pred_nodes)
                    if ref_images:
                        current = ref_images[0]
                        second_img = ref_images[1] if len(ref_images) > 1 else ref_images[0]
                        extra_images = ref_images[2:]
                out = await execute_ai_op(ntype, current, prompt_text, params, second_img, extra_images=extra_images)

            elif ntype in OPERATIONS_MAP:
                out = OPERATIONS_MAP[ntype](current, params)

            elif ntype in ("save_image", "export_image", "image_output", "image_preview",
                           "download_image", "convert_format", "compress_image"):
                filename = save_output(current, prefix="output")
                preview_filename = filename
                final_url = filename
                out = current

            outputs[nid] = out
            dur = round((time.time() - n_start) * 1000, 1)
            if isinstance(out, Image.Image):
                dims = f"{out.width}x{out.height}"
            elif isinstance(out, dict):
                dims = out.get("kind", "media")
            else:
                dims = "N/A"
            is_ai = ntype in AI_OPERATIONS
            statuses[nid] = {"status": "success", "duration_ms": dur, "output_dimensions": dims}
            if preview_filename:
                statuses[nid]["asset_url"] = preview_filename
            logs.append({
                "node_id": nid, "type": ntype,
                "label": node.data.label or ntype,
                "status": "success", "duration_ms": dur,
                "message": f"{'🤖 AI: ' if is_ai else ''}Processed {ntype} ({dims}) in {dur}ms.",
            })

        except Exception as e:
            dur = round((time.time() - n_start) * 1000, 1)
            statuses[nid] = {"status": "error", "duration_ms": dur, "error": str(e)}
            logs.append({"node_id": nid, "type": ntype, "label": node.data.label or ntype,
                         "status": "error", "duration_ms": dur, "message": f"Failed: {e}"})
            logger.error(f"Node {nid} ({ntype}) failed: {e}")
            raise HTTPException(500, detail={"message": f"Failed at node '{nid}' ({ntype})",
                                             "error": str(e), "node_statuses": statuses, "logs": logs})

    if not final_url and val["execution_order"]:
        last = outputs.get(val["execution_order"][-1])
        if isinstance(last, dict) and last.get("filename"):
            final_url = last["filename"]
            if last.get("kind") == "video":
                output_type = "video"
            elif last.get("kind") == "audio":
                output_type = "audio"
        elif isinstance(last, dict) and last.get("kind") == "text" and last.get("text"):
            text_filename = f"prompt_{uuid.uuid4().hex[:10]}.txt"
            (OUTPUT_DIR / text_filename).write_text(str(last["text"]), encoding="utf-8")
            final_url = text_filename
            output_type = "text"
        elif isinstance(last, Image.Image):
            final_url = save_output(last, prefix="workflow")

    if final_url and str(final_url).lower().endswith(tuple(VIDEO_EXTS)):
        output_type = "video"
    elif final_url and str(final_url).lower().endswith(tuple(AUDIO_EXTS)):
        output_type = "audio"

    return {"success": True, "output_url": final_url, "output_type": output_type,
            "total_duration_ms": round((time.time() - t0) * 1000, 1),
            "node_statuses": statuses, "logs": logs}

@app.post("/api/image/edit")
async def edit_image(req: EditRequest):
    t0 = time.time()
    src = find_image(req.image_id)
    if not src:
        raise HTTPException(404, f"Image '{req.image_id}' not found.")

    plan = req.plan or []
    if not plan and req.prompt:
        if GROQ_API_KEY or OPENAI_API_KEY:
            understood = await build_plan_from_prompt_ai(req.prompt)
        else:
            understood = build_plan_from_prompt(req.prompt)
        plan = understood.get("plan", [])

    if not plan:
        raise HTTPException(400, "No operations to apply.")

    try:
        img = Image.open(src).convert("RGB")
    except Exception as e:
        raise HTTPException(400, f"Could not open image: {e}")

    steps = []
    out_format = "PNG"
    for step in plan:
        op = step.get("operation")
        params = step.get("parameters", {}) or {}
        if op == "convert_format":
            out_format = params.get("format", "PNG").upper()
            continue
        s = time.time()
        if op in OPERATIONS_MAP:
            img = OPERATIONS_MAP[op](img, params)
        elif op in AI_OPERATIONS:
            prompt_text = params.get("prompt", req.prompt or "")
            img = await execute_ai_op(op, img, prompt_text, params)
        steps.append({"operation": op, "duration_ms": round((time.time() - s) * 1000, 1), "parameters": params})

    filename = f"edit_{uuid.uuid4().hex[:10]}.png"
    path = OUTPUT_DIR / filename
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
    img.save(path, out_format if out_format != "JPG" else "JPEG", quality=92)

    return {"success": True, "supported": True, "image_id": filename, "result_url": filename,
            "width": img.width, "height": img.height, "steps_executed": steps,
            "total_duration_ms": round((time.time() - t0) * 1000, 1)}

@app.post("/api/ai/edit-node")
async def ai_edit_node(req: AIEditNodeRequest):
    t0 = time.time()
    if req.node_type in AUDIO_GEN_TYPES:
        speech_text = (req.prompt or "").strip()
        if not speech_text:
            raise HTTPException(400, "Enter the text to convert to speech.")
        try:
            default_audio_model = ("bytedance-seed/seed-audio-1-0"
                                   if req.node_type in ("sound_effects", "bg_music")
                                   else "heygen/heygen-voice-1-turbo:free")
            filename = await generate_speech(speech_text, req.voice, req.speed,
                                             req.voice_model or default_audio_model)
        except Exception as e:
            raise HTTPException(502, str(e))
        return {"success": True, "result_url": filename, "media_type": "audio",
                "duration_ms": round((time.time() - t0) * 1000, 1), "node_type": req.node_type,
                "ai_provider": "openrouter" if req.voice_model else "openai"}

    if req.node_type in VIDEO_GEN_TYPES:
        model_id = req.model or OPENROUTER_VIDEO_MODEL
        if model_id not in OPENROUTER_VIDEO_MODELS:
            model_id = "alibaba/wan-3.0"
        caps = video_model_caps(model_id)
        params = {
            "model": model_id,
            "prompt": req.prompt,
            "script": req.script or "",
            "aspect_ratio": req.aspect_ratio or "16:9",
            "duration": req.duration or 5,
            "resolution": req.resolution or caps["default_resolution"],
        }
        images = []
        if req.image_id and req.image_id != "placeholder":
            opened = open_raster(req.image_id)
            if opened is not None:
                images.append(opened)
            elif req.node_type == "image_to_video":
                path = find_image(req.image_id)
                frame = first_video_frame(path) if path else None
                if frame is not None:
                    images.append(frame)
        if req.reference_image_id:
            ref = open_raster(req.reference_image_id)
            if ref is not None:
                images.append(ref)
        for extra_id in req.image_ids or []:
            if not extra_id or extra_id in (req.image_id, req.reference_image_id):
                continue
            extra_img = open_raster(extra_id)
            if extra_img is not None:
                images.append(extra_img)
        try:
            media = await produce_video(req.node_type, params, images)
        except Exception as e:
            raise HTTPException(502, str(e))
        return {"success": True, "result_url": media["filename"], "media_type": "video",
                "duration_ms": round((time.time() - t0) * 1000, 1), "node_type": req.node_type,
                "ai_provider": "openrouter"}

    img = None
    if req.node_type == "ai_text_to_image":
        img = None
    else:
        src = find_image(req.image_id)
        if not src:
            raise HTTPException(404, f"Image '{req.image_id}' not found.")
        try:
            img = Image.open(src).convert("RGB")
        except Exception as e:
            raise HTTPException(400, f"Could not open image: {e}")

    second_img = None
    if req.reference_image_id:
        ref_path = find_image(req.reference_image_id)
        if ref_path:
            second_img = Image.open(ref_path).convert("RGB")

    extra_images = []
    for extra_id in req.image_ids or []:
        if not extra_id or extra_id in (req.image_id, req.reference_image_id):
            continue
        extra_path = find_image(extra_id)
        if extra_path:
            try:
                extra_images.append(Image.open(extra_path).convert("RGB"))
            except Exception:
                pass

    params = {}
    if req.mask_data:
        params["mask_data"] = req.mask_data
    if req.model:
        params["model"] = req.model
    if req.aspect_ratio:
        params["aspect_ratio"] = req.aspect_ratio
    if req.quality:
        params["quality"] = req.quality

    result = await execute_ai_op(req.node_type, img, req.prompt, params, second_img, extra_images=extra_images)
    filename = save_output(result, prefix=f"ai_{req.node_type}")

    return {"success": True, "result_url": filename, "width": result.width, "height": result.height,
            "duration_ms": round((time.time() - t0) * 1000, 1), "node_type": req.node_type,
            "ai_provider": AI_PROVIDER if (GROQ_API_KEY or OPENAI_API_KEY) else "rule_based"}

@app.post("/api/ai/multi-edit")
async def ai_multi_edit(req: AIMultiEditRequest):
    if len(req.image_ids) < 2:
        raise HTTPException(400, "At least 2 images required for multi-edit.")
    t0 = time.time()
    images = []
    for img_id in req.image_ids:
        src = find_image(img_id)
        if not src:
            raise HTTPException(404, f"Image '{img_id}' not found.")
        images.append(Image.open(src).convert("RGB"))
    result = await execute_ai_multi_image_edit(
        images[0], images[1], req.prompt, {"model": req.model} if req.model else {},
        extra_images=images[2:],
    )
    filename = save_output(result, prefix="multi_edit")
    return {"success": True, "result_url": filename, "width": result.width, "height": result.height,
            "duration_ms": round((time.time() - t0) * 1000, 1), "images_combined": len(images)}

@app.get("/api/templates")
async def get_templates():
    templates = [
        {
            "id": "ai_portrait_enhance", "name": "AI Portrait Enhancement",
            "description": "AI-powered portrait enhancement with smart brightness, sharpening and color correction.",
            "category": "AI Editing",
            "workflow": {
                "nodes": [
                    {"id": "n_in", "type": "image_input", "position": {"x": 80, "y": 160}, "data": {"label": "Portrait Input", "parameters": {}}},
                    {"id": "n_ai", "type": "ai_image_edit", "position": {"x": 380, "y": 160}, "data": {"label": "AI Image Edit", "parameters": {"prompt": "Enhance portrait: smooth skin, brighten eyes, improve overall lighting while keeping the person natural-looking"}}},
                    {"id": "n_sharp", "type": "sharpen", "position": {"x": 680, "y": 160}, "data": {"label": "Sharpen Details", "parameters": {"factor": 1.4}}},
                    {"id": "n_out", "type": "image_output", "position": {"x": 980, "y": 160}, "data": {"label": "Image Output", "parameters": {"format": "PNG", "quality": 95}}},
                ],
                "edges": [{"id": "e1", "source": "n_in", "target": "n_ai"}, {"id": "e2", "source": "n_ai", "target": "n_sharp"}, {"id": "e3", "source": "n_sharp", "target": "n_out"}]
            }
        },
        {
            "id": "ai_background_replace", "name": "AI Background Edit",
            "description": "Edit the background of your photo using AI while keeping the subject intact.",
            "category": "AI Editing",
            "workflow": {
                "nodes": [
                    {"id": "n_in", "type": "image_input", "position": {"x": 80, "y": 160}, "data": {"label": "Source Image", "parameters": {}}},
                    {"id": "n_bg", "type": "ai_background_edit", "position": {"x": 380, "y": 160}, "data": {"label": "AI Background Edit", "parameters": {"prompt": "Make the background blurry and slightly darker to focus on the subject"}}},
                    {"id": "n_out", "type": "image_output", "position": {"x": 680, "y": 160}, "data": {"label": "Image Output", "parameters": {"format": "PNG", "quality": 95}}},
                ],
                "edges": [{"id": "e1", "source": "n_in", "target": "n_bg"}, {"id": "e2", "source": "n_bg", "target": "n_out"}]
            }
        },
        {
            "id": "ai_object_swap", "name": "AI Object Replace",
            "description": "Replace a specific object in your image with another item seamlessly.",
            "category": "AI Editing",
            "workflow": {
                "nodes": [
                    {"id": "n_in", "type": "image_input", "position": {"x": 80, "y": 160}, "data": {"label": "Source Image", "parameters": {}}},
                    {"id": "n_obj", "type": "ai_object_replacement", "position": {"x": 380, "y": 160}, "data": {"label": "AI Object Replace", "parameters": {"prompt": "Replace the object with a modern alternative, keeping scene lighting"}}},
                    {"id": "n_out", "type": "image_output", "position": {"x": 680, "y": 160}, "data": {"label": "Image Output", "parameters": {"format": "PNG", "quality": 95}}},
                ],
                "edges": [{"id": "e1", "source": "n_in", "target": "n_obj"}, {"id": "e2", "source": "n_obj", "target": "n_out"}]
            }
        },
        {
            "id": "image_combine", "name": "AI Multi-Image Blend",
            "description": "Intelligently combine two images together using AI blending.",
            "category": "AI Editing",
            "workflow": {
                "nodes": [
                    {"id": "n_in1", "type": "multiple_image_input", "position": {"x": 80, "y": 80}, "data": {"label": "Image Input 1", "parameters": {"slot": 1}}},
                    {"id": "n_in2", "type": "multiple_image_input", "position": {"x": 80, "y": 240}, "data": {"label": "Image Input 2", "parameters": {"slot": 2}}},
                    {"id": "n_multi", "type": "ai_multi_image_edit", "position": {"x": 380, "y": 160}, "data": {"label": "AI Multi-Image Edit", "parameters": {"prompt": "Blend the two images together naturally and harmoniously"}}},
                    {"id": "n_out", "type": "image_output", "position": {"x": 680, "y": 160}, "data": {"label": "Image Output", "parameters": {"format": "PNG", "quality": 95}}},
                ],
                "edges": [{"id": "e1", "source": "n_in1", "target": "n_multi"}, {"id": "e2", "source": "n_in2", "target": "n_multi"}, {"id": "e3", "source": "n_multi", "target": "n_out"}]
            }
        },
        {
            "id": "classic_enhance", "name": "Classic Photo Enhancement",
            "description": "Resize to 1080x1080, boost contrast, sharpen details and export as PNG.",
            "category": "Classic",
            "workflow": {
                "nodes": [
                    {"id": "n_in", "type": "image_input", "position": {"x": 80, "y": 160}, "data": {"label": "Image Input", "parameters": {}}},
                    {"id": "n_res", "type": "resize", "position": {"x": 380, "y": 160}, "data": {"label": "Resize Image", "parameters": {"width": 1080, "height": 1080, "mode": "fit"}}},
                    {"id": "n_br", "type": "brightness", "position": {"x": 680, "y": 160}, "data": {"label": "Image Brightness", "parameters": {"factor": 1.15}}},
                    {"id": "n_sh", "type": "sharpen", "position": {"x": 980, "y": 160}, "data": {"label": "Sharpen Image", "parameters": {"factor": 1.5}}},
                    {"id": "n_out", "type": "image_output", "position": {"x": 1280, "y": 160}, "data": {"label": "Image Output", "parameters": {"format": "PNG", "quality": 95}}},
                ],
                "edges": [{"id": "e1", "source": "n_in", "target": "n_res"}, {"id": "e2", "source": "n_res", "target": "n_br"}, {"id": "e3", "source": "n_br", "target": "n_sh"}, {"id": "e4", "source": "n_sh", "target": "n_out"}]
            }
        },
        {
            "id": "noir_bw", "name": "Noir Black & White",
            "description": "Classic B&W conversion with deep contrast and cinematic vignette.",
            "category": "Classic",
            "workflow": {
                "nodes": [
                    {"id": "n_in", "type": "image_input", "position": {"x": 80, "y": 160}, "data": {"label": "Image Input", "parameters": {}}},
                    {"id": "n_co", "type": "contrast", "position": {"x": 380, "y": 160}, "data": {"label": "Image Contrast", "parameters": {"factor": 1.4}}},
                    {"id": "n_gr", "type": "grayscale", "position": {"x": 680, "y": 160}, "data": {"label": "Grayscale", "parameters": {}}},
                    {"id": "n_vi", "type": "vignette", "position": {"x": 980, "y": 160}, "data": {"label": "Vignette", "parameters": {"radius": 0.65, "intensity": 0.7}}},
                    {"id": "n_out", "type": "image_output", "position": {"x": 1280, "y": 160}, "data": {"label": "Image Output", "parameters": {"format": "PNG", "quality": 95}}},
                ],
                "edges": [{"id": "e1", "source": "n_in", "target": "n_co"}, {"id": "e2", "source": "n_co", "target": "n_gr"}, {"id": "e3", "source": "n_gr", "target": "n_vi"}, {"id": "e4", "source": "n_vi", "target": "n_out"}]
            }
        },
        {
            "id": "simple_text_prompt", "name": "Text Prompt Enhancer",
            "description": "Turn a plain idea into a vivid generation prompt and preview the text result.",
            "category": "Text",
            "workflow": {
                "nodes": [
                    {"id": "n_text", "type": "prompt_enhancer", "position": {"x": 120, "y": 160}, "data": {"label": "Prompt Enhancer", "parameters": {"prompt": "A lone astronaut walking across a glowing alien desert at dusk, cinematic composition", "style": "cinematic, photorealistic, volumetric lighting"}}},
                    {"id": "n_out", "type": "text_output", "position": {"x": 480, "y": 160}, "data": {"label": "Output", "parameters": {}}},
                ],
                "edges": [{"id": "e1", "source": "n_text", "target": "n_out"}]
            }
        },
        {
            "id": "simple_voiceover", "name": "Voiceover to Audio",
            "description": "Generate a voice track from a script and preview, download or save the audio.",
            "category": "Audio",
            "workflow": {
                "nodes": [
                    {"id": "n_voice", "type": "text_to_speech", "position": {"x": 120, "y": 160}, "data": {"label": "Voiceover", "parameters": {"text": "Welcome to NetRoot AI Chat Studio. Turn your ideas into images, videos and audio in one workflow.", "voice": "Natural English Female", "voice_model": "heygen/heygen-voice-1-turbo:free", "speed": 1.0, "volume": 1.0}}},
                    {"id": "n_out", "type": "audio_output", "position": {"x": 480, "y": 160}, "data": {"label": "Audio Output", "parameters": {}}},
                ],
                "edges": [{"id": "e1", "source": "n_voice", "target": "n_out"}]
            }
        },
        {
            "id": "simple_text_to_video", "name": "Text to Video",
            "description": "Generate a silent video straight from a prompt and preview it on Video Output.",
            "category": "Video",
            "workflow": {
                "nodes": [
                    {"id": "n_t2v", "type": "text_to_video", "position": {"x": 120, "y": 160}, "data": {"label": "Text to Video", "parameters": {"prompt": "Cinematic aerial view of a futuristic city at sunrise, slow forward camera move, volumetric haze", "model": "alibaba/wan-3.0", "duration": 5, "aspect_ratio": "16:9", "resolution": "720p"}}},
                    {"id": "n_out", "type": "video_output", "position": {"x": 480, "y": 160}, "data": {"label": "Video Output", "parameters": {"format": "MP4"}}},
                ],
                "edges": [{"id": "e1", "source": "n_t2v", "target": "n_out"}]
            }
        },
        {
            "id": "cross_text_image_video", "name": "Text → Image → Video",
            "description": "Generate an image from text, preview it, then animate that same image into a video.",
            "category": "Cross Chain",
            "workflow": {
                "nodes": [
                    {"id": "n_t2i", "type": "ai_text_to_image", "position": {"x": 60, "y": 160}, "data": {"label": "Text to Image", "parameters": {"prompt": "Cinematic portrait of a woman walking through neon-lit Tokyo at night, shallow depth of field, film grain", "model": "black-forest-labs/flux-3-image-klein", "aspect_ratio": "16:9", "quality": "standard"}}},
                    {"id": "n_preview", "type": "image_preview", "position": {"x": 380, "y": 160}, "data": {"label": "Image Preview", "parameters": {}}},
                    {"id": "n_i2v", "type": "image_to_video", "position": {"x": 700, "y": 160}, "data": {"label": "Image to Video", "parameters": {"prompt": "Slow push-in, neon reflections shimmering on wet pavement, subtle camera drift", "model": "alibaba/wan-3.0", "duration": 5, "aspect_ratio": "16:9", "resolution": "720p"}}},
                    {"id": "n_out", "type": "video_output", "position": {"x": 1020, "y": 160}, "data": {"label": "Video Output", "parameters": {"format": "MP4"}}},
                ],
                "edges": [
                    {"id": "e1", "source": "n_t2i", "target": "n_preview"},
                    {"id": "e2", "source": "n_preview", "target": "n_i2v"},
                    {"id": "e3", "source": "n_i2v", "target": "n_out"},
                ]
            }
        },
        {
            "id": "cross_text_image_video_voice", "name": "Text → Image → Video + Voice",
            "description": "Text generates the image, the image becomes a video, and a scripted voiceover is merged into the final MP4.",
            "category": "Cross Chain",
            "workflow": {
                "nodes": [
                    {"id": "n_t2i", "type": "ai_text_to_image", "position": {"x": 60, "y": 140}, "data": {"label": "Text to Image", "parameters": {"prompt": "Cinematic wide shot of a lighthouse on a stormy coast at blue hour, dramatic clouds, photorealistic", "model": "black-forest-labs/flux-3-image-klein", "aspect_ratio": "16:9", "quality": "standard"}}},
                    {"id": "n_i2v", "type": "image_to_video", "position": {"x": 380, "y": 140}, "data": {"label": "Image to Video", "parameters": {"prompt": "Waves crashing, slow aerial drift toward the lighthouse, storm light shifting", "model": "alibaba/wan-3.0", "duration": 5, "aspect_ratio": "16:9", "resolution": "720p"}}},
                    {"id": "n_voice", "type": "voiceover", "position": {"x": 380, "y": 430}, "data": {"label": "Voiceover", "parameters": {"text": "Even the darkest storms cannot dim a steady light.", "voice": "Natural English Female", "voice_model": "heygen/heygen-voice-1-turbo:free", "speed": 1.0, "volume": 1.0}}},
                    {"id": "n_merge", "type": "video_audio_merge", "position": {"x": 700, "y": 260}, "data": {"label": "Video + Voice", "parameters": {}}},
                    {"id": "n_out", "type": "video_output", "position": {"x": 1020, "y": 260}, "data": {"label": "Video Output", "parameters": {"format": "MP4"}}},
                ],
                "edges": [
                    {"id": "e1", "source": "n_t2i", "target": "n_i2v"},
                    {"id": "e2", "source": "n_i2v", "target": "n_merge"},
                    {"id": "e3", "source": "n_voice", "target": "n_merge"},
                    {"id": "e4", "source": "n_merge", "target": "n_out"},
                ]
            }
        },
        {
            "id": "cross_image_video_voice", "name": "Image → Video + Voice",
            "description": "Upload a photo, animate it into a video, and merge a voiceover track into the final MP4.",
            "category": "Cross Chain",
            "workflow": {
                "nodes": [
                    {"id": "n_img", "type": "image_input", "position": {"x": 60, "y": 140}, "data": {"label": "Image Input", "parameters": {}}},
                    {"id": "n_i2v", "type": "image_to_video", "position": {"x": 380, "y": 140}, "data": {"label": "Image to Video", "parameters": {"prompt": "Gentle parallax camera move, natural ambient motion, cinematic depth", "model": "alibaba/wan-3.0", "duration": 5, "aspect_ratio": "16:9", "resolution": "720p"}}},
                    {"id": "n_voice", "type": "voiceover", "position": {"x": 380, "y": 430}, "data": {"label": "Voiceover", "parameters": {"text": "This moment, brought to life.", "voice": "Natural English Female", "voice_model": "heygen/heygen-voice-1-turbo:free", "speed": 1.0, "volume": 1.0}}},
                    {"id": "n_merge", "type": "video_audio_merge", "position": {"x": 700, "y": 260}, "data": {"label": "Video + Voice", "parameters": {}}},
                    {"id": "n_out", "type": "video_output", "position": {"x": 1020, "y": 260}, "data": {"label": "Video Output", "parameters": {"format": "MP4"}}},
                ],
                "edges": [
                    {"id": "e1", "source": "n_img", "target": "n_i2v"},
                    {"id": "e2", "source": "n_i2v", "target": "n_merge"},
                    {"id": "e3", "source": "n_voice", "target": "n_merge"},
                    {"id": "e4", "source": "n_merge", "target": "n_out"},
                ]
            }
        },
    ]
    return {"templates": templates}

WORKFLOWS_FILE = BASE_DIR / "runtime" / "saved_workflows.json"

class SaveWorkflowRequest(BaseModel):
    name: str = "My Workflow"
    description: Optional[str] = ""
    nodes: List[Dict[str, Any]] = []
    edges: List[Dict[str, Any]] = []

@app.get("/api/saved-workflows")
async def get_saved_workflows():
    if not WORKFLOWS_FILE.exists():
        return {"workflows": []}
    try:
        data = json.loads(WORKFLOWS_FILE.read_text(encoding="utf-8"))
        return {"workflows": data}
    except Exception as e:
        logger.error(f"Failed to read saved workflows: {e}")
        return {"workflows": []}

@app.post("/api/saved-workflows")
async def save_user_workflow(req: SaveWorkflowRequest):
    workflows = []
    if WORKFLOWS_FILE.exists():
        try:
            workflows = json.loads(WORKFLOWS_FILE.read_text(encoding="utf-8"))
        except Exception:
            workflows = []
    
    wf_id = f"saved_wf_{int(time.time())}_{uuid.uuid4().hex[:4]}"
    new_wf = {
        "id": wf_id,
        "name": req.name or "Untitled Workflow",
        "description": req.description or f"Created on {time.strftime('%Y-%m-%d %H:%M')}",
        "nodes": req.nodes,
        "edges": req.edges,
        "created_at": time.time(),
    }
    workflows.insert(0, new_wf)
    try:
        WORKFLOWS_FILE.write_text(json.dumps(workflows, indent=2), encoding="utf-8")
        return {"success": True, "workflow": new_wf}
    except Exception as e:
        raise HTTPException(500, f"Could not save workflow: {e}")

@app.delete("/api/saved-workflows/{wf_id}")
async def delete_saved_workflow(wf_id: str):
    if not WORKFLOWS_FILE.exists():
        return {"success": True}
    try:
        workflows = json.loads(WORKFLOWS_FILE.read_text(encoding="utf-8"))
        filtered = [w for w in workflows if w.get("id") != wf_id]
        WORKFLOWS_FILE.write_text(json.dumps(filtered, indent=2), encoding="utf-8")
        return {"success": True}
    except Exception as e:
        raise HTTPException(500, f"Could not delete workflow: {e}")

@app.get("/api/projects")
async def list_projects():
    return {"projects": []}

@app.post("/api/projects")
async def save_project():
    return {"success": True}

@app.on_event("startup")
async def on_startup():
    _ensure_library_index()
    logger.info(f"AI Image Edit backend ready. Uploads: {UPLOAD_DIR}")
    logger.info(f"AI Provider: {AI_PROVIDER}, Available: {bool(GROQ_API_KEY or OPENAI_API_KEY)}")

if __name__ == "__main__":
    port = int(os.getenv("EDIT_STUDIO_PORT", 8000))
    host = os.getenv("EDIT_STUDIO_HOST", "0.0.0.0")
    uvicorn.run(app, host=host, port=port)
