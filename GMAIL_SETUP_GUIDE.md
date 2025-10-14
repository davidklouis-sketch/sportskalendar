# 📧 Gmail Email Setup Guide

Since Microsoft requires OAuth2 (which needs Azure Portal access), let's switch to Gmail which is much simpler and more reliable.

## ✅ Why Gmail is Better:

- ✅ **No Azure Portal required**
- ✅ **App Passwords still work**
- ✅ **More reliable delivery**
- ✅ **Better spam reputation**
- ✅ **Simpler setup**

## 🔧 Quick Setup Steps:

### Step 1: Enable 2FA on Gmail

1. **Go to**: https://myaccount.google.com/security
2. **Sign in** with your Gmail account
3. **Enable**: "2-Step Verification" (if not already enabled)

### Step 2: Generate Gmail App Password

1. **In the same security page**: "App passwords"
2. **Select app**: "Mail"
3. **Select device**: "Other (custom name)"
4. **Name**: "Sportskalendar Email Service"
5. **Copy the 16-character password**

### Step 3: Update GitHub Secrets

Replace your Outlook secrets with Gmail secrets:

```
SMTP_HOST = smtp.gmail.com
SMTP_PORT = 587
SMTP_USER = your-gmail@gmail.com
SMTP_PASS = your_16_character_gmail_app_password
```

### Step 4: Test

Your email service will automatically detect Gmail configuration and work immediately!

## 🎯 Gmail Configuration:

```bash
# Gmail SMTP Settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your_gmail_app_password
```

## 🔍 What You'll See:

```
📧 Using App Password authentication
📧 SMTP Config: {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  method: 'STARTTLS (port 587)'
}
✅ Email service configured successfully
```

## 🚀 Benefits:

- **No OAuth2 complexity**
- **No Azure Portal needed**
- **Reliable email delivery**
- **Works immediately**
- **Better spam reputation**

## 📧 Professional Email Address:

You can still use a professional email address by:
1. **Creating a Gmail account** like `sportskalendar@gmail.com`
2. **Or using Google Workspace** for a custom domain like `noreply@sportskalendar.de`

Gmail is actually used by many professional applications because it's more reliable than Outlook for automated emails!
