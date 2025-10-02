# Backend

## Setup

- Create a `.env` file with the following variables:
  ```
  PORT=4000
  JWT_SECRET=your-super-secret-jwt-key-here
  FOOTBALL_DATA_KEY=your-football-data-api-key-here
  ```
- Install deps and run dev server:

```bash
npm install
npm run dev
```

Server runs at `http://localhost:4000`.

## API Keys

### Football Data API (Recommended)
- **Free Tier**: 10 requests/minute, access to major European leagues
- **Registration**: https://www.football-data.org/client/register
- **Environment Variable**: `FOOTBALL_DATA_KEY`
- **Supported Leagues**: Premier League, Bundesliga, Champions League, European Championship

### API-FOOTBALL (Fallback)
- **Environment Variable**: `API_FOOTBALL_KEY`
- Used as fallback if Football Data API is not available

## Auth
- POST `/api/auth/register` { email, password, displayName }
- POST `/api/auth/login` { email, password } → sets HttpOnly cookies; returns user
- POST `/api/auth/logout` clears cookies
- POST `/api/auth/refresh` rotates tokens
- Authorization: HttpOnly cookies; optional Bearer supported

## Stub APIs
- GET `/api/scores` and `/api/scores/:sport`
- GET `/api/highlights`
- GET `/api/calendar`
- POST `/api/calendar/reminder` (auth + CSRF)
- GET `/api/community/stream`
- POST `/api/community/post` (auth + CSRF)
- GET `/api/ticker/stream` (SSE)

## Highlights API
- GET `/api/highlights?sport=F1&query=text` → `{ items: Highlight[] }`
- GET `/api/highlights/:id` → `Highlight`
- POST `/api/highlights` (admin) `{ title, url, sport, description? }` → `201 Highlight`
- PUT `/api/highlights/:id` (admin) partial update `{ title?, url?, sport?, description? }`
- DELETE `/api/highlights/:id` (admin)

## RBAC & Admin
- Roles: `user`, `admin`
- Seeded users:
  - Admin: `admin@sportskalender.local` / `admin123`
  - Demo: `demo@sportskalender.local` / `password`
- Admin endpoints (require admin role):
  - GET `/api/admin/users` → list users (id, email, displayName, role)
  - DELETE `/api/admin/users/:id` → delete user by id
