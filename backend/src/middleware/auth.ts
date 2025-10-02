import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export interface JwtUser {
  id: string;
  email: string;
  role?: 'user' | 'admin';
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || '';
  let token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    token = (req as any).cookies?.['access_token'] || null;
  }
  if (!token) {
    return res.status(401).json({ error: 'Missing token' });
  }
  try {
    const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
    const payload = jwt.verify(token, secret) as JwtUser;
    (req as any).user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireRole(role: 'user' | 'admin') {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as JwtUser | undefined;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    // If role missing in token, try to load from store (handles old tokens)
    if (!user.role) {
      try {
        const { db } = require('../store/memory');
        const real = db.users.get(user.email);
        if (real?.role) {
          user.role = real.role;
        }
      } catch {}
    }
    if (user.role !== role) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}


