#!/bin/bash

# ==============================================================================
# Finflow Finance Manager - Quick Deployment Verification Script
# ==============================================================================
# This script verifies that your environment is ready for Coolify deployment
# Run this BEFORE deploying to catch issues early
# ==============================================================================

echo "🔍 Finflow Production Readiness Verification"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ISSUES_FOUND=0

# ==============================================================================
# 1. Check if .env.production exists
# ==============================================================================
echo "📄 Checking .env.production..."
if [ -f ".env.production" ]; then
    echo -e "${GREEN}✓${NC} .env.production exists"
else
    echo -e "${RED}✗${NC} .env.production not found!"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi
echo ""

# ==============================================================================
# 2. Check for placeholder API keys (not rotated)
# ==============================================================================
echo "🔑 Checking API Keys..."

# Check Binance API key
if grep -q "YOUR_NEW_BINANCE_API_KEY_HERE" .env.production 2>/dev/null; then
    echo -e "${RED}✗${NC} Binance API key is still placeholder! Rotate before deployment."
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
elif grep -q "jquHsfuTgdVZyOe7F3b6vdGYIbmzU9uxqE8TdsduXPOi1hVO02wHtwBTcYIB490C" .env.production 2>/dev/null; then
    echo -e "${RED}✗${NC} OLD EXPOSED Binance key found! Must rotate immediately!"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✓${NC} Binance API key appears to be set"
fi

# Check Alpaca API key
if grep -q "YOUR_NEW_ALPACA_PAPER_API_KEY_HERE" .env.production 2>/dev/null; then
    echo -e "${RED}✗${NC} Alpaca API key is still placeholder! Set before deployment."
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✓${NC} Alpaca API key appears to be set"
fi
echo ""

# ==============================================================================
# 3. Check for localhost in CORS_ORIGIN
# ==============================================================================
echo "🌐 Checking CORS configuration..."
if grep "CORS_ORIGIN=.*localhost" .env.production > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠${NC} CORS_ORIGIN still contains localhost - update with production domain!"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✓${NC} CORS_ORIGIN configured for production"
fi
echo ""

# ==============================================================================
# 4. Check for strong secrets
# ==============================================================================
echo "🔐 Checking security secrets..."

# Check JWT_SECRET length
JWT_SECRET=$(grep "^JWT_SECRET=" .env.production 2>/dev/null | cut -d'=' -f2)
if [ ${#JWT_SECRET} -lt 32 ]; then
    echo -e "${RED}✗${NC} JWT_SECRET too short (${#JWT_SECRET} chars, need 32+)"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✓${NC} JWT_SECRET is strong (${#JWT_SECRET} characters)"
fi

# Check ENCRYPTION_MASTER_KEY length
ENCRYPTION_KEY=$(grep "^ENCRYPTION_MASTER_KEY=" .env.production 2>/dev/null | cut -d'=' -f2)
if [ ${#ENCRYPTION_KEY} -lt 32 ]; then
    echo -e "${RED}✗${NC} ENCRYPTION_MASTER_KEY too short"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✓${NC} ENCRYPTION_MASTER_KEY is strong"
fi

# Check POSTGRES_PASSWORD length
POSTGRES_PASS=$(grep "^POSTGRES_PASSWORD=" .env.production 2>/dev/null | cut -d'=' -f2)
if [ ${#POSTGRES_PASS} -lt 16 ]; then
    echo -e "${RED}✗${NC} POSTGRES_PASSWORD too short"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✓${NC} POSTGRES_PASSWORD is strong"
fi
echo ""

# ==============================================================================
# 5. Check docker-compose.yml exists
# ==============================================================================
echo "🐳 Checking Docker configuration..."
if [ -f "docker-compose.yml" ]; then
    echo -e "${GREEN}✓${NC} docker-compose.yml exists"
else
    echo -e "${RED}✗${NC} docker-compose.yml not found!"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi
echo ""

# ==============================================================================
# 6. Check for hardcoded localhost in code (should be fixed)
# ==============================================================================
echo "🔎 Checking for hardcoded localhost URLs in code..."

HARDCODED_COUNT=$(grep -r "localhost:8081\|localhost:3001" app/ components/ 2>/dev/null | grep -v "process.env.NEXT_PUBLIC_API_URL" | wc -l | tr -d ' ')

if [ "$HARDCODED_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}⚠${NC} Found $HARDCODED_COUNT potential hardcoded localhost references"
    echo "   Run: grep -r \"localhost:8081\" app/ components/ to find them"
else
    echo -e "${GREEN}✓${NC} No hardcoded localhost URLs found"
fi
echo ""

# ==============================================================================
# 7. Check backend migrations exist
# ==============================================================================
echo "📊 Checking database migrations..."
if [ -d "backend/drizzle/migrations" ]; then
    MIGRATION_COUNT=$(ls -1 backend/drizzle/migrations/*.sql 2>/dev/null | wc -l | tr -d ' ')
    if [ "$MIGRATION_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✓${NC} Found $MIGRATION_COUNT migration files"
    else
        echo -e "${YELLOW}⚠${NC} No migration files found in backend/drizzle/migrations/"
    fi
else
    echo -e "${YELLOW}⚠${NC} backend/drizzle/migrations/ directory not found"
fi
echo ""

# ==============================================================================
# 8. Check if test pages are removed
# ==============================================================================
echo "🧹 Checking for test/dev pages..."
if [ -f "app/test-tabs/page.tsx" ]; then
    echo -e "${YELLOW}⚠${NC} Test page still exists: app/test-tabs/page.tsx (should be removed)"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✓${NC} Test pages removed"
fi
echo ""

# ==============================================================================
# FINAL SUMMARY
# ==============================================================================
echo "=============================================="
echo ""

if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}✅ ALL CHECKS PASSED!${NC}"
    echo ""
    echo "Your application is ready for deployment to Coolify!"
    echo ""
    echo "Next steps:"
    echo "1. Verify API keys are rotated (Binance + Alpaca)"
    echo "2. Update CORS_ORIGIN with your production domain"
    echo "3. Deploy via Coolify"
    echo "4. Run post-deployment verification"
    exit 0
else
    echo -e "${RED}❌ FOUND $ISSUES_FOUND ISSUE(S)${NC}"
    echo ""
    echo "Please fix the issues above before deploying to production."
    echo ""
    echo "Critical items:"
    echo "- Rotate exposed API keys"
    echo "- Set production domain in CORS_ORIGIN"
    echo "- Ensure all secrets are strong"
    echo ""
    echo "See PRE_DEPLOYMENT_CHECKLIST.md for detailed instructions."
    exit 1
fi
