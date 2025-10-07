# SportsKalender Deployment Guide

Vollständige Anleitung für das Deployment mit Docker, PostgreSQL, Traefik und GitHub Actions.

## 🎯 Übersicht

Die Anwendung verwendet:
- **Docker** für Containerisierung
- **PostgreSQL** als Datenbank
- **Traefik** als Reverse Proxy mit automatischen SSL-Zertifikaten
- **GitHub Actions** für CI/CD

## 📋 Voraussetzungen

- Ubuntu/Debian Server (20.04 oder neuer empfohlen)
- Domain mit konfigurierten DNS A-Records
- SSH-Zugriff zum Server
- GitHub Account

## 🚀 Setup - Schritt für Schritt

### 1. Server vorbereiten

Führe auf dem Server aus:

```bash
# Als root oder mit sudo
sudo bash

# Lade und führe Setup-Skript aus
curl -fsSL https://raw.githubusercontent.com/davidklouis-sketch/sportskalendar/main/scripts/server-setup.sh | bash
```

Oder manuell:

```bash
# Script herunterladen
git clone https://github.com/davidklouis-sketch/sportskalendar.git /tmp/sportskalendar
cd /tmp/sportskalendar

# Setup ausführen
sudo ./scripts/server-setup.sh
```

### 2. Repository klonen

```bash
cd /opt/sportskalendar
git clone https://github.com/davidklouis-sketch/sportskalendar.git .
```

### 3. Environment konfigurieren

```bash
# .env.production erstellen
cp .env.production.example .env.production
nano .env.production
```

**Wichtige Werte ändern:**
```env
# Security - MUST CHANGE!
JWT_SECRET=IhrSuperSicheresSecret32ZeichenMindestens123456
DB_PASSWORD=IhrSicheresDatenbankPasswort123!

# Domains
BACKEND_HOST=api.yourdomain.com
FRONTEND_HOST=yourdomain.com
LETSENCRYPT_EMAIL=your@email.com

# CORS
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com

# API Keys (optional)
FOOTBALL_DATA_KEY=your_key_here
```

### 4. DNS konfigurieren

Erstelle A-Records bei deinem DNS-Provider:

```
yourdomain.com       → SERVER_IP
api.yourdomain.com   → SERVER_IP
www.yourdomain.com   → SERVER_IP (optional)
```

Warte bis DNS propagiert ist (kann bis zu 24h dauern, meist aber nur wenige Minuten).

### 5. GitHub Secrets konfigurieren

Gehe zu: `Repository` → `Settings` → `Secrets and variables` → `Actions`

**Server-Zugriff:**
```
SSH_HOST          = yourserver.com
SSH_USER          = root (oder ubuntu)
SSH_PRIVATE_KEY   = [Inhalt von ~/.ssh/id_rsa]
SSH_PORT          = 22
DEPLOY_PATH       = /opt/sportskalendar
```

**Anwendung:**
```
JWT_SECRET           = [Gleicher Wert wie in .env.production]
DB_PASSWORD          = [Gleicher Wert wie in .env.production]
BACKEND_HOST         = api.yourdomain.com
FRONTEND_HOST        = yourdomain.com
LETSENCRYPT_EMAIL    = your@email.com
CORS_ORIGIN          = https://yourdomain.com
```

**Optional:**
```
FOOTBALL_DATA_KEY    = your_api_key
API_FOOTBALL_KEY     = your_api_key
NEWS_API_KEY         = your_api_key
```

### 6. Deployment

#### Automatisch via GitHub Actions:
```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

Die Pipeline führt automatisch aus:
1. ✅ Tests (TypeScript Compilation)
2. 🐳 Docker Images bauen
3. 📦 Images zu GitHub Container Registry pushen
4. 🚀 Deployment auf den Server

#### Manuell auf dem Server:
```bash
cd /opt/sportskalendar
./scripts/deploy.sh
```

## 🔍 Überprüfung

### Services prüfen:
```bash
cd /opt/sportskalendar
docker-compose -f docker-compose.traefik.yml ps
```

### Logs ansehen:
```bash
# Alle Services
docker-compose -f docker-compose.traefik.yml logs -f

# Nur Backend
docker-compose -f docker-compose.traefik.yml logs -f backend

# Nur Frontend
docker-compose -f docker-compose.traefik.yml logs -f frontend

# Nur Traefik
docker-compose -f docker-compose.traefik.yml logs -f traefik

# Nur PostgreSQL
docker-compose -f docker-compose.traefik.yml logs -f postgres
```

### Health Checks:
```bash
# Backend Health
curl https://api.yourdomain.com/api/health

# Frontend
curl https://yourdomain.com

# PostgreSQL
docker-compose -f docker-compose.traefik.yml exec postgres psql -U sportskalendar -d sportskalendar -c "SELECT version();"
```

## 🔄 Updates

### Automatisch:
Pushe einfach auf main:
```bash
git add .
git commit -m "Update xyz"
git push origin main
```

### Manuell:
```bash
cd /opt/sportskalendar
git pull origin main
./scripts/deploy.sh
```

## 🛠️ Wartung

### Datenbank-Backup:
```bash
# Backup erstellen
docker-compose -f docker-compose.traefik.yml exec postgres pg_dump -U sportskalendar sportskalendar > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup wiederherstellen
cat backup_20250107_120000.sql | docker-compose -f docker-compose.traefik.yml exec -T postgres psql -U sportskalendar -d sportskalendar
```

### Logs bereinigen:
```bash
# Docker logs bereinigen
docker system prune -a --volumes -f
```

### SSL-Zertifikat erneuern:
```bash
# Traefik erneuert automatisch, aber manuell forcieren:
docker-compose -f docker-compose.traefik.yml restart traefik
```

## 🔒 Sicherheit

### Empfohlene Einstellungen:

1. **Firewall aktiviert** (UFW)
2. **SSH Key-based Authentication** (kein Password)
3. **Fail2ban** installieren:
```bash
sudo apt-get install fail2ban
sudo systemctl enable fail2ban
```

4. **Automatische Updates** aktiviert
5. **Starke Passwörter** für JWT_SECRET und DB_PASSWORD

### Secrets rotieren:
```bash
# Neues JWT_SECRET generieren
openssl rand -base64 32

# In .env.production aktualisieren
nano .env.production

# Services neu starten
docker-compose -f docker-compose.traefik.yml restart backend
```

## 🐛 Troubleshooting

### Problem: Services starten nicht
```bash
# Logs prüfen
docker-compose -f docker-compose.traefik.yml logs

# Services neu starten
docker-compose -f docker-compose.traefik.yml down
docker-compose -f docker-compose.traefik.yml up -d
```

### Problem: SSL-Zertifikat nicht erstellt
- DNS korrekt konfiguriert? (nslookup yourdomain.com)
- Port 80 und 443 offen? (ufw status)
- Traefik Logs prüfen: `docker-compose -f docker-compose.traefik.yml logs traefik`

### Problem: Backend kann nicht auf DB zugreifen
```bash
# DB-Container läuft?
docker-compose -f docker-compose.traefik.yml ps postgres

# DB erreichbar?
docker-compose -f docker-compose.traefik.yml exec backend ping postgres

# DB-Logs prüfen
docker-compose -f docker-compose.traefik.yml logs postgres
```

### Problem: CORS-Fehler
- CORS_ORIGIN in .env.production korrekt?
- Backend-Logs prüfen für CORS-Meldungen

## 📊 Monitoring

### Ressourcen überwachen:
```bash
# Container-Ressourcen
docker stats

# Disk Space
df -h

# Memory
free -h
```

### Uptime prüfen:
```bash
docker-compose -f docker-compose.traefik.yml ps
```

## 🔄 Rollback

```bash
cd /opt/sportskalendar

# Zu vorherigem Commit
git log  # Finde Commit-Hash
git checkout <commit-hash>

# Services neu starten
./scripts/deploy.sh
```

## 📞 Support

Bei Problemen:
1. Logs prüfen
2. GitHub Issues erstellen
3. Dokumentation lesen

## 🎉 Fertig!

Nach erfolgreichem Deployment:
- **Frontend**: https://yourdomain.com
- **Backend API**: https://api.yourdomain.com/api
- **Health Check**: https://api.yourdomain.com/api/health

Demo-Login:
- Email: `demo@sportskalender.local`
- Passwort: `password`

Admin-Login:
- Email: `admin@sportskalender.local`
- Passwort: `admin123`

**⚠️ Ändere die Admin-Passwörter in Production!**

