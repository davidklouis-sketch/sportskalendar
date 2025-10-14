# 🔐 Outlook App Password Setup Guide

This guide shows you how to set up Outlook App Passwords for your Sportskalendar email service **without needing Azure access**.

## ✅ Why App Passwords?

- **No Azure registration required**
- **More reliable than OAuth2**
- **Simpler setup**
- **Works with any Outlook account**
- **No complex token management**

## 📋 Step-by-Step Setup

### Step 1: Enable 2FA on Your Outlook Account

1. Go to: https://account.microsoft.com/security
2. Sign in with your Outlook account (`sportskalendar@outlook.de`)
3. Go to **"Security"** → **"Advanced security options"**
4. Enable **"Two-step verification"** if not already enabled

### Step 2: Generate App Password

1. In the same **"Advanced security options"** page
2. Scroll down to **"App passwords"**
3. Click **"Create a new app password"**
4. **Name**: `Sportskalendar Email Service`
5. Click **"Next"**
6. **Copy the generated password** (16 characters, no spaces)
   - Example: `abcd-efgh-ijkl-mnop`

### Step 3: Update Your Environment

Add the app password to your `.env` file:

```bash
# Email Configuration
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=sportskalendar@outlook.de
SMTP_PASS=abcd-efgh-ijkl-mnop
```

### Step 4: Test Email Service

Your email service will automatically detect the app password and use it for authentication.

## 🔧 Alternative: Gmail App Passwords

If you prefer Gmail instead of Outlook:

1. Go to: https://myaccount.google.com/security
2. Enable **"2-Step Verification"**
3. Go to **"App passwords"**
4. Generate password for **"Mail"**
5. Use these settings:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your_gmail_app_password
```

## 🚨 Important Notes

- **Never share your app password**
- **App passwords are 16 characters long**
- **If you change your main password, app passwords still work**
- **You can revoke app passwords anytime**
- **Each app should have its own password**

## ✅ Verification

Your email service will show:
```
📧 Using App Password authentication
✅ Email service configured successfully
```

## 🆘 Troubleshooting

**"Authentication failed"**
- Check if 2FA is enabled
- Verify the app password is correct
- Make sure there are no extra spaces

**"Connection timeout"**
- Check your internet connection
- Verify SMTP settings are correct
- Try port 465 with `secure: true`

**"Invalid credentials"**
- Regenerate the app password
- Make sure you're using the app password, not your regular password

## 🎉 You're Done!

Your email service is now configured with secure app password authentication. No Azure access required!
