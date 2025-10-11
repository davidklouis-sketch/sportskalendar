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

// Middleware imports
import { enhancedSecurityMiddleware, validateJwtSecret } from './middleware/security-enhanced';
import { requireAuth } from './middleware/auth';

// Store and database imports
import { seedDevUser, seedHighlights } from './store/memory';
import { testConnection, initializeDatabase, closeDatabase } from './database/connection';

dotenv.config();

const app = express();

// Trust proxy for rate limiting behind reverse proxy (NPM)
// Set to 1 to indicate exactly one proxy hop (secure configuration)
app.set('trust proxy', 1);

// CORS-Konfiguration (konfigurierbar über CORS_ORIGIN, kommasepariert)
const configuredOrigins = (process.env.CORS_ORIGIN || 'https://sportskalendar.de,https://www.sportskalendar.de,https://sportskalender.dlouis.ddnss.de,https://dlouis.ddnss.de,http://localhost:3000,http://localhost:5173')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

console.log('🔒 CORS allowed origins:', configuredOrigins);

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    if (configuredOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token', 'Accept'],
  exposedHeaders: ['Set-Cookie'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Stripe webhook MUST be registered before JSON body parser to receive raw body
app.post('/api/stripe/webhook', express.raw({type: 'application/json'}), handleStripeWebhook);

// Refresh endpoint doesn't need body parsing (uses cookies only)
app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refresh_token } = (req as any).cookies || {};
    if (!refresh_token) {
      return res.status(401).json({ 
        error: 'Missing refresh token',
        message: 'Refresh token not found' 
      });
    }
    
    // Check if token is blacklisted
    const { SessionManager } = await import('./middleware/security-enhanced');
    if (SessionManager.isTokenBlacklisted(refresh_token)) {
      return res.status(401).json({ 
        error: 'Token revoked',
        message: 'Refresh token has been revoked' 
      });
    }
    
    const secret = process.env.JWT_SECRET;
    if (!secret || secret === 'dev_secret_change_me') {
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'Authentication service unavailable' 
      });
    }
    
    const jwt = await import('jsonwebtoken');
    const payload = jwt.verify(refresh_token, secret, {
      issuer: 'sportskalendar',
      audience: 'sportskalendar-users'
    }) as { id: string; email: string; type?: string; iat?: number };
    
    if (payload.type !== 'refresh') {
      return res.status(401).json({ 
        error: 'Invalid token type',
        message: 'Token is not a refresh token' 
      });
    }
    
    // Blacklist the old refresh token
    SessionManager.blacklistToken(refresh_token);
    
    // Load fresh user data from database
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
    
    // Generate new tokens
    const { signAccess, signRefresh, setAuthCookies } = await import('./routes/auth');
    const access = signAccess(userPayload);
    const refresh = signRefresh(userPayload);
    
    // Set new cookies
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

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '10mb' }));


// Enhanced security middleware
app.use(enhancedSecurityMiddleware);

// Validate JWT secret on startup
if (!validateJwtSecret()) {
  console.error('❌ SECURITY WARNING: JWT_SECRET not properly configured!');
  console.error('Please set a strong JWT_SECRET environment variable.');
  process.exit(1);
}

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Debug endpoint to check users
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

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/scores', scoresRouter);
app.use('/api/highlights', highlightsRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/ticker', tickerRouter);
app.use('/api/admin', adminRouter);
app.use('/api/user', userRouter);
app.use('/api/live', liveRouter);
app.use('/api/stripe', stripeRouter);

// Example protected endpoint for current user
app.get('/api/user/me', requireAuth, (req, res) => {
  const tokenUser = (req as any).user as { id: string; email: string; role?: 'user' | 'admin' };
  // Load fresh user from store to ensure role/displayName are current
  // Return user from JWT token (no need to fetch from database for this endpoint)
  res.json({ user: tokenUser });
});

const PORT = process.env.PORT || 4000;

// Initialize database and start server
async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Database connection failed. Starting with in-memory storage only.');
    } else {
      // Initialize database schema
      await initializeDatabase();
      console.log('✅ Database initialized successfully');
    }

    // Seed development data
    try {
      await seedDevUser();
      console.log('✅ Demo users seeded successfully');
    } catch (error) {
      console.error('❌ Failed to seed demo users:', error);
    }
    seedHighlights();

    // Start server
    app.listen(PORT, () => {
      console.log(`✅ Backend listening on http://localhost:${PORT}`);
      console.log(`📊 Database: ${dbConnected ? 'Connected' : 'In-Memory Only'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
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

startServer();


