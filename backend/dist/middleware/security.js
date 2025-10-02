"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commonSecurityMiddleware = void 0;
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const csrf_1 = require("./csrf");
exports.commonSecurityMiddleware = [
    (0, helmet_1.default)({
        contentSecurityPolicy: false,
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
    (0, cookie_parser_1.default)(),
    (0, express_rate_limit_1.default)({ windowMs: 60000, max: 300 }),
    // Always ensure CSRF token cookie exists for client to read and echo back
    (req, res, next) => { (0, csrf_1.issueCsrfToken)(req, res); next(); },
    // CSRF protection for state-changing routes, excluding auth endpoints
    (req, res, next) => {
        const method = req.method.toUpperCase();
        const isSafe = method === 'GET' || method === 'HEAD' || method === 'OPTIONS';
        const isAuthPath = req.path.startsWith('/api/auth');
        if (isSafe || isAuthPath)
            return next();
        return (0, csrf_1.csrfProtection)(req, res, next);
    },
];
//# sourceMappingURL=security.js.map