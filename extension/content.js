// OCR AutoFill Extension - Content Script
// Phase 2-9 Implementation

(function() {
    'use strict';
    
    console.log('[OCR AutoFill] Extension loaded on Current_Work.aspx');
    
    // Configuration
    const CONFIG = {
        OCR_API_URL: 'https://pasty-prudish-secondly.ngrok-free.dev/ocr',
        IMAGE_ID: 'ContentPlaceHolder1_Frame5',
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 1000
    };
    
    // Field Mapping Matrix (Phase 6)
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
    
    // Initialize extension
    function init() {
        console.log('[OCR AutoFill] Initializing...');
        
        // Add manual trigger button
        addOCRButton();
        
        // Don't auto-run - wait for button click
        console.log('[OCR AutoFill] Click the "AutoFill OCR" button to start');
    }
    
    // Add manual trigger button
    function addOCRButton() {
        // Check if button already exists
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
    
    // Start the OCR and autofill process
    async function startProcess() {
        try {
            console.log('[OCR AutoFill] Starting process...');
            
            // Phase 3: Image Extraction
            const imageUrl = await extractImage();
            if (!imageUrl) {
                console.warn('[OCR AutoFill] No image found');
                showNotification('No document image found. Please ensure the document is loaded.', 'error');
                return;
            }
            
            console.log('[OCR AutoFill] Image URL extracted:', imageUrl);
            
            // Phase 5: OCR API Integration
            const extractedData = await performOCR(imageUrl);
            if (!extractedData) {
                console.error('[OCR AutoFill] OCR failed');
                showNotification('OCR processing failed. Please ensure backend is running on port 8000.', 'error');
                return;
            }
            
            console.log('[OCR AutoFill] OCR Data received:', extractedData);
            
            // Phase 6: DOM Autofill
            const filledCount = await autofillFields(extractedData);
            
            // Phase 7: Notification
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
    
    // Phase 3: Image Extraction Layer
    async function extractImage() {
        console.log('[OCR AutoFill] Extracting image...');
        
        const imgElement = document.getElementById(CONFIG.IMAGE_ID);
        
        if (imgElement && imgElement.tagName === 'IMG') {
            let imageUrl = imgElement.src;
            
            if (imageUrl) {
                // Convert relative URL to absolute
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
                
                // Remove hash parameters
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
    
    // Phase 5: OCR API Integration
    async function performOCR(imageUrl) {
        console.log('[OCR AutoFill] Performing OCR...');
        
        let attempts = 0;
        
        while (attempts < CONFIG.RETRY_ATTEMPTS) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000);
                
                const response = await fetch(CONFIG.OCR_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        image_url: imageUrl
                    }),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                
                if (data.error) {
                    throw new Error(data.error);
                }
                
                return data;
                
            } catch (error) {
                attempts++;
                console.warn(`[OCR AutoFill] Attempt ${attempts} failed:`, error);
                
                if (attempts < CONFIG.RETRY_ATTEMPTS) {
                    await delay(CONFIG.RETRY_DELAY * attempts);
                } else {
                    throw error;
                }
            }
        }
        
        return null;
    }
    
    // Phase 6: DOM Autofill Engine - FIXED for anti-paste
    async function autofillFields(data) {
        console.log('[OCR AutoFill] Autofilling fields...');
        
        let filledCount = 0;
        const filledFields = [];
        const failedFields = [];
        
        for (const [fieldKey, domId] of Object.entries(FIELD_MAPPING)) {
            const value = data[fieldKey];
            
            if (value && value.trim()) {
                const field = document.getElementById(domId);
                
                if (field) {
                    try {
                        setFieldValue(field, value);
                        filledCount++;
                        filledFields.push(`${fieldKey}: ${value}`);
                        console.log(`[OCR AutoFill] ✓ Filled ${fieldKey}: ${value}`);
                    } catch (e) {
                        failedFields.push(fieldKey);
                        console.error(`[OCR AutoFill] ✗ Failed to fill ${fieldKey}:`, e);
                    }
                } else {
                    failedFields.push(fieldKey);
                    console.warn(`[OCR AutoFill] Field not found: ${domId}`);
                }
            }
        }
        
        console.log('[OCR AutoFill] === AUTOFILL SUMMARY ===');
        console.log(`[OCR AutoFill] Filled: ${filledCount}/16 fields`);
        
        return filledCount;
    }
    
    // FIXED: Set value bypassing anti-paste protection
    function setFieldValue(field, value) {
        // Remove HTML attributes that block paste/select
        // This is the key fix - removeAttribute, not just setting property to null
        field.removeAttribute('onpaste');
        field.removeAttribute('onselectstart');
        
        // Also clear any event handlers
        field.onpaste = null;
        field.onselectstart = null;
        
        // Focus the field
        field.focus();
        
        // Set value directly
        field.value = value;
        
        // Trigger all relevant events for WebForms
        const events = ['input', 'change', 'keyup', 'blur'];
        events.forEach(eventName => {
            const event = new Event(eventName, {
                bubbles: true,
                cancelable: true
            });
            field.dispatchEvent(event);
        });
        
        // Visual feedback - green highlight
        field.style.backgroundColor = '#e8f5e9';
        field.style.border = '2px solid #4caf50';
        field.setAttribute('data-ocr-filled', 'true');
    }
    
    // Phase 7: Notification Layer
    function showNotification(message, type = 'info') {
        console.log(`[OCR AutoFill] Notification (${type}):`, message);
        
        // Remove existing notification
        const existing = document.getElementById('ocr-autofill-notification');
        if (existing) {
            existing.remove();
        }
        
        // Create notification banner
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
        
        // Colors based on type
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
        
        // Add animation styles
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
        
        // Also show alert on success
        if (type === 'success') {
            setTimeout(() => {
                alert(message + '\n\n✅ Please review all fields before clicking Submit.');
            }, 500);
        }
    }
    
    // Utility function
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Start initialization
    init();
    
})();
