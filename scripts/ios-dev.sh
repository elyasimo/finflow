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

# Get local IP for device connection
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "localhost")

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   FinFlow iOS Development Environment${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

MODE=${1:-dev}

case $MODE in
  "dev"|"device")
    echo -e "${YELLOW}📱 Starting LOCAL development mode for PHYSICAL DEVICE...${NC}"
    echo -e "${GREEN}   Local IP: $LOCAL_IP${NC}"
    
    # Update dev config with current IP
    cat > capacitor.config.ts << EOF
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ch.finflowapp.app',
  appName: 'FinFlow',
  webDir: 'out',
  server: {
    url: 'http://${LOCAL_IP}:3000',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1000,
      launchAutoHide: true,
      backgroundColor: '#0a0a0a',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0a0a0a',
    },
    Keyboard: {
      resize: 'none',
      style: 'dark',
      resizeOnFullScreen: false,
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
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
};

export default config;
EOF
    echo -e "${GREEN}✓ Config updated with IP: ${LOCAL_IP}${NC}"
    
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
    
    # Sync Capacitor
    echo -e "${YELLOW}📦 Syncing Capacitor...${NC}"
    npx cap sync ios
    echo -e "${GREEN}✓ Capacitor synced${NC}"
    
    # Open Xcode
    echo -e "${YELLOW}🔨 Opening Xcode...${NC}"
    npx cap open ios
    
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}   ✅ Ready for local development on iPhone!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "   ${BLUE}App URL:${NC} http://$LOCAL_IP:3000"
    echo -e "   ${BLUE}API:${NC}     Uses production API (api.finflowapp.ch)"
    echo ""
    echo -e "   ${YELLOW}1. Deploy to your iPhone from Xcode${NC}"
    echo -e "   ${YELLOW}2. Changes hot-reload instantly!${NC}"
    echo ""
    ;;
    
  "prod")
    echo -e "${YELLOW}🚀 Switching to PRODUCTION mode...${NC}"
    
    cat > capacitor.config.ts << 'EOF'
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ch.finflowapp.app',
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
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0a0a0a',
    },
    Keyboard: {
      resize: 'none',
      style: 'dark',
      resizeOnFullScreen: false,
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
    
    echo -e "${GREEN}✓ Production config set${NC}"
    
    # Sync and open
    npx cap sync ios
    npx cap open ios
    
    echo -e "${GREEN}✅ Ready for production!${NC}"
    ;;
    
  "test")
    echo -e "${YELLOW}🧪 Running tests before deployment...${NC}"
    
    echo -e "${BLUE}1. Testing build...${NC}"
    npm run build
    echo -e "${GREEN}✓ Build successful${NC}"
    
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}   ✅ Build OK! Ready to deploy.${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    ;;
    
  "deploy")
    echo -e "${YELLOW}🚀 Deploying to production...${NC}"
    
    # Switch to production config
    ./scripts/ios-dev.sh prod
    
    # Build
    npm run build
    
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
    echo "Usage: ./scripts/ios-dev.sh [dev|prod|deploy]"
    echo ""
    echo "Commands:"
    echo "  dev     - Local dev on physical iPhone (uses your IP: $LOCAL_IP)"
    echo "  prod    - Switch to production URL (finflowapp.ch)"
    echo "  deploy  - Build, commit, and push to production"
    ;;
esac
