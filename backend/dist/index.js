"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = require("./routes/auth");
const scores_1 = require("./routes/scores");
const highlights_1 = require("./routes/highlights");
const calendar_1 = require("./routes/calendar");
const community_1 = require("./routes/community");
const ticker_1 = require("./routes/ticker");
const security_1 = require("./middleware/security");
const admin_1 = require("./routes/admin");
const user_1 = require("./routes/user");
const live_1 = require("./routes/live");
const auth_2 = require("./middleware/auth");
const memory_1 = require("./store/memory");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: (origin, cb) => {
        const allowed = ['http://localhost:5173'];
        if (!origin || allowed.includes(origin) || /^(http:\/\/)?(192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1]))\:[0-9]+$/.test(origin)) {
            return cb(null, true);
        }
        return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json());
app.use(security_1.commonSecurityMiddleware);
app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
});
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
(0, memory_1.seedDevUser)().catch(() => { });
(0, memory_1.seedHighlights)();
app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend listening on http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map