"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
// Router imports
const auth_1 = require("./routes/auth");
const scores_1 = require("./routes/scores");
const highlights_1 = require("./routes/highlights");
const calendar_1 = require("./routes/calendar");
const community_1 = require("./routes/community");
const ticker_1 = require("./routes/ticker");
const admin_1 = require("./routes/admin");
const user_1 = require("./routes/user");
const live_1 = require("./routes/live");
const security_enhanced_1 = require("./middleware/security-enhanced");
const auth_2 = require("./middleware/auth");
// Store and database imports
const memory_1 = require("./store/memory");
const connection_1 = require("./database/connection");
dotenv_1.default.config();
const app = (0, express_1.default)();
// Trust proxy for rate limiting behind reverse proxy (NPM)
app.set('trust proxy', true);
// CORS-Konfiguration
const corsOptions = {
    origin: [
        'https://sportskalender.dlouis.ddnss.de',
        'https://dlouis.ddnss.de',
        'http://localhost:3000',
        'http://localhost:5173'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token']
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json());
// Enhanced security middleware
app.use(security_enhanced_1.enhancedSecurityMiddleware);
// Validate JWT secret on startup
if (!(0, security_enhanced_1.validateJwtSecret)()) {
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
app.use('/api/auth', auth_1.authRouter);
app.use('/api/scores', scores_1.scoresRouter);
app.use('/api/highlights', highlights_1.highlightsRouter);
app.use('/api/calendar', calendar_1.calendarRouter);
app.use('/api/community', community_1.communityRouter);
app.use('/api/ticker', ticker_1.tickerRouter);
app.use('/api/admin', admin_1.adminRouter);
app.use('/api/user', user_1.userRouter);
app.use('/api/live', live_1.liveRouter);
// Example protected endpoint for current user
app.get('/api/user/me', auth_2.requireAuth, (req, res) => {
    const tokenUser = req.user;
    // Load fresh user from store to ensure role/displayName are current
    try {
        const { db } = require('./store/memory');
        const realUser = db.users.get(tokenUser.email);
        if (realUser) {
            return res.json({ user: { id: realUser.id, email: realUser.email, displayName: realUser.displayName, role: realUser.role } });
        }
    }
    catch { }
    res.json({ user: tokenUser });
});
const PORT = process.env.PORT || 4000;
// Initialize database and start server
async function startServer() {
    try {
        // Test database connection
        const dbConnected = await (0, connection_1.testConnection)();
        if (!dbConnected) {
            console.error('❌ Database connection failed. Starting with in-memory storage only.');
        }
        else {
            // Initialize database schema
            await (0, connection_1.initializeDatabase)();
            console.log('✅ Database initialized successfully');
        }
        // Seed development data
        await (0, memory_1.seedDevUser)().catch(() => { });
        (0, memory_1.seedHighlights)();
        // Start server
        app.listen(PORT, () => {
            console.log(`✅ Backend listening on http://localhost:${PORT}`);
            console.log(`📊 Database: ${dbConnected ? 'Connected' : 'In-Memory Only'}`);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down server...');
    await (0, connection_1.closeDatabase)();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down server...');
    await (0, connection_1.closeDatabase)();
    process.exit(0);
});
startServer();
//# sourceMappingURL=index.js.map