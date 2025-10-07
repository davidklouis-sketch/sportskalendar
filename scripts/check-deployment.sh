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

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "❌ .env.production not found!"
    echo "Please create it from .env.production.example"
    echo "  cp .env.production.example .env.production"
    echo "  nano .env.production"
    exit 1
fi

# Load environment variables
set -a
source .env.production 2>/dev/null
set +a

echo "📝 Environment Variables Check:"
echo "  JWT_SECRET: ${JWT_SECRET:+✅ Set} ${JWT_SECRET:-❌ NOT SET}"
echo "  DB_PASSWORD: ${DB_PASSWORD:+✅ Set} ${DB_PASSWORD:-❌ NOT SET}"
echo "  BACKEND_HOST: ${BACKEND_HOST:+✅ Set} ${BACKEND_HOST:-❌ NOT SET}"
echo "  FRONTEND_HOST: ${FRONTEND_HOST:+✅ Set} ${FRONTEND_HOST:-❌ NOT SET}"
echo "  LETSENCRYPT_EMAIL: ${LETSENCRYPT_EMAIL:+✅ Set} ${LETSENCRYPT_EMAIL:-❌ NOT SET}"
echo ""

# Determine compose file
COMPOSE_FILE="docker-compose.traefik.yml"
if [ "${BUILD_LOCAL}" = "true" ]; then
  COMPOSE_FILE="docker-compose.local.yml"
fi

echo "📊 Container Status:"
docker compose -f "$COMPOSE_FILE" --env-file .env.production ps
echo ""

echo "🏥 Health Checks:"
echo -n "Backend API: "
curl -s http://localhost:4000/api/health && echo "✅ OK" || echo "❌ FAILED"
echo ""

echo "📝 Recent Backend Logs:"
docker compose -f "$COMPOSE_FILE" --env-file .env.production logs --tail=20 backend
echo ""

echo "📝 Recent Frontend Logs:"
docker compose -f "$COMPOSE_FILE" --env-file .env.production logs --tail=10 frontend
echo ""

echo "🌐 Frontend Container Check:"
docker exec sportskalendar-frontend ls -la /usr/share/nginx/html 2>/dev/null || echo "❌ Cannot access frontend container"
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

# Check if containers are running using docker ps
if docker ps --format '{{.Names}}' | grep -q "sportskalendar-backend"; then
    echo "✅ Backend container is running"
else
    echo "❌ Backend container is NOT running"
fi

if docker ps --format '{{.Names}}' | grep -q "sportskalendar-frontend"; then
    echo "✅ Frontend container is running"
else
    echo "❌ Frontend container is NOT running"
fi

if docker ps --format '{{.Names}}' | grep -q "sportskalendar-db"; then
    echo "✅ PostgreSQL container is running"
else
    echo "❌ PostgreSQL container is NOT running"
fi

if docker ps --format '{{.Names}}' | grep -q "traefik"; then
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

