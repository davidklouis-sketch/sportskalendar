# Server Setup für Stripe Integration

## 1. Umgebungsvariablen auf dem Server hinzufügen

Füge diese Variablen zu deiner Server-Konfiguration hinzu:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_51SG92pQ1gNSiSOl89evvtjinSpqD8KojZJtuwJJzrWmWjQ9fpDQKjK069mnt1UdyGN90eCXlHtsLWZsB6wMyF0He00rFvm11o1
STRIPE_WEBHOOK_SECRET=whsec_dein_webhook_secret_hier
FRONTEND_URL=https://sportskalendar.de

# Bestehende Variablen (falls noch nicht gesetzt)
DB_PASSWORD=dein_sicheres_db_passwort
JWT_SECRET=dein_jwt_secret_min_32_zeichen
CORS_ORIGIN=https://sportskalendar.de,https://www.sportskalendar.de
```

## 2. Docker-Compose aktualisieren

Die Docker-Compose-Datei wurde bereits aktualisiert. Stelle sicher, dass alle Variablen gesetzt sind:

```yaml
backend:
  environment:
    STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
    STRIPE_WEBHOOK_SECRET: ${STRIPE_WEBHOOK_SECRET}
    FRONTEND_URL: ${FRONTEND_URL}
```

## 3. Server neu starten

```bash
docker-compose -f docker-compose.traefik.yml down
docker-compose -f docker-compose.traefik.yml up -d
```

## 4. Logs überprüfen

```bash
docker logs sportskalendar-backend
```

Du solltest sehen:
- ✅ Stripe configuration loaded
- ✅ Database connected
- ✅ Server started successfully
