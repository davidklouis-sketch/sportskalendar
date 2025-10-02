import { Router } from 'express';
import { z } from 'zod';
import { db, HighlightItem } from '../store/memory';
import { requireAuth, requireRole } from '../middleware/auth';

export const highlightsRouter = Router();

// List with optional filters: ?sport=F1&query=over
highlightsRouter.get('/', async (req, res) => {
  const sport = (req.query.sport as string) || '';
  const query = (req.query.query as string) || '';
  // If explicit sport is requested and we can aggregate externally, do so
  if (sport && ['F1', 'NFL'].includes(sport)) {
    try {
      const external = await fetchHighlightsForSport(sport);
      let items = external;
      if (query) items = items.filter(h => (h.title + ' ' + (h.description || '')).toLowerCase().includes(query.toLowerCase()));
      items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      return res.json({ items });
    } catch (e) {
      // fallthrough to local data if external fails
    }
  }

  let items = Array.from(db.highlights.values());
  if (sport) items = items.filter(h => h.sport.toLowerCase() === sport.toLowerCase());
  if (query) items = items.filter(h => (h.title + ' ' + (h.description || '')).toLowerCase().includes(query.toLowerCase()));
  // Sort newest first
  items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  res.json({ items });
});

// Get by id
highlightsRouter.get('/:id', (req, res) => {
  const id = req.params.id as string;
  if (!id) return res.status(400).json({ error: 'id required' });
  const item = db.highlights.get(id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

const createSchema = z.object({
  title: z.string().min(3),
  url: z.string().url(),
  sport: z.string().min(2),
  description: z.string().optional(),
});

// Create (admin)
highlightsRouter.post('/', requireAuth, requireRole('admin'), (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const id = `h_${Date.now()}`;
  const { title, url, sport, description } = parsed.data;
  const base: HighlightItem = { id, title, url, sport, createdAt: new Date().toISOString() };
  const item: HighlightItem = description !== undefined ? { ...base, description } : base;
  db.highlights.set(id, item);
  res.status(201).json(item);
});

const updateSchema = z.object({
  title: z.string().min(3).optional(),
  url: z.string().url().optional(),
  sport: z.string().min(2).optional(),
  description: z.string().optional(),
});

// Update (admin)
highlightsRouter.put('/:id', requireAuth, requireRole('admin'), (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const id = req.params.id as string;
  if (!id) return res.status(400).json({ error: 'id required' });
  const item = db.highlights.get(id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  const d = parsed.data;
  const updated: HighlightItem = {
    ...item,
    ...(d.title !== undefined ? { title: d.title } : {}),
    ...(d.url !== undefined ? { url: d.url } : {}),
    ...(d.sport !== undefined ? { sport: d.sport } : {}),
    ...(d.description !== undefined ? { description: d.description } : {}),
  };
  db.highlights.set(updated.id, updated);
  res.json(updated);
});

// Delete (admin)
highlightsRouter.delete('/:id', requireAuth, requireRole('admin'), (req, res) => {
  const id = req.params.id as string;
  if (!id) return res.status(400).json({ error: 'id required' });
  if (!db.highlights.has(id)) return res.status(404).json({ error: 'Not found' });
  db.highlights.delete(id);
  res.status(204).end();
});

async function fetchHighlightsForSport(sport: string) {
  if (sport === 'F1') {
    // Formula 1 YouTube channel RSS feed
    const channelId = 'UCB_qr75-ydFVKSF9Dmo6izg';
    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const xml = await (await fetch(feedUrl)).text();
    return parseYouTubeFeed(xml, 'F1');
  }
  if (sport === 'NFL') {
    const channelId = 'UCDVYQ4Zhbm3S2dlz7P1GBDg';
    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const xml = await (await fetch(feedUrl)).text();
    return parseYouTubeFeed(xml, 'NFL');
  }
  return [] as HighlightItem[];
}

function parseYouTubeFeed(xml: string, sport: string): HighlightItem[] {
  const entries = xml.split('<entry>').slice(1);
  const items: HighlightItem[] = [];
  for (const raw of entries) {
    const title = matchTag(raw, 'title');
    const link = matchAttr(raw, 'link', 'href');
    const published = matchTag(raw, 'published');
    // const thumb = matchAttr(raw, 'media:thumbnail', 'url');
    if (!title || !link) continue;
    const base: HighlightItem = {
      id: `${sport}_${published || Date.now()}_${title}`.slice(0, 120),
      title,
      url: link,
      sport,
      createdAt: published || new Date().toISOString(),
    };
    items.push(base);
  }
  return items;
}

function matchTag(xml: string, tag: string): string | null {
  const m = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return m?.[1] ?? null;
}

function matchAttr(xml: string, tag: string, attr: string): string | null {
  const m = xml.match(new RegExp(`<${tag}[^>]*?${attr}=\"([^\"]+)\"`));
  return m?.[1] ?? null;
}


