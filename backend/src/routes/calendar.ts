import { Router } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';

export const calendarRouter = Router();

type EventItem = { id: string; title: string; sport: string; startsAt: string };
type DebugBuffer = { logs: string[] };
type AggregateOptions = { sport?: 'football' | 'nfl' | 'f1'; leagues: number[] | undefined };

// No hardcoded local events; instead we use API + persistent cache + user/custom events
const DATA_DIR = path.join(process.cwd(), 'data');
const CAL_FILE = path.join(DATA_DIR, 'calendar_cache.json');
const CUSTOM_FILE = path.join(DATA_DIR, 'events.json');
function loadCalendarCache(): EventItem[] {
  try {
    if (!fs.existsSync(CAL_FILE)) return [];
    return JSON.parse(fs.readFileSync(CAL_FILE, 'utf-8')) as EventItem[];
  } catch { return []; }
}
function saveCalendarCache(items: EventItem[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(CAL_FILE, JSON.stringify(items, null, 2), 'utf-8');
  } catch {}
}

let cache: { ts: number; items: EventItem[] } | null = null;
const CACHE_MS = 5 * 60 * 1000; // 5 minutes

calendarRouter.get('/', async (req, res) => {
  try {
    const debugEnabled = String((req.query as any).debug || '') === '1';
    const debug: DebugBuffer = { logs: [] };
    const sport = String((req.query as any).sport || '').toLowerCase() as AggregateOptions['sport'];
    const leaguesParam = String((req.query as any).leagues || '');
    const leagues = leaguesParam
      ? leaguesParam.split(',').map(s => parseInt(s.trim(), 10)).filter(n => Number.isFinite(n))
      : undefined;
    if (!sport) {
      if (debugEnabled) return res.json({ items: [], debug: [ 'No sport selected' ] });
      return res.json([]);
    }
    if (!debugEnabled && cache && Date.now() - cache.ts < CACHE_MS && (!leagues || leagues.join(',') === '39,78,2,4')) {
      return res.json(cache.items);
    }
    const items = await aggregateUpcomingEvents(debug, { sport, leagues });
    items.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
    const result = items;
    cache = { ts: Date.now(), items: result };
    saveCalendarCache(result);
    if (debugEnabled) return res.json({ items: result, debug: debug.logs });
    res.json(result);
  } catch {
    const cached = loadCalendarCache();
    res.json(cached);
  }
});

const reminderSchema = z.object({ eventId: z.string() });

// Persistent reminders per user (file-backed)
const REM_DATA_DIR = path.join(process.cwd(), 'data');
const REM_FILE = path.join(REM_DATA_DIR, 'reminders.json');
type ReminderMap = Record<string, string[]>; // userId -> eventIds
function loadReminders(): ReminderMap {
  try {
    if (!fs.existsSync(REM_FILE)) return {};
    return JSON.parse(fs.readFileSync(REM_FILE, 'utf-8')) as ReminderMap;
  } catch {
    return {};
  }
}
function saveReminders(map: ReminderMap) {
  if (!fs.existsSync(REM_DATA_DIR)) fs.mkdirSync(REM_DATA_DIR, { recursive: true });
  fs.writeFileSync(REM_FILE, JSON.stringify(map, null, 2), 'utf-8');
}
let reminders: ReminderMap = loadReminders();

calendarRouter.post('/reminder', requireAuth, (req, res) => {
  const parsed = reminderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const user = (req as any).user as { id: string };
  const list = reminders[user.id] || [];
  if (!list.includes(parsed.data.eventId)) list.push(parsed.data.eventId);
  reminders[user.id] = list;
  saveReminders(reminders);
  res.json({ ok: true });
});

calendarRouter.get('/reminder', requireAuth, (req, res) => {
  const user = (req as any).user as { id: string };
  res.json({ reminders: reminders[user.id] || [] });
});

// remove reminder
calendarRouter.delete('/reminder', requireAuth, (req, res) => {
  const parsed = reminderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const user = (req as any).user as { id: string };
  const list = reminders[user.id] || [];
  reminders[user.id] = list.filter((e) => e !== parsed.data.eventId);
  saveReminders(reminders);
  res.json({ ok: true });
});

// --- External aggregation helpers ---
async function aggregateUpcomingEvents(debug?: DebugBuffer, opts?: AggregateOptions): Promise<EventItem[]> {
  const rangeEnd = Date.now() + 180 * 24 * 60 * 60 * 1000; // 180 days
  const items: EventItem[] = [];
  // include custom events for this sport
  items.push(...(await listCustomEvents(opts?.sport)));
  if (opts?.sport === 'f1') {
    const f1 = await fetchF1(debug);
    items.push(...f1);
  } else if (opts?.sport === 'nfl') {
    const nfl = await fetchNFL(debug);
    items.push(...nfl);
  } else if (opts?.sport === 'football') {
    const leagues = opts.leagues && opts.leagues.length ? opts.leagues : [];
    const soccer = await fetchSoccerApiFootball(debug, leagues);
    items.push(...soccer);
  }
  const upcoming = items.filter(i => new Date(i.startsAt).getTime() <= rangeEnd && new Date(i.startsAt).getTime() >= Date.now());
  // de-duplicate by id
  const seen = new Set<string>();
  const dedup: EventItem[] = [];
  for (const it of upcoming) {
    if (seen.has(it.id)) continue;
    seen.add(it.id);
    dedup.push(it);
  }
  if (dedup.length > 0) return dedup.slice(0, 100);
  // If nothing in 180 days window, fall back to earliest by date overall (from 'next' queries)
  items.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  const seen2 = new Set<string>();
  const out: EventItem[] = [];
  for (const it of items) {
    if (seen2.has(it.id)) continue;
    seen2.add(it.id);
    out.push(it);
    if (out.length >= 100) break;
  }
  return out;
}

async function fetchF1(debug?: DebugBuffer): Promise<EventItem[]> {
  // API-FOOTBALL: Formula 1 fixtures
  const key = process.env.API_FOOTBALL_KEY || '';
  if (!key) { debug?.logs.push('API-FOOTBALL key missing for F1'); return []; }
  const headers = { 'x-apisports-key': key } as any;
  // API path for F1: motorsport -> formula-1 fixtures (per documentation)
  const url = `https://v1.formula-1.api-sports.io/races?next=20&timezone=Europe/Berlin`;
  try {
    const r = await fetchWithLog(url, { headers }, debug, 'API-FOOTBALL F1');
    if (!r.ok) return [];
    const data = await r.json();
    const resp = data?.response || [];
    let out: EventItem[] = resp.map((e: any) => ({
      id: `af_f1_${e?.id}`,
      title: `F1 · ${e?.competition?.name || e?.grand_prix || e?.name}`,
      sport: 'F1',
      startsAt: e?.date || e?.datetime || new Date().toISOString(),
    }));
    debug?.logs.push(`F1 count: ${out.length}`);
    return out;
  } catch (e: any) {
    debug?.logs.push(`API-FOOTBALL F1 error: ${e?.message || String(e)}`);
    return [];
  }
}

async function fetchNFL(debug?: DebugBuffer): Promise<EventItem[]> {
  // API-FOOTBALL: American football fixtures
  const key = process.env.API_FOOTBALL_KEY || '';
  if (!key) { debug?.logs.push('API-FOOTBALL key missing for NFL'); return []; }
  const headers = { 'x-apisports-key': key } as any;
  // NFL next upcoming
  const url = `https://v1.american-football.api-sports.io/games?league=1&next=50&timezone=Europe/Berlin`;
  try {
    const r = await fetchWithLog(url, { headers }, debug, 'API-FOOTBALL NFL');
    if (!r.ok) return [];
    const data = await r.json();
    const resp = data?.response || [];
    let out: EventItem[] = resp.map((g: any) => ({
      id: `af_nfl_${g?.id}`,
      title: `NFL · ${g?.teams?.home?.name || ''} vs ${g?.teams?.away?.name || ''}`,
      sport: 'NFL',
      startsAt: g?.date || g?.datetime || new Date().toISOString(),
    }));
    debug?.logs.push(`NFL count: ${out.length}`);
    return out;
  } catch (e: any) {
    debug?.logs.push(`API-FOOTBALL NFL error: ${e?.message || String(e)}`);
    return [];
  }
}

async function fetchSoccerApiFootball(debug?: DebugBuffer, leagues: number[] = []): Promise<EventItem[]> {
  const key = process.env.API_FOOTBALL_KEY || '';
  if (!key) { debug?.logs.push('API-FOOTBALL key missing'); return []; }
  const headers = { 'x-apisports-key': key } as any;
  if (!leagues.length) { debug?.logs.push('SOCCER no leagues selected'); return []; }
  const items: EventItem[] = [];
  for (const league of leagues) {
    const url = `https://v3.football.api-sports.io/fixtures?league=${league}&next=50&timezone=Europe/Berlin`;
    try {
      const r = await fetchWithLog(url, { headers }, debug, `API-FOOTBALL ${league}`);
      if (!r.ok) continue;
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
        const to = formatYMD(new Date(Date.now() + 90*86400000));
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
        if (startsAt) items.push({ id, title, sport: 'Fußball', startsAt });
      }
    } catch (e: any) {
      debug?.logs.push(`API-FOOTBALL ${league} error: ${e?.message || String(e)}`);
    }
  }
  return items;
}

function formatYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

async function fetchWithLog(url: string, init: any, debug?: DebugBuffer, label?: string): Promise<Response> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, { ...(init || {}), signal: controller.signal });
    if (!res.ok) {
      let body = '';
      try { body = await res.text(); } catch {}
      const trimmed = body.length > 160 ? (body.slice(0,160) + '…') : body;
      debug?.logs.push(`${label || url}: status ${res.status} body: ${trimmed}`);
    } else {
      debug?.logs.push(`${label || url}: status ${res.status}`);
    }
    return res;
  } catch (e: any) {
    debug?.logs.push(`${label || url}: fetch error ${e?.name || ''} ${e?.message || String(e)}`);
    throw e;
  } finally {
    clearTimeout(t);
  }
}

// ------------------ Custom events & ICS import ------------------

type CustomEvent = { id: string; title: string; sport: 'football' | 'nfl' | 'f1'; startsAt: string; source?: string };

function loadCustomEvents(): CustomEvent[] {
  try {
    if (!fs.existsSync(CUSTOM_FILE)) return [];
    return JSON.parse(fs.readFileSync(CUSTOM_FILE, 'utf-8')) as CustomEvent[];
  } catch { return []; }
}

function saveCustomEvents(evts: CustomEvent[]) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(CUSTOM_FILE, JSON.stringify(evts, null, 2), 'utf-8');
}

async function listCustomEvents(sport?: AggregateOptions['sport']): Promise<EventItem[]> {
  const all = loadCustomEvents();
  const filtered = sport ? all.filter(e => e.sport === sport) : all;
  return filtered.map(e => ({ id: e.id, title: e.title, sport: e.sport, startsAt: e.startsAt }));
}

calendarRouter.get('/custom', (req, res) => {
  const sport = String((req.query as any).sport || '').toLowerCase() as AggregateOptions['sport'];
  listCustomEvents(sport).then(items => res.json(items));
});

calendarRouter.post('/custom', requireAuth, (req, res) => {
  const title = String(req.body.title || '').trim();
  const sport = String(req.body.sport || '').toLowerCase();
  const startsAt = String(req.body.startsAt || '').trim();
  if (!title || !startsAt || !['football','nfl','f1'].includes(sport)) {
    return res.status(400).json({ error: 'Invalid payload' });
  }
  const evts = loadCustomEvents();
  const id = `custom_${Date.now()}`;
  evts.push({ id, title, sport: sport as any, startsAt });
  saveCustomEvents(evts);
  res.status(201).json({ ok: true, id });
});

calendarRouter.post('/import-ics', requireAuth, async (req, res) => {
  // Accept either raw ICS text in body.ics, or fetch from body.url
  let ics = String(req.body.ics || '');
  const url = String(req.body.url || '').trim();
  if (!ics && url) {
    try {
      const r = await fetch(url);
      if (r.ok) ics = await r.text();
    } catch {}
  }
  if (!ics) return res.status(400).json({ error: 'No ICS provided' });
  const sport = String(req.body.sport || '').toLowerCase();
  if (!['football','nfl','f1'].includes(sport)) return res.status(400).json({ error: 'Invalid sport' });
  const parsed = parseICS(ics);
  if (!parsed.length) return res.status(400).json({ error: 'No VEVENTs found' });
  const evts = loadCustomEvents();
  for (const p of parsed) {
    evts.push({ id: `ics_${p.uid || Date.now()}_${Math.random().toString(36).slice(2,8)}`, title: p.summary, sport: sport as any, startsAt: p.dtstart, source: 'ics' });
  }
  saveCustomEvents(evts);
  res.json({ imported: parsed.length });
});

function parseICS(text: string): Array<{ summary: string; dtstart: string; uid?: string }> {
  const events: Array<{ summary: string; dtstart: string; uid?: string }> = [];
  const regex = /BEGIN:VEVENT([\s\S]*?)END:VEVENT/gm;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    const block = m[1] || '';
    const summary = ((block.match(/\nSUMMARY:(.*)/) || [,''])[1] || '').trim();
    const uid = ((block.match(/\nUID:(.*)/) || [,''])[1] || '').trim();
    // DTSTART can be in formats: YYYYMMDD, YYYYMMDDTHHMMSSZ
    const dt = ((block.match(/\nDTSTART[^:]*:(.*)/) || [,''])[1] || '').trim();
    let iso = '';
    if (/^\d{8}T\d{6}Z$/.test(dt)) {
      const y = dt.slice(0,4), mo = dt.slice(4,6), da = dt.slice(6,8), hh = dt.slice(9,11), mi = dt.slice(11,13), ss = dt.slice(13,15);
      iso = `${y}-${mo}-${da}T${hh}:${mi}:${ss}Z`;
    } else if (/^\d{8}$/.test(dt)) {
      const y = dt.slice(0,4), mo = dt.slice(4,6), da = dt.slice(6,8);
      iso = `${y}-${mo}-${da}T00:00:00Z`;
    }
    if (summary && iso) events.push({ summary, dtstart: iso, uid });
  }
  return events;
}


