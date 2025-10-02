import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';

export const communityRouter = Router();

type Post = { id: string; user: string; text: string; createdAt: string; hashtags: string[] };

const posts: Post[] = [
  { id: 'p1', user: 'Demo User', text: 'Was für ein Rennen heute! #F1 #Speed', createdAt: new Date().toISOString(), hashtags: ['#F1', '#Speed'] },
  { id: 'p2', user: 'Fan123', text: 'NFL Season Hype! #NFL #Kickoff', createdAt: new Date().toISOString(), hashtags: ['#NFL', '#Kickoff'] },
];

communityRouter.get('/stream', (_req, res) => {
  res.json(posts);
});

const postSchema = z.object({ text: z.string().min(1).max(280) });

communityRouter.post('/post', requireAuth, (req, res) => {
  const parsed = postSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const user = (req as any).user as { id: string; email: string };
  const text = parsed.data.text;
  const hashtags = Array.from(new Set(Array.from(text.matchAll(/#[\p{L}0-9_]+/gu)).map(m => m[0])));
  const post: Post = { id: `p_${Date.now()}`, user: user.email, text, createdAt: new Date().toISOString(), hashtags };
  posts.unshift(post);
  res.status(201).json(post);
});



