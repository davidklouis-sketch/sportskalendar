/**
 * SPORTSKALENDAR BACKEND - MAIN ENTRY POINT
 * 
 * Express.js Backend Server für die Sportskalendar-Anwendung.
 * 
 * Features:
 * - JWT-basierte Authentifizierung mit httpOnly Cookies
 * - PostgreSQL Datenbank mit Fallback zu In-Memory Storage
 * - CORS-Konfiguration für Frontend-Zugriff
 * - Rate Limiting und Security Middleware
 * - Stripe Webhook Integration für Premium-Subscriptions
 * - TheSportsDB API Integration für Sport-Daten
 * - Automatisches Token Refresh System
 * - Graceful Shutdown Handling
 * 
 * Environment Variables (siehe .env.example):
 * - PORT: Server Port (default: 4000)
 * - DATABASE_URL: PostgreSQL Connection String
 * - JWT_SECRET: Secret für JWT Token Signierung
 * - CORS_ORIGIN: Erlaubte Frontend Origins (kommasepariert)
 * - STRIPE_SECRET_KEY: Stripe API Key
 * - THESPORTSDB_API_KEY: TheSportsDB API Key
 * 
 * Wichtige Middleware-Reihenfolge:
 * 1. CORS
 * 2. Stripe Webhook (raw body)
 * 3. Auth Refresh Endpoint (cookies only)
 * 4. Body Parser (JSON/URLEncoded)
 * 5. Security Middleware
 * 6. Routes
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Router imports
import { authRouter } from './routes/auth';
import { scoresRouter } from './routes/scores';
import { highlightsRouter } from './routes/highlights';
import { calendarRouter } from './routes/calendar';
import { tickerRouter } from './routes/ticker';
import { adminRouter } from './routes/admin';
import { userRouter } from './routes/user';
import { liveRouter } from './routes/live';
import { stripeRouter, handleStripeWebhook } from './routes/stripe';
import sportsRouter from './routes/sports';
import { calendarSyncRouter } from './routes/calendar-sync';

// Middleware imports
import { enhancedSecurityMiddleware, validateJwtSecret } from './middleware/security-enhanced';
import { requireAuth } from './middleware/auth';

// Store and database imports
import { seedDevUser, seedHighlights } from './store/memory';
import { testConnection, initializeDatabase, closeDatabase } from './database/connection';

// Load environment variables from .env file
dotenv.config();

const app = express();

/**
 * PROXY CONFIGURATION
 * 
 * Trust proxy für Rate Limiting hinter Reverse Proxy (Nginx Proxy Manager).
 * Setzt auf 1 für genau einen Proxy-Hop (sichere Konfiguration).
 */
app.set('trust proxy', 1);

/**
 * CORS CONFIGURATION
 * 
 * Konfiguriert CORS für Frontend-Zugriff.
 * Erlaubte Origins aus CORS_ORIGIN Environment Variable (kommasepariert).
 * 
 * Default Origins:
 * - https://sportskalendar.de
 * - https://www.sportskalendar.de
 * - http://localhost:5173 (Vite Dev Server)
 * - http://localhost:3000 (Alternative Dev Port)
 */
const configuredOrigins = (process.env.CORS_ORIGIN || 'https://sportskalendar.de,https://www.sportskalendar.de,https://sportskalender.dlouis.ddnss.de,https://dlouis.ddnss.de,http://localhost:3000,http://localhost:5173')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

console.log('🔒 CORS allowed origins:', configuredOrigins);

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Requests ohne Origin erlauben (Mobile Apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    if (configuredOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Wichtig für httpOnly Cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token', 'Accept'],
  exposedHeaders: ['Set-Cookie'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

/**
 * STRIPE WEBHOOK ENDPOINT
 * 
 * WICHTIG: Muss VOR express.json() registriert werden!
 * Stripe benötigt den raw body für Signature-Verifizierung.
 */
app.post('/api/stripe/webhook', express.raw({type: 'application/json'}), handleStripeWebhook);

/**
 * AUTH REFRESH ENDPOINT
 * 
 * WICHTIG: Muss VOR express.json() registriert werden!
 * Verwendet nur Cookies, kein JSON Body.
 * 
 * Flow:
 * 1. Refresh Token aus httpOnly Cookie lesen
 * 2. Token validieren und Blacklist prüfen
 * 3. Alten Token blacklisten
 * 4. Neue Access + Refresh Tokens generieren
 * 5. Neue Tokens als httpOnly Cookies setzen
 * 
 * Wichtig: Lädt aktuelle User-Daten aus DB (isPremium, role)
 */
app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refresh_token } = (req as any).cookies || {};
    if (!refresh_token) {
      return res.status(401).json({ 
        error: 'Missing refresh token',
        message: 'Refresh token not found' 
      });
    }
    
    // Token Blacklist prüfen
    const { SessionManager } = await import('./middleware/security-enhanced');
    if (SessionManager.isTokenBlacklisted(refresh_token)) {
      return res.status(401).json({ 
        error: 'Token revoked',
        message: 'Refresh token has been revoked' 
      });
    }
    
    // JWT Secret validieren
    const secret = process.env.JWT_SECRET;
    if (!secret || secret === 'dev_secret_change_me') {
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'Authentication service unavailable' 
      });
    }
    
    // Token verifizieren
    const jwt = await import('jsonwebtoken');
    const payload = jwt.verify(refresh_token, secret, {
      issuer: 'sportskalendar',
      audience: 'sportskalendar-users'
    }) as { id: string; email: string; type?: string; iat?: number };
    
    // Token-Typ prüfen
    if (payload.type !== 'refresh') {
      return res.status(401).json({ 
        error: 'Invalid token type',
        message: 'Token is not a refresh token' 
      });
    }
    
    // Alten Refresh Token blacklisten (verhindert Wiederverwendung)
    SessionManager.blacklistToken(refresh_token);
    
    // Aktuelle User-Daten aus DB laden (isPremium, role können sich geändert haben)
    let userPayload: { id: string; email: string; role?: 'user' | 'admin' } = payload;
    try {
      const { UserRepository } = await import('./database/repositories/userRepository');
      const freshUser = await UserRepository.findByEmail(payload.email);
      if (freshUser) {
        userPayload = {
          id: freshUser.id,
          email: freshUser.email,
          role: freshUser.role as 'user' | 'admin'
        };
      }
    } catch (error) {
      console.error('Failed to load fresh user data during refresh:', error);
    }
    
    // Neue Tokens generieren
    const { signAccess, signRefresh, setAuthCookies } = await import('./routes/auth');
    const access = signAccess(userPayload);
    const refresh = signRefresh(userPayload);
    
    // Neue Tokens als httpOnly Cookies setzen
    setAuthCookies(res, { access, refresh });
    
    res.json({ 
      success: true,
      message: 'Tokens refreshed successfully' 
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(401).json({ 
      error: 'Invalid refresh token',
      message: 'Token refresh failed' 
    });
  }
});

/**
 * BODY PARSER MIDDLEWARE
 * 
 * Parst JSON und URLEncoded Bodies.
 * Limit: 10MB für große Requests (z.B. Base64 Images)
 */
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '10mb' }));

/**
 * SECURITY MIDDLEWARE
 * 
 * Erweiterte Security Features:
 * - Rate Limiting (100 Requests pro 15 Minuten pro IP)
 * - Helmet Security Headers
 * - Request Logging
 * - IP-basiertes Blocking
 */
app.use(enhancedSecurityMiddleware);

/**
 * JWT SECRET VALIDATION
 * 
 * Validiert JWT_SECRET beim Start.
 * Server startet NICHT, wenn Secret fehlt oder unsicher ist.
 */
if (!validateJwtSecret()) {
  console.error('❌ SECURITY WARNING: JWT_SECRET not properly configured!');
  console.error('Please set a strong JWT_SECRET environment variable.');
  process.exit(1);
}

/**
 * HEALTH CHECK ENDPOINT
 * 
 * Für Docker Health Checks und Monitoring.
 */
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

/**
 * DEBUG ENDPOINT
 * 
 * Zeigt alle User aus der Datenbank.
 * Nützlich für Debugging und Entwicklung.
 * 
 * TODO: In Production mit requireAuth und Admin-Check schützen!
 */
app.get('/api/debug/users', async (_req, res) => {
  let postgresUsers: any[] = [];
  if (process.env.DATABASE_URL) {
    try {
      const { UserRepository } = await import('./database/repositories/userRepository');
      const pgUsers = await UserRepository.findAll();
      postgresUsers = pgUsers.map((u: any) => ({
        id: u.id,
        email: u.email,
        displayName: u.displayName,
        role: u.role,
        isPremium: u.isPremium,
        emailVerified: u.email_verified,
        createdAt: u.created_at,
        source: 'postgresql'
      }));
    } catch (error) {
      console.log('⚠️ Could not fetch PostgreSQL users:', error);
    }
  }
  
  res.json({ 
    users: postgresUsers,
    totalUsers: postgresUsers.length,
    database: process.env.DATABASE_URL ? 'postgresql' : 'none'
  });
});

/**
 * API ROUTES
 * 
 * Alle API-Endpoints sind unter /api/* verfügbar.
 * 
 * Routes:
 * - /api/auth: Authentifizierung (Login, Register, Logout, Refresh)
 * - /api/user: User-Profil und Einstellungen
 * - /api/admin: Admin-Panel (nur für Admins)
 * - /api/calendar: Kalender und Events
 * - /api/live: Live-Daten für verschiedene Sportarten
 * - /api/highlights: Highlights und News
 * - /api/scores: Scores und Ergebnisse
 * - /api/ticker: Live-Ticker
 * - /api/stripe: Stripe Payment Integration
 * - /api/sports: TheSportsDB API (NBA, NHL, MLB, Tennis)
 */
app.use('/api/auth', authRouter);
app.use('/api/scores', scoresRouter);
app.use('/api/highlights', highlightsRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/ticker', tickerRouter);
app.use('/api/admin', adminRouter);
app.use('/api/user', userRouter);
app.use('/api/live', liveRouter);
app.use('/api/stripe', stripeRouter);
app.use('/api/sports', sportsRouter); // TheSportsDB API für Basketball, Hockey, Baseball, Tennis, etc.
app.use('/api/calendar-sync', calendarSyncRouter); // Calendar Sync für Premium Nutzer

/**
 * PROTECTED ENDPOINT EXAMPLE
 * 
 * Zeigt, wie requireAuth Middleware verwendet wird.
 * User-Daten aus JWT Token sind in req.user verfügbar.
 */
app.get('/api/user/me', requireAuth, (req, res) => {
  const tokenUser = (req as any).user as { id: string; email: string; role?: 'user' | 'admin' };
  // User-Daten aus JWT Token zurückgeben (kein DB-Zugriff nötig)
  res.json({ user: tokenUser });
});

const PORT = process.env.PORT || 4000;

/**
 * SERVER START FUNCTION
 * 
 * Initialisiert Datenbank und startet Express Server.
 * 
 * Flow:
 * 1. Datenbank-Verbindung testen
 * 2. Datenbank-Schema initialisieren
 * 3. Demo-User seeden (nur in Development)
 * 4. Highlights seeden
 * 5. Server starten
 */
async function startServer() {
  try {
    // Datenbank-Verbindung testen
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Database connection failed. Starting with in-memory storage only.');
    } else {
      // Datenbank-Schema initialisieren (Tabellen erstellen falls nicht vorhanden)
      await initializeDatabase();
      console.log('✅ Database initialized successfully');
    }

    // Demo-User seeden (demo@sportskalendar.local, admin@sportskalendar.local)
    try {
      await seedDevUser();
      console.log('✅ Demo users seeded successfully');
    } catch (error) {
      console.error('❌ Failed to seed demo users:', error);
    }
    
    // Highlights seeden (Beispiel-Highlights für Demo)
    seedHighlights();

    // Express Server starten
    app.listen(PORT, () => {
      console.log(`✅ Backend listening on http://localhost:${PORT}`);
      console.log(`📊 Database: ${dbConnected ? 'Connected' : 'In-Memory Only'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

/**
 * GRACEFUL SHUTDOWN HANDLING
 * 
 * Schließt Datenbank-Verbindungen sauber bei SIGINT/SIGTERM.
 * Wichtig für Docker und Production Deployments.
 */
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down server...');
  await closeDatabase();
  process.exit(0);
});

// Server starten
startServer();
