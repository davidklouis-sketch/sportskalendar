# SportsKalender Frontend

Modernes One-Page Frontend für den SportsKalender mit React, TypeScript und Tailwind CSS.

## Features

### ✨ Hauptfunktionen
- **Kalender**: Übersicht über kommende Sportevents (Fußball, NFL, F1)
- **Live**: Echtzeit-Anzeige aktueller Spiele und Rennen
- **Highlights**: Video-Highlights und News zu ausgewählten Teams

### 🎨 Design
- Modernes, schlichtes UI mit Tailwind CSS
- Dark Mode Unterstützung
- Responsive Design für Mobile, Tablet und Desktop
- One-Page Application mit clientseitiger Navigation

### 👤 Benutzer-Features
- Sichere Authentifizierung (Login/Register)
- Team-Auswahl (1 Team gratis, mehrere mit Premium)
- Premium-Account für erweiterte Features

### 🔒 Sicherheit
- JWT-basierte Authentifizierung
- HttpOnly Cookies
- Sichere API-Kommunikation
- Token-Refresh-Mechanismus

## Tech Stack

- **React 19** - UI Framework
- **TypeScript** - Type Safety
- **Tailwind CSS** - Styling
- **Zustand** - State Management
- **Axios** - HTTP Client
- **date-fns** - Date Formatting
- **Vite** - Build Tool

## Projektstruktur

```
src/
├── components/
│   ├── Auth/          # Login & Register Komponenten
│   ├── Layout/        # Header & Footer
│   └── Pages/         # Hauptseiten (Calendar, Live, Highlights)
├── store/             # Zustand Stores (Auth, Theme)
├── lib/               # API Client
├── App.tsx            # Haupt-App Komponente
├── main.tsx           # Entry Point
└── index.css          # Tailwind CSS
```

## Installation & Start

```bash
# Dependencies installieren
npm install

# Development Server starten
npm run dev

# Production Build
npm run build

# Preview Production Build
npm run preview
```

## Umgebungsvariablen

Erstelle eine `.env` Datei im Frontend-Verzeichnis:

```env
VITE_API_URL=http://localhost:4000/api
```

## Development

Der Development Server läuft standardmäßig auf `http://localhost:5173`.

Das Backend muss auf Port 4000 laufen (`http://localhost:4000`).

## Benutzerkonten

### Demo-Account (Free)
- Email: `demo@sportskalender.local`
- Passwort: `password`

### Admin-Account
- Email: `admin@sportskalender.local`
- Passwort: `admin123`

## Premium-Features

- **Mehrere Teams**: Free-Nutzer können nur 1 Team auswählen, Premium unbegrenzt
- **Kalender-Sync**: Export zu externen Kalendern (geplant)
- **Push-Benachrichtigungen**: Echtzeit-Benachrichtigungen (geplant)

## Browser-Support

- Chrome/Edge (neueste 2 Versionen)
- Firefox (neueste 2 Versionen)
- Safari (neueste 2 Versionen)

## Lizenz

Alle Rechte vorbehalten © 2025
