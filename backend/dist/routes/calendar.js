"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.calendarRouter = void 0;
const express_1 = require("express");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
exports.calendarRouter = (0, express_1.Router)();
// No hardcoded local events; instead we use API + persistent cache + user/custom events
const DATA_DIR = path.join(process.cwd(), 'data');
const CAL_FILE = path.join(DATA_DIR, 'calendar_cache.json');
const CUSTOM_FILE = path.join(DATA_DIR, 'events.json');
function loadCalendarCache() {
    try {
        if (!fs.existsSync(CAL_FILE))
            return [];
        return JSON.parse(fs.readFileSync(CAL_FILE, 'utf-8'));
    }
    catch {
        return [];
    }
}
function saveCalendarCache(items) {
    try {
        if (!fs.existsSync(DATA_DIR))
            fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(CAL_FILE, JSON.stringify(items, null, 2), 'utf-8');
    }
    catch { }
}
// Cache per sport to avoid conflicts
let cacheMap = {};
const CACHE_MS = 5 * 60 * 1000; // 5 minutes
exports.calendarRouter.get('/', async (req, res) => {
    try {
        const debugEnabled = String(req.query.debug || '') === '1';
        const debug = { logs: [] };
        const sport = String(req.query.sport || '').toLowerCase();
        const leaguesParam = String(req.query.leagues || '');
        const leagues = leaguesParam
            ? leaguesParam.split(',').map(s => parseInt(s.trim(), 10)).filter(n => Number.isFinite(n))
            : undefined;
        if (!sport) {
            if (debugEnabled)
                return res.json({ items: [], debug: ['No sport selected'] });
            return res.json([]);
        }
        // Create cache key based on sport and leagues
        const cacheKey = `${sport}_${leagues?.join(',') || 'default'}`;
        const cache = cacheMap[cacheKey];
        if (!debugEnabled && cache && Date.now() - cache.ts < CACHE_MS) {
            return res.json(cache.items);
        }
        const items = await aggregateUpcomingEvents(debug, { sport, leagues });
        items.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
        const result = items;
        cacheMap[cacheKey] = { ts: Date.now(), items: result };
        saveCalendarCache(result);
        if (debugEnabled)
            return res.json({ items: result, debug: debug.logs });
        res.json(result);
    }
    catch {
        const cached = loadCalendarCache();
        res.json(cached);
    }
});
const reminderSchema = zod_1.z.object({ eventId: zod_1.z.string() });
// Persistent reminders per user (file-backed)
const REM_DATA_DIR = path.join(process.cwd(), 'data');
const REM_FILE = path.join(REM_DATA_DIR, 'reminders.json');
function loadReminders() {
    try {
        if (!fs.existsSync(REM_FILE))
            return {};
        return JSON.parse(fs.readFileSync(REM_FILE, 'utf-8'));
    }
    catch {
        return {};
    }
}
function saveReminders(map) {
    if (!fs.existsSync(REM_DATA_DIR))
        fs.mkdirSync(REM_DATA_DIR, { recursive: true });
    fs.writeFileSync(REM_FILE, JSON.stringify(map, null, 2), 'utf-8');
}
let reminders = loadReminders();
exports.calendarRouter.post('/reminder', auth_1.requireAuth, (req, res) => {
    const parsed = reminderSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const user = req.user;
    const list = reminders[user.id] || [];
    if (!list.includes(parsed.data.eventId))
        list.push(parsed.data.eventId);
    reminders[user.id] = list;
    saveReminders(reminders);
    res.json({ ok: true });
});
exports.calendarRouter.get('/reminder', auth_1.requireAuth, (req, res) => {
    const user = req.user;
    res.json({ reminders: reminders[user.id] || [] });
});
// remove reminder
exports.calendarRouter.delete('/reminder', auth_1.requireAuth, (req, res) => {
    const parsed = reminderSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const user = req.user;
    const list = reminders[user.id] || [];
    reminders[user.id] = list.filter((e) => e !== parsed.data.eventId);
    saveReminders(reminders);
    res.json({ ok: true });
});
// --- External aggregation helpers ---
async function aggregateUpcomingEvents(debug, opts) {
    const rangeEnd = Date.now() + 180 * 24 * 60 * 60 * 1000; // 180 days
    const sevenDaysEnd = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days minimum
    const items = [];
    // include custom events for this sport
    items.push(...(await listCustomEvents(opts?.sport)));
    if (opts?.sport === 'f1') {
        const f1 = await fetchF1(debug);
        items.push(...f1);
    }
    else if (opts?.sport === 'nfl') {
        const nfl = await fetchNFL(debug);
        items.push(...nfl);
    }
    else if (opts?.sport === 'football') {
        const leagues = opts.leagues && opts.leagues.length ? opts.leagues : [];
        const soccer = await fetchSoccerApiFootball(debug, leagues);
        items.push(...soccer);
    }
    const upcoming = items.filter(i => new Date(i.startsAt).getTime() <= rangeEnd && new Date(i.startsAt).getTime() >= Date.now());
    // de-duplicate by id
    const seen = new Set();
    const dedup = [];
    for (const it of upcoming) {
        if (seen.has(it.id))
            continue;
        seen.add(it.id);
        dedup.push(it);
    }
    // Check if we have enough events in the next 7 days
    const sevenDayEvents = dedup.filter(i => new Date(i.startsAt).getTime() <= sevenDaysEnd);
    debug?.logs.push(`Events in next 7 days: ${sevenDayEvents.length}, total upcoming: ${dedup.length}`);
    if (dedup.length > 0)
        return dedup.slice(0, 100);
    // If nothing in 180 days window, fall back to earliest by date overall (from 'next' queries)
    items.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
    const seen2 = new Set();
    const out = [];
    for (const it of items) {
        if (seen2.has(it.id))
            continue;
        seen2.add(it.id);
        out.push(it);
        if (out.length >= 100)
            break;
    }
    return out;
}
async function fetchF1(debug) {
    // Using Jolpica API (Ergast replacement) for F1 race data
    const currentYear = new Date().getFullYear();
    const url = `https://api.jolpi.ca/ergast/f1/${currentYear}.json`;
    try {
        const r = await fetchWithLog(url, {}, debug, 'Jolpica F1 API');
        if (!r.ok) {
            debug?.logs.push(`Jolpica F1 API responded with status ${r.status}`);
            return [];
        }
        const data = await r.json();
        const races = data?.MRData?.RaceTable?.Races || [];
        const now = new Date();
        // Filter for upcoming races only
        const upcomingRaces = races.filter((race) => {
            const raceDate = new Date(race.date + 'T' + (race.time || '14:00:00Z'));
            return raceDate > now;
        });
        const out = upcomingRaces.slice(0, 20).map((race) => {
            const raceDate = new Date(race.date + 'T' + (race.time || '14:00:00Z'));
            const circuitName = race.Circuit?.circuitName || race.Circuit?.Location?.locality || 'Unknown Circuit';
            return {
                id: `jolpica_f1_${race.season}_${race.round}`,
                title: `F1 · ${race.raceName} (${circuitName})`,
                sport: 'F1',
                startsAt: raceDate.toISOString(),
            };
        });
        debug?.logs.push(`F1 upcoming races: ${out.length}`);
        return out;
    }
    catch (e) {
        debug?.logs.push(`Jolpica F1 API error: ${e?.message || String(e)}`);
        return [];
    }
}
async function fetchNFL(debug) {
    // Try multiple NFL APIs for better reliability
    const apis = [
        {
            name: 'TheSportsDB',
            url: 'https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?id=4391&s=2024',
            parser: (data) => {
                const events = data?.events || [];
                const now = new Date();
                return events.filter((event) => {
                    const eventDate = new Date(event.dateEvent + ' ' + event.strTime);
                    return eventDate > now;
                }).slice(0, 10).map((event) => ({
                    id: `tsdb_nfl_${event.idEvent}`,
                    title: `NFL · ${event.strHomeTeam} vs ${event.strAwayTeam}`,
                    sport: 'NFL',
                    startsAt: new Date(event.dateEvent + ' ' + event.strTime).toISOString(),
                }));
            }
        },
        {
            name: 'ESPN',
            url: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
            parser: (data) => {
                const events = data?.events || [];
                const now = new Date();
                return events.filter((event) => {
                    const eventDate = new Date(event.date);
                    return eventDate > now;
                }).slice(0, 10).map((event) => ({
                    id: `espn_nfl_${event.id}`,
                    title: `NFL · ${event.competitions?.[0]?.competitors?.[0]?.team?.displayName || 'Home'} vs ${event.competitions?.[0]?.competitors?.[1]?.team?.displayName || 'Away'}`,
                    sport: 'NFL',
                    startsAt: new Date(event.date).toISOString(),
                }));
            }
        }
    ];
    for (const api of apis) {
        try {
            debug?.logs.push(`Trying ${api.name} NFL API`);
            const r = await fetchWithLog(api.url, {}, debug, `${api.name} NFL`);
            if (r.ok) {
                const data = await r.json();
                const events = api.parser(data);
                if (events.length > 0) {
                    debug?.logs.push(`${api.name} NFL count: ${events.length}`);
                    return events;
                }
            }
        }
        catch (e) {
            debug?.logs.push(`${api.name} NFL error: ${e?.message || String(e)}`);
        }
    }
    // If all APIs fail, use demo data
    debug?.logs.push('All NFL APIs failed, using demo data');
    return generateDemoNFLEvents();
}
function generateDemoNFLEvents() {
    const now = new Date();
    const events = [];
    // Generate some upcoming NFL games
    const teams = [
        ['Kansas City Chiefs', 'Buffalo Bills'],
        ['Dallas Cowboys', 'Philadelphia Eagles'],
        ['San Francisco 49ers', 'Seattle Seahawks'],
        ['Green Bay Packers', 'Chicago Bears'],
        ['New England Patriots', 'Miami Dolphins']
    ];
    teams.forEach(([home, away], index) => {
        const gameDate = new Date(now);
        gameDate.setDate(gameDate.getDate() + (index + 1) * 7); // Weekly games
        gameDate.setHours(19, 0, 0, 0); // 7 PM games
        events.push({
            id: `demo_nfl_${index + 1}`,
            title: `NFL · ${home} vs ${away}`,
            sport: 'NFL',
            startsAt: gameDate.toISOString()
        });
    });
    return events;
}
async function fetchSoccerApiFootball(debug, leagues = []) {
    // Try football-data.org first (free tier available)
    const footballDataKey = process.env.FOOTBALL_DATA_KEY || '';
    if (footballDataKey) {
        const footballDataItems = await fetchFootballDataOrg(footballDataKey, debug, leagues);
        if (footballDataItems.length > 0) {
            return footballDataItems;
        }
    }
    // Fallback to API-FOOTBALL
    const key = process.env.API_FOOTBALL_KEY || '';
    if (!key) {
        debug?.logs.push('No API keys available (FOOTBALL_DATA_KEY or API_FOOTBALL_KEY), using demo data');
        return generateDemoFootballEvents(leagues);
    }
    const headers = { 'x-apisports-key': key };
    if (!leagues.length) {
        debug?.logs.push('SOCCER no leagues selected');
        return [];
    }
    const items = [];
    for (const league of leagues) {
        const url = `https://v3.football.api-sports.io/fixtures?league=${league}&next=50&timezone=Europe/Berlin`;
        try {
            const r = await fetchWithLog(url, { headers }, debug, `API-FOOTBALL ${league}`);
            if (!r.ok)
                continue;
            const data = await r.json();
            let fixtures = data?.response || [];
            if (!fixtures.length) {
                // fallback 1: season + status=NS
                const season = new Date().getFullYear();
                const u2 = `https://v3.football.api-sports.io/fixtures?league=${league}&season=${season}&status=NS&timezone=Europe/Berlin`;
                const r2 = await fetchWithLog(u2, { headers }, debug, `API-FOOTBALL ${league} season`);
                if (r2.ok) {
                    const d2 = await r2.json();
                    fixtures = d2?.response || [];
                }
            }
            if (!fixtures.length) {
                // fallback 2: wider date window + multiple statuses
                const from = formatYMD(new Date());
                const to = formatYMD(new Date(Date.now() + 90 * 86400000));
                const statuses = 'NS,TBD,PST';
                const u3 = `https://v3.football.api-sports.io/fixtures?league=${league}&from=${from}&to=${to}&status=${encodeURIComponent(statuses)}&timezone=Europe/Berlin`;
                const r3 = await fetchWithLog(u3, { headers }, debug, `API-FOOTBALL ${league} range+status`);
                if (r3.ok) {
                    const d3 = await r3.json();
                    fixtures = d3?.response || [];
                }
            }
            debug?.logs.push(`SOCCER ${league} count: ${fixtures.length}`);
            for (const f of fixtures) {
                const home = f?.teams?.home?.name || '';
                const away = f?.teams?.away?.name || '';
                const title = `${league} · ${home} vs ${away}`;
                const id = `af_${league}_${f?.fixture?.id}`;
                const startsAt = f?.fixture?.date;
                if (startsAt)
                    items.push({ id, title, sport: 'Fußball', startsAt });
            }
        }
        catch (e) {
            debug?.logs.push(`API-FOOTBALL ${league} error: ${e?.message || String(e)}`);
        }
    }
    return items;
}
// Demo data generator when no API keys are available
function generateDemoFootballEvents(leagues = []) {
    if (!leagues.length)
        return [];
    const teams = {
        39: [
            ['Manchester City', 'Arsenal'], ['Liverpool', 'Chelsea'],
            ['Manchester United', 'Tottenham'], ['Newcastle', 'Brighton']
        ],
        78: [
            ['Bayern Munich', 'Borussia Dortmund'], ['RB Leipzig', 'Bayer Leverkusen'],
            ['Eintracht Frankfurt', 'VfB Stuttgart'], ['Borussia Mönchengladbach', 'Wolfsburg']
        ],
        2: [
            ['Real Madrid', 'Barcelona'], ['PSG', 'Bayern Munich'],
            ['Manchester City', 'Inter Milan'], ['Arsenal', 'Atletico Madrid']
        ],
        4: [
            ['Germany', 'France'], ['Spain', 'Italy'],
            ['England', 'Netherlands'], ['Portugal', 'Belgium']
        ]
    };
    const leagueNames = {
        39: 'Premier League',
        78: 'Bundesliga',
        2: 'Champions League',
        4: 'European Championship'
    };
    const items = [];
    const now = new Date();
    leagues.forEach(league => {
        const leagueTeams = teams[league];
        const leagueName = leagueNames[league];
        if (leagueTeams && leagueName) {
            // Generate more matches over 7 days - repeat teams if needed
            const totalMatches = Math.max(8, leagueTeams.length * 2); // At least 8 matches per league
            for (let i = 0; i < totalMatches; i++) {
                const match = leagueTeams[i % leagueTeams.length];
                if (!match || match.length < 2)
                    continue; // Skip if match is undefined or incomplete
                // Distribute matches over 7 days
                const dayOffset = Math.floor(i / Math.ceil(totalMatches / 7)); // Spread over 7 days
                const timeOffset = (i % 3) * 2; // Different times: 0, 2, 4 hours apart
                const matchDate = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000);
                matchDate.setHours(15 + timeOffset + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0, 0);
                // Add some variation to team names for repeated matches
                const suffix = i >= leagueTeams.length ? ' (R2)' : '';
                items.push({
                    id: `demo_${league}_${i}`,
                    title: `${leagueName} · ${match[0]}${suffix} vs ${match[1]}${suffix}`,
                    sport: 'Fußball',
                    startsAt: matchDate.toISOString()
                });
            }
        }
    });
    return items.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
}
// New function for football-data.org API
async function fetchFootballDataOrg(apiKey, debug, leagues = []) {
    if (!leagues.length) {
        debug?.logs.push('FOOTBALL-DATA no leagues selected');
        return [];
    }
    // Map internal league IDs to football-data.org competition IDs
    const leagueMapping = {
        39: { id: 2021, name: 'Premier League' }, // Premier League
        78: { id: 2002, name: 'Bundesliga' }, // Bundesliga  
        2: { id: 2001, name: 'Champions League' }, // UEFA Champions League
        4: { id: 2018, name: 'European Championship' } // UEFA European Championship
    };
    const headers = { 'X-Auth-Token': apiKey };
    const items = [];
    for (const league of leagues) {
        const competition = leagueMapping[league];
        if (!competition) {
            debug?.logs.push(`FOOTBALL-DATA: Unknown league ${league}`);
            continue;
        }
        // Get upcoming matches for this competition with date range to ensure at least 7 days
        const today = new Date();
        const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        const dateFrom = today.toISOString().split('T')[0]; // YYYY-MM-DD format
        const dateTo = sevenDaysFromNow.toISOString().split('T')[0]; // YYYY-MM-DD format
        // Try with date range first to ensure we get at least 7 days
        let url = `https://api.football-data.org/v4/competitions/${competition.id}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`;
        try {
            let r = await fetchWithLog(url, { headers }, debug, `FOOTBALL-DATA ${competition.name} (7 days)`);
            let data = {};
            let matches = [];
            if (r.ok) {
                data = await r.json();
                matches = data?.matches || [];
                debug?.logs.push(`FOOTBALL-DATA ${competition.name} (7 days) count: ${matches.length}`);
            }
            // If we don't have enough matches in 7 days, try with just SCHEDULED status (broader range)
            if (matches.length < 3) {
                const fallbackUrl = `https://api.football-data.org/v4/competitions/${competition.id}/matches?status=SCHEDULED`;
                const r2 = await fetchWithLog(fallbackUrl, { headers }, debug, `FOOTBALL-DATA ${competition.name} (scheduled)`);
                if (r2.ok) {
                    const data2 = await r2.json();
                    const scheduledMatches = data2?.matches || [];
                    debug?.logs.push(`FOOTBALL-DATA ${competition.name} (scheduled) count: ${scheduledMatches.length}`);
                    // Merge and deduplicate
                    const existingIds = new Set(matches.map(m => m.id));
                    for (const match of scheduledMatches) {
                        if (!existingIds.has(match.id)) {
                            matches.push(match);
                        }
                    }
                }
            }
            if (!r.ok && matches.length === 0) {
                if (r.status === 429) {
                    debug?.logs.push(`FOOTBALL-DATA ${competition.name}: Rate limit exceeded`);
                }
                continue;
            }
            for (const match of matches) {
                const homeTeam = match?.homeTeam?.name || match?.homeTeam?.shortName || '';
                const awayTeam = match?.awayTeam?.name || match?.awayTeam?.shortName || '';
                const title = `${competition.name} · ${homeTeam} vs ${awayTeam}`;
                const id = `fd_${competition.id}_${match?.id}`;
                const startsAt = match?.utcDate;
                if (startsAt && homeTeam && awayTeam) {
                    items.push({ id, title, sport: 'Fußball', startsAt });
                }
            }
        }
        catch (e) {
            debug?.logs.push(`FOOTBALL-DATA ${competition.name} error: ${e?.message || String(e)}`);
        }
    }
    return items;
}
function formatYMD(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
async function fetchWithLog(url, init, debug, label) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 10000);
    try {
        const res = await fetch(url, { ...(init || {}), signal: controller.signal });
        if (!res.ok) {
            let body = '';
            try {
                body = await res.text();
            }
            catch { }
            const trimmed = body.length > 160 ? (body.slice(0, 160) + '…') : body;
            debug?.logs.push(`${label || url}: status ${res.status} body: ${trimmed}`);
        }
        else {
            debug?.logs.push(`${label || url}: status ${res.status}`);
        }
        return res;
    }
    catch (e) {
        debug?.logs.push(`${label || url}: fetch error ${e?.name || ''} ${e?.message || String(e)}`);
        throw e;
    }
    finally {
        clearTimeout(t);
    }
}
function loadCustomEvents() {
    try {
        if (!fs.existsSync(CUSTOM_FILE))
            return [];
        return JSON.parse(fs.readFileSync(CUSTOM_FILE, 'utf-8'));
    }
    catch {
        return [];
    }
}
function saveCustomEvents(evts) {
    if (!fs.existsSync(DATA_DIR))
        fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(CUSTOM_FILE, JSON.stringify(evts, null, 2), 'utf-8');
}
async function listCustomEvents(sport) {
    const all = loadCustomEvents();
    const filtered = sport ? all.filter(e => e.sport === sport) : all;
    return filtered.map(e => ({ id: e.id, title: e.title, sport: e.sport, startsAt: e.startsAt }));
}
exports.calendarRouter.get('/custom', (req, res) => {
    const sport = String(req.query.sport || '').toLowerCase();
    listCustomEvents(sport).then(items => res.json(items));
});
exports.calendarRouter.post('/custom', auth_1.requireAuth, (req, res) => {
    const title = String(req.body.title || '').trim();
    const sport = String(req.body.sport || '').toLowerCase();
    const startsAt = String(req.body.startsAt || '').trim();
    if (!title || !startsAt || !['football', 'nfl', 'f1'].includes(sport)) {
        return res.status(400).json({ error: 'Invalid payload' });
    }
    const evts = loadCustomEvents();
    const id = `custom_${Date.now()}`;
    evts.push({ id, title, sport: sport, startsAt });
    saveCustomEvents(evts);
    res.status(201).json({ ok: true, id });
});
// ICS import functionality removed - was unnecessary complexity
//# sourceMappingURL=calendar.js.map