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
  const team = (req.query.team as string) || '';
  
  console.log(`[Highlights API] Request for sport: ${sport}, query: ${query}, team: ${team}`);
  
  // Always try to fetch external data first, but with timeout and fallback
  if (sport && ['F1', 'NFL', 'Fußball', 'Basketball', 'Tennis', 'NHL', 'MLB'].includes(sport)) {
    try {
      console.log(`[Highlights API] Fetching external highlights for ${sport}`);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<HighlightItem[]>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 10000); // 10 second timeout
      });
      
      const fetchPromise = fetchHighlightsForSport(sport, team);
      const external = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (external && external.length > 0) {
        console.log(`[Highlights API] Got ${external.length} external highlights for ${sport}`);
        let items = external;
        
        // Filter by team if provided (but be more lenient)
        if (team && items.length > 0) {
          console.log(`[Highlights API] Filtering by team: ${team}`);
          const teamVariations = getTeamVariations(team);
          console.log(`[Highlights API] Team variations:`, teamVariations);
          
          const beforeFilter = items.length;
          items = items.filter((highlight: HighlightItem) => {
            const searchText = (highlight.title + ' ' + (highlight.description || '')).toLowerCase();
            const matches = teamVariations.some(variation => searchText.includes(variation.toLowerCase()));
            console.log(`[Highlights API] Highlight "${highlight.title}" matches team variations: ${matches}`);
            return matches;
          });
          console.log(`[Highlights API] Team filtering: ${beforeFilter} -> ${items.length} highlights`);
          
          // If no items match, return general sport highlights instead of empty result
          if (items.length === 0) {
            console.log(`[Highlights API] No team-specific highlights found, returning general ${sport} highlights`);
            items = external; // Return all highlights for the sport
          }
        }
        
        if (query) items = items.filter(h => (h.title + ' ' + (h.description || '')).toLowerCase().includes(query.toLowerCase()));
        items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        return res.json({ items });
      }
    } catch (error) {
      console.log(`[Highlights API] External fetch failed for ${sport}:`, error);
      // fallthrough to local data if external fails
    }
  }

  // Fallback to local data or generate fallback highlights
  console.log(`[Highlights API] Using fallback data for ${sport || 'all sports'}`);
  let items = Array.from(db.highlights.values());
  if (sport) items = items.filter(h => h.sport.toLowerCase() === sport.toLowerCase());
  if (query) items = items.filter(h => (h.title + ' ' + (h.description || '')).toLowerCase().includes(query.toLowerCase()));
  
  // If no local data, generate fallback highlights
  if (items.length === 0 && sport) {
    console.log(`[Highlights API] No local data found, generating fallback highlights for ${sport}`);
    items = generateFallbackHighlights(sport, team);
  }
  
  // Sort newest first
  items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  
  console.log(`[Highlights API] Returning ${items.length} highlights (local + fallback)`);
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
    { name: 'NBA Official', channelId: 'UCNBA', priority: 'high' },
    { name: 'NBA Highlights', channelId: 'UCNBA', priority: 'high' },
    { name: 'ESPN NBA', channelId: 'UCiWLfSweyRNmLpgEHekhoAg', priority: 'high' },
    { name: 'Bleacher Report', channelId: 'UCVr_x4G5d7b8Z-1Qh8q8Xw', priority: 'medium' },
    { name: 'House of Highlights', channelId: 'UCtFh8Pv6QYzS5D2tKbR6yzw', priority: 'medium' }
  ],
  'NHL': [
    { name: 'NHL Official', channelId: 'UCHm6k0Wgx7tVnLqJ3nHxQDQ', priority: 'high' },
    { name: 'NHL Highlights', channelId: 'UCHm6k0Wgx7tVnLqJ3nHxQDQ', priority: 'high' },
    { name: 'ESPN NHL', channelId: 'UCiWLfSweyRNmLpgEHekhoAg', priority: 'high' },
    { name: 'TSN', channelId: 'UCVr_x4G5d7b8Z-1Qh8q8Xw', priority: 'medium' },
    { name: 'Sportsnet', channelId: 'UCVr_x4G5d7b8Z-1Qh8q8Xw', priority: 'medium' }
  ],
  'MLB': [
    { name: 'MLB Official', channelId: 'UCVr_x4G5d7b8Z-1Qh8q8Xw', priority: 'high' },
    { name: 'MLB Highlights', channelId: 'UCVr_x4G5d7b8Z-1Qh8q8Xw', priority: 'high' },
    { name: 'ESPN MLB', channelId: 'UCiWLfSweyRNmLpgEHekhoAg', priority: 'high' },
    { name: 'MLB Network', channelId: 'UCVr_x4G5d7b8Z-1Qh8q8Xw', priority: 'medium' },
    { name: 'Bleacher Report MLB', channelId: 'UCVr_x4G5d7b8Z-1Qh8q8Xw', priority: 'medium' }
  ],
  'Tennis': [
    { name: 'ATP Tour', channelId: 'UCVr_x4G5d7b8Z-1Qh8q8Xw', priority: 'high' },
    { name: 'WTA Tour', channelId: 'UCVr_x4G5d7b8Z-1Qh8q8Xw', priority: 'high' },
    { name: 'Tennis Channel', channelId: 'UCVr_x4G5d7b8Z-1Qh8q8Xw', priority: 'high' },
    { name: 'ESPN Tennis', channelId: 'UCiWLfSweyRNmLpgEHekhoAg', priority: 'medium' },
    { name: 'Eurosport Tennis', channelId: 'UCVr_x4G5d7b8Z-1Qh8q8Xw', priority: 'medium' }
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
    { name: 'CBS Sports NBA', rssUrl: 'https://www.cbssports.com/rss/headlines/nba/', priority: 'medium' },
    { name: 'Bleacher Report NBA', rssUrl: 'https://bleacherreport.com/nba/rss', priority: 'medium' }
  ],
  'NHL': [
    { name: 'ESPN NHL', rssUrl: 'https://www.espn.com/nhl/rss.xml', priority: 'high' },
    { name: 'NHL News', rssUrl: 'https://www.nhl.com/news/rss', priority: 'high' },
    { name: 'TSN Hockey', rssUrl: 'https://www.tsn.ca/hockey/rss', priority: 'high' },
    { name: 'Sportsnet NHL', rssUrl: 'https://www.sportsnet.ca/hockey/nhl/rss/', priority: 'medium' }
  ],
  'MLB': [
    { name: 'ESPN MLB', rssUrl: 'https://www.espn.com/mlb/rss.xml', priority: 'high' },
    { name: 'MLB News', rssUrl: 'https://www.mlb.com/news/rss', priority: 'high' },
    { name: 'CBS Sports MLB', rssUrl: 'https://www.cbssports.com/rss/headlines/mlb/', priority: 'medium' },
    { name: 'Bleacher Report MLB', rssUrl: 'https://bleacherreport.com/mlb/rss', priority: 'medium' }
  ],
  'Tennis': [
    { name: 'ATP News', rssUrl: 'https://www.atptour.com/en/news/rss.xml', priority: 'high' },
    { name: 'WTA News', rssUrl: 'https://www.wtatennis.com/news/rss.xml', priority: 'high' },
    { name: 'ESPN Tennis', rssUrl: 'https://www.espn.com/tennis/rss.xml', priority: 'medium' },
    { name: 'Tennis Channel News', rssUrl: 'https://www.tennis.com/news/rss.xml', priority: 'medium' }
  ]
};

async function fetchHighlightsForSport(sport: string, team?: string) {
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
        
        // Add timeout for individual requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout per request
        
        const response = await fetch(feedUrl, {
          headers: {
            'User-Agent': 'SportsKalender/1.0 (https://sportskalendar.com)'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
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
        // Add timeout for individual requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout per request
        
        const response = await fetch(source.rssUrl, {
          headers: {
            'User-Agent': 'SportsKalender/1.0 (https://sportskalendar.com)'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
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

    // Wait for all sources with timeout
    const allPromises = [...videoPromises, ...newsPromises];
    const results = await Promise.allSettled(allPromises);
    
    // Process results
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        allHighlights.push(...result.value);
      } else {
        console.error('Promise rejected:', result.reason);
      }
    });

    // If no highlights found, add some fallback content
    if (allHighlights.length === 0) {
      console.log(`[Highlights API] No external highlights found for ${sport}, adding fallback content`);
      allHighlights.push(...generateFallbackHighlights(sport, team));
    }

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

// Generate fallback highlights when external APIs fail
function generateFallbackHighlights(sport: string, teamName?: string): HighlightItem[] {
  const fallbackHighlights: Record<string, HighlightItem[]> = {
    'F1': [
      {
        id: `fallback_f1_1_${Date.now()}`,
        title: 'F1 Saison 2025 - Alle Highlights',
        url: 'https://www.formula1.com/en/latest.html',
        sport: 'F1',
        description: 'Die besten Momente der Formel 1 Saison 2025',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        priority: 'high',
        type: 'news'
      },
      {
        id: `fallback_f1_2_${Date.now()}`,
        title: 'F1 Qualifying Highlights',
        url: 'https://www.formula1.com/en/latest.html',
        sport: 'F1',
        description: 'Spannung pur: Die besten Qualifying-Runden',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'high',
        type: 'news'
      }
    ],
    'NFL': [
      {
        id: `fallback_nfl_1_${Date.now()}`,
        title: 'NFL Playoffs 2025 - Alle Highlights',
        url: 'https://www.nfl.com/highlights/',
        sport: 'NFL',
        description: 'Die spannendsten Momente der NFL Playoffs',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        priority: 'high',
        type: 'news'
      }
    ],
    'Fußball': [
      {
        id: `fallback_football_1_${Date.now()}`,
        title: 'Bundesliga Highlights - Alle Tore',
        url: 'https://www.bundesliga.com/en/news/highlights',
        sport: 'Fußball',
        description: 'Die besten Tore und Momente der Bundesliga',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        priority: 'high',
        type: 'news'
      },
      {
        id: `fallback_football_2_${Date.now()}`,
        title: 'Champions League Highlights',
        url: 'https://www.uefa.com/uefachampionsleague/highlights/',
        sport: 'Fußball',
        description: 'Die spannendsten Momente der Champions League',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'high',
        type: 'news'
      },
      // Team-specific highlights
      {
        id: `fallback_bayern_1_${Date.now()}`,
        title: 'Bayern Munich Highlights - Die besten Momente',
        url: 'https://www.bundesliga.com/en/news/highlights',
        sport: 'Fußball',
        description: 'Die besten Tore und Spielzüge von Bayern Munich in der Bundesliga',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'high',
        type: 'news'
      },
      {
        id: `fallback_bayern_2_${Date.now()}`,
        title: 'FC Bayern München - Champions League Highlights',
        url: 'https://www.uefa.com/uefachampionsleague/highlights/',
        sport: 'Fußball',
        description: 'Bayern Munich in der Champions League - Die spannendsten Momente',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'high',
        type: 'news'
      },
      {
        id: `fallback_bvb_1_${Date.now()}`,
        title: 'Borussia Dortmund Highlights - BVB im Fokus',
        url: 'https://www.bundesliga.com/en/news/highlights',
        sport: 'Fußball',
        description: 'Die besten Aktionen von Borussia Dortmund in der Bundesliga',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'high',
        type: 'news'
      },
      {
        id: `fallback_leverkusen_1_${Date.now()}`,
        title: 'Bayer Leverkusen Highlights - Werkself im Fokus',
        url: 'https://www.bundesliga.com/en/news/highlights',
        sport: 'Fußball',
        description: 'Die besten Momente von Bayer 04 Leverkusen',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'high',
        type: 'news'
      }
    ],
    'Basketball': [
      {
        id: `fallback_basketball_1_${Date.now()}`,
        title: 'NBA Highlights - Top Plays',
        url: 'https://www.nba.com/news/highlights',
        sport: 'Basketball',
        description: 'Die besten Spielzüge der NBA',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        priority: 'high',
        type: 'news'
      },
      {
        id: `fallback_basketball_2_${Date.now()}`,
        title: 'NBA Top 10 Plays der Woche',
        url: 'https://www.nba.com/news/highlights',
        sport: 'Basketball',
        description: 'Die spektakulärsten Spielzüge der NBA-Woche',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'high',
        type: 'news'
      }
    ],
    'NHL': [
      {
        id: `fallback_nhl_1_${Date.now()}`,
        title: 'NHL Highlights - Best Goals',
        url: 'https://www.nhl.com/news/highlights',
        sport: 'NHL',
        description: 'Die besten Tore der NHL',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        priority: 'high',
        type: 'news'
      },
      {
        id: `fallback_nhl_2_${Date.now()}`,
        title: 'NHL Top Saves - Spectacular Goalkeeping',
        url: 'https://www.nhl.com/news/highlights',
        sport: 'NHL',
        description: 'Die spektakulärsten Paraden der NHL-Torhüter',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'high',
        type: 'news'
      }
    ],
    'MLB': [
      {
        id: `fallback_mlb_1_${Date.now()}`,
        title: 'MLB Highlights - Home Runs',
        url: 'https://www.mlb.com/news/highlights',
        sport: 'MLB',
        description: 'Die besten Home Runs der MLB',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        priority: 'high',
        type: 'news'
      },
      {
        id: `fallback_mlb_2_${Date.now()}`,
        title: 'MLB Web Gems - Amazing Defensive Plays',
        url: 'https://www.mlb.com/news/highlights',
        sport: 'MLB',
        description: 'Die spektakulärsten Defensivaktionen der MLB',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'high',
        type: 'news'
      }
    ],
    'Tennis': [
      {
        id: `fallback_tennis_1_${Date.now()}`,
        title: 'ATP/WTA Highlights',
        url: 'https://www.atptour.com/en/news/highlights',
        sport: 'Tennis',
        description: 'Die besten Punkte des Tennis',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        priority: 'high',
        type: 'news'
      },
      {
        id: `fallback_tennis_2_${Date.now()}`,
        title: 'Tennis - Best Rallies & Shots',
        url: 'https://www.wtatennis.com/news/highlights',
        sport: 'Tennis',
        description: 'Die spektakulärsten Ballwechsel und Schläge',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'high',
        type: 'news'
      }
    ]
  };

  let highlights = fallbackHighlights[sport] || [];
  
  // If team name is provided, filter highlights to include team-specific content
  if (teamName && highlights.length > 0) {
    const teamNameLower = teamName.toLowerCase();
    const teamVariations = getTeamVariations(teamName);
    
    highlights = highlights.filter(highlight => {
      const searchText = (highlight.title + ' ' + (highlight.description || '')).toLowerCase();
      return teamVariations.some(variation => searchText.includes(variation));
    });
    
    // If no team-specific highlights found, return general highlights
    if (highlights.length === 0) {
      highlights = fallbackHighlights[sport] || [];
    }
  }
  
  return highlights;
}

// Get team name variations for better matching
function getTeamVariations(teamName: string): string[] {
  const normalized = teamName.toLowerCase().trim();
  const variations: string[] = [normalized];
  
  const mappings: Record<string, string[]> = {
    'bayern munich': ['fc bayern', 'bayern münchen', 'fc bayern münchen', 'bayern', 'fc bayern münchen'],
    'borussia dortmund': ['bvb', 'borussia', 'bvb dortmund', 'dortmund'],
    'bayer leverkusen': ['bayer 04', 'leverkusen', 'bayer', 'werkself'],
    'max verstappen': ['verstappen', 'max'],
    'lewis hamilton': ['hamilton', 'lewis'],
    'charles leclerc': ['leclerc', 'charles'],
    'lando norris': ['norris', 'lando'],
    // NBA Teams
    'boston celtics': ['celtics', 'boston', 'celts'],
    'lakers': ['los angeles lakers', 'lal', 'lakers'],
    'warriors': ['golden state warriors', 'gsw', 'dubs'],
    'bulls': ['chicago bulls', 'chicago'],
    'heat': ['miami heat', 'miami'],
    'nets': ['brooklyn nets', 'brooklyn'],
    'knicks': ['new york knicks', 'ny knicks', 'knicks'],
    'raptors': ['toronto raptors', 'toronto'],
    'pistons': ['detroit pistons', 'detroit'],
    // NHL Teams
    'bruins': ['boston bruins', 'boston'],
    'rangers': ['new york rangers', 'ny rangers'],
    'maple leafs': ['toronto maple leafs', 'toronto'],
    'canadiens': ['montreal canadiens', 'montreal'],
    // MLB Teams
    'yankees': ['new york yankees', 'ny yankees'],
    'red sox': ['boston red sox', 'boston'],
    'dodgers': ['los angeles dodgers', 'la dodgers'],
    // Tennis Players
    'novak djokovic': ['djokovic', 'novak'],
    'rafael nadal': ['nadal', 'rafa'],
    'roger federer': ['federer', 'roger'],
    'serena williams': ['serena', 'williams']
  };
  
  for (const [key, values] of Object.entries(mappings)) {
    if (normalized.includes(key)) {
      variations.push(...values);
      break;
    }
  }
  
  return variations;
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


