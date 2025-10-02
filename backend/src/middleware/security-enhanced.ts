import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { Request, Response, NextFunction } from 'express';

// Enhanced security middleware
export const enhancedSecurityMiddleware = [
  // Security headers
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }),
  
  // Cookie parser
  cookieParser(),
  
  // General rate limiting
  rateLimit({ 
    windowMs: 60_000, 
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  }),
  
  // Request size limiting
  (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    if (contentLength > 1024 * 1024) { // 1MB limit
      return res.status(413).json({ error: 'Request too large' });
    }
    next();
  },
  
  // Input sanitization
  (req: Request, res: Response, next: NextFunction) => {
    // Basic XSS protection
    const sanitize = (obj: any): any => {
      if (typeof obj === 'string') {
        return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      }
      if (typeof obj === 'object' && obj !== null) {
        const sanitized: any = {};
        for (const key in obj) {
          sanitized[key] = sanitize(obj[key]);
        }
        return sanitized;
      }
      return obj;
    };
    
    req.body = sanitize(req.body);
    // req.query is read-only, so we sanitize individual properties
    if (req.query) {
      Object.keys(req.query).forEach(key => {
        if (typeof req.query[key] === 'string') {
          req.query[key] = sanitize(req.query[key]);
        }
      });
    }
    req.params = sanitize(req.params);
    next();
  }
];

// Auth-specific rate limiting
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per IP
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Password validation
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Check against common passwords
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common, please choose a stronger password');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// JWT Secret validation
export function validateJwtSecret(): boolean {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    console.error('❌ JWT_SECRET environment variable is not set');
    return false;
  }
  
  if (secret === 'dev_secret_change_me') {
    console.error('❌ JWT_SECRET is still using the default value');
    return false;
  }
  
  if (secret.length < 32) {
    console.error('❌ JWT_SECRET must be at least 32 characters long');
    return false;
  }
  
  return true;
}

// Session management
export class SessionManager {
  private static blacklistedTokens = new Set<string>();
  
  static blacklistToken(token: string): void {
    this.blacklistedTokens.add(token);
  }
  
  static isTokenBlacklisted(token: string): boolean {
    return this.blacklistedTokens.has(token);
  }
  
  static clearExpiredTokens(): void {
    // In production, this should be handled by a proper session store
    // For now, we'll clear the set periodically
    if (this.blacklistedTokens.size > 1000) {
      this.blacklistedTokens.clear();
    }
  }
}
