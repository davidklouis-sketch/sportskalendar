"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
exports.signAccess = signAccess;
exports.signRefresh = signRefresh;
exports.setAuthCookies = setAuthCookies;
const express_1 = require("express");
const zod_1 = require("zod");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const memory_1 = require("../store/memory");
exports.authRouter = (0, express_1.Router)();
function signAccess(user) {
    const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
    return jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, secret, { expiresIn: '15m' });
}
function signRefresh(user) {
    const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
    return jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role, type: 'refresh' }, secret, { expiresIn: '7d' });
}
function setAuthCookies(res, tokens) {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('access_token', tokens.access, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        path: '/',
        maxAge: 15 * 60 * 1000,
    });
    res.cookie('refresh_token', tokens.refresh, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
}
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email().transform((v) => v.toLowerCase()),
    password: zod_1.z.string().min(6),
    displayName: zod_1.z.string().min(2),
});
exports.authRouter.post('/register', async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const { email, password, displayName } = parsed.data;
    if (memory_1.db.users.has(email))
        return res.status(409).json({ error: 'User already exists' });
    const passwordHash = await bcryptjs_1.default.hash(password, 10);
    const user = { id: `u_${Date.now()}`, email, passwordHash, displayName, role: 'user' };
    memory_1.db.users.set(email, user);
    return res.status(201).json({ ok: true });
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email().transform((v) => v.toLowerCase()),
    password: zod_1.z.string().min(6),
});
exports.authRouter.post('/login', async (req, res) => {
    let body = req.body;
    if (typeof body === 'string') {
        try {
            body = JSON.parse(body);
        }
        catch {
            try {
                const params = new URLSearchParams(body);
                body = Object.fromEntries(params.entries());
            }
            catch {
                return res.status(400).json({ error: 'Invalid request body' });
            }
        }
    }
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const { email, password } = parsed.data;
    const user = memory_1.db.users.get(email);
    if (!user)
        return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!ok)
        return res.status(401).json({ error: 'Invalid credentials' });
    const access = signAccess(user);
    const refresh = signRefresh(user);
    setAuthCookies(res, { access, refresh });
    res.json({ user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role } });
});
exports.authRouter.post('/logout', (_req, res) => {
    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie('access_token', { path: '/', sameSite: 'lax', secure: isProd });
    res.clearCookie('refresh_token', { path: '/', sameSite: 'lax', secure: isProd });
    res.status(204).end();
});
exports.authRouter.post('/refresh', (req, res) => {
    const { refresh_token } = req.cookies || {};
    if (!refresh_token)
        return res.status(401).json({ error: 'Missing refresh token' });
    try {
        const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
        const payload = jsonwebtoken_1.default.verify(refresh_token, secret);
        if (payload.type !== 'refresh')
            throw new Error('Invalid');
        const access = signAccess(payload);
        const refresh = signRefresh(payload);
        setAuthCookies(res, { access, refresh });
        res.status(204).end();
    }
    catch {
        return res.status(401).json({ error: 'Invalid refresh token' });
    }
});
//# sourceMappingURL=auth.js.map