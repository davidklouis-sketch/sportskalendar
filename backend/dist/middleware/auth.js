"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireRole = requireRole;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization || '';
    let token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
        token = req.cookies?.['access_token'] || null;
    }
    if (!token) {
        return res.status(401).json({ error: 'Missing token' });
    }
    try {
        const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
        const payload = jsonwebtoken_1.default.verify(token, secret);
        req.user = payload;
        next();
    }
    catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}
function requireRole(role) {
    return (req, res, next) => {
        const user = req.user;
        if (!user)
            return res.status(401).json({ error: 'Unauthorized' });
        // If role missing in token, try to load from store (handles old tokens)
        if (!user.role) {
            try {
                const { db } = require('../store/memory');
                const real = db.users.get(user.email);
                if (real?.role) {
                    user.role = real.role;
                }
            }
            catch { }
        }
        if (user.role !== role)
            return res.status(403).json({ error: 'Forbidden' });
        next();
    };
}
//# sourceMappingURL=auth.js.map