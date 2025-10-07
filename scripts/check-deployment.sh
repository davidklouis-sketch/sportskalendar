#!/bin/bash

# Script to check deployment status and diagnose issues

echo "🔍 SportsKalender Deployment Check"
echo "===================================="
echo ""

# Check if running from correct directory
if [ ! -f "docker-compose.traefik.yml" ]; then
    echo "❌ Not in sportskalendar directory!"
    echo "Run this from: /opt/sportskalendar"
    exit 1
fi

# Determine compose file
COMPOSE_FILE="docker-compose.traefik.yml"
if [ "${BUILD_LOCAL}" = "true" ]; then
  COMPOSE_FILE="docker-compose.local.yml"
fi

echo "📊 Container Status:"
docker compose -f "$COMPOSE_FILE" ps
echo ""

echo "🏥 Health Checks:"
echo "Backend API: "
curl -s http://localhost:4000/api/health && echo "✅ OK" || echo "❌ FAILED"
echo ""

echo "📝 Recent Backend Logs:"
docker compose -f "$COMPOSE_FILE" logs --tail=20 backend
echo ""

echo "📝 Recent Frontend Logs:"
docker compose -f "$COMPOSE_FILE" logs --tail=10 frontend
echo ""

echo "🌐 Frontend Container Check:"
docker compose -f "$COMPOSE_FILE" exec frontend ls -la /usr/share/nginx/html || echo "❌ Cannot access frontend container"
echo ""

echo "🔗 Network Check:"
docker network ls | grep traefik
echo ""

echo "💾 Volume Check:"
docker volume ls | grep sportskalendar
echo ""

echo ""
echo "🔍 Quick Diagnostics:"
echo "===================="

# Check if containers are running
if docker compose -f "$COMPOSE_FILE" ps | grep -q "Up.*backend"; then
    echo "✅ Backend container is running"
else
    echo "❌ Backend container is NOT running"
fi

if docker compose -f "$COMPOSE_FILE" ps | grep -q "Up.*frontend"; then
    echo "✅ Frontend container is running"
else
    echo "❌ Frontend container is NOT running"
fi

if docker compose -f "$COMPOSE_FILE" ps | grep -q "Up.*postgres"; then
    echo "✅ PostgreSQL container is running"
else
    echo "❌ PostgreSQL container is NOT running"
fi

if docker compose -f "$COMPOSE_FILE" ps | grep -q "Up.*traefik"; then
    echo "✅ Traefik container is running"
else
    echo "❌ Traefik container is NOT running"
fi

echo ""
echo "📋 To view live logs:"
echo "   docker compose -f $COMPOSE_FILE logs -f"
echo ""
echo "🔄 To restart services:"
echo "   docker compose -f $COMPOSE_FILE restart"
echo ""

