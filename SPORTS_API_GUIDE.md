# 🏀 Sport-APIs Integration Guide

## 📊 Aktuelle Sportarten
- ⚽ **Fußball** (API-Football, Football-Data.org)
- 🏈 **NFL** (ESPN API)
- 🏎️ **Formel 1** (Ergast API)

## 🎯 Neue Sportarten - Kostenlose APIs

### 1. 🏀 **Basketball (NBA)**

#### **Option A: TheSportsDB** ⭐ **EMPFOHLEN**
- **URL:** https://www.thesportsdb.com/api.php
- **Kosten:** Komplett kostenlos (Community Edition)
- **Limit:** Unbegrenzt für Open Data
- **API Key:** NICHT erforderlich für Test-Daten
- **Patreon Support:** $3/Monat für volle Features

**Endpoints:**
```
# Teams
GET https://www.thesportsdb.com/api/v1/json/3/search_all_teams.php?l=NBA

# Spiele
GET https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?id=4387&s=2024-2025

# Live Scores (Patreon)
GET https://www.thesportsdb.com/api/v2/json/APIKEY/livescore.php?l=NBA
```

**ENV Variable:**
```bash
THESPORTSDB_API_KEY=3  # Free Test Key
# Oder nach Patreon Support:
THESPORTSDB_API_KEY=your_patreon_api_key
```

#### **Option B: API-SPORTS (Basketball)**
- **URL:** https://api-sports.io/documentation/basketball/v1
- **Kosten:** Kostenlos (100 Anfragen/Tag)
- **Limit:** 100 requests/day
- **Registrierung:** https://dashboard.api-football.com/register

**ENV Variable:**
```bash
API_BASKETBALL_KEY=your_api_basketball_key
```

---

### 2. 🎾 **Tennis**

#### **TheSportsDB** ⭐ **EMPFOHLEN**
- **Ligen:** ATP Tour, WTA Tour, Grand Slams
- **Kostenlos:** Ja

**Endpoints:**
```
# ATP Tour
GET https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?id=4420&s=2024

# Grand Slam Events
GET https://www.thesportsdb.com/api/v1/json/3/searchevents.php?e=Wimbledon
```

#### **API-SPORTS (Tennis)**
- **URL:** https://api-sports.io/documentation/tennis/v1
- **Limit:** 100 requests/day

**ENV Variable:**
```bash
API_TENNIS_KEY=your_api_tennis_key
```

---

### 3. 🏒 **Eishockey (NHL)**

#### **TheSportsDB** ⭐ **EMPFOHLEN**
**Endpoints:**
```
# NHL Teams
GET https://www.thesportsdb.com/api/v1/json/3/search_all_teams.php?l=NHL

# NHL Spiele
GET https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?id=4380&s=2024-2025
```

#### **NHL Stats API** (Offiziell)
- **URL:** https://api-web.nhle.com/v1/
- **Kosten:** Kostenlos
- **Limit:** Keine offiziellen Limits
- **Dokumentation:** Community-maintained

**Endpoints:**
```
# Schedule
GET https://api-web.nhle.com/v1/schedule/{date}

# Standings
GET https://api-web.nhle.com/v1/standings/{date}

# Team Stats
GET https://api-web.nhle.com/v1/club-stats/{teamAbbrev}/now
```

**ENV Variable:**
```bash
# Kein API Key erforderlich
NHL_API_URL=https://api-web.nhle.com/v1
```

---

### 4. ⚾ **Baseball (MLB)**

#### **TheSportsDB**
**Endpoints:**
```
# MLB Teams
GET https://www.thesportsdb.com/api/v1/json/3/search_all_teams.php?l=MLB

# MLB Spiele
GET https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?id=4424&s=2024
```

#### **MLB Stats API** (Offiziell)
- **URL:** https://statsapi.mlb.com/api/v1/
- **Kosten:** Kostenlos
- **Limit:** Fair Use Policy
- **Dokumentation:** https://github.com/jasonlttl/gameday-api-docs

**Endpoints:**
```
# Schedule
GET https://statsapi.mlb.com/api/v1/schedule?sportId=1&date={date}

# Teams
GET https://statsapi.mlb.com/api/v1/teams?sportId=1
```

**ENV Variable:**
```bash
# Kein API Key erforderlich
MLB_API_URL=https://statsapi.mlb.com/api/v1
```

---

### 5. 🏏 **Cricket**

#### **TheSportsDB**
**Endpoints:**
```
# Cricket Leagues
GET https://www.thesportsdb.com/api/v1/json/3/search_all_leagues.php?s=Cricket

# Events
GET https://www.thesportsdb.com/api/v1/json/3/searchevents.php?e=IPL
```

#### **CricAPI**
- **URL:** https://cricapi.com/
- **Kosten:** Kostenlos (100 Anfragen/Tag)
- **Registrierung:** Erforderlich

**ENV Variable:**
```bash
CRICAPI_KEY=your_cricapi_key
```

---

### 6. 🏉 **Rugby**

#### **TheSportsDB**
**Endpoints:**
```
# Rugby Leagues
GET https://www.thesportsdb.com/api/v1/json/3/search_all_leagues.php?s=Rugby

# Events
GET https://www.thesportsdb.com/api/v1/json/3/searchevents.php?e=Six%20Nations
```

---

## 🔑 Empfohlene ENV-Variablen für `backend/env.example`

```bash
# Sport APIs
# TheSportsDB (Haupt-API für alle Sportarten)
THESPORTSDB_API_KEY=3  # Free Test Key (oder Patreon Key)

# API-SPORTS (Optional, für mehr Features)
API_BASKETBALL_KEY=your_api_basketball_key
API_TENNIS_KEY=your_api_tennis_key
API_HOCKEY_KEY=your_api_hockey_key
API_BASEBALL_KEY=your_api_baseball_key

# Offizielle APIs (kein Key erforderlich)
NHL_API_URL=https://api-web.nhle.com/v1
MLB_API_URL=https://statsapi.mlb.com/api/v1

# Cricket
CRICAPI_KEY=your_cricapi_key
```

---

## 📦 Implementierungs-Strategie

### Phase 1: TheSportsDB Integration ⭐
**Vorteile:**
- ✅ Eine API für ALLE Sportarten
- ✅ Komplett kostenlos (Test Key: `3`)
- ✅ Keine Registrierung erforderlich
- ✅ Konsistente Datenstruktur
- ✅ Community Support

**Sportarten mit TheSportsDB:**
1. Basketball (NBA)
2. Tennis (ATP, WTA)
3. Eishockey (NHL)
4. Baseball (MLB)
5. Cricket (IPL, etc.)
6. Rugby

### Phase 2: Offizielle APIs für bessere Daten
- NHL Stats API (kostenlos, kein Key)
- MLB Stats API (kostenlos, kein Key)
- ESPN API (für NFL bereits integriert)

### Phase 3: Premium Features (Optional)
- TheSportsDB Patreon ($3/Monat) für Live Scores
- API-SPORTS für mehr Details

---

## 🎨 Frontend: Neue Sportarten

### Sport-Icons benötigt:
- 🏀 Basketball
- 🎾 Tennis
- 🏒 Eishockey
- ⚾ Baseball
- 🏏 Cricket
- 🏉 Rugby

### Team-Logos:
TheSportsDB bietet auch Team-Logos:
```
https://www.thesportsdb.com/images/media/team/badge/{teamID}.png
```

---

## 🚀 Next Steps

1. ✅ **TheSportsDB Test Key verwenden** (`3`)
2. **Backend Routes erstellen** für neue Sportarten
3. **Frontend Team-Auswahl erweitern**
4. **Kalender-Integration** für neue Sportarten
5. **Live-Scores** hinzufügen (optional mit Patreon)

---

## 📚 Dokumentations-Links

- **TheSportsDB:** https://www.thesportsdb.com/api.php
- **API-SPORTS:** https://api-sports.io/
- **NHL API:** https://gitlab.com/dword4/nhlapi
- **MLB API:** https://github.com/jasonlttl/gameday-api-docs
- **Sports APIs Collection:** https://github.com/hkailahi/sports-data-public-apis

---

## 💡 Tipp

**Am besten starten mit TheSportsDB!**
- Kein Account erforderlich
- Eine API für alle Sportarten
- Test Key: `3`
- Bei Erfolg: Patreon Support für $3/Monat

Das gibt dir Zugriff auf **über 80 Sportarten** mit einer einzigen API! 🎉

