import os
import re
import time
import json
import copy
import base64
import requests
from enum import Enum
from typing import List, Union, Optional, Tuple, Dict, Any, Set
from pydantic import BaseModel, Field, ValidationError, model_validator
from pathlib import Path
from dotenv import load_dotenv

# Load root .env first, then local directory fallback
_CURRENT_DIR = Path(__file__).resolve().parent
_ROOT_ENV = _CURRENT_DIR.parent / ".env" if _CURRENT_DIR.name == "ppt-service" else _CURRENT_DIR / ".env"
if _ROOT_ENV.exists():
    load_dotenv(_ROOT_ENV)
load_dotenv()

GROQ_API_KEY = os.getenv("PPT_GROQ_API_KEY") or os.getenv("GROQ_API_KEY", "")
GROQ_API_URL = os.getenv("PPT_GROQ_API_URL") or os.getenv("GROQ_API_URL", "https://api.groq.com/openai/v1")
DEFAULT_MODEL = os.getenv("PPT_MODEL") or os.getenv("PPT_DEFAULT_MODEL") or os.getenv("DEFAULT_MODEL", "qwen/qwen3.8-27b")



from image_service import fetch_web_image, describe_user_image, get_image_fingerprint

class LayoutType(str, Enum):
    hero = "hero"
    title_content = "title_content"
    two_col = "2col"
    three_col = "3col"
    title_image_right = "title_image_right"
    stats = "stats"
    timeline = "timeline"
    chart_slide = "chart_slide"
    flowchart = "flowchart"
    statement = "statement"


class SlideDSL(BaseModel):
    model_config = {"extra": "ignore"}
    l: LayoutType = Field(..., description="Slide layout type: 'hero', 'stats', 'timeline', 'chart_slide', 'flowchart', 'title_image_right', '2col', '3col', 'title_content', or 'statement'")
    t: str = Field(..., description="Slide title")
    c: List[Any] = Field(..., description="Content elements, column arrays, stat triples, timeline items, flowchart nodes, or statement text")
    image_query: Optional[str] = Field(default=None, description="Keywords to fetch relevant web visual")
    attached_image_id: Optional[str] = Field(default=None, description="ID of user uploaded image attached to this slide")
    image_data: Optional[str] = Field(default=None, description="Base64 data or image URL for frontend and PPTX")
    image_scale: Optional[float] = Field(default=1.0, description="Image scale multiplier (e.g. 0.5 to 1.5)")
    chart_type: Optional[str] = Field(default="bar", description="Chart type for chart_slide: 'bar', 'line', or 'donut'")
    chart_data: Optional[Dict[str, Any]] = Field(default=None, description="Chart dataset: title, categories, series [{name, values}]")
    theme_mode: Optional[str] = Field(default=None, description="Per-slide theme mode: 'dark', 'light_canvas', or 'light_cards'. If omitted, assigned dynamically by rhythm engine.")
    theme: Optional[str] = Field(default=None, description="Per-slide theme: 'blush', 'midnight', 'clean', 'aurora', 'emerald'")
    seed_color: Optional[str] = Field(default=None, description="Per-slide primary accent color hex")


class UploadedImageItem(BaseModel):
    id: str
    filename: str = ""
    user_hint: str = ""
    data_base64: str = ""


class GenerationMetrics(BaseModel):
    input_tokens: int = 0
    output_tokens: int = 0
    total_tokens: int = 0
    latency_ms: int = 0


class ValidationStatus(BaseModel):
    valid: bool
    error: Optional[str] = None


class OutlineItem(BaseModel):
    model_config = {"extra": "ignore"}
    slide_index: int = Field(default=1)
    title: str = Field(default="")
    suggested_layout: str = Field(default="title_content")
    purpose: str = Field(default="")
    subtopics: List[str] = Field(default_factory=list)

    @model_validator(mode="before")
    @classmethod
    def populate_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "slide_num" in data and "slide_index" not in data:
                data["slide_index"] = data["slide_num"]
            if "t" in data and "title" not in data:
                data["title"] = data["t"]
            if "layout_hint" in data and "suggested_layout" not in data:
                data["suggested_layout"] = data["layout_hint"]
        return data

    @property
    def slide_num(self) -> int:
        return self.slide_index

    @property
    def t(self) -> str:
        return self.title

    @property
    def layout_hint(self) -> str:
        return self.suggested_layout


class OutlineRequest(BaseModel):
    prompt: str
    model: str = DEFAULT_MODEL
    num_slides: int = Field(default=3, ge=1, le=10)


class OutlineResponse(BaseModel):
    prompt: str
    recommended_theme: str = "midnight"
    theme_seed_hex: Optional[str] = Field(default=None, description="Primary topic seed hex code")
    slides: List[OutlineItem]
    metrics: GenerationMetrics


class GenerateRequest(BaseModel):
    prompt: str
    model: str = DEFAULT_MODEL
    num_slides: int = Field(default=1, ge=1, le=10, description="Number of slides to generate (1 to 10)")
    uploaded_images: Optional[List[UploadedImageItem]] = Field(default_factory=list, description="User uploaded images")
    outline: Optional[List[Dict[str, Any]]] = Field(default=None, description="Optional user-approved agenda outline")
    theme: Optional[str] = Field(default=None, description="Optional theme override: blush, amber, crimson, emerald, clean, aurora, midnight")
    theme_seed_hex: Optional[str] = Field(default=None, description="Optional primary seed hex code")


class GenerateResponse(BaseModel):
    slides: List[SlideDSL] = Field(default_factory=list, description="List of generated slides")
    slide: Optional[SlideDSL] = Field(default=None, description="Primary slide for backward compatibility")
    theme: Optional[str] = Field(default="midnight", description="AI recommended theme: 'midnight', 'clean', 'aurora', 'emerald'")
    theme_seed_hex: Optional[str] = Field(default=None, description="Primary topic seed hex code")
    metrics: GenerationMetrics
    validation: ValidationStatus


def extract_prompt_color_and_theme(prompt: str) -> Tuple[str, str, bool]:
    """
    Analyzes user prompt for explicit color requests or theme indications.
    Returns (theme_name, seed_hex, is_user_explicit)
    where is_user_explicit=True means the user specifically requested a color or theme in the prompt,
    so it must strictly override any general LLM recommendation.
    """
    p = str(prompt or "")
    p_lower = p.lower()

    # 1. Direct Hex Code in prompt (e.g. "#FF69B4", "#FF1493", "#EC4899")
    hex_match = re.search(r"#(?:[0-9a-fA-F]{3}){1,2}\b", p)
    if hex_match:
        h_val = hex_match.group(0).upper()
        h_clean = h_val.lstrip("#")
        if len(h_clean) == 3:
            h_clean = "".join(c * 2 for c in h_clean)
        if len(h_clean) == 6:
            r = int(h_clean[0:2], 16) / 255.0
            g = int(h_clean[2:4], 16) / 255.0
            b = int(h_clean[4:6], 16) / 255.0
            import colorsys
            hue, _, _ = colorsys.rgb_to_hls(r, g, b)
            if 0.04 < hue <= 0.14:
                thm = "amber"
            elif 0.14 < hue <= 0.44:
                thm = "emerald"
            elif 0.44 < hue <= 0.58:
                thm = "midnight"
            elif 0.58 < hue <= 0.74:
                thm = "clean"
            elif 0.74 < hue <= 0.83:
                thm = "aurora"
            elif 0.83 < hue < 0.96:
                thm = "blush"  # True Pink / Rose / Magenta
            else:
                thm = "crimson"  # True Red
        else:
            thm = "blush"
        return thm, h_val, True

    # 2. Explicit Natural Color Names (Highest Priority)
    # Pink / Baby Pink / Rose / Blush
    if any(k in p_lower for k in [
        "baby pink", "pastel pink", "blush pink", "soft pink", "pink", "rose", "blush",
        "magenta", "fuchsia", "hot pink", "light pink", "deep pink"
    ]):
        return "blush", "#F472B6", True

    # Yellow / Gold / Amber
    if any(k in p_lower for k in [
        "gold", "golden", "amber", "yellow", "lemon", "honey", "mustard", "warm gold"
    ]):
        return "amber", "#F59E0B", True

    # Emerald / Mint / Green
    if any(k in p_lower for k in [
        "emerald", "mint", "green", "lime", "sage", "olive", "forest green", "dark green", "light green"
    ]):
        return "emerald", "#10B981", True

    # Purple / Violet / Lavender
    if any(k in p_lower for k in [
        "purple", "violet", "lavender", "lilac", "plum", "neon purple", "dark purple"
    ]):
        return "aurora", "#A855F7", True

    # Red / Crimson / Ruby
    if any(k in p_lower for k in [
        "crimson", "ruby", "maroon", "burgundy", "scarlet", "red", "dark red"
    ]):
        return "crimson", "#EF4444", True

    # Cyan / Sky Blue / Teal
    if any(k in p_lower for k in [
        "sky blue", "cyan", "teal", "turquoise", "aqua", "electric cyan", "ice blue"
    ]):
        return "midnight", "#06B6D4", True

    # Corporate Blue / Royal Blue / Navy
    if any(k in p_lower for k in [
        "navy", "royal blue", "corporate blue", "cobalt", "dark blue", "blue"
    ]):
        return "clean", "#2563EB", True

    # Orange / Coral / Peach
    if any(k in p_lower for k in [
        "coral", "peach", "orange", "tangerine", "apricot", "sunset orange"
    ]):
        return "amber", "#FB923C", True

    # Explicit Theme Words
    if any(k in p_lower for k in ["dark mode", "dark theme", "obsidian", "black theme", "black color", "dark", "black"]):
        return "midnight", "#0EA5E9", True
    if any(k in p_lower for k in ["light mode", "light theme", "white theme", "white color", "clean theme", "light", "white"]):
        return "clean", "#2563EB", True

    # 3. Domain Fallbacks (is_user_explicit = False)
    if any(k in p_lower for k in ["girl", "party wear", "beauty", "cosmetic", "dress"]):
        return "blush", "#F472B6", False
    if any(k in p_lower for k in ["sustainab", "climat", "agri", "farm", "wellness", "eco", "bio", "plant"]):
        return "emerald", "#10B981", False
    if any(k in p_lower for k in ["corporate", "finance", "legal", "law", "govern", "audit", "bank", "consult"]):
        return "clean", "#2563EB", False
    if any(k in p_lower for k in ["crypto", "web3", "creativ", "music", "metaverse", "gaming"]):
        return "aurora", "#8B5CF6", False
    if any(k in p_lower for k in ["luxury"]):
        if any(k in p_lower for k in ["kid", "girl", "child", "fashion", "dress", "wear", "apparel"]):
            return "blush", "#F472B6", False
        return "amber", "#D97706", False
    if any(k in p_lower for k in ["health", "medic", "pharma", "biotech", "care", "clinic"]):
        return "clean", "#0284C7", False
    if any(k in p_lower for k in ["energy", "solar", "battery", "grid", "power", "hardware", "logistics"]):
        return "amber", "#F59E0B", False
    if any(k in p_lower for k in ["ai", "robot", "cloud", "devops", "cyber", "security", "infra", "tech"]):
        return "midnight", "#06B6D4", False

    return "midnight", "#0EA5E9", False


def infer_topic_theme(prompt: str) -> str:
    """Intelligently detects presentation aesthetic mood from topic keywords."""
    theme, _, _ = extract_prompt_color_and_theme(prompt)
    return theme


def infer_topic_seed_color(prompt: str) -> str:
    """Detects brand hex code from user prompt or infers optimal seed color based on natural color names or domain."""
    _, seed, _ = extract_prompt_color_and_theme(prompt)
    return seed


def apply_dynamic_rhythm(slides: List[SlideDSL]) -> List[SlideDSL]:
    """
    Ensures an executive presentation rhythm across the deck:
    - Slide 1 (Hero/Cover) -> 'dark' (Keynote Hook)
    - Middle Slides -> Alternates between 'light_canvas' (rich pastel bento/roadmap) and 'light_cards' (tinted card stats/comparison)
    - Final Slide -> 'dark' (Strategic Keynote Close)
    Preserves any explicit user or LLM override.
    """
    total = len(slides)
    if total == 0:
        return slides

    for i, slide in enumerate(slides):
        if getattr(slide, "theme_mode", None):
            continue

        l_key = str(getattr(slide.l, "value", slide.l)).split(".")[-1].lower()
        if i == 0 or l_key == "hero":
            slide.theme_mode = "dark"
        elif i == total - 1 and total > 2:
            slide.theme_mode = "dark"
        elif l_key in ("timeline", "flowchart", "title_content"):
            slide.theme_mode = "light_canvas"
        elif l_key in ("stats", "2col", "3col", "chart_slide"):
            slide.theme_mode = "light_cards"
        else:
            slide.theme_mode = "light_canvas"

    return slides


def clean_presentation_title(prompt: str) -> str:
    """Extracts a clean, executive presentation title from user prompt, stripping command phrases."""
    p = (prompt or "").strip()
    if not p:
        return "Executive Presentation"
    patterns = [
        r"^(?:please\s+)?(?:create|make|generate|build|design|write|produce)\s+(?:a|an)?\s*(?:new\s+)?(?:comprehensive\s+|detailed\s+|high-stakes\s+)?(?:professional\s+)?(?:presentation|pitch\s+deck|slide\s+deck|slides?|deck|ppt|masterclass)(?:\s+on|\s+about|\s+for)?\s*[:\-]?\s*",
        r"^(?:explain|overview\s+of|introduction\s+to)\s+[:\-]?\s*",
        r"^(?:design\s+a\s+\d+[- ]slide\s+(?:masterclass|deck|presentation)(?:\s+on)?)\s*[:\-]?\s*"
    ]
    cleaned = p
    for pat in patterns:
        cleaned = re.sub(pat, "", cleaned, flags=re.IGNORECASE).strip()
    
    first_clause = re.split(r"[,;:\n]|(?:\s+covering\s+)|\s+for\s+university|\s+explaining\s+", cleaned, flags=re.IGNORECASE)[0].strip()
    if 3 <= len(first_clause) <= 60:
        cleaned = first_clause
    else:
        cleaned = cleaned[:55].strip()
    
    cleaned = re.sub(r"[\.,;:\-]+$", "", cleaned).strip()
    return cleaned.title() if cleaned.islower() else (cleaned or "Executive Presentation")


OUTLINE_PLANNER_SYSTEM_PROMPT = """You are an expert universal presentation designer, content strategist, and visual storytelling specialist.
Given a presentation topic and requested slide count, generate an accurate, coherent, and thoughtfully structured slide outline.
Do NOT write full slides yet. Formulate the agenda, purpose, layout hint, and key subtopics (if any) for each slide.

CORE PRINCIPLES:
1. TOPIC-FIRST CONTENT:
   - Adapt your tone, structure, and language to match the subject (cultural, spiritual, historical, educational, scientific, technical, artistic, or business).
   - Never force corporate terminology or business KPIs into cultural, spiritual, or historical topics. Respect cultural and religious context.
2. INTELLIGENT LAYOUT SELECTION:
   - Available layouts: ['hero', 'title_image_right', 'timeline', 'flowchart', '2col', '3col', 'title_content', 'statement', 'stats', 'chart_slide'].
   - Choose layouts based on the slide's actual communication goal. Do NOT force unnatural layouts or diversity quotas.
   - For sequences, chronology, eras, or rituals (e.g. Seva Kram): prioritize 'timeline'.
   - For processes and connected workflows: use 'flowchart'.
   - For core principles, pillars, or comparisons: use '2col' or '3col'.
   - For narrative storytelling with visuals: use 'title_image_right'.
   - Never suggest 'chart_slide' unless the topic explicitly involves financial metrics, numerical data, or budgets.
3. THEME SELECTION:
   - Select the theme that best supports the content: 'blush', 'midnight', 'clean', 'aurora', 'emerald', 'amber', 'crimson'.
4. STRICT JSON OUTPUT:
   - Output ONLY a valid JSON object matching the requested schema. No markdown fences or chatter.

OUTPUT FORMAT (JSON):
{
  "recommended_theme": "<blush | midnight | clean | aurora | emerald | amber | crimson>",
  "slides": [
    {
      "slide_index": 1,
      "title": "<Specific, Meaningful Slide Title>",
      "purpose": "<Brief 1-line purpose>",
      "suggested_layout": "<hero | title_image_right | timeline | flowchart | 2col | 3col | title_content | statement | stats | chart_slide>",
      "subtopics": [ "<Meaningful Subtopic 1>", "<Meaningful Subtopic 2>" ]
    }
  ]
}
"""


SLIDE_PLANNER_SYSTEM_PROMPT = """You are an expert universal presentation designer, content strategist, and visual storytelling specialist.

Your mission is to create accurate, engaging, coherent, and visually well-designed presentations for any topic, including cultural, spiritual, historical, educational, scientific, technical, artistic, and business subjects.

CORE PRINCIPLES:

1. TOPIC-FIRST CONTENT
- Understand the user's topic, audience, purpose, and requested slide count before planning.
- Adapt the language, tone, depth, examples, and structure to the subject.
- Never force corporate terminology, business KPIs, financial metrics, or management frameworks into cultural, spiritual, historical, or conceptual topics.
- Respect cultural and religious context. Do not invent historical facts, religious practices, quotations, scripture references, or statistics.
- Prioritize factual accuracy, meaningful storytelling, and audience understanding.

2. INTELLIGENT LAYOUT SELECTION
Choose the most suitable layout independently for each slide based on its actual content and communication goal.

Available layouts:
- hero: Cover slide or visually striking introduction.
- title_image_right: Image-led storytelling with meaningful supporting content.
- timeline: Historical chronology, sequences, rituals, milestones, or phased plans.
- flowchart: Processes, workflows, lifecycles, and connected stages.
- 2col: Comparisons, paired concepts, or two related categories.
- 3col: Three meaningful pillars, categories, or complementary ideas.
- title_content: Structured explanations, detailed concepts, and readable bullet points.
- statement: A meaningful quotation, philosophy, key insight, or central message.
- stats: Important numerical facts, verified metrics, or meaningful milestones.
- chart_slide: A chart that communicates valid numerical data.

LAYOUT DECISION RULES:
- Treat the layouts above as available choices, not mandatory assignments.
- Do not force every slide to use a different layout.
- Avoid repeating the same layout on consecutive slides when another layout communicates the content equally well.
- Reuse a layout whenever it is the clearest and most appropriate choice.
- Use different layouts when the content genuinely benefits from visual variety.
- Do not choose a layout merely to satisfy a diversity quota.
- Do not add meaningless content just to fill a layout.
- If no specialized layout fits, use title_content.
- Preserve readability and logical flow across the entire presentation.

3. PRESENTATION STRUCTURE
- For a single-slide request, create one complete, standalone slide that directly answers the user's request. Do not force separate cover and conclusion sections.
- For multi-slide presentations, use an appropriate introduction, a logically ordered main section, and a meaningful ending.
- Use a hero cover when appropriate for the first slide.
- Use a conclusion, key takeaway, roadmap, or final reflection when appropriate for the last slide.
- Follow the user's requested structure if one is explicitly provided.
- Make each slide contribute a distinct idea to the overall narrative.

4. CHARTS AND NUMERICAL ACCURACY
- Use chart_slide only when valid numerical data is available and a chart would improve understanding.
- Numerical data may come from the user's input or a reliable, explicitly supplied source.
- Never invent statistics, financial figures, dates, quarterly values, percentages, or chart datasets.
- Do not create a chart simply because the presentation needs visual variety.
- If suitable numerical data is unavailable, choose a non-chart layout.
- Preserve legitimate zero values.
- Ensure chart categories and numerical series are valid and consistent.
- Reject invalid chart values, including booleans, NaN, Infinity, and invalid negative values for pie or donut charts.
- If chart data is invalid, use an appropriate non-chart layout without fabricating replacement data.
- Never treat a historical date, slide number, or section count alone as sufficient reason to create a chart.

5. TOPIC-AWARE IMAGE QUERIES
- Generate image_query from the actual subject and purpose of each slide.
- Prefer 2–4 concrete, visually searchable words or a short descriptive photographic phrase.
- Describe real objects, locations, people, materials, activities, or environments relevant to the topic.
- For cultural or spiritual topics, use respectful and contextually accurate visual descriptions (e.g. 'ancient temple sanctum', 'brass diya oil lamp').
- For technology, show relevant real-world devices, robotics systems, laboratories, or hardware when appropriate.
- For nature and history, describe the actual landscape, monument, artifact, or scene.
- Avoid vague buzzwords and generic queries unrelated to the slide's message.
- Do not force an image onto a slide when a statement or text-focused layout communicates the idea better.

6. CLEAR AND NATURAL WRITING
- Write informative, natural sentences appropriate for the audience and topic.
- Use concise wording without removing important meaning.
- Keep titles specific and meaningful.
- Use short labels for metrics and diagram nodes, with sufficient explanation where needed.
- Adapt content length to the chosen layout rather than forcing one word limit on every content type.
- Avoid repetitive bullet points, generic filler, unnecessary jargon, and unsupported claims.
- Do not use Markdown bold or italic markers inside generated slide text.
- Follow the exact output schema required by the application.

7. THEME SELECTION
Choose a theme based on the topic, visual mood, and user preferences:
- blush
- midnight
- clean
- aurora
- emerald
- amber
- crimson
Use the theme that best supports the content. Do not select a theme based on topic keywords alone when the user has explicitly requested a different theme.

8. STRICT OUTPUT AND DATA INTEGRITY
- Return strictly valid JSON matching the application's existing schema.
- Do not add explanations or Markdown outside the JSON.
- Include only supported fields and valid layout identifiers.
- Do not invent missing information to fill required fields.
- Preserve user-provided facts and numerical data accurately.
- If information is insufficient, choose a suitable non-chart layout and communicate only what is supported.
- Maintain consistency between the presentation outline, slide content, theme, layout, and image query.

OUTPUT FORMAT & CONTENT ARRAY RULES (CRITICAL FOR PARSING):
Return ONLY a valid JSON object matching this schema:
{
  "recommended_theme": "<blush | midnight | clean | aurora | emerald | amber | crimson>",
  "slides": [
    {
      "l": "<hero | title_image_right | 2col | 3col | flowchart | timeline | stats | title_content | statement>",
      "t": "<Slide Title>",
      "c": [<content array formatted per layout rules below>],
      "theme_mode": "<optional 'dark' | 'light_canvas' | 'light_cards'>",
      "image_query": "<optional 2-4 concrete photographic search words>",
      "attached_image_id": "<optional ID of user uploaded image>"
    }
  ]
}

CONTENT ARRAY FORMATTING SPECIFICATIONS:
- For 'hero': "c" is [ "<Subtitle explaining deck mandate>", "<Presenter or Year>" ]
- For 'statement': "c" is [ "<Single profound insight, philosophy, or vision sentence>" ]
- For 'title_content' & 'title_image_right': "c" is an array of 3 to 4 complete, readable insight sentences.
- For '2col' or '3col': "c" is an array of column arrays: [ ["Column Title", "Point 1", "Point 2"], ... ]
- For 'timeline': "c" is an array of phase arrays: [ ["Milestone / Era / Ritual", "Description"], ... ]
- For 'flowchart': "c" is an array of step arrays: [ ["Step Name", "Pillar / Action", "Explanation"], ... ]
- For 'stats': "c" is an array of stat arrays: [ ["Stat Value (e.g. 500+ or $10M)", "Label", "Context"], ... ]
- For 'chart_slide': "c" is an array of 3 to 4 analytical takeaways interpreting the data trends.
"""



def strip_markdown_stars(val: Any) -> Any:
    """Recursively removes all markdown asterisks (** and *) to guarantee clean presentation text."""
    if isinstance(val, str):
        cleaned = re.sub(r'\*\*([^*]+)\*\*', r'\1', val)
        cleaned = re.sub(r'\*([^*]+)\*', r'\1', cleaned)
        cleaned = cleaned.replace("**", "").replace("*", "")
        return cleaned.strip()
    elif isinstance(val, list):
        return [strip_markdown_stars(x) for x in val]
    elif isinstance(val, dict):
        return {k: strip_markdown_stars(v) for k, v in val.items()}
    return val


def normalize_slide_dict(item: dict) -> dict:
    """
    Normalizes arbitrary slide dictionary keys from LLM output into SlideDSL format (l, t, c, image fields).
    """
    d = dict(item)

    # 1. Title mapping
    if "t" not in d and "title" in d:
        d["t"] = str(d["title"])
    elif "t" not in d:
        d["t"] = "Slide"

    # 2. Content mapping
    if "c" not in d:
        if "content" in d:
            d["c"] = d["content"]
        elif "points" in d:
            d["c"] = d["points"]
        elif "bullets" in d:
            d["c"] = d["bullets"]
        else:
            d["c"] = []

    # 3. Image fields mapping
    if "image_query" not in d:
        d["image_query"] = d.get("image") or d.get("query") or d.get("search_query")
    if "attached_image_id" not in d:
        d["attached_image_id"] = d.get("image_id") or d.get("attached_image")

    # 4. Layout mapping
    layout_raw = str(d.get("l") or d.get("layout") or "title_content").lower()
    slide_title_lower = str(d.get("t") or "").lower()
    if "hero" in layout_raw or "cover" in layout_raw or "intro" in layout_raw:
        d["l"] = "hero"
    elif "statement" in layout_raw or "quote" in layout_raw or "vision" in layout_raw or "thesis" in layout_raw or "impact" in layout_raw:
        d["l"] = "statement"
    elif "chart" in layout_raw or "graph" in layout_raw or "bar" in layout_raw:
        d["l"] = "chart_slide"
    elif (
        "flowchart" in layout_raw or "architecture" in layout_raw or "pipeline" in layout_raw
        or "workflow" in layout_raw or ("flow" in layout_raw and "timeline" not in layout_raw)
        or any(k in slide_title_lower for k in ["architecture", "pipeline", "workflow", "lifecycle", "stages"])
    ):
        d["l"] = "flowchart"
    elif "stat" in layout_raw or "kpi" in layout_raw or "metric" in layout_raw or "number" in layout_raw:
        d["l"] = "stats"
    elif "time" in layout_raw or "road" in layout_raw or "process" in layout_raw or "step" in layout_raw or "milestone" in layout_raw:
        d["l"] = "timeline"
    elif "3" in layout_raw or "three" in layout_raw or "pillar" in layout_raw:
        d["l"] = "3col"
    elif "2" in layout_raw or "two" in layout_raw or "compare" in layout_raw or "versus" in layout_raw or "vs" in layout_raw:
        d["l"] = "2col"
    elif "image" in layout_raw or "img" in layout_raw or "photo" in layout_raw or d.get("attached_image_id") or d.get("image_query"):
        d["l"] = "title_image_right"
    else:
        d["l"] = "title_content"

    # Statement layout normalization
    if d.get("l") == "statement":
        if not isinstance(d.get("c"), list) or not d.get("c"):
            d["c"] = [str(d.get("t") or "Leading the transformation through intelligence and purposeful execution.")]

    # 5. Auto-bridge alternative chart representations (e.g. from AI copilot or external formats)
    if "chart" in d and isinstance(d["chart"], dict):
        chart_obj = d.pop("chart")
        if "type" in chart_obj and not d.get("chart_type"):
            d["chart_type"] = chart_obj["type"]
        if "title" in chart_obj and not d.get("t"):
            d["t"] = chart_obj["title"]
        if "data" in chart_obj:
            raw_data = chart_obj["data"]
            if isinstance(raw_data, list) and raw_data and isinstance(raw_data[0], dict):
                first_row = raw_data[0]
                cat_key = next((k for k in first_row.keys() if any(c in k.lower() for c in ['year', 'cat', 'date', 'label', 'name', 'x', 'period', 'month', 'phase'])), list(first_row.keys())[0])
                metric_keys = [k for k in first_row.keys() if k != cat_key]
                if not metric_keys:
                    metric_keys = [cat_key]
                cats = [str(row.get(cat_key, '')) for row in raw_data]
                series = []
                for mk in metric_keys:
                    vals = []
                    for row in raw_data:
                        val = row.get(mk, 0)
                        try:
                            vals.append(float(re.search(r'[-+]?\d*\.?\d+', str(val)).group(0)))
                        except Exception:
                            vals.append(0.0)
                    series.append({'name': mk.replace('_', ' ').title(), 'values': vals})
                d["chart_data"] = {'title': chart_obj.get('title') or d.get('t'), 'categories': cats, 'series': series}
                d["l"] = "chart_slide"
            elif isinstance(raw_data, dict):
                d["chart_data"] = raw_data
                d["l"] = "chart_slide"
        elif "categories" in chart_obj and "series" in chart_obj:
            d["chart_data"] = chart_obj
            d["l"] = "chart_slide"
        elif "categories" in chart_obj and ("data" in chart_obj or "values" in chart_obj):
            cats = [str(c) for c in chart_obj["categories"]]
            raw_vals = chart_obj.get("data") or chart_obj.get("values") or []
            clean_vals = []
            for v in raw_vals:
                try:
                    clean_vals.append(float(re.search(r'[-+]?\d*\.?\d+', str(v)).group(0)))
                except Exception:
                    clean_vals.append(0.0)
            d["chart_data"] = {
                "title": chart_obj.get("title") or d.get("t"),
                "categories": cats,
                "series": [{"name": chart_obj.get("metric_name") or "Metric", "values": clean_vals}]
            }
            d["l"] = "chart_slide"

    # Also handle if chart_data was provided with flat values/data instead of series
    if "chart_data" in d and isinstance(d["chart_data"], dict):
        cd = d["chart_data"]
        if "categories" in cd and not cd.get("series") and ("values" in cd or "data" in cd):
            raw_vals = cd.get("values") or cd.get("data") or []
            clean_vals = []
            for v in raw_vals:
                try:
                    clean_vals.append(float(re.search(r'[-+]?\d*\.?\d+', str(v)).group(0)))
                except Exception:
                    clean_vals.append(0.0)
            cd["series"] = [{"name": cd.get("title") or "Metric", "values": clean_vals}]
            d["l"] = "chart_slide"

    # If valid chart_data is already populated, promote to chart_slide
    if d.get("chart_data") and isinstance(d["chart_data"], dict) and d["chart_data"].get("categories") and d["chart_data"].get("series"):
        d["l"] = "chart_slide"

    # If chart_slide, normalize content array into flat string takeaways
    if d.get("l") == "chart_slide" and isinstance(d.get("c"), list):
        clean_c = []
        for item in d.get("c", []):
            if isinstance(item, list):
                clean_c.append(" - ".join(str(x) for x in item if str(x).strip()))
            elif str(item).strip():
                clean_c.append(str(item).strip())
        d["c"] = clean_c

    # 5. Chart defaults & normalization for chart_slide
    if d.get("l") == "chart_slide":
        c_type = str(d.get("chart_type") or "bar").lower()
        if "line" in c_type:
            d["chart_type"] = "line"
        elif "donut" in c_type or "pie" in c_type or "ring" in c_type:
            d["chart_type"] = "donut"
        else:
            d["chart_type"] = "bar"

        # Validate and robustly normalize chart_data
        cd = d.get("chart_data")
        slide_t = str(d.get("t") or "Performance Overview")
        if not isinstance(cd, dict):
            cd = {}

        # 1. Categories normalization
        raw_cats = cd.get("categories")
        categories = []
        if isinstance(raw_cats, list):
            categories = [str(c).strip() for c in raw_cats if str(c).strip()]

        # 2. Series normalization (handles objects with values, data, points, flat numbers, single dict, units)
        raw_series = cd.get("series")
        if isinstance(raw_series, dict):
            raw_series = [raw_series]
        elif isinstance(raw_series, list) and raw_series and isinstance(raw_series[0], (int, float, str)) and not isinstance(raw_series[0], dict):
            # Flat numbers list: [2.5, 70, 0.3] or ["2.5", "70%", "0.3"]
            raw_series = [{"name": cd.get("title") or "Metric", "values": raw_series}]

        clean_series = []
        if isinstance(raw_series, list) and raw_series:
            for item in raw_series:
                if isinstance(item, dict):
                    name = str(item.get("name") or item.get("label") or item.get("title") or "Metric").strip()
                    raw_v = item.get("values")
                    if raw_v is None:
                        raw_v = item.get("data")
                    if raw_v is None:
                        raw_v = item.get("points")
                    if raw_v is None:
                        raw_v = item.get("val")
                    if not isinstance(raw_v, list):
                        raw_v = [raw_v] if raw_v is not None else []

                    clean_v = []
                    for v in raw_v:
                        if isinstance(v, bool):
                            continue
                        if isinstance(v, (int, float)):
                            clean_v.append(float(v))
                        else:
                            # Extract numeric float from string with units like "2.5 lb/ft2" or "70%"
                            m = re.search(r"[-+]?\d*\.?\d+", str(v).replace(",", ""))
                            if m:
                                clean_v.append(float(m.group(0)))

                    if clean_v:
                        if categories:
                            while len(clean_v) < len(categories):
                                clean_v.append(0.0)
                            clean_v = clean_v[:len(categories)]
                        clean_series.append({"name": name, "values": clean_v})
                elif isinstance(item, (int, float)) and not isinstance(item, bool):
                    clean_series.append({"name": "Metric", "values": [float(item)]})

        # CRITICAL DATA VALIDITY CHECK:
        # Donut/pie charts cannot have negative values
        c_type = str(d.get("chart_type") or "bar").lower()
        if "donut" in c_type or "pie" in c_type:
            for s in clean_series:
                s["values"] = [max(0.0, v) for v in s["values"]]

        has_valid_data = (
            bool(categories) and
            bool(clean_series) and
            any(any(v != 0.0 for v in s.get("values", [])) for s in clean_series)
        )

        if not has_valid_data:
            # NO VALID NUMERICAL DATA: Demote to clean non-chart layout instead of fabricating fake Q1-Q4 data!
            if d.get("image_query") or d.get("image_data"):
                d["l"] = "title_image_right"
            elif isinstance(d.get("c"), list) and len(d.get("c")) == 2 and all(isinstance(x, list) for x in d.get("c")):
                d["l"] = "2col"
            elif isinstance(d.get("c"), list) and len(d.get("c")) >= 3 and all(isinstance(x, list) for x in d.get("c")):
                d["l"] = "3col"
            else:
                d["l"] = "title_content"
            d.pop("chart_data", None)
            d.pop("chart_type", None)
        else:
            cd["categories"] = categories
            cd["series"] = clean_series
            cd["title"] = str(cd.get("title") or slide_t)
            d["chart_data"] = cd

    # 6. Flowchart defaults & normalization
    if d.get("l") == "flowchart":
        if not isinstance(d.get("c"), list) or len(d.get("c")) < 2:
            # Demote to title_content instead of injecting fake Kafka/ReAct strings!
            d["l"] = "title_content"

    return strip_markdown_stars(d)


def extract_json_from_text(text: str) -> Union[dict, list]:
    """
    Robust JSON parser capable of handling:
    - Reasoning tags (<think>...</think>)
    - Markdown code fences (```json ... ```)
    - Trailing conversational text
    - Concatenated slide objects
    """
    raw = text.strip()

    # 1. Strip reasoning traces
    if "</think>" in raw:
        raw = raw.split("</think>", 1)[-1].strip()

    # 2. Extract from markdown code blocks
    if "```json" in raw:
        raw = raw.split("```json", 1)[1].split("```", 1)[0].strip()
    elif "```" in raw:
        raw = raw.split("```", 1)[1].split("```", 1)[0].strip()

    # 3. Direct parse attempt
    try:
        return json.loads(raw)
    except Exception:
        pass

    # 4. Handle partially cut off opening {"slides": [...]}
    cleaned = raw.strip()
    if cleaned.endswith("]}") and not cleaned.startswith('{"slides"'):
        try:
            wrapped = '{"slides": [' + cleaned if not cleaned.startswith("[") else '{"slides": ' + cleaned
            return json.loads(wrapped)
        except Exception:
            pass

    # 5. Extract JSON objects sequentially using raw_decode
    decoder = json.JSONDecoder()
    pos = 0
    collected_objects = []

    while pos < len(raw):
        idx_brace = raw.find('{', pos)
        idx_bracket = raw.find('[', pos)

        candidates = [i for i in [idx_brace, idx_bracket] if i != -1]
        if not candidates:
            break
        start_idx = min(candidates)

        try:
            obj, end_pos = decoder.raw_decode(raw, start_idx)
            collected_objects.append(obj)
            pos = end_pos
        except Exception:
            pos = start_idx + 1

    if collected_objects:
        for obj in collected_objects:
            if isinstance(obj, dict) and "slides" in obj and isinstance(obj["slides"], list):
                return obj
        if len(collected_objects) == 1 and isinstance(collected_objects[0], list):
            return collected_objects[0]
        if len(collected_objects) == 1 and isinstance(collected_objects[0], dict):
            return collected_objects[0]
        if all(isinstance(o, dict) for o in collected_objects):
            return {"slides": collected_objects}
        return collected_objects

    # 6. Fallback bounding box search between first {/[ and last }/]
    start_brace = raw.find("{")
    start_bracket = raw.find("[")
    s_idx = min([i for i in [start_brace, start_bracket] if i != -1], default=-1)

    end_brace = raw.rfind("}")
    end_bracket = raw.rfind("]")
    e_idx = max(end_brace, end_bracket)

    if s_idx != -1 and e_idx != -1 and e_idx > s_idx:
        candidate_substr = raw[s_idx:e_idx + 1]
        try:
            return json.loads(candidate_substr)
        except Exception:
            # Try cleaning trailing commas
            cleaned = re.sub(r",\s*([\}\]])", r"\1", candidate_substr)
            try:
                return json.loads(cleaned)
            except Exception:
                pass

    # 7. Try repairing unclosed JSON (e.g. truncated by max_tokens)
    if s_idx != -1:
        truncated_cand = raw[s_idx:]
        cleaned = re.sub(r",\s*$", "", truncated_cand.strip())
        open_braces = max(0, cleaned.count("{") - cleaned.count("}"))
        open_brackets = max(0, cleaned.count("[") - cleaned.count("]"))
        repaired = cleaned + ("]" * open_brackets) + ("}" * open_braces)
        repaired = re.sub(r",\s*([\}\]])", r"\1", repaired)
        try:
            return json.loads(repaired)
        except Exception:
            pass

    # Final attempt: safely parse or return empty dict
    try:
        return json.loads(raw)
    except Exception as e:
        print(f"[JSON Parse Warning] Unable to parse raw LLM output into JSON: {e}")
        return {}


def call_groq_with_fallback(
    messages: List[Dict[str, str]],
    preferred_model: str = DEFAULT_MODEL,
    temperature: float = 0.5,
    max_tokens: int = 2000,
    top_p: Optional[float] = None,
    json_mode: bool = True,
    timeout: int = 45
) -> Tuple[Dict[str, Any], str]:
    """
    Executes a Groq chat completion request with Smart Model Fallback.
    If the preferred model (e.g. qwen/qwen3.8-27b) hits HTTP 429 (Rate Limit) or 503,
    it automatically cascades to alternative production models:
    1. preferred_model (e.g. qwen/qwen3.8-27b)
    2. llama-3.3-70b-versatile (Has separate 30,000+ TPM limit pool)
    3. llama-3.1-8b-instant (Ultra-fast fallback)
    This completely eliminates 429 Client Errors for the end-user.
    """
    if not GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY is not configured in .env file.")

    pref = preferred_model if (preferred_model and not str(preferred_model).startswith("local:")) else DEFAULT_MODEL
    if not any(k in pref.lower() for k in ["qwen"]):
        pref = "qwen/qwen3.8-27b"

    candidate_models = [pref]
    for fallback in ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "allam-2-7b", "llama-3.3-70b-versatile", "llama-3.1-8b-instant"]:
        if fallback not in candidate_models:
            candidate_models.append(fallback)

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    last_error = None
    for model_candidate in candidate_models:
        payload = {
            "model": model_candidate,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        if top_p is not None:
            payload["top_p"] = top_p
        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        for attempt in range(2):
            try:
                resp = requests.post(
                    f"{GROQ_API_URL}/chat/completions",
                    headers=headers,
                    json=payload,
                    timeout=timeout
                )
                if resp.status_code == 429:
                    retry_after = resp.headers.get("retry-after")
                    sleep_sec = min(float(retry_after), 3.0) if retry_after else 1.5
                    if attempt == 0:
                        print(f"[Groq 429 Rate Limit on {model_candidate}] Rate limit reached. Backing off {sleep_sec}s...")
                        time.sleep(sleep_sec)
                        continue
                    else:
                        print(f"[Groq Smart Fallback] Model {model_candidate} rate-limited. Cascading to next candidate...")
                        break

                resp.raise_for_status()
                data = resp.json()
                return data, model_candidate
            except Exception as e:
                last_error = e
                if isinstance(e, requests.exceptions.HTTPError) and getattr(e, "response", None) is not None:
                    if e.response.status_code == 429:
                        print(f"[Groq Smart Fallback] Model {model_candidate} returned 429. Switching candidate...")
                        break
                if attempt == 0:
                    time.sleep(1.0)
                    continue
                break

    if last_error:
        raise last_error
    raise RuntimeError("All Groq model candidates failed.")


def generate_from_groq(
    prompt: str,
    model_name: str,
    num_slides: int = 1,
    uploaded_images: Optional[List[UploadedImageItem]] = None,
    outline: Optional[List[Dict[str, Any]]] = None
) -> Tuple[str, Dict[str, Any]]:
    """
    Sends chat completion request to Groq Cloud API with native JSON mode.
    Blazing fast LPU inference with comprehensive content & Smart Model Fallback.
    """
    target_model = model_name if (model_name and not (model_name or "").startswith("local:")) else DEFAULT_MODEL
    if not any(k in target_model.lower() for k in ["qwen"]):
        target_model = "qwen/qwen3.8-27b"

    num_slides = max(1, min(int(num_slides or 1), 10))

    uploaded_info = ""
    if uploaded_images:
        uploaded_info = "\n\nUSER UPLOADED IMAGES AVAILABLE:\n"
        for img in uploaded_images:
            desc = describe_user_image(filename=img.filename, user_hint=img.user_hint)
            uploaded_info += f"- Image ID: [{img.id}] | Filename: '{img.filename}' | Description: {desc}\n"
        uploaded_info += "Assign any uploaded image to its most relevant slide using 'attached_image_id' and 'title_image_right' layout.\n"

    outline_info = ""
    if outline:
        outline_info = "\n\nAPPROVED PRESENTATION OUTLINE & AGENDA (Strictly follow this agenda, slide titles, layouts, and subtopics):\n"
        for idx, item in enumerate(outline, start=1):
            t = item.get("title") or item.get("t") or f"Slide {idx}"
            lh = item.get("suggested_layout") or item.get("layout_hint") or "title_content"
            purp = item.get("purpose") or ""
            subs = item.get("subtopics") or []
            subs_str = " | ".join(subs) if subs else "Single key takeaway / vision thesis"
            outline_info += f"- Slide {idx}: Title='{t}' | Layout='{lh}' | Purpose='{purp}' | Topics: [{subs_str}]\n"
        outline_info += "Create the full rich slides strictly fulfilling this structure and using the specified layouts.\n"

    theme_directive = ""
    req_theme, req_seed, is_exp = extract_prompt_color_and_theme(prompt)
    if is_exp:
        theme_directive = f"\n\nSTRICT COLOR THEME DIRECTIVE: The presentation MUST be designed for the '{req_theme}' theme (seed hex: {req_seed}). Set \"recommended_theme\": \"{req_theme}\" in your JSON response."

    user_instruction = (
        f"Create an engaging, authentic, and well-structured {num_slides}-slide presentation deck (maximum 10 slides) on the following requirement:\n{prompt}"
        f"{uploaded_info}"
        f"{outline_info}"
        f"{theme_directive}\n\n"
        f'Output MUST be a valid JSON object with a "slides" array containing exactly {num_slides} slide item(s). '
        f'Write informative, natural sentences that clearly convey the essence and depth of the topic. '
        f'Respect the domain: NEVER force charts, business KPIs, or corporate metrics onto cultural, spiritual, or general topics. Prioritize natural visual layouts ("title_image_right", "timeline", "3col", "2col", "title_content", "flowchart").'
    )

    start_time = time.perf_counter()
    data, used_model = call_groq_with_fallback(
        messages=[
            {"role": "system", "content": SLIDE_PLANNER_SYSTEM_PROMPT},
            {"role": "user", "content": user_instruction}
        ],
        preferred_model=target_model,
        temperature=0.7,
        top_p=0.9,
        max_tokens=4000,
        json_mode=True,
        timeout=60
    )

    latency_ms = int((time.perf_counter() - start_time) * 1000)
    usage = data.get("usage", {})
    metrics = {
        "input_tokens": usage.get("prompt_tokens", 0),
        "output_tokens": usage.get("completion_tokens", 0),
        "total_tokens": usage.get("total_tokens", 0),
        "latency_ms": latency_ms
    }

    choice_msg = data.get("choices", [{}])[0].get("message", {})
    content = choice_msg.get("content") or ""

    print(f"[Groq Cloud] Model={used_model} | Latency={latency_ms}ms | Tokens={metrics['total_tokens']}")
    return content, metrics




def generate_outline(
    prompt: str,
    model_name: str = DEFAULT_MODEL,
    num_slides: int = 3
) -> OutlineResponse:
    """
    Blazing fast outline planner (300-500ms on Groq LPU).
    Generates structured agenda items, purpose, and subtopics for user pre-approval.
    """
    target_model = model_name if (model_name and not (model_name or "").startswith("local:")) else DEFAULT_MODEL
    if not any(k in target_model.lower() for k in ["qwen"]):
        target_model = "qwen/qwen3.8-27b"

    num_slides = max(1, min(int(num_slides or 3), 10))
    if num_slides == 1:
        layout_rules = (
            "Create exactly 1 comprehensive, standalone slide outline that directly addresses the user's requirement. "
            "Select the single best layout suited to the topic (e.g. 'hero', 'title_image_right', '3col', 'timeline', 'statement', or 'title_content'). "
            "Do NOT force separate cover or conclusion sections."
        )
    else:
        layout_rules = (
            "Recommend a mood theme and provide distinct layouts across slides. Keep subtopics short and impactful.\n"
            "Slide 1 MUST be layout 'hero' with a clean 3-to-6-word presentation title. Final slide MUST be a strategic conclusion ('statement' or 'title_content')."
        )

    user_instruction = (
        f"Generate a strategic, highly structured slide outline with exactly {num_slides} slide(s) for the following requirement:\n{prompt}\n\n"
        f"{layout_rules}\n"
        f"Output MUST be a valid JSON object matching the requested schema."
    )

    start_time = time.perf_counter()
    metrics = GenerationMetrics()
    try:
        res_json, used_model = call_groq_with_fallback(
            messages=[
                {"role": "system", "content": OUTLINE_PLANNER_SYSTEM_PROMPT},
                {"role": "user", "content": user_instruction}
            ],
            preferred_model=target_model,
            temperature=0.65,
            top_p=0.9,
            max_tokens=3500,
            json_mode=True,
            timeout=30
        )
        latency_ms = int((time.perf_counter() - start_time) * 1000)
        usage = res_json.get("usage", {})
        metrics = GenerationMetrics(
            input_tokens=usage.get("prompt_tokens", 0),
            output_tokens=usage.get("completion_tokens", 0),
            total_tokens=usage.get("total_tokens", 0),
            latency_ms=latency_ms
        )
        raw_str = res_json.get("choices", [{}])[0].get("message", {}).get("content", "")

        parsed = extract_json_from_text(raw_str)
        parsed = strip_markdown_stars(parsed)

        inferred_theme, inferred_seed, is_explicit = extract_prompt_color_and_theme(prompt)
        if is_explicit:
            theme = inferred_theme
        elif isinstance(parsed, dict) and parsed.get("recommended_theme") in ["blush", "emerald", "clean", "aurora", "midnight", "amber", "crimson"]:
            theme = parsed.get("recommended_theme")
        else:
            theme = inferred_theme

        raw_list = []
        if isinstance(parsed, dict):
            raw_list = parsed.get("slides") or []
        elif isinstance(parsed, list):
            raw_list = parsed

        items = []
        for idx, item in enumerate(raw_list, start=1):
            if isinstance(item, dict):
                title = item.get("title") or item.get("t") or f"Slide {idx}"
                layout = item.get("suggested_layout") or item.get("layout_hint") or item.get("layout") or "title_content"
                items.append(OutlineItem(
                    slide_index=item.get("slide_index") or item.get("slide_num") or idx,
                    title=title,
                    suggested_layout=layout,
                    purpose=item.get("purpose") or item.get("role") or "",
                    subtopics=item.get("subtopics") or item.get("points") or []
                ))

        if not items:
            raise ValueError("No outline items parsed from LLM")

        return OutlineResponse(
            prompt=prompt,
            recommended_theme=theme,
            theme_seed_hex=inferred_seed,
            slides=items,
            metrics=metrics
        )
    except Exception as e:
        print(f"[Outline Planner] Falling back to structured heuristic: {e}")
        inferred = infer_topic_theme(prompt)
        inferred_theme, inferred_seed, _ = extract_prompt_color_and_theme(prompt)
        clean_title = clean_presentation_title(prompt)
        default_items = []
        if num_slides == 1:
            default_items.append(OutlineItem(slide_index=1, title=clean_title, purpose="Overview & Core Insights", suggested_layout="hero", subtopics=[]))
        else:
            for i in range(1, num_slides + 1):
                if i == 1:
                    default_items.append(OutlineItem(slide_index=1, title=clean_title, purpose="Cover & Strategic Vision", suggested_layout="hero", subtopics=[]))
                elif i == num_slides and num_slides > 1:
                    default_items.append(OutlineItem(slide_index=i, title="Strategic Takeaways & Action Roadmap", purpose="Executive Conclusion & Next Milestones", suggested_layout="statement", subtopics=["Key Strategic Takeaways", "Execution Priorities"]))
                elif i == 2:
                    default_items.append(OutlineItem(slide_index=2, title="Core Objectives & Landscape Context", purpose="Context Analysis & Scope", suggested_layout="title_image_right", subtopics=["Strategic Context & Landscape", "Key Operational Challenges"]))
                elif i == 3:
                    default_items.append(OutlineItem(slide_index=3, title="Core Pillars & Framework", purpose="Core Solution Architecture", suggested_layout="3col", subtopics=["Foundational Pillar", "Scalable Operational Pipeline", "Enterprise Governance"]))
                elif i == 4:
                    default_items.append(OutlineItem(slide_index=4, title="Strategic Capabilities & Methodologies", purpose="Execution Framework", suggested_layout="2col", subtopics=["Core Implementation", "Quality Optimization"]))
                elif i == 5:
                    default_items.append(OutlineItem(slide_index=5, title="Phased Deployment & Execution Roadmap", purpose="Milestones & Timeline", suggested_layout="timeline", subtopics=["Phase 1 Initiation", "Phase 2 Production Scale"]))
                else:
                    default_items.append(OutlineItem(slide_index=i, title=f"Operational Excellence & Enablers #{i-3}", purpose="System Deep Dive", suggested_layout="title_content", subtopics=["System Resilience", "Risk Governance"]))
        return OutlineResponse(
            prompt=prompt,
            recommended_theme=inferred_theme or inferred,
            theme_seed_hex=inferred_seed,
            slides=default_items,
            metrics=metrics
        )


def plan_slide(
    prompt: str,
    model_name: str,
    num_slides: int = 1,
    uploaded_images: Optional[List[UploadedImageItem]] = None,
    outline: Optional[List[Dict[str, Any]]] = None,
    theme: Optional[str] = None,
    theme_seed_hex: Optional[str] = None
) -> GenerateResponse:
    
    raw_json_str = ""
    metrics_dict = {}

    try:
        raw_json_str, metrics_dict = generate_from_groq(prompt, model_name, num_slides, uploaded_images, outline)
    except Exception as e:
        inferred_theme, inferred_seed, _ = extract_prompt_color_and_theme(prompt)
        return GenerateResponse(
            slides=[],
            slide=None,
            theme=theme or inferred_theme,
            theme_seed_hex=theme_seed_hex or inferred_seed,
            metrics=GenerationMetrics(),
            validation=ValidationStatus(valid=False, error=str(e))
        )

    metrics = GenerationMetrics(**metrics_dict)

    try:
        json_data = extract_json_from_text(raw_json_str)
        inferred_theme, inferred_seed, is_explicit = extract_prompt_color_and_theme(prompt)
        if theme and theme in ["blush", "emerald", "clean", "aurora", "midnight", "amber", "crimson"]:
            recommended_theme = theme
            seed_hex = theme_seed_hex or inferred_seed
            is_explicit = True
        elif is_explicit:
            recommended_theme = inferred_theme
            seed_hex = inferred_seed
        elif isinstance(json_data, dict) and json_data.get("recommended_theme") in ["blush", "emerald", "clean", "aurora", "midnight", "amber", "crimson"]:
            recommended_theme = json_data.get("recommended_theme")
            seed_hex = inferred_seed
        elif isinstance(json_data, dict) and json_data.get("theme") in ["blush", "emerald", "clean", "aurora", "midnight", "amber", "crimson"]:
            recommended_theme = json_data.get("theme")
            seed_hex = inferred_seed
        else:
            recommended_theme = inferred_theme
            seed_hex = inferred_seed
        raw_slides = []

        if isinstance(json_data, dict):
            if "slides" in json_data and isinstance(json_data["slides"], list):
                raw_slides = json_data["slides"]
            elif "slide" in json_data and isinstance(json_data["slide"], dict):
                raw_slides = [json_data["slide"]]
            elif any(k in json_data for k in ["l", "t", "c", "title", "layout", "content"]):
                raw_slides = [json_data]
            else:
                for v in json_data.values():
                    if isinstance(v, list) and len(v) > 0 and isinstance(v[0], dict):
                        raw_slides = v
                        break
                if not raw_slides:
                    raise ValueError(f"Could not find valid 'slides' in response: {json_data}")
        elif isinstance(json_data, list):
            raw_slides = json_data
            recommended_theme = infer_topic_theme(prompt)
        else:
            raise ValueError(f"Expected JSON object or array, got {type(json_data).__name__}")

        # Enforce maximum 10 slides
        raw_slides = raw_slides[:10]

        slides_list: List[SlideDSL] = []
        for item in raw_slides:
            if isinstance(item, dict):
                normalized = normalize_slide_dict(item)
                slides_list.append(SlideDSL.model_validate(normalized))
            elif isinstance(item, SlideDSL):
                slides_list.append(item)

        if not slides_list:
            raise ValueError("No valid slides found in generated response.")

        # Bind images (User Uploaded Images priority, then Web Search fallback)
        used_images: Set[str] = set()

        for slide_obj in slides_list:
            # 1. Match user uploaded image
            if slide_obj.attached_image_id and uploaded_images:
                clean_target = slide_obj.attached_image_id.strip("[] ").lower()
                for u_img in uploaded_images:
                    if u_img.id.lower() == clean_target or clean_target in u_img.id.lower() or u_img.id.lower() in clean_target:
                        slide_obj.image_data = u_img.data_base64
                        if slide_obj.l not in [LayoutType.hero, LayoutType.stats, LayoutType.timeline, LayoutType.chart_slide, LayoutType.flowchart, LayoutType.two_col, LayoutType.three_col]:
                            slide_obj.l = LayoutType.title_image_right
                        if u_img.data_base64:
                            try:
                                raw_bytes = base64.b64decode(u_img.data_base64.split("base64,")[-1])
                                used_images.add(get_image_fingerprint(raw_bytes))
                            except Exception:
                                used_images.add(u_img.data_base64[:100])
                        break
            
            # 2. If no user image attached and image needed, fetch with smart fallbacks (slide title / global topic)
            non_img_layouts = [
                LayoutType.stats, LayoutType.timeline, LayoutType.chart_slide,
                LayoutType.flowchart, LayoutType.two_col, LayoutType.three_col
            ]
            if not slide_obj.image_data and slide_obj.l not in non_img_layouts and (slide_obj.image_query or slide_obj.l in [LayoutType.hero, LayoutType.title_image_right, LayoutType.statement] or str(slide_obj.l) in ["hero", "title_image_right", "statement"]):
                query_term = slide_obj.image_query or ""
                try:
                    web_img = fetch_web_image(
                        query=query_term,
                        slide_title=slide_obj.t,
                        global_topic=prompt,
                        used_images=used_images
                    )
                    if web_img:
                        slide_obj.image_data = web_img
                        if slide_obj.l not in [LayoutType.hero, LayoutType.stats, LayoutType.timeline, LayoutType.chart_slide, LayoutType.flowchart, LayoutType.two_col, LayoutType.three_col, LayoutType.statement]:
                            slide_obj.l = LayoutType.title_image_right
                except Exception as err:
                    print(f"[Image Fetch Warning] Could not fetch image for '{query_term}': {err}")

        slides_list = apply_dynamic_rhythm(slides_list)
        for s in slides_list:
            if is_explicit or not getattr(s, "theme", None):
                s.theme = recommended_theme
            if is_explicit or not getattr(s, "seed_color", None):
                s.seed_color = seed_hex

        return GenerateResponse(
            slides=slides_list,
            slide=slides_list[0] if slides_list else None,
            theme=recommended_theme,
            theme_seed_hex=seed_hex,
            metrics=metrics,
            validation=ValidationStatus(valid=True, error=None)
        )

    except (json.JSONDecodeError, ValidationError, Exception) as e:
        print(f"[Validation Error] {e}")
        return GenerateResponse(
            slides=[],
            slide=None,
            theme=infer_topic_theme(prompt),
            theme_seed_hex=infer_topic_seed_color(prompt),
            metrics=metrics,
            validation=ValidationStatus(valid=False, error=f"Validation Failed: {str(e)}")
        )


def regenerate_single_slide(
    prompt: str,
    slide_index: int,
    total_slides: int = 1,
    current_title: str = "",
    current_layout: Optional[str] = None,
    model_name: str = DEFAULT_MODEL,
    used_images: Optional[Set[str]] = None
) -> SlideDSL:
    """
    Regenerates or re-plans a single slide in an existing presentation deck.
    Keeps context of global topic and re-creates points, layout, and image.
    Supports all 10 layouts and gracefully handles failures without server crashes.
    """
    target_model = model_name if (model_name and not (model_name or "").startswith("local:")) else DEFAULT_MODEL
    if not any(k in target_model.lower() for k in ["qwen"]):
        target_model = "qwen/qwen3.8-27b"

    layout_hint_str = f"Current Layout: '{current_layout}'. Retain this layout if appropriate, or select the best layout from all 10 layouts.\n" if current_layout else ""

    instruction = (
        f"The user is refining slide #{slide_index + 1} of {total_slides} in a presentation deck.\n"
        f"Global Presentation Requirement: {prompt}\n"
        f"Current Slide Focus / Title: {current_title or 'Sub-topic of presentation'}\n"
        f"{layout_hint_str}\n"
        f"Regenerate a fresh, professional, and refined version of this single slide.\n"
        f"Provide comprehensive, substantive content for all points.\n"
        f"Return ONLY valid raw JSON for this single slide matching this format:\n"
        f"{{\n"
        f'  "l": "<hero | title_image_right | timeline | flowchart | 2col | 3col | title_content | statement | stats | chart_slide>",\n'
        f'  "t": "<slide_title>",\n'
        f'  "c": [<content array>],\n'
        f'  "image_query": "<optional 1-3 generic encyclopedia words for image>"\n'
        f"}}"
    )

    messages = [
        {"role": "system", "content": SLIDE_PLANNER_SYSTEM_PROMPT},
        {"role": "user", "content": instruction}
    ]

    try:
        data, used_model = call_groq_with_fallback(
            messages=messages,
            preferred_model=target_model,
            temperature=0.5,
            max_tokens=1500,
            json_mode=True,
            timeout=40
        )
        choice_msg = data.get("choices", [{}])[0].get("message", {})
        content = choice_msg.get("content") or choice_msg.get("reasoning_content") or ""

        parsed = extract_json_from_text(content)
        if isinstance(parsed, list) and len(parsed) > 0:
            parsed = parsed[0]
        elif isinstance(parsed, dict) and "slides" in parsed and len(parsed["slides"]) > 0:
            parsed = parsed["slides"][0]
        elif isinstance(parsed, dict) and "slide" in parsed and isinstance(parsed["slide"], dict):
            parsed = parsed["slide"]

        if not isinstance(parsed, dict) or not parsed:
            raise ValueError("Parsed slide data is empty")

        normalized = normalize_slide_dict(parsed)
        slide_obj = SlideDSL.model_validate(normalized)
    except Exception as err:
        print(f"[Regenerate Slide Safe Fallback] {err}")
        fallback_layout = current_layout if current_layout in [
            "hero", "title_image_right", "timeline", "flowchart", "2col", "3col", "title_content", "statement", "stats", "chart_slide"
        ] else "title_content"
        fallback_dict = {
            "l": fallback_layout,
            "t": current_title or clean_presentation_title(prompt),
            "c": [
                f"Core strategic context and key concepts for {current_title or prompt[:40]}.",
                f"Execution insights and essential domain principles tailored to the presentation theme."
            ]
        }
        slide_obj = SlideDSL.model_validate(normalize_slide_dict(fallback_dict))

    # Bind new visual if layout or image_query calls for one
    non_img_layouts = [
        LayoutType.stats, LayoutType.timeline, LayoutType.chart_slide,
        LayoutType.flowchart, LayoutType.two_col, LayoutType.three_col
    ]
    if slide_obj.l not in non_img_layouts and (slide_obj.image_query or slide_obj.l in [LayoutType.hero, LayoutType.title_image_right] or str(slide_obj.l) in ["hero", "title_image_right"]):
        query_term = slide_obj.image_query or slide_obj.t
        try:
            web_img = fetch_web_image(
                query=query_term,
                slide_title=slide_obj.t,
                global_topic=prompt,
                used_images=used_images
            )
            if web_img:
                slide_obj.image_data = web_img
                if slide_obj.l not in [LayoutType.hero, LayoutType.stats, LayoutType.timeline, LayoutType.chart_slide, LayoutType.flowchart, LayoutType.two_col, LayoutType.three_col]:
                    slide_obj.l = LayoutType.title_image_right
        except Exception as err:
            print(f"[Regenerate Slide Image Warning] {err}")

    return slide_obj


RESTYLE_SYSTEM_PROMPT = """You are an elite, executive-level presentation copywriter and editor.
The user provides a bullet point or sentence from a presentation slide along with a specific editing instruction (e.g. 'make it shorter', 'make it simpler', 'detailed sentence with 15 words', 'focus on ROI', 'add metrics').

CRITICAL RULES:
1. STRICTLY OBEY THE USER'S INSTRUCTION:
   - SHORTEN ('shorten', 'crisp', 'brief', 'concise'): Output a punchy, high-impact bullet (strictly 6 to 9 words).
   - EXPAND / DETAILED ('detailed sentence', 'expand', 'comprehensive', '15 words'): Output a complete, insightful sentence (strictly 12 to 16 words) explaining mechanism, cause, and impact.
   - SIMPLIFY ('simpler', 'plain language', 'easy'): Explain clearly in accessible, clean language without heavy jargon.
   - SPECIFIC TOPIC / ANGLE (e.g. 'focus on solar', 'focus on cost savings'): Rewrite the sentence highlighting that exact angle.
   - If no specific instruction is given: Polish into an executive 12-14 word presentation takeaway.
2. ABSOLUTELY NO MARKDOWN ASTERISKS: Never output ** or *.
3. OUTPUT ONLY THE REWRITTEN SENTENCE: Do not output quotes, bullet dashes, conversational filler, or explanations.
"""

def restyle_text_with_ai(
    text: str,
    instruction: str = "",
    slide_title: str = "",
    model_name: str = DEFAULT_MODEL
) -> str:
    """Rewrites/restyles a single slide bullet point or sentence strictly based on user instruction."""
    clean_text = text.replace("**", "").replace("*", "").strip()
    if not clean_text:
        return ""

    target_model = model_name if (model_name and not (model_name or "").startswith("local:")) else DEFAULT_MODEL
    if not any(k in target_model.lower() for k in ["qwen"]):
        target_model = "qwen/qwen3.8-27b"

    user_prompt = (
        f"Slide Context: {slide_title or 'Executive Presentation'}\n"
        f"Original Sentence: \"{clean_text}\"\n"
        f"User Editing Instruction: {instruction or 'Polish into executive presentation bullet'}\n\n"
        f"Rewritten Sentence:"
    )

    try:
        data, used_model = call_groq_with_fallback(
            messages=[
                {"role": "system", "content": RESTYLE_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            preferred_model=target_model,
            temperature=0.2,
            max_tokens=200,
            json_mode=False,
            timeout=20
        )
        raw = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
        cleaned = strip_markdown_stars(raw).strip('"\';:- ')
        lines = [line.strip() for line in cleaned.splitlines() if line.strip()]
        return lines[0] if lines else clean_text
    except Exception as e:
        print(f"[Restyle Error] {e}")
        return clean_text


SUGGEST_POINT_SYSTEM_PROMPT = """You are an elite, executive-level presentation strategist.
The user provides the slide title, global topic, and existing bullet points on the slide.
Generate ONE new, distinct, high-impact bullet point (strictly 10 to 15 words).

CRITICAL RULES:
1. NO DUPLICATION: Do NOT repeat ideas already mentioned in the existing points.
2. MEANINGFUL & COMPLETE: Write a complete, standalone, professional insight sentence explaining an operational mechanism, data trend, or strategic advantage.
3. ABSOLUTELY NO MARKDOWN ASTERISKS (** or *).
4. OUTPUT ONLY THE SINGLE BULLET SENTENCE (no bullets, numbers, quotes, or chatter).
"""

def suggest_slide_point(
    slide_title: str,
    existing_points: Optional[List[str]] = None,
    topic: str = "",
    instruction: str = "",
    model_name: str = DEFAULT_MODEL
) -> str:
    """Generates one new, meaningful, non-duplicated 10-15 word bullet point for the active slide."""
    points_str = "\n".join([f"- {p}" for p in (existing_points or []) if p])
    user_prompt = (
        f"Topic: {topic or slide_title}\n"
        f"Slide Title: {slide_title}\n"
        f"Existing Points on this slide:\n{points_str or '(None yet)'}\n"
        f"Specific Focus (if any): {instruction or 'Add a high-value complementary strategic takeaway'}\n\n"
        f"One New High-Impact Bullet Point (10 to 15 words):"
    )

    target_model = model_name if (model_name and not (model_name or "").startswith("local:")) else DEFAULT_MODEL
    if not any(k in target_model.lower() for k in ["qwen"]):
        target_model = "qwen/qwen3.8-27b"

    try:
        data, used_model = call_groq_with_fallback(
            messages=[
                {"role": "system", "content": SUGGEST_POINT_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            preferred_model=target_model,
            temperature=0.3,
            max_tokens=150,
            json_mode=False,
            timeout=20
        )
        raw = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
        cleaned = strip_markdown_stars(raw).strip('"\';:- ')
        lines = [line.strip() for line in cleaned.splitlines() if line.strip()]
        return lines[0] if lines else "Automated sensory telemetry continuously optimizes operational throughput across delivery channels."
    except Exception as e:
        print(f"[Suggest Point Error] {e}")
        return "Automated sensory telemetry continuously optimizes operational throughput across delivery channels."


COPILOT_SYSTEM_PROMPT = """You are an elite, executive-level AI Slide Copilot.
The user wants to edit or modify their active presentation slide using a natural language command.
You are given the current slide's JSON object and the user's editing command.
Commands could be:
- 'Add a point about solar power'
- 'Make all points 15 words'
- 'Change the title to ...'
- 'Switch layout to 3col'
- 'Make it more technical'
- 'Focus on cost efficiency and ROI'
- 'Make this slide light / pastel canvas mode' -> set "theme_mode": "light_canvas"
- 'Make this slide tinted cards / brand cards mode' -> set "theme_mode": "light_cards"
- 'Make this slide dark / change theme to dark mode' -> set "theme_mode": "dark"
- 'Use pink color / baby pink theme' -> set "seed_color": "#F472B6", "theme": "blush"
- 'Change color to emerald green' -> set "seed_color": "#10B981", "theme": "emerald"
- 'Use golden amber theme' -> set "seed_color": "#F59E0B", "theme": "amber"
- 'Change color to crimson red' -> set "seed_color": "#EF4444", "theme": "crimson"
- 'Add a bar chart / line chart / donut / visualize growth / trend':
  Set "l": "chart_slide",
  "chart_type": "bar" | "line" | "donut",
  "chart_data": {
    "title": "<Chart Title>",
    "categories": ["2024", "2025", "2026"],
    "series": [{"name": "Growth (%)", "values": [12.5, 18.3, 25.0]}]
  },
  "c": ["<Strategic takeaway 1>", "<Strategic takeaway 2>"]

CRITICAL RULES:
1. Modify the slide JSON strictly according to the user's instruction.
2. Keep all unchanged elements strictly preserved (do NOT delete bullets, images, or layouts unless explicitly told).
3. Every bullet point must be meaningful and between 10 and 16 words (unless requested shorter).
4. ABSOLUTELY NO MARKDOWN ASTERISKS (** or *).
5. If the user asks for light or dark mode/theme for the slide, set "theme_mode": "light_canvas", "light_cards", or "dark".
6. If the user asks for color or aesthetic theme, set "theme": "blush" | "midnight" | "clean" | "aurora" | "emerald" | "amber" | "crimson" and "seed_color": "#hex".
7. Output MUST be a valid JSON object matching the SlideDSL schema:
   {
     "summary": "<1-line summary of changes made, e.g. 'Updated slide to Baby Pink theme with pastel cards'>",
     "slide": {
       "l": "<hero | statement | 2col | 3col | flowchart | timeline | stats | title_image_right | chart_slide | title_content>",
       "t": "<Slide Title>",
       "c": [<content array: flat list of strings for chart_slide>],
       "theme_mode": "<optional: 'dark' | 'light_canvas' | 'light_cards'>",
       "theme": "<optional: 'blush' | 'midnight' | 'clean' | 'aurora' | 'emerald' | 'amber' | 'crimson'>",
       "seed_color": "<optional hex code>",
       "chart_type": "<optional bar | line | donut>",
       "chart_data": {
         "title": "<Chart Title>",
         "categories": ["Cat1", "Cat2", ...],
         "series": [{"name": "Metric", "values": [10.0, 20.0, ...]}]
       },
       "image_query": "<optional photo search query>"
     }
   }
8. CRITICAL: When the user asks to add or switch to a chart/graph (bar chart, line chart, donut, growth/trend visualization):
   You MUST set "l": "chart_slide", select the appropriate "chart_type" ("bar", "line", or "donut"), and provide realistic numerical data in "chart_data" with "categories" and "series". For "c", convert existing points or provide 2-3 concise strategic takeaway strings (flat strings, NOT nested lists). Do NOT leave "l" as "timeline", "flowchart", or "hero".
"""

def copilot_edit_slide(
    slide_dict: dict,
    instruction: str,
    deck_topic: str = "",
    model_name: str = DEFAULT_MODEL
) -> Tuple[dict, str]:
    """Modifies the active slide according to natural language instruction via AI Copilot."""
    # 1. CRITICAL: Strip huge Base64 image_data to prevent HTTP 413 Payload Too Large!
    clean_slide = copy.deepcopy(slide_dict)
    original_image_data = clean_slide.pop("image_data", None)
    if original_image_data:
        clean_slide["has_image"] = True

    inst_lower = (instruction or "").strip().lower()

    # Fast path 1: Explicit title rename (e.g. "change title to Strategic Roadmap", "rename slide to Intro")
    m_title = re.match(r"^(?:change|update|set|rename)\s+(?:the\s+)?(?:slide\s+)?title\s+(?:to|as|:)\s*[\"']?([^\"']+)[\"']?$", instruction.strip(), re.IGNORECASE)
    if m_title:
        new_title = m_title.group(1).strip()
        if new_title:
            slide_copy = copy.deepcopy(slide_dict)
            slide_copy["t"] = new_title
            if original_image_data and not slide_copy.get("image_data"):
                slide_copy["image_data"] = original_image_data
            return slide_copy, f"Updated slide title to '{new_title}'"

    # Fast path 2: Fast local path for quick theme/color modifications to avoid unnecessary latency
    color_map = {
        "baby pink": ("blush", "#F472B6"),
        "pastel pink": ("blush", "#F472B6"),
        "pink": ("blush", "#F472B6"),
        "rose": ("blush", "#F472B6"),
        "blush": ("blush", "#F472B6"),
        "emerald": ("emerald", "#10B981"),
        "green": ("emerald", "#10B981"),
        "purple": ("aurora", "#A855F7"),
        "violet": ("aurora", "#A855F7"),
        "blue": ("midnight", "#0EA5E9"),
        "clean": ("clean", "#2563EB"),
        "dark": ("midnight", "#0EA5E9"),
        "amber": ("amber", "#F59E0B"),
        "gold": ("amber", "#F59E0B"),
        "golden": ("amber", "#F59E0B"),
        "yellow": ("amber", "#F59E0B"),
        "solar": ("amber", "#F59E0B"),
        "crimson": ("crimson", "#EF4444"),
        "red": ("crimson", "#EF4444"),
        "ruby": ("crimson", "#EF4444"),
    }
    
    is_simple_theme = any(k in inst_lower for k in [
        "theme", "color", "mode", "light", "dark", "pink", "rose", "blush", "purple", "green", "blue", "amber", "gold", "golden", "yellow", "crimson", "red"
    ]) and not any(
        k in inst_lower for k in ["add", "remove", "delete", "rewrite", "replace", "expand", "summarize", "metric", "chart", "bullet", "title", "layout", "column"]
    )
    if is_simple_theme:
        slide_copy = copy.deepcopy(slide_dict)
        summary_parts = []
        for c_name, (thm, hex_c) in color_map.items():
            if c_name in inst_lower:
                slide_copy["theme"] = thm
                slide_copy["seed_color"] = hex_c
                summary_parts.append(f"Applied {c_name.title()} ({hex_c}) color theme")
                break
        if "light" in inst_lower and "card" in inst_lower:
            slide_copy["theme_mode"] = "light_cards"
            summary_parts.append("Switched mode to Tinted Brand Cards")
        elif "light" in inst_lower or "canvas" in inst_lower:
            slide_copy["theme_mode"] = "light_canvas"
            summary_parts.append("Switched mode to Pastel Canvas")
        elif "dark" in inst_lower:
            slide_copy["theme_mode"] = "dark"
            summary_parts.append("Switched mode to Obsidian Dark")
            
        if summary_parts:
            if original_image_data and not slide_copy.get("image_data"):
                slide_copy["image_data"] = original_image_data
            return slide_copy, " & ".join(summary_parts)

    target_model = model_name if (model_name and not (model_name or "").startswith("local:")) else DEFAULT_MODEL
    if not any(k in target_model.lower() for k in ["qwen"]):
        target_model = "qwen/qwen3.8-27b"

    chart_keywords = ["chart", "graph", "bar chart", "line chart", "donut", "pie chart", "trend", "growth", "visualize"]
    user_wants_chart = any(kw in inst_lower for kw in chart_keywords)
    extra_hint = ""
    if user_wants_chart:
        extra_hint = "\nNote: User wants a chart. Set 'l': 'chart_slide', specify 'chart_type' ('bar'|'line'|'donut'), provide realistic 'chart_data' with 'categories' and 'series', and provide 2-3 concise takeaway strings in 'c'."

    user_prompt = (
        f"Deck Topic: {deck_topic}\n"
        f"Current Slide State (JSON):\n{json.dumps(clean_slide, indent=2)}\n\n"
        f"User Modification Command: {instruction}{extra_hint}\n\n"
        f"Apply the modification and return the JSON object with 'summary' and updated 'slide'."
    )

    try:
        data, used_model = call_groq_with_fallback(
            messages=[
                {"role": "system", "content": COPILOT_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            preferred_model=target_model,
            temperature=0.2,
            max_tokens=1500,
            json_mode=True,
            timeout=30
        )
        raw = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
        parsed = extract_json_from_text(raw)
        summary = "Slide updated successfully"
        new_slide = copy.deepcopy(slide_dict)
        if isinstance(parsed, dict):
            summary = parsed.get("summary") or "Slide updated successfully"
            new_slide = parsed.get("slide") or parsed

        # Programmatic field preservation safeguards to prevent whole-slide overwriting:
        # 1. Did the user ask for a chart or layout change?
        has_chart_in_new = (
            "chart" in new_slide or
            "chart_data" in new_slide or
            str(new_slide.get("l")) == "chart_slide" or
            bool(str(new_slide.get("chart_type") or "").strip())
        )
        if user_wants_chart or has_chart_in_new:
            new_slide["l"] = "chart_slide"
        else:
            layout_keywords = ["layout", "columns", "col", "timeline", "flowchart", "hero", "stats", "statement", "grid"]
            user_wants_layout_change = any(kw in inst_lower for kw in layout_keywords)
            if not user_wants_layout_change and "l" in slide_dict:
                new_slide["l"] = slide_dict["l"]

        # 2. Did the user ask to change or delete bullet points/content?
        content_keywords = ["bullet", "point", "content", "text", "rewrite", "replace", "add", "delete", "remove", "summarize", "expand", "shorten", "paragraph", "word"]
        user_wants_content_change = any(kw in inst_lower for kw in content_keywords)
        if not user_wants_content_change and not user_wants_chart and "c" in slide_dict:
            orig_c = slide_dict.get("c")
            new_c = new_slide.get("c")
            if not new_c or (isinstance(orig_c, list) and isinstance(new_c, list) and len(new_c) < len(orig_c)):
                new_slide["c"] = copy.deepcopy(orig_c)

        # 3. Did the user ask to change title?
        title_keywords = ["title", "heading", "name of slide", "rename"]
        user_wants_title_change = any(kw in inst_lower for kw in title_keywords)
        if not user_wants_title_change and slide_dict.get("t"):
            if not new_slide.get("t") or new_slide.get("t") == "Slide":
                new_slide["t"] = slide_dict["t"]

        # 4. Preserve image if user did not ask to delete it
        image_delete_keywords = ["remove image", "delete image", "no image", "remove photo", "delete photo", "without image"]
        user_deletes_image = any(kw in inst_lower for kw in image_delete_keywords)
        if not user_deletes_image and original_image_data and not new_slide.get("image_data"):
            new_slide["image_data"] = original_image_data

        normalized = normalize_slide_dict(new_slide)
        if not user_deletes_image and original_image_data and not normalized.get("image_data"):
            normalized["image_data"] = original_image_data
        return normalized, summary
    except Exception as e:
        print(f"[Copilot Edit Error] {e}")
        return slide_dict, f"Error updating slide: {str(e)}"

