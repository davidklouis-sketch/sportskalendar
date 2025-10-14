# 🔐 Where to Store Your Outlook App Password

This guide shows you exactly where to store your Outlook App Password securely for different environments.

## 🎯 Quick Answer

**Store your App Password in GitHub Secrets for production deployment!**

## 📋 Storage Locations by Environment

### 1. 🚀 Production (GitHub Secrets) - **RECOMMENDED**

**For your live website deployment:**

1. **Go to your GitHub repository**: https://github.com/davidklouis-sketch/sportskalendar
2. **Navigate to**: Settings → Secrets and variables → Actions
3. **Click**: "New repository secret"
4. **Add these secrets**:

```
Name: SMTP_HOST
Value: smtp-mail.outlook.com
```

```
Name: SMTP_PORT
Value: 587
```

```
Name: SMTP_USER
Value: sportskalendar@outlook.de
```

```
Name: SMTP_PASS
Value: your_16_character_app_password_here
```

### 2. 💻 Local Development (.env file)

**For testing on your computer:**

1. **Create/Edit**: `backend/.env` file
2. **Add**:

```bash
# Email Configuration
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=sportskalendar@outlook.de
SMTP_PASS=your_16_character_app_password_here
```

**⚠️ NEVER commit `.env` to git!** (It's already in `.gitignore`)

### 3. 🐳 Docker Development

**For Docker containers:**

1. **Create**: `docker-compose.override.yml` (not tracked by git)
2. **Add**:

```yaml
version: '3.8'
services:
  backend:
    environment:
      - SMTP_HOST=smtp-mail.outlook.com
      - SMTP_PORT=587
      - SMTP_USER=sportskalendar@outlook.de
      - SMTP_PASS=your_16_character_app_password_here
```

### 4. 🖥️ Server Environment Variables

**For manual server deployment:**

1. **SSH into your server**
2. **Edit**: `/opt/sportskalendar/.env` (or wherever your app is)
3. **Add the same variables as local development**

## 🔧 How Your App Uses These Secrets

### GitHub Actions (Production)
Your CI/CD pipeline automatically:
1. ✅ Pulls secrets from GitHub Secrets
2. ✅ Injects them into Docker containers
3. ✅ Deploys with secure configuration

### Local Development
Your app reads from `backend/.env`:
```typescript
// Your email service automatically detects:
process.env.SMTP_USER    // sportskalendar@outlook.de
process.env.SMTP_PASS    // your_app_password
```

## 🛡️ Security Best Practices

### ✅ DO:
- **Use GitHub Secrets for production**
- **Use `.env` files for local development**
- **Keep `.env` in `.gitignore`**
- **Use different App Passwords for different environments**
- **Rotate App Passwords regularly**

### ❌ DON'T:
- **Never commit secrets to git**
- **Never hardcode passwords in code**
- **Never share App Passwords in chat/email**
- **Never use the same password for multiple services**

## 🔄 Environment-Specific Setup

### Development Environment
```bash
# backend/.env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=sportskalendar@outlook.de
SMTP_PASS=dev_app_password_here
```

### Production Environment (GitHub Secrets)
```
SMTP_HOST = smtp-mail.outlook.com
SMTP_PORT = 587
SMTP_USER = sportskalendar@outlook.de
SMTP_PASS = prod_app_password_here
```

## 🎯 Recommended Workflow

1. **Generate App Password** from Outlook
2. **Add to GitHub Secrets** for production
3. **Add to local `.env`** for development
4. **Test locally** first
5. **Deploy to production** via GitHub Actions

## 🔍 Verification

### Check if secrets are loaded:
```bash
# In your app logs, you should see:
📧 Using App Password authentication
✅ Email service configured successfully
```

### Test email functionality:
```bash
# Your app will automatically use the configured credentials
# No additional setup needed!
```

## 🆘 Troubleshooting

**"SMTP_PASS not found"**
- Check if secret is added to GitHub Secrets
- Verify `.env` file exists locally
- Make sure variable name is exactly `SMTP_PASS`

**"Authentication failed"**
- Verify App Password is correct (16 characters)
- Check if 2FA is enabled on Outlook account
- Try regenerating the App Password

**"Secrets not loading in production"**
- Check GitHub Secrets are properly set
- Verify CI/CD pipeline is using the secrets
- Check deployment logs for errors

## 🎉 You're All Set!

Your App Password is now securely stored and will be automatically used by your email service in all environments!
