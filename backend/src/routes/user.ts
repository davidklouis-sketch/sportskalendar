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
  console.log('🔍 getUserByEmail called for:', email);
  
  if (!process.env.DATABASE_URL) {
    console.log('❌ No DATABASE_URL found');
    return null;
  }

  try {
    const { UserRepository } = await import('../database/repositories/userRepository');
    console.log('📖 Fetching user from PostgreSQL...');
    const pgUser = await UserRepository.findByEmail(email);
    if (pgUser) {
      console.log('✅ User found in PostgreSQL:', JSON.stringify({
        id: pgUser.id,
        email: pgUser.email,
        selectedTeams: pgUser.selectedTeams
      }, null, 2));
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
      console.log('❌ User not found in PostgreSQL');
      return null;
    }
  } catch (error) {
    console.log('❌ Could not fetch user from PostgreSQL:', error);
    return null;
  }
}

// Helper function to update user in PostgreSQL only
async function updateUser(email: string, updates: Partial<User>): Promise<void> {
  console.log('🔄 updateUser called for:', email, 'with updates:', JSON.stringify(updates, null, 2));
  
  if (!process.env.DATABASE_URL) {
    console.log('❌ No DATABASE_URL found');
    throw new Error('Database not available');
  }

  try {
    const { UserRepository } = await import('../database/repositories/userRepository');
    console.log('📝 Updating user in PostgreSQL...');
    await UserRepository.updateByEmail(email, updates);
    console.log('✅ User updated successfully in PostgreSQL');
  } catch (error) {
    console.log('❌ Could not update user in PostgreSQL:', error);
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
  const user = (req as any).user as { id: string; email: string };
  const record = await getUserByEmail(user.email);
  if (!record) return res.status(404).json({ error: 'User not found' });
  
  console.log('Profile request for user:', user.email);
  console.log('Profile - User record selectedTeams:', JSON.stringify(record.selectedTeams, null, 2));
  
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
  
  console.log('Profile - Response data:', JSON.stringify(responseData, null, 2));
  res.json(responseData);
});

// Update selected teams - use flexible schema
const updateTeamsSchema = z.object({
  teams: z.array(z.any()) // Accept any array - we'll validate structure manually
});

userRouter.post('/teams', async (req, res) => {
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
  console.log('Teams updated successfully for user:', user.email);
  console.log('Updated teams data:', JSON.stringify(teamsData, null, 2));
  
  // Verify the update by reading back from database
  const updatedRecord = await getUserByEmail(user.email);
  console.log('Verification - User record after update:', JSON.stringify(updatedRecord?.selectedTeams, null, 2));
  
  res.json({ 
    ok: true, 
    selectedTeams: teamsData 
  });
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



