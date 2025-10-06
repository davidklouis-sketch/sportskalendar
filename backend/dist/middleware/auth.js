"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireRole = requireRole;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const security_enhanced_1 = require("./security-enhanced");
function requireAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization || '';
        let token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
        if (!token) {
            token = req.cookies?.['access_token'] || null;
        }
        if (!token) {
            return res.status(401).json({
                error: 'Authentication required',
                message: 'No valid token provided'
            });
        }
        // Check if token is blacklisted
        if (security_enhanced_1.SessionManager.isTokenBlacklisted(token)) {
            return res.status(401).json({
                error: 'Token revoked',
                message: 'Token has been revoked'
            });
        }
        const secret = process.env.JWT_SECRET;
        if (!secret || secret === 'dev_secret_change_me') {
            return res.status(500).json({
                error: 'Server configuration error',
                message: 'Authentication service unavailable'
            });
        }
        const payload = jsonwebtoken_1.default.verify(token, secret, {
            issuer: 'sportskalendar',
            audience: 'sportskalendar-users'
        });
        // Additional token validation
        if (!payload.id || !payload.email) {
            return res.status(401).json({
                error: 'Invalid token payload',
                message: 'Token contains invalid data'
            });
        }
        // Check token age (additional security)
        if (payload.iat && Date.now() - (payload.iat * 1000) > 15 * 60 * 1000) {
            return res.status(401).json({
                error: 'Token expired',
                message: 'Access token has expired'
            });
        }
        req.user = payload;
        next();
    }
    catch (err) {
        console.error('Auth middleware error:', err);
        return res.status(401).json({
            error: 'Invalid token',
            message: 'Token verification failed'
        });
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