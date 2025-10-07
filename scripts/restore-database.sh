#!/bin/bash

# Database restore script for SportsKalendar
# This script restores the PostgreSQL database from a backup

set -e

# Configuration
BACKUP_DIR="/home/dl/sportskalendar/backups"

if [ $# -eq 0 ]; then
    echo "Usage: $0 <backup_file>"
    echo "Available backups:"
    ls -la "$BACKUP_DIR"/sportskalendar_backup_*.sql.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "🔄 Restoring database from: $BACKUP_FILE"

# Check if backup is compressed
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "📦 Decompressing backup..."
    gunzip -c "$BACKUP_FILE" | docker compose -f /home/dl/sportskalendar/sportskalendar/docker-compose.traefik.yml --env-file /home/dl/sportskalendar/sportskalendar/.env.production exec -T postgres psql -U sportskalendar -d sportskalendar
else
    echo "📄 Restoring uncompressed backup..."
    docker compose -f /home/dl/sportskalendar/sportskalendar/docker-compose.traefik.yml --env-file /home/dl/sportskalendar/sportskalendar/.env.production exec -T postgres psql -U sportskalendar -d sportskalendar < "$BACKUP_FILE"
fi

echo "✅ Database restored successfully!"

# Verify restoration
echo "🔍 Verifying restoration..."
USER_COUNT=$(docker compose -f /home/dl/sportskalendar/sportskalendar/docker-compose.traefik.yml --env-file /home/dl/sportskalendar/sportskalendar/.env.production exec -T postgres psql -U sportskalendar -d sportskalendar -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' \n' || echo "0")
echo "📊 Users in database: $USER_COUNT"
