#!/bin/bash

echo "Starting OCR Backend Server..."
echo "================================"

cd "$(dirname "$0")/ocr-backend"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -q -r requirements.txt

# Check if tesseract is installed
if ! command -v tesseract &> /dev/null; then
    echo "⚠️  Warning: Tesseract is not installed!"
    echo "Please install Tesseract OCR:"
    echo "  macOS: brew install tesseract"
    echo "  Ubuntu: sudo apt-get install tesseract-ocr"
    exit 1
fi

echo "✓ Tesseract found: $(tesseract --version | head -1)"
echo ""
echo "Starting FastAPI server on http://localhost:8000"
echo "Press Ctrl+C to stop"
echo "================================"

python main.py
