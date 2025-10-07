#!/bin/bash

# SportsKalender Deployment Script
# This script deploys the application using Docker Compose with Traefik and PostgreSQL

set -e

echo "🚀 Starting SportsKalender Deployment..."

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "❌ Error: .env.production not found!"
    echo "Please copy .env.production.example to .env.production and configure it."
    exit 1
fi

# Load environment variables
set -a
source .env.production
set +a

# Verify required variables
required_vars=("JWT_SECRET" "DB_PASSWORD" "BACKEND_HOST" "FRONTEND_HOST" "LETSENCRYPT_EMAIL")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: $var is not set in .env.production"
        exit 1
    fi
done

echo "✅ Environment variables validated"

# Create traefik network if it doesn't exist
if ! docker network ls | grep -q traefik-proxy; then
    echo "📡 Creating traefik-proxy network..."
    docker network create traefik-proxy
fi

# Create data directories
mkdir -p backend/data
chmod 755 backend/data

echo "📦 Building/Pulling Docker images..."
# Check if we should build locally or pull from registry
if [ "${BUILD_LOCAL}" = "true" ]; then
  echo "Building images locally..."
  docker compose -f docker-compose.local.yml --env-file .env.production build
else
  echo "Pulling images from registry..."
  docker compose -f docker-compose.traefik.yml --env-file .env.production pull
fi

echo "🔄 Starting services..."
# Use local compose file if BUILD_LOCAL is set
if [ "${BUILD_LOCAL}" = "true" ]; then
  docker compose -f docker-compose.local.yml --env-file .env.production up -d --remove-orphans
else
  docker compose -f docker-compose.traefik.yml --env-file .env.production up -d --remove-orphans
fi

echo "⏳ Waiting for services to be healthy..."
sleep 10

# Determine which compose file to use
COMPOSE_FILE="docker-compose.traefik.yml"
if [ "${BUILD_LOCAL}" = "true" ]; then
  COMPOSE_FILE="docker-compose.local.yml"
fi

# Check service health
if docker compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
    echo "✅ Services are running!"
else
    echo "❌ Some services failed to start. Check logs:"
    docker compose -f "$COMPOSE_FILE" logs --tail=50
    exit 1
fi

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📊 Service Status:"
docker compose -f "$COMPOSE_FILE" ps
echo ""
echo "🌐 Access your application at:"
echo "   Frontend: https://${FRONTEND_HOST}"
echo "   Backend:  https://${BACKEND_HOST}/api"
echo ""
echo "📝 View logs with:"
echo "   docker compose -f $COMPOSE_FILE logs -f"
echo ""

