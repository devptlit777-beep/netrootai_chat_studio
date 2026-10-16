import os
import re
import time
from pathlib import Path
from typing import List, Union, Optional
import requests
import uvicorn
from pydantic import BaseModel, Field
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from llm_planner import (
    GROQ_API_KEY,
    GROQ_API_URL,
    DEFAULT_MODEL,
    SlideDSL,
    GenerateRequest,
    GenerateResponse,
    OutlineRequest,
    OutlineResponse,
    generate_outline,
    plan_slide,
    regenerate_single_slide,
    restyle_text_with_ai,
    suggest_slide_point,
    copilot_edit_slide,
)
from pptx_builder import generate_pptx
from image_service import fetch_web_image, search_unsplash_candidates, fetch_image_as_data_uri

# Load root .env first, then local directory fallback
_CURRENT_DIR = Path(__file__).resolve().parent
_ROOT_ENV = _CURRENT_DIR.parent / ".env" if _CURRENT_DIR.name == "ppt-service" else _CURRENT_DIR / ".env"
if _ROOT_ENV.exists():
    load_dotenv(_ROOT_ENV)
load_dotenv()

# Initialize FastAPI application
app = FastAPI(
    title="AI Slide Generator Pro",
    description="Full-stack AI presentation generator powered by Groq Cloud & Local LLMs."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def index():
    return {
        "status": "ok",
        "service": "NetRoot AI Slide Generator Pro",
        "version": "1.0.0"
    }


@app.get("/api/models")
async def api_get_models():
    """Fetches list of available models from Groq Cloud."""
    groq_models = []
    if GROQ_API_KEY:
        try:
            resp = requests.get(
                f"{GROQ_API_URL}/models",
                headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
                timeout=4
            )
            if resp.ok:
                data = resp.json()
                raw_models = [m["id"] for m in data.get("data", [])]
                chat_models = [
                    m for m in raw_models
                    if not any(x in m.lower() for x in ["whisper", "guard", "audio", "embed"])
                ]
                qwen_models = [m for m in chat_models if "qwen" in m.lower()]
                groq_models = qwen_models if qwen_models else ["qwen/qwen3.8-27b"]
        except Exception as e:
            print(f"[Models Fetch Warning] Groq: {e}")

    all_models = groq_models if groq_models else [DEFAULT_MODEL]

    return {
        "models": all_models,
        "default": DEFAULT_MODEL,
        "active_provider": "groq"
    }



@app.post("/api/generate-outline", response_model=OutlineResponse)
async def api_generate_outline(req: OutlineRequest):
    """Generates an initial editable outline/agenda for the presentation (~300ms)."""
    return generate_outline(
        prompt=req.prompt,
        model_name=req.model,
        num_slides=req.num_slides
    )


@app.post("/api/generate", response_model=GenerateResponse)
async def api_generate(req: GenerateRequest):
    """Generates structured presentation slides using local or Groq LLM (1 to 10 slides)."""
    return plan_slide(
        prompt=req.prompt,
        model_name=req.model,
        num_slides=req.num_slides,
        uploaded_images=req.uploaded_images,
        outline=req.outline,
        theme=getattr(req, "theme", None),
        theme_seed_hex=getattr(req, "theme_seed_hex", None)
    )


class RegenerateSlideRequest(BaseModel):
    prompt: str
    slide_index: int = 0
    total_slides: int = 1
    current_title: str = ""
    current_layout: Optional[str] = None
    model: str = DEFAULT_MODEL
    used_images: Optional[List[str]] = None


class SearchImageRequest(BaseModel):
    query: Optional[str] = None
    slide_title: Optional[str] = None
    global_topic: Optional[str] = None
    used_images: Optional[List[str]] = None


@app.post("/api/regenerate-slide")
async def api_regenerate_slide(req: RegenerateSlideRequest):
    """Regenerates a single slide's content and visual using Groq LLM."""
    used_set = set(req.used_images or [])
    try:
        new_slide = regenerate_single_slide(
            prompt=req.prompt,
            slide_index=req.slide_index,
            total_slides=req.total_slides,
            current_title=req.current_title,
            current_layout=req.current_layout,
            model_name=req.model,
            used_images=used_set
        )
        return {"slide": new_slide, "success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/search-image")
async def api_search_image_post(req: SearchImageRequest):
    """Fetches an image with deduplication and candidate fallback."""
    used_set = set(req.used_images or [])
    img_data = fetch_web_image(
        query=req.query,
        slide_title=req.slide_title,
        global_topic=req.global_topic,
        used_images=used_set
    )
    return {"query": req.query, "image_data": img_data}


@app.get("/api/search-image")
async def api_search_image(query: str):
    """Searches web/Wikipedia for an image matching the query using BeautifulSoup."""
    img_data = fetch_web_image(query)
    if img_data:
        return {"query": query, "image_data": img_data}
    return {"query": query, "image_data": None}


class FetchCandidateImageRequest(BaseModel):
    url: str


@app.get("/api/search-image-candidates")
async def api_search_image_candidates(query: str = "technology", source: str = "all"):
    """Returns candidate stock photos or Wikipedia visuals for the Change Photo modal."""
    candidates = search_unsplash_candidates(query=query, per_page=12, source=source)
    return {"query": query, "source": source, "candidates": candidates}


class RestyleTextRequest(BaseModel):
    text: str
    instruction: Optional[str] = ""
    slide_title: Optional[str] = ""
    model: Optional[str] = DEFAULT_MODEL


class SuggestPointRequest(BaseModel):
    slide_title: str
    existing_points: Optional[List[str]] = None
    topic: Optional[str] = ""
    instruction: Optional[str] = ""
    model: Optional[str] = DEFAULT_MODEL


class CopilotEditRequest(BaseModel):
    instruction: str
    slide: dict
    deck_topic: Optional[str] = ""
    model: Optional[str] = DEFAULT_MODEL


@app.post("/api/restyle-text")
async def api_restyle_text(req: RestyleTextRequest):
    """Restyles/rewrites a single bullet point or sentence strictly according to user instruction."""
    clean_text = req.text.strip()
    if not clean_text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    restyled = restyle_text_with_ai(
        text=clean_text,
        instruction=req.instruction or "",
        slide_title=req.slide_title or "",
        model_name=req.model or DEFAULT_MODEL
    )
    return {"original": clean_text, "restyled": restyled, "instruction": req.instruction}


@app.post("/api/suggest-point")
async def api_suggest_point(req: SuggestPointRequest):
    """Auto-generates one meaningful complementary bullet point for the active slide."""
    new_point = suggest_slide_point(
        slide_title=req.slide_title,
        existing_points=req.existing_points or [],
        topic=req.topic or "",
        instruction=req.instruction or "",
        model_name=req.model or DEFAULT_MODEL
    )
    return {"point": new_point}


@app.post("/api/copilot-edit-slide")
async def api_copilot_edit_slide(req: CopilotEditRequest):
    """Modifies the active slide according to a natural-language copilot command."""
    if not req.instruction.strip():
        raise HTTPException(status_code=400, detail="Instruction cannot be empty")
    updated_slide, summary = copilot_edit_slide(
        slide_dict=req.slide,
        instruction=req.instruction,
        deck_topic=req.deck_topic or "",
        model_name=req.model or DEFAULT_MODEL
    )
    return {"slide": updated_slide, "summary": summary}


@app.post("/api/fetch-candidate-image")
async def api_fetch_candidate_image(req: FetchCandidateImageRequest):
    """Downloads candidate image from URL and converts to base64 data URI."""
    data_uri = fetch_image_as_data_uri(req.url)
    if not data_uri:
        raise HTTPException(status_code=400, detail="Unable to fetch candidate image.")
    return {"data_uri": data_uri}



@app.post("/api/render")
async def api_render_pptx(payload: Union[List[SlideDSL], SlideDSL, dict]):
    """Renders validated Slide DSL into an in-memory downloadable PowerPoint (.pptx) stream."""
    theme = "midnight"
    seed_hex = None
    title = "Presentation"
    if isinstance(payload, dict):
        theme = str(payload.get("theme", "midnight"))
        seed_hex = payload.get("theme_seed_hex") or payload.get("seed_color")
        title = payload.get("deck_title") or (payload.get("slides", [{}])[0].get("t") if payload.get("slides") else "Presentation")
    elif isinstance(payload, list) and payload:
        title = payload[0].t if hasattr(payload[0], 't') else payload[0].get('t', 'Presentation')
        
    clean_title = re.sub(r"[^\w\s-]", "", str(title)).strip()
    clean_title = re.sub(r"[\s]+", "_", clean_title)[:50] or "Presentation"
    effective_theme_or_seed = seed_hex or theme
    pptx_stream = generate_pptx(payload, theme_name=effective_theme_or_seed)
    return StreamingResponse(
        pptx_stream,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        headers={
            "Content-Disposition": f'attachment; filename="{clean_title}.pptx"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )


if __name__ == "__main__":
    host = os.getenv("PPT_HOST") or os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PPT_PORT") or os.getenv("PORT", 8001))
    print("=" * 60)
    print(f"Starting AI Slide Generator Server on http://{host}:{port}")
    if GROQ_API_KEY:
        print(f"Connected to Groq Cloud (Default Model: {DEFAULT_MODEL})")
    else:
        print("Warning: GROQ_API_KEY is not configured in .env file.")
    print("=" * 60)
    uvicorn.run("app:app", host=host, port=port, reload=True)

