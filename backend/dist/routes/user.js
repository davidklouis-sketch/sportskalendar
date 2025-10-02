"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const auth_1 = require("../middleware/auth");
const memory_1 = require("../store/memory");
const auth_2 = require("./auth");
exports.userRouter = (0, express_1.Router)();
exports.userRouter.use(auth_1.requireAuth);
const changeEmailSchema = zod_1.z.object({ email: zod_1.z.string().email().transform(v => v.toLowerCase()) });
exports.userRouter.post('/change-email', (req, res) => {
    const user = req.user;
    const parsed = changeEmailSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const newEmail = parsed.data.email;
    if (memory_1.db.users.has(newEmail))
        return res.status(409).json({ error: 'Email already in use' });
    const entry = Array.from(memory_1.db.users.entries()).find(([, u]) => u.id === user.id);
    if (!entry)
        return res.status(404).json({ error: 'User not found' });
    const [, record] = entry;
    memory_1.db.users.delete(record.email);
    record.email = newEmail;
    memory_1.db.users.set(newEmail, record);
    // rotate tokens with new email
    const access = (0, auth_2.signAccess)(record);
    const refresh = (0, auth_2.signRefresh)(record);
    (0, auth_2.setAuthCookies)(res, { access, refresh });
    res.json({ user: { id: record.id, email: record.email, displayName: record.displayName, role: record.role } });
});
const changePasswordSchema = zod_1.z.object({ currentPassword: zod_1.z.string().min(6), newPassword: zod_1.z.string().min(6) });
exports.userRouter.post('/change-password', async (req, res) => {
    const user = req.user;
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const { currentPassword, newPassword } = parsed.data;
    const record = memory_1.db.users.get(user.email);
    if (!record)
        return res.status(404).json({ error: 'User not found' });
    const ok = await bcryptjs_1.default.compare(currentPassword, record.passwordHash);
    if (!ok)
        return res.status(401).json({ error: 'Invalid current password' });
    record.passwordHash = await bcryptjs_1.default.hash(newPassword, 10);
    res.json({ ok: true });
});
//# sourceMappingURL=user.js.map