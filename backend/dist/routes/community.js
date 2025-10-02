"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.communityRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
exports.communityRouter = (0, express_1.Router)();
const posts = [
    { id: 'p1', user: 'Demo User', text: 'Was für ein Rennen heute! #F1 #Speed', createdAt: new Date().toISOString(), hashtags: ['#F1', '#Speed'] },
    { id: 'p2', user: 'Fan123', text: 'NFL Season Hype! #NFL #Kickoff', createdAt: new Date().toISOString(), hashtags: ['#NFL', '#Kickoff'] },
];
exports.communityRouter.get('/stream', (_req, res) => {
    res.json(posts);
});
const postSchema = zod_1.z.object({ text: zod_1.z.string().min(1).max(280) });
exports.communityRouter.post('/post', auth_1.requireAuth, (req, res) => {
    const parsed = postSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const user = req.user;
    const text = parsed.data.text;
    const hashtags = Array.from(new Set(Array.from(text.matchAll(/#[\p{L}0-9_]+/gu)).map(m => m[0])));
    const post = { id: `p_${Date.now()}`, user: user.email, text, createdAt: new Date().toISOString(), hashtags };
    posts.unshift(post);
    res.status(201).json(post);
});
//# sourceMappingURL=community.js.map