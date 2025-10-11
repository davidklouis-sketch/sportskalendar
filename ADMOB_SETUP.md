# 📱 Google AdMob / AdSense Setup Guide

Vollständige Anleitung zur Integration von Google AdMob/AdSense für Werbeeinnahmen in SportsKalendar.

---

## 🎯 **Übersicht**

**Werbung wird nur für Free-User angezeigt:**
- ✅ **Banner Ads** - Dezent zwischen Content
- ✅ **Leaderboard Ads** - Oben auf den Event-Listen
- ✅ **Interstitial Ads** - Alle 5 Seitenaufrufe

**Premium-User (€9.99/Monat):**
- ❌ **Keine Werbung**
- 🚀 **Bessere Performance**
- 🎨 **Saubere UI**

---

## 📋 **Schritt 1: Google AdSense Account erstellen**

### **1.1 Account anlegen:**
1. Gehe zu: **https://adsense.google.com**
2. Klicke auf **"Jetzt anmelden"**
3. Verwende deine Google-Konto-E-Mail: `sportskalendar@outlook.de`
4. **Website hinzufügen**: `https://sportskalendar.de`

### **1.2 Website verifizieren:**
1. **AdSense-Code kopieren** (wird von Google bereitgestellt)
2. **Code ist bereits im HTML** (`index.html` Zeile 105):
   ```html
   <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXX" crossorigin="anonymous"></script>
   ```
3. **Ersetze** `ca-pub-0000000000000000` mit deiner **echten Publisher-ID**
4. **Deployment** - Google verifiziert automatisch nach 24-48 Stunden

### **1.3 Publisher-ID finden:**
1. Gehe zu: **https://adsense.google.com**
2. **Klicke** auf dein Profil (oben rechts)
3. **"Einstellungen" > "Konto-Informationen"**
4. **Publisher-ID** kopieren (Format: `ca-pub-XXXXXXXXXXXXXXXX`)

---

## 🎨 **Schritt 2: Anzeigenblöcke erstellen**

### **2.1 Banner Ad (Horizontal):**
1. Gehe zu: **https://adsense.google.com**
2. **"Anzeigen" > "Anzeigenblöcke" > "Neue Anzeige"**
3. **Typ**: `Display-Anzeige`
4. **Name**: `SportsKalendar - Banner`
5. **Größe**: `Anpassungsfähig` (Responsive)
6. **Stil**: Standard
7. **Erstellen** → **Anzeigenblock-ID kopieren** (z.B. `1234567890`)

### **2.2 Leaderboard Ad (728x90):**
1. **"Neue Anzeige"** erstellen
2. **Name**: `SportsKalendar - Leaderboard`
3. **Größe**: `Anpassungsfähig` oder `Leaderboard (728x90)`
4. **Erstellen** → **ID kopieren**

### **2.3 Square Ad (250x250):**
1. **"Neue Anzeige"** erstellen
2. **Name**: `SportsKalendar - Square`
3. **Größe**: `Anpassungsfähig` oder `Square (250x250)`
4. **Erstellen** → **ID kopieren**

### **2.4 Interstitial Ad (Vollbild):**
1. **"Neue Anzeige"** erstellen
2. **Name**: `SportsKalendar - Interstitial`
3. **Typ**: `Interstitial` (falls verfügbar) oder `Display-Anzeige`
4. **Größe**: `Anpassungsfähig`
5. **Erstellen** → **ID kopieren**

---

## 🔧 **Schritt 3: Umgebungsvariablen konfigurieren**

### **3.1 Frontend (.env Datei):**

Erstelle `/frontend/.env` mit folgenden Variablen:

```bash
# API Configuration
VITE_API_URL=https://api.sportskalendar.de/api

# Google AdMob / AdSense Configuration
VITE_ADMOB_CLIENT_ID=ca-pub-2481184858901580  # Deine Publisher-ID
VITE_ADMOB_BANNER_SLOT=1234567890             # Banner Ad Slot ID
VITE_ADMOB_SQUARE_SLOT=0987654321             # Square Ad Slot ID
VITE_ADMOB_LEADERBOARD_SLOT=1122334455        # Leaderboard Ad Slot ID
VITE_ADMOB_INTERSTITIAL_SLOT=5544332211       # Interstitial Ad Slot ID
```

### **3.2 index.html aktualisieren:**

**Ersetze in `/frontend/index.html` Zeile 105:**
```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-DEINE_ECHTE_ID" crossorigin="anonymous"></script>
```

---

## 🚀 **Schritt 4: GitHub Secrets hinzufügen**

Für CI/CD Pipeline:

1. Gehe zu: `https://github.com/davidklouis-sketch/sportskalendar/settings/secrets/actions`
2. **Klicke**: "New repository secret"
3. **Füge hinzu**:

```
Name: VITE_ADMOB_CLIENT_ID
Value: ca-pub-2481184858901580

Name: VITE_ADMOB_BANNER_SLOT
Value: 1234567890

Name: VITE_ADMOB_SQUARE_SLOT
Value: 0987654321

Name: VITE_ADMOB_LEADERBOARD_SLOT
Value: 1122334455

Name: VITE_ADMOB_INTERSTITIAL_SLOT
Value: 5544332211
```

---

## 📝 **Schritt 5: CI/CD Pipeline aktualisieren**

Die `.github/workflows/ci-cd.yml` muss die Umgebungsvariablen beim Build verwenden:

```yaml
- name: Build frontend
  working-directory: frontend
  env:
    VITE_API_URL: https://api.sportskalendar.de/api
    VITE_ADMOB_CLIENT_ID: ${{ secrets.VITE_ADMOB_CLIENT_ID }}
    VITE_ADMOB_BANNER_SLOT: ${{ secrets.VITE_ADMOB_BANNER_SLOT }}
    VITE_ADMOB_SQUARE_SLOT: ${{ secrets.VITE_ADMOB_SQUARE_SLOT }}
    VITE_ADMOB_LEADERBOARD_SLOT: ${{ secrets.VITE_ADMOB_LEADERBOARD_SLOT }}
    VITE_ADMOB_INTERSTITIAL_SLOT: ${{ secrets.VITE_ADMOB_INTERSTITIAL_SLOT }}
  run: npm run build
```

---

## ✅ **Schritt 6: Testen**

### **6.1 Lokales Testen:**
```bash
cd frontend
npm run dev
```

1. **Als Free-User einloggen**: `demo@sportskalender.local` / `password`
2. **Werbung sollte sichtbar sein** (Entwicklungsmodus zeigt Test-Ads)
3. **Als Premium-User**: Keine Werbung

### **6.2 Produktions-Test:**
1. **Deploy** auf Server
2. **Warte 24-48 Stunden** (Google muss Website verifizieren)
3. **Prüfe AdSense Dashboard** für Impressions

---

## 💰 **Umsatzerwartung**

### **Geschätzte Zahlen:**
- **1.000 Free-User pro Tag**
- **5 Pageviews pro User** = 5.000 Pageviews
- **3 Ad-Impressions pro Pageview** = 15.000 Impressions
- **CPM (Cost per Mille)**: €1 - €5
- **Erwarteter Umsatz**: **€15 - €75 pro Tag**

### **Optimierungstipps:**
1. **Premium-Anreiz**: Werbung als Motivation für Upgrade
2. **Interstitials**: Nicht zu aggressiv (max. alle 5 Views)
3. **Platzierung**: Banner zwischen Content, nicht störend
4. **Performance**: AdSense lazy-loading nutzen

---

## 🛠️ **Troubleshooting**

### **"Ads werden nicht angezeigt":**
1. **AdBlocker deaktivieren**
2. **Publisher-ID korrekt?** (Format: `ca-pub-XXXXXXXXXXXXXXXX`)
3. **Website verifiziert?** (Kann 24-48h dauern)
4. **Console-Fehler prüfen**: F12 → Console

### **"AdSense Account abgelehnt":**
1. **Content-Richtlinien prüfen**: Keine illegalen Inhalte
2. **Impressum & Datenschutz**: Muss vorhanden sein ✅
3. **Traffic**: Mindestens 100 User pro Tag
4. **Neuantrag**: Nach 6 Monaten möglich

### **"Niedrige Einnahmen":**
1. **Ad-Platzierung optimieren**: Above-the-fold
2. **Auto-Ads aktivieren**: In AdSense Dashboard
3. **Premium pushen**: Mehr Users = weniger Ads = höhere CPM

---

## 📊 **AdSense Dashboard**

**Nach erfolgreicher Integration:**
1. **Gehe zu**: https://adsense.google.com
2. **Dashboard** zeigt:
   - 📈 Impressions
   - 💰 Geschätzte Einnahmen
   - 🎯 Click-Through-Rate (CTR)
   - 📱 Geräte-Verteilung
3. **Optimierungsvorschläge** beachten

---

## 🔐 **Datenschutz (DSGVO-konform)**

✅ **Bereits implementiert:**
- **Datenschutzerklärung** mit AdSense-Abschnitt
- **Cookie-Banner** (CookieBanner.tsx)
- **Premium-Option** (werbefrei)
- **Keine Third-Party Tracking** außer AdSense

**In Privacy.tsx enthalten:**
- Google AdSense Datenerhebung
- Opt-Out-Möglichkeiten
- Premium als werbefreie Alternative

---

## 🎉 **Fertig!**

Nach erfolgreicher Einrichtung:
- ✅ **Werbung läuft** für Free-User
- ✅ **Premium-User sehen keine Ads**
- ✅ **DSGVO-konform**
- ✅ **CI/CD-Pipeline integriert**
- ✅ **Einnahmen generiert**

**Nächste Schritte:**
1. Publisher-ID in `index.html` eintragen
2. Ad-Slots in GitHub Secrets hinzufügen
3. CI/CD pushen → Deployment
4. 24-48h warten → Google Verifizierung
5. Einnahmen im Dashboard prüfen 💰

---

## 📞 **Support**

Bei Fragen:
- **Google AdSense Help**: https://support.google.com/adsense
- **Community**: https://support.google.com/adsense/community
- **Dokumentation**: https://developers.google.com/adsense

**Viel Erfolg mit deinen Werbeeinnahmen! 🚀**

# AdSense Setup Complete Thu Oct  9 08:08:02 CEST 2025
