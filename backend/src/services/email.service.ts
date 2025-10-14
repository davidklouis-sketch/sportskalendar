import nodemailer, { Transporter } from 'nodemailer';
import crypto from 'crypto';
import https from 'https';
import querystring from 'querystring';
import fetch from 'node-fetch';

export interface EmailVerificationToken {
  token: string;
  expiresAt: Date;
  userId: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export class EmailService {
  private transporter!: Transporter;
  private isConfigured: boolean = false;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    try {
      // TEMPORARY: Skip email service initialization in development
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Email service disabled in development mode');
        return;
      }

      // Check if we have OAuth2 credentials first
      const hasOAuth2 = process.env.OAUTH_CLIENT_ID && process.env.OAUTH_CLIENT_SECRET && process.env.OAUTH_REFRESH_TOKEN;
      
      let emailConfig: any;

      if (hasOAuth2) {
        // Use OAuth2 configuration
        emailConfig = {
          host: process.env.SMTP_HOST || 'smtp-mail.outlook.com',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: false, // STARTTLS
          auth: {
            type: 'OAuth2',
            user: process.env.SMTP_USER || 'sportskalendar@outlook.de',
            clientId: process.env.OAUTH_CLIENT_ID,
            clientSecret: process.env.OAUTH_CLIENT_SECRET,
            refreshToken: process.env.OAUTH_REFRESH_TOKEN,
            accessToken: process.env.OAUTH_ACCESS_TOKEN
          },
          tls: {
            ciphers: 'SSLv3'
          }
        };
        console.log('📧 Using OAuth2 authentication');
      } else {
        // Use App Password authentication (simpler, no Azure required)
        // Try port 465 with SSL first, fallback to 587 with STARTTLS
        const useSSL = process.env.SMTP_PORT === '465' || process.env.SMTP_USE_SSL === 'true';
        
        emailConfig = {
          host: process.env.SMTP_HOST || 'smtp-mail.outlook.com',
          port: parseInt(process.env.SMTP_PORT || (useSSL ? '465' : '587')),
          secure: useSSL, // true for SSL (465), false for STARTTLS (587)
          auth: {
            user: process.env.SMTP_USER || 'sportskalendar@outlook.de',
            pass: process.env.SMTP_PASS // This should be your Outlook App Password
          },
          tls: useSSL ? undefined : {
            ciphers: 'SSLv3',
            rejectUnauthorized: false
          },
          requireTLS: !useSSL
        };
        console.log('📧 Using App Password authentication');
        console.log('📧 SMTP Config:', {
          host: emailConfig.host,
          port: emailConfig.port,
          secure: emailConfig.secure,
          user: emailConfig.auth.user,
          hasPassword: !!emailConfig.auth.pass,
          method: useSSL ? 'SSL (port 465)' : 'STARTTLS (port 587)'
        });
      }

      // Validate basic configuration
      if (!emailConfig.auth.user) {
        console.warn('⚠️ Email configuration incomplete - missing SMTP_USER');
        console.log('📧 Required: SMTP_USER (your Outlook email address)');
        return;
      }

      // Validate authentication method
      if (hasOAuth2) {
        if (!emailConfig.auth.clientId || !emailConfig.auth.clientSecret || !emailConfig.auth.refreshToken) {
          console.warn('⚠️ OAuth2 configuration incomplete');
          console.log('📧 OAuth2 requires: OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET, OAUTH_REFRESH_TOKEN');
          console.log('📧 Alternative: Use SMTP_PASS (App Password) instead');
          return;
        }
      } else {
        if (!emailConfig.auth.pass) {
          console.warn('⚠️ App Password configuration incomplete');
          console.log('📧 Required: SMTP_PASS (Outlook App Password)');
          console.log('📧 Get App Password: https://account.microsoft.com/security → Advanced security → App passwords');
          return;
        }
      }

      this.transporter = nodemailer.createTransport(emailConfig);
      
      // Verify connection configuration
      this.transporter.verify((error: any, success: any) => {
        if (error) {
          console.warn('⚠️ Email service configuration error (non-critical):', error.message);
          console.log('📧 Email service will work in limited mode - emails may not be sent');
          this.isConfigured = false;
        } else {
          console.log('✅ Email service configured successfully');
          this.isConfigured = true;
        }
      });
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
      this.isConfigured = false;
    }
  }

  public isServiceConfigured(): boolean {
    return this.isConfigured;
  }

  /**
   * Generate a secure verification token
   */
  public generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Send email verification email
   */
  public async sendVerificationEmail(
    to: string, 
    displayName: string, 
    verificationToken: string
  ): Promise<boolean> {
    if (!this.isConfigured) {
      console.error('❌ Email service not configured');
      return false;
    }

    try {
      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;
      
      const emailTemplate = this.getVerificationEmailTemplate(displayName, verificationUrl);

      const mailOptions = {
        from: `"Sportskalendar" <${process.env.SMTP_USER || 'sportskalendar@outlook.de'}>`,
        to: to,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Verification email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send verification email:', error);
      return false;
    }
  }

  /**
   * Send password reset email
   */
  public async sendPasswordResetEmail(
    to: string,
    displayName: string,
    resetToken: string
  ): Promise<boolean> {
    if (!this.isConfigured) {
      console.error('❌ Email service not configured');
      return false;
    }

    try {
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
      
      const emailTemplate = this.getPasswordResetEmailTemplate(displayName, resetUrl);

      const mailOptions = {
        from: `"Sportskalendar" <${process.env.SMTP_USER || 'sportskalendar@outlook.de'}>`,
        to: to,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Password reset email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      return false;
    }
  }

  /**
   * Send welcome email after successful verification
   */
  public async sendWelcomeEmail(to: string, displayName: string): Promise<boolean> {
    if (!this.isConfigured) {
      console.error('❌ Email service not configured');
      return false;
    }

    try {
      const emailTemplate = this.getWelcomeEmailTemplate(displayName);

      const mailOptions = {
        from: `"Sportskalendar" <${process.env.SMTP_USER || 'sportskalendar@outlook.de'}>`,
        to: to,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Welcome email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send welcome email:', error);
      return false;
    }
  }

  /**
   * Email verification template
   */
  private getVerificationEmailTemplate(displayName: string, verificationUrl: string): EmailTemplate {
    return {
      subject: 'Bestätige deine Email-Adresse - Sportskalendar',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email bestätigen</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏆 Sportskalendar</h1>
              <p>Email-Adresse bestätigen</p>
            </div>
            <div class="content">
              <h2>Hallo ${displayName}!</h2>
              <p>Vielen Dank für deine Registrierung bei Sportskalendar! Um dein Konto zu aktivieren, musst du deine Email-Adresse bestätigen.</p>
              <p>Klicke einfach auf den Button unten, um deine Email-Adresse zu bestätigen:</p>
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Email bestätigen</a>
              </div>
              <p>Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:</p>
              <p style="word-break: break-all; background: #e9e9e9; padding: 10px; border-radius: 5px;">${verificationUrl}</p>
              <p><strong>Wichtig:</strong> Dieser Link ist nur 24 Stunden gültig.</p>
              <p>Falls du dich nicht bei Sportskalendar registriert hast, kannst du diese Email ignorieren.</p>
            </div>
            <div class="footer">
              <p>Sportskalendar - Dein persönlicher Sportkalender</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Hallo ${displayName}!
        
        Vielen Dank für deine Registrierung bei Sportskalendar! Um dein Konto zu aktivieren, musst du deine Email-Adresse bestätigen.
        
        Bitte besuche folgenden Link, um deine Email-Adresse zu bestätigen:
        ${verificationUrl}
        
        Dieser Link ist nur 24 Stunden gültig.
        
        Falls du dich nicht bei Sportskalendar registriert hast, kannst du diese Email ignorieren.
        
        Sportskalendar - Dein persönlicher Sportkalender
      `
    };
  }

  /**
   * Password reset email template
   */
  private getPasswordResetEmailTemplate(displayName: string, resetUrl: string): EmailTemplate {
    return {
      subject: 'Passwort zurücksetzen - Sportskalendar',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Passwort zurücksetzen</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #e74c3c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏆 Sportskalendar</h1>
              <p>Passwort zurücksetzen</p>
            </div>
            <div class="content">
              <h2>Hallo ${displayName}!</h2>
              <p>Du hast eine Anfrage zum Zurücksetzen deines Passworts erhalten.</p>
              <p>Klicke auf den Button unten, um ein neues Passwort zu erstellen:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Passwort zurücksetzen</a>
              </div>
              <p>Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:</p>
              <p style="word-break: break-all; background: #e9e9e9; padding: 10px; border-radius: 5px;">${resetUrl}</p>
              <p><strong>Wichtig:</strong> Dieser Link ist nur 1 Stunde gültig.</p>
              <p>Falls du diese Anfrage nicht gestellt hast, kannst du diese Email ignorieren.</p>
            </div>
            <div class="footer">
              <p>Sportskalendar - Dein persönlicher Sportkalender</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Hallo ${displayName}!
        
        Du hast eine Anfrage zum Zurücksetzen deines Passworts erhalten.
        
        Bitte besuche folgenden Link, um ein neues Passwort zu erstellen:
        ${resetUrl}
        
        Dieser Link ist nur 1 Stunde gültig.
        
        Falls du diese Anfrage nicht gestellt hast, kannst du diese Email ignorieren.
        
        Sportskalendar - Dein persönlicher Sportkalender
      `
    };
  }

  /**
   * Welcome email template
   */
  private getWelcomeEmailTemplate(displayName: string): EmailTemplate {
    return {
      subject: 'Willkommen bei Sportskalendar! 🏆',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Willkommen</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .feature { margin: 15px 0; padding: 15px; background: white; border-radius: 5px; border-left: 4px solid #667eea; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏆 Sportskalendar</h1>
              <p>Willkommen an Bord!</p>
            </div>
            <div class="content">
              <h2>Hallo ${displayName}!</h2>
              <p>Herzlich willkommen bei Sportskalendar! 🎉</p>
              <p>Deine Email-Adresse wurde erfolgreich bestätigt und dein Konto ist jetzt vollständig aktiviert.</p>
              
              <h3>Was du jetzt machen kannst:</h3>
              <div class="feature">
                <strong>📅 Deine Lieblings-Teams auswählen</strong><br>
                Wähle deine bevorzugten Teams aus und verpasse nie wieder ein wichtiges Spiel!
              </div>
              <div class="feature">
                <strong>🔔 Benachrichtigungen einrichten</strong><br>
                Erhalte Erinnerungen vor Spielen deiner Teams.
              </div>
              <div class="feature">
                <strong>📱 Mobile App nutzen</strong><br>
                Nutze Sportskalendar auf deinem Smartphone für den besten Komfort.
              </div>
              
              <p>Falls du Fragen hast oder Hilfe benötigst, zögere nicht, uns zu kontaktieren!</p>
            </div>
            <div class="footer">
              <p>Sportskalendar - Dein persönlicher Sportkalender</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Hallo ${displayName}!
        
        Herzlich willkommen bei Sportskalendar! 🎉
        
        Deine Email-Adresse wurde erfolgreich bestätigt und dein Konto ist jetzt vollständig aktiviert.
        
        Was du jetzt machen kannst:
        • Deine Lieblings-Teams auswählen
        • Benachrichtigungen einrichten
        • Die mobile App nutzen
        
        Falls du Fragen hast oder Hilfe benötigst, zögere nicht, uns zu kontaktieren!
        
        Sportskalendar - Dein persönlicher Sportkalender
      `
    };
  }
}

// Export singleton instance
export const emailService = new EmailService();