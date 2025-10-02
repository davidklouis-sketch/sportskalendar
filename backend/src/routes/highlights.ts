import { Router } from 'express';
import { z } from 'zod';
import { db, HighlightItem } from '../store/memory';
import { requireAuth, requireRole } from '../middleware/auth';
import { parseString } from 'xml2js';

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

// Cache for video feeds to avoid rate limiting
const videoCache = new Map<string, { data: HighlightItem[]; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Video source configurations
const VIDEO_SOURCES = {
  'F1': [
    { name: 'Formula 1 Official', channelId: 'UCB_qr75-ydFVKSF9Dmo6izg', priority: 'high' },
    { name: 'F1 Highlights', channelId: 'UCB_qr75-ydFVKSF9Dmo6izg', priority: 'medium' }
  ],
  'NFL': [
    { name: 'NFL Official', channelId: 'UCDVYQ4Zhbm3S2dlz7P1GBDg', priority: 'high' },
    { name: 'NFL Network', channelId: 'UCDVYQ4Zhbm3S2dlz7P1GBDg', priority: 'medium' }
  ],
  'Fußball': [
    { name: 'Bundesliga', channelId: 'UCB_qr75-ydFVKSF9Dmo6izg', priority: 'high' },
    { name: 'Premier League', channelId: 'UCB_qr75-ydFVKSF9Dmo6izg', priority: 'high' },
    { name: 'Champions League', channelId: 'UCB_qr75-ydFVKSF9Dmo6izg', priority: 'high' }
  ],
  'Basketball': [
    { name: 'NBA Official', channelId: 'UCB_qr75-ydFVKSF9Dmo6izg', priority: 'high' },
    { name: 'NBA Highlights', channelId: 'UCB_qr75-ydFVKSF9Dmo6izg', priority: 'medium' }
  ],
  'Tennis': [
    { name: 'ATP Tour', channelId: 'UCB_qr75-ydFVKSF9Dmo6izg', priority: 'high' },
    { name: 'WTA Tour', channelId: 'UCB_qr75-ydFVKSF9Dmo6izg', priority: 'high' }
  ]
};

async function fetchHighlightsForSport(sport: string) {
  try {
    // Check cache first
    const cacheKey = `highlights_${sport}`;
    const cached = videoCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    const sources = VIDEO_SOURCES[sport as keyof typeof VIDEO_SOURCES] || [];
    const allHighlights: HighlightItem[] = [];

    // Fetch from all sources in parallel
    const promises = sources.map(async (source) => {
      try {
        const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${source.channelId}`;
        const response = await fetch(feedUrl, {
          headers: {
            'User-Agent': 'SportsKalender/1.0 (https://sportskalendar.com)'
          }
        });
        
        if (!response.ok) {
          throw new Error(`YouTube feed ${source.name} returned ${response.status}`);
        }

        const xml = await response.text();
        const highlights = await parseYouTubeFeedAsync(xml, sport, source.name, source.priority);
        return highlights;
      } catch (error) {
        console.error(`Error fetching ${source.name} for ${sport}:`, error);
        return [];
      }
    });

    const results = await Promise.all(promises);
    results.forEach(highlights => allHighlights.push(...highlights));

    // Sort by priority and date
    allHighlights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 1;
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 1;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
    });

    // Cache the result
    videoCache.set(cacheKey, { data: allHighlights, timestamp: Date.now() });
    return allHighlights.slice(0, 20); // Limit to 20 items per sport
  } catch (error) {
    console.error(`Error fetching highlights for ${sport}:`, error);
    return [];
  }
}

async function parseYouTubeFeedAsync(xml: string, sport: string, source: string, priority: string): Promise<HighlightItem[]> {
  try {
    const result = await new Promise<any>((resolve, reject) => {
      parseString(xml, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    const entries = result.feed?.entry || [];
    const items: HighlightItem[] = [];

    for (const entry of entries.slice(0, 10)) { // Limit to 10 per source
      const title = entry.title?.[0]?._ || entry.title?.[0];
      const link = entry.link?.[0]?.$?.href;
      const published = entry.published?.[0];
      const thumbnail = entry['media:group']?.[0]?.['media:thumbnail']?.[0]?.$?.url;
      const duration = entry['media:group']?.[0]?.['media:content']?.[0]?.$?.duration;
      const views = entry['yt:statistics']?.[0]?.$?.viewCount;

      if (!title || !link) continue;

      const item: HighlightItem = {
        id: `${sport}_${source}_${published || Date.now()}_${title}`.slice(0, 120),
        title: title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
        url: link,
        sport,
        createdAt: published || new Date().toISOString(),
        thumbnail: thumbnail || undefined,
        duration: duration ? formatDuration(parseInt(duration)) : undefined,
        views: views ? parseInt(views) : undefined,
        description: entry['media:group']?.[0]?.['media:description']?.[0] || undefined,
        priority: priority as 'high' | 'medium' | 'low'
      };

      items.push(item);
    }

    return items;
  } catch (error) {
    console.error(`Error parsing YouTube feed for ${sport}:`, error);
    return [];
  }
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

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function matchTag(xml: string, tag: string): string | null {
  const m = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return m?.[1] ?? null;
}

function matchAttr(xml: string, tag: string, attr: string): string | null {
  const m = xml.match(new RegExp(`<${tag}[^>]*?${attr}=\"([^\"]+)\"`));
  return m?.[1] ?? null;
}


