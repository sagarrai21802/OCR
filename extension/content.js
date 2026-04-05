// OCR AutoFill Extension - Standalone Version (No Backend)
// Uses Tesseract.js for browser-based OCR
// Phase 2-9 Implementation

(function() {
    'use strict';
    
    console.log('[OCR AutoFill] Extension v2.1.0 loaded on Current_Work.aspx');
    
    // Configuration
    const CONFIG = {
        IMAGE_ID: 'ContentPlaceHolder1_Frame5',
        TESSERACT_WORKERS: 1,
        PROCESSING_TIMEOUT: 120000,
        MIN_IMAGE_SIZE: 5000, // 5KB minimum for valid image
    };
    
    // Field Mapping Matrix
    const FIELD_MAPPING = {
        'first_name': 'ContentPlaceHolder1_txtFName',
        'last_name': 'ContentPlaceHolder1_txtLName',
        'email': 'ContentPlaceHolder1_txtEmail',
        'ssn': 'ContentPlaceHolder1_txtSSN',
        'phone': 'ContentPlaceHolder1_txtPhone',
        'bank_name': 'ContentPlaceHolder1_txtBankName',
        'account_no': 'ContentPlaceHolder1_txtAcNo',
        'loan_amount': 'ContentPlaceHolder1_txtLoanAmt',
        'address': 'ContentPlaceHolder1_txtAddress',
        'city': 'ContentPlaceHolder1_txtCity',
        'state': 'ContentPlaceHolder1_txtState',
        'zip': 'ContentPlaceHolder1_txtZip',
        'dob': 'ContentPlaceHolder1_txtDob',
        'licence_no': 'ContentPlaceHolder1_txtLicenceNo',
        'licence_state': 'ContentPlaceHolder1_txtLicenceState',
        'ip': 'ContentPlaceHolder1_txtIP'
    };
    
    // Field order (matches document line layout)
    const FIELD_ORDER = [
        'first_name', 'last_name', 'email', 'ssn', 'phone',
        'bank_name', 'account_no', 'loan_amount', 'address', 'city',
        'state', 'zip', 'dob', 'licence_no', 'licence_state', 'ip'
    ];
    
    // Valid US states
    const VALID_STATES = new Set([
        'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
        'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
        'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
        'VA','WA','WV','WI','WY','DC','PR','VI','GU','AS','MP'
    ]);
    
    // Translation tables for OCR fixes
    const OCR_DIGIT_FIXES = {
        'O': '0', 'o': '0', 'I': '1', 'l': '1',
        'S': '5', 's': '5', 'B': '8', 'b': '8',
        'Z': '2', 'z': '2', 'G': '6', 'g': '9',
        'T': '7', 'D': '0', 'Q': '0', 'A': '4'
    };
    
    const OCR_ALPHA_FIXES = {
        '0': 'O', '1': 'I', '5': 'S', '8': 'B',
        '2': 'Z', '6': 'G', '9': 'g', '7': 'T',
        '4': 'A', '3': 'E'
    };
    
    // Street suffix fixes
    const STREET_SUFFIX_FIXES = {
        '5T': 'ST', '5t': 'ST', '$T': 'ST', 'S7': 'ST',
        '4VE': 'AVE', '4ve': 'AVE', 'AV3': 'AVE', 'AVF': 'AVE',
        '8LVD': 'BLVD', 'BLVO': 'BLVD', 'B1VD': 'BLVD',
        'DR1VE': 'DRIVE', 'DR1': 'DR',
        'LM': 'LN', '1N': 'LN',
        'C7': 'CT', 'C1': 'CT',
        'P1': 'PL', 'PK': 'PL',
        'RO': 'RD', 'R0': 'RD',
        'WAV': 'WAY', 'W4Y': 'WAY'
    };
    
    // Licence first char fixes
    const LICENCE_FIRST_CHAR_FIXES = {
        '0': 'O', '1': 'I', '2': 'Z', '3': 'E', '4': 'A',
        '5': 'S', '6': 'G', '7': 'T', '8': 'B', '9': 'P'
    };
    
    // Tesseract.js - loaded via manifest.json from local libs folder
    // No CDN loading - all files bundled locally for Chrome Web Store compliance
    let tesseractWorker = null;
    let tesseractLoadPromise = null;
    
    // Get local file paths using chrome.runtime.getURL
    function getLibPath(filename) {
        return chrome.runtime.getURL('libs/' + filename);
    }
    
    async function loadTesseract() {
        if (tesseractWorker) return tesseractWorker;
        if (tesseractLoadPromise) return tesseractLoadPromise;
        
        console.log('[OCR AutoFill] Initializing Tesseract from local files...');
        
        tesseractLoadPromise = (async () => {
            try {
                // Wait for Tesseract to be available (loaded via script tag in manifest)
                await new Promise((resolve, reject) => {
                    const checkInterval = setInterval(() => {
                        if (window.Tesseract) {
                            clearInterval(checkInterval);
                            resolve();
                        }
                    }, 100);
                    
                    // Timeout after 10 seconds
                    setTimeout(() => {
                        clearInterval(checkInterval);
                        reject(new Error('Tesseract.js not loaded'));
                    }, 10000);
                });
                
                const basePath = getLibPath('');
                
                tesseractWorker = await Tesseract.createWorker('eng', 1, {
                    workerPath: getLibPath('worker.min.js'),
                    langPath: 'https://tessdata.projectnaptha.com/4.0.0/',
                    corePath: getLibPath('tesseract-core.wasm.js'),
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            console.log(`[OCR AutoFill] OCR Progress: ${Math.round(m.progress * 100)}%`);
                        }
                    }
                });
                
                console.log('[OCR AutoFill] Tesseract worker ready with local files');
                return tesseractWorker;
            } catch (error) {
                console.error('[OCR AutoFill] Failed to initialize Tesseract:', error);
                throw error;
            }
        })();
        
        return tesseractLoadPromise;
    }
    
    function createCanvas(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        return canvas;
    }
    
    function getImageData(imgElement) {
        const canvas = createCanvas(imgElement.width, imgElement.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(imgElement, 0, 0);
        return ctx.getImageData(0, 0, imgElement.width, imgElement.height);
    }
    
    function grayscale(imgData) {
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
            data[i] = data[i + 1] = data[i + 2] = avg;
        }
        return imgData;
    }
    
    function otsuThreshold(imgData) {
        const data = imgData.data;
        const width = imgData.width;
        const height = imgData.height;
        
        // Calculate histogram
        const hist = new Array(256).fill(0);
        for (let i = 0; i < data.length; i += 4) {
            hist[data[i]]++;
        }
        
        // Total pixels
        const total = width * height;
        
        // Find threshold
        let sum = 0;
        for (let i = 0; i < 256; i++) sum += i * hist[i];
        
        let sumB = 0;
        let wB = 0;
        let wF = 0;
        let maxVariance = 0;
        let threshold = 0;
        
        for (let t = 0; t < 256; t++) {
            wB += hist[t];
            if (wB === 0) continue;
            wF = total - wB;
            if (wF === 0) break;
            
            sumB += t * hist[t];
            const mB = sumB / wB;
            const mF = (sum - sumB) / wF;
            const variance = wB * wF * (mB - mF) * (mB - mF);
            
            if (variance > maxVariance) {
                maxVariance = variance;
                threshold = t;
            }
        }
        
        // Apply threshold
        for (let i = 0; i < data.length; i += 4) {
            const val = data[i];
            const newVal = val >= threshold ? 255 : 0;
            data[i] = data[i + 1] = data[i + 2] = newVal;
        }
        
        return imgData;
    }
    
    function adaptiveThreshold(imgData, blockSize = 31, C = 10) {
        const data = imgData.data;
        const width = imgData.width;
        const height = imgData.height;
        
        // Simple adaptive approach using local mean
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const val = data[idx];
                
                // Calculate local mean (simplified)
                let sum = 0;
                let count = 0;
                for (let dy = -blockSize; dy <= blockSize; dy += blockSize) {
                    for (let dx = -blockSize; dx <= blockSize; dx += blockSize) {
                        const nx = x + dx;
                        const ny = y + dy;
                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                            sum += data[(ny * width + nx) * 4];
                            count++;
                        }
                    }
                }
                const mean = sum / count;
                const newVal = val > mean - C ? 255 : 0;
                data[idx] = data[idx + 1] = data[idx + 2] = newVal;
            }
        }
        
        return imgData;
    }
    
    function enhanceContrast(imgData, clipLimit = 2.0) {
        const data = imgData.data;
        const width = imgData.width;
        const height = imgData.height;
        
        // Simple contrast enhancement
        let min = 255, max = 0;
        for (let i = 0; i < data.length; i += 4) {
            const val = data[i];
            if (val < min) min = val;
            if (val > max) max = val;
        }
        
        const range = max - min;
        if (range < 1) return imgData;
        
        for (let i = 0; i < data.length; i += 4) {
            const val = ((data[i] - min) / range) * 255;
            data[i] = data[i + 1] = data[i + 2] = val;
        }
        
        return imgData;
    }
    
    function preprocessBinary(imgElement) {
        // Strategy 1: CLAHE + Otsu
        const imgData = getImageData(imgElement);
        grayscale(imgData);
        enhanceContrast(imgData);
        otsuThreshold(imgData);
        return imgData;
    }
    
    function preprocessAdaptive(imgElement) {
        // Strategy 2: Adaptive threshold
        const imgData = getImageData(imgElement);
        grayscale(imgData);
        enhanceContrast(imgData);
        adaptiveThreshold(imgData);
        return imgData;
    }
    
    function preprocessSharp(imgElement) {
        // Strategy 3: Sharpen + basic threshold
        const imgData = getImageData(imgElement);
        grayscale(imgData);
        
        // Simple sharpening kernel
        const width = imgData.width;
        const height = imgData.height;
        const data = imgData.data;
        
        // Apply sharpen
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                const val = data[idx] * 9 
                    - data[(y-1)*width+x]*1 - data[(y+1)*width+x]*1
                    - data[y*width+(x-1)]*1 - data[y*width+(x+1)]*1;
                data[idx] = data[idx+1] = data[idx+2] = Math.max(0, Math.min(255, val));
            }
        }
        
        // Basic threshold
        for (let i = 0; i < data.length; i += 4) {
            const val = data[i];
            data[i] = data[i+1] = data[i+2] = val > 128 ? 255 : 0;
        }
        
        return imgData;
    }
    
    function preprocessRaw(imgElement) {
        // Strategy 4: Minimal processing
        const imgData = getImageData(imgElement);
        grayscale(imgData);
        return imgData;
    }
    
    // ============================================================
    // TESSERACT.JS INTEGRATION
    // ============================================================
    
    async function loadTesseract() {
        if (tesseractWorker) return tesseractWorker;
        if (tesseractLoadPromise) return tesseractLoadPromise;
        
        isTesseractLoading = true;
        console.log('[OCR AutoFill] Loading Tesseract.js...');
        
        tesseractLoadPromise = (async () => {
            try {
                tesseractWorker = await Tesseract.createWorker('eng', 1, {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            console.log(`[OCR AutoFill] OCR Progress: ${Math.round(m.progress * 100)}%`);
                        }
                    }
                });
                console.log('[OCR AutoFill] Tesseract.js loaded successfully');
                return tesseractWorker;
            } catch (error) {
                console.error('[OCR AutoFill] Failed to load Tesseract:', error);
                throw error;
            } finally {
                isTesseractLoading = false;
            }
        })();
        
        return tesseractLoadPromise;
    }
    
    async function performOCRWithTesseract(imgElement) {
        const worker = await loadTesseract();
        
        console.log('[OCR AutoFill] Running OCR...');
        
        // Try multiple preprocessing strategies
        const strategies = [
            { name: 'binary', preprocess: preprocessBinary },
            { name: 'adaptive', preprocess: preprocessAdaptive },
            { name: 'sharp', preprocess: preprocessSharp },
            { name: 'raw', preprocess: preprocessRaw }
        ];
        
        let bestResult = null;
        let bestConfidence = -1;
        
        for (const strategy of strategies) {
            try {
                console.log(`[OCR AutoFill] Trying ${strategy.name} preprocessing...`);
                
                const processedData = strategy.preprocess(imgElement);
                
                // Create canvas from processed data
                const canvas = createCanvas(processedData.width, processedData.height);
                const ctx = canvas.getContext('2d');
                ctx.putImageData(processedData, 0, 0);
                
                // Run OCR
                const result = await worker.recognize(canvas);
                const text = result.data.text;
                
                if (text && text.trim()) {
                    console.log(`[OCR AutoFill] ${strategy.name} result:`, text.substring(0, 100));
                    
                    // Quick confidence estimation
                    const confidence = estimateOCRConfidence(text);
                    
                    if (confidence > bestConfidence) {
                        bestConfidence = confidence;
                        bestResult = text;
                    }
                }
            } catch (error) {
                console.warn(`[OCR AutoFill] ${strategy.name} failed:`, error);
            }
        }
        
        if (!bestResult) {
            // Last resort: try original image
            const canvas = createCanvas(imgElement.width, imgElement.height);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(imgElement, 0, 0);
            const result = await worker.recognize(canvas);
            bestResult = result.data.text;
        }
        
        console.log('[OCR AutoFill] OCR complete, best confidence:', bestConfidence);
        return bestResult || '';
    }
    
    function estimateOCRConfidence(text) {
        // Simple heuristic: count recognizable patterns
        let score = 0;
        const lines = text.split('\n').filter(l => l.trim());
        
        // More lines = better
        if (lines.length >= 14) score += 30;
        else if (lines.length >= 10) score += 20;
        else if (lines.length >= 5) score += 10;
        
        // Has recognizable patterns
        if (/\S+@\S+\.\S+/.test(text)) score += 15; // email
        if (/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(text)) score += 10; // phone
        if (/\d{9}/.test(text)) score += 10; // SSN/account
        if (/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(text)) score += 15; // IP
        
        return Math.min(score, 100);
    }
    
    // ============================================================
    // FIELD VALIDATORS (Ported from Python)
    // ============================================================
    
    function cleanForDigits(s) {
        let fixed = s;
        for (const [from, to] of Object.entries(OCR_DIGIT_FIXES)) {
            fixed = fixed.replace(new RegExp(from, 'g'), to);
        }
        return fixed.replace(/[^0-9]/g, '');
    }
    
    function cleanForAlpha(s) {
        let fixed = s;
        for (const [from, to] of Object.entries(OCR_ALPHA_FIXES)) {
            fixed = fixed.replace(new RegExp(from, 'g'), to);
        }
        return fixed.replace(/[^A-Za-z\s\-']/g, '').trim();
    }
    
    function validateFirstName(val) {
        let cleaned = val.replace(/[^A-Za-z\s\'\-]/g, '').trim();
        if (cleaned && cleaned.length >= 1) {
            return [cleaned.toUpperCase(), 1.0];
        }
        const alpha = cleanForAlpha(val);
        if (alpha) return [alpha.toUpperCase(), 0.7];
        return [val.trim().toUpperCase(), 0.3];
    }
    
    function validateLastName(val) {
        return validateFirstName(val);
    }
    
    function validateEmail(val) {
        let cleaned = val.trim().toLowerCase().replace(/\s/g, '').replace(',', '.');
        cleaned = cleaned.replace(/\(a\)/g, '@').replace(/\[at\]/g, '@').replace(/@@/g, '@');
        
        // Direct match
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
            return [cleaned, 1.0];
        }
        
        // Try to find email pattern
        const match = cleaned.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
        if (match) return [match[0], 0.9];
        
        return [cleaned, 0.3];
    }
    
    function validateSSN(val) {
        let digits = cleanForDigits(val);
        if (digits.length === 9) return [digits, 1.0];
        if (digits.length === 10) return [digits.slice(0, 9), 0.7];
        if (digits.length === 8) return [digits, 0.5];
        
        const stripped = val.replace(/[\-\s]/g, '');
        const digits2 = cleanForDigits(stripped);
        if (digits2.length === 9) return [digits2, 0.9];
        
        return [digits || val.trim(), 0.3];
    }
    
    function validatePhone(val) {
        let digits = cleanForDigits(val);
        if (digits.length === 11 && digits[0] === '1') digits = digits.slice(1);
        if (digits.length === 10) return [digits, 1.0];
        if (digits.length === 9) return [digits, 0.6];
        
        const stripped = val.replace(/[\-\(\)\s\+]/g, '');
        const digits2 = cleanForDigits(stripped);
        if (digits2.length === 11 && digits2[0] === '1') return [digits2.slice(1), 0.9];
        if (digits2.length === 10) return [digits2, 0.9];
        
        return [digits || val.trim(), 0.3];
    }
    
    function validateBankName(val) {
        const cleaned = val.replace(/[^A-Za-z0-9\s\.\&\'\-]/g, '').trim();
        if (cleaned && cleaned.length >= 3) return [cleaned, 1.0];
        
        const words = val.replace(/[^A-Za-z0-9\s]/g, '').trim();
        if (words && words.length >= 3) return [words, 0.7];
        
        return [val.trim(), 0.3];
    }
    
    function validateAccountNo(val) {
        const digits = cleanForDigits(val);
        if (digits.length >= 6 && digits.length <= 17) return [digits, 1.0];
        return [digits || val.trim(), 0.3];
    }
    
    function validateLoanAmount(val) {
        const cleaned = val.replace(/[\$,]/g, '').trim();
        const digits = cleanForDigits(cleaned);
        if (digits && digits.length >= 1 && digits.length <= 10) return [digits, 1.0];
        
        const match = cleaned.match(/[\d]+/);
        if (match) return [match[0], 0.8];
        
        return [val.trim(), 0.3];
    }
    
    function fixAddressOCR(addr) {
        const parts = addr.split(/\s+/);
        const fixedParts = parts.map(part => {
            const upper = part.toUpperCase();
            return STREET_SUFFIX_FIXES[upper] || part;
        });
        return fixedParts.join(' ');
    }
    
    function validateAddress(val) {
        let cleaned = val.trim();
        if (!cleaned) return [val.trim(), 0.3];
        
        cleaned = fixAddressOCR(cleaned);
        
        // Should start with a number
        if (/^\d+\s+/.test(cleaned)) return [cleaned, 1.0];
        
        // Try to fix leading digits
        const firstParts = cleaned.split(/\s+/);
        if (firstParts.length > 0) {
            const fixed = cleanForDigits(firstParts[0]) + ' ' + firstParts.slice(1).join(' ');
            if (/^\d+\s+/.test(fixed)) return [fixed, 0.8];
        }
        
        return [cleaned, 0.5];
    }
    
    function validateCity(val) {
        let cleaned = val.trim();
        
        // Pure alpha
        const pureAlpha = cleaned.replace(/[^A-Za-z\s\.\-]/g, '').trim();
        if (pureAlpha && pureAlpha.length >= 2 && !/\d/.test(cleaned)) {
            return [pureAlpha.toUpperCase(), 1.0];
        }
        
        // Has digits - apply fixes
        let fixed = cleaned;
        for (const [from, to] of Object.entries(OCR_ALPHA_FIXES)) {
            fixed = fixed.replace(new RegExp(from, 'g'), to);
        }
        fixed = fixed.replace(/[^A-Za-z\s\.\-]/g, '').trim();
        
        if (fixed && fixed.length >= 2) return [fixed.toUpperCase(), 0.8];
        
        const alpha = cleanForAlpha(cleaned);
        if (alpha) return [alpha.toUpperCase(), 0.7];
        
        return [val.trim().toUpperCase(), 0.3];
    }
    
    function validateState(val) {
        let cleaned = val.trim().toUpperCase().replace(/[^A-Z]/g, '');
        
        if (VALID_STATES.has(cleaned)) return [cleaned, 1.0];
        if (cleaned.length >= 2 && VALID_STATES.has(cleaned.slice(0, 2))) return [cleaned.slice(0, 2), 0.9];
        
        // Apply OCR fixes
        let fixed = cleaned;
        for (const [from, to] of Object.entries(OCR_ALPHA_FIXES)) {
            fixed = fixed.replace(new RegExp(from, 'g'), to);
        }
        fixed = fixed.replace(/[^A-Z]/g, '');
        
        if (VALID_STATES.has(fixed)) return [fixed, 0.8];
        if (fixed.length >= 2 && VALID_STATES.has(fixed.slice(0, 2))) return [fixed.slice(0, 2), 0.75];
        
        // Fuzzy: try all single-char substitutions
        for (let i = 0; i < Math.min(cleaned.length, 2); i++) {
            for (const c of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
                const candidate = cleaned.slice(0, i) + c + cleaned.slice(i + 1);
                if (candidate.length >= 2 && VALID_STATES.has(candidate.slice(0, 2))) {
                    return [candidate.slice(0, 2), 0.6];
                }
            }
        }
        
        return [cleaned || val.trim().toUpperCase(), 0.3];
    }
    
    function validateZip(val) {
        const digits = cleanForDigits(val);
        if (digits.length >= 5) return [digits.slice(0, 5), 1.0];
        if (digits.length === 4) return [digits, 0.6];
        return [digits || val.trim(), 0.3];
    }
    
    function validateDOB(val) {
        const cleaned = val.trim();
        
        // YYYY-MM-DD
        let match = cleaned.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
        if (match) {
            return [`${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`, 1.0];
        }
        
        // MM/DD/YYYY or DD/MM/YYYY
        match = cleaned.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
        if (match) {
            return [`${match[3]}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`, 0.9];
        }
        
        // Try extracting from 8 digits
        const digits = cleanForDigits(cleaned);
        if (digits.length === 8) {
            if (digits.slice(0, 2) === '19' || digits.slice(0, 2) === '20') {
                return [`${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`, 0.8];
            } else {
                return [`${digits.slice(4, 8)}-${digits.slice(0, 2)}-${digits.slice(2, 4)}`, 0.7];
            }
        }
        
        return [cleaned, 0.3];
    }
    
    function validateLicenceNo(val) {
        let cleaned = val.replace(/[\s\-]/g, '').trim().toUpperCase();
        
        if (!cleaned) return [val.trim().toUpperCase(), 0.3];
        
        let conf = 1.0;
        
        // Fix first char if it's a digit and length >= 7
        if (cleaned.length >= 7 && /^\d/.test(cleaned) && cleaned.slice(1).replace(/\s/g, '').replace(/[A-Z]/g, '').length === 0) {
            const fixedChar = LICENCE_FIRST_CHAR_FIXES[cleaned[0]] || cleaned[0];
            cleaned = fixedChar + cleaned.slice(1);
            conf = 0.7;
        }
        
        if (cleaned.length >= 1) return [cleaned, conf];
        return [cleaned, 0.5];
    }
    
    function validateLicenceState(val) {
        return validateState(val);
    }
    
    function validateIP(val) {
        const cleaned = val.trim();
        
        // Standard IPv4
        let match = cleaned.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
        if (match) return [match[1], 1.0];
        
        // Fix common OCR errors
        let fixed = cleaned.replace(/\s/g, '.').replace(/,/g, '.').replace(/\.\.+/g, '.');
        fixed = fixed.replace(/[^0-9\.]/g, '');
        
        match = fixed.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
        if (match) return [match[1], 0.8];
        
        match = fixed.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
        if (match) return [match[1], 0.7];
        
        return [cleaned, 0.3];
    }
    
    // Field validators map
    const FIELD_VALIDATORS = {
        'first_name': validateFirstName,
        'last_name': validateLastName,
        'email': validateEmail,
        'ssn': validateSSN,
        'phone': validatePhone,
        'bank_name': validateBankName,
        'account_no': validateAccountNo,
        'loan_amount': validateLoanAmount,
        'address': validateAddress,
        'city': validateCity,
        'state': validateState,
        'zip': validateZip,
        'dob': validateDOB,
        'licence_no': validateLicenceNo,
        'licence_state': validateLicenceState,
        'ip': validateIP
    };
    
    // ============================================================
    // FIELD EXTRACTION LOGIC
    // ============================================================
    
    function cleanLines(rawText) {
        const lines = rawText.split('\n');
        const cleaned = [];
        
        for (let line of lines) {
            // Normalize whitespace
            line = line.replace(/\s+/g, ' ').trim();
            
            // Skip empty
            if (!line || line.length <= 1) continue;
            
            // Skip decorative lines
            if (/^[\-_\=\*\.\|]+$/.test(line)) continue;
            
            cleaned.push(line);
        }
        
        return cleaned;
    }
    
    function extractFieldsPositional(lines) {
        const data = {};
        const fieldConfidences = {};
        
        for (let i = 0; i < FIELD_ORDER.length; i++) {
            const fieldName = FIELD_ORDER[i];
            const validator = FIELD_VALIDATORS[fieldName];
            
            if (i < lines.length) {
                const [cleanedVal, conf] = validator(lines[i]);
                data[fieldName] = cleanedVal;
                fieldConfidences[fieldName] = conf;
            } else {
                data[fieldName] = null;
                fieldConfidences[fieldName] = 0.0;
            }
        }
        
        // Calculate overall confidence
        const filled = Object.values(data).filter(v => v).length;
        const validCount = Object.values(fieldConfidences).filter(c => c >= 0.7).length;
        const totalConfidence = Math.round((validCount / 16) * 100 * 10) / 10;
        
        return { data, confidence: totalConfidence };
    }
    
    function extractFieldsPatternFallback(lines, allText) {
        const data = {};
        for (const field of FIELD_ORDER) data[field] = null;
        
        // Collect all tokens
        const allTokens = [];
        for (const line of lines) {
            allTokens.push(...line.split(/\s+/));
        }
        
        const usedValues = new Set();
        
        // Email
        for (const token of allTokens) {
            if (token.includes('@') && token.includes('.')) {
                const [cleaned] = validateEmail(token);
                data['email'] = cleaned;
                usedValues.add(token);
                break;
            }
        }
        
        // IP
        for (const token of allTokens) {
            if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(token)) {
                data['ip'] = token;
                usedValues.add(token);
                break;
            }
        }
        
        // DOB
        for (const token of allTokens) {
            if (/^\d{4}[\-/\.]\d{1,2}[\-/\.]\d{1,2}$/.test(token)) {
                const [cleaned] = validateDOB(token);
                data['dob'] = cleaned;
                usedValues.add(token);
                break;
            }
        }
        
        // State codes
        const stateCandidates = [];
        for (const token of allTokens) {
            if (/^[A-Z]{2}$/.test(token) && VALID_STATES.has(token) && !usedValues.has(token)) {
                stateCandidates.push(token);
            }
        }
        if (stateCandidates.length >= 1) data['state'] = stateCandidates[0];
        if (stateCandidates.length >= 2) data['licence_state'] = stateCandidates[1];
        
        // ZIP
        for (const token of allTokens) {
            if (/^\d{5}$/.test(token) && !usedValues.has(token)) {
                data['zip'] = token;
                usedValues.add(token);
                break;
            }
        }
        
        // SSN
        for (const token of allTokens) {
            const digits = cleanForDigits(token);
            if (digits.length === 9 && !usedValues.has(token)) {
                data['ssn'] = digits;
                usedValues.add(token);
                break;
            }
        }
        
        // Phone
        for (const token of allTokens) {
            const digits = cleanForDigits(token);
            if (digits.length === 10 && digits !== data['ssn'] && !usedValues.has(token)) {
                data['phone'] = digits;
                usedValues.add(token);
                break;
            }
        }
        
        // Account
        for (const token of allTokens) {
            const digits = cleanForDigits(token);
            if (digits.length >= 8 && digits.length <= 12 && 
                digits !== data['phone'] && digits !== data['ssn'] && !usedValues.has(token)) {
                data['account_no'] = digits;
                usedValues.add(token);
                break;
            }
        }
        
        // Bank name
        for (const line of lines) {
            if (line.toLowerCase().includes('bank')) {
                const cleaned = line.replace(/^[\d\s]+/, '').trim().replace(/\s+\d+.*$/, '').trim();
                if (cleaned) {
                    data['bank_name'] = cleaned;
                    break;
                }
            }
        }
        
        // Address
        for (const line of lines) {
            if (/^\d+\s+\w/.test(line) && !line.toLowerCase().includes('bank')) {
                data['address'] = line.trim();
                break;
            }
        }
        
        // Names
        const nameTokens = [];
        for (const token of allTokens.slice(0, 6)) {
            if (token === token.toUpperCase() && token.length > 1 && 
                !/\d/.test(token) && !token.includes('@') && 
                !VALID_STATES.has(token) && !usedValues.has(token)) {
                nameTokens.push(token);
                if (nameTokens.length === 2) break;
            }
        }
        if (nameTokens.length >= 1) data['first_name'] = nameTokens[0];
        if (nameTokens.length >= 2) data['last_name'] = nameTokens[1];
        
        // City
        for (const line of lines) {
            const cleaned = line.replace(/[^A-Za-z\s]/g, '').trim();
            if (cleaned && cleaned === cleaned.toUpperCase() && cleaned.length > 2 && 
                !VALID_STATES.has(cleaned)) {
                if (cleaned !== data['first_name'] && cleaned !== data['last_name']) {
                    data['city'] = cleaned;
                    break;
                }
            }
        }
        
        // Loan amount
        for (const token of allTokens) {
            const digits = cleanForDigits(token);
            if (digits.length >= 1 && digits.length <= 6 && !usedValues.has(token)) {
                if (digits !== data['zip'] && digits !== data['ssn'] && 
                    digits !== data['phone'] && digits !== data['account_no']) {
                    data['loan_amount'] = digits;
                    usedValues.add(token);
                    break;
                }
            }
        }
        
        // Licence
        for (const token of allTokens) {
            if (/^[A-Za-z]\d{5,}/.test(token) && !token.includes('@') && !usedValues.has(token)) {
                data['licence_no'] = token.toUpperCase();
                usedValues.add(token);
                break;
            }
        }
        
        // Calculate confidence
        const filled = Object.values(data).filter(v => v).length;
        const confidence = Math.round((filled / 16) * 100 * 10) / 10;
        
        return { data, confidence };
    }
    
    function extractFields(rawText) {
        const lines = cleanLines(rawText);
        console.log('[OCR AutoFill] Cleaned lines:', lines.length);
        
        // Strategy 1: Positional
        let bestResult = null;
        let bestConfidence = -1;
        
        if (lines.length >= 14 && lines.length <= 20) {
            const candidates = [
                lines.slice(0, 16),
                lines.length > 16 ? lines.slice(1, 17) : null,
                lines.length > 17 ? lines.slice(2, 18) : null
            ].filter(c => c !== null);
            
            for (const candidateLines of candidates) {
                const { data, confidence } = extractFieldsPositional(candidateLines);
                if (confidence > bestConfidence) {
                    bestConfidence = confidence;
                    bestResult = data;
                }
            }
        }
        
        // Strategy 2: Pattern fallback
        const { data: patternData, confidence: patternConfidence } = extractFieldsPatternFallback(lines, rawText);
        
        if (patternConfidence > bestConfidence) {
            bestConfidence = patternConfidence;
            bestResult = patternData;
        }
        
        // Last resort
        if (!bestResult) {
            const { data, confidence } = extractFieldsPositional(lines);
            bestResult = data;
            bestConfidence = confidence;
        }
        
        if (!bestResult) {
            bestResult = {};
            for (const field of FIELD_ORDER) bestResult[field] = null;
            bestConfidence = 0;
        }
        
        bestResult.confidence = bestConfidence;
        
        console.log('[OCR AutoFill] Final confidence:', bestConfidence);
        console.log('[OCR AutoFill] Result:', bestResult);
        
        return bestResult;
    }
    
    // ============================================================
    // MAIN OCR PROCESS
    // ============================================================
    
    async function processOCR(imageUrl) {
        console.log('[OCR AutoFill] Processing image URL:', imageUrl);
        
        // Load image
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        const imageLoaded = new Promise((resolve, reject) => {
            img.onload = () => resolve(img);
            img.onerror = (e) => reject(new Error('Failed to load image: ' + e));
        });
        
        img.src = imageUrl;
        await imageLoaded;
        
        // Run OCR with Tesseract.js
        const rawText = await performOCRWithTesseract(img);
        
        if (!rawText || !rawText.trim()) {
            throw new Error('OCR produced no text');
        }
        
        // Extract fields
        const extractedData = extractFields(rawText);
        
        return extractedData;
    }
    
    // ============================================================
    // DOM AUTOFILL
    // ============================================================
    
    async function autofillFields(data) {
        console.log('[OCR AutoFill] Autofilling fields...');
        
        let filledCount = 0;
        
        for (const [fieldKey, domId] of Object.entries(FIELD_MAPPING)) {
            const value = data[fieldKey];
            
            if (value && value.trim()) {
                const field = document.getElementById(domId);
                
                if (field) {
                    try {
                        setFieldValue(field, value);
                        filledCount++;
                        console.log(`[OCR AutoFill] ✓ Filled ${fieldKey}: ${value}`);
                    } catch (e) {
                        console.error(`[OCR AutoFill] ✗ Failed to fill ${fieldKey}:`, e);
                    }
                } else {
                    console.warn(`[OCR AutoFill] Field not found: ${domId}`);
                }
            }
        }
        
        console.log('[OCR AutoFill] === AUTOFILL SUMMARY ===');
        console.log(`[OCR AutoFill] Filled: ${filledCount}/16 fields`);
        
        return filledCount;
    }
    
    function setFieldValue(field, value) {
        // Remove blocking attributes
        field.removeAttribute('onpaste');
        field.removeAttribute('onselectstart');
        field.onpaste = null;
        field.onselectstart = null;
        
        // Focus and set value
        field.focus();
        field.value = value;
        
        // Trigger events for WebForms
        const events = ['input', 'change', 'keyup', 'blur'];
        for (const eventName of events) {
            const event = new Event(eventName, { bubbles: true, cancelable: true });
            field.dispatchEvent(event);
        }
        
        // Visual feedback
        field.style.backgroundColor = '#e8f5e9';
        field.style.border = '2px solid #4caf50';
        field.setAttribute('data-ocr-filled', 'true');
    }
    
    // ============================================================
    // NOTIFICATIONS
    // ============================================================
    
    function showNotification(message, type = 'info') {
        console.log(`[OCR AutoFill] Notification (${type}):`, message);
        
        // Remove existing
        const existing = document.getElementById('ocr-autofill-notification');
        if (existing) existing.remove();
        
        const banner = document.createElement('div');
        banner.id = 'ocr-autofill-notification';
        banner.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 20px 28px;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            font-weight: bold;
            z-index: 999999;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            max-width: 450px;
            animation: slideIn 0.3s ease-out;
            line-height: 1.5;
        `;
        
        switch (type) {
            case 'success':
                banner.style.backgroundColor = '#4caf50';
                banner.style.color = 'white';
                break;
            case 'error':
                banner.style.backgroundColor = '#f44336';
                banner.style.color = 'white';
                break;
            case 'warning':
                banner.style.backgroundColor = '#ff9800';
                banner.style.color = 'white';
                break;
            default:
                banner.style.backgroundColor = '#2196f3';
                banner.style.color = 'white';
        }
        
        banner.textContent = message;
        
        // Add animation
        if (!document.getElementById('ocr-autofill-styles')) {
            const style = document.createElement('style');
            style.id = 'ocr-autofill-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(banner);
        
        // Auto-remove after 15 seconds
        setTimeout(() => {
            if (banner.parentNode) {
                banner.style.animation = 'slideOut 0.3s ease-out';
                setTimeout(() => {
                    if (banner.parentNode) banner.remove();
                }, 300);
            }
        }, 15000);
        
        if (type === 'success') {
            setTimeout(() => {
                alert(message + '\n\n✅ Please review all fields before clicking Submit.');
            }, 500);
        }
    }
    
    // ============================================================
    // IMAGE EXTRACTION
    // ============================================================
    
    async function extractImage() {
        console.log('[OCR AutoFill] Extracting image...');
        
        const imgElement = document.getElementById(CONFIG.IMAGE_ID);
        
        if (imgElement && imgElement.tagName === 'IMG') {
            let imageUrl = imgElement.src;
            
            if (imageUrl) {
                // Convert to absolute
                if (imageUrl.startsWith('http')) {
                    // Already absolute
                } else if (imageUrl.startsWith('/')) {
                    imageUrl = window.location.origin + imageUrl;
                } else if (imageUrl.startsWith('./')) {
                    const basePath = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
                    imageUrl = basePath + imageUrl.substring(2);
                } else {
                    const basePath = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
                    imageUrl = basePath + imageUrl;
                }
                
                const cleanUrl = imageUrl.split('#')[0];
                console.log('[OCR AutoFill] Clean image URL:', cleanUrl);
                return cleanUrl;
            }
        }
        
        // Fallback selectors
        const fallbackSelectors = [
            'img[src*=".jpg"]',
            'img[src*=".jpeg"]',
            'img[src*=".png"]',
            '[id*="Frame5"] img'
        ];
        
        for (const selector of fallbackSelectors) {
            const element = document.querySelector(selector);
            if (element && element.src) {
                const cleanUrl = element.src.split('#')[0];
                console.log('[OCR AutoFill] Found image via fallback:', cleanUrl);
                return cleanUrl;
            }
        }
        
        console.warn('[OCR AutoFill] Could not find image element');
        return null;
    }
    
    // ============================================================
    // MAIN PROCESS
    // ============================================================
    
    async function startProcess() {
        try {
            console.log('[OCR AutoFill] Starting process...');
            
            // Image extraction
            const imageUrl = await extractImage();
            if (!imageUrl) {
                console.warn('[OCR AutoFill] No image found');
                showNotification('No document image found. Please ensure the document is loaded.', 'error');
                return;
            }
            
            console.log('[OCR AutoFill] Image URL:', imageUrl);
            
            // OCR processing
            const extractedData = await processOCR(imageUrl);
            
            if (!extractedData) {
                console.error('[OCR AutoFill] OCR failed');
                showNotification('OCR processing failed. Please try again.', 'error');
                return;
            }
            
            console.log('[OCR AutoFill] OCR Data:', extractedData);
            
            // DOM autofill
            const filledCount = await autofillFields(extractedData);
            
            // Notification
            if (filledCount > 0) {
                showNotification(
                    `✅ ${filledCount} fields auto-filled! Please review and click Submit.`,
                    'success'
                );
            } else {
                showNotification('No fields were filled. Please check OCR data or try again.', 'warning');
            }
            
        } catch (error) {
            console.error('[OCR AutoFill] Error:', error);
            showNotification('Error: ' + error.message, 'error');
        }
    }
    
    // ============================================================
    // UI SETUP
    // ============================================================
    
    function addOCRButton() {
        if (document.getElementById('ocr-autofill-btn')) {
            return;
        }
        
        const btn = document.createElement('button');
        btn.id = 'ocr-autofill-btn';
        btn.innerHTML = '🔍 AutoFill OCR';
        btn.title = 'Click to extract data from document and fill form fields';
        btn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 999999;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 14px 28px;
            border-radius: 30px;
            font-size: 15px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            font-family: Arial, sans-serif;
            transition: transform 0.2s, box-shadow 0.2s;
        `;
        
        btn.onmouseover = function() {
            this.style.transform = 'scale(1.05)';
            this.style.boxShadow = '0 6px 25px rgba(0,0,0,0.4)';
        };
        
        btn.onmouseout = function() {
            this.style.transform = 'scale(1)';
            this.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
        };
        
        btn.onclick = function() {
            this.disabled = true;
            this.innerHTML = '⏳ Processing...';
            startProcess().finally(() => {
                this.disabled = false;
                this.innerHTML = '🔍 AutoFill OCR';
            });
        };
        
        document.body.appendChild(btn);
        console.log('[OCR AutoFill] Button added to page');
    }
    
    // ============================================================
    // INITIALIZATION
    // ============================================================
    
    function init() {
        console.log('[OCR AutoFill] Initializing...');
        addOCRButton();
        console.log('[OCR AutoFill] Click the "AutoFill OCR" button to start');
    }
    
    // Start
    init();
    
})();