# 🔐 GitHub Secrets Configuration

This file documents all required GitHub Secrets for CI/CD deployment.

## 🚀 How to Add Secrets

1. Go to your GitHub Repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add each secret below

---

## 📋 Required Secrets

### 🔒 Security & Authentication

```
JWT_SECRET
Value: <Generate a strong 32+ character random string>
Description: Used for JWT token signing
Required: ✅ CRITICAL
```

```
SESSION_SECRET
Value: <Generate a strong 32+ character random string>
Description: Used for session management
Required: ✅ CRITICAL
```

```
COOKIE_SECRET
Value: <Generate a strong 32+ character random string>
Description: Used for cookie encryption
Required: ✅ CRITICAL
```

---

### 🗄️ Database

```
DATABASE_URL
Value: postgresql://username:password@host:port/database
Description: PostgreSQL connection string
Required: ✅ CRITICAL
Example: postgresql://sportsuser:mypassword@db.example.com:5432/sportskalendar
```

---

### 💳 Stripe Payment

```
STRIPE_SECRET_KEY
Value: sk_live_... (for production) or sk_test_... (for testing)
Description: Stripe secret API key
Required: ✅ For premium features
Get it: https://dashboard.stripe.com/apikeys
```

```
STRIPE_WEBHOOK_SECRET
Value: whsec_...
Description: Stripe webhook signing secret
Required: ✅ For premium features
Get it: https://dashboard.stripe.com/webhooks
```

```
STRIPE_PRICE_ID
Value: price_...
Description: Stripe price ID for subscription
Required: ✅ For premium features
Get it: https://dashboard.stripe.com/products
```

---

### ⚽ Sport APIs

#### Football (Current)

```
FOOTBALL_DATA_KEY
Value: <Your API key>
Description: Football-Data.org API key
Required: ✅ For European football
Get it: https://www.football-data.org/client/register
```

```
API_FOOTBALL_KEY
Value: <Your API key>
Description: API-Football key
Required: ⚠️ Optional (alternative to Football-Data)
Get it: https://dashboard.api-football.com/register
```

#### 🌟 TheSportsDB (Multi-Sport) - RECOMMENDED

```
THESPORTSDB_API_KEY
Value: 3
Description: TheSportsDB API key (Free test key: "3")
Required: ✅ For Basketball, Tennis, Hockey, Baseball, Cricket, Rugby
Get it: https://www.thesportsdb.com/api.php (No registration needed for test key)
Note: For live scores and premium features, support on Patreon ($3/month) and use your Patreon API key
```

#### 🏀 Basketball (API-SPORTS) - Optional

```
API_BASKETBALL_KEY
Value: <Your API key>
Description: API-SPORTS Basketball key
Required: ⚠️ Optional (if not using TheSportsDB)
Get it: https://dashboard.api-football.com/register
Limit: 100 requests/day (free tier)
```

#### 🎾 Tennis (API-SPORTS) - Optional

```
API_TENNIS_KEY
Value: <Your API key>
Description: API-SPORTS Tennis key
Required: ⚠️ Optional (if not using TheSportsDB)
Get it: https://dashboard.api-football.com/register
Limit: 100 requests/day (free tier)
```

#### 🏒 Hockey (NHL Official API) - Optional

```
NHL_API_URL
Value: https://api-web.nhle.com/v1
Description: NHL official API base URL
Required: ⚠️ Optional (if not using TheSportsDB)
Note: No API key required - public API
```

#### ⚾ Baseball (MLB Official API) - Optional

```
MLB_API_URL
Value: https://statsapi.mlb.com/api/v1
Description: MLB official API base URL
Required: ⚠️ Optional (if not using TheSportsDB)
Note: No API key required - public API
```

#### 🏏 Cricket - Optional

```
CRICAPI_KEY
Value: <Your API key>
Description: CricAPI key
Required: ⚠️ Optional (if not using TheSportsDB)
Get it: https://cricapi.com/
Limit: 100 requests/day (free tier)
```

---

### 🌐 Frontend & CORS

```
FRONTEND_URL
Value: https://yourdomain.com
Description: Your frontend URL for CORS
Required: ✅ CRITICAL
Example: https://sportskalendar.de
```

```
CORS_ORIGIN
Value: https://yourdomain.com,https://www.yourdomain.com
Description: Allowed CORS origins (comma-separated)
Required: ✅ CRITICAL
Example: https://sportskalendar.de,https://www.sportskalendar.de
```

---

### 📧 Email Configuration

```
SMTP_HOST
Value: smtp-mail.outlook.com
Description: SMTP server hostname
Required: ✅ For email functionality
```

```
SMTP_PORT
Value: 587
Description: SMTP server port
Required: ✅ For email functionality
```

```
SMTP_USER
Value: sportskalendar@outlook.de
Description: Your Outlook email address
Required: ✅ For email functionality
```

```
SMTP_PASS
Value: your_outlook_app_password_here
Description: Outlook App Password (16 characters)
Required: ✅ For email functionality
Get it: https://account.microsoft.com/security → Advanced security → App passwords
```

---

### 📰 Sports News API

```
NEWS_API_KEY
Value: <Your API key>
Description: NewsAPI.org key for sports news and team-specific filtering
Required: ⚠️ Optional (News portal works without it, but shows "API not configured")
Get it: https://newsapi.org/register
Free Tier: 1000 requests/month
Cost: $449/month for 250,000 requests
Features: Real-time sports news from Kicker, Sport1, ESPN, BBC Sport, etc.
```

```
LOG_LEVEL
Value: info
Description: Logging level (debug, info, warn, error)
Required: ❌ Optional (defaults to 'info')
```

---

## 🎯 Recommended Setup

### Minimal Setup (Required for Basic Functionality)
1. `JWT_SECRET`
2. `SESSION_SECRET`
3. `COOKIE_SECRET`
4. `DATABASE_URL`
5. `FRONTEND_URL`
6. `CORS_ORIGIN`
7. `FOOTBALL_DATA_KEY` or `API_FOOTBALL_KEY`
8. `THESPORTSDB_API_KEY` (use `3` for free)
9. `SMTP_USER` and `SMTP_PASS` (for email functionality)

### News Portal Setup (Optional but Recommended)
10. `NEWS_API_KEY` (for personalized sports news)

### Full Setup (All Features)
- All secrets from Minimal Setup
- All secrets from News Portal Setup
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID`
- Additional sport APIs as needed

---

## 🛠️ Generate Strong Secrets

Use this command to generate strong random secrets:

```bash
# Linux/Mac
openssl rand -base64 32

# Or Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Or online
# https://randomkeygen.com/
```

---

## ✅ Verification Checklist

Before deploying, verify:

- [ ] All **CRITICAL** secrets are set
- [ ] `DATABASE_URL` is correctly formatted
- [ ] `FRONTEND_URL` matches your domain
- [ ] `CORS_ORIGIN` includes all your domains
- [ ] Stripe keys match your environment (test vs. live)
- [ ] All secrets are **NOT** committed to git
- [ ] `.env` file is in `.gitignore`

---

## 🔍 Testing Secrets Locally

Create a `.env` file in `backend/` directory:

```bash
cp backend/env.example backend/.env
```

Then edit `.env` with your actual values.

**⚠️ NEVER commit `.env` to git!**

---

## 📚 Additional Resources

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Stripe API Keys](https://dashboard.stripe.com/apikeys)
- [TheSportsDB API](https://www.thesportsdb.com/api.php)
- [API-SPORTS Dashboard](https://dashboard.api-football.com/)
- [Football-Data.org](https://www.football-data.org/)

---

## 💡 Pro Tips

1. **Use different secrets** for development and production
2. **Rotate secrets** regularly for security
3. **Use test keys** during development
4. **Monitor API usage** to avoid hitting limits
5. **Start with TheSportsDB (free)** before paying for premium APIs

---

## 🎉 Sport Coverage Summary

With the recommended setup (TheSportsDB + official APIs):

- ⚽ **Football** (Football-Data.org / API-Football)
- 🏈 **NFL** (ESPN API)
- 🏎️ **Formula 1** (Ergast API)
- 🏀 **Basketball / NBA** (TheSportsDB)
- 🎾 **Tennis** (TheSportsDB)
- 🏒 **Hockey / NHL** (TheSportsDB or NHL API)
- ⚾ **Baseball / MLB** (TheSportsDB or MLB API)
- 🏏 **Cricket** (TheSportsDB or CricAPI)
- 🏉 **Rugby** (TheSportsDB)
- **80+ more sports** via TheSportsDB!

**Total Cost: FREE** (with test keys and public APIs) 🎊

