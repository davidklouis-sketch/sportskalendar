#!/bin/bash

# Database backup script for SportsKalendar
# This script creates a backup of the PostgreSQL database

set -e

# Configuration
BACKUP_DIR="/home/dl/sportskalendar/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/sportskalendar_backup_$DATE.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "🗄️ Creating database backup: $BACKUP_FILE"

# Create backup
docker compose -f /home/dl/sportskalendar/sportskalendar/docker-compose.traefik.yml --env-file /home/dl/sportskalendar/sportskalendar/.env.production exec -T postgres pg_dump -U sportskalendar sportskalendar > "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"
BACKUP_FILE="$BACKUP_FILE.gz"

echo "✅ Backup created successfully: $BACKUP_FILE"
echo "📊 Backup size: $(du -h "$BACKUP_FILE" | cut -f1)"

# Keep only the last 10 backups
echo "🧹 Cleaning up old backups..."
cd "$BACKUP_DIR"
ls -t sportskalendar_backup_*.sql.gz | tail -n +11 | xargs -r rm

echo "✅ Database backup completed successfully!"
