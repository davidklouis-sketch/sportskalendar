"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.highlightsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const memory_1 = require("../store/memory");
const auth_1 = require("../middleware/auth");
const xml2js_1 = require("xml2js");
exports.highlightsRouter = (0, express_1.Router)();
// List with optional filters: ?sport=F1&query=over
exports.highlightsRouter.get('/', async (req, res) => {
    const sport = req.query.sport || '';
    const query = req.query.query || '';
    // If explicit sport is requested and we can aggregate externally, do so
    if (sport && ['F1', 'NFL'].includes(sport)) {
        try {
            const external = await fetchHighlightsForSport(sport);
            let items = external;
            if (query)
                items = items.filter(h => (h.title + ' ' + (h.description || '')).toLowerCase().includes(query.toLowerCase()));
            items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
            return res.json({ items });
        }
        catch (e) {
            // fallthrough to local data if external fails
        }
    }
    let items = Array.from(memory_1.db.highlights.values());
    if (sport)
        items = items.filter(h => h.sport.toLowerCase() === sport.toLowerCase());
    if (query)
        items = items.filter(h => (h.title + ' ' + (h.description || '')).toLowerCase().includes(query.toLowerCase()));
    // Sort newest first
    items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    res.json({ items });
});
// Get by id
exports.highlightsRouter.get('/:id', (req, res) => {
    const id = req.params.id;
    if (!id)
        return res.status(400).json({ error: 'id required' });
    const item = memory_1.db.highlights.get(id);
    if (!item)
        return res.status(404).json({ error: 'Not found' });
    res.json(item);
});
const createSchema = zod_1.z.object({
    title: zod_1.z.string().min(3),
    url: zod_1.z.string().url(),
    sport: zod_1.z.string().min(2),
    description: zod_1.z.string().optional(),
});
// Create (admin)
exports.highlightsRouter.post('/', auth_1.requireAuth, (0, auth_1.requireRole)('admin'), (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const id = `h_${Date.now()}`;
    const { title, url, sport, description } = parsed.data;
    const base = { id, title, url, sport, createdAt: new Date().toISOString() };
    const item = description !== undefined ? { ...base, description } : base;
    memory_1.db.highlights.set(id, item);
    res.status(201).json(item);
});
const updateSchema = zod_1.z.object({
    title: zod_1.z.string().min(3).optional(),
    url: zod_1.z.string().url().optional(),
    sport: zod_1.z.string().min(2).optional(),
    description: zod_1.z.string().optional(),
});
// Update (admin)
exports.highlightsRouter.put('/:id', auth_1.requireAuth, (0, auth_1.requireRole)('admin'), (req, res) => {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const id = req.params.id;
    if (!id)
        return res.status(400).json({ error: 'id required' });
    const item = memory_1.db.highlights.get(id);
    if (!item)
        return res.status(404).json({ error: 'Not found' });
    const d = parsed.data;
    const updated = {
        ...item,
        ...(d.title !== undefined ? { title: d.title } : {}),
        ...(d.url !== undefined ? { url: d.url } : {}),
        ...(d.sport !== undefined ? { sport: d.sport } : {}),
        ...(d.description !== undefined ? { description: d.description } : {}),
    };
    memory_1.db.highlights.set(updated.id, updated);
    res.json(updated);
});
// Delete (admin)
exports.highlightsRouter.delete('/:id', auth_1.requireAuth, (0, auth_1.requireRole)('admin'), (req, res) => {
    const id = req.params.id;
    if (!id)
        return res.status(400).json({ error: 'id required' });
    if (!memory_1.db.highlights.has(id))
        return res.status(404).json({ error: 'Not found' });
    memory_1.db.highlights.delete(id);
    res.status(204).end();
});
// Cache for video feeds to avoid rate limiting
const videoCache = new Map();
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
async function fetchHighlightsForSport(sport) {
    try {
        // Check cache first
        const cacheKey = `highlights_${sport}`;
        const cached = videoCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return cached.data;
        }
        const sources = VIDEO_SOURCES[sport] || [];
        const allHighlights = [];
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
            }
            catch (error) {
                console.error(`Error fetching ${source.name} for ${sport}:`, error);
                return [];
            }
        });
        const results = await Promise.all(promises);
        results.forEach(highlights => allHighlights.push(...highlights));
        // Sort by priority and date
        allHighlights.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            const aPriority = priorityOrder[a.priority] || 1;
            const bPriority = priorityOrder[b.priority] || 1;
            if (aPriority !== bPriority) {
                return bPriority - aPriority;
            }
            return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
        });
        // Cache the result
        videoCache.set(cacheKey, { data: allHighlights, timestamp: Date.now() });
        return allHighlights.slice(0, 20); // Limit to 20 items per sport
    }
    catch (error) {
        console.error(`Error fetching highlights for ${sport}:`, error);
        return [];
    }
}
async function parseYouTubeFeedAsync(xml, sport, source, priority) {
    try {
        const result = await new Promise((resolve, reject) => {
            (0, xml2js_1.parseString)(xml, (err, result) => {
                if (err)
                    reject(err);
                else
                    resolve(result);
            });
        });
        const entries = result.feed?.entry || [];
        const items = [];
        for (const entry of entries.slice(0, 10)) { // Limit to 10 per source
            const title = entry.title?.[0]?._ || entry.title?.[0];
            const link = entry.link?.[0]?.$?.href;
            const published = entry.published?.[0];
            const thumbnail = entry['media:group']?.[0]?.['media:thumbnail']?.[0]?.$?.url;
            const duration = entry['media:group']?.[0]?.['media:content']?.[0]?.$?.duration;
            const views = entry['yt:statistics']?.[0]?.$?.viewCount;
            if (!title || !link)
                continue;
            const item = {
                id: `${sport}_${source}_${published || Date.now()}_${title}`.slice(0, 120),
                title: title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
                url: link,
                sport,
                createdAt: published || new Date().toISOString(),
                thumbnail: thumbnail || undefined,
                duration: duration ? formatDuration(parseInt(duration)) : undefined,
                views: views ? parseInt(views) : undefined,
                description: entry['media:group']?.[0]?.['media:description']?.[0] || undefined,
                priority: priority
            };
            items.push(item);
        }
        return items;
    }
    catch (error) {
        console.error(`Error parsing YouTube feed for ${sport}:`, error);
        return [];
    }
}
function parseYouTubeFeed(xml, sport) {
    const entries = xml.split('<entry>').slice(1);
    const items = [];
    for (const raw of entries) {
        const title = matchTag(raw, 'title');
        const link = matchAttr(raw, 'link', 'href');
        const published = matchTag(raw, 'published');
        // const thumb = matchAttr(raw, 'media:thumbnail', 'url');
        if (!title || !link)
            continue;
        const base = {
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
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
function matchTag(xml, tag) {
    const m = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
    return m?.[1] ?? null;
}
function matchAttr(xml, tag, attr) {
    const m = xml.match(new RegExp(`<${tag}[^>]*?${attr}=\"([^\"]+)\"`));
    return m?.[1] ?? null;
}
//# sourceMappingURL=highlights.js.map