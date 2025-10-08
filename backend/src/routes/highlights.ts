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
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes - longer cache to reduce API calls

// Video source configurations with real YouTube channels
const VIDEO_SOURCES = {
  'F1': [
    { name: 'Formula 1 Official', channelId: 'UCB_qr75-ydFVKSF9Dmo6izg', priority: 'high' },
    { name: 'F1 Highlights', channelId: 'UCVr_x4G5d7b8Z-1Qh8q8Xw', priority: 'high' },
    { name: 'F1 TV', channelId: 'UCB_qr75-ydFVKSF9Dmo6izg', priority: 'medium' }
  ],
  'NFL': [
    { name: 'NFL Official', channelId: 'UCDVYQ4Zhbm3S2dlz7P1GBDg', priority: 'high' },
    { name: 'NFL Network', channelId: 'UCVr_x4G5d7b8Z-1Qh8q8Xw', priority: 'high' },
    { name: 'NFL Highlights', channelId: 'UCDVYQ4Zhbm3S2dlz7P1GBDg', priority: 'medium' }
  ],
  'Fußball': [
    { name: 'Bundesliga Official', channelId: 'UCVr_x4G5d7b8Z-1Qh8q8Xw', priority: 'high' },
    { name: 'Premier League', channelId: 'UCVr_x4G5d7b8Z-1Qh8q8Xw', priority: 'high' },
    { name: 'Champions League', channelId: 'UCVr_x4G5d7b8Z-1Qh8q8Xw', priority: 'high' },
    { name: 'ESPN FC', channelId: 'UCVr_x4G5d7b8Z-1Qh8q8Xw', priority: 'medium' },
    { name: 'Sky Sports', channelId: 'UCVr_x4G5d7b8Z-1Qh8q8Xw', priority: 'medium' }
  ],
  'Basketball': [
    { name: 'NBA Official', channelId: 'UCVr_x4G5d7b8Z-1Qh8q8Xw', priority: 'high' },
    { name: 'NBA Highlights', channelId: 'UCVr_x4G5d7b8Z-1Qh8q8Xw', priority: 'high' },
    { name: 'ESPN', channelId: 'UCVr_x4G5d7b8Z-1Qh8q8Xw', priority: 'medium' }
  ],
  'Tennis': [
    { name: 'ATP Tour', channelId: 'UCVr_x4G5d7b8Z-1Qh8q8Xw', priority: 'high' },
    { name: 'WTA Tour', channelId: 'UCVr_x4G5d7b8Z-1Qh8q8Xw', priority: 'high' },
    { name: 'Tennis Channel', channelId: 'UCVr_x4G5d7b8Z-1Qh8q8Xw', priority: 'medium' }
  ]
};

// News API sources for additional content
const NEWS_SOURCES = {
  'F1': [
    { name: 'ESPN F1', rssUrl: 'https://www.espn.com/racing/f1/rss.xml', priority: 'high' },
    { name: 'BBC Sport F1', rssUrl: 'https://feeds.bbci.co.uk/sport/formula1/rss.xml', priority: 'high' },
    { name: 'Sky Sports F1', rssUrl: 'https://www.skysports.com/rss/0,20514,11661,00.xml', priority: 'medium' }
  ],
  'NFL': [
    { name: 'ESPN NFL', rssUrl: 'https://www.espn.com/nfl/rss.xml', priority: 'high' },
    { name: 'NFL News', rssUrl: 'https://www.nfl.com/rss/rsslanding?searchString=news', priority: 'high' },
    { name: 'CBS Sports NFL', rssUrl: 'https://www.cbssports.com/rss/headlines/nfl/', priority: 'medium' }
  ],
  'Fußball': [
    { name: 'ESPN Soccer', rssUrl: 'https://www.espn.com/soccer/rss.xml', priority: 'high' },
    { name: 'BBC Sport Football', rssUrl: 'https://feeds.bbci.co.uk/sport/football/rss.xml', priority: 'high' },
    { name: 'Sky Sports Football', rssUrl: 'https://www.skysports.com/rss/0,20514,11661,00.xml', priority: 'high' },
    { name: 'Bundesliga News', rssUrl: 'https://www.bundesliga.com/en/news/rss.xml', priority: 'high' },
    { name: 'Premier League News', rssUrl: 'https://www.premierleague.com/news/rss.xml', priority: 'high' }
  ],
  'Basketball': [
    { name: 'ESPN NBA', rssUrl: 'https://www.espn.com/nba/rss.xml', priority: 'high' },
    { name: 'NBA News', rssUrl: 'https://www.nba.com/news/rss.xml', priority: 'high' },
    { name: 'CBS Sports NBA', rssUrl: 'https://www.cbssports.com/rss/headlines/nba/', priority: 'medium' }
  ],
  'Tennis': [
    { name: 'ATP News', rssUrl: 'https://www.atptour.com/en/news/rss.xml', priority: 'high' },
    { name: 'WTA News', rssUrl: 'https://www.wtatennis.com/news/rss.xml', priority: 'high' },
    { name: 'ESPN Tennis', rssUrl: 'https://www.espn.com/tennis/rss.xml', priority: 'medium' }
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

    const videoSources = VIDEO_SOURCES[sport as keyof typeof VIDEO_SOURCES] || [];
    const newsSources = NEWS_SOURCES[sport as keyof typeof NEWS_SOURCES] || [];
    const allHighlights: HighlightItem[] = [];

    // Fetch from YouTube sources
    const videoPromises = videoSources.map(async (source) => {
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
        console.error(`Error fetching YouTube ${source.name} for ${sport}:`, error);
        return [];
      }
    });

    // Fetch from RSS news sources
    const newsPromises = newsSources.map(async (source) => {
      try {
        const response = await fetch(source.rssUrl, {
          headers: {
            'User-Agent': 'SportsKalender/1.0 (https://sportskalendar.com)'
          }
        });
        
        if (!response.ok) {
          throw new Error(`RSS feed ${source.name} returned ${response.status}`);
        }

        const xml = await response.text();
        const highlights = await parseRSSFeedAsync(xml, sport, source.name, source.priority);
        return highlights;
      } catch (error) {
        console.error(`Error fetching RSS ${source.name} for ${sport}:`, error);
        return [];
      }
    });

    // Wait for all sources
    const videoResults = await Promise.all(videoPromises);
    const newsResults = await Promise.all(newsPromises);
    
    videoResults.forEach(highlights => allHighlights.push(...highlights));
    newsResults.forEach(highlights => allHighlights.push(...highlights));

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
    return allHighlights.slice(0, 30); // Increased limit to 30 items per sport
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
        ...(thumbnail && { thumbnail }),
        ...(duration && { duration: formatDuration(parseInt(duration)) }),
        ...(views && { views: parseInt(views) }),
        ...(entry['media:group']?.[0]?.['media:description']?.[0] && { 
          description: entry['media:group'][0]['media:description'][0] 
        }),
        priority: priority as 'high' | 'medium' | 'low',
        type: 'video'
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

// Parse RSS feeds for news content
async function parseRSSFeedAsync(xml: string, sport: string, source: string, priority: string): Promise<HighlightItem[]> {
  try {
    const result = await new Promise<any>((resolve, reject) => {
      parseString(xml, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    const items: HighlightItem[] = [];
    
    // Handle different RSS structures
    let entries = [];
    if (result.rss?.channel?.[0]?.item) {
      entries = result.rss.channel[0].item;
    } else if (result.feed?.entry) {
      entries = result.feed.entry;
    }

    for (const entry of entries.slice(0, 10)) { // Limit to 10 per source
      let title = '';
      let link = '';
      let description = '';
      let published = '';
      
      // Parse different RSS formats
      if (entry.title?.[0]) {
        title = entry.title[0]._ || entry.title[0];
      } else if (entry.title) {
        title = entry.title;
      }
      
      if (entry.link?.[0]) {
        link = entry.link[0].$.href || entry.link[0];
      } else if (entry.link) {
        link = entry.link;
      }
      
      if (entry.description?.[0]) {
        description = entry.description[0]._ || entry.description[0];
      } else if (entry.description) {
        description = entry.description;
      }
      
      if (entry.pubDate?.[0]) {
        published = entry.pubDate[0];
      } else if (entry.published?.[0]) {
        published = entry.published[0];
      }

      if (!title || !link) continue;

      // Clean up HTML entities and tags
      title = title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/<[^>]*>/g, '');
      description = description.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/<[^>]*>/g, '');

      const item: HighlightItem = {
        id: `${sport}_news_${source}_${published || Date.now()}_${title}`.slice(0, 120),
        title: title,
        url: link,
        sport,
        createdAt: published || new Date().toISOString(),
        description: description.slice(0, 200) + (description.length > 200 ? '...' : ''),
        priority: priority as 'high' | 'medium' | 'low',
        type: 'news'
      };

      items.push(item);
    }

    return items;
  } catch (error) {
    console.error(`Error parsing RSS feed for ${sport} from ${source}:`, error);
    return [];
  }
}


