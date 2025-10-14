#!/bin/bash

# Cross-platform Docker cleanup script for Sportskalendar
# Works on Linux, macOS, and Windows (with Git Bash/WSL)

echo "🧹 Starting Docker cleanup for Sportskalendar..."

# Stop and remove containers
echo "📦 Stopping and removing containers..."
docker compose -f docker-compose.yml down --remove-orphans 2>/dev/null || true
docker compose -f docker-compose.traefik.yml down --remove-orphans 2>/dev/null || true

# Remove unused images
echo "🗑️  Removing unused images..."
docker image prune -f 2>/dev/null || true

# Remove unused volumes (SKIPPED in production to protect database!)
echo "💾 Skipping volume cleanup to protect database data..."
echo "⚠️  WARNING: Volume cleanup skipped to prevent data loss"

# Remove unused networks
echo "🌐 Removing unused networks..."
docker network prune -f 2>/dev/null || true

# Clean up build cache
echo "🔨 Cleaning build cache..."
docker builder prune -f 2>/dev/null || true

echo "✅ Docker cleanup completed!"
echo "💡 To completely reset: docker system prune -a --volumes"