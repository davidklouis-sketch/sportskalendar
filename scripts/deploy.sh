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

echo "📦 Pulling Docker images..."
docker compose -f docker-compose.traefik.yml --env-file .env.production pull

echo "🔄 Starting services..."
docker compose -f docker-compose.traefik.yml --env-file .env.production up -d --remove-orphans

echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check service health
if docker compose -f docker-compose.traefik.yml ps | grep -q "Up"; then
    echo "✅ Services are running!"
else
    echo "❌ Some services failed to start. Check logs:"
    docker compose -f docker-compose.traefik.yml logs --tail=50
    exit 1
fi

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📊 Service Status:"
docker compose -f docker-compose.traefik.yml ps
echo ""
echo "🌐 Access your application at:"
echo "   Frontend: https://${FRONTEND_HOST}"
echo "   Backend:  https://${BACKEND_HOST}/api"
echo ""
echo "📝 View logs with:"
echo "   docker compose -f docker-compose.traefik.yml logs -f"
echo ""

