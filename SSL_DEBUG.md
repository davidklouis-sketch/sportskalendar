# SSL Certificate Debug Guide

## Problem: Calendar Sync URLs zeigen "unsichere Verbindung"

### 1. Überprüfe SSL-Zertifikat für api.sportskalendar.de

```bash
# SSL-Zertifikat überprüfen
openssl s_client -connect api.sportskalendar.de:443 -servername api.sportskalendar.de

# Oder mit curl
curl -I https://api.sportskalendar.de/api/calendar-sync/test
```

### 2. Traefik SSL-Zertifikate überprüfen

```bash
# In den Traefik Container wechseln
docker exec -it traefik sh

# Zertifikate anzeigen
ls -la /letsencrypt/

# Zertifikat-Details anzeigen
openssl x509 -in /letsencrypt/acme.json -text -noout
```

### 3. Traefik Logs überprüfen

```bash
# Traefik Logs anzeigen
docker logs traefik

# Live Logs verfolgen
docker logs -f traefik
```

### 4. SSL-Zertifikat neu generieren

Falls das Zertifikat fehlt oder ungültig ist:

```bash
# Traefik Container neu starten (erzwingt neue Zertifikat-Anforderung)
docker restart traefik

# Oder Traefik komplett neu deployen
docker-compose -f docker-compose.traefik.yml down
docker-compose -f docker-compose.traefik.yml up -d
```

### 5. Environment Variables überprüfen

Stelle sicher, dass diese Variablen gesetzt sind:

```bash
# In der .env Datei oder als Environment Variables
FRONTEND_HOST=sportskalendar.de
BACKEND_HOST=api.sportskalendar.de
LETSENCRYPT_EMAIL=your-email@domain.com
```

### 6. Traefik Konfiguration validieren

Die Traefik Labels sollten so aussehen:

```yaml
labels:
  traefik.enable: "true"
  traefik.http.routers.backend.rule: Host(`api.sportskalendar.de`) && PathPrefix(`/api`)
  traefik.http.routers.backend.entrypoints: websecure
  traefik.http.routers.backend.tls: "true"
  traefik.http.routers.backend.tls.certresolver: le
```

### 7. Alternative: Wildcard-Zertifikat verwenden

Falls einzelne Subdomains Probleme machen, verwende ein Wildcard-Zertifikat:

```yaml
# In docker-compose.traefik.yml
- --certificatesresolvers.le.acme.dnschallenge=true
- --certificatesresolvers.le.acme.dnschallenge.provider=your-dns-provider
```

### 8. Test Calendar Sync URL

```bash
# Test die Calendar Sync URL direkt
curl -v "https://api.sportskalendar.de/api/calendar-sync/export?format=ics"
```

### Troubleshooting

1. **Zertifikat wird nicht generiert**: Überprüfe DNS-Einstellungen und Firewall
2. **Zertifikat ist abgelaufen**: Traefik sollte automatisch erneuern
3. **Subdomain funktioniert nicht**: Überprüfe DNS-A-Records für api.sportskalendar.de
4. **Let's Encrypt Rate Limits**: Warte 1 Stunde zwischen Versuchen

### Debug Commands

```bash
# Alle Traefik Router anzeigen
docker exec traefik wget -qO- http://localhost:8080/api/http/routers

# SSL-Zertifikat Details
echo | openssl s_client -connect api.sportskalendar.de:443 2>/dev/null | openssl x509 -noout -dates
```
