# GitHub Actions CI/CD Pipeline

Diese Pipeline baut, testet und deployed automatisch die SportsKalender-Anwendung.

## Setup

### 1. GitHub Secrets einrichten

Gehe zu: `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

#### Erforderliche Secrets:

**Server-Zugriff:**
- `SSH_HOST`: Server IP oder Hostname (z.B. `yourserver.com`)
- `SSH_USER`: SSH Username (z.B. `root` oder `ubuntu`)
- `SSH_PRIVATE_KEY`: SSH Private Key (kompletter Inhalt der `~/.ssh/id_rsa` Datei)
- `SSH_PORT`: SSH Port (optional, default: 22)
- `DEPLOY_PATH`: Deployment-Pfad auf dem Server (z.B. `/opt/sportskalendar`)

**Anwendungs-Secrets:**
- `JWT_SECRET`: Sicherer JWT Secret (mindestens 32 Zeichen)
- `DB_PASSWORD`: PostgreSQL Passwort (sicher und komplex)

**Domains (für SSL-Zertifikate):**
- `BACKEND_HOST`: Backend Domain (z.B. `api.yourdomain.com`) - **WICHTIG für SSL-Zertifikate!**
- `FRONTEND_HOST`: Frontend Domain (z.B. `yourdomain.com`) - **WICHTIG für SSL-Zertifikate!**
- `LETSENCRYPT_EMAIL`: Email für Let's Encrypt Zertifikate
- `CORS_ORIGIN`: CORS Origins komma-separiert (z.B. `https://yourdomain.com,https://www.yourdomain.com`)

**API Keys (Optional):**
- `FOOTBALL_DATA_KEY`: API Key von football-data.org
- `API_FOOTBALL_KEY`: API Key von api-football
- `NEWS_API_KEY`: News API Key

### 2. Server vorbereiten

Auf dem Deployment-Server:

```bash
# Docker installieren
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Docker Compose installieren
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Deployment-Verzeichnis erstellen
sudo mkdir -p /opt/sportskalendar
sudo chown $USER:$USER /opt/sportskalendar
cd /opt/sportskalendar

# Repository klonen
git clone https://github.com/davidklouis-sketch/sportskalendar.git .

# Traefik Netzwerk erstellen
docker network create traefik-proxy

# Daten-Verzeichnisse erstellen
mkdir -p backend/data
chmod 755 backend/data
```

### 3. DNS konfigurieren

Erstelle A-Records für:
- `yourdomain.com` → Server IP
- `api.yourdomain.com` → Server IP

### 4. Deployment starten

Die Pipeline deployed automatisch bei Push auf `main`:

```bash
git add .
git commit -m "Initial deployment"
git push origin main
```

## Pipeline-Ablauf

### 1. **Test Phase** (bei jedem Push/PR)
- Backend TypeScript Compilation
- Frontend TypeScript Compilation
- Linting (falls konfiguriert)

### 2. **Build Phase** (nur bei Push auf main)
- Docker Images bauen (Backend & Frontend)
- Images zu GitHub Container Registry pushen
- Tags: `latest`, `main-<sha>`, `main`

### 3. **Deploy Phase** (nur bei Push auf main)
- SSH-Verbindung zum Server
- Git Pull (neuester Code)
- Docker Images pullen
- Services neu starten mit Docker Compose
- Alte Images aufräumen

## Manuelles Deployment

Auf dem Server:

```bash
cd /opt/sportskalendar

# Images pullen
docker-compose -f docker-compose.traefik.yml --env-file .env.production pull

# Services starten
docker-compose -f docker-compose.traefik.yml --env-file .env.production up -d

# Logs ansehen
docker-compose -f docker-compose.traefik.yml logs -f

# Status prüfen
docker-compose -f docker-compose.traefik.yml ps
```

## Rollback

```bash
cd /opt/sportskalendar

# Zu vorheriger Version
git checkout <commit-hash>

# Images mit spezifischem Tag pullen
export BACKEND_IMAGE=ghcr.io/your-username/sportskalendar/backend:main-<sha>
export FRONTEND_IMAGE=ghcr.io/your-username/sportskalendar/frontend:main-<sha>

docker-compose -f docker-compose.traefik.yml --env-file .env.production up -d
```

## Services

Nach dem Deployment sind verfügbar:

- **Frontend**: https://yourdomain.com
- **Backend API**: https://api.yourdomain.com/api
- **Traefik Dashboard**: Kann über separate Config aktiviert werden

## Monitoring

```bash
# Logs ansehen
docker-compose -f docker-compose.traefik.yml logs -f backend
docker-compose -f docker-compose.traefik.yml logs -f frontend
docker-compose -f docker-compose.traefik.yml logs -f postgres

# Service-Status
docker-compose -f docker-compose.traefik.yml ps

# Ressourcen-Nutzung
docker stats
```

## Troubleshooting

### Backend startet nicht
```bash
docker-compose -f docker-compose.traefik.yml logs backend
# Prüfe JWT_SECRET und DB_PASSWORD in .env.production
```

### SSL-Zertifikat-Fehler
```bash
docker-compose -f docker-compose.traefik.yml logs traefik
# Prüfe DNS-Einträge und LETSENCRYPT_EMAIL
```

### Datenbank-Verbindung
```bash
docker-compose -f docker-compose.traefik.yml exec postgres psql -U sportskalendar -d sportskalendar
```

