# 🏆 SportsKalender - Moderne Sport-Event-Verwaltung

Eine vollständige Web-Anwendung zur Verwaltung und Anzeige von Sport-Events mit Live-Scores, Kalender-Integration und Community-Features.

## ✨ Features

### 📅 **Interaktiver Kalender**
- **Multi-Sport-Unterstützung**: Fußball, F1, NFL Events
- **Echte API-Integration**: football-data.org, Jolpica F1 API, ESPN NFL API
- **Smart Filtering**: Nach Sportarten filtern
- **Event-Management**: Eigene Events hinzufügen
- **Reminder-System**: Erinnerungen für wichtige Events
- **Dark Mode**: Vollständige Dark/Light Mode Unterstützung

### 🏁 **Live Scoreboard**
- **Echtzeit-Daten**: Live-Scores für alle Sportarten
- **Auto-Refresh**: Automatische Aktualisierung alle 5 Sekunden
- **Fallback-System**: Robuste API-Fehlerbehandlung
- **Rate-Limiting**: Intelligentes Caching zur Vermeidung von API-Limits

### 🎯 **Community Features**
- **Event-Sharing**: Events mit der Community teilen
- **Real-time Updates**: Live-Updates über WebSocket
- **User-Management**: Registrierung und Profil-Verwaltung

### 🎨 **Moderne UI/UX**
- **Responsive Design**: Funktioniert auf allen Geräten
- **Dark Mode**: Automatische Theme-Erkennung
- **Intuitive Navigation**: Benutzerfreundliche Oberfläche
- **Performance**: Optimiert für schnelle Ladezeiten

## 🚀 Produktiver Einsatz

### **Für Sport-Websites**
- **Fan-Portale**: Integriere den Kalender in deine Vereins-Website
- **Event-Management**: Verwalte Turniere und Spiele zentral
- **Live-Updates**: Biete deinen Besuchern aktuelle Scores

### **Für Unternehmen**
- **Corporate Events**: Plane und verwalte Firmen-Sportevents
- **Team-Building**: Organisiere interne Sportaktivitäten
- **Kunden-Engagement**: Biete Sport-Content für deine Kunden

### **Für Entwickler**
- **API-Integration**: Nutze die robusten API-Adapter
- **Custom Events**: Erweitere um eigene Sportarten
- **White-Label**: Passe das Design an deine Marke an

## 🛠️ Installation & Setup

### **Voraussetzungen**
- Node.js (LTS Version)
- npm oder yarn
- Git

### **1. Repository klonen**
```bash
git clone https://github.com/davidklouis-sketch/sportskalendar.git
cd sportskalendar
```

### **2. Backend einrichten**
```bash
cd backend
npm install

# .env Datei erstellen
cp .env.example .env
# Bearbeite .env und füge deine API-Keys hinzu
```

**API-Keys konfigurieren:**
```env
PORT=4000
JWT_SECRET=your-super-secret-jwt-key-here
FOOTBALL_DATA_KEY=your-football-data-api-key-here
API_FOOTBALL_KEY=your-api-football-key-here
```

### **3. Frontend einrichten**
```bash
cd ../frontend
npm install
```

### **4. Anwendung starten**
```bash
# Backend starten (Terminal 1)
cd backend
npm run dev

# Frontend starten (Terminal 2)
cd frontend
npm run dev
```

Die Anwendung ist dann verfügbar unter:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:4000

## 🔑 API-Keys erhalten

### **Fußball-Daten (football-data.org)**
1. Besuche https://www.football-data.org/client/register
2. Registriere dich kostenlos
3. Erhalte deinen API-Key (10 Anfragen/Minute)
4. Füge den Key in die `.env` Datei ein

### **NFL-Daten (ESPN API)**
- **Kostenlos**: Keine Registrierung erforderlich
- **Zuverlässig**: Direkte ESPN-Integration
- **Aktuell**: Immer die neuesten NFL-Daten

### **F1-Daten (Jolpica API)**
- **Kostenlos**: Keine Registrierung erforderlich
- **Ergast-Nachfolger**: Moderne F1-API
- **Vollständig**: Alle F1-Events und Ergebnisse

## 📦 Deployment

### **Docker Deployment**
```bash
# Docker Compose verwenden
docker-compose up -d
```

### **Vercel/Netlify (Frontend)**
```bash
# Frontend builden
cd frontend
npm run build

# Dist-Ordner zu Vercel/Netlify deployen
```

### **Railway/Heroku (Backend)**
```bash
# Backend zu Railway/Heroku deployen
# Vergiss nicht, die Umgebungsvariablen zu setzen
```

### **VPS/Server Deployment**
```bash
# PM2 für Production verwenden
npm install -g pm2

# Backend starten
cd backend
pm2 start npm --name "sportskalendar-backend" -- run dev

# Nginx für Frontend
# Konfiguriere Nginx für statische Dateien
```

## 🔧 Konfiguration

### **Umgebungsvariablen**
```env
# Backend (.env)
PORT=4000
JWT_SECRET=your-jwt-secret
FOOTBALL_DATA_KEY=your-football-key
API_FOOTBALL_KEY=your-api-football-key

# Frontend (vite.config.ts)
VITE_API_URL=http://localhost:4000
```

### **Caching konfigurieren**
```typescript
// backend/src/routes/calendar.ts
const CACHE_MS = 5 * 60 * 1000; // 5 Minuten Cache
const FOOTBALL_CACHE_DURATION = 2 * 60 * 1000; // 2 Minuten Live-Cache
```

## 🎯 Erweiterungen

### **Neue Sportarten hinzufügen**
1. Backend: Neue API-Funktion in `calendar.ts`
2. Frontend: Sport-Filter in `Calendar.tsx` erweitern
3. Live-API: Neue Route in `live.ts` hinzufügen

### **Custom Events**
```typescript
// Eigene Event-Typen definieren
type CustomEvent = {
  id: string;
  title: string;
  sport: string;
  startsAt: string;
  customField?: string;
};
```

### **Theming anpassen**
```css
/* CSS-Variablen überschreiben */
:root {
  --primary-color: #your-color;
  --secondary-color: #your-color;
}
```

## 📊 Monitoring & Analytics

### **Performance Monitoring**
- **API-Response-Zeiten**: Überwache Backend-Performance
- **Cache-Hit-Rate**: Optimiere Caching-Strategien
- **Error-Rate**: Überwache API-Fehler

### **User Analytics**
- **Event-Interaktionen**: Welche Events sind beliebt?
- **Filter-Nutzung**: Welche Sportarten werden am meisten gefiltert?
- **Reminder-Rate**: Wie viele Benutzer setzen Reminder?

## 🔒 Sicherheit

### **API-Sicherheit**
- **Rate Limiting**: Schutz vor API-Missbrauch
- **CORS-Konfiguration**: Sichere Cross-Origin-Requests
- **JWT-Authentication**: Sichere Benutzer-Authentifizierung

### **Daten-Schutz**
- **Keine persönlichen Daten**: Nur Event-Daten werden gespeichert
- **GDPR-konform**: Minimale Datensammlung
- **Sichere API-Keys**: Umgebungsvariablen für sensible Daten

## 🤝 Contributing

1. Fork das Repository
2. Erstelle einen Feature-Branch (`git checkout -b feature/AmazingFeature`)
3. Committe deine Änderungen (`git commit -m 'Add some AmazingFeature'`)
4. Push zum Branch (`git push origin feature/AmazingFeature`)
5. Öffne eine Pull Request

## 📝 Lizenz

Dieses Projekt steht unter der MIT-Lizenz. Siehe [LICENSE](LICENSE) für Details.

## 🙏 Danksagungen

- **football-data.org** für Fußball-APIs
- **Jolpica** für F1-API (Ergast-Nachfolger)
- **ESPN** für NFL-APIs
- **React & Vite** für das Frontend-Framework
- **Express.js** für das Backend-Framework

## 📞 Support

Bei Fragen oder Problemen:
- **Issues**: Öffne ein GitHub Issue
- **Discussions**: Nutze GitHub Discussions
- **Email**: [Deine Email]

---

**Made with ❤️ for the sports community**