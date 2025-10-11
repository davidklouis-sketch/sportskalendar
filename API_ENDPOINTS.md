# 🔌 API Endpoints Dokumentation

## 🏀 Sports API (TheSportsDB)

Base URL: `/api/sports`

### Basketball (NBA)

#### Get all NBA teams
```http
GET /api/sports/nba/teams
```

**Response:**
```json
{
  "success": true,
  "teams": [
    {
      "id": "134878",
      "name": "Boston Celtics",
      "shortName": "Celtics",
      "badge": "https://www.thesportsdb.com/images/media/team/badge/...",
      "logo": "https://www.thesportsdb.com/images/media/team/logo/...",
      "stadium": "TD Garden"
    }
  ]
}
```

#### Get NBA schedule/events
```http
GET /api/sports/nba/events?season=2024-2025
```

**Query Parameters:**
- `season` (optional): Season year, default: `2024-2025`

**Response:**
```json
{
  "success": true,
  "events": [
    {
      "id": "1234567",
      "name": "Boston Celtics vs Los Angeles Lakers",
      "homeTeam": "Boston Celtics",
      "awayTeam": "Los Angeles Lakers",
      "homeTeamId": "134878",
      "awayTeamId": "134900",
      "homeScore": "110",
      "awayScore": "105",
      "status": "Match Finished",
      "date": "2024-10-15",
      "time": "19:30:00",
      "timestamp": "2024-10-15T19:30:00Z",
      "venue": "TD Garden"
    }
  ],
  "season": "2024-2025"
}
```

#### Get next games for a specific NBA team
```http
GET /api/sports/nba/teams/:teamId/next
```

**Parameters:**
- `teamId`: TheSportsDB team ID

**Response:**
```json
{
  "success": true,
  "events": [
    {
      "id": "1234567",
      "name": "Boston Celtics vs Miami Heat",
      "homeTeam": "Boston Celtics",
      "awayTeam": "Miami Heat",
      "date": "2024-10-20",
      "time": "19:30:00",
      "venue": "TD Garden"
    }
  ]
}
```

---

### Ice Hockey (NHL)

#### Get all NHL teams
```http
GET /api/sports/nhl/teams
```

**Response:** Same structure as NBA teams

#### Get NHL schedule/events
```http
GET /api/sports/nhl/events?season=2024-2025
```

**Query Parameters:**
- `season` (optional): Season year, default: `2024-2025`

**Response:** Same structure as NBA events

---

### Baseball (MLB)

#### Get all MLB teams
```http
GET /api/sports/mlb/teams
```

**Response:** Same structure as NBA teams

#### Get MLB schedule/events
```http
GET /api/sports/mlb/events?season=2024
```

**Query Parameters:**
- `season` (optional): Season year, default: `2024`

**Response:** Same structure as NBA events

---

### Tennis

#### Get ATP Tour events
```http
GET /api/sports/tennis/atp?season=2024
```

**Query Parameters:**
- `season` (optional): Season year, default: `2024`

**Response:**
```json
{
  "success": true,
  "events": [
    {
      "id": "1234567",
      "name": "Wimbledon Men's Final",
      "homeTeam": "Player A",
      "awayTeam": "Player B",
      "homeScore": "3",
      "awayScore": "1",
      "status": "Match Finished",
      "date": "2024-07-14",
      "time": "14:00:00",
      "venue": "Centre Court, Wimbledon"
    }
  ],
  "season": "2024"
}
```

#### Get WTA Tour events
```http
GET /api/sports/tennis/wta?season=2024
```

**Query Parameters:**
- `season` (optional): Season year, default: `2024`

**Response:** Same structure as ATP events

---

### Multi-Sport Endpoints

#### Get events by date (all sports)
```http
GET /api/sports/events/date/:date?sport=Basketball&league=NBA
```

**Parameters:**
- `date`: Date in format `YYYY-MM-DD`

**Query Parameters:**
- `sport` (optional): Filter by sport name (e.g., "Basketball", "Ice Hockey")
- `league` (optional): Filter by league name (e.g., "NBA", "NHL")

**Response:**
```json
{
  "success": true,
  "events": [
    {
      "id": "1234567",
      "name": "Boston Celtics vs Miami Heat",
      "homeTeam": "Boston Celtics",
      "awayTeam": "Miami Heat",
      "homeScore": "110",
      "awayScore": "105",
      "status": "Match Finished",
      "date": "2024-10-15",
      "time": "19:30:00",
      "venue": "TD Garden",
      "league": "NBA"
    }
  ],
  "date": "2024-10-15"
}
```

#### Search events
```http
GET /api/sports/events/search?q=Lakers
```

**Query Parameters:**
- `q` (required): Search query (team name, event name, etc.)

**Response:**
```json
{
  "success": true,
  "events": [
    {
      "id": "1234567",
      "name": "Los Angeles Lakers vs Boston Celtics",
      "homeTeam": "Los Angeles Lakers",
      "awayTeam": "Boston Celtics",
      "date": "2024-10-20",
      "league": "NBA",
      "venue": "Crypto.com Arena"
    }
  ],
  "query": "Lakers"
}
```

---

## ⚽ Existing Sport APIs

### Football
```http
GET /api/scores/football?leagueId=39
GET /api/live/football
```

### NFL
```http
GET /api/scores/nfl
GET /api/live/nfl
```

### Formula 1
```http
GET /api/scores/f1
GET /api/live/f1
```

---

## 📊 Sports Coverage

| Sport | League | Teams | API | Status |
|-------|--------|-------|-----|--------|
| ⚽ Football | Premier League, Bundesliga, Champions League | 50+ | API-Football | ✅ Active |
| 🏈 NFL | NFL | 32 | ESPN API | ✅ Active |
| 🏎️ Formula 1 | F1 | 20 drivers | Ergast API | ✅ Active |
| 🏀 Basketball | NBA | 30 | TheSportsDB | ✅ **NEW** |
| 🏒 Ice Hockey | NHL | 32 | TheSportsDB | ✅ **NEW** |
| ⚾ Baseball | MLB | 30 | TheSportsDB | ✅ **NEW** |
| 🎾 Tennis | ATP, WTA | Tournaments | TheSportsDB | ✅ **NEW** |

**Total: 7+ sports, 160+ teams/drivers** 🎉

---

## 🔧 Usage Examples

### Get all NBA teams
```javascript
const response = await fetch('https://api.sportskalendar.de/api/sports/nba/teams');
const data = await response.json();
console.log(data.teams);
```

### Get today's events for all sports
```javascript
const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
const response = await fetch(`https://api.sportskalendar.de/api/sports/events/date/${today}`);
const data = await response.json();
console.log(data.events);
```

### Get NBA games for a specific team
```javascript
const teamId = '134878'; // Boston Celtics
const response = await fetch(`https://api.sportskalendar.de/api/sports/nba/teams/${teamId}/next`);
const data = await response.json();
console.log(data.events);
```

### Search for events
```javascript
const response = await fetch('https://api.sportskalendar.de/api/sports/events/search?q=Celtics');
const data = await response.json();
console.log(data.events);
```

---

## 📝 Notes

- All TheSportsDB endpoints use the **free Test Key (3)**
- No API rate limits for test key
- Team logos available via `badge` or `logo` URL in team response
- Event timestamps in UTC
- Season formats vary by sport:
  - NBA/NHL: `2024-2025`
  - MLB/Tennis: `2024`

---

## 🚀 Next Steps

1. **Frontend Integration**: Add team selection UI for new sports
2. **Calendar Integration**: Display NBA/NHL/MLB games in calendar
3. **Live Scores**: Integrate TheSportsDB Patreon API for live scores ($3/month)
4. **Team Logos**: Download and optimize team logos for frontend

---

## 💡 Pro Tip

Use the `/api/sports/events/date/:date` endpoint to build a **unified sports calendar** showing all sports on a specific date!

```javascript
// Get all sports events for today
const today = '2024-10-15';
const allEvents = await fetch(`/api/sports/events/date/${today}`);

// Filter by sport if needed
const nbaOnly = await fetch(`/api/sports/events/date/${today}?league=NBA`);
const nhlOnly = await fetch(`/api/sports/events/date/${today}?league=NHL`);
```

