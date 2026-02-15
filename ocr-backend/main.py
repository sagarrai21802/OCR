"""
OCR AutoFill Backend API — Precision Line-Position Extraction
"""

import re
import io
import requests
from typing import Optional, List, Dict, Tuple
from PIL import Image
import pytesseract
import cv2
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="OCR AutoFill API", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# ── Models ────────────────────────────────────────────────────────────────────

class OCRRequest(BaseModel):
    image_url: str

class OCRResponse(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    ssn: Optional[str] = None
    phone: Optional[str] = None
    bank_name: Optional[str] = None
    account_no: Optional[str] = None
    loan_amount: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip: Optional[str] = None
    dob: Optional[str] = None
    licence_no: Optional[str] = None
    licence_state: Optional[str] = None
    ip: Optional[str] = None
    raw_text: Optional[str] = None
    confidence: Optional[float] = None

# ── Fixed field order (matches the document's line layout) ────────────────────

FIELD_ORDER = [
    'first_name',      # Line 1
    'last_name',       # Line 2
    'email',           # Line 3
    'ssn',             # Line 4
    'phone',           # Line 5
    'bank_name',       # Line 6
    'account_no',      # Line 7
    'loan_amount',     # Line 8
    'address',         # Line 9
    'city',            # Line 10
    'state',           # Line 11
    'zip',             # Line 12
    'dob',             # Line 13
    'licence_no',      # Line 14
    'licence_state',   # Line 15
    'ip',              # Line 16
]

# ── Valid US state codes ──────────────────────────────────────────────────────

VALID_STATES = {
    'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
    'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
    'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
    'VA','WA','WV','WI','WY','DC','PR','VI','GU','AS','MP',
}

# ── Common OCR character confusions ──────────────────────────────────────────

OCR_DIGIT_FIXES = str.maketrans({'O': '0', 'o': '0', 'I': '1', 'l': '1',
                                  'S': '5', 's': '5', 'B': '8', 'b': '8',
                                  'Z': '2', 'z': '2', 'G': '6', 'g': '9',
                                  'T': '7', 'D': '0', 'Q': '0', 'A': '4'})

OCR_ALPHA_FIXES = str.maketrans({'0': 'O', '1': 'I', '5': 'S', '8': 'B',
                                  '2': 'Z', '6': 'G', '9': 'g', '7': 'T',
                                  '4': 'A', '3': 'E'})


# ── Per-field validators & cleaners ──────────────────────────────────────────

def _clean_for_digits(s: str) -> str:
    """Remove all non-digit characters, fixing common OCR alpha→digit errors."""
    fixed = s.translate(OCR_DIGIT_FIXES)
    return re.sub(r'[^0-9]', '', fixed)

def _clean_for_alpha(s: str) -> str:
    """Remove non-alpha characters, fixing common OCR digit→alpha errors."""
    fixed = s.translate(OCR_ALPHA_FIXES)
    return re.sub(r'[^A-Za-z ]', '', fixed).strip()

def validate_first_name(val: str) -> Tuple[str, float]:
    cleaned = re.sub(r'[^A-Za-z\s\'-]', '', val).strip()
    if cleaned and len(cleaned) >= 1:
        return cleaned.upper(), 1.0
    alpha = _clean_for_alpha(val)
    if alpha:
        return alpha.upper(), 0.7
    return val.strip().upper(), 0.3

def validate_last_name(val: str) -> Tuple[str, float]:
    return validate_first_name(val)  # Same logic

def validate_email(val: str) -> Tuple[str, float]:
    # Fix common OCR errors in email
    cleaned = val.strip().lower()
    cleaned = cleaned.replace(' ', '')
    cleaned = cleaned.replace(',', '.')
    cleaned = cleaned.replace('(a)', '@').replace('[at]', '@')
    cleaned = cleaned.replace('@@', '@')
    # Fix common OCR: 'rn' misread as 'm', etc.
    if '@' in cleaned and '.' in cleaned:
        return cleaned, 1.0
    # Try to find email pattern in a messy string
    m = re.search(r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}', cleaned)
    if m:
        return m.group(0), 0.9
    return cleaned, 0.3

def validate_ssn(val: str) -> Tuple[str, float]:
    digits = _clean_for_digits(val)
    if len(digits) == 9:
        return digits, 1.0
    # If we got close (8 or 10 digits), try to fix
    if len(digits) == 10:
        return digits[:9], 0.7
    if len(digits) == 8:
        return digits, 0.5
    # Strip formatting like XXX-XX-XXXX
    stripped = re.sub(r'[\-\s]', '', val)
    digits2 = _clean_for_digits(stripped)
    if len(digits2) == 9:
        return digits2, 0.9
    return digits if digits else val.strip(), 0.3

def validate_phone(val: str) -> Tuple[str, float]:
    digits = _clean_for_digits(val)
    # Remove country code prefix
    if len(digits) == 11 and digits[0] == '1':
        digits = digits[1:]
    if len(digits) == 10:
        return digits, 1.0
    if len(digits) == 9:
        return digits, 0.6
    # Try stripping formatting
    stripped = re.sub(r'[\-\(\)\s\+]', '', val)
    digits2 = _clean_for_digits(stripped)
    if len(digits2) == 11 and digits2[0] == '1':
        digits2 = digits2[1:]
    if len(digits2) == 10:
        return digits2, 0.9
    return digits if digits else val.strip(), 0.3

def validate_bank_name(val: str) -> Tuple[str, float]:
    # Allow digits (e.g., "Citizens 1st Bank", "First 2nd Bank")
    cleaned = re.sub(r'[^A-Za-z0-9\s\.\&\'-]', '', val).strip()
    if cleaned and len(cleaned) >= 3:
        return cleaned, 1.0
    # Fallback: keep anything that looks like words
    words = re.sub(r'[^A-Za-z0-9\s]', '', val).strip()
    if words and len(words) >= 3:
        return words, 0.7
    return val.strip(), 0.3

def validate_account_no(val: str) -> Tuple[str, float]:
    digits = _clean_for_digits(val)
    if 6 <= len(digits) <= 17:
        return digits, 1.0
    return digits if digits else val.strip(), 0.3

def validate_loan_amount(val: str) -> Tuple[str, float]:
    # Remove $ sign and commas
    cleaned = val.replace('$', '').replace(',', '').strip()
    digits = _clean_for_digits(cleaned)
    if digits and 1 <= len(digits) <= 10:
        return digits, 1.0
    # Try extracting just the number
    m = re.search(r'[\d]+', cleaned)
    if m:
        return m.group(0), 0.8
    return val.strip(), 0.3

# Common street suffixes and their OCR-corrupted versions
STREET_SUFFIX_FIXES = {
    '5T': 'ST', '5t': 'ST', '$T': 'ST', 'S7': 'ST',
    '4VE': 'AVE', '4ve': 'AVE', 'AV3': 'AVE', 'AVF': 'AVE',
    '8LVD': 'BLVD', 'BLVO': 'BLVD', 'B1VD': 'BLVD',
    'DR1VE': 'DRIVE', 'DR1': 'DR',
    'LM': 'LN', '1N': 'LN',
    'C7': 'CT', 'C1': 'CT',
    'P1': 'PL', 'PK': 'PL',
    'RO': 'RD', 'R0': 'RD',
    'WAV': 'WAY', 'W4Y': 'WAY',
}

DIRECTION_FIXES = {
    'M': 'N', 'W': 'W', '5': 'S', '3': 'E',
    'NW': 'NW', 'NE': 'NE', 'SW': 'SW', 'SE': 'SE',
}

def _fix_address_ocr(addr: str) -> str:
    """Fix common OCR errors in address street suffixes and directions."""
    parts = addr.split()
    fixed_parts = []
    for i, part in enumerate(parts):
        upper = part.upper()
        # Fix street suffixes (usually last word or near-last)
        if upper in STREET_SUFFIX_FIXES:
            fixed_parts.append(STREET_SUFFIX_FIXES[upper])
        else:
            fixed_parts.append(part)
    return ' '.join(fixed_parts)

def validate_address(val: str) -> Tuple[str, float]:
    cleaned = val.strip()
    if not cleaned:
        return val.strip(), 0.3
    # Fix OCR errors in street suffixes
    cleaned = _fix_address_ocr(cleaned)
    # Address should start with a number
    if re.match(r'^\d+\s+', cleaned):
        return cleaned, 1.0
    # Try to fix leading digit OCR errors (e.g., 'l121' -> '1121')
    fixed = _clean_for_digits(cleaned.split()[0]) + ' ' + ' '.join(cleaned.split()[1:]) if cleaned.split() else cleaned
    if re.match(r'^\d+\s+', fixed):
        return fixed, 0.8
    return cleaned, 0.5

def validate_city(val: str) -> Tuple[str, float]:
    # Cities are purely alphabetic — fix any OCR digit-to-alpha confusions
    cleaned = val.strip()
    
    # If no digits, it's clean
    pure_alpha = re.sub(r'[^A-Za-z\s\.\-]', '', cleaned).strip()
    if pure_alpha and len(pure_alpha) >= 2 and not re.search(r'\d', cleaned):
        return pure_alpha.upper(), 1.0
    
    # Has digits — likely OCR errors; convert digits to closest letters
    fixed = cleaned.translate(OCR_ALPHA_FIXES)
    fixed = re.sub(r'[^A-Za-z\s\.\-]', '', fixed).strip()
    if fixed and len(fixed) >= 2:
        return fixed.upper(), 0.8
    
    # Last resort: just strip non-alpha
    alpha = _clean_for_alpha(cleaned)
    if alpha:
        return alpha.upper(), 0.7
    return val.strip().upper(), 0.3

def validate_state(val: str) -> Tuple[str, float]:
    cleaned = val.strip().upper()
    
    # Direct match (perfect case)
    pure = re.sub(r'[^A-Z]', '', cleaned)
    if pure in VALID_STATES:
        return pure, 1.0
    
    # First 2 alpha chars
    if len(pure) >= 2 and pure[:2] in VALID_STATES:
        return pure[:2], 0.9
    
    # Fix OCR digit→alpha errors (e.g., '4Z' → 'AZ', 'M0' → 'MO')
    fixed = cleaned.translate(OCR_ALPHA_FIXES)
    fixed_pure = re.sub(r'[^A-Z]', '', fixed.upper())
    if fixed_pure in VALID_STATES:
        return fixed_pure, 0.8
    if len(fixed_pure) >= 2 and fixed_pure[:2] in VALID_STATES:
        return fixed_pure[:2], 0.75
    
    # Fuzzy: try all single-character substitutions
    for i in range(min(len(pure), 2)):
        for c in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ':
            candidate = pure[:i] + c + pure[i+1:]
            if len(candidate) >= 2 and candidate[:2] in VALID_STATES:
                return candidate[:2], 0.6
    
    return pure if pure else val.strip().upper(), 0.3

def validate_zip(val: str) -> Tuple[str, float]:
    digits = _clean_for_digits(val)
    if len(digits) >= 5:
        return digits[:5], 1.0
    if len(digits) == 4:
        return digits, 0.6
    return digits if digits else val.strip(), 0.3

def validate_dob(val: str) -> Tuple[str, float]:
    cleaned = val.strip()
    # Check YYYY-MM-DD
    m = re.match(r'^(\d{4})[/\-\.](\d{1,2})[/\-\.](\d{1,2})$', cleaned)
    if m:
        return f"{m.group(1)}-{m.group(2).zfill(2)}-{m.group(3).zfill(2)}", 1.0
    # Check MM/DD/YYYY or DD/MM/YYYY
    m = re.match(r'^(\d{1,2})[/\-\.](\d{1,2})[/\-\.](\d{4})$', cleaned)
    if m:
        return f"{m.group(3)}-{m.group(1).zfill(2)}-{m.group(2).zfill(2)}", 0.9
    # Try to extract date-like pattern from messy text
    digits = _clean_for_digits(cleaned)
    if len(digits) == 8:
        # Could be YYYYMMDD or MMDDYYYY
        if digits[:2] in ('19', '20'):
            return f"{digits[:4]}-{digits[4:6]}-{digits[6:]}", 0.8
        else:
            return f"{digits[4:]}-{digits[:2]}-{digits[2:4]}", 0.7
    return cleaned, 0.3

# Map of OCR digit→letter fixes specifically for licence number leading char
LICENCE_FIRST_CHAR_FIXES = {
    '0': 'O', '1': 'I', '2': 'Z', '3': 'E', '4': 'A',
    '5': 'S', '6': 'G', '7': 'T', '8': 'B', '9': 'P',
}

def validate_licence_no(val: str) -> Tuple[str, float]:
    """Licence numbers are alphanumeric; usually start with a letter."""
    cleaned = re.sub(r'[\s\-]', '', val).strip()
    
    if not cleaned:
        return val.strip().upper(), 0.3
    
    result = cleaned.upper()
    conf = 1.0
    
    # Most US licence numbers start with a letter. If OCR turned it into a digit,
    # try to recover — but ONLY for longer values (7+ chars) where we expect
    # a letter prefix. Short values like "92" should be kept as-is.
    if result and result[0].isdigit() and len(result) >= 7:
        # Check if the rest is all digits — then the first char was likely a letter
        if result[1:].replace(' ', '').isdigit():
            fixed_char = LICENCE_FIRST_CHAR_FIXES.get(result[0], result[0])
            result = fixed_char + result[1:]
            conf = 0.7
    
    # Accept any length — licence numbers vary widely by state
    if len(result) >= 1:
        return result, conf
    return result, 0.5

def validate_licence_state(val: str) -> Tuple[str, float]:
    return validate_state(val)  # Same validation as state

def validate_ip(val: str) -> Tuple[str, float]:
    cleaned = val.strip()
    # Standard IPv4 match
    m = re.match(r'^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$', cleaned)
    if m:
        return m.group(1), 1.0
    # Try to fix OCR errors in IP (e.g., spaces instead of dots)
    # Replace common OCR confusions
    fixed = cleaned.replace(' ', '.').replace(',', '.').replace('..', '.')
    fixed = re.sub(r'[^0-9\.]', '', fixed)
    m = re.match(r'^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$', fixed)
    if m:
        return m.group(1), 0.8
    # Try extracting from broader text
    m = re.search(r'(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})', fixed)
    if m:
        return m.group(1), 0.7
    return cleaned, 0.3

# Map field names to validators
FIELD_VALIDATORS = {
    'first_name': validate_first_name,
    'last_name': validate_last_name,
    'email': validate_email,
    'ssn': validate_ssn,
    'phone': validate_phone,
    'bank_name': validate_bank_name,
    'account_no': validate_account_no,
    'loan_amount': validate_loan_amount,
    'address': validate_address,
    'city': validate_city,
    'state': validate_state,
    'zip': validate_zip,
    'dob': validate_dob,
    'licence_no': validate_licence_no,
    'licence_state': validate_licence_state,
    'ip': validate_ip,
}


# ── Image download ───────────────────────────────────────────────────────────

def download_image(url: str) -> Image.Image:
    try:
        response = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=30, verify=False)
        response.raise_for_status()
        return Image.open(io.BytesIO(response.content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── Image preprocessing (multiple strategies) ────────────────────────────────

def _upscale_if_small(gray: np.ndarray) -> np.ndarray:
    """Upscale small images for better OCR accuracy."""
    h, w = gray.shape
    if h < 1000 or w < 1000:
        scale = max(1500 / h, 1500 / w)
        gray = cv2.resize(gray, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_CUBIC)
    return gray

def _to_gray(img: Image.Image) -> np.ndarray:
    """Convert PIL image to grayscale numpy array."""
    arr = np.array(img.convert('RGB'))
    return cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)

def preprocess_binary(img: Image.Image) -> np.ndarray:
    """Pass 1: CLAHE + denoise + Otsu binary threshold."""
    gray = _to_gray(img)
    gray = _upscale_if_small(gray)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)
    denoised = cv2.fastNlMeansDenoising(enhanced, None, 10, 7, 21)
    _, binary = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return binary

def preprocess_adaptive(img: Image.Image) -> np.ndarray:
    """Pass 2: Adaptive threshold — better for uneven lighting."""
    gray = _to_gray(img)
    gray = _upscale_if_small(gray)
    denoised = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)
    binary = cv2.adaptiveThreshold(denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                    cv2.THRESH_BINARY, 31, 10)
    return binary

def preprocess_sharp(img: Image.Image) -> np.ndarray:
    """Pass 3: Sharpen + simple threshold — good for clean documents."""
    gray = _to_gray(img)
    gray = _upscale_if_small(gray)
    # Sharpen
    kernel = np.array([[-1, -1, -1], [-1, 9, -1], [-1, -1, -1]])
    sharpened = cv2.filter2D(gray, -1, kernel)
    _, binary = cv2.threshold(sharpened, 128, 255, cv2.THRESH_BINARY)
    return binary

def preprocess_raw(img: Image.Image) -> np.ndarray:
    """Pass 4: Minimal preprocessing — just upscale, no filters."""
    gray = _to_gray(img)
    gray = _upscale_if_small(gray)
    return gray


# ── OCR text extraction ──────────────────────────────────────────────────────

OCR_CONFIGS = [
    r'--oem 3 --psm 6 -l eng',   # Block of text
    r'--oem 3 --psm 4 -l eng',   # Single column
    r'--oem 3 --psm 3 -l eng',   # Fully automatic
]

def extract_text_single(processed: np.ndarray, config: str) -> str:
    """Run Tesseract on a preprocessed image with a specific config."""
    return pytesseract.image_to_string(processed, config=config)

def extract_text_multi_pass(img: Image.Image) -> List[str]:
    """Run multiple preprocessing + OCR config combinations, return all results."""
    preprocessors = [
        ("binary", preprocess_binary),
        ("adaptive", preprocess_adaptive),
        ("sharp", preprocess_sharp),
        ("raw", preprocess_raw),
    ]
    
    results = []
    for prep_name, prep_fn in preprocessors:
        try:
            processed = prep_fn(img)
            for config in OCR_CONFIGS:
                try:
                    text = extract_text_single(processed, config)
                    if text and text.strip():
                        results.append(text)
                except Exception as e:
                    logger.warning(f"OCR failed [{prep_name}]: {e}")
        except Exception as e:
            logger.warning(f"Preprocessing failed [{prep_name}]: {e}")
    
    return results


# ── Line cleaning ─────────────────────────────────────────────────────────────

def clean_lines(raw_text: str) -> List[str]:
    """
    Extract meaningful non-empty lines from OCR text.
    Merges multi-line values that belong together and strips junk lines.
    """
    raw_lines = raw_text.split('\n')
    cleaned = []
    for line in raw_lines:
        # Normalize whitespace
        stripped = re.sub(r'\s+', ' ', line).strip()
        # Skip completely empty or single-char junk
        if not stripped or len(stripped) <= 1:
            continue
        # Skip lines that are purely decorative (e.g., dashes, underscores, asterisks)
        if re.match(r'^[\-_=\*\.\|]+$', stripped):
            continue
        cleaned.append(stripped)
    return cleaned


# ── Core extraction: positional mapping with validation ──────────────────────

def extract_fields_positional(lines: List[str]) -> Tuple[Dict[str, str], float]:
    """
    Map cleaned lines to fields by position.
    Returns (field_dict, total_confidence).
    """
    data = {k: None for k in FIELD_ORDER}
    field_confidences = {}
    
    for i, field_name in enumerate(FIELD_ORDER):
        if i < len(lines):
            raw_val = lines[i]
            validator = FIELD_VALIDATORS.get(field_name)
            if validator:
                cleaned_val, conf = validator(raw_val)
                data[field_name] = cleaned_val
                field_confidences[field_name] = conf
            else:
                data[field_name] = raw_val
                field_confidences[field_name] = 0.5
        else:
            field_confidences[field_name] = 0.0
    
    # Calculate overall confidence
    filled = sum(1 for v in data.values() if v)
    valid_count = sum(1 for c in field_confidences.values() if c >= 0.7)
    total_confidence = round((valid_count / 16) * 100, 2)
    
    return data, total_confidence


# ── Fallback: pattern-based extraction for misaligned OCR ─────────────────────

def extract_fields_pattern_fallback(lines: List[str], all_text: str) -> Dict[str, Optional[str]]:
    """
    If positional mapping fails badly, try to identify fields by their content patterns.
    This is the safety net for when OCR produces extra/missing lines.
    """
    data = {k: None for k in FIELD_ORDER}
    all_tokens = []
    for line in lines:
        all_tokens.extend(line.split())
    
    used_values = set()
    
    # Email — unique pattern, easiest to find
    for t in all_tokens:
        if '@' in t and '.' in t:
            cleaned, _ = validate_email(t)
            data['email'] = cleaned
            used_values.add(t)
            break
    
    # IP — unique dotted-quad pattern
    for t in all_tokens:
        if re.match(r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$', t):
            data['ip'] = t
            used_values.add(t)
            break
    
    # DOB — date pattern
    for t in all_tokens:
        if re.match(r'^\d{4}[\-/\.]\d{1,2}[\-/\.]\d{1,2}$', t):
            cleaned, _ = validate_dob(t)
            data['dob'] = cleaned
            used_values.add(t)
            break
    
    # State codes — 2 uppercase letters that are valid US states
    state_candidates = []
    for t in all_tokens:
        if re.match(r'^[A-Z]{2}$', t) and t in VALID_STATES and t not in used_values:
            state_candidates.append(t)
    if len(state_candidates) >= 1:
        data['state'] = state_candidates[0]
    if len(state_candidates) >= 2:
        data['licence_state'] = state_candidates[1]
    
    # ZIP — 5-digit number
    for t in all_tokens:
        if re.match(r'^\d{5}$', t) and t not in used_values:
            data['zip'] = t
            used_values.add(t)
            break
    
    # SSN — 9 digits
    for t in all_tokens:
        digits = _clean_for_digits(t)
        if len(digits) == 9 and t not in used_values:
            data['ssn'] = digits
            used_values.add(t)
            break
    
    # Phone — 10 digits
    for t in all_tokens:
        digits = _clean_for_digits(t)
        if len(digits) == 10 and digits != data.get('ssn') and t not in used_values:
            data['phone'] = digits
            used_values.add(t)
            break
    
    # Account — 8-12 digit number (not phone, not SSN)
    for t in all_tokens:
        digits = _clean_for_digits(t)
        if 8 <= len(digits) <= 12 and digits != data.get('phone') and digits != data.get('ssn') and t not in used_values:
            data['account_no'] = digits
            used_values.add(t)
            break
    
    # Bank name — line containing 'bank' (case-insensitive)
    for line in lines:
        if 'bank' in line.lower():
            cleaned = re.sub(r'^[\d\s]+', '', line).strip()
            cleaned = re.sub(r'\s+\d+.*$', '', cleaned).strip()
            if cleaned:
                data['bank_name'] = cleaned
                break
    
    # Address — line starting with a number followed by street words
    for line in lines:
        if re.match(r'^\d+\s+\w', line) and 'bank' not in line.lower():
            data['address'] = line.strip()
            break
    
    # Names — first two all-uppercase words
    name_tokens = []
    for t in all_tokens[:6]:
        if t.isupper() and len(t) > 1 and not t.isdigit() and '@' not in t and t not in VALID_STATES and t not in used_values:
            name_tokens.append(t)
            if len(name_tokens) == 2:
                break
    if len(name_tokens) >= 1:
        data['first_name'] = name_tokens[0]
    if len(name_tokens) >= 2:
        data['last_name'] = name_tokens[1]
    
    # City — uppercase word that's not a state code and not already used
    for line in lines:
        cleaned = re.sub(r'[^A-Za-z\s]', '', line).strip()
        if cleaned and cleaned.isupper() and len(cleaned) > 2 and cleaned not in VALID_STATES:
            if cleaned != data.get('first_name') and cleaned != data.get('last_name'):
                data['city'] = cleaned
                break
    
    # Loan amount — remaining short numeric
    for t in all_tokens:
        digits = _clean_for_digits(t)
        if 1 <= len(digits) <= 6 and t not in used_values:
            if digits != data.get('zip') and digits != data.get('ssn') and digits != data.get('phone') and digits != data.get('account_no'):
                data['loan_amount'] = digits
                used_values.add(t)
                break
    
    # Licence — alphanumeric string 8+ chars, not email
    for t in all_tokens:
        if re.match(r'^[A-Za-z]\d{5,}', t) and '@' not in t and t not in used_values:
            data['licence_no'] = t.upper()
            used_values.add(t)
            break
    
    return data


# ── Main extraction orchestrator ──────────────────────────────────────────────

def extract_fields(raw_texts: List[str]) -> dict:
    """
    Try all OCR results, pick the one that produces the best extraction.
    Uses positional mapping as primary strategy, pattern fallback if needed.
    """
    best_result = None
    best_confidence = -1.0
    best_raw = ""
    
    for raw_text in raw_texts:
        lines = clean_lines(raw_text)
        logger.info(f"Cleaned lines ({len(lines)}): {lines}")
        
        if len(lines) < 5:
            # Too few lines — probably bad OCR
            continue
        
        # ── Strategy 1: Positional mapping (primary) ──
        if 14 <= len(lines) <= 20:
            # About the right number of lines — try positional
            # If we have extra lines, try trimming from the top/bottom
            candidates = []
            
            # Try direct 1:1 mapping
            candidates.append(lines[:16])
            
            # Try skipping first line (sometimes OCR picks up a header)
            if len(lines) > 16:
                candidates.append(lines[1:17])
            
            # Try skipping first two lines
            if len(lines) > 17:
                candidates.append(lines[2:18])
            
            for candidate_lines in candidates:
                data, confidence = extract_fields_positional(candidate_lines)
                if confidence > best_confidence:
                    best_confidence = confidence
                    best_result = data
                    best_raw = raw_text
        
        # ── Strategy 2: Pattern-based fallback ──
        pattern_data = extract_fields_pattern_fallback(lines, raw_text)
        pattern_filled = sum(1 for v in pattern_data.values() if v)
        pattern_confidence = round((pattern_filled / 16) * 100, 2)
        
        if pattern_confidence > best_confidence:
            best_confidence = pattern_confidence
            best_result = pattern_data
            best_raw = raw_text
    
    # If no result from multi-pass, try the first raw text as last resort
    if best_result is None and raw_texts:
        lines = clean_lines(raw_texts[0])
        best_result, best_confidence = extract_fields_positional(lines)
        best_raw = raw_texts[0]
    
    if best_result is None:
        best_result = {k: None for k in FIELD_ORDER}
        best_confidence = 0.0
        best_raw = ""
    
    best_result['confidence'] = best_confidence
    best_result['raw_text'] = best_raw
    
    logger.info(f"Best confidence: {best_confidence}%")
    logger.info(f"Result: {best_result}")
    return best_result


# ── API endpoints ─────────────────────────────────────────────────────────────

@app.post("/ocr", response_model=OCRResponse)
async def process_ocr(req: OCRRequest):
    try:
        img = download_image(req.image_url)
        
        # Multi-pass OCR
        raw_texts = extract_text_multi_pass(img)
        logger.info(f"Got {len(raw_texts)} OCR passes")
        
        if not raw_texts:
            raise HTTPException(status_code=500, detail="All OCR passes failed")
        
        # Log first pass for debugging
        logger.info(f"Pass 1 raw text:\n{raw_texts[0]}")
        
        result = extract_fields(raw_texts)
        return OCRResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "healthy", "version": "2.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
