"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tickerRouter = void 0;
const express_1 = require("express");
const xml2js_1 = require("xml2js");
exports.tickerRouter = (0, express_1.Router)();
// Cache for RSS feeds to avoid rate limiting
const rssCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
// RSS Feed sources
const RSS_FEEDS = [
    {
        name: 'Kicker.de',
        url: 'https://newsfeed.kicker.de/news/aktuell',
        sport: 'Fußball',
        priority: 'high'
    },
    {
        name: 'ESPN',
        url: 'https://www.espn.com/espn/rss/news',
        sport: 'Allgemein',
        priority: 'medium'
    },
    {
        name: 'Sky Sports',
        url: 'https://feeds.skynews.com/feeds/rss/sports.xml',
        sport: 'Allgemein',
        priority: 'medium'
    }
];
// News API configuration
const NEWS_API_KEY = process.env.NEWS_API_KEY;
const NEWS_API_URL = 'https://newsapi.org/v2/everything';
async function fetchRSSFeed(feed) {
    try {
        // Check cache first
        const cached = rssCache.get(feed.url);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return cached.data;
        }
        const response = await fetch(feed.url, {
            headers: {
                'User-Agent': 'SportsKalender/1.0 (https://sportskalendar.com)'
            }
        });
        if (!response.ok) {
            throw new Error(`RSS feed ${feed.name} returned ${response.status}`);
        }
        const xml = await response.text();
        const result = await new Promise((resolve, reject) => {
            (0, xml2js_1.parseString)(xml, (err, result) => {
                if (err)
                    reject(err);
                else
                    resolve(result);
            });
        });
        const items = result.rss?.channel?.[0]?.item || [];
        const events = items.slice(0, 10).map((item) => {
            const title = item.title?.[0] || '';
            const description = item.description?.[0] || '';
            const link = item.link?.[0] || '';
            const pubDate = item.pubDate?.[0] || new Date().toISOString();
            // Detect sport type from title/description
            let detectedSport = feed.sport;
            const text = (title + ' ' + description).toLowerCase();
            if (text.includes('fußball') || text.includes('soccer') || text.includes('tor') || text.includes('goal')) {
                detectedSport = 'Fußball';
            }
            else if (text.includes('f1') || text.includes('formel') || text.includes('rennen')) {
                detectedSport = 'F1';
            }
            else if (text.includes('nfl') || text.includes('touchdown') || text.includes('super bowl')) {
                detectedSport = 'NFL';
            }
            else if (text.includes('basketball') || text.includes('nba')) {
                detectedSport = 'Basketball';
            }
            else if (text.includes('tennis') || text.includes('wimbledon')) {
                detectedSport = 'Tennis';
            }
            // Determine event type and priority
            let type = 'news';
            let priority = feed.priority;
            if (text.includes('tor') || text.includes('goal') || text.includes('score')) {
                type = 'goal';
                priority = 'high';
            }
            else if (text.includes('live') || text.includes('update') || text.includes('breaking')) {
                type = 'update';
                priority = 'high';
            }
            else if (text.includes('transfer') || text.includes('verletzung') || text.includes('injury')) {
                type = 'info';
                priority = 'medium';
            }
            return {
                type,
                message: title,
                ts: new Date(pubDate).getTime(),
                url: link || null,
                source: feed.name,
                sport: detectedSport,
                priority
            };
        });
        // Cache the result
        rssCache.set(feed.url, { data: events, timestamp: Date.now() });
        return events;
    }
    catch (error) {
        console.error(`Error fetching RSS feed ${feed.name}:`, error);
        return [];
    }
}
async function fetchNewsAPI() {
    if (!NEWS_API_KEY)
        return [];
    try {
        const response = await fetch(`${NEWS_API_URL}?q=sport&apiKey=${NEWS_API_KEY}&language=de&sortBy=publishedAt&pageSize=20`);
        const data = await response.json();
        if (data.status !== 'ok')
            return [];
        return data.articles.slice(0, 10).map((article) => {
            const title = article.title || '';
            const description = article.description || '';
            const text = (title + ' ' + description).toLowerCase();
            let sport = 'Allgemein';
            if (text.includes('fußball') || text.includes('soccer'))
                sport = 'Fußball';
            else if (text.includes('f1') || text.includes('formel'))
                sport = 'F1';
            else if (text.includes('nfl'))
                sport = 'NFL';
            else if (text.includes('basketball'))
                sport = 'Basketball';
            else if (text.includes('tennis'))
                sport = 'Tennis';
            let type = 'news';
            let priority = 'medium';
            if (text.includes('tor') || text.includes('goal')) {
                type = 'goal';
                priority = 'high';
            }
            else if (text.includes('live') || text.includes('breaking')) {
                type = 'update';
                priority = 'high';
            }
            return {
                type,
                message: title,
                ts: new Date(article.publishedAt).getTime(),
                url: article.url || null,
                source: 'NewsAPI',
                sport,
                priority
            };
        });
    }
    catch (error) {
        console.error('Error fetching NewsAPI:', error);
        return [];
    }
}
// SSE stream that aggregates from our Highlights API (F1/NFL) and Scores API
exports.tickerRouter.get('/stream', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();
    const base = `${req.protocol}://${req.get('host')}`;
    const sentIds = new Set();
    let windowStart = Date.now();
    const send = (event) => {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
    };
    async function fetchHighlights(sport) {
        try {
            const r = await fetch(`${base}/api/highlights?sport=${sport}`);
            const data = await r.json();
            const items = (Array.isArray(data) ? data : data.items);
            for (const it of items.slice(0, 5)) {
                const id = `${sport}:${it.id || it.title}`;
                if (sentIds.has(id))
                    continue;
                sentIds.add(id);
                let source = null;
                try {
                    const host = new URL(it.url).hostname;
                    if (/youtube\.com|youtu\.be/.test(host))
                        source = 'YouTube';
                    else
                        source = host;
                }
                catch {
                    source = null;
                }
                send({ type: 'highlight', message: `${sport}: ${it.title}`, ts: Date.now(), url: it.url ?? null, source });
            }
        }
        catch {
            // ignore
        }
    }
    async function fetchScores() {
        try {
            const r = await fetch(`${base}/api/scores`);
            const data = await r.json();
            const lines = [];
            if (data?.F1?.length) {
                const f1 = data.F1[0];
                lines.push(`F1 ${f1.event}: P${f1.position} – Lap ${f1.lap}/${f1.totalLaps}`);
            }
            if (data?.NFL?.length) {
                const nfl = data.NFL[0];
                lines.push(`NFL ${nfl.event}: ${nfl.score} – Q${nfl.quarter} ${nfl.time}`);
            }
            if (data?.Fußball?.length) {
                const fb = data['Fußball'][0];
                lines.push(`Fußball ${fb.event}: ${fb.score} – ${fb.minute}'`);
            }
            for (const m of lines) {
                const id = `score:${m}`;
                if (sentIds.has(id))
                    continue;
                sentIds.add(id);
                send({ type: 'score', message: m, ts: Date.now(), source: 'Live' });
            }
        }
        catch {
            // ignore
        }
    }
    async function fetchNewsFeeds() {
        try {
            // Fetch all RSS feeds in parallel
            const rssPromises = RSS_FEEDS.map(feed => fetchRSSFeed(feed));
            const newsApiPromise = fetchNewsAPI();
            const [rssResults, newsApiResults] = await Promise.all([
                Promise.all(rssPromises),
                newsApiPromise
            ]);
            // Flatten and process all news events
            const allNewsEvents = [
                ...rssResults.flat(),
                ...newsApiResults
            ];
            // Sort by timestamp (newest first) and priority
            allNewsEvents.sort((a, b) => {
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                const aPriority = priorityOrder[a.priority || 'low'];
                const bPriority = priorityOrder[b.priority || 'low'];
                if (aPriority !== bPriority) {
                    return bPriority - aPriority;
                }
                return b.ts - a.ts;
            });
            // Send new events
            for (const event of allNewsEvents.slice(0, 15)) {
                const id = `news:${event.source}:${event.ts}:${event.message}`;
                if (sentIds.has(id))
                    continue;
                sentIds.add(id);
                send(event);
            }
        }
        catch (error) {
            console.error('Error fetching news feeds:', error);
        }
    }
    const pump = async () => {
        await Promise.all([
            fetchHighlights('F1'),
            fetchHighlights('NFL'),
            fetchScores(),
            fetchNewsFeeds()
        ]);
        // Refresh the collection window every 2 minutes: allow items erneut zu kommen
        if (Date.now() - windowStart >= 120000) {
            sentIds.clear();
            windowStart = Date.now();
        }
        else if (sentIds.size > 500) {
            // safety: cap memory within window
            const cut = Array.from(sentIds).slice(-250);
            sentIds.clear();
            for (const id of cut)
                sentIds.add(id);
        }
    };
    // initial
    pump();
    const interval = setInterval(pump, 7000);
    const heartbeat = setInterval(() => {
        try {
            res.write(`: keep-alive\n\n`);
        }
        catch { }
    }, 15000);
    req.on('close', () => {
        clearInterval(interval);
        clearInterval(heartbeat);
        res.end();
    });
});
//# sourceMappingURL=ticker.js.map