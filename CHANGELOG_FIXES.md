# Changelog - Bug Fixes & Features

## Datum: 8. Oktober 2025

### 🔧 Behobene Probleme

#### 1. ⚽ Fußball Events zeigen jetzt echte Spielnamen
**Problem:** Demo-Events zeigten "(R2)" Suffix für wiederholte Matches.
**Lösung:** Demo-Daten-Generator wurde angepasst, um nur echte Teamnamen zu zeigen.
- Datei: `backend/src/routes/calendar.ts`
- Zeile 479-484

#### 2. 👨‍💼 Adminrechte werden jetzt korrekt gespeichert
**Problem:** User verloren Adminrechte nach Token-Refresh.
**Lösung:** 
- Token-Refresh lädt jetzt aktuelle Rolle aus Datenbank
- Entfernung der zusätzlichen 15-Minuten-Prüfung in Auth-Middleware
- Dateien: 
  - `backend/src/routes/auth.ts` (Zeile 354-430)
  - `backend/src/middleware/auth.ts` (Zeile 57-58)

#### 3. 🎥 Highlights auf Startseite mit Team-Filter
**Problem:** Highlights waren auf separater Seite und zeigten nicht die ausgewählten Teams.
**Lösung:**
- Highlights jetzt direkt auf der Startseite/Calendar-Seite
- Intelligente Filterung nach ausgewählten Teams
- Zeigt nur Highlights, die den Team-Namen enthalten
- Max. 6 Highlights als Preview
- Datei: `frontend/src/components/Pages/Calendar.tsx`
- Zeilen: 155-215 (Load-Funktion), 390-460 (UI)

#### 4. 🔐 Session-Timeout Problem behoben
**Problem:** User wurden nach 5-10 Minuten ausgeloggt.
**Lösung:**
- Access Token Laufzeit von 15 Minuten auf 24 Stunden erhöht
- Cookie maxAge auf 24 Stunden angepasst
- Entfernung der zusätzlichen Token-Age-Prüfung
- Dateien:
  - `backend/src/routes/auth.ts` (Zeile 85)
  - `backend/src/middleware/auth.ts` (Zeile 57-58)

#### 5. 📅 Kalender-Sync mit ICS-Export
**Problem:** Keine Möglichkeit, Events in andere Kalender zu exportieren.
**Lösung:**
- Neue ICS-Export-Funktion implementiert
- Generiert `.ics` Datei mit allen Events der ausgewählten Teams
- Kompatibel mit Google Calendar, Outlook, Apple Calendar, etc.
- "Kalender Sync" Button auf der Startseite
- Dateien:
  - Backend: `backend/src/routes/calendar.ts` (Zeile 648-768)
  - Frontend API: `frontend/src/lib/api.ts` (Zeile 87-108)
  - UI: `frontend/src/components/Pages/Calendar.tsx` (Zeile 384-392, 477-488)

### 🎯 Verwendung der neuen Features

#### Kalender-Sync verwenden:
1. Gehe zur Startseite (Calendar)
2. Stelle sicher, dass du Teams ausgewählt hast
3. Klicke auf den blauen "Kalender Sync" Button
4. Die `.ics` Datei wird automatisch heruntergeladen
5. Importiere die Datei in deine Kalender-App:
   - **Google Calendar:** Einstellungen → Kalender importieren
   - **Outlook:** Datei → Kalender öffnen → Kalender importieren
   - **Apple Calendar:** Datei → Importieren

#### Highlights ansehen:
- Highlights erscheinen automatisch auf der Startseite
- Zeigt nur Highlights für deine ausgewählten Teams
- Klicke auf ein Highlight, um das Video zu öffnen

### 🚀 Deployment

Nach dem Deployment:
```bash
cd sportskalendar/backend
npm run build
cd ../frontend
npm run build
```

Dann Docker neu starten:
```bash
docker-compose down
docker-compose up -d --build
```

### 📝 Technische Details

**Backend Änderungen:**
- `calendar.ts`: ICS-Export-Route + Demo-Daten-Fix
- `auth.ts`: Token-Laufzeit + Rolle-Persistierung
- `middleware/auth.ts`: Token-Validierung vereinfacht

**Frontend Änderungen:**
- `Calendar.tsx`: Highlights-Integration + ICS-Export-Button
- `api.ts`: ICS-Export-Funktion

**Datenbank:**
- Keine Schema-Änderungen erforderlich
- Bestehende User-Rollen bleiben erhalten

### ✅ Testing Checklist

- [x] Fußball Events zeigen echte Spielnamen
- [x] Adminrechte bleiben nach Refresh erhalten
- [x] Highlights filtern nach Teams
- [x] Session hält 24 Stunden
- [x] ICS-Export funktioniert
- [x] TypeScript kompiliert ohne Fehler
- [x] No Linter Errors

---

**Status:** Alle Fixes implementiert und getestet ✅

