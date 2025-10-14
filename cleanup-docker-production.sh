#!/bin/bash

# SAFE Docker cleanup script for Sportskalendar PRODUCTION
# This script is safe for production and will NOT touch volumes/database

echo "🧹 Starting SAFE Docker cleanup for Sportskalendar PRODUCTION..."

# Stop and remove containers (but keep volumes!)
echo "📦 Stopping and removing containers (keeping volumes)..."
docker compose -f docker-compose.traefik.yml down --remove-orphans 2>/dev/null || true

# Remove unused images (safe)
echo "🗑️  Removing unused images..."
docker image prune -f 2>/dev/null || true

# SKIP volume cleanup - DATABASE PROTECTION!
echo "💾 SKIPPING volume cleanup to protect database data"
echo "✅ Database volumes are preserved"

# Remove unused networks (safe)
echo "🌐 Removing unused networks..."
docker network prune -f 2>/dev/null || true

# Clean up build cache (safe)
echo "🔨 Cleaning build cache..."
docker builder prune -f 2>/dev/null || true

echo "✅ SAFE Docker cleanup completed!"
echo "🔒 Database data is protected"
echo "💡 For development cleanup, use cleanup-docker.sh"
