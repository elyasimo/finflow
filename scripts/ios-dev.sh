#!/bin/bash

# FinFlow iOS Development Script
# This script automates local development for the iOS app

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get local IP for simulator connection
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "localhost")

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   FinFlow iOS Development Environment${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

MODE=${1:-dev}

case $MODE in
  "dev")
    echo -e "${YELLOW}📱 Starting LOCAL development mode...${NC}"
    echo -e "${GREEN}   Local IP: $LOCAL_IP${NC}"
    
    # Use dev config
    if [ -f "capacitor.config.dev.ts" ]; then
      cp capacitor.config.ts capacitor.config.prod.backup.ts 2>/dev/null || true
      cp capacitor.config.dev.ts capacitor.config.ts
      echo -e "${GREEN}✓ Using development config (localhost:3000)${NC}"
    fi
    
    # Check if dev server is running
    if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
      echo -e "${YELLOW}⚡ Starting Next.js dev server...${NC}"
      npm run dev &
      DEV_PID=$!
      echo -e "${GREEN}✓ Dev server started (PID: $DEV_PID)${NC}"
      sleep 5
    else
      echo -e "${GREEN}✓ Dev server already running${NC}"
    fi
    
    # Check if backend is running
    if ! curl -s http://localhost:8081/health > /dev/null 2>&1; then
      echo -e "${YELLOW}⚡ Starting backend server...${NC}"
      cd backend && npm run dev &
      BACKEND_PID=$!
      cd ..
      echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"
      sleep 3
    else
      echo -e "${GREEN}✓ Backend already running${NC}"
    fi
    
    # Sync Capacitor
    echo -e "${YELLOW}📦 Syncing Capacitor...${NC}"
    npx cap sync ios
    echo -e "${GREEN}✓ Capacitor synced${NC}"
    
    # Open Xcode
    echo -e "${YELLOW}🔨 Opening Xcode...${NC}"
    npx cap open ios
    
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}   ✅ Ready for development!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "   ${BLUE}Frontend:${NC} http://localhost:3000"
    echo -e "   ${BLUE}Backend:${NC}  http://localhost:8081"
    echo -e "   ${BLUE}Local IP:${NC} http://$LOCAL_IP:3000"
    echo ""
    echo -e "   ${YELLOW}Press Cmd+R in Xcode to run on simulator${NC}"
    echo -e "   ${YELLOW}Changes will hot-reload automatically!${NC}"
    echo ""
    ;;
    
  "prod")
    echo -e "${YELLOW}🚀 Switching to PRODUCTION mode...${NC}"
    
    # Restore production config
    if [ -f "capacitor.config.prod.backup.ts" ]; then
      cp capacitor.config.prod.backup.ts capacitor.config.ts
      rm capacitor.config.prod.backup.ts
    else
      # Reset to production URL
      cat > capacitor.config.ts << 'EOF'
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ch.finflowapp',
  appName: 'FinFlow',
  webDir: 'out',
  server: {
    url: 'https://finflowapp.ch',
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0a0a0a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0a0a0a',
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  ios: {
    scheme: 'FinFlow',
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    backgroundColor: '#0a0a0a',
  },
  android: {
    backgroundColor: '#0a0a0a',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
EOF
    fi
    
    echo -e "${GREEN}✓ Production config restored${NC}"
    
    # Sync and open
    npx cap sync ios
    npx cap open ios
    
    echo -e "${GREEN}✅ Ready for production testing!${NC}"
    ;;
    
  "test")
    echo -e "${YELLOW}🧪 Running tests before deployment...${NC}"
    
    # Build test
    echo -e "${BLUE}1. Testing build...${NC}"
    npm run build
    echo -e "${GREEN}✓ Build successful${NC}"
    
    # Type check
    echo -e "${BLUE}2. Type checking...${NC}"
    npx tsc --noEmit
    echo -e "${GREEN}✓ Types OK${NC}"
    
    # Lint check
    echo -e "${BLUE}3. Linting...${NC}"
    npm run lint || echo -e "${YELLOW}⚠ Lint warnings (non-blocking)${NC}"
    
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}   ✅ All tests passed! Ready to deploy.${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    ;;
    
  "deploy")
    echo -e "${YELLOW}🚀 Deploying to production...${NC}"
    
    # Run tests first
    ./scripts/ios-dev.sh test
    
    # Switch to production
    ./scripts/ios-dev.sh prod
    
    # Git operations
    echo -e "${BLUE}Committing and pushing...${NC}"
    git add -A
    git commit -m "deploy: $(date '+%Y-%m-%d %H:%M')" || echo "Nothing to commit"
    git push
    
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}   ✅ Deployed! Coolify will build automatically.${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    ;;
    
  *)
    echo "Usage: ./scripts/ios-dev.sh [dev|prod|test|deploy]"
    echo ""
    echo "Commands:"
    echo "  dev     - Start local development (default)"
    echo "  prod    - Switch to production URL"
    echo "  test    - Run build/type/lint tests"
    echo "  deploy  - Test, commit, and push to production"
    ;;
esac
