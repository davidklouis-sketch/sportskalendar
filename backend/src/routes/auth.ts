import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { db, User } from '../store/memory';

export const authRouter = Router();

export function signAccess(user: { id: string; email: string; role?: 'user' | 'admin' }) {
  const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, secret, { expiresIn: '15m' });
}

export function signRefresh(user: { id: string; email: string; role?: 'user' | 'admin' }) {
  const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
  return jwt.sign({ id: user.id, email: user.email, role: user.role, type: 'refresh' }, secret, { expiresIn: '7d' });
}

export function setAuthCookies(res: Response, tokens: { access: string; refresh: string }) {
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

const registerSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase()),
  password: z.string().min(6),
  displayName: z.string().min(2),
});

authRouter.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { email, password, displayName } = parsed.data;
  if (db.users.has(email)) return res.status(409).json({ error: 'User already exists' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user: User = { id: `u_${Date.now()}`, email, passwordHash, displayName, role: 'user' };
  db.users.set(email, user);
  return res.status(201).json({ ok: true });
});

const loginSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase()),
  password: z.string().min(6),
});

authRouter.post('/login', async (req: Request, res: Response) => {
  let body: any = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      try {
        const params = new URLSearchParams(body);
        body = Object.fromEntries(params.entries());
      } catch {
        return res.status(400).json({ error: 'Invalid request body' });
      }
    }
  }
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { email, password } = parsed.data;
  const user = db.users.get(email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const access = signAccess(user);
  const refresh = signRefresh(user);
  setAuthCookies(res, { access, refresh });
  res.json({ user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role } });
});

authRouter.post('/logout', (_req: Request, res: Response) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('access_token', { path: '/', sameSite: 'lax', secure: isProd });
  res.clearCookie('refresh_token', { path: '/', sameSite: 'lax', secure: isProd });
  res.status(204).end();
});

authRouter.post('/refresh', (req: Request, res: Response) => {
  const { refresh_token } = (req as any).cookies || {};
  if (!refresh_token) return res.status(401).json({ error: 'Missing refresh token' });
  try {
    const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
    const payload = jwt.verify(refresh_token, secret) as { id: string; email: string; type?: string };
    if (payload.type !== 'refresh') throw new Error('Invalid');
    const access = signAccess(payload);
    const refresh = signRefresh(payload);
    setAuthCookies(res, { access, refresh });
    res.status(204).end();
  } catch {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
});


