# Quick Deployment Fix - Images nicht im Registry

Wenn die Docker Images noch nicht im GitHub Container Registry (GHCR) verfügbar sind, nutze **lokale Builds**.

## Option 1: Lokale Builds (Empfohlen für ersten Deployment)

### Auf dem Server:

```bash
cd /opt/sportskalendar

# .env.production konfigurieren
cp .env.production.example .env.production
nano .env.production

# Mit lokalen Builds deployen
BUILD_LOCAL=true ./scripts/deploy.sh
```

Das Script baut die Images jetzt lokal auf dem Server statt sie von GHCR zu pullen.

## Option 2: GitHub Actions Pipeline triggern

### Voraussetzung: GitHub Secrets müssen konfiguriert sein

1. **Dummy-Commit** um die Pipeline zu triggern:
```bash
git commit --allow-empty -m "Trigger CI/CD pipeline"
git push origin main
```

2. **GitHub Actions prüfen:**
   - Öffne: https://github.com/davidklouis-sketch/sportskalendar/actions
   - Warte bis **build-and-push** abgeschlossen ist
   - Images sind dann in GHCR verfügbar

3. **Erneut deployen:**
```bash
cd /opt/sportskalendar
./scripts/deploy.sh  # Ohne BUILD_LOCAL
```

## Option 3: Images manuell bauen und taggen

```bash
cd /opt/sportskalendar

# Backend bauen
docker build -t ghcr.io/davidklouis-sketch/sportskalendar/backend:latest backend/

# Frontend bauen
docker build -t ghcr.io/davidklouis-sketch/sportskalendar/frontend:latest \
  --build-arg VITE_API_URL=https://api.yourdomain.com/api frontend/

# Deployen
./scripts/deploy.sh
```

## Empfehlung

Für den **ersten Deployment**: Nutze **Option 1** (BUILD_LOCAL=true)

Nach erfolgreichem ersten Deployment und wenn GitHub Actions konfiguriert sind: Nutze **Option 2** (automatische Pipeline)

## Fehler beheben

### "command not found: docker compose"

Alte Docker-Version! Installiere Docker Compose Plugin:
```bash
sudo apt-get update
sudo apt-get install docker-compose-plugin
```

### "Permission denied"

```bash
sudo usermod -aG docker $USER
# Logout und wieder einloggen
```

### Logs ansehen

```bash
# Mit lokalen Builds
docker compose -f docker-compose.local.yml logs -f

# Mit Registry-Images
docker compose -f docker-compose.traefik.yml logs -f
```

