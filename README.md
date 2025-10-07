# SportsKalender - Moderner Sport Event Kalender

Eine moderne One-Page Web-Anwendung für Sport-Events mit Fußball, NFL und Formel 1 Integration.

![SportsKalender](Images/generated-image.png)

## ✨ Features

### 📅 Kalender
- **Team-Auswahl**: Wähle deine Lieblings-Teams oder Fahrer
  - ⚽ **Fußball**: 19 Premier League Teams, 18 Bundesliga Teams, Champions League, EM/WM
  - 🏈 **NFL**: 32 NFL Teams (alle Divisions)
  - 🏎️ **F1**: 20 aktuelle Formel 1 Fahrer
- **Event-Übersicht**: Nur Events deiner ausgewählten Teams
- **Highlights-Preview**: Top 3 aktuelle Highlights auf der Startseite
- **Smart-Filtering**: Zeigt nur relevante Events für dein Team

### 🔴 Live-Ticker
- **Echtzeit-Updates**: Live-Ergebnisse deiner Teams
- **Auto-Refresh**: Automatische Aktualisierung alle 30 Sekunden
- **Team-Filter**: Nur Daten für dein ausgewähltes Team
- **Multi-Sport**: F1, NFL und Fußball Live-Daten

### 🎬 Highlights
- **Video-Highlights**: Automatisch kuratierte YouTube-Highlights
- **Team-spezifisch**: Nur Highlights für deine Teams
- **Rich Metadata**: Thumbnails, Dauer, View-Count
- **Sport-News**: Aktuelle Nachrichten gefiltert nach Team

### 👤 Account-Features
- **Sicherer Login**: JWT-basiert mit HttpOnly Cookies
- **Passwort ändern**: In den Einstellungen
- **Premium-Account**: Mehrere Teams gleichzeitig
- **Admin-Dashboard**: User-Verwaltung (nur für Admins)

### 💎 Premium-Features
- ✅ **Mehrere Teams**: Unbegrenzt (Free: nur 1 Team)
- ✅ **Team-Filter**: Personalisierte Events und Highlights
- 🔄 **Kalender-Sync**: Export zu externen Kalendern (geplant)
- 🔔 **Push-Benachrichtigungen**: Echtzeit-Alerts (geplant)

## 🎨 Design

- **Modern & Schlicht**: Minimalistisches UI mit Tailwind CSS
- **Dark Mode**: Vollständige Dark Mode Unterstützung mit Toggle
- **Responsive**: Optimiert für Desktop, Tablet und Mobile
- **One-Page**: Flüssige Navigation ohne Page Reloads
- **Accessibility**: WCAG-konform

## 🛠 Tech Stack

### Backend
- Node.js + Express
- TypeScript
- JWT-Authentifizierung mit HttpOnly Cookies
- In-Memory Store (erweiterbar auf PostgreSQL)
- API-Integration: football-data.org, Jolpica F1 API, ESPN

### Frontend
- React 19 + TypeScript
- Tailwind CSS
- Zustand (State Management)
- Axios
- Vite

## 🚀 Quick Start

### Lokale Entwicklung

```bash
# 1. Repository klonen
git clone https://github.com/davidklouis-sketch/sportskalendar.git
cd sportskalendar

# 2. Backend starten
cd backend
npm install
npm run dev

# 3. Frontend starten (neues Terminal)
cd frontend
npm install
npm run dev
```

**Fertig!** 🎉
- Frontend: http://localhost:5173
- Backend: http://localhost:4000

### Mit Docker (inkl. PostgreSQL)

```bash
docker-compose -f docker-compose.dev.yml up -d
```

### Production Deployment

Siehe [QUICKSTART.md](QUICKSTART.md) oder [DEPLOYMENT.md](DEPLOYMENT.md)

## 👤 Demo-Accounts

### Free Account
- **Email**: `demo@sportskalender.local`
- **Passwort**: `password`
- Kann 1 Team auswählen

### Premium Account (Admin)
- **Email**: `admin@sportskalender.local`
- **Passwort**: `admin123`
- Kann unbegrenzt Teams auswählen

## 📁 Projektstruktur

```
sportskalendar/
├── backend/
│   ├── src/
│   │   ├── routes/        # API Routes (auth, calendar, live, highlights, user)
│   │   ├── middleware/    # Auth & Security Middleware
│   │   ├── store/         # In-Memory Datenbank
│   │   └── index.ts       # Server Entry Point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/      # Login & Register
│   │   │   ├── Layout/    # Header mit Navigation & Dark Mode
│   │   │   └── Pages/     # Calendar, Live, Highlights
│   │   ├── store/         # Zustand Stores
│   │   ├── lib/           # API Client
│   │   ├── App.tsx        # Haupt-App
│   │   └── main.tsx       # Entry Point
│   └── package.json
└── README.md
```

## 🔑 API-Routen

### Authentifizierung
- `POST /api/auth/register` - Neuen User registrieren
- `POST /api/auth/login` - Einloggen
- `POST /api/auth/logout` - Ausloggen
- `POST /api/auth/refresh` - Token erneuern

### User
- `GET /api/user/profile` - User-Profil mit Premium-Status und Teams
- `POST /api/user/teams` - Teams aktualisieren
- `POST /api/user/upgrade-premium` - Zu Premium upgraden (Demo)

### Kalender
- `GET /api/calendar?sport=football&leagues=39,78` - Events abrufen
- `GET /api/calendar/reminder` - Erinnerungen abrufen
- `POST /api/calendar/reminder` - Erinnerung hinzufügen

### Live
- `GET /api/live/f1` - F1 Live-Daten
- `GET /api/live/nfl` - NFL Live-Daten
- `GET /api/live/soccer` - Fußball Live-Daten

### Highlights
- `GET /api/highlights?sport=F1` - Highlights abrufen

## 🌐 API-Integrationen

### Fußball
- **football-data.org**: Premier League, Bundesliga, Champions League
- **Fallback**: Demo-Daten bei fehlenden API-Keys

### NFL
- **ESPN API**: Live-Spiele und Ergebnisse
- **TheSportsDB**: Backup-Quelle

### Formel 1
- **Jolpica API** (Ergast Replacement): Rennkalender und Ergebnisse

### Highlights
- **YouTube RSS Feeds**: Automatische Video-Highlights

## 🔒 Sicherheit

- JWT mit HttpOnly Cookies
- Secure Cookie-Flags in Production
- CORS-Konfiguration
- Rate Limiting
- Token-Blacklisting bei Logout
- Passwort-Hashing mit bcrypt (12 Rounds)

## 📱 Browser-Support

- Chrome/Edge (neueste 2 Versionen)
- Firefox (neueste 2 Versionen)
- Safari (neueste 2 Versionen)

## 🚧 Roadmap

- [x] Team-basierte Filterung (Events, Live, Highlights)
- [x] Premium-Account System
- [x] Admin-Dashboard
- [x] Passwort-Änderung
- [x] Dark Mode
- [x] Multi-Team Support
- [x] CI/CD Pipeline mit GitHub Actions
- [ ] Kalender-Export (ICS)
- [ ] Push-Benachrichtigungen
- [ ] Favoriten-System für Events
- [ ] Team-Statistiken
- [ ] Social Sharing
- [ ] Mobile App

## 📚 Dokumentation

- **[QUICKSTART.md](QUICKSTART.md)** - Schnelleinstieg für Entwicklung und Deployment
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Vollständige Production Deployment Anleitung
- **[.github/workflows/README.md](.github/workflows/README.md)** - CI/CD Pipeline Details
- **[frontend/README.md](frontend/README.md)** - Frontend-spezifische Dokumentation
- **[backend/README.md](backend/README.md)** - Backend API Dokumentation

## 🐳 Docker & CI/CD

### GitHub Actions Pipeline
- ✅ Automatische Tests bei jedem Push/PR
- ✅ Docker Images bauen und zu GHCR pushen
- ✅ Automatisches Deployment bei Push auf `main`
- ✅ Zero-Downtime Deployment

### Docker Compose Konfigurationen
- `docker-compose.dev.yml` - Lokale Entwicklung mit PostgreSQL
- `docker-compose.yml` - Einfaches Production Setup
- `docker-compose.traefik.yml` - Production mit Traefik & SSL

### Services
- **Frontend**: Nginx serving static React build
- **Backend**: Node.js Express API
- **PostgreSQL**: Datenbank (oder In-Memory für Development)
- **Traefik**: Reverse Proxy mit automatischen Let's Encrypt Zertifikaten

## 📄 Lizenz

Alle Rechte vorbehalten © 2025

## 👨‍💻 Entwickler

Entwickelt mit ❤️ von David K. Louis

## 🙏 Credits

- **Football Data**: football-data.org, API-Football
- **F1 Data**: Jolpica API (Ergast Replacement)
- **NFL Data**: ESPN API, TheSportsDB
- **Highlights**: YouTube RSS Feeds
# Force rebuild with correct API URL
