#!/bin/bash

# SportsKalender Server Setup Script
# Run this script on a fresh Ubuntu/Debian server to prepare for deployment

set -e

echo "🔧 SportsKalender Server Setup"
echo "================================"

# Check if running as root or with sudo
if [[ $EUID -ne 0 ]]; then
   echo "❌ This script must be run as root or with sudo" 
   exit 1
fi

# Update system
echo "📦 Updating system packages..."
apt-get update
apt-get upgrade -y

# Install Docker
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    echo "✅ Docker installed"
else
    echo "✅ Docker already installed"
fi

# Install Docker Compose Plugin
echo "🔧 Installing Docker Compose..."
apt-get install -y docker-compose-plugin

# Add user to docker group (if not root)
if [ -n "$SUDO_USER" ]; then
    usermod -aG docker $SUDO_USER
    echo "✅ Added $SUDO_USER to docker group"
fi

# Install git if not present
if ! command -v git &> /dev/null; then
    echo "📥 Installing git..."
    apt-get install -y git
fi

# Install other useful tools
echo "🛠️ Installing utilities..."
apt-get install -y curl wget htop nano ufw

# Configure firewall
echo "🔒 Configuring firewall..."
ufw --force enable
ufw allow 22/tcp  # SSH
ufw allow 80/tcp  # HTTP
ufw allow 443/tcp # HTTPS
ufw reload
echo "✅ Firewall configured"

# Create deployment directory
DEPLOY_PATH="/opt/sportskalendar"
echo "📁 Creating deployment directory at $DEPLOY_PATH..."
mkdir -p $DEPLOY_PATH
if [ -n "$SUDO_USER" ]; then
    chown -R $SUDO_USER:$SUDO_USER $DEPLOY_PATH
fi

# Create Docker network for Traefik
echo "🌐 Creating Docker networks..."
docker network create traefik-proxy 2>/dev/null || echo "traefik-proxy network already exists"

# Setup automatic security updates
echo "🔐 Configuring automatic security updates..."
apt-get install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades

echo ""
echo "✅ Server setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Clone repository: cd $DEPLOY_PATH && git clone https://github.com/davidklouis-sketch/sportskalendar.git ."
echo "2. Configure .env.production (copy from .env.production.example)"
echo "3. Run deployment: ./scripts/deploy.sh"
echo ""
echo "⚠️  If you added user to docker group, logout and login again for it to take effect"
echo ""

