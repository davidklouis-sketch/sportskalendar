"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.issueCsrfToken = issueCsrfToken;
exports.csrfProtection = csrfProtection;
const crypto_1 = __importDefault(require("crypto"));
const CSRF_COOKIE_NAME = 'csrf_token';
function issueCsrfToken(req, res) {
    const existing = req.cookies?.[CSRF_COOKIE_NAME];
    const token = existing || crypto_1.default.randomBytes(24).toString('hex');
    res.cookie(CSRF_COOKIE_NAME, token, {
        httpOnly: false,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return token;
}
function csrfProtection(req, res, next) {
    const method = req.method.toUpperCase();
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
        return next();
    }
    const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
    const headerToken = req.headers['x-csrf-token'] || '';
    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        return res.status(403).json({ error: 'CSRF validation failed' });
    }
    next();
}
//# sourceMappingURL=csrf.js.map