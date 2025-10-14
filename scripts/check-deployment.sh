#!/bin/bash

# Deployment Health Check Script
echo "🔍 Checking Sportskalendar Deployment Status"
echo "=============================================="

# Check if containers are running
echo "📦 Container Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep sportskalendar || echo "❌ No Sportskalendar containers found"

echo ""
echo "🌐 Network Status:"
docker network ls | grep traefik || echo "❌ Traefik network not found"

echo ""
echo "🔗 Traefik Status:"
docker logs traefik --tail 10 2>/dev/null || echo "❌ Traefik container not found or not running"

echo ""
echo "📱 Frontend Status:"
docker logs sportskalendar-frontend --tail 10 2>/dev/null || echo "❌ Frontend container not found or not running"

echo ""
echo "🔧 Backend Status:"
docker logs sportskalendar-backend --tail 10 2>/dev/null || echo "❌ Backend container not found or not running"

echo ""
echo "🗄️ Database Status:"
docker logs sportskalendar-db --tail 5 2>/dev/null || echo "❌ Database container not found or not running"

echo ""
echo "🌍 DNS Check:"
nslookup sportskalendar.de || echo "❌ DNS resolution failed"

echo ""
echo "🔒 SSL Certificate Check:"
curl -I https://sportskalendar.de 2>/dev/null | head -5 || echo "❌ HTTPS connection failed"

echo ""
echo "📊 Health Endpoints:"
echo "Backend Health:"
curl -s https://api.sportskalendar.de/api/health 2>/dev/null || echo "❌ Backend health check failed"

echo ""
echo "Frontend Health:"
curl -I https://sportskalendar.de 2>/dev/null | head -3 || echo "❌ Frontend health check failed"

echo ""
echo "✅ Deployment check complete!"