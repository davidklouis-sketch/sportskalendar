# 🚨 CORS Error Fix

## Problem

```
Access to XMLHttpRequest at 'https://api.sportskalendar.de/api/auth/login' 
from origin 'https://sportskalendar.de' has been blocked by CORS policy
```

## ✅ Lösung

### Schritt 1: Hosts ohne https:// in .env.production

```bash
cd /opt/sportskalendar
nano .env.production
```

**Stelle sicher:**
```env
# Hosts OHNE https:// Präfix!
BACKEND_HOST=api.sportskalendar.de
FRONTEND_HOST=sportskalendar.de

# CORS muss Frontend-URLs enthalten
CORS_ORIGIN=https://sportskalendar.de,https://www.sportskalendar.de
```

### Schritt 2: Pull neueste Version

```bash
git pull origin main
```

Die neueste Version entfernt CORS-Konflikt-Headers aus Traefik (Backend handhabt CORS selbst).

### Schritt 3: Services komplett neu starten

```bash
# Stoppe ALLES
docker compose -f docker-compose.traefik.yml --env-file .env.production down

# Warte kurz
sleep 5

# Starte neu
docker compose -f docker-compose.traefik.yml --env-file .env.production up -d

# Warte bis Services healthy sind
sleep 15

# Prüfe
./scripts/check-deployment.sh
```

### Schritt 4: Test im Browser

1. **Öffne** https://sportskalendar.de
2. **Öffne DevTools** (F12) → Network Tab
3. **Versuche Login**
4. **Prüfe Response Headers** der /api/auth/login Anfrage

Du solltest sehen:
```
Access-Control-Allow-Origin: https://sportskalendar.de
Access-Control-Allow-Credentials: true
```

## Alternative: CORS direkt im Backend-Container prüfen

```bash
# Backend Logs ansehen
docker compose -f docker-compose.traefik.yml --env-file .env.production logs backend | grep CORS

# Sollte zeigen:
# 🔒 CORS allowed origins: ['https://sportskalendar.de', ...]
```

## Wenn es immer noch nicht funktioniert:

### Option A: Backend CORS erweitern

```bash
# Editiere .env.production
nano .env.production
```

Füge ALLE möglichen URLs hinzu:
```env
CORS_ORIGIN=https://sportskalendar.de,https://www.sportskalendar.de,https://api.sportskalendar.de,http://sportskalendar.de,http://www.sportskalendar.de
```

Neu starten:
```bash
docker compose -f docker-compose.traefik.yml --env-file .env.production restart backend
```

### Option B: Traefik Logs prüfen

```bash
# Prüfe ob Traefik die richtige Route hat
docker logs traefik 2>&1 | grep -i sportskalendar

# Prüfe Traefik Dashboard (optional)
docker logs traefik 2>&1 | grep -i error
```

### Option C: Direkt Backend testen (Bypass Traefik)

```bash
# Test Backend direkt
docker exec sportskalendar-backend curl -s http://localhost:4000/api/health

# Sollte zeigen: {"ok":true}
```

## Checklist:

- [ ] `.env.production` hat `BACKEND_HOST=api.sportskalendar.de` (OHNE https://)
- [ ] `.env.production` hat `FRONTEND_HOST=sportskalendar.de` (OHNE https://)
- [ ] `.env.production` hat `CORS_ORIGIN=https://sportskalendar.de,...`
- [ ] Git pull ausgeführt
- [ ] Services neu gestartet mit `--env-file .env.production`
- [ ] Browser Cache geleert (Strg+Shift+R)

Nach diesen Schritten sollte CORS funktionieren! 🎉

