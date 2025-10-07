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

// Get user profile with premium status and selected teams
userRouter.get('/profile', (req, res) => {
  const user = (req as any).user as { id: string; email: string };
  const record = db.users.get(user.email);
  if (!record) return res.status(404).json({ error: 'User not found' });
  res.json({ 
    user: { 
      id: record.id, 
      email: record.email, 
      displayName: record.displayName, 
      role: record.role,
      isPremium: record.isPremium || false,
      selectedTeams: record.selectedTeams || []
    } 
  });
});

// Update selected teams - use flexible schema
const updateTeamsSchema = z.object({
  teams: z.array(z.any()) // Accept any array - we'll validate structure manually
});

userRouter.post('/teams', (req, res) => {
  const user = (req as any).user as { id: string; email: string };
  
  // Log the request body for debugging
  console.log('Received teams update:', JSON.stringify(req.body, null, 2));
  
  // Convert object to array if needed (Axios sometimes sends arrays as objects)
  let teamsData = req.body.teams;
  if (teamsData && typeof teamsData === 'object' && !Array.isArray(teamsData)) {
    // Convert object with numeric keys to array
    teamsData = Object.values(teamsData);
    console.log('Converted object to array:', JSON.stringify(teamsData, null, 2));
  }
  
  // Validate it's an array now
  if (!Array.isArray(teamsData)) {
    return res.status(400).json({
      error: 'Invalid format',
      message: 'teams must be an array'
    });
  }
  
  // Basic validation - each team should have sport and teamName
  for (const team of teamsData) {
    if (!team.sport || !team.teamName) {
      return res.status(400).json({
        error: 'Invalid team data',
        message: 'Each team must have sport and teamName'
      });
    }
    if (!['football', 'nfl', 'f1'].includes(team.sport)) {
      return res.status(400).json({
        error: 'Invalid sport',
        message: 'Sport must be football, nfl, or f1'
      });
    }
  }
  
  const record = db.users.get(user.email);
  if (!record) return res.status(404).json({ error: 'User not found' });
  
  // Free users can only have 1 team
  if (!record.isPremium && teamsData.length > 1) {
    return res.status(403).json({ 
      error: 'Premium required', 
      message: 'Free users can only select one team. Upgrade to Premium for multiple teams.' 
    });
  }
  
  record.selectedTeams = teamsData;
  console.log('Teams updated successfully for user:', user.email);
  res.json({ 
    ok: true, 
    selectedTeams: record.selectedTeams 
  });
});

// Upgrade to premium (for demo purposes - in production this would be a payment flow)
userRouter.post('/upgrade-premium', (req, res) => {
  const user = (req as any).user as { id: string; email: string };
  const record = db.users.get(user.email);
  if (!record) return res.status(404).json({ error: 'User not found' });
  
  record.isPremium = true;
  res.json({ 
    ok: true, 
    message: 'Successfully upgraded to Premium',
    isPremium: true
  });
});



