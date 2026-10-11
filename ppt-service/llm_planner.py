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
LM_STUDIO_URL = os.getenv("LM_STUDIO_URL", "http://localhost:1234/v1")
DEFAULT_MODEL = os.getenv("PPT_MODEL") or os.getenv("PPT_DEFAULT_MODEL") or os.getenv("DEFAULT_MODEL", "qwen/qwen3.8-27b" if GROQ_API_KEY else "qwen3.5-4b")



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


OUTLINE_PLANNER_SYSTEM_PROMPT = """You are an elite, executive-level presentation strategist and slide architect.
Given a presentation topic and requested slide count, generate a crisp, strategic slide outline.
Do NOT write full slides yet. Formulate the agenda, purpose, layout hint, and key subtopics (if any) for each slide.

IMPORTANT CONTENT RULES:
1. FIRST & FINAL SLIDE STRUCTURE (MANDATORY):
   - Slide 1 MUST ALWAYS be the Cover slide with layout 'hero'. Its title must be a crisp, professional 3-to-6-word presentation title.
   - The final slide MUST ALWAYS be a Strategic Takeaways, Conclusion, or Action Roadmap slide with layout 'statement' or 'title_content'.
2. STRATEGIC, MEANINGFUL SUBTOPICS (6 TO 12 WORDS): Each subtopic must be clear, actionable, and informative. Avoid broken 2-word fragments. Clearly articulate the core concept or deliverable.
3. NO FORCED SUBTOPICS: Some slides naturally have NO subtopics (e.g. Cover 'hero', Keynote Vision 'statement', or Single Metric 'stats'). In those cases, leave "subtopics" empty [].
4. STRICT DATA REALITY FILTER FOR CHARTS: Only suggest 'chart_slide' if the slide explicitly analyzes measurable quantitative or financial metrics. Never suggest charts for conceptual, cultural, or qualitative topics.
5. LAYOUT DIVERSITY & DOMAIN-SPECIFIC TITLES: Suggest distinct layout hints across the deck from: ['hero', 'statement', '2col', '3col', 'title_image_right', 'flowchart', 'timeline', 'stats', 'chart_slide']. Every title must be topic-specific and analytical. NEVER use generic titles like 'Phase 1, 2, 3' or 'Implementation Phase'.
6. RECOMMENDED THEME:
   - 'blush': Fashion, kids apparel, baby products, cosmetics, beauty, romantic or pink/rose aesthetics.
   - 'emerald': Nature, sustainability, health, agriculture, biology, wellness, food.
   - 'clean': Corporate, finance, legal, education, compliance, business strategy.
   - 'aurora': AI, crypto, gaming, creative design, modern startups, music.
   - 'midnight': Cloud infrastructure, cybersecurity, devops, deep tech, servers.
7. ABSOLUTELY NO MARKDOWN ASTERISKS (** or *).
8. STRICT JSON OUTPUT: Output ONLY a valid JSON object matching the requested schema.

OUTPUT FORMAT (JSON):
{
  "recommended_theme": "<blush | midnight | clean | aurora | emerald>",
  "slides": [
    {
      "slide_index": 1,
      "title": "<Slide Title>",
      "purpose": "<Brief 1-line purpose>",
      "suggested_layout": "<hero | statement | 2col | 3col | title_image_right | flowchart | timeline | stats | chart_slide>",
      "subtopics": [ "<Strategic Subtopic 1 (6-12 words)>", "<Strategic Subtopic 2 (6-12 words)>" ]
    }
  ]
}
"""


SLIDE_PLANNER_SYSTEM_PROMPT = """You are an elite, executive-level presentation strategist and slide architect.
Convert the user's natural-language topic into a structured, highly informative, and professionally handcrafted presentation deck.

CRITICAL CONTENT & WRITING REQUIREMENTS:
1. MEANINGFUL, HIGH-IMPACT EXECUTIVE BULLETS (STRICTLY 10 TO 16 WORDS PER POINT):
   - Every bullet point MUST be a complete, self-contained, professional sentence explaining the insight, operational mechanism, or measurable business impact (strictly 10 to 16 words).
   - NEVER write choppy, telegraphic fragments like 'Water use cut 70%' or 'Demand projected 15%' where the reader cannot understand how or why.
   - Write rich, informative statements that make complete sense on their own:
     * INSTEAD OF: 'Water use cut 70% versus field irrigation'
     * WRITE: 'Automated closed-loop hydroponics slashes fresh water consumption by 70% compared to traditional open-field irrigation.' (14 words)
     * INSTEAD OF: 'Yield reaches 2.5 lb/ft², 30% above conventional farms'
     * WRITE: 'Precision multi-tier LED racks increase crop yield to 2.5 lb/ft², outperforming traditional regional acreage by 30%.' (14 words)
     * INSTEAD OF: 'Carbon footprint drops to 0.3kg'
     * WRITE: 'Hyper-local urban facility proximity eliminates long-distance transport mileage, cutting produce carbon footprint to 0.3kg per ton.' (15 words)
   - Keep sentences punchy and scannable (never write essay paragraphs or run-ons), but ensure each bullet delivers complete, understandable insight.
2. ABSOLUTELY NO MARKDOWN ASTERISKS: NEVER output asterisks (** or *) anywhere in your output. Do NOT use markdown bold like **Keyword:**. Instead, write pure plain text with a colon: "Keyword: Clear punchy insight".
3. STRICT DATA REALITY FILTER & EXACT SCHEMA FOR CHARTS:
   - ONLY use 'chart_slide' if the user's topic explicitly requires quantitative metrics, financial growth, budget distribution, or measurable numeric benchmarks.
   - NEVER invent fake dummy Q1-Q4 charts for conceptual, cultural, historical, strategic, policy, or process topics!
   - When 'chart_slide' is used, category names and metrics MUST be domain-specific.
   - STRICT CHART DATA SCHEMA & SCALE COHESION:
     * 'chart_data' MUST contain: "title" (string), "categories" (array of 3 to 5 strings), and "series" (array of series objects with "name" string and "values" array of numbers).
     * Format:
       "chart_data": {
         "title": "2026 Vertical Farming Yield & Resource Efficiency",
         "categories": ["Yield Efficiency Index", "Water Savings (%)", "Energy Optimization (%)", "Emission Reduction (%)"],
         "series": [
           { "name": "Current Benchmark", "values": [65, 50, 45, 60] },
           { "name": "2026 Target", "values": [95, 70, 75, 85] }
         ]
       }
     * ALWAYS use the key name "values" (an array of numbers corresponding to categories). Do NOT use "data" or other names.
     * DATA COHESION: Ensure all metrics in a single chart share comparable scales or units (e.g., all %, all $M, or normalized indexes) so bars are visually meaningful and balanced.
     * The accompanying slide points ("c") for 'chart_slide' MUST be 3 to 4 analytical takeaways (10 to 16 words each) interpreting the data trends, drivers, and strategic implications.
   - For all non-numeric ideas, use '2col', '3col', 'statement', 'title_image_right', 'flowchart', or 'timeline' instead.
4. MANDATORY LAYOUT DIVERSITY:
   - In any multi-slide presentation, every slide MUST have a DISTINCT layout type. Do NOT repeat layouts. Never default to [hero, chart, timeline].
   - Select the best layout for each slide from:
     * 'hero': Cover slide (Slide 1). "t" is title. "c" is [ "<Subtitle explaining deck mandate (10-15 words)>", "<Presenter • 2026>" ].
     * 'statement': Keynote-grade high-impact vision slide (NO bullets). "t" is headline, "c" is [ "<One inspiring takeaway sentence between 12 and 16 words>" ].
     * '2col': Comparison, dual pillars, or Problem vs Solution. Each column has a bold heading and 2 complete points (10-15 words each).
     * '3col': 3 core pillars, stages, or values. Each column has a heading and 2 complete points (10-15 words each).
     * 'flowchart': System architecture, technical data pipelines, and workflows. "c" is 3-4 connected nodes [ ["Node Title", "Component/Tech", "Architectural explanation (10-14 words)"] ].
     * 'timeline': Phased execution roadmap. "c" is 3-4 phase items [ ["Phase Title", "Key deliverables and milestones (10-14 words)"] ].
     * 'stats': Big quantitative KPIs. "c" is 3-4 metric items [ ["Big Metric (e.g. $14.2M or 99.8%)", "Label", "Context explaining significance (10-14 words)"] ].
     * 'title_image_right': Visual storytelling with 4K photo. Left content has 3 complete points (10-16 words each).
     * 'title_content': Deep strategic overview with 4 complete takeaways (10-16 words each).
5. RECOMMENDED THEME:
   - Match the mood of the topic in 'recommended_theme':
     'blush' for fashion/kids/pink/beauty, 'emerald' for green/nature/health, 'clean' for corporate/finance/legal, 'aurora' for AI/web3/gaming, 'midnight' for cloud/cybersecurity.
6. DYNAMIC SLIDE RHYTHM ('theme_mode'):
   - Each slide can optionally set "theme_mode": "dark" | "light_canvas" | "light_cards".
   - Best practice rhythm:
     * Slide 1 (Hero/Cover): "dark" (dramatic keynote hook)
     * Timelines, Flowcharts, and Complex Bento architectures: "light_canvas" (rich pastel canvas with crisp white cards)
     * Stats KPIs, 2-Col Comparison, and 3-Col Pillars: "light_cards" (subtle brand-tinted cards)
     * Final Slide (Conclusion / Keynote Statement): "dark" (authoritative closing)
7. STRICT JSON FORMAT: Output ONLY raw, valid JSON. Do NOT output markdown fences, python code, commentary, or <think> tags.

JSON STRUCTURE:
{
  "recommended_theme": "<blush | midnight | clean | aurora | emerald>",
  "slides": [
    {
      "l": "<hero | statement | 2col | 3col | flowchart | timeline | stats | title_image_right | chart_slide | title_content>",
      "t": "<Compelling, Professional Slide Title>",
      "c": [<content array>],
      "theme_mode": "<optional 'dark' | 'light_canvas' | 'light_cards'>",
      "chart_type": "<optional 'bar' | 'line' | 'donut' for chart_slide>",
      "chart_data": {
        "title": "<Specific Metric Title>",
        "categories": ["<Category 1>", "<Category 2>", "<Category 3>"],
        "series": [
          { "name": "<Series 1 Name>", "values": [65, 80, 110] },
          { "name": "<Series 2 Name>", "values": [55, 75, 95] }
        ]
      },
      "image_query": "<optional 2-4 concrete photographic search words>",
      "attached_image_id": "<optional ID of user uploaded image>"
    }
  ]
}

CONTENT ARRAY RULES:
- For 'hero': "c" is [ "<Subtitle explaining presentation thesis (10-15 words)>", "<Presenter / Organization • 2026>" ].
- For 'statement': "c" is [ "<Single impactful sentence between 12 and 16 words>" ].
- For 'stats': "c" is [ ["<Metric, e.g. 98.5% or $14M>", "<Label>", "<Context sentence explaining driver (10-14 words)>"], ... ] (3 or 4 items).
- For 'timeline': "c" is [ ["<Phase Title>", "<Actionable deliverables and milestones (10-14 words)>"], ... ] (3 or 4 items).
- For 'chart_slide': "c" is an array of 3-4 strategic takeaway sentences (10 to 16 words each) explaining data trends and impact.
- For 'flowchart': "c" is [ ["<Step Name>", "<Tech/Pillar>", "<Architectural explanation (10-14 words)>"], ... ] (3 or 4 items).
- For 'title_content' and 'title_image_right': "c" is an array of 3-4 complete insight sentences (10 to 16 words each).
- For '2col' or '3col': "c" is an array of column arrays (e.g. [["Pillar A", "Complete point 1 (10-15 words)", "Complete point 2 (10-15 words)"], ["Pillar B", ...]]).

CRITICAL IMAGE QUERY RULES (FOR UNSPLASH 4K STOCK PHOTOGRAPHY):
- When choosing 'image_query', ALWAYS select a concrete, real-world physical subject that a professional camera can photograph.
- NEVER output abstract buzzwords like 'architecture', 'stack', 'overview', 'framework', 'layer', 'enablers', or 'pipeline'.
- ALWAYS translate conceptual topics into tangible visual scenes:
  * For AI Architecture / Autonomous Agents / Infrastructure -> use: "modern cloud server datacenter", "datacenter blue cable network", or "server rack glowing"
  * For Compute / Silicon / Hardware -> use: "microprocessor circuit board", "silicon chip wafer"
  * For Strategy / Management / ROI / Business -> use: "corporate executive boardroom meeting", "business team collaboration"
  * For Healthcare / BioTech / Life Sciences -> use: "medical laboratory scientist", "doctor tablet healthcare"
  * For Robotics / Manufacturing / Supply Chain -> use: "industrial robotic arm factory", "automated warehouse robotics"
  * For Security / Governance / Privacy -> use: "cybersecurity network operations center", "digital data matrix"
- Strictly 2 to 4 concrete photographic search words.
- UNIQUE IMAGES: Every slide using an image MUST have a strictly distinct, non-repeating image_query for its specific sub-topic.
- If the user provided uploaded images (e.g. USER_IMG_1), assign "attached_image_id": "USER_IMG_1" to the most contextually relevant slide.
- Generate between 1 and 10 slides as requested.
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
        if not isinstance(raw_cats, list) or not raw_cats:
            raw_cats = ["Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025"]
        categories = [str(c) for c in raw_cats]
        cd["categories"] = categories

        # 2. Series normalization (handles objects with values, data, points, flat numbers, single dict, units)
        raw_series = cd.get("series")
        if isinstance(raw_series, dict):
            raw_series = [raw_series]
        elif isinstance(raw_series, list) and raw_series and isinstance(raw_series[0], (int, float, str)) and not isinstance(raw_series[0], dict):
            # Flat numbers list: [2.5, 70, 0.3] or ["2.5", "70%", "0.3"]
            raw_series = [{"name": cd.get("title") or "Actual", "values": raw_series}]

        clean_series = []
        if isinstance(raw_series, list) and raw_series:
            for item in raw_series:
                if isinstance(item, dict):
                    name = str(item.get("name") or item.get("label") or item.get("title") or "Metric")
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
                        if isinstance(v, (int, float)):
                            clean_v.append(float(v))
                        else:
                            # Extract numeric float from string with units like "2.5 lb/ft2" or "70%"
                            m = re.search(r"[-+]?\d*\.?\d+", str(v).replace(",", ""))
                            clean_v.append(float(m.group(0)) if m else 0.0)

                    while len(clean_v) < len(categories):
                        clean_v.append(0.0)
                    clean_v = clean_v[:len(categories)]
                    clean_series.append({"name": name, "values": clean_v})
                elif isinstance(item, (int, float)):
                    clean_series.append({"name": "Metric", "values": [float(item)]})

        # Fallback if no valid series could be parsed
        if not clean_series:
            if d["chart_type"] == "donut":
                cd["categories"] = ["Core Platform", "Cloud Ops", "R&D", "Ecosystem"]
                clean_series = [{"name": "Allocation (%)", "values": [40.0, 25.0, 20.0, 15.0]}]
            elif d["chart_type"] == "line":
                cd["categories"] = ["Phase 1", "Phase 2", "Phase 3", "Phase 4"]
                clean_series = [
                    {"name": "Optimization Scale", "values": [24.0, 48.0, 85.0, 140.0]},
                    {"name": "Baseline", "values": [20.0, 32.0, 45.0, 60.0]}
                ]
            else:
                clean_series = [
                    {"name": "Actual", "values": [35.0, 65.0, 105.0, 160.0][:len(categories)]},
                    {"name": "Target", "values": [30.0, 50.0, 80.0, 120.0][:len(categories)]}
                ]

        cd["series"] = clean_series
        cd["title"] = str(cd.get("title") or slide_t)
        d["chart_data"] = cd

    # 6. Flowchart defaults & normalization
    if d.get("l") == "flowchart":
        if not isinstance(d.get("c"), list) or len(d.get("c")) < 2:
            d["c"] = [
                ["01. Data Ingestion", "Kafka & Stream Ingestion", "Real-time streaming telemetry and raw multi-source vectorization."],
                ["02. Agent Orchestration", "ReAct Engine", "Multi-model reasoning, autonomous planning, and memory synthesis."],
                ["03. Execution Runtime", "Sandboxed Microservices", "Safe, deterministic execution with automated fault handling."],
                ["04. Delivery & Evals", "Guardrail Verification", "Continuous benchmark assertions and SLA output delivery."]
            ]

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
            pass

    # Final attempt that raises the raw exception if completely unparseable
    return json.loads(raw)


def generate_from_groq(
    prompt: str,
    model_name: str,
    num_slides: int = 1,
    uploaded_images: Optional[List[UploadedImageItem]] = None,
    outline: Optional[List[Dict[str, Any]]] = None
) -> Tuple[str, Dict[str, Any]]:
    """
    Sends chat completion request to Groq Cloud API with native JSON mode.
    Blazing fast LPU inference with comprehensive content.
    """
    if not GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY is not configured in .env file.")

    target_model = model_name if (model_name and model_name != "local-model" and not model_name.startswith("local:")) else DEFAULT_MODEL
    # Default to Qwen 2.5 27B
    if not any(k in target_model.lower() for k in ["qwen"]):
        target_model = "qwen/qwen3.8-27b"

    num_slides = max(1, min(int(num_slides or 1), 10))
    url = f"{GROQ_API_URL}/chat/completions"

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
        f"Create an authoritative, high-value {num_slides}-slide presentation deck (maximum 10 slides) on the following requirement:\n{prompt}"
        f"{uploaded_info}"
        f"{outline_info}"
        f"{theme_directive}\n\n"
        f'Output MUST be a valid JSON object with a "slides" array containing exactly {num_slides} slide item(s). '
        f'CRITICAL: Write complete, informative 10-to-16-word bullet points that clearly explain the business or operational insight so the audience understands the full context. '
        f'If generating a chart_slide, ensure "chart_data" has exact "title", "categories", and "series" with numeric "values" matching categories, and ensure unique 4K "image_query" per visual slide.'
    )

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": target_model,
        "messages": [
            {"role": "system", "content": SLIDE_PLANNER_SYSTEM_PROMPT},
            {"role": "user", "content": user_instruction}
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.25,
        "max_tokens": 4000
    }

    start_time = time.perf_counter()
    response = requests.post(url, headers=headers, json=payload, timeout=60)
    response.raise_for_status()
    data = response.json()

    end_time = time.perf_counter()
    latency_ms = int((end_time - start_time) * 1000)

    usage = data.get("usage", {})
    metrics = {
        "input_tokens": usage.get("prompt_tokens", 0),
        "output_tokens": usage.get("completion_tokens", 0),
        "total_tokens": usage.get("total_tokens", 0),
        "latency_ms": latency_ms
    }

    choice_msg = data.get("choices", [{}])[0].get("message", {})
    content = choice_msg.get("content") or ""

    print(f"[Groq Cloud] Model={target_model} | Latency={latency_ms}ms | Tokens={metrics['total_tokens']}")
    return content, metrics


def generate_from_lmstudio(
    prompt: str,
    model_name: str,
    num_slides: int = 1,
    uploaded_images: Optional[List[UploadedImageItem]] = None,
    outline: Optional[List[Dict[str, Any]]] = None
) -> Tuple[str, Dict[str, Any]]:
    """
    Sends chat completion request to local LM Studio server.
    Measures latency and extracts token usage metrics.
    """
    if not model_name or model_name == "local-model" or model_name.startswith("local:"):
        model_name = model_name.replace("local:", "") if model_name else ""
        try:
            resp = requests.get(f"{LM_STUDIO_URL}/models", timeout=3)
            if resp.ok:
                candidates = [m["id"] for m in resp.json().get("data", []) if "embed" not in m.get("id", "").lower()]
                if candidates:
                    model_name = candidates[0]
        except Exception:
            model_name = "qwen3.5-4b"

    num_slides = max(1, min(int(num_slides or 1), 10))
    url = f"{LM_STUDIO_URL}/chat/completions"

    uploaded_info = ""
    if uploaded_images:
        uploaded_info = "\n\nUSER UPLOADED IMAGES AVAILABLE:\n"
        for img in uploaded_images:
            desc = describe_user_image(filename=img.filename, user_hint=img.user_hint)
            uploaded_info += f"- Image ID: [{img.id}] | Filename: '{img.filename}' | Description: {desc}\n"
        uploaded_info += "Assign any uploaded image to its most relevant slide using 'attached_image_id' and 'title_image_right' layout.\n"

    outline_info = ""
    if outline:
        outline_info = "\n\nAPPROVED PRESENTATION OUTLINE & AGENDA:\n"
        for idx, item in enumerate(outline, start=1):
            t = item.get("title") or item.get("t") or f"Slide {idx}"
            lh = item.get("suggested_layout") or item.get("layout_hint") or "title_content"
            subs = item.get("subtopics") or []
            outline_info += f"- Slide {idx}: Title='{t}' | Layout='{lh}' | Topics: {subs}\n"

    theme_directive = ""
    req_theme, req_seed, is_exp = extract_prompt_color_and_theme(prompt)
    if is_exp:
        theme_directive = f"\n\nSTRICT COLOR THEME DIRECTIVE: The presentation MUST be designed for the '{req_theme}' theme (seed hex: {req_seed}). Set \"recommended_theme\": \"{req_theme}\" in your JSON response."

    user_instruction = (
        f"Create a professional {num_slides}-slide presentation deck (maximum 10 slides) on the following requirement:\n{prompt}"
        f"{uploaded_info}"
        f"{outline_info}"
        f"{theme_directive}\n\n"
        f'Output MUST be a valid JSON object with a "slides" array containing {num_slides} slide item(s). '
        f'CRITICAL: Write complete, informative 10-to-16-word bullet points that clearly explain the business or operational insight so the audience understands the full context. '
        f'If generating a chart_slide, ensure "chart_data" has exact "title", "categories", and "series" with numeric "values" matching categories, and ensure unique 4K "image_query" per visual slide.'
    )

    messages = [
        {"role": "system", "content": SLIDE_PLANNER_SYSTEM_PROMPT},
        {"role": "user", "content": user_instruction}
    ]

    is_reasoning_model = any(k in model_name.lower() for k in ["qwen3.5", "qwq", "r1", "reasoner"])
    if is_reasoning_model:
        messages.append({"role": "assistant", "content": "</think>"})

    payload = {
        "model": model_name,
        "messages": messages,
        "temperature": 0.2,
        "max_tokens": 4000
    }

    start_time = time.perf_counter()
    try:
        response = requests.post(url, json=payload, timeout=300)
        response.raise_for_status()
        data = response.json()
    except requests.exceptions.RequestException as e:
        raise RuntimeError(
            f"LM Studio Connection Error: Ensure LM Studio is running on {LM_STUDIO_URL}. Error: {str(e)}"
        )

    end_time = time.perf_counter()
    latency_ms = int((end_time - start_time) * 1000)

    usage = data.get("usage", {})
    metrics = {
        "input_tokens": usage.get("prompt_tokens", 0),
        "output_tokens": usage.get("completion_tokens", 0),
        "total_tokens": usage.get("total_tokens", 0),
        "latency_ms": latency_ms
    }

    choice_msg = data.get("choices", [{}])[0].get("message", {})
    content = choice_msg.get("content") or ""
    if not content and choice_msg.get("reasoning_content"):
        content = choice_msg["reasoning_content"]

    print(f"[LM Studio] Model={model_name} | Latency={latency_ms}ms | Tokens={metrics['total_tokens']}")
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
    target_model = model_name if (model_name and model_name != "local-model" and not model_name.startswith("local:")) else DEFAULT_MODEL
    if not any(k in target_model.lower() for k in ["qwen"]):
        target_model = "qwen/qwen3.8-27b"

    num_slides = max(1, min(int(num_slides or 3), 10))
    user_instruction = (
        f"Generate a strategic, highly structured slide outline with exactly {num_slides} slide(s) for the following requirement:\n{prompt}\n\n"
        f"Recommend a mood theme and provide distinct layouts across slides. Keep subtopics short and impactful.\n"
        f"Slide 1 MUST be layout 'hero' with a clean 3-to-6-word presentation title. Final slide MUST be a strategic conclusion ('statement' or 'title_content').\n"
        f"Output MUST be a valid JSON object matching the requested schema."
    )

    url = f"{GROQ_API_URL}/chat/completions"
    headers = {"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"}
    payload = {
        "model": target_model,
        "messages": [
            {"role": "system", "content": OUTLINE_PLANNER_SYSTEM_PROMPT},
            {"role": "user", "content": user_instruction}
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.25,
        "max_tokens": 3500
    }

    start_time = time.perf_counter()
    raw_str = ""
    metrics = GenerationMetrics()
    try:
        if GROQ_API_KEY:
            resp = requests.post(url, headers=headers, json=payload, timeout=25)
            resp.raise_for_status()
            res_json = resp.json()
            latency_ms = int((time.perf_counter() - start_time) * 1000)
            usage = res_json.get("usage", {})
            metrics = GenerationMetrics(
                input_tokens=usage.get("prompt_tokens", 0),
                output_tokens=usage.get("completion_tokens", 0),
                total_tokens=usage.get("total_tokens", 0),
                latency_ms=latency_ms
            )
            raw_str = res_json.get("choices", [{}])[0].get("message", {}).get("content", "")
        else:
            raise RuntimeError("No Groq key available")
    except Exception as e:
        print(f"[Outline Planner] Falling back to structured heuristic: {e}")
        inferred = infer_topic_theme(prompt)
        clean_title = clean_presentation_title(prompt)
        default_items = []
        for i in range(1, num_slides + 1):
            if i == 1:
                default_items.append(OutlineItem(slide_index=1, title=clean_title, purpose="Cover & Strategic Vision", suggested_layout="hero", subtopics=[]))
            elif i == num_slides and num_slides > 1:
                default_items.append(OutlineItem(slide_index=i, title="Strategic Takeaways & Action Roadmap", purpose="Executive Conclusion & Next Milestones", suggested_layout="statement", subtopics=["Key Strategic Takeaways", "Execution Priorities"]))
            elif i == 2:
                default_items.append(OutlineItem(slide_index=2, title="Core Objectives & Market Context", purpose="Problem Analysis & Scope", suggested_layout="2col", subtopics=["Market Opportunity & Landscape", "Key Operational Bottlenecks"]))
            elif i == 3:
                default_items.append(OutlineItem(slide_index=3, title="Architectural Pillars & Solution Framework", purpose="Core Solution", suggested_layout="3col", subtopics=["Foundational Architecture", "Scalable Operational Pipeline", "Enterprise Governance"]))
            elif i == 4:
                default_items.append(OutlineItem(slide_index=4, title="Key Performance Metrics & KPI Impact", purpose="Measurable Benchmarks", suggested_layout="stats", subtopics=["Efficiency Metrics", "Yield Optimization"]))
            elif i == 5:
                default_items.append(OutlineItem(slide_index=5, title="Phased Deployment & Execution Roadmap", purpose="Milestones & Timeline", suggested_layout="timeline", subtopics=["Phase 1 Initiation", "Phase 2 Production Scale"]))
            else:
                default_items.append(OutlineItem(slide_index=i, title=f"Operational Excellence & Enablers #{i-3}", purpose="System Deep Dive", suggested_layout="title_content", subtopics=["System Resilience", "Risk Governance"]))
        return OutlineResponse(
            prompt=prompt,
            recommended_theme=inferred,
            slides=default_items,
            metrics=metrics
        )

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
        items = [OutlineItem(slide_index=1, title=prompt[:50], purpose="Overview", suggested_layout="hero", subtopics=[])]

    return OutlineResponse(
        prompt=prompt,
        recommended_theme=theme,
        theme_seed_hex=inferred_seed,
        slides=items,
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
    
    use_groq = bool(GROQ_API_KEY) and (model_name != "local-model" and not (model_name or "").startswith("local:"))

    raw_json_str = ""
    metrics_dict = {}

    try:
        if use_groq:
            try:
                raw_json_str, metrics_dict = generate_from_groq(prompt, model_name, num_slides, uploaded_images, outline)
            except Exception as groq_err:
                print(f"[Groq Warning - Trying LM Studio fallback] {groq_err}")
                if LM_STUDIO_URL:
                    raw_json_str, metrics_dict = generate_from_lmstudio(prompt, model_name, num_slides, uploaded_images, outline)
                else:
                    raise groq_err
        else:
            raw_json_str, metrics_dict = generate_from_lmstudio(prompt, model_name, num_slides, uploaded_images, outline)
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
    model_name: str = DEFAULT_MODEL,
    used_images: Optional[Set[str]] = None
) -> SlideDSL:
    """
    Regenerates or re-plans a single slide in an existing presentation deck.
    Keeps context of global topic and re-creates points, layout, and image.
    """
    use_groq = bool(GROQ_API_KEY) and (model_name != "local-model" and not (model_name or "").startswith("local:"))

    if use_groq:
        target_model = model_name if (model_name and model_name != "local-model") else DEFAULT_MODEL
        if not any(k in target_model.lower() for k in ["qwen"]):
            target_model = "qwen/qwen3.8-27b"
    else:
        if not model_name or model_name == "local-model" or (model_name or "").startswith("local:"):
            target_model = model_name.replace("local:", "") if model_name else ""
            try:
                resp = requests.get(f"{LM_STUDIO_URL}/models", timeout=3)
                if resp.ok:
                    candidates = [m["id"] for m in resp.json().get("data", []) if "embed" not in m.get("id", "").lower()]
                    if candidates:
                        target_model = candidates[0]
            except Exception:
                target_model = "qwen3.5-4b"
        else:
            target_model = model_name

    instruction = (
        f"The user is refining slide #{slide_index + 1} of {total_slides} in a presentation deck.\n"
        f"Global Presentation Requirement: {prompt}\n"
        f"Current Slide Focus / Title: {current_title or 'Sub-topic of presentation'}\n\n"
        f"Regenerate a fresh, professional, and refined version of this single slide.\n"
        f"Provide comprehensive, substantive content for all points.\n"
        f"Return ONLY valid raw JSON for this single slide matching this format:\n"
        f"{{\n"
        f'  "l": "<title_content | 2col | 3col | title_image_right>",\n'
        f'  "t": "<slide_title>",\n'
        f'  "c": [<content array>],\n'
        f'  "image_query": "<optional 1-3 generic encyclopedia words for image>"\n'
        f"}}"
    )

    messages = [
        {"role": "system", "content": SLIDE_PLANNER_SYSTEM_PROMPT},
        {"role": "user", "content": instruction}
    ]

    if not use_groq:
        is_reasoning_model = any(k in target_model.lower() for k in ["qwen3.5", "qwq", "r1", "reasoner"])
        if is_reasoning_model:
            messages.append({"role": "assistant", "content": "</think>"})

    payload = {
        "model": target_model,
        "messages": messages,
        "temperature": 0.25,
        "max_tokens": 1500
    }
    if use_groq:
        payload["response_format"] = {"type": "json_object"}

    if use_groq:
        headers = {"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"}
        resp = requests.post(f"{GROQ_API_URL}/chat/completions", headers=headers, json=payload, timeout=60)
    else:
        resp = requests.post(f"{LM_STUDIO_URL}/chat/completions", json=payload, timeout=60)
    resp.raise_for_status()
    data = resp.json()

    choice_msg = data.get("choices", [{}])[0].get("message", {})
    content = choice_msg.get("content") or choice_msg.get("reasoning_content") or ""

    parsed = extract_json_from_text(content)
    if isinstance(parsed, list) and len(parsed) > 0:
        parsed = parsed[0]
    elif isinstance(parsed, dict) and "slides" in parsed and len(parsed["slides"]) > 0:
        parsed = parsed["slides"][0]

    normalized = normalize_slide_dict(parsed)
    slide_obj = SlideDSL.model_validate(normalized)

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

    target_model = model_name if (model_name and model_name != "local-model" and not (model_name or "").startswith("local:")) else DEFAULT_MODEL
    if not any(k in target_model.lower() for k in ["qwen"]):
        target_model = "qwen/qwen3.8-27b"

    user_prompt = (
        f"Slide Context: {slide_title or 'Executive Presentation'}\n"
        f"Original Sentence: \"{clean_text}\"\n"
        f"User Editing Instruction: {instruction or 'Polish into executive presentation bullet'}\n\n"
        f"Rewritten Sentence:"
    )

    use_groq = bool(GROQ_API_KEY) and (model_name != "local-model" and not (model_name or "").startswith("local:"))
    headers = {"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"}
    payload = {
        "model": target_model,
        "messages": [
            {"role": "system", "content": RESTYLE_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.2,
        "max_tokens": 200
    }

    try:
        if use_groq:
            resp = requests.post(f"{GROQ_API_URL}/chat/completions", headers=headers, json=payload, timeout=20)
        else:
            resp = requests.post(f"{LM_STUDIO_URL}/chat/completions", json=payload, timeout=20)
        resp.raise_for_status()
        data = resp.json()
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

    target_model = model_name if (model_name and model_name != "local-model" and not (model_name or "").startswith("local:")) else DEFAULT_MODEL
    if not any(k in target_model.lower() for k in ["qwen"]):
        target_model = "qwen/qwen3.8-27b"

    use_groq = bool(GROQ_API_KEY) and (model_name != "local-model" and not (model_name or "").startswith("local:"))
    headers = {"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"}
    payload = {
        "model": target_model,
        "messages": [
            {"role": "system", "content": SUGGEST_POINT_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.3,
        "max_tokens": 150
    }

    try:
        if use_groq:
            resp = requests.post(f"{GROQ_API_URL}/chat/completions", headers=headers, json=payload, timeout=20)
        else:
            resp = requests.post(f"{LM_STUDIO_URL}/chat/completions", json=payload, timeout=20)
        resp.raise_for_status()
        data = resp.json()
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

CRITICAL RULES:
1. Modify the slide JSON strictly according to the user's instruction.
2. Keep all unchanged elements preserved.
3. Every bullet point must be meaningful and between 10 and 16 words (unless requested shorter).
4. ABSOLUTELY NO MARKDOWN ASTERISKS (** or *).
5. If the user asks for light or dark mode/theme for the slide, set "theme_mode": "light_canvas", "light_cards", or "dark".
6. If the user asks for color or aesthetic theme, set "theme": "blush" | "midnight" | "clean" | "aurora" | "emerald" and "seed_color": "#hex".
7. Output MUST be a valid JSON object matching the SlideDSL schema:
   {
     "summary": "<1-line summary of changes made, e.g. 'Updated slide to Baby Pink theme with pastel cards'>",
     "slide": {
       "l": "<hero | statement | 2col | 3col | flowchart | timeline | stats | title_image_right | chart_slide | title_content>",
       "t": "<Slide Title>",
       "c": [<content array>],
       "theme_mode": "<optional: 'dark' | 'light_canvas' | 'light_cards'>",
       "theme": "<optional: 'blush' | 'midnight' | 'clean' | 'aurora' | 'emerald'>",
       "seed_color": "<optional hex code>",
       "chart_type": "<optional bar | line | donut>",
       "chart_data": { ... },
       "image_query": "<optional photo search query>"
     }
   }
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

    # 2. Fast local path for quick theme/color modifications to avoid unnecessary latency
    inst_lower = (instruction or "").strip().lower()
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
    }
    
    is_simple_theme = any(k in inst_lower for k in ["theme", "color", "mode", "light", "dark", "pink", "rose", "blush", "purple", "green", "blue"]) and not any(
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
            return slide_copy, " & ".join(summary_parts)

    target_model = model_name if (model_name and model_name != "local-model" and not (model_name or "").startswith("local:")) else DEFAULT_MODEL
    if not any(k in target_model.lower() for k in ["qwen"]):
        target_model = "qwen/qwen3.8-27b"

    user_prompt = (
        f"Deck Topic: {deck_topic}\n"
        f"Current Slide State (JSON):\n{json.dumps(clean_slide, indent=2)}\n\n"
        f"User Modification Command: {instruction}\n\n"
        f"Apply the modification and return the JSON object with 'summary' and updated 'slide'."
    )

    use_groq = bool(GROQ_API_KEY) and (model_name != "local-model" and not (model_name or "").startswith("local:"))
    headers = {"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"}
    payload = {
        "model": target_model,
        "messages": [
            {"role": "system", "content": COPILOT_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.2,
        "max_tokens": 1500
    }

    try:
        if use_groq:
            resp = requests.post(f"{GROQ_API_URL}/chat/completions", headers=headers, json=payload, timeout=30)
        else:
            resp = requests.post(f"{LM_STUDIO_URL}/chat/completions", json=payload, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        raw = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
        parsed = extract_json_from_text(raw)
        summary = "Slide updated successfully"
        new_slide = slide_dict
        if isinstance(parsed, dict):
            summary = parsed.get("summary") or "Slide updated successfully"
            new_slide = parsed.get("slide") or parsed
        normalized = normalize_slide_dict(new_slide)
        if original_image_data and not normalized.get("image_data"):
            normalized["image_data"] = original_image_data
        return normalized, summary
    except Exception as e:
        print(f"[Copilot Edit Error] {e}")
        return slide_dict, f"Error updating slide: {str(e)}"

