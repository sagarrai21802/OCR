#!/bin/bash

echo "============================================"
echo "  OCR AutoFill - Full Setup"
echo "============================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Step 1: Install ngrok if not present
if ! command -v ngrok &> /dev/null; then
    echo -e "${YELLOW}Installing ngrok...${NC}"
    brew install ngrok
    echo ""
fi

# Step 2: Check if backend is running
echo -e "${YELLOW}Checking OCR backend...${NC}"
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${YELLOW}Starting OCR backend...${NC}"
    cd "$(dirname "$0")/ocr-backend"
    
    # Activate venv and start backend in background
    if [ -d "venv" ]; then
        source venv/bin/activate
    else
        python3 -m venv venv
        source venv/bin/activate
        pip install -q -r requirements.txt
    fi
    
    python main.py > /tmp/ocr-backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > /tmp/ocr-backend.pid
    
    # Wait for backend to start
    sleep 3
    
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend started successfully${NC}"
    else
        echo -e "${RED}✗ Failed to start backend${NC}"
        cat /tmp/ocr-backend.log
        exit 1
    fi
fi

# Step 3: Start ngrok tunnel
echo ""
echo -e "${YELLOW}Starting ngrok tunnel...${NC}"

# Kill existing ngrok if any
pkill -f "ngrok http" 2>/dev/null

# Start ngrok in background
ngrok http 8000 > /tmp/ngrok.log 2>&1 &
NGROK_PID=$!
echo $NGROK_PID > /tmp/ngrok.pid

# Wait for ngrok to start
sleep 5

# Get HTTPS URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"https://[^"]*\.ngrok-free\.app"' | head -1 | tr -d '"')

if [ -z "$NGROK_URL" ]; then
    # Try alternative format
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | python3 -c "import sys,json; data=json.load(sys.stdin); print([t['public_url'] for t in data['tunnels'] if t['public_url'].startswith('https')][0])" 2>/dev/null)
fi

if [ -z "$NGROK_URL" ]; then
    echo -e "${RED}✗ Failed to get ngrok URL. Check ngrok logs:${NC}"
    cat /tmp/ngrok.log
    exit 1
fi

echo -e "${GREEN}✓ Ngrok tunnel started${NC}"
echo ""
echo "============================================"
echo -e "  ${GREEN}SETUP COMPLETE${NC}"
echo "============================================"
echo ""
echo "HTTPS API URL: $NGROK_URL/ocr"
echo ""
echo "NEXT STEPS:"
echo "1. Copy the URL above"
echo "2. Edit: extension/content.js"
echo "3. Change line 15:"
echo "   FROM: OCR_API_URL: 'http://localhost:8000/ocr',"
echo "   TO:   OCR_API_URL: '$NGROK_URL/ocr',"
echo ""
echo "4. Reload extension in Brave/Chrome"
echo "5. Go to Current_Work.aspx"
echo "6. Click '🔍 AutoFill OCR' button"
echo ""
echo "============================================"

# Save URL to file for reference
echo "$NGROK_URL" > /tmp/ngrok-url.txt
