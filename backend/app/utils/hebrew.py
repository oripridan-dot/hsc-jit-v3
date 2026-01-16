import re
from typing import Optional

# Unicode ranges:
# Hebrew letters: \u0590-\u05FF
# Nikkud (vowel points and cantillation): \u0591-\u05C7

HEBREW_RANGE = re.compile(r"[\u0590-\u05FF]")
NIKKUD_RANGE = re.compile(r"[\u0591-\u05C7]")


def detect_hebrew(text: Optional[str]) -> bool:
    """
    Returns True if the text contains any Hebrew characters.
    """
    if not text:
        return False
    return bool(HEBREW_RANGE.search(text))


def strip_hebrew(text: Optional[str]) -> str:
    """
    Remove Hebrew letters and diacritics, normalize punctuation and whitespace.

    This is useful for isolating embedded English/Latin model numbers inside Hebrew titles.
    """
    if not text:
        return ""
    # Remove nikkud (vowel points)
    text = NIKKUD_RANGE.sub("", text)
    # Remove Hebrew letters entirely
    text = HEBREW_RANGE.sub(" ", text)
    # Normalize various quote styles and dashes to a simple hyphen
    text = text.replace("–", "-").replace("—", "-").replace("‑", "-")
    text = text.replace("“", '"').replace("”", '"').replace("׳", "'")
    # Collapse whitespace
    text = re.sub(r"\s+", " ", text).strip()
    return text


MODEL_TOKEN = re.compile(
    r"(?i)([A-Z]{1}[A-Z0-9]{0,}\s*[\-]?[A-Z0-9]{1,}(?:[A-Z0-9\-\.]{0,}))")
BOUNDARY_CLEAN = re.compile(r"[^A-Za-z0-9\-\. ]+")


def normalize_model_from_text(text: Optional[str]) -> str:
    """
    Extract and normalize an English/Latin model number from mixed-language text.

    Examples:
    - "פסנתר חשמלי Roland FP-30X שחור" -> "FP-30X"
    - "Yamaha P-145 Digital Piano" -> "P-145"
    - "Shure SM58" -> "SM58"
    """
    if not text:
        return ""
    base = strip_hebrew(text) or text
    base_upper = base.upper()
    # Tokenize keeping letters/digits/hyphens/dots
    tokens = re.findall(r"[A-Z0-9][A-Z0-9\-\.]{1,}", base_upper)
    # Candidates must contain at least one digit
    candidates = [t for t in tokens if any(c.isdigit() for c in t)]

    # Remove common brand prefixes if glued to the token
    BRAND_WORDS = {
        'ROLAND', 'YAMAHA', 'SHURE', 'BOSS', 'NORD', 'AKAI', 'PAISTE', 'PEARL', 'MACKIE',
        'MAUDIO', 'M-AUDIO', 'RCF', 'REMO', 'KRK', 'OBERHEIM', 'XOTIC', 'ADAM', 'ADAM-AUDIO',
        'DYNAUDIO', 'HEADRUSH', 'HEADRUSH-FX', 'PAISTE-CYMBALS', 'HEADRUSHFX'
    }
    cleaned: list[str] = []
    for t in candidates:
        # If token starts with a brand word, strip it
        stripped = t
        for bw in BRAND_WORDS:
            if stripped.startswith(bw):
                stripped = stripped[len(bw):]
                stripped = re.sub(r'^([^A-Z0-9]+)', '', stripped)
                break
        if stripped:
            cleaned.append(stripped)

    def score(tok: str) -> int:
        s = 0
        if '-' in tok:
            s += 2
        if any(c.isdigit() for c in tok):
            s += 2
        # Prefer moderate length
        s += max(0, 10 - abs(len(tok) - 7))
        # Penalize tokens that are purely alphabetic
        if tok.isalpha():
            s -= 3
        return s

    if cleaned:
        best = sorted(set(cleaned), key=score, reverse=True)[0]
        return best.strip('.').strip('-').upper()

    return ""


ILS_PRICE = re.compile(
    r"(?:(?:₪|NIS|ILS)\s*)?([\d{1,3}(?:,\d{3})*]+|\d+)(?:\s*(?:ש\"ח|שח|₪|NIS|ILS))?", re.UNICODE)
NUM_CLEAN = re.compile(r"[^0-9]")


def extract_price_ils(text: Optional[str]) -> Optional[float]:
    """
    Extract a numeric ILS/shekel price from messy text like:
    - "₪2,400"
    - "2,400 ש\"ח"
    - "מחיר: 2400"
    Returns a float, or None if not found.
    """
    if not text:
        return None
    # Find numbers even if currency symbol is absent
    # Prefer the last number occurrence (often final price after discounts)
    nums = re.findall(r"\d+[\d,\.]*", text)
    if not nums:
        return None
    raw = nums[-1]
    cleaned = NUM_CLEAN.sub("", raw)
    if not cleaned:
        return None
    try:
        return float(cleaned)
    except ValueError:
        return None


def extract_multiple_prices(price_container) -> dict:
    """
    Extract all three price types from Halilit product listing:
    - regular_price: Black price (official Halilit price)
    - original_price: Overlined price (before discount)
    - eilat_price: Red price (tax-free Eilat price)

    Args:
        price_container: BeautifulSoup element containing price info

    Returns:
        dict with keys: regular_price, original_price, eilat_price (all Optional[float])
    """
    prices = {
        'regular_price': None,
        'original_price': None,
        'eilat_price': None
    }

    if not price_container:
        return prices

    # Regular price (black text, main price)
    # Usually in .price, .product_price, or similar
    regular_elem = price_container.select_one(
        '.price, .product_price, [class*="price"]:not([class*="old"]):not([class*="discount"]):not([class*="eilat"])')
    if regular_elem:
        # Check if it has strikethrough/overline styling (original price)
        style = regular_elem.get('style', '')
        classes = ' '.join(regular_elem.get('class', []))

        if 'line-through' in style or 'overline' in style or 'old' in classes or 'original' in classes:
            prices['original_price'] = extract_price_ils(
                regular_elem.get_text(strip=True))
        else:
            prices['regular_price'] = extract_price_ils(
                regular_elem.get_text(strip=True))

    # Look for original/old price (overlined)
    old_price_elem = price_container.select_one(
        '.old-price, .original-price, .price-old, [style*="line-through"], [style*="overline"]')
    if old_price_elem:
        prices['original_price'] = extract_price_ils(
            old_price_elem.get_text(strip=True))

    # Look for Eilat price (red text, usually has eilat/discount class)
    eilat_elem = price_container.select_one(
        '.eilat-price, .discount-price, .price-eilat, [class*="eilat"], [style*="color: red"], [style*="color:red"]')
    if eilat_elem:
        prices['eilat_price'] = extract_price_ils(
            eilat_elem.get_text(strip=True))

    # Fallback: parse all price elements and classify by style
    all_price_elems = price_container.select('[class*="price"]')
    for elem in all_price_elems:
        text = elem.get_text(strip=True)
        style = elem.get('style', '').lower()
        classes = ' '.join(elem.get('class', [])).lower()

        price_val = extract_price_ils(text)
        if not price_val:
            continue

        # Red text = Eilat price
        if 'color' in style and 'red' in style:
            prices['eilat_price'] = price_val
        # Strikethrough/overline = original price
        elif 'line-through' in style or 'overline' in style or 'old' in classes or 'original' in classes:
            prices['original_price'] = price_val
        # Otherwise, if regular price not set, use it
        elif not prices['regular_price']:
            prices['regular_price'] = price_val

    return prices


# Variant/Version detection patterns
# Matches version numbers (V2, MK II, Gen 3), color suffixes (-BK, -WH), and full color words
VARIANT_PATTERNS = re.compile(
    r'(?i)(\b(?:v\d+|mk\s*[iv]+|gen\s*\d+|version\s*\d+|\d+(?:st|nd|rd|th)\s*gen)\b|\([^)]*(?:black|white|red|blue|silver|gold|color).*?\)|[-_](?:bk|wh|rd|bl|sv|gd|gry?)\b|\b(?:black|white|red|blue|silver|gold)\b$)', re.UNICODE)
COLOR_PATTERNS = re.compile(
    r'(?i)\b(black|white|red|blue|silver|gold|grey|gray)\b', re.UNICODE)


def extract_base_model(text: Optional[str]) -> str:
    """
    Extract base model name without variant/version/color suffixes.

    Examples:
    - "Roland FP-30X Black" -> "Roland FP-30X"
    - "Yamaha P-145 V2" -> "Yamaha P-145"
    - "Nord Stage 4 Compact" -> "Nord Stage 4"
    - "FP-30X-BK" -> "FP-30X"
    - "Juno-DS88_WH" -> "Juno-DS88"
    """
    if not text:
        return ""

    # Remove variant indicators (version numbers, color codes, color words)
    clean = VARIANT_PATTERNS.sub('', text)
    # Remove trailing punctuation, spaces, hyphens, underscores
    clean = re.sub(r'[\s\-_]+$', '', clean)
    return clean.strip()


def detect_variant_info(text: Optional[str]) -> dict:
    """
    Detect variant/version information from product name.

    Returns:
        dict with keys: has_variant, variant_type, variant_value, color
    """
    result = {
        'has_variant': False,
        'variant_type': None,
        'variant_value': None,
        'color': None
    }

    if not text:
        return result

    # Check for version patterns
    version_match = re.search(
        r'(?i)\b(v|mk|gen|version)\s*([\d]+|[iv]+)\b', text)
    if version_match:
        result['has_variant'] = True
        result['variant_type'] = 'version'
        result['variant_value'] = version_match.group(0)

    # Check for generation patterns
    gen_match = re.search(r'(?i)(\d+)(?:st|nd|rd|th)\s*gen', text)
    if gen_match:
        result['has_variant'] = True
        result['variant_type'] = 'generation'
        result['variant_value'] = gen_match.group(0)

    # Check for color
    color_match = COLOR_PATTERNS.search(text)
    if color_match:
        result['has_variant'] = True
        result['variant_type'] = result['variant_type'] or 'color'
        result['color'] = color_match.group(1).lower()

    return result


def normalize_for_matching(text: str, brand_name: Optional[str] = None) -> str:
    """
    Isolates the alphanumeric model code from mixed Hebrew/English text for robust matching.
    Input: "פסנתר חשמלי Roland FP-30X שחור", brand="Roland"
    Output: "FP30X" (Normalized for comparison)
    """
    if not text:
        return ""

    # 1. Remove all Hebrew characters and Nikkud
    no_hebrew = HEBREW_RANGE.sub('', text)
    no_hebrew = NIKKUD_RANGE.sub('', no_hebrew)

    # 2. Remove common localized noise words & Category words (Case insensitive)
    # e.g., "Black", "White", "Series", "MKII", "W/Stand"
    noise_pattern = r'(?i)\b(black|white|series|bundle|set|with|stand|bk|wh|digital|piano|guitar|drum|bass|keyboard|synthesizer|studio|monitor)\b'
    clean_text = re.sub(noise_pattern, '', no_hebrew)

    # 3. Remove Brand Name if provided (critical to avoid matching on "Roland")
    if brand_name:
        clean_text = re.sub(
            r'(?i)\b' + re.escape(brand_name) + r'\b', '', clean_text)

    # 4. Smart Model Extraction
    # Instead of first match, look for "Model-like" tokens implementation
    # Split into potential tokens
    tokens = re.findall(r'[a-zA-Z0-9\-]+', clean_text)

    best_candidate = ""
    for token in tokens:
        # Strict filter: Must be > 1 char
        if len(token) < 2:
            continue

        # Optimization: If it has a digit, it is 99% the model number (e.g. FP-30, TLM103)
        if re.search(r'\d', token):
            best_candidate = token
            break

    # If no digit-token found, take the longest remaining token (e.g. "Telecaster", "Stratocaster")
    if not best_candidate and tokens:
        # Filter out short tokens again just in case
        valid_tokens = [t for t in tokens if len(t) > 2]
        if valid_tokens:
            best_candidate = max(valid_tokens, key=len)

    if best_candidate:
        return best_candidate.replace('-', '').upper()

    return ""
