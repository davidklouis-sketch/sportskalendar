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
//# sourceMappingURL=admin.js.map