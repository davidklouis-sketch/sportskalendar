import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { SessionManager } from './security-enhanced';

export interface JwtUser {
  id: string;
  email: string;
  role?: 'user' | 'admin';
  iat?: number;
  exp?: number;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization || '';
    let token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      token = (req as any).cookies?.['access_token'] || null;
    }
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'No valid token provided' 
      });
    }
    
    // Check if token is blacklisted
    if (SessionManager.isTokenBlacklisted(token)) {
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
    
    const payload = jwt.verify(token, secret, {
      issuer: 'sportskalendar',
      audience: 'sportskalendar-users'
    }) as JwtUser;
    
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
    
    (req as any).user = payload;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(401).json({ 
      error: 'Invalid token',
      message: 'Token verification failed' 
    });
  }
}

export function requireRole(role: 'user' | 'admin') {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as JwtUser | undefined;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    // If role missing in token, try to load from database (handles old tokens)
    if (!user.role) {
      try {
        const { UserRepository } = await import('../database/repositories/userRepository');
        const real = await UserRepository.findByEmail(user.email);
        if (real?.role) {
          user.role = real.role;
        }
      } catch {}
    }
    if (user.role !== role) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}


