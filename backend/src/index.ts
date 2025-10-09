import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Router imports
import { authRouter } from './routes/auth';
import { scoresRouter } from './routes/scores';
import { highlightsRouter } from './routes/highlights';
import { calendarRouter } from './routes/calendar';
import { communityRouter } from './routes/community';
import { tickerRouter } from './routes/ticker';
import { adminRouter } from './routes/admin';
import { userRouter } from './routes/user';
import { liveRouter } from './routes/live';
import { stripeRouter } from './routes/stripe';

// Middleware imports
import { enhancedSecurityMiddleware, validateJwtSecret } from './middleware/security-enhanced';
import { requireAuth } from './middleware/auth';

// Store and database imports
import { seedDevUser, seedHighlights } from './store/memory';
import { testConnection, initializeDatabase, closeDatabase } from './database/connection';

dotenv.config();

const app = express();

// Trust proxy for rate limiting behind reverse proxy (NPM)
app.set('trust proxy', true);

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

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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
app.use('/api/community', communityRouter);
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


