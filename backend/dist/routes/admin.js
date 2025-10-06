"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const memory_1 = require("../store/memory");
exports.adminRouter = (0, express_1.Router)();
// Require admin role for all routes under /api/admin
exports.adminRouter.use(auth_1.requireAuth, (0, auth_1.requireRole)('admin'));
exports.adminRouter.get('/users', (_req, res) => {
    const users = Array.from(memory_1.db.users.values()).map(u => ({ id: u.id, email: u.email, displayName: u.displayName, role: u.role }));
    res.json({ users });
});
exports.adminRouter.delete('/users/:id', (req, res) => {
    const id = req.params.id;
    const entry = Array.from(memory_1.db.users.entries()).find(([, u]) => u.id === id);
    if (!entry)
        return res.status(404).json({ error: 'Not found' });
    memory_1.db.users.delete(entry[0]);
    res.status(204).end();
});
// Promote user to admin
exports.adminRouter.post('/promote-user', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        // Find the user to promote
        const userEntry = Array.from(memory_1.db.users.entries()).find(([, u]) => u.id === userId);
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
        if (memory_1.db.updateUser) {
            await memory_1.db.updateUser(userId, { role: 'admin' });
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
    }
    catch (error) {
        console.error('Error promoting user:', error);
        res.status(500).json({ error: 'Failed to promote user' });
    }
});
// Demote admin to user
exports.adminRouter.post('/demote-user', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        // Find the user to demote
        const userEntry = Array.from(memory_1.db.users.entries()).find(([, u]) => u.id === userId);
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
        if (memory_1.db.updateUser) {
            await memory_1.db.updateUser(userId, { role: 'user' });
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
    }
    catch (error) {
        console.error('Error demoting user:', error);
        res.status(500).json({ error: 'Failed to demote user' });
    }
});
//# sourceMappingURL=admin.js.map