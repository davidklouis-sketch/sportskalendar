import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { requireAuth } from '../middleware/auth';
import { db } from '../store/memory';
import { setAuthCookies, signAccess, signRefresh } from './auth';

export const userRouter = Router();

userRouter.use(requireAuth);

const changeEmailSchema = z.object({ email: z.string().email().transform(v => v.toLowerCase()) });
userRouter.post('/change-email', (req, res) => {
  const user = (req as any).user as { id: string; email: string; role?: 'user' | 'admin' };
  const parsed = changeEmailSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const newEmail = parsed.data.email;
  if (db.users.has(newEmail)) return res.status(409).json({ error: 'Email already in use' });
  const entry = Array.from(db.users.entries()).find(([, u]) => u.id === user.id);
  if (!entry) return res.status(404).json({ error: 'User not found' });
  const [, record] = entry;
  db.users.delete(record.email);
  record.email = newEmail;
  db.users.set(newEmail, record);
  // rotate tokens with new email
  const access = signAccess(record);
  const refresh = signRefresh(record);
  setAuthCookies(res, { access, refresh });
  res.json({ user: { id: record.id, email: record.email, displayName: record.displayName, role: record.role } });
});

const changePasswordSchema = z.object({ currentPassword: z.string().min(6), newPassword: z.string().min(6) });
userRouter.post('/change-password', async (req, res) => {
  const user = (req as any).user as { id: string; email: string };
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { currentPassword, newPassword } = parsed.data;
  const record = db.users.get(user.email);
  if (!record) return res.status(404).json({ error: 'User not found' });
  const ok = await bcrypt.compare(currentPassword, record.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid current password' });
  record.passwordHash = await bcrypt.hash(newPassword, 10);
  res.json({ ok: true });
});



