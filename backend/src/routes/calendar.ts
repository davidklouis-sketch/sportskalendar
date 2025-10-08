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

// Cache per sport to avoid conflicts
let cacheMap: Record<string, { ts: number; items: EventItem[] }> = {};
const CACHE_MS = 15 * 60 * 1000; // 15 minutes - longer cache to avoid rate limits

calendarRouter.get('/', async (req, res) => {
  try {
    const debugEnabled = String((req.query as any).debug || '') === '1';
    const debug: DebugBuffer = { logs: [] };
    const sport = String((req.query as any).sport || '').toLowerCase() as AggregateOptions['sport'];
    const leaguesParam = String((req.query as any).leagues || '');
    const leagues = leaguesParam
      ? leaguesParam.split(',').map(s => parseInt(s.trim(), 10)).filter(n => Number.isFinite(n))
      : undefined;
    
    console.log(`🔍 Calendar API called: sport=${sport}, leagues=${leagues}, debug=${debugEnabled}`);
    
    if (!sport) {
      debug.logs.push('No sport selected');
      if (debugEnabled) return res.json({ items: [], debug: debug.logs });
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
    
    console.log(`📊 Calendar API result: ${result.length} events for ${sport} leagues ${leagues}`);
    if (result.length > 0) {
      console.log('🎯 Sample events:', result.slice(0, 3).map(e => `${e.title} - ${e.startsAt}`));
    }
    
    cacheMap[cacheKey] = { ts: Date.now(), items: result };
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
  const rangeEnd = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
  const sevenDaysEnd = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days minimum
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
    
    // If no events from API, log it but don't add demo data
    if (soccer.length === 0 && leagues.length > 0) {
      debug?.logs.push('No API events found for football leagues');
    }
  }
  const upcoming = items.filter(i => new Date(i.startsAt).getTime() <= rangeEnd && new Date(i.startsAt).getTime() >= Date.now());
  debug?.logs.push(`Total items: ${items.length}, upcoming: ${upcoming.length}`);
  
  // de-duplicate by id
  const seen = new Set<string>();
  const dedup: EventItem[] = [];
  for (const it of upcoming) {
    if (seen.has(it.id)) continue;
    seen.add(it.id);
    dedup.push(it);
  }
  debug?.logs.push(`After deduplication: ${dedup.length} events`);
  
  // Check if we have enough events in the next 7 days
  const sevenDayEvents = dedup.filter(i => new Date(i.startsAt).getTime() <= sevenDaysEnd);
  debug?.logs.push(`Events in next 7 days: ${sevenDayEvents.length}, total upcoming: ${dedup.length}`);
  
  if (dedup.length > 0) return dedup.slice(0, 100);
  // If nothing in 30 days window, fall back to earliest by date overall (from 'next' queries)
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
  // Using Jolpica API (Ergast replacement) for F1 race data
  const currentYear = new Date().getFullYear();
  const url = `https://api.jolpi.ca/ergast/f1/${currentYear}.json`;
  
  try {
    const r = await fetchWithLog(url, {}, debug, 'Jolpica F1 API');
    if (!r.ok) {
      debug?.logs.push(`Jolpica F1 API responded with status ${r.status}`);
      if (r.status === 429) {
        debug?.logs.push('Rate limit exceeded, returning empty array');
        return [];
      }
      return [];
    }
    
    const data = await r.json();
    const races = data?.MRData?.RaceTable?.Races || [];
    const now = new Date();
    
    // Filter for upcoming races only
    const upcomingRaces = races.filter((race: any) => {
      const raceDate = new Date(race.date + 'T' + (race.time || '14:00:00Z'));
      return raceDate > now;
    });
    
    const out: EventItem[] = upcomingRaces.slice(0, 20).map((race: any) => {
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
  } catch (e: any) {
    debug?.logs.push(`Jolpica F1 API error: ${e?.message || String(e)}`);
    if (e?.message?.includes('429') || e?.message?.includes('rate limit')) {
      debug?.logs.push('Rate limit detected, returning empty array');
      return [];
    }
    return [];
  }
}

// Fallback F1 events when API is rate limited
function getFallbackF1Events(): EventItem[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  
  // Generate some fallback F1 events for the current year
  const fallbackEvents: EventItem[] = [
    {
      id: 'fallback_f1_1',
      title: 'F1 · United States Grand Prix (Circuit of the Americas)',
      sport: 'F1',
      startsAt: new Date(currentYear, 9, 20, 20, 0).toISOString(), // October 20
    },
    {
      id: 'fallback_f1_2', 
      title: 'F1 · Mexico City Grand Prix (Autódromo Hermanos Rodríguez)',
      sport: 'F1',
      startsAt: new Date(currentYear, 9, 27, 20, 0).toISOString(), // October 27
    },
    {
      id: 'fallback_f1_3',
      title: 'F1 · São Paulo Grand Prix (Interlagos)',
      sport: 'F1', 
      startsAt: new Date(currentYear, 10, 3, 17, 0).toISOString(), // November 3
    }
  ];
  
  // Filter to only show future events
  return fallbackEvents.filter(event => new Date(event.startsAt) > now);
}

async function fetchNFL(debug?: DebugBuffer): Promise<EventItem[]> {
  // Try multiple NFL APIs for better reliability
  const apis = [
    {
      name: 'TheSportsDB',
      url: 'https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?id=4391&s=2024',
      parser: (data: any) => {
        const events = data?.events || [];
        const now = new Date();
        return events.filter((event: any) => {
          const eventDate = new Date(event.dateEvent + ' ' + event.strTime);
          return eventDate > now;
        }).slice(0, 10).map((event: any) => ({
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
      parser: (data: any) => {
        const events = data?.events || [];
        const now = new Date();
        return events.filter((event: any) => {
          const eventDate = new Date(event.date);
          return eventDate > now;
        }).slice(0, 10).map((event: any) => ({
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
    } catch (e: any) {
      debug?.logs.push(`${api.name} NFL error: ${e?.message || String(e)}`);
    }
  }
  
  // If all APIs fail, return empty array
  debug?.logs.push('All NFL APIs failed, returning empty array');
  return [];
}

// Demo NFL function removed - only live API data is used

async function fetchSoccerApiFootball(debug?: DebugBuffer, leagues: number[] = []): Promise<EventItem[]> {
  debug?.logs.push(`Fetching soccer events for leagues: ${leagues.join(', ')}`);
  
  // Try football-data.org first (free tier available)
  const footballDataKey = process.env.FOOTBALL_DATA_KEY || '';
  if (footballDataKey) {
    debug?.logs.push('Trying football-data.org API');
    const footballDataItems = await fetchFootballDataOrg(footballDataKey, debug, leagues);
    if (footballDataItems.length > 0) {
      debug?.logs.push(`Football-data.org returned ${footballDataItems.length} events`);
      return footballDataItems;
    }
    debug?.logs.push('Football-data.org returned no events');
  }

  // Fallback to API-FOOTBALL
  const key = process.env.API_FOOTBALL_KEY || '';
  if (!key) { 
    debug?.logs.push('No API keys available (FOOTBALL_DATA_KEY or API_FOOTBALL_KEY), returning empty array'); 
    return [];
  }
  
  debug?.logs.push('Trying API-FOOTBALL API');
  const headers = { 'x-apisports-key': key } as any;
  if (!leagues.length) { debug?.logs.push('SOCCER no leagues selected'); return []; }
  const items: EventItem[] = [];
  for (const league of leagues) {
    const url = `https://v3.football.api-sports.io/fixtures?league=${league}&next=50&timezone=Europe/Berlin`;
    try {
      const r = await fetchWithLog(url, { headers }, debug, `API-FOOTBALL ${league}`);
      if (!r.ok) {
        debug?.logs.push(`API-FOOTBALL ${league}: API failed (${r.status}) - skipping league`);
        continue;
      }
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
        } else {
          debug?.logs.push(`API-FOOTBALL ${league}: Season API failed (${r2.status}) - skipping league`);
          continue;
        }
      }
      if (!fixtures.length) {
        // fallback 2: wider date window + multiple statuses
        const from = formatYMD(new Date());
        const to = formatYMD(new Date(Date.now() + 30*86400000));
        const statuses = 'NS,TBD,PST';
        const u3 = `https://v3.football.api-sports.io/fixtures?league=${league}&from=${from}&to=${to}&status=${encodeURIComponent(statuses)}&timezone=Europe/Berlin`;
        const r3 = await fetchWithLog(u3, { headers }, debug, `API-FOOTBALL ${league} range+status`);
        if (r3.ok) {
          const d3 = await r3.json();
          fixtures = d3?.response || [];
        } else {
          debug?.logs.push(`API-FOOTBALL ${league}: Range API failed (${r3.status}) - skipping league`);
          continue;
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
  debug?.logs.push(`Total API-FOOTBALL items: ${items.length}`);
  return items;
}

// Demo football function removed - only live API data is used

// New function for football-data.org API
async function fetchFootballDataOrg(apiKey: string, debug?: DebugBuffer, leagues: number[] = []): Promise<EventItem[]> {
  if (!leagues.length) { debug?.logs.push('FOOTBALL-DATA no leagues selected'); return []; }
  
  // Map internal league IDs to football-data.org competition IDs
  const leagueMapping: Record<number, { id: number, name: string }> = {
    39: { id: 2021, name: 'Premier League' },        // Premier League
    78: { id: 2002, name: 'Bundesliga' },            // Bundesliga  
    2: { id: 2001, name: 'Champions League' },       // UEFA Champions League
    4: { id: 2018, name: 'European Championship' }   // UEFA European Championship
  };

  const headers = { 'X-Auth-Token': apiKey };
  const items: EventItem[] = [];

  for (const league of leagues) {
    const competition = leagueMapping[league];
    if (!competition) {
      debug?.logs.push(`FOOTBALL-DATA: Unknown league ${league}`);
      continue;
    }

    // Get upcoming matches for this competition with date range to ensure at least 30 days
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const dateFrom = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    const dateTo = thirtyDaysFromNow.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Try with date range first to ensure we get at least 30 days
    let url = `https://api.football-data.org/v4/competitions/${competition.id}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`;
    
    try {
      let r = await fetchWithLog(url, { headers }, debug, `FOOTBALL-DATA ${competition.name} (30 days)`);
      let data: any = {};
      let matches: any[] = [];
      
      if (r.ok) {
        data = await r.json();
        matches = data?.matches || [];
        debug?.logs.push(`FOOTBALL-DATA ${competition.name} (30 days) count: ${matches.length}`);
      }
      
      // If we don't have enough matches in 30 days, try with just SCHEDULED status (broader range)
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
        debug?.logs.push(`FOOTBALL-DATA ${competition.name}: API failed (${r.status}) - skipping competition`);
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
      
      debug?.logs.push(`FOOTBALL-DATA ${competition.name} processed ${matches.length} matches, added ${items.length} events`);
    } catch (e: any) {
      debug?.logs.push(`FOOTBALL-DATA ${competition.name} error: ${e?.message || String(e)}`);
    }
  }
  
  debug?.logs.push(`FOOTBALL-DATA total events: ${items.length}`);
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

// ------------------ ICS Export for Calendar Sync ------------------

calendarRouter.get('/export.ics', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user as { id: string; email: string };
    
    // Get user's selected teams from database
    const { UserRepository } = await import('../database/repositories/userRepository');
    const userRecord = await UserRepository.findByEmail(user.email);
    
    if (!userRecord || !userRecord.selectedTeams || userRecord.selectedTeams.length === 0) {
      return res.status(404).json({ error: 'No teams selected. Please select teams first.' });
    }
    
    const selectedTeams = userRecord.selectedTeams as Array<{
      sport: 'football' | 'nfl' | 'f1';
      teamName: string;
      leagueId?: number;
    }>;
    
    // Aggregate events for user's teams
    const allEvents: EventItem[] = [];
    
    for (const team of selectedTeams) {
      const opts: AggregateOptions = {
        sport: team.sport,
        leagues: team.leagueId ? [team.leagueId] : undefined
      };
      
      const events = await aggregateUpcomingEvents(undefined, opts);
      
      // Filter events by team name
      const teamEvents = events.filter(event => {
        const eventTitle = event.title.toLowerCase();
        const teamName = team.teamName.toLowerCase();
        return eventTitle.includes(teamName);
      });
      
      allEvents.push(...teamEvents);
    }
    
    // Remove duplicates
    const seen = new Set<string>();
    const uniqueEvents = allEvents.filter(event => {
      if (seen.has(event.id)) return false;
      seen.add(event.id);
      return true;
    });
    
    // Sort by date
    uniqueEvents.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
    
    // Generate ICS file
    const icsContent = generateICS(uniqueEvents, userRecord.displayName || user.email);
    
    // Set headers for ICS download
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="sportskalendar.ics"');
    res.send(icsContent);
    
  } catch (error) {
    console.error('ICS export error:', error);
    res.status(500).json({ error: 'Failed to generate calendar file' });
  }
});

function generateICS(events: EventItem[], calendarName: string): string {
  const now = new Date();
  const timestamp = formatICSDate(now);
  
  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sportskalendar//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeICS(calendarName)} - Sportskalendar`,
    'X-WR-TIMEZONE:Europe/Berlin',
    'X-WR-CALDESC:Spieltermine für deine ausgewählten Teams',
  ].join('\r\n');
  
  for (const event of events) {
    const startDate = new Date(event.startsAt);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration
    
    ics += '\r\n' + [
      'BEGIN:VEVENT',
      `UID:${escapeICS(event.id)}@sportskalendar.de`,
      `DTSTAMP:${timestamp}`,
      `DTSTART:${formatICSDate(startDate)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `SUMMARY:${escapeICS(event.title)}`,
      `DESCRIPTION:${escapeICS(event.title)} - Angesetzt für ${startDate.toLocaleString('de-DE')}`,
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'TRANSP:OPAQUE',
      'END:VEVENT',
    ].join('\r\n');
  }
  
  ics += '\r\nEND:VCALENDAR';
  
  return ics;
}

function formatICSDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}


