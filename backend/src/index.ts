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

// Middleware imports
import { commonSecurityMiddleware } from './middleware/security';
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
const configuredOrigins = (process.env.CORS_ORIGIN || 'https://sportskalender.dlouis.ddnss.de,https://dlouis.ddnss.de,http://localhost:3000,http://localhost:5173')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin: configuredOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token']
};

app.use(cors(corsOptions));
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
app.get('/api/debug/users', (_req, res) => {
  const { db } = require('./store/memory');
  const users = Array.from(db.users.values()).map(u => ({ 
    id: u.id, 
    email: u.email, 
    displayName: u.displayName, 
    role: u.role 
  }));
  res.json({ users, count: users.length });
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

// Example protected endpoint for current user
app.get('/api/user/me', requireAuth, (req, res) => {
  const tokenUser = (req as any).user as { id: string; email: string; role?: 'user' | 'admin' };
  // Load fresh user from store to ensure role/displayName are current
  try {
    const { db } = require('./store/memory');
    const realUser = db.users.get(tokenUser.email);
    if (realUser) {
      return res.json({ user: { id: realUser.id, email: realUser.email, displayName: realUser.displayName, role: realUser.role } });
    }
  } catch {}
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
    await seedDevUser().catch(() => {});
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


