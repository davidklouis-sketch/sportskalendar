# GitHub Secrets Setup für AdMob/AdSense

## ✅ GitHub Secrets bereits in CI/CD Pipeline implementiert!

Die CI/CD Pipeline (`.github/workflows/ci-cd.yml`) ist bereits konfiguriert und verwendet die folgenden GitHub Secrets:

### 🔐 Erforderliche GitHub Secrets:

#### 1. **VITE_ADMOB_CLIENT_ID**
- **Wert**: Ihre AdMob Publisher ID (z.B. `ca-pub-1234567890123456`)
- **Verwendung**: Wird als Build-Argument für das Frontend verwendet

#### 2. **VITE_ADMOB_BANNER_SLOT**
- **Wert**: `7002462664` (Ihr Banner Ad Slot)
- **Verwendung**: Banner-Werbung auf der Website

#### 3. **VITE_ADMOB_SQUARE_SLOT**
- **Wert**: `5008646728` (Ihr Square Ad Slot)
- **Verwendung**: 300x250 Square-Werbung

#### 4. **VITE_ADMOB_LEADERBOARD_SLOT**
- **Wert**: `4384038187` (Ihr Leaderboard Ad Slot)
- **Verwendung**: 728x90 Leaderboard-Werbung

#### 5. **VITE_ADMOB_INTERSTITIAL_SLOT**
- **Wert**: `9901880755` (Ihr Interstitial Ad Slot)
- **Verwendung**: Vollbild-Werbung zwischen Seiten

## 📋 So konfigurieren Sie die GitHub Secrets:

### Schritt 1: GitHub Repository öffnen
1. Gehen Sie zu: `https://github.com/davidklouis-sketch/sportskalendar`
2. Klicken Sie auf **Settings** (oben rechts)

### Schritt 2: Secrets & Variables
1. Klicken Sie auf **Secrets and variables** → **Actions**
2. Klicken Sie auf **New repository secret**

### Schritt 3: Secrets hinzufügen
Fügen Sie jeden Secret einzeln hinzu:

```
Name: VITE_ADMOB_CLIENT_ID
Value: ca-pub-xxxxxxxxxxxxxxxx
```

```
Name: VITE_ADMOB_BANNER_SLOT
Value: 7002462664
```

```
Name: VITE_ADMOB_SQUARE_SLOT
Value: 5008646728
```

```
Name: VITE_ADMOB_LEADERBOARD_SLOT
Value: 4384038187
```

```
Name: VITE_ADMOB_INTERSTITIAL_SLOT
Value: 9901880755
```

## 🔧 Wie es funktioniert:

### CI/CD Pipeline Integration:
```yaml
- name: Build and push frontend image
  uses: docker/build-push-action@v5
  with:
    context: ./frontend
    push: true
    tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/frontend:${{ github.sha }}
    build-args: |
      VITE_API_URL=https://api.sportskalendar.de/api
      VITE_ADMOB_CLIENT_ID=${{ secrets.VITE_ADMOB_CLIENT_ID }}
      VITE_ADMOB_BANNER_SLOT=${{ secrets.VITE_ADMOB_BANNER_SLOT }}
      VITE_ADMOB_SQUARE_SLOT=${{ secrets.VITE_ADMOB_SQUARE_SLOT }}
      VITE_ADMOB_LEADERBOARD_SLOT=${{ secrets.VITE_ADMOB_LEADERBOARD_SLOT }}
      VITE_ADMOB_INTERSTITIAL_SLOT=${{ secrets.VITE_ADMOB_INTERSTITIAL_SLOT }}
```

### Frontend Dockerfile Integration:
Die Secrets werden als Build-Argumente an das Frontend-Docker-Image übergeben und zur Build-Zeit in die JavaScript-Bundle eingebettet.

## 📧 Email-Verifikation Secrets:

Für die Email-Verifikation müssen zusätzlich diese Secrets gesetzt werden:

```bash
Name: SMTP_HOST
Value: smtp-mail.outlook.com
```

```bash
Name: SMTP_PORT
Value: 587
```

```bash
Name: SMTP_USER
Value: sportskalendar@outlook.de
```

```bash
Name: SMTP_PASS
Value: o%5yl8XBw5b39o!Q
```

## 🚀 Nach der Konfiguration:

1. **Automatisches Deployment**: Bei jedem Push auf `main` wird automatisch deployed
2. **Sichere Credentials**: AdMob-Credentials sind sicher in GitHub Secrets gespeichert
3. **Production Ready**: Ads werden in Production automatisch aktiviert

## 🔍 Verifikation:

Nach dem Setzen der Secrets können Sie überprüfen:
1. **GitHub Actions**: Schauen Sie in die Actions-Tab, ob der Build erfolgreich ist
2. **Website**: Besuchen Sie `https://sportskalendar.de` und prüfen Sie, ob Ads angezeigt werden
3. **Browser DevTools**: Prüfen Sie die Network-Tab auf AdSense-Requests

## ⚠️ Wichtige Hinweise:

- **Nur die CLIENT_ID muss geändert werden** - die Slot-IDs sind bereits korrekt
- **Secrets sind verschlüsselt** und nur für GitHub Actions zugänglich
- **Keine lokale .env-Datei nötig** für Production
- **Development-Modus** zeigt weiterhin Platzhalter

## 🎯 Status:
- ✅ CI/CD Pipeline konfiguriert
- ✅ Build-Argumente implementiert
- ✅ Docker-Integration bereit
- ⏳ **Nur noch GitHub Secrets konfigurieren!**
