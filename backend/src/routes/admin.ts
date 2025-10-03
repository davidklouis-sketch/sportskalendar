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

// Promote user to admin
adminRouter.post('/promote-user', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Find the user to promote
    const userEntry = Array.from(db.users.entries()).find(([, u]) => u.id === userId);
    if (!userEntry) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const [, user] = userEntry;
    
    // Check if user is already admin
    if (user.role === 'admin') {
      return res.status(400).json({ error: 'User is already an admin' });
    }
    
    // Promote user to admin
    user.role = 'admin';
    user.updatedAt = new Date();
    
    // Update in database (if using database)
    if (db.updateUser) {
      await db.updateUser(userId, { role: 'admin' });
    }
    
    res.json({ 
      success: true, 
      message: `User ${user.email} has been promoted to admin`,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role
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
    const userEntry = Array.from(db.users.entries()).find(([, u]) => u.id === userId);
    if (!userEntry) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const [, user] = userEntry;
    
    // Check if user is not admin
    if (user.role !== 'admin') {
      return res.status(400).json({ error: 'User is not an admin' });
    }
    
    // Demote admin to user
    user.role = 'user';
    user.updatedAt = new Date();
    
    // Update in database (if using database)
    if (db.updateUser) {
      await db.updateUser(userId, { role: 'user' });
    }
    
    res.json({ 
      success: true, 
      message: `User ${user.email} has been demoted to regular user`,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('Error demoting user:', error);
    res.status(500).json({ error: 'Failed to demote user' });
  }
});



