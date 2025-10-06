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
const security_enhanced_1 = require("../middleware/security-enhanced");
exports.authRouter = (0, express_1.Router)();
function signAccess(user) {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret === 'dev_secret_change_me') {
        throw new Error('JWT_SECRET not properly configured');
    }
    return jsonwebtoken_1.default.sign({
        id: user.id,
        email: user.email,
        role: user.role,
        iat: Math.floor(Date.now() / 1000)
    }, secret, {
        expiresIn: '15m',
        issuer: 'sportskalendar',
        audience: 'sportskalendar-users'
    });
}
function signRefresh(user) {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret === 'dev_secret_change_me') {
        throw new Error('JWT_SECRET not properly configured');
    }
    return jsonwebtoken_1.default.sign({
        id: user.id,
        email: user.email,
        role: user.role,
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000)
    }, secret, {
        expiresIn: '7d',
        issuer: 'sportskalendar',
        audience: 'sportskalendar-users'
    });
}
function setAuthCookies(res, tokens) {
    // Always use secure cookies for HTTPS environments
    const isHttps = process.env.NODE_ENV === 'production' || process.env.FORCE_HTTPS === 'true';
    res.cookie('access_token', tokens.access, {
        httpOnly: true,
        secure: isHttps,
        sameSite: 'lax',
        path: '/',
        maxAge: 15 * 60 * 1000,
    });
    res.cookie('refresh_token', tokens.refresh, {
        httpOnly: true,
        secure: isHttps,
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
}
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email().transform((v) => v.toLowerCase().trim()),
    password: zod_1.z.string().min(8),
    displayName: zod_1.z.string().min(2).max(50).trim(),
});
exports.authRouter.post('/register', security_enhanced_1.authRateLimit, async (req, res) => {
    try {
        const parsed = registerSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                error: 'Invalid input',
                details: parsed.error.flatten()
            });
        }
        const { email, password, displayName } = parsed.data;
        // Validate password strength
        const passwordValidation = (0, security_enhanced_1.validatePassword)(password);
        if (!passwordValidation.valid) {
            return res.status(400).json({
                error: 'Password does not meet requirements',
                details: passwordValidation.errors
            });
        }
        // Check if user already exists
        if (memory_1.db.users.has(email)) {
            return res.status(409).json({
                error: 'User already exists',
                message: 'An account with this email already exists'
            });
        }
        // Hash password with higher salt rounds
        const passwordHash = await bcryptjs_1.default.hash(password, 12);
        const user = {
            id: `u_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            email,
            passwordHash,
            displayName,
            role: 'user'
        };
        memory_1.db.users.set(email, user);
        // Don't return sensitive data
        return res.status(201).json({
            success: true,
            message: 'User registered successfully'
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: 'Registration failed'
        });
    }
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email().transform((v) => v.toLowerCase().trim()),
    password: zod_1.z.string().min(1),
});
exports.authRouter.post('/login', security_enhanced_1.authRateLimit, async (req, res) => {
    try {
        // Validate JWT secret
        if (!(0, security_enhanced_1.validateJwtSecret)()) {
            return res.status(500).json({
                error: 'Server configuration error',
                message: 'Authentication service unavailable'
            });
        }
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
                    return res.status(400).json({
                        error: 'Invalid request format',
                        message: 'Request body must be valid JSON'
                    });
                }
            }
        }
        const parsed = loginSchema.safeParse(body);
        if (!parsed.success) {
            return res.status(400).json({
                error: 'Invalid input',
                details: parsed.error.flatten()
            });
        }
        const { email, password } = parsed.data;
        // Find user
        const user = memory_1.db.users.get(email);
        if (!user) {
            // Simulate password check to prevent timing attacks
            await bcryptjs_1.default.compare(password, '$2a$12$dummy.hash.to.prevent.timing.attacks');
            return res.status(401).json({
                error: 'Invalid credentials',
                message: 'Email or password is incorrect'
            });
        }
        // Verify password
        const passwordValid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!passwordValid) {
            return res.status(401).json({
                error: 'Invalid credentials',
                message: 'Email or password is incorrect'
            });
        }
        // Generate tokens
        const access = signAccess(user);
        const refresh = signRefresh(user);
        // Set secure cookies
        setAuthCookies(res, { access, refresh });
        // Return user data (without sensitive information)
        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                displayName: user.displayName,
                role: user.role
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: 'Login failed'
        });
    }
});
exports.authRouter.post('/logout', (req, res) => {
    try {
        // Blacklist the current access token
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
        if (token) {
            security_enhanced_1.SessionManager.blacklistToken(token);
        }
        // Also check cookies
        const cookieToken = req.cookies?.['access_token'];
        if (cookieToken) {
            security_enhanced_1.SessionManager.blacklistToken(cookieToken);
        }
        const isProd = process.env.NODE_ENV === 'production';
        res.clearCookie('access_token', {
            path: '/',
            sameSite: 'lax',
            secure: isProd,
            httpOnly: true
        });
        res.clearCookie('refresh_token', {
            path: '/',
            sameSite: 'lax',
            secure: isProd,
            httpOnly: true
        });
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    }
    catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Logout failed'
        });
    }
});
exports.authRouter.post('/refresh', (req, res) => {
    try {
        const { refresh_token } = req.cookies || {};
        if (!refresh_token) {
            return res.status(401).json({
                error: 'Missing refresh token',
                message: 'Refresh token not found'
            });
        }
        // Check if token is blacklisted
        if (security_enhanced_1.SessionManager.isTokenBlacklisted(refresh_token)) {
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
        const payload = jsonwebtoken_1.default.verify(refresh_token, secret, {
            issuer: 'sportskalendar',
            audience: 'sportskalendar-users'
        });
        if (payload.type !== 'refresh') {
            return res.status(401).json({
                error: 'Invalid token type',
                message: 'Token is not a refresh token'
            });
        }
        // Blacklist the old refresh token
        security_enhanced_1.SessionManager.blacklistToken(refresh_token);
        // Generate new tokens
        const access = signAccess(payload);
        const refresh = signRefresh(payload);
        // Set new cookies
        setAuthCookies(res, { access, refresh });
        res.json({
            success: true,
            message: 'Tokens refreshed successfully'
        });
    }
    catch (error) {
        console.error('Token refresh error:', error);
        return res.status(401).json({
            error: 'Invalid refresh token',
            message: 'Token refresh failed'
        });
    }
});
//# sourceMappingURL=auth.js.map