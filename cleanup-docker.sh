#!/bin/bash

# 🧹 Docker Cleanup Script für Sportskalendar
# Dieses Script bereinigt alle Docker-Container, Images und Volumes

echo "🧹 Starte Docker-Bereinigung für Sportskalendar..."

# Farben für bessere Lesbarkeit
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funktion für farbige Ausgabe
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 1. Alle Container stoppen
print_status "Stoppe alle Sportskalendar-Container..."
docker-compose -f docker-compose.clean.yml down 2>/dev/null || true
print_success "Container gestoppt"

# 2. Alle Container entfernen
print_status "Entferne alle Sportskalendar-Container..."
docker-compose -f docker-compose.clean.yml rm -f 2>/dev/null || true
print_success "Container entfernt"

# 3. Alle Sportskalendar-Images entfernen
print_status "Entferne alle Sportskalendar-Images..."
docker images -q sportskalendar* | xargs -r docker rmi -f 2>/dev/null || true
print_success "Images entfernt"

# 4. Docker-System bereinigen
print_status "Bereinige Docker-System..."
docker system prune -a -f
print_success "Docker-System bereinigt"

# 5. Volumes bereinigen
print_warning "Bereinige Docker-Volumes (alle Daten gehen verloren!)..."
read -p "Sind Sie sicher? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker volume prune -f
    print_success "Volumes bereinigt"
else
    print_warning "Volumes-Bereinigung übersprungen"
fi

# 6. Netzwerke bereinigen
print_status "Bereinige ungenutzte Netzwerke..."
docker network prune -f
print_success "Netzwerke bereinigt"

# 7. Status anzeigen
print_status "Aktueller Docker-Status:"
echo "--- Container ---"
docker ps -a --filter "name=sportskalendar" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo "--- Images ---"
docker images --filter "reference=sportskalendar*" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

echo "--- Volumes ---"
docker volume ls --filter "name=sportskalendar" --format "table {{.Name}}\t{{.Driver}}"

print_success "Docker-Bereinigung abgeschlossen! 🎉"
print_status "Sie können jetzt die Container neu starten:"
echo "  docker-compose -f docker-compose.clean.yml up --build -d"
