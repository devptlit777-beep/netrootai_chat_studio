import os
import io
import re
import base64
import hashlib
import requests
from pathlib import Path
from typing import Optional, Dict, Any, List, Set, Tuple
from bs4 import BeautifulSoup
from PIL import Image
from dotenv import load_dotenv

# Load root .env first, then local directory fallback
_CURRENT_DIR = Path(__file__).resolve().parent
_ROOT_ENV = _CURRENT_DIR.parent / ".env" if _CURRENT_DIR.name == "ppt-service" else _CURRENT_DIR / ".env"
if _ROOT_ENV.exists():
    load_dotenv(_ROOT_ENV)
load_dotenv()

# In-memory cache for searched images: query -> list of (fingerprint_or_url, base64_data_uri)
IMAGE_CACHE: Dict[str, List[Tuple[str, str]]] = {}


def fetch_unsplash_image(
    query: str,
    used_images: Optional[Set[str]] = None
) -> Optional[Tuple[str, str]]:
    """
    Fetches curated, high-definition landscape stock photography from Unsplash API.
    - Always requests orientation='landscape' for perfect 16:9 slide cards.
    - Content filter 'high' for clean professional corporate imagery.
    - Multi-candidate checking against used_images for strict deduplication across slides.
    Returns (fingerprint, data_uri) or None.
    """
    key = os.getenv("UNSPLASH_ACCESS_KEY", "").strip()
    if not key:
        return None

    clean_q = re.sub(r"[^\w\s-]", "", query).strip()
    if not clean_q or len(clean_q) < 2:
        return None

    url = "https://api.unsplash.com/search/photos"
    params = {
        "query": clean_q,
        "orientation": "landscape",
        "per_page": 8,
        "content_filter": "high"
    }
    headers = {
        "Authorization": f"Client-ID {key}",
        "Accept-Version": "v1"
    }

    try:
        resp = requests.get(url, params=params, headers=headers, timeout=6)
        if not resp.ok:
            print(f"[Unsplash API Warning] HTTP {resp.status_code}: {resp.text[:100]}")
            return None

        data = resp.json()
        results = data.get("results", [])
        if not results:
            return None

        for item in results:
            img_id = item.get("id")
            if used_images and img_id and img_id in used_images:
                continue

            urls = item.get("urls", {})
            img_url = urls.get("regular") or urls.get("small")
            if not img_url:
                continue

            url_key = img_url.split("?")[0]
            if used_images and (img_url in used_images or url_key in used_images):
                continue

            img_resp = requests.get(img_url, timeout=7)
            if img_resp.ok:
                img_bytes = img_resp.content
                fp = get_image_fingerprint(img_bytes)
                if used_images and fp in used_images:
                    continue

                pil_img = Image.open(io.BytesIO(img_bytes))
                pil_img.verify()
                format_name = (pil_img.format or "JPEG").lower()
                if format_name == "jpg":
                    format_name = "jpeg"
                b64_str = base64.b64encode(img_bytes).decode("utf-8")
                data_uri = f"data:image/{format_name};base64,{b64_str}"

                if used_images is not None:
                    if img_id:
                        used_images.add(img_id)
                    used_images.add(img_url)
                    used_images.add(url_key)
                    used_images.add(fp)

                alt_desc = item.get("alt_description") or clean_q
                print(f"[Unsplash Success] Fetched '{alt_desc}' for '{clean_q}'")
                return (fp, data_uri)
    except Exception as e:
        print(f"[Unsplash Fetch Warning] {e}")

    return None


def clean_query_for_wikipedia(query: str) -> str:
    """Cleans up query string for better Wikipedia opensearch matching."""
    cleaned = re.sub(r"[^\w\s-]", "", query).strip()
    return cleaned


def get_image_fingerprint(img_bytes: bytes) -> str:
    """Generates an MD5 fingerprint of image bytes to guarantee deduplication."""
    return hashlib.md5(img_bytes).hexdigest()


def fetch_wikipedia_image(
    query: str,
    used_images: Optional[Set[str]] = None
) -> Optional[Tuple[str, str]]:
    """
    Searches Wikipedia for high-definition topic visuals with multi-result deduplication:
    1. First tries official Wikipedia PageImages API (returns up to 5 candidate 1000px+ HD images)
    2. Checks each against used_images set to prevent duplicates across slides
    3. Fallback: Uses BeautifulSoup to parse the article HTML and extract unused lead photo/diagram
    Returns (fingerprint, data_uri) or None.
    """
    clean_q = clean_query_for_wikipedia(query)
    if not clean_q:
        return None

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) EducationalSlideGenerator/1.0"
    }

    # Strategy 1: PageImages API for up to 5 distinct HD candidate images
    try:
        pageimg_url = (
            f"https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch={clean_q}"
            f"&gsrlimit=5&prop=pageimages&format=json&pithumbsize=1000"
        )
        resp = requests.get(pageimg_url, headers=headers, timeout=5)
        if resp.ok:
            data = resp.json()
            pages = data.get("query", {}).get("pages", {})
            for _, v in pages.items():
                thumb = v.get("thumbnail")
                if thumb and thumb.get("source"):
                    source_url = thumb["source"]
                    if used_images and (source_url in used_images or source_url.split("?")[0] in used_images):
                        continue

                    img_resp = requests.get(source_url, headers=headers, timeout=6)
                    if img_resp.ok:
                        img_bytes = img_resp.content
                        fp = get_image_fingerprint(img_bytes)
                        if used_images and fp in used_images:
                            continue

                        pil_img = Image.open(io.BytesIO(img_bytes))
                        pil_img.verify()
                        format_name = (pil_img.format or "JPEG").lower()
                        if format_name == "jpg":
                            format_name = "jpeg"
                        b64_str = base64.b64encode(img_bytes).decode("utf-8")
                        data_uri = f"data:image/{format_name};base64,{b64_str}"

                        if used_images is not None:
                            used_images.add(source_url)
                            used_images.add(source_url.split("?")[0])
                            used_images.add(fp)

                        return (fp, data_uri)
    except Exception as e:
        print(f"[Wikipedia PageImages Warning] {e}")

    # Strategy 2: Fallback to BeautifulSoup HTML parsing of the article
    try:
        api_url = (
            f"https://en.wikipedia.org/w/api.php?action=opensearch&search={clean_q}&limit=2&namespace=0&format=json"
        )
        resp = requests.get(api_url, headers=headers, timeout=5)
        if not resp.ok:
            return None

        data = resp.json()
        if len(data) < 4 or not data[3]:
            return None

        article_urls = data[3][:2]

        for article_url in article_urls:
            page_resp = requests.get(article_url, headers=headers, timeout=6)
            if not page_resp.ok:
                continue

            soup = BeautifulSoup(page_resp.text, "html.parser")

            candidate_urls = []
            for img in soup.find_all("img"):
                src = img.get("src", "")
                if not src:
                    continue

                src_lower = src.lower()
                if (
                    "/static/" in src_lower
                    or src_lower.endswith(".svg")
                    or "icon" in src_lower
                    or "flag" in src_lower
                    or "ambox" in src_lower
                    or "shackle" in src_lower
                    or "logo" in src_lower
                ):
                    continue

                if src.startswith("//"):
                    full_url = "https:" + src
                elif src.startswith("/"):
                    full_url = "https://en.wikipedia.org" + src
                elif src.startswith("http"):
                    full_url = src
                else:
                    continue

                width = 0
                try:
                    width = int(img.get("width", 0))
                except Exception:
                    pass

                if width >= 100 or "thumb" in full_url:
                    candidate_urls.append(full_url)

            for best_img_url in candidate_urls:
                if used_images and (best_img_url in used_images or best_img_url.split("?")[0] in used_images):
                    continue

                img_resp = requests.get(best_img_url, headers=headers, timeout=6)
                if not img_resp.ok:
                    continue

                img_bytes = img_resp.content
                fp = get_image_fingerprint(img_bytes)
                if used_images and fp in used_images:
                    continue

                pil_img = Image.open(io.BytesIO(img_bytes))
                pil_img.verify()

                format_name = (pil_img.format or "JPEG").lower()
                if format_name == "jpg":
                    format_name = "jpeg"
                b64_str = base64.b64encode(img_bytes).decode("utf-8")
                data_uri = f"data:image/{format_name};base64,{b64_str}"

                if used_images is not None:
                    used_images.add(best_img_url)
                    used_images.add(best_img_url.split("?")[0])
                    used_images.add(fp)

                return (fp, data_uri)

    except Exception as e:
        print(f"[Wikipedia BS4 Scraper Error] Error fetching image for '{query}': {e}")

    # Strategy 3: Fallback to Wikimedia Commons multi-result search
    try:
        commons_url = (
            f"https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch={clean_q}"
            f"&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url|mime&format=json"
        )
        resp = requests.get(commons_url, headers=headers, timeout=5)
        if resp.ok:
            pages = resp.json().get("query", {}).get("pages", {})
            for _, v in pages.items():
                info = v.get("imageinfo", [{}])[0]
                url = info.get("url")
                mime = info.get("mime", "")
                if url and "image" in mime and "svg" not in mime:
                    if used_images and (url in used_images or url.split("?")[0] in used_images):
                        continue

                    img_resp = requests.get(url, headers=headers, timeout=6)
                    if img_resp.ok:
                        img_bytes = img_resp.content
                        fp = get_image_fingerprint(img_bytes)
                        if used_images and fp in used_images:
                            continue

                        pil_img = Image.open(io.BytesIO(img_bytes))
                        pil_img.verify()
                        format_name = (pil_img.format or "JPEG").lower()
                        if format_name == "jpg":
                            format_name = "jpeg"
                        b64_str = base64.b64encode(img_bytes).decode("utf-8")
                        data_uri = f"data:image/{format_name};base64,{b64_str}"

                        if used_images is not None:
                            used_images.add(url)
                            used_images.add(url.split("?")[0])
                            used_images.add(fp)

                        return (fp, data_uri)
    except Exception as e:
        print(f"[Wikimedia Commons Warning] {e}")

    return None


def fetch_duckduckgo_image(query: str) -> Optional[str]:
    """
    Fetches image via duckduckgo_search if available and not rate limited.
    """
    try:
        from duckduckgo_search import DDGS
        with DDGS() as ddgs:
            results = list(ddgs.images(query, max_results=1))
            if results and "image" in results[0]:
                img_url = results[0]["image"]
                headers = {"User-Agent": "Mozilla/5.0"}
                resp = requests.get(img_url, headers=headers, timeout=6)
                if resp.ok:
                    img_bytes = resp.content
                    pil_img = Image.open(io.BytesIO(img_bytes))
                    pil_img.verify()
                    format_name = (pil_img.format or "JPEG").lower()
                    b64_str = base64.b64encode(img_bytes).decode("utf-8")
                    return f"data:image/{format_name};base64,{b64_str}"
    except Exception as e:
        # DDG often blocks or rate limits, fallback seamlessly
        pass
    return None


def extract_candidate_queries(
    query: Optional[str] = None,
    slide_title: Optional[str] = None,
    global_topic: Optional[str] = None
) -> List[str]:
    """
    Builds a prioritized list of search candidate queries:
    1. If query is provided:
       - The query itself
       - If query has > 2-3 words, the first 2-3 words
    2. From slide_title:
       - The part before colon ':' (e.g. 'Humanoid Robots' from 'Humanoid Robots: Adapting to...') max 2-3 words
       - The first 2-3 words of slide_title
    3. Global topic fallback:
       - Main topic from presentation prompt (e.g. 'Modern Robotics' or 'Robotics')
    """
    candidates: List[str] = []
    seen = set()

    def add_c(term: Optional[str]):
        if not term:
            return
        cleaned = re.sub(r"[^\w\s-]", "", term).strip()
        words = cleaned.split()
        if not words:
            return
        normalized = " ".join(words).lower()
        if normalized not in seen and len(normalized) >= 3:
            seen.add(normalized)
            candidates.append(" ".join(words))

    # Priority 1: Given image_query
    if query:
        add_c(query)
        words = query.strip().split()
        if len(words) > 3:
            add_c(" ".join(words[:2]))
            add_c(" ".join(words[:3]))

    # Priority 2: Slide title (especially part before colon ':')
    if slide_title:
        if ":" in slide_title:
            before_colon = slide_title.split(":", 1)[0].strip()
            b_words = before_colon.split()
            # User requirement: take words before colon, max 2-3 words
            add_c(" ".join(b_words[:3]))
            if len(b_words) > 2:
                add_c(" ".join(b_words[:2]))

        t_words = re.sub(r"[^\w\s-]", "", slide_title).strip().split()
        if t_words:
            add_c(" ".join(t_words[:2]))
            add_c(" ".join(t_words[:3]))

    # Priority 3: Global topic fallback (from user's presentation prompt)
    if global_topic:
        # Extract main noun phrase after on/about/covering/for
        matches = re.findall(r"\b(?:on|about|covering|for)\s+([a-zA-Z\s]{3,30})", global_topic, re.IGNORECASE)
        for m in matches:
            m_words = m.strip().split()
            if m_words:
                add_c(" ".join(m_words[:2]))
                add_c(m_words[0])

    # Add photographic keyword variations for abstract tech queries
    abstract_replacements = {
        "architecture": "server datacenter",
        "stack": "cloud infrastructure",
        "enablers": "technology hardware",
        "framework": "software engineer",
        "pipeline": "data network",
        "overview": "modern office tech",
        "layer": "microprocessor circuit",
        "system": "datacenter servers"
    }

    photo_variants = []
    for c in list(candidates):
        c_lower = c.lower()
        for bad_word, good_word in abstract_replacements.items():
            if bad_word in c_lower:
                transformed = re.sub(rf"\b{bad_word}\b", good_word, c_lower, flags=re.IGNORECASE).strip()
                if transformed and transformed not in seen:
                    photo_variants.append(transformed)
                    seen.add(transformed)

    # Prepend concrete photo variants to give Unsplash maximum accuracy
    candidates = photo_variants + candidates
    return candidates


def fetch_web_image(
    query: Optional[str] = None,
    slide_title: Optional[str] = None,
    global_topic: Optional[str] = None,
    used_images: Optional[Set[str]] = None
) -> Optional[str]:
    """
    Unified web image fetcher with Priority Order:
    1. Unsplash Curated Stock Photography (100% Free, HD 1080p, landscape orientation)
    2. Wikipedia PageImages API (1000px HD)
    3. Wikipedia BeautifulSoup HTML Scraper
    4. Wikimedia Commons
    5. DuckDuckGo Image Search
    Guarantees strict deduplication across slides using used_images tracking.
    """
    candidates = extract_candidate_queries(query, slide_title, global_topic)
    if not candidates:
        if query and query.strip():
            candidates = [query.strip()]
        else:
            return None

    for term in candidates:
        if not term:
            continue
        term_clean = term.strip().lower()

        # Check cache: return an unused candidate if already cached
        if term_clean in IMAGE_CACHE:
            for fp, data_uri in IMAGE_CACHE[term_clean]:
                if used_images is None or fp not in used_images:
                    if used_images is not None:
                        used_images.add(fp)
                    return data_uri

        # PRIORITY 1: Unsplash Curated High-Definition Stock Photography
        unsplash_res = fetch_unsplash_image(term, used_images=used_images)
        if unsplash_res:
            fp, data_uri = unsplash_res
            if term_clean not in IMAGE_CACHE:
                IMAGE_CACHE[term_clean] = []
            IMAGE_CACHE[term_clean].append((fp, data_uri))
            return data_uri

        # PRIORITY 2: Wikipedia Fallback
        res = fetch_wikipedia_image(term, used_images=used_images)
        if res:
            fp, data_uri = res
            if term_clean not in IMAGE_CACHE:
                IMAGE_CACHE[term_clean] = []
            IMAGE_CACHE[term_clean].append((fp, data_uri))
            return data_uri

        # PRIORITY 3: DuckDuckGo Fallback
        ddg_b64 = fetch_duckduckgo_image(term)
        if ddg_b64:
            fp = get_image_fingerprint(base64.b64decode(ddg_b64.split("base64,")[-1]))
            if used_images is None or fp not in used_images:
                if used_images is not None:
                    used_images.add(fp)
                if term_clean not in IMAGE_CACHE:
                    IMAGE_CACHE[term_clean] = []
                IMAGE_CACHE[term_clean].append((fp, ddg_b64))
                return ddg_b64

    return None



def describe_user_image(
    image_bytes: Optional[bytes] = None,
    filename: str = "",
    user_hint: str = ""
) -> str:
    """
    Generates a descriptive label for user-uploaded images to pass to LLM.
    Combines User Hint + clean Filename + optional auto-captioning.
    """
    clean_name = re.sub(r"[\._-]+", " ", filename).strip()
    # Strip extension
    if "." in clean_name:
        clean_name = clean_name.rsplit(".", 1)[0].strip()

    if user_hint and clean_name:
        return f"{user_hint} (file: {clean_name})"
    elif user_hint:
        return user_hint
    elif clean_name and clean_name.lower() not in ["image", "img", "photo", "upload", "untitled"]:
        return f"Image representing {clean_name}"

    # If no hint or useful filename, try lightweight captioning or fallback
    return "User uploaded diagram or illustration"


def search_unsplash_candidates(query: str, per_page: int = 9, source: str = "all") -> List[Dict[str, Any]]:
    """
    Returns candidate visuals for the Change Image modal from Unsplash or Wikipedia Commons.
    Source can be 'all', 'unsplash', or 'wikipedia'.
    """
    clean_q = re.sub(r"[^\w\s-]", "", query or "").strip()
    if not clean_q:
        clean_q = "technology architecture"

    candidates = []
    key = os.getenv("UNSPLASH_ACCESS_KEY", "").strip()

    # Query Unsplash if requested and key is available
    if source in ["all", "unsplash"] and key:
        url = "https://api.unsplash.com/search/photos"
        params = {
            "query": clean_q,
            "orientation": "landscape",
            "per_page": min(12, max(4, per_page)),
            "content_filter": "high"
        }
        headers = {
            "Authorization": f"Client-ID {key}",
            "Accept-Version": "v1"
        }
        try:
            resp = requests.get(url, params=params, headers=headers, timeout=6)
            if resp.ok:
                data = resp.json()
                for item in data.get("results", []):
                    urls = item.get("urls", {})
                    thumb = urls.get("small") or urls.get("thumb")
                    regular = urls.get("regular") or urls.get("small")
                    user = item.get("user", {})
                    if thumb and regular:
                        candidates.append({
                            "id": item.get("id"),
                            "thumb_url": thumb,
                            "regular_url": regular,
                            "title": item.get("alt_description") or clean_q.title(),
                            "photographer": user.get("name") or "Unsplash Contributor",
                            "photographer_url": user.get("links", {}).get("html") or "https://unsplash.com",
                            "source": "Unsplash"
                        })
        except Exception as e:
            print(f"[Candidate Search Warning] Unsplash error: {e}")

    # Query Wikipedia Commons if source is 'wikipedia' or if Unsplash returned no candidates
    if source == "wikipedia" or (not candidates and source in ["all", "wikipedia"]):
        try:
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) SlideStudio/1.0"}
            pageimg_url = (
                f"https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch={clean_q}"
                f"&gsrlimit=12&prop=pageimages&format=json&pithumbsize=600"
            )
            resp = requests.get(pageimg_url, headers=headers, timeout=5)
            if resp.ok:
                pages = resp.json().get("query", {}).get("pages", {})
                for pid, v in pages.items():
                    thumb = v.get("thumbnail", {}).get("source")
                    if thumb:
                        candidates.append({
                            "id": f"wiki_{pid}",
                            "thumb_url": thumb,
                            "regular_url": thumb,
                            "title": v.get("title") or clean_q.title(),
                            "photographer": "Wikimedia Commons",
                            "photographer_url": "https://commons.wikimedia.org",
                            "source": "Wikipedia"
                        })
        except Exception as e:
            print(f"[Candidate Search Warning] Wikipedia error: {e}")

    return candidates


def fetch_image_as_data_uri(image_url: str) -> Optional[str]:
    """
    Downloads an image from URL and converts it into a base64 data URI string.
    """
    if not image_url:
        return None
    try:
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) SlideStudio/1.0"}
        resp = requests.get(image_url, headers=headers, timeout=10)
        if not resp.ok:
            return None
        img_bytes = resp.content
        pil_img = Image.open(io.BytesIO(img_bytes))
        pil_img.verify()
        format_name = (pil_img.format or "JPEG").lower()
        if format_name == "jpg":
            format_name = "jpeg"
        b64_str = base64.b64encode(img_bytes).decode("utf-8")
        return f"data:image/{format_name};base64,{b64_str}"
    except Exception as e:
        print(f"[Fetch Image URI Error] {e}")
        return None

