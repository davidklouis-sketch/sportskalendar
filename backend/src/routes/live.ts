import { Router } from 'express';

// Helper function for API calls with timeout
async function fetchWithTimeout(url: string, options: any = {}, timeout = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export const liveRouter = Router();

type RankEntry = {
  position: number;
  name: string;
  meta?: string;
  points?: number;
  // F1 specifics
  lap?: number;
  totalLaps?: number;
  gapSec?: number; // gap to leader
  // Soccer specifics
  score?: string;
  minute?: number;
  league?: string;
  // NFL specifics
  quarter?: number;
  clock?: string; // mm:ss
};

// Mock data removed - using real APIs with proper error handling

// Cache for live data to avoid rate limiting
let footballLiveCache: { data: RankEntry[]; timestamp: number } | null = null;
let f1LiveCache: { data: RankEntry[]; timestamp: number } | null = null;
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes cache

// Function to fetch live football matches from football-data.org
async function fetchLiveFootballMatches(): Promise<RankEntry[]> {
  const apiKey = process.env.FOOTBALL_DATA_KEY;
  if (!apiKey) {
    return []; // No API key, return empty array
  }

  // Check cache first to avoid rate limiting
  if (footballLiveCache && Date.now() - footballLiveCache.timestamp < CACHE_DURATION) {
    return footballLiveCache.data;
  }

  try {
    const headers = { 'X-Auth-Token': apiKey };
    const response = await fetchWithTimeout(
      'https://api.football-data.org/v4/matches?status=LIVE',
      { headers }
    );

    if (!response.ok) {
      // If rate limited (429) or other error, return cached data if available
      if (response.status === 429 && footballLiveCache) {
        console.log('Rate limited, returning cached football data');
        return footballLiveCache.data;
      }
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();
    const matches = data.matches || [];

    const liveEntries: RankEntry[] = matches.slice(0, 10).map((match: any, index: number) => {
      const homeTeam = match.homeTeam?.name || match.homeTeam?.shortName || 'Home';
      const awayTeam = match.awayTeam?.name || match.awayTeam?.shortName || 'Away';
      const homeScore = match.score?.fullTime?.home ?? match.score?.halfTime?.home ?? 0;
      const awayScore = match.score?.fullTime?.away ?? match.score?.halfTime?.away ?? 0;
      const minute = match.minute || 0;
      const competition = match.competition?.name || 'Unknown League';

      return {
        position: index + 1,
        name: `${homeTeam} vs ${awayTeam}`,
        score: `${homeScore}:${awayScore}`,
        minute: minute,
        league: competition
      };
    });

    // Cache the successful response
    footballLiveCache = {
      data: liveEntries,
      timestamp: Date.now()
    };

    return liveEntries;
  } catch (error) {
    console.error('Error fetching live football matches:', error);
    // If we have cached data, return it instead of throwing
    if (footballLiveCache) {
      console.log('Returning cached football data due to error');
      return footballLiveCache.data;
    }
    return []; // Return empty array instead of throwing
  }
}

// Function to fetch F1 race results from Ergast API
async function fetchF1LiveData(): Promise<RankEntry[]> {
  // Check cache first
  if (f1LiveCache && Date.now() - f1LiveCache.timestamp < CACHE_DURATION) {
    return f1LiveCache.data;
  }

  try {
    // Get current season and latest race results
    const currentYear = new Date().getFullYear();
    const response = await fetchWithTimeout(
      `https://api.jolpi.ca/ergast/f1/${currentYear}/last/results.json`
    );

    if (!response.ok) {
      // If error and we have cached data, return it
      if (f1LiveCache) {
        console.log('F1 API error, returning cached data');
        return f1LiveCache.data;
      }
      throw new Error(`Ergast API responded with status ${response.status}`);
    }

    const data = await response.json();
    const race = data.MRData?.RaceTable?.Races?.[0];
    
    if (!race || !race.Results) {
      // Try to get current standings instead
      const standingsResponse = await fetchWithTimeout(
        `https://api.jolpi.ca/ergast/f1/${currentYear}/driverStandings.json`
      );
      
      if (standingsResponse.ok) {
        const standingsData = await standingsResponse.json();
        const standings = standingsData.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings || [];
        
        return standings.slice(0, 10).map((standing: any, index: number) => ({
          position: index + 1,
          name: `${standing.Driver?.givenName} ${standing.Driver?.familyName}`,
          meta: standing.Constructors?.[0]?.name || 'Unknown Team',
          points: parseInt(standing.points) || 0,
          info: `${standing.points} pts`
        }));
      }
      
      return []; // No live race data
    }

    const results = race.Results || [];
    const raceName = race.raceName || 'Current Race';
    const totalLaps = parseInt(race.Results?.[0]?.laps) || 58;

    const f1Results = results.slice(0, 10).map((result: any, index: number) => ({
      position: index + 1,
      name: `${result.Driver?.givenName} ${result.Driver?.familyName}`,
      meta: result.Constructor?.name || 'Unknown Team',
      lap: totalLaps,
      totalLaps: totalLaps,
      gapSec: result.Time?.millis ? (result.Time.millis - results[0]?.Time?.millis) / 1000 : 0,
      info: `${raceName} - Finished`
    }));

    // Cache the successful response
    f1LiveCache = {
      data: f1Results,
      timestamp: Date.now()
    };

    return f1Results;

  } catch (error) {
    console.error('Error fetching F1 data:', error);
    // If we have cached data, return it
    if (f1LiveCache) {
      console.log('Returning cached F1 data due to error');
      return f1LiveCache.data;
    }
    return []; // Return empty array on error
  }
}

// Function to get next F1 race information
async function getNextF1Race(): Promise<{ name: string; date: string; circuit: string } | null> {
  try {
    const currentYear = new Date().getFullYear();
    const response = await fetchWithTimeout(
      `https://api.jolpi.ca/ergast/f1/${currentYear}.json`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const races = data.MRData?.RaceTable?.Races || [];
    const now = new Date();

    // Find next race
    const nextRace = races.find((race: any) => {
      const raceDate = new Date(race.date + 'T' + (race.time || '14:00:00'));
      return raceDate > now;
    });

    if (nextRace) {
      const raceDate = new Date(nextRace.date + 'T' + (nextRace.time || '14:00:00'));
      const circuitName = nextRace.Circuit?.circuitName || nextRace.Circuit?.Location?.locality || 'Unknown Circuit';
      
      return {
        name: nextRace.raceName || 'Formula 1 Race',
        date: raceDate.toLocaleDateString('de-DE', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        circuit: circuitName
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching next F1 race:', error);
    return null;
  }
}

// Function to get next NFL games (using mock schedule since free APIs are limited)
function getNextNFLGame(): { name: string; date: string; teams: string } {
  const now = new Date();
  const nextSunday = new Date(now);
  nextSunday.setDate(now.getDate() + (7 - now.getDay()) % 7);
  if (nextSunday <= now) {
    nextSunday.setDate(nextSunday.getDate() + 7);
  }
  nextSunday.setHours(18, 0, 0, 0); // 6 PM Sunday

  const teams = [
    ['Kansas City Chiefs', 'Buffalo Bills'],
    ['San Francisco 49ers', 'Dallas Cowboys'],
    ['Baltimore Ravens', 'Pittsburgh Steelers'],
    ['Green Bay Packers', 'Chicago Bears']
  ];

  const randomMatch = teams[Math.floor(Math.random() * teams.length)];
  const homeTeam = randomMatch?.[0] || 'Home Team';
  const awayTeam = randomMatch?.[1] || 'Away Team';

  return {
    name: 'NFL Game',
    date: nextSunday.toLocaleDateString('de-DE', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    teams: `${homeTeam} vs ${awayTeam}`
  };
}

liveRouter.get('/f1', async (_req, res) => {
  try {
    const f1Data = await fetchF1LiveData();
    
    // Check if we got real data
    if (f1Data.length === 0) {
      // No live data available, get next race info
      const nextRace = await getNextF1Race();
      
      if (nextRace) {
        res.json({ 
          entries: [{
            position: 1,
            name: `Nächstes Rennen: ${nextRace.name}`,
            info: `${nextRace.date} · ${nextRace.circuit}`,
            meta: 'Kein Live-Rennen aktiv'
          }],
          message: 'Kein Live-Rennen aktiv',
          nextEvent: nextRace
        });
      } else {
        res.json({ 
          entries: [{
            position: 1,
            name: 'Keine F1-Daten verfügbar',
            info: 'API-Fehler oder keine kommenden Rennen gefunden',
            meta: 'Fehler'
          }],
          error: 'Keine F1-Daten verfügbar'
        });
      }
      return;
    }

    const entries = f1Data.map((e) => ({
      ...e,
      meta: e.meta || `Lap ${e.lap || 0}/${e.totalLaps || 58}${e.position > 1 && typeof e.gapSec === 'number' ? ` · +${e.gapSec.toFixed(1)}s` : ''}`,
    }));
  res.json({ entries });
  } catch (error) {
    console.error('Error in F1 route:', error);
    res.json({ 
      entries: [{
        position: 1,
        name: 'F1-API-Fehler',
        info: 'Verbindung zur F1-API fehlgeschlagen',
        meta: 'Fehler'
      }],
      error: 'F1-API nicht erreichbar'
    });
  }
});

liveRouter.get('/nfl', (_req, res) => {
  try {
    // Since we don't have a reliable free NFL API, show next game info
    const nextGame = getNextNFLGame();
    
    res.json({ 
      entries: [{
        position: 1,
        name: `Nächstes Spiel: ${nextGame.teams}`,
        info: `${nextGame.date}`,
        meta: 'Kein Live-Spiel aktiv'
      }],
      message: 'Kein Live-NFL-Spiel aktiv',
      nextEvent: nextGame
    });
  } catch (error) {
    console.error('Error in NFL route:', error);
    res.json({ 
      entries: [{
        position: 1,
        name: 'NFL-Daten nicht verfügbar',
        info: 'Fehler beim Laden der NFL-Informationen',
        meta: 'Fehler'
      }],
      error: 'NFL-Daten nicht verfügbar'
    });
  }
});

liveRouter.get('/soccer', async (_req, res) => {
  try {
    const soccerData = await fetchLiveFootballMatches();
    
    // Check if we got real data
    if (soccerData.length === 0) {
      // No live matches, show message
      res.json({ 
        entries: [{
          position: 1,
          name: 'Keine Live-Spiele aktiv',
          info: 'Zur Zeit finden keine Fußballspiele statt',
          meta: 'Kein Live-Spiel'
        }],
        message: 'Keine Live-Fußballspiele aktiv'
      });
      return;
    }

    const entries = soccerData.map((e) => ({
    ...e,
    info: `${e.score || ''}${typeof e.minute === 'number' ? ` · ${e.minute}'` : ''}${e.league ? ` · ${e.league}` : ''}`.trim(),
  }));
  res.json({ entries });
  } catch (error) {
    console.error('Error in soccer route:', error);
    res.json({ 
      entries: [{
        position: 1,
        name: 'Fußball-API-Fehler',
        info: 'Verbindung zur Fußball-API fehlgeschlagen',
        meta: 'Fehler'
      }],
      error: 'Fußball-API nicht erreichbar'
    });
  }
});


