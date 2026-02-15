# OCR AutoFill Extension

Chrome Extension that automatically extracts structured data from JPG documents on ASP.NET WebForms pages and fills 16 predefined text input fields.

## Features

- Automatically detects and extracts images from Current_Work.aspx pages
- OCR processing with Tesseract
- Structured field extraction (16 fields)
- WebForms-compatible DOM manipulation
- Manual submission only (never auto-saves or auto-submits)
- User notifications with confirmation banner

## Project Structure

```
.
├── docs/
│   └── plan.md              # Product Requirements Document
├── extension/               # Chrome Extension (Manifest V3)
│   ├── manifest.json        # Extension manifest
│   ├── content.js          # Main content script
│   ├── popup.html          # Extension popup UI
│   └── icons/              # Extension icons
└── ocr-backend/            # OCR Backend (FastAPI)
    ├── main.py             # FastAPI application
    └── requirements.txt    # Python dependencies
```

## Field Mapping (16 Fields)

| Field | DOM ID |
|-------|--------|
| First Name | ContentPlaceHolder1_txtFName |
| Last Name | ContentPlaceHolder1_txtLName |
| Email | ContentPlaceHolder1_txtEmail |
| SSN | ContentPlaceHolder1_txtSSN |
| Phone | ContentPlaceHolder1_txtPhone |
| Bank Name | ContentPlaceHolder1_txtBankName |
| Account No | ContentPlaceHolder1_txtAcNo |
| Loan Amount | ContentPlaceHolder1_txtLoanAmt |
| Address | ContentPlaceHolder1_txtAddress |
| City | ContentPlaceHolder1_txtCity |
| State | ContentPlaceHolder1_txtState |
| Zip | ContentPlaceHolder1_txtZip |
| DOB | ContentPlaceHolder1_txtDob |
| License No | ContentPlaceHolder1_txtLicenceNo |
| License State | ContentPlaceHolder1_txtLicenceState |
| IP | ContentPlaceHolder1_txtIP |

## Setup Instructions

### 1. OCR Backend Setup

```bash
# Navigate to backend directory
cd ocr-backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Install Tesseract OCR
# On macOS:
brew install tesseract

# On Ubuntu/Debian:
sudo apt-get install tesseract-ocr

# On Windows:
# Download from: https://github.com/UB-Mannheim/tesseract/wiki

# Start the server
python main.py
```

The API will be available at `http://localhost:8000`

### 2. Chrome Extension Setup

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `extension` folder
5. The extension will now load on any page matching `*://*/*Current_Work.aspx*`

### 3. Configuration

The extension uses these default settings:
- **OCR API URL**: `http://localhost:8000/ocr`
- **Image ID**: `ContentPlaceHolder1_Frame5`

To change these, edit the `CONFIG` object in `extension/content.js`.

## Usage

1. Start the OCR backend server (port 8000)
2. Ensure Chrome extension is loaded
3. Navigate to Current_Work.aspx page
4. The extension will automatically:
   - Detect the image
   - Extract text via OCR
   - Fill all 16 fields
   - Show a confirmation notification
5. Review the filled fields
6. Manually click Submit (never auto-submitted)

## API Endpoints

### POST /ocr
Extract structured data from an image URL.

**Request:**
```json
{
  "image_url": "https://example.com/document.jpg"
}
```

**Response:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "ssn": "123-45-6789",
  "phone": "(555) 123-4567",
  "bank_name": "Bank of America",
  "account_no": "1234567890",
  "loan_amount": "$50,000.00",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zip": "10001",
  "dob": "01/15/1980",
  "licence_no": "D12345678",
  "licence_state": "NY",
  "ip": "192.168.1.1",
  "confidence": 75.0
}
```

### GET /health
Health check endpoint.

## WebForms Compatibility

The extension is designed to work with ASP.NET WebForms:
- Triggers `input`, `change`, and `keyup` events for proper validation
- Handles partial postbacks via MutationObserver
- Never triggers Save buttons
- Never auto-submits forms
- Preserves ViewState integrity

## Security

- No data persistence
- No data logging
- HTTPS support for API communication
- Local backend processing only

## Troubleshooting

### Extension not loading
- Check Chrome DevTools console for errors
- Verify manifest.json syntax
- Ensure all files are in place

### OCR not working
- Verify backend is running on port 8000
- Check Tesseract is installed correctly
- Review backend logs for errors

### Fields not filling
- Verify field IDs match exactly
- Check for JavaScript errors in console
- Ensure image is loaded before extension runs

## Development

### Backend Development
```bash
cd ocr-backend
source venv/bin/activate
python main.py --reload
```

### Extension Development
1. Edit files in `extension/` directory
2. Go to `chrome://extensions/`
3. Click refresh icon on the extension card
4. Test changes

## Future Enhancements

- Confidence score display
- Highlight modified fields
- Side-panel preview of extracted data
- Batch processing mode
- Enterprise deployment via policy

## Success Metrics

- 80% reduction in manual typing time
- 95%+ field accuracy
- Zero unintended Save triggers
- Zero data persistence

## License

MIT License
