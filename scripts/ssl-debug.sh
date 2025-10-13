#!/bin/bash

# SSL Certificate Debugging Script for SportsKalendar
# This script helps diagnose SSL certificate issues

echo "🔍 SSL Certificate Debugging for SportsKalendar"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    if [ "$2" = "OK" ]; then
        echo -e "${GREEN}✅ $1${NC}"
    elif [ "$2" = "ERROR" ]; then
        echo -e "${RED}❌ $1${NC}"
    elif [ "$2" = "WARNING" ]; then
        echo -e "${YELLOW}⚠️ $1${NC}"
    else
        echo -e "${BLUE}🔍 $1${NC}"
    fi
}

# 1. Check if running from correct directory
echo "1. Checking environment..."
if [ ! -f "docker-compose.traefik.yml" ]; then
    print_status "Not in sportskalendar directory!" "ERROR"
    echo "Run this from: /opt/sportskalendar or your project root"
    exit 1
fi
print_status "Running from correct directory" "OK"

# 2. Check .env.production
echo ""
echo "2. Checking environment configuration..."
if [ ! -f ".env.production" ]; then
    print_status ".env.production not found!" "ERROR"
    exit 1
fi

# Load environment variables
set -a
source .env.production 2>/dev/null
set +a

print_status "Environment variables loaded" "OK"
echo "  BACKEND_HOST: ${BACKEND_HOST:-NOT SET}"
echo "  FRONTEND_HOST: ${FRONTEND_HOST:-NOT SET}"
echo "  LETSENCRYPT_EMAIL: ${LETSENCRYPT_EMAIL:-NOT SET}"

# 3. Check DNS records
echo ""
echo "3. Checking DNS records..."
if command -v dig &> /dev/null; then
    echo "Checking A records:"
    
    # Check main domain
    MAIN_IP=$(dig +short ${FRONTEND_HOST:-sportskalendar.de} A | head -n1)
    if [ -n "$MAIN_IP" ]; then
        print_status "${FRONTEND_HOST:-sportskalendar.de} → $MAIN_IP" "OK"
    else
        print_status "${FRONTEND_HOST:-sportskalendar.de} → NO A RECORD" "ERROR"
    fi
    
    # Check API subdomain
    API_IP=$(dig +short ${BACKEND_HOST:-api.sportskalendar.de} A | head -n1)
    if [ -n "$API_IP" ]; then
        print_status "${BACKEND_HOST:-api.sportskalendar.de} → $API_IP" "OK"
    else
        print_status "${BACKEND_HOST:-api.sportskalendar.de} → NO A RECORD" "ERROR"
    fi
    
    # Check if both point to same IP
    if [ "$MAIN_IP" = "$API_IP" ] && [ -n "$MAIN_IP" ]; then
        print_status "Both domains point to same IP" "OK"
    else
        print_status "Domains point to different IPs or missing records" "WARNING"
    fi
else
    print_status "dig command not available, skipping DNS check" "WARNING"
fi

# 4. Check Docker containers
echo ""
echo "4. Checking Docker containers..."
if ! docker ps | grep -q traefik; then
    print_status "Traefik container not running!" "ERROR"
else
    print_status "Traefik container is running" "OK"
fi

if ! docker ps | grep -q sportskalendar-backend; then
    print_status "Backend container not running!" "ERROR"
else
    print_status "Backend container is running" "OK"
fi

if ! docker ps | grep -q sportskalendar-frontend; then
    print_status "Frontend container not running!" "ERROR"
else
    print_status "Frontend container is running" "OK"
fi

# 5. Check Traefik logs for SSL errors
echo ""
echo "5. Checking Traefik logs for SSL errors..."
echo "Recent Traefik logs:"
docker logs traefik --tail=50 2>&1 | grep -i -E "(error|ssl|certificate|acme|let's encrypt)" | tail -10

# 6. Check SSL certificate directly
echo ""
echo "6. Testing SSL certificates..."
if command -v openssl &> /dev/null; then
    echo "Testing ${FRONTEND_HOST:-sportskalendar.de}:"
    echo | timeout 10 openssl s_client -connect ${FRONTEND_HOST:-sportskalendar.de}:443 -servername ${FRONTEND_HOST:-sportskalendar.de} 2>/dev/null | openssl x509 -noout -dates 2>/dev/null || print_status "No valid SSL certificate" "ERROR"
    
    echo ""
    echo "Testing ${BACKEND_HOST:-api.sportskalendar.de}:"
    echo | timeout 10 openssl s_client -connect ${BACKEND_HOST:-api.sportskalendar.de}:443 -servername ${BACKEND_HOST:-api.sportskalendar.de} 2>/dev/null | openssl x509 -noout -dates 2>/dev/null || print_status "No valid SSL certificate" "ERROR"
else
    print_status "openssl command not available, skipping SSL test" "WARNING"
fi

# 7. Check Traefik dashboard/API
echo ""
echo "7. Checking Traefik configuration..."
if docker exec traefik wget -qO- http://localhost:8080/api/http/routers 2>/dev/null | grep -q "backend"; then
    print_status "Backend router found in Traefik" "OK"
else
    print_status "Backend router not found in Traefik" "ERROR"
fi

if docker exec traefik wget -qO- http://localhost:8080/api/http/routers 2>/dev/null | grep -q "frontend"; then
    print_status "Frontend router found in Traefik" "OK"
else
    print_status "Frontend router not found in Traefik" "ERROR"
fi

# 8. Test Calendar Sync endpoint
echo ""
echo "8. Testing Calendar Sync endpoint..."
if curl -s -I "https://${BACKEND_HOST:-api.sportskalendar.de}/api/calendar-sync/test" | grep -q "200 OK"; then
    print_status "Calendar Sync test endpoint accessible" "OK"
else
    print_status "Calendar Sync test endpoint not accessible" "ERROR"
fi

# 9. Check Let's Encrypt certificates in Traefik
echo ""
echo "9. Checking Let's Encrypt certificates..."
if docker exec traefik ls -la /letsencrypt/ 2>/dev/null | grep -q "acme.json"; then
    print_status "Let's Encrypt storage found" "OK"
    echo "Certificate files:"
    docker exec traefik ls -la /letsencrypt/ 2>/dev/null
else
    print_status "Let's Encrypt storage not found" "ERROR"
fi

# 10. Check firewall/ports
echo ""
echo "10. Checking network connectivity..."
if command -v netstat &> /dev/null; then
    if netstat -tuln | grep -q ":80 "; then
        print_status "Port 80 is listening" "OK"
    else
        print_status "Port 80 is not listening" "ERROR"
    fi
    
    if netstat -tuln | grep -q ":443 "; then
        print_status "Port 443 is listening" "OK"
    else
        print_status "Port 443 is not listening" "ERROR"
    fi
else
    print_status "netstat command not available, skipping port check" "WARNING"
fi

echo ""
echo "🎯 Summary and Recommendations:"
echo "==============================="
echo ""

# Generate recommendations based on findings
if [ -z "$BACKEND_HOST" ] || [ -z "$FRONTEND_HOST" ]; then
    echo "❌ CRITICAL: Domain environment variables not set!"
    echo "   Fix: Set BACKEND_HOST and FRONTEND_HOST in .env.production"
fi

if ! docker ps | grep -q traefik; then
    echo "❌ CRITICAL: Traefik container not running!"
    echo "   Fix: docker-compose -f docker-compose.traefik.yml up -d"
fi

if [ -z "$API_IP" ]; then
    echo "❌ CRITICAL: DNS A record missing for API subdomain!"
    echo "   Fix: Create A record for api.sportskalendar.de pointing to server IP"
fi

echo ""
echo "🔧 Quick fixes to try:"
echo "1. Restart Traefik: docker restart traefik"
echo "2. Check Traefik logs: docker logs -f traefik"
echo "3. Force certificate renewal: docker-compose down && docker-compose up -d"
echo "4. Check DNS propagation: dig api.sportskalendar.de A"
echo ""
echo "📋 For detailed troubleshooting, see SSL_DEBUG.md"
