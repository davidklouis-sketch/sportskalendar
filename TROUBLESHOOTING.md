# SportsKalender Troubleshooting Guide

Häufige Probleme und ihre Lösungen.

## 🔴 Frontend zeigt 404-Fehler

### Problem
Nach dem Deployment erscheint "404 Not Found" wenn du die Seite öffnest.

### Lösung 1: Prüfe ob Frontend-Container läuft

```bash
cd /opt/sportskalendar
./scripts/check-deployment.sh
```

Wenn Frontend-Container nicht läuft:
```bash
# Logs ansehen
docker compose -f docker-compose.local.yml logs frontend

# Container neu starten
docker compose -f docker-compose.local.yml restart frontend
```

### Lösung 2: Prüfe Frontend-Build

Logge dich in den Container ein:
```bash
docker compose -f docker-compose.local.yml exec frontend sh
ls -la /usr/share/nginx/html
```

Du solltest sehen:
- `index.html`
- `assets/` Verzeichnis mit JS und CSS Dateien

Wenn Dateien fehlen:
```bash
# Rebuild Frontend
BUILD_LOCAL=true ./scripts/deploy.sh
```

### Lösung 3: Prüfe Nginx-Konfiguration

```bash
# Teste Nginx-Config
docker compose -f docker-compose.local.yml exec frontend nginx -t

# Nginx neu laden
docker compose -f docker-compose.local.yml exec frontend nginx -s reload
```

### Lösung 4: Prüfe Traefik-Routing

```bash
# Traefik Logs ansehen
docker compose -f docker-compose.local.yml logs traefik | grep frontend

# Prüfe ob Traefik den Container erkennt
docker compose -f docker-compose.local.yml logs traefik | grep "Creating middleware"
```

## 🔴 Backend API nicht erreichbar (CORS-Fehler)

### Problem
Frontend lädt, aber API-Calls schlagen fehl mit CORS-Fehlern.

### Lösung 1: CORS_ORIGIN prüfen

In `.env.production`:
```env
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
```

MUSS mit Frontend-URL übereinstimmen!

### Lösung 2: Backend neu starten

```bash
docker compose -f docker-compose.local.yml restart backend
docker compose -f docker-compose.local.yml logs -f backend
```

### Lösung 3: Traefik CORS Middleware prüfen

```bash
# Prüfe ob CORS-Headers gesetzt werden
curl -I https://api.yourdomain.com/api/health
```

## 🔴 SSL-Zertifikat wird nicht erstellt

### Problem
Traefik erstellt kein Let's Encrypt Zertifikat.

### Lösung 1: DNS prüfen

```bash
nslookup yourdomain.com
nslookup api.yourdomain.com
```

Beide müssen auf deine Server-IP zeigen!

### Lösung 2: Ports prüfen

```bash
sudo ufw status
```

Port 80 und 443 müssen offen sein:
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### Lösung 3: Traefik Logs prüfen

```bash
docker compose -f docker-compose.local.yml logs traefik | grep -i acme
docker compose -f docker-compose.local.yml logs traefik | grep -i certificate
```

### Lösung 4: acme.json Berechtigungen

```bash
# Lösche alte acme.json und lasse Traefik neu erstellen
docker compose -f docker-compose.local.yml down
docker volume rm sportskalendar_traefik_letsencrypt
docker compose -f docker-compose.local.yml up -d
```

## 🔴 PostgreSQL Verbindungsfehler

### Problem
Backend startet mit "In-Memory Only" statt PostgreSQL.

### Lösung 1: PostgreSQL läuft?

```bash
docker compose -f docker-compose.local.yml ps postgres
```

### Lösung 2: Health Check

```bash
docker compose -f docker-compose.local.yml exec postgres pg_isready -U sportskalendar
```

### Lösung 3: Connection String prüfen

In `.env.production`:
```env
DB_HOST=postgres
DB_PASSWORD=your_password_here
```

Backend Logs prüfen:
```bash
docker compose -f docker-compose.local.yml logs backend | grep -i database
```

## 🔴 "Permission denied" beim Deployment

### Lösung

```bash
# User zur Docker-Gruppe hinzufügen
sudo usermod -aG docker $USER

# Logout und wieder einloggen
exit
# SSH neu verbinden

# Deployment-Verzeichnis Permissions
sudo chown -R $USER:$USER /opt/sportskalendar
```

## 🔴 Port bereits belegt

### Problem
"port is already allocated" Fehler

### Lösung

```bash
# Prüfe welcher Prozess Port 80/443 nutzt
sudo lsof -i :80
sudo lsof -i :443

# Stoppe alte Services
docker compose -f docker-compose.local.yml down

# Wenn andere Services laufen (z.B. Apache)
sudo systemctl stop apache2
sudo systemctl disable apache2
```

## 🔴 Build-Fehler: "npm ci failed"

### Lösung

```bash
# Lokale node_modules löschen
rm -rf frontend/node_modules backend/node_modules
rm -rf frontend/package-lock.json backend/package-lock.json

# Neu builden
BUILD_LOCAL=true ./scripts/deploy.sh
```

## 🔴 Container starten nicht (Exit Code 1)

### Lösung

```bash
# Detaillierte Logs ansehen
docker compose -f docker-compose.local.yml logs --tail=100

# Einzelne Container starten für Debugging
docker compose -f docker-compose.local.yml up backend
# Strg+C zum Stoppen

# Wenn JWT_SECRET fehlt:
nano .env.production  # JWT_SECRET setzen (mindestens 32 Zeichen)
```

## 🔴 Frontend zeigt weiße Seite

### Lösung 1: Browser-Konsole prüfen

Öffne Browser DevTools (F12) → Console Tab

Typische Fehler:
- **"Failed to fetch"**: Backend nicht erreichbar → CORS/Network Problem
- **"Unexpected token <"**: JavaScript-Dateien nicht gefunden → Build Problem

### Lösung 2: Rebuild Frontend

```bash
# Stoppe Services
docker compose -f docker-compose.local.yml down

# Lösche Frontend-Image
docker rmi sportskalendar-frontend:latest

# Neu builden
BUILD_LOCAL=true ./scripts/deploy.sh
```

## 🛠️ Allgemeine Debug-Befehle

```bash
# Alle Logs live ansehen
docker compose -f docker-compose.local.yml logs -f

# In Container einloggen
docker compose -f docker-compose.local.yml exec backend sh
docker compose -f docker-compose.local.yml exec frontend sh
docker compose -f docker-compose.local.yml exec postgres psql -U sportskalendar

# Services neu starten
docker compose -f docker-compose.local.yml restart

# Alle Container stoppen und neu starten
docker compose -f docker-compose.local.yml down
BUILD_LOCAL=true ./scripts/deploy.sh

# Disk Space prüfen
df -h
docker system df

# Images aufräumen
docker system prune -a
```

## 📞 Weitere Hilfe

1. **Deployment Check ausführen**: `./scripts/check-deployment.sh`
2. **Logs sammeln**: `docker compose -f docker-compose.local.yml logs > debug.log`
3. **GitHub Issue erstellen** mit den Logs

