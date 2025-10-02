"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.highlightsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const memory_1 = require("../store/memory");
const auth_1 = require("../middleware/auth");
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
async function fetchHighlightsForSport(sport) {
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
    return [];
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
function matchTag(xml, tag) {
    const m = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
    return m?.[1] ?? null;
}
function matchAttr(xml, tag, attr) {
    const m = xml.match(new RegExp(`<${tag}[^>]*?${attr}=\"([^\"]+)\"`));
    return m?.[1] ?? null;
}
//# sourceMappingURL=highlights.js.map