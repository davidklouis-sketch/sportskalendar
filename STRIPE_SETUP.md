# Stripe Integration Setup Guide

## 🎯 Übersicht

Die Sportskalendar App ist bereits vollständig für Stripe-Integration konfiguriert. Du musst nur noch die Stripe-Konfiguration abschließen.

## 🔧 Was du noch machen musst:

### 1. **Stripe Dashboard Setup**

1. **Gehe zu https://dashboard.stripe.com**
2. **Erstelle ein neues Produkt:**
   - Name: `Sportskalendar Premium`
   - Beschreibung: `Unbegrenzte Teams, erweiterte Features und mehr!`
   - Preis: `€9.99/Monat` (Recurring)
   - Intervall: `Monthly`

3. **Notiere die Price ID** (beginnt mit `price_...`)

### 2. **Webhook konfigurieren**

1. **Gehe zu Stripe Dashboard → Webhooks**
2. **Erstelle einen neuen Webhook:**
   - Endpoint URL: `https://api.sportskalendar.de/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.deleted`

3. **Notiere den Webhook Secret** (beginnt mit `whsec_...`)

### 3. **Environment Variables setzen**

Aktualisiere `env.production`:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_your_actual_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_actual_webhook_secret
STRIPE_PRICE_ID=price_your_actual_price_id
FRONTEND_URL=https://sportskalendar.de
```

### 4. **Test vs. Live Mode**

- **Development:** Verwende Test-Keys (`sk_test_...`)
- **Production:** Verwende Live-Keys (`sk_live_...`)

## ✅ Bereits implementiert:

### Backend:
- ✅ Stripe-Konfiguration (`/backend/src/config/stripe.ts`)
- ✅ Checkout-Session-Erstellung (`/backend/src/routes/stripe.ts`)
- ✅ Webhook-Handler für Zahlungen
- ✅ Admin-Funktionen für manuelle Upgrades
- ✅ Premium-Feature-API

### Frontend:
- ✅ Premium-Seite (`/frontend/src/components/Pages/Premium.tsx`)
- ✅ Stripe-API-Integration (`/frontend/src/lib/api.ts`)
- ✅ Checkout-Redirect-Logik
- ✅ Premium-Status-Anzeige

### Features:
- ✅ Monatliche Abonnements (€9.99/Monat)
- ✅ Automatische User-Upgrades nach Zahlung
- ✅ Webhook-basierte Status-Updates
- ✅ Admin-Tools für manuelle Upgrades
- ✅ Premium-Feature-Liste

## 🚀 Testen:

1. **Stripe Test-Modus:**
   - Verwende Test-Kreditkarten: `4242 4242 4242 4242`
   - Teste verschiedene Szenarien (erfolgreich, abgebrochen, etc.)

2. **Webhook-Test:**
   - Verwende Stripe CLI: `stripe listen --forward-to localhost:4000/api/stripe/webhook`

3. **Live-Test:**
   - Teste mit echten Kreditkarten im Live-Modus

## 🔐 Sicherheit:

- ✅ Webhook-Signatur-Verifizierung
- ✅ Authentifizierung für Admin-Endpoints
- ✅ Sichere API-Key-Verwaltung
- ✅ HTTPS-Only für Production

## 📋 Checkliste:

- [ ] Stripe-Produkt erstellt
- [ ] Price ID notiert
- [ ] Webhook konfiguriert
- [ ] Environment Variables gesetzt
- [ ] Test-Zahlung durchgeführt
- [ ] Webhook-Test erfolgreich
- [ ] Live-Deployment getestet

## 🆘 Support:

Bei Problemen:
1. Prüfe Stripe Dashboard → Events
2. Prüfe Backend-Logs
3. Teste Webhook-URL erreichbar
4. Validiere API-Keys

**Die Integration ist vollständig implementiert - du musst nur noch die Stripe-Konfiguration abschließen!** 🎉
