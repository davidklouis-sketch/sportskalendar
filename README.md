# SportsKalender

## Voraussetzungen
- Node.js (LTS) – bereits per nvm installiert

## Start (Entwicklung)

### Backend
```bash
cd backend
npm install
# optional: .env mit PORT und JWT_SECRET erstellen
npm run dev
```
Backend: http://localhost:4000

Demo-Login: email `demo@sportskalender.local`, password `password`

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend: URL aus der Konsole (Vite). Standard: http://localhost:5173

Um die API-URL zu setzen, nutze `.env` in `frontend`:
```
VITE_API_URL=http://localhost:4000/api
```

## Features
- Login/Registrierung (JWT)
- Top-Navigation: Sportarten, Community, Statistik
- Header Scoreboard mit Live-Scores
- Live-Stats-Ticker (SSE)
- Highlights-Teaser
- Interaktiver Kalender mit Reminder
- Community-Stream
- Footer: Partner, Datenschutz, Impressum, FAQ

