#!/bin/bash

# Analytics Dashboard - Quick Deployment Script
# This script helps automate the deployment preparation

set -e

echo "🚀 Analytics Dashboard Deployment Preparation"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    print_error "Node.js version $NODE_VERSION is too old. Please upgrade to version 18 or higher."
    exit 1
fi

print_status "Node.js version $NODE_VERSION is compatible"

# Check if git is available and we're in a git repository
if ! git rev-parse --is-inside-work-tree &> /dev/null; then
    print_error "This directory is not a git repository. Please run 'git init' first."
    exit 1
fi

print_status "Git repository detected"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    print_info "Installing dependencies..."
    npm install
    print_status "Dependencies installed"
else
    print_status "Dependencies already installed"
fi

# Check if environment files exist
if [ ! -f ".env.local" ]; then
    print_error "Missing .env.local file. Please create it with your environment variables."
    exit 1
fi

if [ ! -f ".env.production" ]; then
    print_warning ".env.production file missing. Created template."
    cp .env.local .env.production
    print_info "Please update .env.production with your production WebSocket URL"
fi

print_status "Environment files checked"

# Test build
print_info "Testing production build..."
if npm run build; then
    print_status "Production build successful"
else
    print_error "Production build failed. Please fix build errors before deploying."
    exit 1
fi

# Test WebSocket server
print_info "Testing WebSocket server..."
node websocket-server.js &
WS_PID=$!

# Wait for server to start
sleep 3

# Test connection
if node -e "
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:8080');
ws.on('open', () => {
    console.log('✅ WebSocket server test passed');
    ws.close();
    process.exit(0);
});
ws.on('error', () => {
    process.exit(1);
});
setTimeout(() => process.exit(1), 5000);
" 2>/dev/null; then
    print_status "WebSocket server test passed"
else
    print_warning "WebSocket server test failed (this is normal if server is already running)"
fi

# Clean up
kill $WS_PID 2>/dev/null || true

# Check deployment files
DEPLOYMENT_FILES=("Dockerfile" "railway.json" "vercel.json" ".github/workflows/frontend-ci.yml")

for file in "${DEPLOYMENT_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_status "Deployment file: $file ✓"
    else
        print_error "Missing deployment file: $file"
        exit 1
    fi
done

echo ""
echo "🎉 Deployment preparation complete!"
echo ""
print_info "Next steps:"
echo "1. Deploy WebSocket server to Railway:"
echo "   - Create Railway account at https://railway.app"
echo "   - Connect this GitHub repository"
echo "   - Deploy using the Dockerfile"
echo "   - Note the Railway domain (e.g., your-app.railway.app)"
echo ""
echo "2. Deploy frontend to Vercel:"
echo "   - Create Vercel account at https://vercel.com"
echo "   - Connect this GitHub repository"
echo "   - Set environment variables in Vercel dashboard:"
echo "     NEXT_PUBLIC_SUPABASE_URL=https://ldhqvsuzipctokmxwbhb.supabase.co"
echo "     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key"
echo "     NEXT_PUBLIC_WEBSOCKET_URL=wss://your-railway-domain"
echo ""
echo "3. Update WebSocket CORS:"
echo "   - Add your Vercel domain to websocket-server.js allowedOrigins"
echo "   - Redeploy WebSocket server"
echo ""
print_info "See DEPLOYMENT_CHECKLIST.md for detailed instructions"
print_info "See deployment-guide.md for comprehensive deployment guide"

echo ""
print_status "Ready for deployment! 🚀"