"""
OCR AutoFill Backend API
"""

import re
import io
import requests
from typing import Optional
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

app = FastAPI(title="OCR AutoFill API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class OCRRequest(BaseModel):
    image_url: str
    image_base64: Optional[str] = None

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

def download_image(url: str) -> Image.Image:
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, headers=headers, timeout=30, verify=False)
        response.raise_for_status()
        return Image.open(io.BytesIO(response.content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

def preprocess(img: Image.Image) -> np.ndarray:
    arr = np.array(img)
    gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY) if len(arr.shape) == 3 else arr
    
    h, w = gray.shape
    if h < 1000 or w < 1000:
        scale = max(1000/h, 1000/w)
        gray = cv2.resize(gray, (int(w*scale), int(h*scale)), interpolation=cv2.INTER_CUBIC)
    
    denoised = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)
    binary = cv2.adaptiveThreshold(denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 11, 2)
    return binary

def extract_text(img: Image.Image) -> str:
    if img.mode != 'RGB':
        img = img.convert('RGB')
    processed = preprocess(img)
    return pytesseract.image_to_string(processed, config=r'--oem 3 --psm 6 -l eng')

def format_ssn(s: str) -> str:
    d = re.sub(r'\D', '', s)
    return f"{d[:3]}-{d[3:5]}-{d[5:]}" if len(d) == 9 else s

def format_phone(s: str) -> str:
    d = re.sub(r'\D', '', s)
    return f"({d[:3]}) {d[3:6]}-{d[6:]}" if len(d) == 10 else s

def extract_fields(text: str) -> dict:
    data = {k: None for k in [
        'first_name', 'last_name', 'email', 'ssn', 'phone',
        'account_no', 'bank_name', 'loan_amount', 'address',
        'city', 'state', 'zip', 'dob', 'licence_no', 'licence_state', 'ip'
    ]}
    
    # Clean and split into lines
    lines = [re.sub(r'\s+', ' ', l).strip() for l in text.split('\n') if l.strip()]
    logger.info(f"Lines: {lines}")
    
    # For each line, extract tokens and map to fields
    for line_idx, line in enumerate(lines):
        tokens = line.split()
        
        for token in tokens:
            # Email
            if '@' in token and '.' in token:
                data['email'] = token
            
            # SSN (9 digits)
            elif re.match(r'^\d{9}$', token):
                data['ssn'] = format_ssn(token)
            
            # Phone (10 digits)
            elif re.match(r'^\d{10}$', token):
                data['phone'] = format_phone(token)
            
            # IP
            elif re.match(r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$', token):
                data['ip'] = token
            
            # DOB (YYYY-MM-DD)
            elif re.match(r'^\d{4}-\d{2}-\d{2}$', token):
                data['dob'] = token
            
            # Zip (5 digits)
            elif re.match(r'^\d{5}$', token):
                data['zip'] = token
            
            # State (2 letters, common ones)
            elif re.match(r'^(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|MI)$', token):
                if not data['state']:
                    data['state'] = token
                elif not data['licence_state']:
                    data['licence_state'] = token
            
            # Licence No (starts with S + digits)
            elif re.match(r'^S\d+$', token):
                data['licence_no'] = token
    
    # LINE-BY-LINE EXTRACTION (based on known document structure)
    # Line 0: "LAKEYSHA SMITH skeysha41@yahoo.com 213921949"
    if len(lines) > 0:
        parts = lines[0].split()
        if len(parts) >= 2:
            data['first_name'] = parts[0].title()
            data['last_name'] = parts[1].title()
        for p in parts:
            if '@' in p:
                data['email'] = p
            if re.match(r'^\d{9}$', p):
                data['ssn'] = format_ssn(p)
    
    # Line 1: "3136430180 Central Bank of Kansas City 98/649075 1250"
    if len(lines) > 1:
        parts = lines[1].split()
        for p in parts:
            if re.match(r'^\d{10}$', p):
                data['phone'] = format_phone(p)
            if re.match(r'^\d{3,6}$', p) and not data.get('loan_amount'):
                data['loan_amount'] = f"${p}"
        # Bank name
        if 'bank' in lines[1].lower():
            idx = lines[1].lower().find('bank')
            data['bank_name'] = lines[1][:idx].strip().title()
    
    # Line 2: "8516 DEARBORN HEIGHTS MI 4812/"
    if len(lines) > 2:
        parts = lines[2].split()
        if len(parts) >= 1:
            data['address'] = parts[0]
        
        # Find city, state, zip
        text = lines[2]
        # Look for state
        state_match = re.search(r'\b(MI|AL|CA|NY|TX|FL)\b', text)
        if state_match:
            data['state'] = state_match.group(1)
            idx = state_match.start()
            # City is before state
            middle = text[:idx].strip()
            if middle:
                parts2 = middle.split()
                if len(parts2) > 1:
                    data['city'] = ' '.join(parts2[1:]).title()
                else:
                    data['city'] = middle.title()
            # Zip is after state
            after = text[idx+2:].strip()
            zip_match = re.search(r'(\d{5})', after)
            if zip_match:
                data['zip'] = zip_match.group(1)
    
    # Line 3: "1967-02-10 $530488488 MI 143.254.146.62" (or line 4)
    for line in lines:
        # DOB
        dob_match = re.search(r'(\d{4}-\d{2}-\d{2})', line)
        if dob_match and not data['dob']:
            data['dob'] = dob_match.group(1)
        
        # Licence no (S + digits)
        lic_match = re.search(r'S(\d{8,9})', line)
        if lic_match and not data['licence_no']:
            data['licence_no'] = 'S' + lic_match.group(1)
        
        # Also check for $ prefix that OCR might have interpreted
        if '$' in line:
            # Find number after $
            dollar_match = re.search(r'\$(\d{3,})', line)
            if dollar_match and not data['loan_amount']:
                amt = dollar_match.group(1)
                try:
                    data['loan_amount'] = f"${int(amt):,}"
                except:
                    data['loan_amount'] = f"${amt}"
    
    # Count filled
    filled = sum(1 for v in data.values() if v)
    data['confidence'] = round((filled / 16) * 100, 2)
    
    logger.info(f"Result: {data}")
    return data

@app.post("/ocr", response_model=OCRResponse)
async def process_ocr(req: OCRRequest):
    try:
        img = download_image(req.image_url)
        raw = extract_text(img)
        logger.info(f"Raw:\n{raw}")
        result = extract_fields(raw)
        result['raw_text'] = raw
        return OCRResponse(**result)
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health(): return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
