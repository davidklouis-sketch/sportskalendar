import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { db } from '../store/memory';

export const adminRouter = Router();

// Require admin role for all routes under /api/admin
adminRouter.use(requireAuth, requireRole('admin'));

adminRouter.get('/users', (_req, res) => {
  const users = Array.from(db.users.values()).map(u => ({ id: u.id, email: u.email, displayName: u.displayName, role: u.role }));
  res.json({ users });
});

adminRouter.delete('/users/:id', (req, res) => {
  const id = req.params.id;
  const entry = Array.from(db.users.entries()).find(([, u]) => u.id === id);
  if (!entry) return res.status(404).json({ error: 'Not found' });
  db.users.delete(entry[0]);
  res.status(204).end();
});



