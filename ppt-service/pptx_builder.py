import io
import re
import base64
from typing import List, Union, Optional, Dict, Any, Tuple
from PIL import Image, ImageFilter
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.chart.data import CategoryChartData
from pptx.enum.chart import XL_CHART_TYPE, XL_LEGEND_POSITION

import colorsys
from llm_planner import SlideDSL, LayoutType, strip_markdown_stars

# Professional Theme Palettes matching Studio UI
THEME_PALETTES: Dict[str, Dict[str, RGBColor]] = {
    "midnight": {
        "bg": RGBColor(15, 23, 42),            # #0f172a Deep Slate Navy
        "card_bg": RGBColor(30, 41, 59),       # #1e293b Slate 800
        "card_border": RGBColor(51, 65, 85),   # #334155 Slate 700
        "title": RGBColor(248, 250, 252),      # #f8fafc Crisp White
        "heading": RGBColor(241, 245, 249),    # #f1f5f9 Crisp White/Slate
        "body": RGBColor(203, 213, 225),       # #cbd5e1 Slate 300
        "accent": RGBColor(56, 189, 248),      # #38bdf8 Sky 400
        "badge_text": RGBColor(125, 211, 252), # #7dd3fc Sky 300
        "divider": RGBColor(51, 65, 85)        # Sleek dark divider line
    },
    "clean": {
        "bg": RGBColor(255, 255, 255),         # #ffffff Pure White
        "card_bg": RGBColor(248, 250, 252),    # #f8fafc Slate 50
        "card_border": RGBColor(226, 232, 240),# #e2e8f0 Slate 200
        "title": RGBColor(15, 23, 42),         # #0f172a Slate 900
        "heading": RGBColor(15, 23, 42),       # #0f172a Slate 900
        "body": RGBColor(51, 65, 85),          # #334155 Slate 700
        "accent": RGBColor(37, 99, 235),       # #2563eb Royal Blue
        "badge_text": RGBColor(37, 99, 235),   # #2563eb
        "divider": RGBColor(226, 232, 240)     # Clean light divider
    },
    "aurora": {
        "bg": RGBColor(9, 3, 20),              # #090314 Midnight Violet
        "card_bg": RGBColor(26, 14, 46),       # #1a0e2e Deep Purple
        "card_border": RGBColor(88, 28, 135),  # #581c87 Purple 700
        "title": RGBColor(245, 208, 254),      # #f5d0fe Lavender
        "heading": RGBColor(250, 232, 255),    # #fae8ff Light Violet
        "body": RGBColor(226, 232, 240),       # #e2e8f0 Slate 200
        "accent": RGBColor(192, 132, 252),     # #c084fc Purple 400
        "badge_text": RGBColor(240, 171, 252), # #f0abfc Fuchsia 300
        "divider": RGBColor(88, 28, 135)       # Purple hairline divider
    },
    "emerald": {
        "bg": RGBColor(251, 249, 245),         # #fbf9f5 Warm Sand
        "card_bg": RGBColor(255, 255, 255),    # #ffffff Pure White
        "card_border": RGBColor(230, 223, 213),# #e6dfd5 Sand Gray
        "title": RGBColor(6, 78, 59),          # #064e3b Deep Emerald
        "heading": RGBColor(6, 78, 59),        # #064e3b
        "body": RGBColor(55, 65, 81),          # #374151 Charcoal Gray
        "accent": RGBColor(5, 150, 105),       # #059669 Emerald 600
        "badge_text": RGBColor(6, 95, 70),     # #065f46
        "divider": RGBColor(230, 223, 213)     # Sand hairline divider
    },
    "blush": {
        "bg": RGBColor(20, 8, 16),             # #140810 Deep Rose Night
        "card_bg": RGBColor(36, 14, 28),       # #240e1c Dark Plum/Rose Glass
        "card_border": RGBColor(131, 24, 67),  # Soft Rose Border
        "title": RGBColor(252, 231, 243),      # Crisp Baby Pink
        "heading": RGBColor(249, 168, 212),    # Baby Pink 300
        "body": RGBColor(244, 244, 245),       # Soft Text
        "accent": RGBColor(244, 114, 182),     # Baby Pink Accent
        "badge_text": RGBColor(251, 207, 232), # Soft Pink Text
        "divider": RGBColor(131, 24, 67)
    },
    "rose": {
        "bg": RGBColor(20, 8, 16),
        "card_bg": RGBColor(36, 14, 28),
        "card_border": RGBColor(131, 24, 67),
        "title": RGBColor(252, 231, 243),
        "heading": RGBColor(249, 168, 212),
        "body": RGBColor(244, 244, 245),
        "accent": RGBColor(244, 114, 182),
        "badge_text": RGBColor(251, 207, 232),
        "divider": RGBColor(131, 24, 67)
    },
    "amber": {
        "bg": RGBColor(20, 13, 4),             # Solar Deep Dark
        "card_bg": RGBColor(36, 21, 6),        # Dark Amber Glass
        "card_border": RGBColor(180, 83, 9),   # Amber Border
        "title": RGBColor(254, 243, 199),      # Amber White
        "heading": RGBColor(253, 230, 138),    # Warm Gold
        "body": RGBColor(244, 244, 245),
        "accent": RGBColor(245, 158, 11),      # Solar Amber
        "badge_text": RGBColor(253, 230, 138),
        "divider": RGBColor(180, 83, 9)
    },
    "crimson": {
        "bg": RGBColor(20, 5, 7),              # Deep Ruby Dark
        "card_bg": RGBColor(36, 8, 12),        # Dark Ruby Glass
        "card_border": RGBColor(159, 18, 57),  # Ruby Border
        "title": RGBColor(255, 228, 230),      # Crimson White
        "heading": RGBColor(254, 205, 211),    # Warm Rose
        "body": RGBColor(244, 244, 245),
        "accent": RGBColor(239, 68, 68),       # Crimson Red
        "badge_text": RGBColor(254, 205, 211),
        "divider": RGBColor(159, 18, 57)
    }
}

# Per-Slide Light Mode Palettes (Tinted with matching brand color)
THEME_PALETTES_LIGHT: Dict[str, Dict[str, RGBColor]] = {
    "midnight": {
        "bg": RGBColor(248, 250, 252),            # #f8fafc Soft Slate White
        "card_bg": RGBColor(255, 255, 255),       # #ffffff Crisp White
        "card_border": RGBColor(226, 232, 240),   # #e2e8f0 Slate 200
        "title": RGBColor(15, 23, 42),            # #0f172a Deep Slate Navy
        "heading": RGBColor(30, 41, 59),          # #1e293b Slate 800
        "body": RGBColor(71, 85, 105),            # #475569 Slate 600
        "accent": RGBColor(2, 132, 199),          # #0284c7 Sky 600
        "badge_text": RGBColor(3, 105, 161),      # #0369a1 Sky 700
        "divider": RGBColor(226, 232, 240)        # Subtle light divider
    },
    "clean": {
        "bg": RGBColor(255, 255, 255),
        "card_bg": RGBColor(248, 250, 252),
        "card_border": RGBColor(226, 232, 240),
        "title": RGBColor(15, 23, 42),
        "heading": RGBColor(15, 23, 42),
        "body": RGBColor(51, 65, 85),
        "accent": RGBColor(37, 99, 235),
        "badge_text": RGBColor(37, 99, 235),
        "divider": RGBColor(226, 232, 240)
    },
    "aurora": {
        "bg": RGBColor(253, 244, 255),            # #fdf4ff Soft Lavender Tint
        "card_bg": RGBColor(255, 255, 255),       # #ffffff Pure White
        "card_border": RGBColor(240, 215, 250),   # Lavender outline
        "title": RGBColor(59, 7, 100),            # Deep Purple
        "heading": RGBColor(88, 28, 135),
        "body": RGBColor(107, 33, 168),
        "accent": RGBColor(147, 51, 234),         # Purple 600
        "badge_text": RGBColor(126, 34, 206),
        "divider": RGBColor(240, 215, 250)
    },
    "emerald": {
        "bg": RGBColor(240, 253, 244),            # #f0fdf4 Soft Mint Tint
        "card_bg": RGBColor(255, 255, 255),       # #ffffff Pure White
        "card_border": RGBColor(187, 247, 208),   # Light Emerald
        "title": RGBColor(6, 78, 59),
        "heading": RGBColor(6, 95, 70),
        "body": RGBColor(21, 128, 61),
        "accent": RGBColor(5, 150, 105),
        "badge_text": RGBColor(4, 120, 87),
        "divider": RGBColor(187, 247, 208)
    },
    "blush": {
        "bg": RGBColor(253, 242, 248),            # #fdf2f8 Soft Baby Pink Canvas
        "card_bg": RGBColor(255, 255, 255),       # Pure White
        "card_border": RGBColor(244, 114, 182),   # Baby Pink Border
        "title": RGBColor(131, 24, 67),           # Deep Rose Title
        "heading": RGBColor(157, 23, 77),
        "body": RGBColor(55, 65, 81),
        "accent": RGBColor(219, 39, 119),         # Pink Accent
        "badge_text": RGBColor(190, 24, 93),
        "divider": RGBColor(251, 207, 232)
    },
    "rose": {
        "bg": RGBColor(253, 242, 248),
        "card_bg": RGBColor(255, 255, 255),
        "card_border": RGBColor(244, 114, 182),
        "title": RGBColor(131, 24, 67),
        "heading": RGBColor(157, 23, 77),
        "body": RGBColor(55, 65, 81),
        "accent": RGBColor(219, 39, 119),
        "badge_text": RGBColor(190, 24, 93),
        "divider": RGBColor(251, 207, 232)
    },
    "amber": {
        "bg": RGBColor(255, 251, 235),            # Soft Amber Canvas
        "card_bg": RGBColor(255, 255, 255),
        "card_border": RGBColor(245, 158, 11),
        "title": RGBColor(120, 53, 15),
        "heading": RGBColor(146, 64, 14),
        "body": RGBColor(55, 65, 81),
        "accent": RGBColor(217, 119, 6),
        "badge_text": RGBColor(180, 83, 9),
        "divider": RGBColor(254, 243, 199)
    },
    "crimson": {
        "bg": RGBColor(255, 241, 242),            # Soft Rose Canvas
        "card_bg": RGBColor(255, 255, 255),
        "card_border": RGBColor(239, 68, 68),
        "title": RGBColor(136, 19, 55),
        "heading": RGBColor(159, 18, 57),
        "body": RGBColor(55, 65, 81),
        "accent": RGBColor(220, 38, 38),
        "badge_text": RGBColor(190, 18, 60),
        "divider": RGBColor(255, 228, 230)
    }
}

# Topic Brand Seeds mapping standard themes to primary hexes
THEME_SEEDS: Dict[str, str] = {
    "midnight": "#0EA5E9",  # Tech Sky Blue
    "clean": "#2563EB",     # Executive Royal Blue
    "aurora": "#A855F7",    # Electric Violet
    "emerald": "#10B981",   # Vibrant Emerald Green
    "blush": "#F472B6",     # Soft Modern Baby Pink
    "rose": "#F472B6",      # Soft Modern Baby Pink
    "amber": "#F59E0B",     # Warm Gold / Solar Amber
    "crimson": "#EF4444",   # Bold Crimson Red
}

def hex_to_rgb_float(hex_code: str) -> Tuple[float, float, float]:
    """Converts a hex string like '#0EA5E9' to (r, g, b) floats in 0.0 - 1.0."""
    h = str(hex_code or "").lstrip('#')
    if len(h) != 6:
        h = '0EA5E9'
    return tuple(int(h[i:i+2], 16) / 255.0 for i in (0, 2, 4))


def float_to_rgb_color(r: float, g: float, b: float) -> RGBColor:
    """Clamps and converts float RGB values (0.0 - 1.0) into a python-pptx RGBColor."""
    return RGBColor(
        max(0, min(255, int(r * 255))),
        max(0, min(255, int(g * 255))),
        max(0, min(255, int(b * 255)))
    )


def calculate_duo_tone_secondary(seed_hex: str) -> str:
    """
    Calculates the harmonic Duo-Tone secondary accent hex.
    Curated Color Wheel Harmony pairings:
    - Royal Indigo (#6366F1 / Blue)   -> Warm Amber / Gold (#F59E0B)
    - Electric Cyan (#06B6D4 / Teal)   -> Deep Purple / Violet (#8B5CF6)
    - Emerald Green (#10B981)          -> Ocean Cyan (#06B6D4)
    - Modern Slate Blue (#2563EB)      -> Coral Flame (#F97316)
    - Crimson Rose (#E11D48)           -> Golden Amber (#F59E0B)
    """
    r, g, b = hex_to_rgb_float(seed_hex)
    h, l, s = colorsys.rgb_to_hls(r, g, b)

    if 0.58 <= h <= 0.72:      # Indigo / Blue
        return "#F59E0B"       # Warm Amber / Gold
    elif 0.44 <= h < 0.58:     # Cyan / Teal
        return "#8B5CF6"       # Electric Purple
    elif 0.25 <= h < 0.44:     # Emerald / Green
        return "#06B6D4"       # Ocean Cyan
    elif 0.72 < h <= 0.88:     # Purple / Violet
        return "#06B6D4"       # Electric Cyan
    elif 0.08 <= h < 0.25:     # Amber / Yellow
        return "#3B82F6"       # Electric Blue
    else:                      # Red / Coral
        return "#F59E0B"       # Golden Amber


def generate_dynamic_theme(seed_hex: str, mood: str = "dark", secondary_hex: Optional[str] = None) -> Dict[str, RGBColor]:
    """
    Mathematical Zero-Token Color Engine with Duo-Tone Color Harmony:
    From 1 seed hex, derives rich palettes for 3 distinct presentation modes:
    1. 'dark': Deep obsidian canvas + dark glass cards + luminous border + Duo-Tone accents
    2. 'light_canvas' (or 'light'): Rich pastel tinted canvas + Pure crisp white pop-out cards + tinted border
    3. 'light_cards': Soft neutral slate canvas + Brand-tinted glass cards + deep brand border
    """
    r, g, b = hex_to_rgb_float(seed_hex)
    h, l, s = colorsys.rgb_to_hls(r, g, b)

    sec_hex = secondary_hex or calculate_duo_tone_secondary(seed_hex)
    sr, sg, sb = hex_to_rgb_float(sec_hex)
    sh, sl, ss = colorsys.rgb_to_hls(sr, sg, sb)

    if mood == "dark":
        # Mode 1: Dark Obsidian (Keynote Impact)
        bg_r, bg_g, bg_b = colorsys.hls_to_rgb(h, 0.055, min(s, 0.28))
        card_r, card_g, card_b = colorsys.hls_to_rgb(h, 0.115, min(s, 0.22))
        bdr_r, bdr_g, bdr_b = colorsys.hls_to_rgb(h, 0.24, min(s, 0.38))
        acc_r, acc_g, acc_b = colorsys.hls_to_rgb(h, max(0.55, min(l, 0.70)), min(1.0, max(s, 0.85)))
        badge_r, badge_g, badge_b = colorsys.hls_to_rgb(h, 0.78, min(s, 0.70))

        sec_acc_r, sec_acc_g, sec_acc_b = colorsys.hls_to_rgb(sh, max(0.56, min(sl, 0.68)), min(1.0, max(ss, 0.90)))

        return {
            "bg": float_to_rgb_color(bg_r, bg_g, bg_b),
            "card_bg": float_to_rgb_color(card_r, card_g, card_b),
            "card_border": float_to_rgb_color(bdr_r, bdr_g, bdr_b),
            "title": RGBColor(248, 250, 252),
            "heading": RGBColor(241, 245, 249),
            "body": RGBColor(203, 213, 225),
            "accent": float_to_rgb_color(acc_r, acc_g, acc_b),
            "accent_secondary": float_to_rgb_color(sec_acc_r, sec_acc_g, sec_acc_b),
            "badge_text": float_to_rgb_color(badge_r, badge_g, badge_b),
            "divider": float_to_rgb_color(bdr_r, bdr_g, bdr_b)
        }
    elif mood in ("light_cards", "tinted_cards", "cards"):
        # Mode 3: Neutral Slate Canvas + Brand-Tinted Cards
        bg_r, bg_g, bg_b = colorsys.hls_to_rgb(h, 0.965, 0.06)
        card_r, card_g, card_b = colorsys.hls_to_rgb(h, 0.94, min(s, 0.38))
        bdr_r, bdr_g, bdr_b = colorsys.hls_to_rgb(h, 0.78, min(s, 0.45))
        acc_r, acc_g, acc_b = colorsys.hls_to_rgb(h, 0.42, min(1.0, max(s, 0.85)))
        hd_r, hd_g, hd_b = colorsys.hls_to_rgb(h, 0.28, min(s, 0.60))

        sec_acc_r, sec_acc_g, sec_acc_b = colorsys.hls_to_rgb(sh, 0.44, min(1.0, max(ss, 0.90)))

        return {
            "bg": float_to_rgb_color(bg_r, bg_g, bg_b),
            "card_bg": float_to_rgb_color(card_r, card_g, card_b),
            "card_border": float_to_rgb_color(bdr_r, bdr_g, bdr_b),
            "title": RGBColor(15, 23, 42),
            "heading": float_to_rgb_color(hd_r, hd_g, hd_b),
            "body": RGBColor(51, 65, 85),
            "accent": float_to_rgb_color(acc_r, acc_g, acc_b),
            "accent_secondary": float_to_rgb_color(sec_acc_r, sec_acc_g, sec_acc_b),
            "badge_text": float_to_rgb_color(acc_r, acc_g, acc_b),
            "divider": float_to_rgb_color(bdr_r, bdr_g, bdr_b)
        }
    else:
        # Mode 2: 'light_canvas' (or default 'light'):
        bg_r, bg_g, bg_b = colorsys.hls_to_rgb(h, 0.925, min(s, 0.42))
        bdr_r, bdr_g, bdr_b = colorsys.hls_to_rgb(h, 0.82, min(s, 0.35))
        acc_r, acc_g, acc_b = colorsys.hls_to_rgb(h, 0.44, min(1.0, max(s, 0.85)))

        sec_acc_r, sec_acc_g, sec_acc_b = colorsys.hls_to_rgb(sh, 0.44, min(1.0, max(ss, 0.90)))

        return {
            "bg": float_to_rgb_color(bg_r, bg_g, bg_b),
            "card_bg": RGBColor(255, 255, 255),
            "card_border": float_to_rgb_color(bdr_r, bdr_g, bdr_b),
            "title": RGBColor(15, 23, 42),
            "heading": RGBColor(30, 41, 59),
            "body": RGBColor(71, 85, 105),
            "accent": float_to_rgb_color(acc_r, acc_g, acc_b),
            "accent_secondary": float_to_rgb_color(sec_acc_r, sec_acc_g, sec_acc_b),
            "badge_text": float_to_rgb_color(acc_r, acc_g, acc_b),
            "divider": float_to_rgb_color(bdr_r, bdr_g, bdr_b)
        }


def resolve_theme_palette(theme_name: str, mode: Optional[str] = "dark") -> Dict[str, RGBColor]:
    """Resolves presentation theme and per-slide mode into an executive RGBColor palette."""
    t_clean = str(theme_name or "midnight").strip().lower()
    m_clean = str(mode or "dark").strip().lower()

    if t_clean.startswith("#") or (len(t_clean) == 6 and all(c in "0123456789abcdef" for c in t_clean)):
        seed_hex = t_clean if t_clean.startswith("#") else f"#{t_clean}"
        return generate_dynamic_theme(seed_hex, m_clean)

    seed = THEME_SEEDS.get(t_clean, "#0EA5E9")
    return generate_dynamic_theme(seed, m_clean)


def get_image_stream(image_data: Optional[str]) -> Optional[io.BytesIO]:
    """Decodes a Base64 data URI, raw Base64 string, or fetches HTTP URL into an in-memory io.BytesIO stream."""
    if not image_data:
        return None
    try:
        if isinstance(image_data, str) and (image_data.startswith("http://") or image_data.startswith("https://")):
            import urllib.request
            req = urllib.request.Request(image_data, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=10) as response:
                return io.BytesIO(response.read())

        raw_b64 = image_data
        if "base64," in image_data:
            raw_b64 = image_data.split("base64,", 1)[1]
        img_bytes = base64.b64decode(raw_b64)
        return io.BytesIO(img_bytes)
    except Exception as e:
        print(f"[PPTX Builder] Error decoding image: {e}")
        return None


def create_dark_glass_background(image_data: str, theme_bg: RGBColor, darkness_blend: float = 0.82) -> Optional[io.BytesIO]:
    """
    Takes an organic photographic visual (base64 data URI), center-crops to 16:9,
    applies subtle Gaussian blur to soften high-frequency distracting elements,
    and blends with 80-85% dark glass tint matching the slide's obsidian/navy canvas.
    Returns an in-memory JPEG stream for native python-pptx add_picture.
    """
    try:
        if not image_data:
            return None
        raw_b64 = image_data
        if "base64," in image_data:
            raw_b64 = image_data.split("base64,", 1)[1]
        raw_bytes = base64.b64decode(raw_b64)
        pil_img = Image.open(io.BytesIO(raw_bytes)).convert("RGB")

        target_w, target_h = 1920, 1080
        orig_w, orig_h = pil_img.size

        # Center-crop to 16:9
        target_aspect = target_w / target_h
        orig_aspect = orig_w / orig_h
        if orig_aspect > target_aspect:
            new_w = int(orig_h * target_aspect)
            left = (orig_w - new_w) // 2
            pil_img = pil_img.crop((left, 0, left + new_w, orig_h))
        else:
            new_h = int(orig_w / target_aspect)
            top = (orig_h - new_h) // 2
            pil_img = pil_img.crop((0, top, orig_w, top + new_h))

        pil_img = pil_img.resize((target_w, target_h), Image.Resampling.LANCZOS)
        pil_img = pil_img.filter(ImageFilter.GaussianBlur(radius=2.5))

        dark_rgb = (theme_bg[0], theme_bg[1], theme_bg[2])
        dark_layer = Image.new("RGB", (target_w, target_h), color=dark_rgb)
        blended = Image.blend(pil_img, dark_layer, darkness_blend)

        out_stream = io.BytesIO()
        blended.save(out_stream, format="JPEG", quality=90)
        out_stream.seek(0)
        return out_stream
    except Exception as e:
        print(f"[Dark Glass Background Warning] {e}")
        return None


def add_fitted_picture(slide, img_stream: io.BytesIO, card_left, card_top, card_w, card_h, scale: float = 1.0):
    """
    Fits an image nicely inside a bounding card preserving original aspect ratio, scaled by scale factor.
    """
    try:
        img_stream.seek(0)
        pil_img = Image.open(img_stream)
        img_w_px, img_h_px = pil_img.size
        if img_h_px == 0:
            return

        img_aspect = img_w_px / img_h_px

        pad_x = Inches(0.2)
        pad_y = Inches(0.2)
        inner_left = card_left + pad_x
        inner_top = card_top + pad_y
        max_w = card_w - (pad_x * 2)
        max_h = card_h - (pad_y * 2)

        box_aspect = max_w / max_h

        if img_aspect > box_aspect:
            w = max_w
            h = w / img_aspect
        else:
            h = max_h
            w = h * img_aspect

        # Apply user resize scaling (clamped between 0.3 and 1.6)
        s = max(0.3, min(1.6, float(scale if scale is not None else 1.0)))
        w = w * s
        h = h * s
        x = inner_left + (max_w - w) / 2
        y = inner_top + (max_h - h) / 2

        img_stream.seek(0)
        slide.shapes.add_picture(img_stream, x, y, width=w, height=h)
    except Exception as e:
        print(f"[PPTX Builder] Error inserting picture: {e}")


def render_bullet_runs(paragraph, text: str, theme: Dict[str, RGBColor], font_size: int = 16):
    """
    Renders clean, executive bullet runs with bold lead before colon.
    Strictly strips and suppresses all raw asterisks (** or *) from slides!
    """
    clean_text = str(text).strip()
    clean_text = re.sub(r'^[•\-]\s*|^\*(?!\*)\s*', '', clean_text).strip()

    # Bullet symbol run with theme accent
    bullet_run = paragraph.add_run()
    bullet_run.text = "•  "
    bullet_run.font.name = "Segoe UI"
    bullet_run.font.size = Pt(font_size)
    bullet_run.font.bold = True
    bullet_run.font.color.rgb = theme["accent"]

    # If markdown bold markers **lead** exist, extract clean lead without asterisks
    if "**" in clean_text:
        match = re.search(r'\*\*(.*?)\*\*(.*)', clean_text)
        if match:
            lead = match.group(1).replace("**", "").replace("*", "").strip()
            rest = match.group(2).replace("**", "").replace("*", "").strip()
            if not lead.endswith(":"):
                lead = f"{lead}:" if rest else lead
            r_lead = paragraph.add_run()
            r_lead.text = f"{lead} "
            r_lead.font.name = "Segoe UI"
            r_lead.font.size = Pt(font_size)
            r_lead.font.bold = True
            r_lead.font.color.rgb = theme["heading"]

            if rest:
                r_body = paragraph.add_run()
                r_body.text = rest
                r_body.font.name = "Segoe UI"
                r_body.font.size = Pt(font_size)
                r_body.font.bold = False
                r_body.font.color.rgb = theme["body"]
            return

    # Remove all markdown asterisks completely
    clean_text = clean_text.replace("**", "").replace("*", "").strip()

    # Check for natural executive lead: 'Hardware Maturation: The industry...'
    col_pos = clean_text.find(":")
    if 0 < col_pos <= 50 and not clean_text[:col_pos + 1].startswith("http"):
        lead = clean_text[:col_pos + 1].strip()
        rest = clean_text[col_pos + 1:].strip()

        r_lead = paragraph.add_run()
        r_lead.text = f"{lead} "
        r_lead.font.name = "Segoe UI"
        r_lead.font.size = Pt(font_size)
        r_lead.font.bold = True
        r_lead.font.color.rgb = theme["heading"]

        if rest:
            r_body = paragraph.add_run()
            r_body.text = rest
            r_body.font.name = "Segoe UI"
            r_body.font.size = Pt(font_size)
            r_body.font.bold = False
            r_body.font.color.rgb = theme["body"]
    else:
        r = paragraph.add_run()
        r.text = clean_text
        r.font.name = "Segoe UI"
        r.font.size = Pt(font_size)
        r.font.bold = False
        r.font.color.rgb = theme["body"]


def parse_stat_item(item) -> Tuple[str, str, str]:
    """Extracts (stat_number, stat_label, stat_description) from list, dict, or string."""
    def clean(s):
        return str(s).replace("**", "").replace("*", "").strip() if s else ""

    if isinstance(item, list):
        num = clean(item[0]) if len(item) > 0 else "10x"
        label = clean(item[1]) if len(item) > 1 else "Metric"
        desc = clean(item[2]) if len(item) > 2 else ""
        return num, label, desc
    elif isinstance(item, dict):
        return (
            clean(item.get("stat") or item.get("metric") or "10x"),
            clean(item.get("label") or item.get("title") or "Metric"),
            clean(item.get("desc") or item.get("subtext") or "")
        )
    elif isinstance(item, str):
        c_item = clean(item)
        parts = [p.strip() for p in re.split(r'[:|–-]', c_item, maxsplit=2)]
        if len(parts) >= 3:
            return parts[0], parts[1], parts[2]
        elif len(parts) == 2:
            return parts[0], parts[1], ""
        return c_item, "Key Indicator", ""
    return "100%", "Benchmark", ""


def parse_timeline_item(item, idx: int) -> Tuple[str, str, str]:
    """Extracts (step_badge, step_title, step_description) from list, dict, or string."""
    def clean(s):
        return str(s).replace("**", "").replace("*", "").strip() if s else ""

    default_badge = f"Phase {idx + 1:02d}"
    if isinstance(item, list):
        if len(item) == 1:
            return default_badge, clean(item[0]), ""
        elif len(item) == 2:
            first = clean(item[0])
            if any(k in first.lower() for k in ["phase", "step", "stage", "milestone"]):
                return first, clean(item[1]), ""
            return default_badge, first, clean(item[1])
        else:
            return clean(item[0]), clean(item[1]), " — ".join(clean(x) for x in item[2:])
    elif isinstance(item, dict):
        return (
            clean(item.get("badge") or item.get("step") or default_badge),
            clean(item.get("title") or "Milestone"),
            clean(item.get("desc") or item.get("deliverables") or "")
        )
    elif isinstance(item, str):
        c_item = clean(item)
        parts = [p.strip() for p in c_item.split(":", 1)]
        if len(parts) == 2:
            return parts[0], parts[1], ""
        return default_badge, c_item, ""
    return default_badge, "Milestone", ""


def render_single_slide(
    prs: Presentation,
    dsl: SlideDSL,
    slide_index: int = 1,
    total_slides: int = 1,
    theme: Optional[Dict[str, RGBColor]] = None,
    theme_name: str = "midnight"
):
    """
    Renders an individual SlideDSL object onto a blank 16:9 slide with modern studio theme styling.
    Supports layouts: 'hero', 'stats', 'timeline', 'title_image_right', '2col', '3col', 'title_content', 'chart_slide', 'flowchart', 'statement'.
    Supports per-slide theme_mode: 'dark', 'light_canvas', or 'light_cards'.
    """
    slide_mode = getattr(dsl, "theme_mode", None)
    effective_theme = getattr(dsl, "seed_color", None) or getattr(dsl, "theme", None) or theme_name
    theme = resolve_theme_palette(effective_theme, slide_mode or "dark")

    blank_layout = prs.slide_layouts[6]
    slide = prs.slides.add_slide(blank_layout)

    # Normalize layout key cleanly across Enums, strings, and mixed cases
    layout_key = str(getattr(dsl.l, "value", dsl.l)).split(".")[-1].lower()

    # ------------------ LAYOUT 1: HERO / COVER SLIDE ------------------
    if layout_key == "hero":
        # Slide Canvas Solid Background (matching studio theme)
        bg_fill = slide.background.fill
        bg_fill.solid()
        bg_fill.fore_color.rgb = theme["bg"]

        # Slide Index Badge in top right corner (e.g. "1 / 9") matching Web UI
        if total_slides > 1:
            badge_box = slide.shapes.add_textbox(Inches(11.4), Inches(0.45), Inches(1.133), Inches(0.4))
            btf = badge_box.text_frame
            btf.word_wrap = False
            bp = btf.paragraphs[0]
            bp.text = f"{slide_index} / {total_slides}"
            bp.font.name = "Segoe UI"
            bp.font.size = Pt(11)
            bp.font.color.rgb = theme.get("badge_text", RGBColor(148, 163, 184))

        has_image = bool(dsl.image_data)
        subtitle = "Strategic Vision & Executive Briefing"
        presenter = "Netroot AI Strategic Presentation • 2026"
        if isinstance(dsl.c, list) and len(dsl.c) > 0:
            if dsl.c[0]:
                subtitle = " - ".join(dsl.c[0]) if isinstance(dsl.c[0], list) else str(dsl.c[0])
            if len(dsl.c) > 1 and dsl.c[1]:
                presenter = " - ".join(dsl.c[1]) if isinstance(dsl.c[1], list) else str(dsl.c[1])

        if has_image:
            left_w = Inches(7.2)
            left_x = Inches(0.8)
            top_y = Inches(1.1)
            card_h = Inches(5.3)

            # Left Content Card
            card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left_x, top_y, left_w, card_h)
            card.fill.solid()
            card.fill.fore_color.rgb = theme["card_bg"]
            card.line.color.rgb = theme["card_border"]
            card.line.width = Pt(1.0)

            tb = slide.shapes.add_textbox(left_x + Inches(0.5), top_y + Inches(0.5), left_w - Inches(1.0), card_h - Inches(1.0))
            ctf = tb.text_frame
            ctf.word_wrap = True
            ctf.margin_left = ctf.margin_top = ctf.margin_right = ctf.margin_bottom = 0

            p1 = ctf.paragraphs[0]
            p1.text = dsl.t
            p1.font.name = "Segoe UI"
            p1.font.size = Pt(38)
            p1.font.bold = True
            p1.font.color.rgb = theme["title"]
            p1.space_after = Pt(16)

            p2 = ctf.add_paragraph()
            p2.text = subtitle
            p2.font.name = "Segoe UI"
            p2.font.size = Pt(16)
            p2.font.color.rgb = theme["body"]
            p2.line_spacing = 1.2
            p2.space_after = Pt(24)

            p3 = ctf.add_paragraph()
            p3.text = f"—  {presenter}"
            p3.font.name = "Segoe UI"
            p3.font.size = Pt(13)
            p3.font.bold = True
            p3.font.color.rgb = theme["badge_text"]

            # Right Hero Image Card
            right_x = Inches(8.3)
            right_w = Inches(4.233)
            img_card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, right_x, top_y, right_w, card_h)
            img_card.fill.solid()
            img_card.fill.fore_color.rgb = theme["card_bg"]
            img_card.line.color.rgb = theme["card_border"]
            img_card.line.width = Pt(1.0)

            img_stream = get_image_stream(dsl.image_data)
            if img_stream:
                scale_val = getattr(dsl, 'image_scale', 1.0) or 1.0
                add_fitted_picture(slide, img_stream, right_x, top_y, right_w, card_h, scale=scale_val)

        else:
            # Full-Width Hero Card
            hero_x = Inches(0.8)
            hero_y = Inches(1.1)
            hero_w = Inches(11.733)
            hero_h = Inches(5.3)

            card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, hero_x, hero_y, hero_w, hero_h)
            card.fill.solid()
            card.fill.fore_color.rgb = theme["card_bg"]
            card.line.color.rgb = theme["card_border"]
            card.line.width = Pt(1.0)

            tb = slide.shapes.add_textbox(hero_x + Inches(0.8), hero_y + Inches(0.8), hero_w - Inches(1.6), hero_h - Inches(1.6))
            ctf = tb.text_frame
            ctf.word_wrap = True
            ctf.margin_left = ctf.margin_top = ctf.margin_right = ctf.margin_bottom = 0

            p1 = ctf.paragraphs[0]
            p1.text = dsl.t
            p1.font.name = "Segoe UI"
            p1.font.size = Pt(44)
            p1.font.bold = True
            p1.font.color.rgb = theme["title"]
            p1.space_after = Pt(18)

            p2 = ctf.add_paragraph()
            p2.text = subtitle
            p2.font.name = "Segoe UI"
            p2.font.size = Pt(18)
            p2.font.color.rgb = theme["body"]
            p2.line_spacing = 1.25
            p2.space_after = Pt(32)

            p3 = ctf.add_paragraph()
            p3.text = f"—  {presenter}"
            p3.font.name = "Segoe UI"
            p3.font.size = Pt(14)
            p3.font.bold = True
            p3.font.color.rgb = theme["badge_text"]

        return

    # ------------------ STANDARD SLIDES HEADER ------------------
    # 1. Slide Canvas Solid Background (matching studio theme)
    bg_fill = slide.background.fill
    bg_fill.solid()
    bg_fill.fore_color.rgb = theme["bg"]

    # 2. Slide Title
    title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(10.5), Inches(0.75))
    tf = title_box.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
    p = tf.paragraphs[0]
    p.text = dsl.t
    p.font.name = "Segoe UI"
    p.font.size = Pt(28)
    p.font.bold = True
    p.font.color.rgb = theme["title"]

    # 3. Slide Index Badge (e.g. "2 / 10")
    if total_slides > 1:
        badge_box = slide.shapes.add_textbox(Inches(11.4), Inches(0.45), Inches(1.133), Inches(0.4))
        btf = badge_box.text_frame
        btf.word_wrap = False
        bp = btf.paragraphs[0]
        bp.text = f"{slide_index} / {total_slides}"
        bp.font.name = "Segoe UI"
        bp.font.size = Pt(13)
        bp.font.bold = True
        bp.font.color.rgb = theme["badge_text"]

    # 4. Modern Subtle Header Divider Line
    divider = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.22), Inches(11.733), Inches(0.012))
    divider.fill.solid()
    divider.fill.fore_color.rgb = theme["divider"]
    divider.line.fill.background()

    top = Inches(1.45)
    card_h = Inches(5.45)

    # ------------------ LAYOUT 2: STATS / KPI BENTO GRID ------------------
    if layout_key == "stats":
        items = dsl.c[:4] if isinstance(dsl.c, list) else []
        if not items:
            items = [["100%", "Benchmark", "Standard baseline metrics."]]
        num_items = len(items)
        if num_items <= 3:
            card_w = Inches(3.644)
            gap = Inches(0.4)
        else:
            card_w = Inches(2.72)
            gap = Inches(0.28)

        for i, item in enumerate(items):
            left_pos = Inches(0.8) + i * (card_w + gap)
            card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left_pos, top, card_w, card_h)
            card.fill.solid()
            card.fill.fore_color.rgb = theme["card_bg"]
            card.line.color.rgb = theme["card_border"]
            card.line.width = Pt(1.0)

            tb = slide.shapes.add_textbox(left_pos + Inches(0.35), top + Inches(0.4), card_w - Inches(0.7), card_h - Inches(0.8))
            ctf = tb.text_frame
            ctf.word_wrap = True
            ctf.margin_left = ctf.margin_top = ctf.margin_right = ctf.margin_bottom = 0

            stat_num, stat_label, stat_desc = parse_stat_item(item)

            # Metric Pill Tag
            p_tag = ctf.paragraphs[0]
            p_tag.text = f"METRIC {i+1:02d}"
            p_tag.font.name = "Segoe UI"
            p_tag.font.size = Pt(11)
            p_tag.font.bold = True
            p_tag.font.color.rgb = theme["badge_text"]
            p_tag.space_after = Pt(12)

            # Big Stat Number (Duo-Tone Color Harmony Alternation)
            p_num = ctf.add_paragraph()
            p_num.text = stat_num
            p_num.font.name = "Segoe UI"
            p_num.font.size = Pt(38)
            p_num.font.bold = True
            stat_color = theme["accent"] if (i % 2 == 0) else theme.get("accent_secondary", theme["accent"])
            p_num.font.color.rgb = stat_color
            p_num.space_after = Pt(10)

            # Stat Label
            p_lbl = ctf.add_paragraph()
            p_lbl.text = stat_label
            p_lbl.font.name = "Segoe UI"
            p_lbl.font.size = Pt(16)
            p_lbl.font.bold = True
            p_lbl.font.color.rgb = theme["heading"]
            p_lbl.space_after = Pt(12)

            # Stat Context
            if stat_desc:
                p_desc = ctf.add_paragraph()
                p_desc.text = stat_desc
                p_desc.font.name = "Segoe UI"
                p_desc.font.size = Pt(13)
                p_desc.font.color.rgb = theme["body"]
                p_desc.line_spacing = 1.15

        return

    # ------------------ LAYOUT 3: TIMELINE / ROADMAP ------------------
    if layout_key == "timeline":
        steps = dsl.c[:4] if isinstance(dsl.c, list) else []
        if not steps:
            steps = [["Phase 01: Inception", "Establish initial framework."]]
        num_steps = len(steps)
        if num_steps <= 3:
            card_w = Inches(3.644)
            gap = Inches(0.4)
        else:
            card_w = Inches(2.72)
            gap = Inches(0.28)

        # Subtle connecting horizontal line
        conn_line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), top + Inches(0.55), Inches(11.733), Inches(0.015))
        conn_line.fill.solid()
        conn_line.fill.fore_color.rgb = theme["divider"]
        conn_line.line.fill.background()

        for i, step_item in enumerate(steps):
            left_pos = Inches(0.8) + i * (card_w + gap)
            card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left_pos, top, card_w, card_h)
            card.fill.solid()
            card.fill.fore_color.rgb = theme["card_bg"]
            card.line.color.rgb = theme["card_border"]
            card.line.width = Pt(1.0)

            tb = slide.shapes.add_textbox(left_pos + Inches(0.35), top + Inches(0.35), card_w - Inches(0.7), card_h - Inches(0.7))
            ctf = tb.text_frame
            ctf.word_wrap = True
            ctf.margin_left = ctf.margin_top = ctf.margin_right = ctf.margin_bottom = 0

            step_badge, step_title, step_desc = parse_timeline_item(step_item, i)

            # Step Indicator
            p_step = ctf.paragraphs[0]
            clean_badge = (step_badge or "").strip()
            if clean_badge and clean_badge.lower() not in (f"phase {i+1:02d}", f"phase {i+1}", "milestone", "step", f"step {i+1}"):
                p_step.text = f"PHASE {i+1:02d}  •  {clean_badge.upper()}"
            else:
                p_step.text = f"PHASE {i+1:02d}"
            p_step.font.name = "Segoe UI"
            p_step.font.size = Pt(12)
            p_step.font.bold = True
            p_step.font.color.rgb = theme["accent"]
            p_step.space_after = Pt(12)

            # Step Title
            p_title = ctf.add_paragraph()
            p_title.text = step_title
            p_title.font.name = "Segoe UI"
            p_title.font.size = Pt(18)
            p_title.font.bold = True
            p_title.font.color.rgb = theme["heading"]
            p_title.space_after = Pt(12)

            # Step Deliverables / Description
            if step_desc:
                p_desc = ctf.add_paragraph()
                p_desc.space_after = Pt(8)
                p_desc.line_spacing = 1.15
                render_bullet_runs(p_desc, step_desc, theme, font_size=13)

            # Render connecting directional arrow between timeline phase cards
            if i < num_steps - 1:
                arrow_w = Inches(0.24) if num_steps > 3 else Inches(0.32)
                arrow_h = Inches(0.18) if num_steps > 3 else Inches(0.22)
                arrow_x = left_pos + card_w + (gap - arrow_w) / 2
                arrow_y = top + Inches(0.48)
                arrow = slide.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, arrow_x, arrow_y, arrow_w, arrow_h)
                arrow.fill.solid()
                arrow.fill.fore_color.rgb = theme["accent"]
                arrow.line.fill.background()

        return

    # ------------------ LAYOUT 8: CHART SLIDE (NATIVE EXCEL CHART) ------------------
    if layout_key == "chart_slide":
        cd = dsl.chart_data if isinstance(dsl.chart_data, dict) else {}
        raw_cats = cd.get("categories") or []
        series_list = cd.get("series") or []

        # If no genuine categories or series exist, do not generate a phantom Q1-Q4 chart!
        # Fall through to default clean layout.
        if raw_cats and series_list:
            chart_w = Inches(6.8)
            takeaways_w = Inches(4.65)
            gap = Inches(0.283)

            chart_x = Inches(0.8)
            takeaways_x = chart_x + chart_w + gap

            # Left Container Card for Chart
            card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, chart_x, top, chart_w, card_h)
            card.fill.solid()
            card.fill.fore_color.rgb = theme["card_bg"]
            card.line.color.rgb = theme["card_border"]
            card.line.width = Pt(1.0)

            # Build python-pptx ChartData
            chart_title = cd.get("title") or dsl.t
            categories = [str(c) for c in raw_cats]

            chart_data_obj = CategoryChartData()
            chart_data_obj.categories = categories

            if isinstance(series_list, dict):
                series_list = [series_list]
            elif isinstance(series_list, list) and series_list and isinstance(series_list[0], (int, float, str)) and not isinstance(series_list[0], dict):
                series_list = [{"name": chart_title, "values": series_list}]

        for s in series_list:
            if isinstance(s, dict):
                s_name = str(s.get("name") or s.get("label") or "Metric")
                raw_vals = s.get("values")
                if raw_vals is None:
                    raw_vals = s.get("data") or s.get("points") or s.get("val") or []
                if not isinstance(raw_vals, list):
                    raw_vals = [raw_vals] if raw_vals is not None else []
            elif isinstance(s, (int, float)):
                s_name = "Metric"
                raw_vals = [s]
            else:
                s_name = "Metric"
                raw_vals = []

            clean_vals = []
            for v in raw_vals:
                if isinstance(v, (int, float)):
                    clean_vals.append(float(v))
                else:
                    m = re.search(r"[-+]?\d*\.?\d+", str(v).replace(",", ""))
                    clean_vals.append(float(m.group(0)) if m else 0.0)

            while len(clean_vals) < len(categories):
                clean_vals.append(0.0)
            clean_vals = clean_vals[:len(categories)]
            chart_data_obj.add_series(s_name, tuple(clean_vals))

        c_type = str(dsl.chart_type or "bar").lower()
        if "line" in c_type:
            xl_type = XL_CHART_TYPE.LINE_MARKERS
        elif "donut" in c_type or "pie" in c_type:
            xl_type = XL_CHART_TYPE.DOUGHNUT
        else:
            xl_type = XL_CHART_TYPE.COLUMN_CLUSTERED

        # Place native PowerPoint Excel Chart nicely inside card
        pad = Inches(0.3)
        chart_shape = slide.shapes.add_chart(
            xl_type,
            chart_x + pad,
            top + pad,
            chart_w - (pad * 2),
            card_h - (pad * 2),
            chart_data_obj
        )
        chart = chart_shape.chart
        chart.has_legend = True
        chart.legend.position = XL_LEGEND_POSITION.TOP
        chart.legend.include_in_layout = False

        # Duo-Tone Series Fill (Series 1: Primary Accent, Series 2: Secondary Glow Accent)
        try:
            s_list = chart.series
            if len(s_list) > 0:
                s_list[0].format.fill.solid()
                s_list[0].format.fill.fore_color.rgb = theme["accent"]
            if len(s_list) > 1:
                s_list[1].format.fill.solid()
                s_list[1].format.fill.fore_color.rgb = theme.get("accent_secondary", theme["accent"])
        except Exception:
            pass

        # Right Container Card for Key Insights / Takeaways
        t_card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, takeaways_x, top, takeaways_w, card_h)
        t_card.fill.solid()
        t_card.fill.fore_color.rgb = theme["card_bg"]
        t_card.line.color.rgb = theme["card_border"]
        t_card.line.width = Pt(1.0)

        tb = slide.shapes.add_textbox(takeaways_x + Inches(0.4), top + Inches(0.4), takeaways_w - Inches(0.8), card_h - Inches(0.8))
        ctf = tb.text_frame
        ctf.word_wrap = True
        ctf.margin_left = ctf.margin_top = ctf.margin_right = ctf.margin_bottom = 0

        hp = ctf.paragraphs[0]
        hp.text = "Key Takeaways"
        hp.font.name = "Segoe UI"
        hp.font.size = Pt(15)
        hp.font.bold = True
        hp.font.color.rgb = theme["heading"]
        hp.space_after = Pt(14)

        takeaways = dsl.c if isinstance(dsl.c, list) else [str(dsl.c)]
        for item in takeaways:
            text = " - ".join(item) if isinstance(item, list) else str(item)
            p_bullet = ctf.add_paragraph()
            p_bullet.space_after = Pt(12)
            p_bullet.line_spacing = 1.15
            render_bullet_runs(p_bullet, text, theme, font_size=14)

        return

    # ------------------ LAYOUT 9: FLOWCHART / ARCHITECTURE PIPELINE ------------------
    if layout_key == "flowchart":
        nodes = dsl.c[:4] if isinstance(dsl.c, list) else []
        if not nodes:
            nodes = [["01. Ingestion", "Stream Processing", "Real-time Kafka streaming."]]
        num_nodes = len(nodes)

        start_x = Inches(0.8)
        arrow_w = Inches(0.42)
        arrow_h = Inches(0.28)

        if num_nodes == 2:
            card_w = Inches(5.1)
            gap = Inches(1.533)
        elif num_nodes == 3:
            card_w = Inches(3.4)
            gap = Inches(0.766)
        else: # 4 nodes
            card_w = Inches(2.55)
            gap = Inches(0.511)

        for i, node_data in enumerate(nodes):
            node_x = start_x + i * (card_w + gap)

            # Node Box
            card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, node_x, top, card_w, card_h)
            card.fill.solid()
            card.fill.fore_color.rgb = theme["card_bg"]
            card.line.color.rgb = theme["card_border"]
            card.line.width = Pt(1.0)

            step_num = f"STEP {i+1:02d}"
            title = "Process Node"
            subtitle = ""
            desc = ""

            if isinstance(node_data, list):
                if len(node_data) == 1:
                    title = str(node_data[0])
                elif len(node_data) == 2:
                    title = str(node_data[0])
                    subtitle = str(node_data[1])
                elif len(node_data) >= 3:
                    title = str(node_data[0])
                    subtitle = str(node_data[1])
                    desc = " — ".join(str(x) for x in node_data[2:])
            elif isinstance(node_data, dict):
                title = str(node_data.get("title") or node_data.get("name") or "Process Node")
                subtitle = str(node_data.get("tech") or node_data.get("subtitle") or "")
                desc = str(node_data.get("desc") or node_data.get("details") or "")
            elif isinstance(node_data, str):
                parts = [p.strip() for p in node_data.split(":", 1)]
                title = parts[0]
                desc = parts[1] if len(parts) > 1 else ""

            tb = slide.shapes.add_textbox(node_x + Inches(0.25), top + Inches(0.35), card_w - Inches(0.5), card_h - Inches(0.7))
            ctf = tb.text_frame
            ctf.word_wrap = True
            ctf.margin_left = ctf.margin_top = ctf.margin_right = ctf.margin_bottom = 0

            # Step Indicator
            p_step = ctf.paragraphs[0]
            p_step.text = step_num
            p_step.font.name = "Segoe UI"
            p_step.font.size = Pt(11)
            p_step.font.bold = True
            p_step.font.color.rgb = theme["accent"]
            p_step.space_after = Pt(10)

            # Node Title
            p_title = ctf.add_paragraph()
            p_title.text = title
            p_title.font.name = "Segoe UI"
            p_title.font.size = Pt(16)
            p_title.font.bold = True
            p_title.font.color.rgb = theme["heading"]
            p_title.space_after = Pt(6)

            # Subtitle / Technology
            if subtitle:
                p_sub = ctf.add_paragraph()
                p_sub.text = subtitle
                p_sub.font.name = "Segoe UI"
                p_sub.font.size = Pt(12)
                p_sub.font.bold = True
                p_sub.font.color.rgb = theme["badge_text"]
                p_sub.space_after = Pt(12)

            # Description Body
            if desc:
                p_desc = ctf.add_paragraph()
                p_desc.line_spacing = 1.15
                render_bullet_runs(p_desc, desc, theme, font_size=13)

            # Render connecting vector arrow between node i and node i+1 (aligned at Step header level)
            if i < num_nodes - 1:
                arrow_w = Inches(0.44) if num_nodes <= 3 else Inches(0.32)
                arrow_h = Inches(0.22) if num_nodes <= 3 else Inches(0.18)
                arrow_x = node_x + card_w + (gap - arrow_w) / 2
                arrow_y = top + Inches(0.48)
                arrow = slide.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, arrow_x, arrow_y, arrow_w, arrow_h)
                arrow.fill.solid()
                arrow.fill.fore_color.rgb = theme["accent"]
                arrow.line.fill.background()

        return

    # ------------------ LAYOUT 6: 2 COLUMNS ------------------
    if layout_key in ["2col", "two_col"]:
        card_w = Inches(5.61)
        gap = Inches(0.513)
        cols_to_render = dsl.c[:2]

        for i, col_data in enumerate(cols_to_render):
            if isinstance(col_data, str):
                col_data = [col_data]
            if not isinstance(col_data, list) or len(col_data) == 0:
                continue

            left = Inches(0.8) + i * (card_w + gap)

            card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, card_w, card_h)
            card.fill.solid()
            card.fill.fore_color.rgb = theme["card_bg"]
            card.line.color.rgb = theme["card_border"]
            card.line.width = Pt(1.0)

            tb = slide.shapes.add_textbox(left + Inches(0.35), top + Inches(0.35), card_w - Inches(0.7), card_h - Inches(0.7))
            ctf = tb.text_frame
            ctf.word_wrap = True
            ctf.margin_left = ctf.margin_top = ctf.margin_right = ctf.margin_bottom = 0

            # Column Heading
            hp = ctf.paragraphs[0]
            hp.text = str(col_data[0])
            hp.font.name = "Segoe UI"
            hp.font.size = Pt(20)
            hp.font.bold = True
            hp.font.color.rgb = theme["heading"]
            hp.space_after = Pt(14)

            # Bullets
            for bullet in col_data[1:]:
                for line in str(bullet).split("\n"):
                    line_str = line.rstrip()
                    if not line_str.strip():
                        continue
                    bp = ctf.add_paragraph()
                    bp.space_after = Pt(10)
                    bp.line_spacing = 1.15
                    if line_str.startswith("    ") or line_str.startswith("\t") or any(line_str.strip().startswith(kw) for kw in ["def ", "if ", "for ", "return ", "class ", "import ", "from "]):
                        bp.text = f"    {line_str.strip()}"
                        bp.font.name = "Consolas"
                        bp.font.size = Pt(13)
                        bp.font.color.rgb = theme["accent"]
                    else:
                        render_bullet_runs(bp, line_str, theme, font_size=14)

        return

    # ------------------ LAYOUT 7: 3 COLUMNS ------------------
    if layout_key in ["3col", "three_col"]:
        card_w = Inches(3.644)
        gap = Inches(0.4)
        cols_to_render = dsl.c[:3]

        for i, col_data in enumerate(cols_to_render):
            if isinstance(col_data, str):
                col_data = [col_data]
            if not isinstance(col_data, list) or len(col_data) == 0:
                continue

            left = Inches(0.8) + i * (card_w + gap)

            card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, card_w, card_h)
            card.fill.solid()
            card.fill.fore_color.rgb = theme["card_bg"]
            card.line.color.rgb = theme["card_border"]
            card.line.width = Pt(1.0)

            tb = slide.shapes.add_textbox(left + Inches(0.3), top + Inches(0.3), card_w - Inches(0.6), card_h - Inches(0.6))
            ctf = tb.text_frame
            ctf.word_wrap = True
            ctf.margin_left = ctf.margin_top = ctf.margin_right = ctf.margin_bottom = 0

            # Column Heading
            hp = ctf.paragraphs[0]
            hp.text = str(col_data[0])
            hp.font.name = "Segoe UI"
            hp.font.size = Pt(18)
            hp.font.bold = True
            hp.font.color.rgb = theme["heading"]
            hp.space_after = Pt(12)

            # Bullets
            for bullet in col_data[1:]:
                for line in str(bullet).split("\n"):
                    line_str = line.rstrip()
                    if not line_str.strip():
                        continue
                    bp = ctf.add_paragraph()
                    bp.space_after = Pt(8)
                    bp.line_spacing = 1.15
                    if line_str.startswith("    ") or line_str.startswith("\t") or any(line_str.strip().startswith(kw) for kw in ["def ", "if ", "for ", "return ", "class ", "import ", "from "]):
                        bp.text = f"    {line_str.strip()}"
                        bp.font.name = "Consolas"
                        bp.font.size = Pt(12)
                        bp.font.color.rgb = theme["accent"]
                    else:
                        render_bullet_runs(bp, line_str, theme, font_size=13)

        return

    # ------------------ LAYOUT: KEYNOTE STATEMENT / THESIS ------------------
    if layout_key in ["statement", "quote", "vision"]:
        items = dsl.c if isinstance(dsl.c, list) else [str(dsl.c)]
        statement_text = ""
        context_text = ""
        if len(items) > 0:
            statement_text = " - ".join(items[0]) if isinstance(items[0], list) else str(items[0])
        if len(items) > 1:
            context_text = " - ".join(items[1]) if isinstance(items[1], list) else str(items[1])

        statement_text = strip_markdown_stars(statement_text)
        context_text = strip_markdown_stars(context_text)

        has_image = bool(dsl.image_data)

        if has_image:
            left_card_w = Inches(6.85)
            left_card_x = Inches(0.8)

            card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left_card_x, top, left_card_w, card_h)
            card.fill.solid()
            card.fill.fore_color.rgb = theme["card_bg"]
            card.line.color.rgb = theme["card_border"]
            card.line.width = Pt(1.0)

            tb = slide.shapes.add_textbox(left_card_x + Inches(0.5), top + Inches(0.4), left_card_w - Inches(1.0), card_h - Inches(0.8))
            ctf = tb.text_frame
            ctf.word_wrap = True
            ctf.margin_left = ctf.margin_top = ctf.margin_right = ctf.margin_bottom = 0

            p1 = ctf.paragraphs[0]
            p1.text = f'"{statement_text}"'
            p1.font.name = "Segoe UI"
            p1.font.size = Pt(24)
            p1.font.bold = True
            p1.font.color.rgb = theme["title"]
            p1.line_spacing = 1.25
            p1.space_after = Pt(24)

            if context_text:
                p2 = ctf.add_paragraph()
                p2.text = context_text
                p2.font.name = "Segoe UI"
                p2.font.size = Pt(15)
                p2.font.color.rgb = theme["body"]
                p2.line_spacing = 1.3

            # Right Image Card
            right_card_x = Inches(7.9)
            right_card_w = Inches(4.633)

            img_card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, right_card_x, top, right_card_w, card_h)
            img_card.fill.solid()
            img_card.fill.fore_color.rgb = theme["card_bg"]
            img_card.line.color.rgb = theme["card_border"]
            img_card.line.width = Pt(1.0)

            img_stream = get_image_stream(dsl.image_data)
            if img_stream:
                scale_val = getattr(dsl, 'image_scale', 1.0) or 1.0
                add_fitted_picture(slide, img_stream, right_card_x, top, right_card_w, card_h, scale=scale_val)

            return
        else:
            # Full-Width Keynote Statement
            card_w = Inches(11.733)
            left = Inches(0.8)

            card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, card_w, card_h)
            card.fill.solid()
            card.fill.fore_color.rgb = theme["card_bg"]
            card.line.color.rgb = theme["card_border"]
            card.line.width = Pt(1.0)

            tb = slide.shapes.add_textbox(left + Inches(0.8), top + Inches(0.6), card_w - Inches(1.6), card_h - Inches(1.2))
            ctf = tb.text_frame
            ctf.word_wrap = True
            ctf.margin_left = ctf.margin_top = ctf.margin_right = ctf.margin_bottom = 0

            p1 = ctf.paragraphs[0]
            p1.text = f'"{statement_text}"'
            p1.font.name = "Segoe UI"
            p1.font.size = Pt(30)
            p1.font.bold = True
            p1.font.color.rgb = theme["title"]
            p1.line_spacing = 1.3
            p1.space_after = Pt(28)

            if context_text:
                p2 = ctf.add_paragraph()
                p2.text = context_text
                p2.font.name = "Segoe UI"
                p2.font.size = Pt(17)
                p2.font.color.rgb = theme["body"]
                p2.line_spacing = 1.35

            return

    # ------------------ LAYOUT 4: SPLIT IMAGE RIGHT ------------------
    has_image = bool(dsl.image_data)
    if layout_key == "title_image_right" or (has_image and layout_key == "title_content"):
        left_card_w = Inches(6.85)
        left_card_x = Inches(0.8)

        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left_card_x, top, left_card_w, card_h)
        card.fill.solid()
        card.fill.fore_color.rgb = theme["card_bg"]
        card.line.color.rgb = theme["card_border"]
        card.line.width = Pt(1.0)

        tb = slide.shapes.add_textbox(left_card_x + Inches(0.4), top + Inches(0.35), left_card_w - Inches(0.8), card_h - Inches(0.7))
        ctf = tb.text_frame
        ctf.word_wrap = True
        ctf.margin_left = ctf.margin_top = ctf.margin_right = ctf.margin_bottom = 0

        for i, item in enumerate(dsl.c):
            text = " - ".join(item) if isinstance(item, list) else str(item)
            para = ctf.paragraphs[0] if i == 0 else ctf.add_paragraph()
            para.space_after = Pt(14)
            para.line_spacing = 1.15
            render_bullet_runs(para, text, theme, font_size=16)

        # Right Image Card
        right_card_x = Inches(7.9)
        right_card_w = Inches(4.633)

        img_card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, right_card_x, top, right_card_w, card_h)
        img_card.fill.solid()
        img_card.fill.fore_color.rgb = theme["card_bg"]
        img_card.line.color.rgb = theme["card_border"]
        img_card.line.width = Pt(1.0)

        img_stream = get_image_stream(dsl.image_data)
        if img_stream:
            scale_val = getattr(dsl, 'image_scale', 1.0) or 1.0
            add_fitted_picture(slide, img_stream, right_card_x, top, right_card_w, card_h, scale=scale_val)

        return

    # ------------------ LAYOUT 5: TITLE CONTENT (DEFAULT) ------------------
    card_w = Inches(11.733)
    left = Inches(0.8)

    card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, card_w, card_h)
    card.fill.solid()
    card.fill.fore_color.rgb = theme["card_bg"]
    card.line.color.rgb = theme["card_border"]
    card.line.width = Pt(1.0)

    tb = slide.shapes.add_textbox(left + Inches(0.5), top + Inches(0.4), card_w - Inches(1.0), card_h - Inches(0.8))
    ctf = tb.text_frame
    ctf.word_wrap = True
    ctf.margin_left = ctf.margin_top = ctf.margin_right = ctf.margin_bottom = 0

    for i, item in enumerate(dsl.c):
        text = " - ".join(item) if isinstance(item, list) else str(item)
        para = ctf.paragraphs[0] if i == 0 else ctf.add_paragraph()
        para.space_after = Pt(16)
        para.line_spacing = 1.2
        render_bullet_runs(para, text, theme, font_size=18)

    return


def generate_pptx(
    slides_input: Union[List[SlideDSL], SlideDSL, dict, list],
    theme_name: str = "midnight"
) -> io.BytesIO:
    """
    Compiles structured presentation slides into an executive-grade 16:9 PowerPoint (.pptx) file.
    Theme options: 'midnight', 'clean', 'aurora', 'emerald'.
    """
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    slides: List[SlideDSL] = []

    # Check if theme was passed inside a dictionary payload
    if isinstance(slides_input, dict):
        if "theme_seed_hex" in slides_input and isinstance(slides_input["theme_seed_hex"], str):
            theme_name = slides_input["theme_seed_hex"]
        elif "seed_color" in slides_input and isinstance(slides_input["seed_color"], str):
            theme_name = slides_input["seed_color"]
        elif "theme" in slides_input and isinstance(slides_input["theme"], str):
            theme_name = slides_input["theme"]

        if "slides" in slides_input and isinstance(slides_input["slides"], list):
            for item in slides_input["slides"]:
                raw = item.model_dump() if isinstance(item, SlideDSL) else dict(item)
                slides.append(SlideDSL.model_validate(strip_markdown_stars(raw)))
        elif "slide" in slides_input and isinstance(slides_input["slide"], dict):
            slides.append(SlideDSL.model_validate(strip_markdown_stars(slides_input["slide"])))
        elif "l" in slides_input and "t" in slides_input:
            slides.append(SlideDSL.model_validate(strip_markdown_stars(slides_input)))
    elif isinstance(slides_input, SlideDSL):
        slides = [SlideDSL.model_validate(strip_markdown_stars(slides_input.model_dump()))]
    elif isinstance(slides_input, list):
        for item in slides_input:
            raw = item.model_dump() if isinstance(item, SlideDSL) else dict(item)
            slides.append(SlideDSL.model_validate(strip_markdown_stars(raw)))

    # Resolve active theme palette
    theme_key = str(theme_name or "midnight").lower().strip()
    theme = THEME_PALETTES.get(theme_key, THEME_PALETTES["midnight"])

    # Enforce maximum 10 slides
    slides = slides[:10]

    if not slides:
        prs.slides.add_slide(prs.slide_layouts[6])
    else:
        total = len(slides)
        for idx, dsl in enumerate(slides, start=1):
            render_single_slide(prs, dsl, slide_index=idx, total_slides=total, theme=theme, theme_name=theme_key)

    output = io.BytesIO()
    prs.save(output)
    output.seek(0)
    return output
