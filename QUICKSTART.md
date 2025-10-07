# SportsKalender - Quick Start Guide

Schnelleinstieg für lokale Entwicklung und Production Deployment.

## 🚀 Lokale Entwicklung (Schnellstart)

### 1. Backend starten
```bash
cd backend
npm install
npm run dev
```
Backend läuft auf: http://localhost:4000

### 2. Frontend starten (neues Terminal)
```bash
cd frontend
npm install
npm run dev
```
Frontend läuft auf: http://localhost:5173

### 3. Login
- **Demo**: `demo@sportskalender.local` / `password`
- **Admin**: `admin@sportskalender.local` / `admin123`

## 🐳 Lokale Entwicklung mit Docker + PostgreSQL

```bash
# Starte alle Services (Backend, Frontend, PostgreSQL)
docker-compose -f docker-compose.dev.yml up -d

# Logs ansehen
docker-compose -f docker-compose.dev.yml logs -f

# Stoppen
docker-compose -f docker-compose.dev.yml down
```

Services:
- Frontend: http://localhost:8080
- Backend: http://localhost:4000
- PostgreSQL: localhost:5432

## 🌐 Production Deployment

### Option 1: Automatisches Deployment via GitHub Actions

1. **Server vorbereiten** (einmalig):
```bash
# Auf dem Server als root
curl -fsSL https://raw.githubusercontent.com/davidklouis-sketch/sportskalendar/main/scripts/server-setup.sh | sudo bash
```

2. **GitHub Secrets konfigurieren** (siehe [DEPLOYMENT.md](DEPLOYMENT.md))

3. **Pushen und deployen**:
```bash
git add .
git commit -m "Deploy"
git push origin main
```

✅ Die GitHub Action deployed automatisch!

### Option 2: Manuelles Deployment

```bash
# Auf dem Server
cd /opt/sportskalendar
git clone https://github.com/davidklouis-sketch/sportskalendar.git .

# .env.production konfigurieren
cp .env.production.example .env.production
nano .env.production  # Werte anpassen!

# Deployen
./scripts/deploy.sh
```

## 🧪 Features testen

### Team hinzufügen:
1. Login
2. **Kalender** → **+ Team hinzufügen**
3. Sportart wählen (Fußball, NFL, F1)
4. Team/Fahrer auswählen
5. Hinzufügen klicken

### Premium aktivieren:
- Button **"Upgrade zu Premium"** im Kalender klicken
- Jetzt mehrere Teams möglich!

### Admin-Funktionen:
1. Als Admin einloggen (`admin@sportskalender.local`)
2. **Admin** → User-Verwaltung
3. User zu Admin befördern
4. Premium-Status toggle

### Passwort ändern:
1. **Einstellungen** (Zahnrad-Icon)
2. Passwort-Formular ausfüllen
3. Speichern

### Dark Mode:
- Mond/Sonne Icon im Header klicken

## 📦 Docker Commands

```bash
# Development
docker-compose -f docker-compose.dev.yml up -d
docker-compose -f docker-compose.dev.yml logs -f
docker-compose -f docker-compose.dev.yml down

# Production
docker-compose -f docker-compose.traefik.yml --env-file .env.production up -d
docker-compose -f docker-compose.traefik.yml logs -f
docker-compose -f docker-compose.traefik.yml down

# Nur Backend neu starten
docker-compose -f docker-compose.traefik.yml restart backend

# In Container einloggen
docker-compose -f docker-compose.traefik.yml exec backend sh
docker-compose -f docker-compose.traefik.yml exec postgres psql -U sportskalendar
```

## 🔧 Entwicklung

### Backend ändern:
1. Ändere Code in `backend/src/`
2. Backend startet automatisch neu (ts-node-dev)

### Frontend ändern:
1. Ändere Code in `frontend/src/`
2. Frontend lädt automatisch neu (Vite HMR)

### Neue Dependencies hinzufügen:
```bash
# Backend
cd backend
npm install package-name
npm install --save-dev @types/package-name

# Frontend
cd frontend
npm install package-name
```

## 📚 Weitere Dokumentation

- [DEPLOYMENT.md](DEPLOYMENT.md) - Vollständige Deployment-Anleitung
- [.github/workflows/README.md](.github/workflows/README.md) - CI/CD Pipeline Details
- [frontend/README.md](frontend/README.md) - Frontend Dokumentation
- [backend/README.md](backend/README.md) - Backend Dokumentation

## ❓ FAQ

**Q: Wie ändere ich die API URLs?**
A: Frontend: `.env` → `VITE_API_URL`, Backend: automatisch über Docker

**Q: Wie greife ich auf die Datenbank zu?**
A: `docker-compose -f docker-compose.dev.yml exec postgres psql -U sportskalendar`

**Q: Wie erstelle ich einen neuen Admin?**
A: Als Admin einloggen → Admin-Seite → User befördern

**Q: Funktioniert es ohne API-Keys?**
A: Ja! Demo-Daten werden automatisch verwendet.

**Q: Wie aktiviere ich HTTPS lokal?**
A: Verwende mkcert oder nutze Production-Setup mit Traefik

## 🆘 Hilfe

Bei Problemen:
1. Logs prüfen (`docker-compose logs`)
2. Health-Checks testen (`/api/health`)
3. GitHub Issues erstellen

## 🎉 Das war's!

Happy Coding! 🚀

