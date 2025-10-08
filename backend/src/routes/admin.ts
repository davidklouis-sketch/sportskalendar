import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { UserRepository } from '../database/repositories/userRepository';

export const adminRouter = Router();

// All admin routes require authentication and admin role
adminRouter.use(requireAuth, requireRole('admin'));

adminRouter.get('/users', async (_req, res) => {
  try {
    const users = await UserRepository.findAll();
    const formattedUsers = users.map(u => ({ 
      id: u.id, 
      email: u.email, 
      displayName: u.displayName, 
      role: u.role,
      isPremium: u.isPremium || false,
      selectedTeams: u.selectedTeams || [],
      emailVerified: u.email_verified || false,
      twoFactorEnabled: u.two_factor_enabled || false,
      createdAt: u.created_at,
      lastLogin: u.last_login
    }));
    res.json({ users: formattedUsers });
  } catch (error) {
    console.error('Error fetching users for admin:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

adminRouter.delete('/users/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const user = await UserRepository.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    await UserRepository.delete(id);
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Promote user to admin
adminRouter.post('/promote-user', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Find the user to promote
    const user = await UserRepository.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if user is already admin
    if (user.role === 'admin') {
      return res.status(400).json({ error: 'User is already an admin' });
    }
    
    // Promote user to admin
    await UserRepository.update(userId, { role: 'admin' });
    
    res.json({ 
      success: true, 
      message: `User ${user.email} has been promoted to admin`,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: 'admin'
      }
    });
    
  } catch (error) {
    console.error('Error promoting user:', error);
    res.status(500).json({ error: 'Failed to promote user' });
  }
});

// Demote admin to user
adminRouter.post('/demote-user', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Find the user to demote
    const user = await UserRepository.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if user is not admin
    if (user.role !== 'admin') {
      return res.status(400).json({ error: 'User is not an admin' });
    }
    
    // Demote admin to user
    await UserRepository.update(userId, { role: 'user' });
    
    res.json({ 
      success: true, 
      message: `User ${user.email} has been demoted to regular user`,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: 'user'
      }
    });
    
  } catch (error) {
    console.error('Error demoting user:', error);
    res.status(500).json({ error: 'Failed to demote user' });
  }
});

// Toggle premium status
adminRouter.post('/toggle-premium', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Find the user
    const user = await UserRepository.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Toggle premium status
    const newPremiumStatus = !user.isPremium;
    await UserRepository.update(userId, { isPremium: newPremiumStatus });
    
    res.json({ 
      success: true, 
      message: `User ${user.email} premium status: ${newPremiumStatus ? 'activated' : 'deactivated'}`,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        isPremium: newPremiumStatus
      }
    });
    
  } catch (error) {
    console.error('Error toggling premium:', error);
    res.status(500).json({ error: 'Failed to toggle premium status' });
  }
});



