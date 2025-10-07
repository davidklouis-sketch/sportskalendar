#!/bin/bash

# Build Docker images locally (for manual deployment before CI/CD is set up)

set -e

echo "🔨 Building Docker images locally..."

# Build backend
echo "📦 Building backend image..."
cd backend
docker build -t sportskalendar-backend:latest .
cd ..

# Build frontend
echo "📦 Building frontend image..."
cd frontend
docker build -t sportskalendar-frontend:latest \
  --build-arg VITE_API_URL=https://api.yourdomain.com/api .
cd ..

echo ""
echo "✅ Local images built successfully!"
echo ""
echo "📋 To use local images, update .env.production:"
echo "   BACKEND_IMAGE=sportskalendar-backend:latest"
echo "   FRONTEND_IMAGE=sportskalendar-frontend:latest"
echo ""
echo "Then run: ./scripts/deploy.sh"
echo ""

