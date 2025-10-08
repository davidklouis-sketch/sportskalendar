import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { requireAuth } from '../middleware/auth';
import { setAuthCookies, signAccess, signRefresh } from './auth';

interface User {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  role: 'user' | 'admin';
  isPremium?: boolean;
  selectedTeams?: Array<{
    sport: 'football' | 'nfl' | 'f1';
    teamName: string;
  }>;
}

// Helper function to get user from PostgreSQL only
async function getUserByEmail(email: string): Promise<User | null> {
  if (!process.env.DATABASE_URL) {
    console.log('❌ No DATABASE_URL found');
    return null;
  }

  try {
    const { UserRepository } = await import('../database/repositories/userRepository');
    const pgUser = await UserRepository.findByEmail(email);
    if (pgUser) {
      return {
        id: pgUser.id,
        email: pgUser.email,
        passwordHash: pgUser.passwordHash,
        displayName: pgUser.displayName,
        role: pgUser.role as 'user' | 'admin',
        isPremium: pgUser.isPremium || false,
        selectedTeams: pgUser.selectedTeams || []
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('❌ Could not fetch user from PostgreSQL:', error);
    return null;
  }
}

// Helper function to update user in PostgreSQL only
async function updateUser(email: string, updates: Partial<User>): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error('Database not available');
  }

  try {
    const { UserRepository } = await import('../database/repositories/userRepository');
    await UserRepository.updateByEmail(email, updates);
  } catch (error) {
    console.error('❌ Could not update user in PostgreSQL:', error);
    throw error;
  }
}

export const userRouter = Router();

userRouter.use(requireAuth);

const changeEmailSchema = z.object({ email: z.string().email().transform(v => v.toLowerCase()) });
userRouter.post('/change-email', async (req, res) => {
  const user = (req as any).user as { id: string; email: string; role?: 'user' | 'admin' };
  const parsed = changeEmailSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const newEmail = parsed.data.email;
  
  // Check if new email is already in use
  const existingUser = await getUserByEmail(newEmail);
  if (existingUser) return res.status(409).json({ error: 'Email already in use' });
  
  const record = await getUserByEmail(user.email);
  if (!record) return res.status(404).json({ error: 'User not found' });
  
  // Update email in database
  await updateUser(user.email, { email: newEmail });
  
  // Create updated record for token generation
  const updatedRecord = { ...record, email: newEmail };
  
  // rotate tokens with new email
  const access = signAccess(updatedRecord);
  const refresh = signRefresh(updatedRecord);
  setAuthCookies(res, { access, refresh });
  res.json({ user: { id: updatedRecord.id, email: updatedRecord.email, displayName: updatedRecord.displayName, role: updatedRecord.role } });
});

const changePasswordSchema = z.object({ currentPassword: z.string().min(6), newPassword: z.string().min(6) });
userRouter.post('/change-password', async (req, res) => {
  const user = (req as any).user as { id: string; email: string };
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { currentPassword, newPassword } = parsed.data;
  const record = await getUserByEmail(user.email);
  if (!record) return res.status(404).json({ error: 'User not found' });
  const ok = await bcrypt.compare(currentPassword, record.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid current password' });
  const newPasswordHash = await bcrypt.hash(newPassword, 10);
  await updateUser(user.email, { passwordHash: newPasswordHash });
  res.json({ ok: true });
});

// Get user profile with premium status and selected teams
userRouter.get('/profile', async (req, res) => {
  try {
    const user = (req as any).user as { id: string; email: string };
    const record = await getUserByEmail(user.email);
    if (!record) return res.status(404).json({ error: 'User not found' });
    
    const responseData = { 
      user: { 
        id: record.id, 
        email: record.email, 
        displayName: record.displayName, 
        role: record.role,
        isPremium: record.isPremium || false,
        selectedTeams: record.selectedTeams || []
      } 
    };
    
    res.json(responseData);
  } catch (error) {
    console.error('Profile endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update selected teams - use flexible schema
const updateTeamsSchema = z.object({
  teams: z.array(z.any()) // Accept any array - we'll validate structure manually
});

userRouter.post('/teams', async (req, res) => {
  try {
    const user = (req as any).user as { id: string; email: string };
    
    // Convert object to array if needed (Axios sometimes sends arrays as objects)
    let teamsData = req.body.teams;
    if (teamsData && typeof teamsData === 'object' && !Array.isArray(teamsData)) {
      teamsData = Object.values(teamsData);
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
    
    const record = await getUserByEmail(user.email);
    if (!record) return res.status(404).json({ error: 'User not found' });
    
    // Free users can only have 1 team
    if (!record.isPremium && teamsData.length > 1) {
      return res.status(403).json({ 
        error: 'Premium required', 
        message: 'Free users can only select one team. Upgrade to Premium for multiple teams.' 
      });
    }
    
    await updateUser(user.email, { selectedTeams: teamsData });
    
    res.json({ 
      ok: true, 
      selectedTeams: teamsData 
    });
  } catch (error) {
    console.error('Teams update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upgrade to premium (for demo purposes - in production this would be a payment flow)
userRouter.post('/upgrade-premium', async (req, res) => {
  const user = (req as any).user as { id: string; email: string };
  const record = await getUserByEmail(user.email);
  if (!record) return res.status(404).json({ error: 'User not found' });
  
  await updateUser(user.email, { isPremium: true });
  res.json({ 
    ok: true, 
    message: 'Successfully upgraded to Premium',
    isPremium: true
  });
});



