# 🚨 Deployment Fix - 404 Error

## Problem gefunden!

In deiner `.env.production` sind die Hosts **falsch konfiguriert**:

```env
# ❌ FALSCH:
BACKEND_HOST=https://api.sportskalendar.de
FRONTEND_HOST=https://sportskalendar.de
```

Das `https://` Präfix gehört NICHT in die Hosts!

## ✅ Lösung

### Auf dem Server:

```bash
cd /opt/sportskalendar
nano .env.production
```

### Ändere zu (OHNE https://):

```env
# ✅ RICHTIG:
BACKEND_HOST=api.sportskalendar.de
FRONTEND_HOST=sportskalendar.de
```

### Dann Services neu starten:

```bash
# Stoppe Services
docker compose -f docker-compose.traefik.yml --env-file .env.production down

# Starte neu mit korrekten Werten
docker compose -f docker-compose.traefik.yml --env-file .env.production up -d

# Prüfe Status
./scripts/check-deployment.sh
```

## Warum?

Traefik verwendet die Hosts für Routing-Rules:
- `Host('api.sportskalendar.de')` ✅ - Funktioniert
- `Host('https://api.sportskalendar.de')` ❌ - Funktioniert NICHT

Das `https://` wird von Traefik automatisch hinzugefügt durch die TLS-Konfiguration.

## Nach dem Fix

Die Seite sollte jetzt unter https://sportskalendar.de erreichbar sein! 🎉

