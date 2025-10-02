import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { csrfProtection, issueCsrfToken } from './csrf';
import { Request, Response, NextFunction } from 'express';

export const commonSecurityMiddleware = [
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
  cookieParser(),
  rateLimit({ windowMs: 60_000, max: 300 }),
  // Always ensure CSRF token cookie exists for client to read and echo back
  (req: Request, res: Response, next: NextFunction) => { issueCsrfToken(req, res); next(); },
  // CSRF protection for state-changing routes, excluding auth endpoints
  (req: Request, res: Response, next: NextFunction) => {
    const method = req.method.toUpperCase();
    const isSafe = method === 'GET' || method === 'HEAD' || method === 'OPTIONS';
    const isAuthPath = req.path.startsWith('/api/auth');
    if (isSafe || isAuthPath) return next();
    return csrfProtection(req, res, next);
  },
];


