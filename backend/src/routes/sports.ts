import { Router, Request, Response } from 'express';
import { theSportsDBService, LEAGUE_IDS } from '../services/thesportsdb.service';

const sportsRouter = Router();

// Mapping from frontend league IDs to TheSportsDB league IDs
const FOOTBALL_LEAGUE_MAPPING: Record<number, string> = {
  78: LEAGUE_IDS.BUNDESLIGA,           // Bundesliga
  39: LEAGUE_IDS.PREMIER_LEAGUE,       // Premier League
  140: LEAGUE_IDS.LA_LIGA,             // La Liga
  135: LEAGUE_IDS.SERIE_A,             // Serie A
  61: LEAGUE_IDS.LIGUE_1,              // Ligue 1
  2: LEAGUE_IDS.CHAMPIONS_LEAGUE,      // Champions League
  3: LEAGUE_IDS.EUROPA_LEAGUE,         // Europa League
};

/**
 * Get all NBA teams
 */
sportsRouter.get('/nba/teams', async (req: Request, res: Response) => {
  try {
    const teams = await theSportsDBService.getNBATeams();
    
    // Transform to match our frontend structure
    const transformedTeams = teams.map(team => ({
      id: team.idTeam,
      name: team.strTeam,
      shortName: team.strTeamShort,
      badge: team.strTeamBadge,
      logo: team.strTeamLogo,
      stadium: team.strStadium,
    }));

    res.json({ success: true, teams: transformedTeams });
  } catch (error) {
    console.error('Error fetching NBA teams:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch NBA teams' 
    });
  }
});

/**
 * Get NBA events/schedule
 */
sportsRouter.get('/nba/events', async (req: Request, res: Response) => {
  try {
    // Auto-detect current NBA season (starts in October, ends in June)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
    
    // NBA season starts in October (month 10) and ends in June (month 6)
    let season: string;
    if (currentMonth >= 10) {
      // October-December: current year to next year
      season = `${currentYear}-${currentYear + 1}`;
    } else if (currentMonth <= 6) {
      // January-June: previous year to current year
      season = `${currentYear - 1}-${currentYear}`;
    } else {
      // July-September: previous year to current year (off-season)
      season = `${currentYear - 1}-${currentYear}`;
    }
    
    // Allow override via query parameter
    const requestedSeason = req.query.season as string;
    if (requestedSeason) {
      season = requestedSeason;
    }
    
    const events = await theSportsDBService.getNBAEvents(season);

    const transformedEvents = events.map(event => ({
      id: event.idEvent,
      title: `${event.strHomeTeam} vs ${event.strAwayTeam}`,
      sport: 'nba',
      startsAt: `${event.dateEvent} ${event.strTime || '00:00:00'}`,
      name: event.strEvent,
      homeTeam: event.strHomeTeam,
      awayTeam: event.strAwayTeam,
      homeTeamId: event.idHomeTeam,
      awayTeamId: event.idAwayTeam,
      homeScore: event.intHomeScore,
      awayScore: event.intAwayScore,
      status: event.strStatus,
      date: event.dateEvent,
      time: event.strTime,
      timestamp: event.strTimestamp,
      venue: event.strVenue,
    }));

    res.json({ success: true, events: transformedEvents, season });
  } catch (error) {
    console.error('Error fetching NBA events:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch NBA events' 
    });
  }
});

/**
 * Get next events for a specific NBA team
 */
sportsRouter.get('/nba/teams/:teamId/next', async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    if (!teamId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Team ID is required' 
      });
    }
    const events = await theSportsDBService.getNextEventsByTeam(teamId);

    const transformedEvents = events.map(event => ({
      id: event.idEvent,
      name: event.strEvent,
      homeTeam: event.strHomeTeam,
      awayTeam: event.strAwayTeam,
      date: event.dateEvent,
      time: event.strTime,
      venue: event.strVenue,
    }));

    res.json({ success: true, events: transformedEvents });
  } catch (error) {
    console.error('Error fetching next NBA events:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch next events' 
    });
  }
});

/**
 * Get all NHL teams
 */
sportsRouter.get('/nhl/teams', async (req: Request, res: Response) => {
  try {
    const teams = await theSportsDBService.getNHLTeams();
    
    const transformedTeams = teams.map(team => ({
      id: team.idTeam,
      name: team.strTeam,
      shortName: team.strTeamShort,
      badge: team.strTeamBadge,
      logo: team.strTeamLogo,
      stadium: team.strStadium,
    }));

    res.json({ success: true, teams: transformedTeams });
  } catch (error) {
    console.error('Error fetching NHL teams:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch NHL teams' 
    });
  }
});

/**
 * Get NHL events/schedule
 */
sportsRouter.get('/nhl/events', async (req: Request, res: Response) => {
  try {
    // Auto-detect current NHL season (starts in October, ends in June)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
    
    // NHL season starts in October (month 10) and ends in June (month 6)
    let season: string;
    if (currentMonth >= 10) {
      // October-December: current year to next year
      season = `${currentYear}-${currentYear + 1}`;
    } else if (currentMonth <= 6) {
      // January-June: previous year to current year
      season = `${currentYear - 1}-${currentYear}`;
    } else {
      // July-September: previous year to current year (off-season)
      season = `${currentYear - 1}-${currentYear}`;
    }
    
    // Allow override via query parameter
    const requestedSeason = req.query.season as string;
    if (requestedSeason) {
      season = requestedSeason;
    }
    
    const events = await theSportsDBService.getNHLEvents(season);

    const transformedEvents = events.map(event => ({
      id: event.idEvent,
      title: `${event.strHomeTeam} vs ${event.strAwayTeam}`,
      sport: 'nhl',
      startsAt: `${event.dateEvent} ${event.strTime || '00:00:00'}`,
      name: event.strEvent,
      homeTeam: event.strHomeTeam,
      awayTeam: event.strAwayTeam,
      homeTeamId: event.idHomeTeam,
      awayTeamId: event.idAwayTeam,
      homeScore: event.intHomeScore,
      awayScore: event.intAwayScore,
      status: event.strStatus,
      date: event.dateEvent,
      time: event.strTime,
      venue: event.strVenue,
    }));

    res.json({ success: true, events: transformedEvents, season });
  } catch (error) {
    console.error('Error fetching NHL events:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch NHL events' 
    });
  }
});

/**
 * Get all MLB teams
 */
sportsRouter.get('/mlb/teams', async (req: Request, res: Response) => {
  try {
    const teams = await theSportsDBService.getMLBTeams();
    
    const transformedTeams = teams.map(team => ({
      id: team.idTeam,
      name: team.strTeam,
      shortName: team.strTeamShort,
      badge: team.strTeamBadge,
      logo: team.strTeamLogo,
      stadium: team.strStadium,
    }));

    res.json({ success: true, teams: transformedTeams });
  } catch (error) {
    console.error('Error fetching MLB teams:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch MLB teams' 
    });
  }
});

/**
 * Get MLB events/schedule
 */
sportsRouter.get('/mlb/events', async (req: Request, res: Response) => {
  try {
    // Auto-detect current MLB season (starts in March, ends in October)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
    
    // MLB season starts in March (month 3) and ends in October (month 10)
    let season: string;
    if (currentMonth >= 3 && currentMonth <= 10) {
      // March-October: current year
      season = currentYear.toString();
    } else {
      // November-February: previous year (off-season)
      season = (currentYear - 1).toString();
    }
    
    // Allow override via query parameter
    const requestedSeason = req.query.season as string;
    if (requestedSeason) {
      season = requestedSeason;
    }
    
    const events = await theSportsDBService.getMLBEvents(season);

    const transformedEvents = events.map(event => ({
      id: event.idEvent,
      title: `${event.strHomeTeam} vs ${event.strAwayTeam}`,
      sport: 'mlb',
      startsAt: `${event.dateEvent} ${event.strTime || '00:00:00'}`,
      name: event.strEvent,
      homeTeam: event.strHomeTeam,
      awayTeam: event.strAwayTeam,
      homeScore: event.intHomeScore,
      awayScore: event.intAwayScore,
      status: event.strStatus,
      date: event.dateEvent,
      time: event.strTime,
      venue: event.strVenue,
    }));

    res.json({ success: true, events: transformedEvents, season });
  } catch (error) {
    console.error('Error fetching MLB events:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch MLB events' 
    });
  }
});

/**
 * Get Tennis ATP events
 */
sportsRouter.get('/tennis/atp', async (req: Request, res: Response) => {
  try {
    const season = (req.query.season as string) || '2024';
    const events = await theSportsDBService.getATPEvents(season);

    const transformedEvents = events.map(event => ({
      id: event.idEvent,
      title: `${event.strHomeTeam} vs ${event.strAwayTeam}`,
      sport: 'tennis',
      startsAt: `${event.dateEvent} ${event.strTime || '00:00:00'}`,
      name: event.strEvent,
      homeTeam: event.strHomeTeam,
      awayTeam: event.strAwayTeam,
      homeScore: event.intHomeScore,
      awayScore: event.intAwayScore,
      status: event.strStatus,
      date: event.dateEvent,
      time: event.strTime,
      venue: event.strVenue,
    }));

    res.json({ success: true, events: transformedEvents, season });
  } catch (error) {
    console.error('Error fetching ATP events:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch ATP events' 
    });
  }
});

/**
 * Get Tennis WTA events
 */
sportsRouter.get('/tennis/wta', async (req: Request, res: Response) => {
  try {
    const season = (req.query.season as string) || '2024';
    const events = await theSportsDBService.getWTAEvents(season);

    const transformedEvents = events.map(event => ({
      id: event.idEvent,
      name: event.strEvent,
      homeTeam: event.strHomeTeam,
      awayTeam: event.strAwayTeam,
      homeScore: event.intHomeScore,
      awayScore: event.intAwayScore,
      status: event.strStatus,
      date: event.dateEvent,
      time: event.strTime,
      venue: event.strVenue,
    }));

    res.json({ success: true, events: transformedEvents, season });
  } catch (error) {
    console.error('Error fetching WTA events:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch WTA events' 
    });
  }
});

/**
 * Get events by date (all sports)
 */
sportsRouter.get('/events/date/:date', async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    if (!date) {
      return res.status(400).json({ 
        success: false, 
        error: 'Date is required' 
      });
    }
    const sport = req.query.sport as string | undefined;
    const league = req.query.league as string | undefined;

    const events = await theSportsDBService.getEventsByDate(date, sport, league);

    const transformedEvents = events.map(event => ({
      id: event.idEvent,
      name: event.strEvent,
      homeTeam: event.strHomeTeam,
      awayTeam: event.strAwayTeam,
      homeScore: event.intHomeScore,
      awayScore: event.intAwayScore,
      status: event.strStatus,
      date: event.dateEvent,
      time: event.strTime,
      venue: event.strVenue,
      league: event.strLeague,
    }));

    res.json({ success: true, events: transformedEvents, date });
  } catch (error) {
    console.error('Error fetching events by date:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch events' 
    });
  }
});

/**
 * Search events
 */
sportsRouter.get('/events/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ 
        success: false, 
        error: 'Query parameter "q" is required' 
      });
    }

    const events = await theSportsDBService.searchEvents(query);

    const transformedEvents = events.map(event => ({
      id: event.idEvent,
      name: event.strEvent,
      homeTeam: event.strHomeTeam,
      awayTeam: event.strAwayTeam,
      date: event.dateEvent,
      league: event.strLeague,
      venue: event.strVenue,
    }));

    res.json({ success: true, events: transformedEvents, query });
  } catch (error) {
    console.error('Error searching events:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to search events' 
    });
  }
});

/**
 * Get Football/Soccer events
 * Similar to NBA API - provides comprehensive event data with scores
 */
sportsRouter.get('/football/events', async (req: Request, res: Response) => {
  try {
    // Auto-detect current football season (starts in August, ends in May)
    const now = new Date();
    const currentYear = now.getFullYear(); // 2025
    const currentMonth = now.getMonth() + 1; // 10 (October)
    
    // Football season starts in August (month 8) and ends in May (month 5)
    let season: string;
    if (currentMonth >= 8) {
      // August-December: current year to next year
      season = `${currentYear}-${currentYear + 1}`; // 2025-2026
    } else if (currentMonth <= 5) {
      // January-May: previous year to current year
      season = `${currentYear - 1}-${currentYear}`; // 2024-2025
    } else {
      // June-July: previous year to current year (off-season)
      season = `${currentYear - 1}-${currentYear}`; // 2024-2025
    }
    
    // Debug logging
    console.log(`Football season detection: currentMonth=${currentMonth}, currentYear=${currentYear}, detected season=${season}`);
    
    // Allow override via query parameter
    const requestedSeason = req.query.season as string;
    if (requestedSeason) {
      season = requestedSeason;
    }

    // Get leagues from query parameter (comma-separated league IDs)
    const leaguesParam = req.query.leagues as string;
    let leagueIds: string[] = [];
    
    if (leaguesParam) {
      // Parse comma-separated league IDs and map to TheSportsDB IDs
      const frontendLeagueIds = leaguesParam.split(',').map(id => parseInt(id.trim()));
      leagueIds = frontendLeagueIds
        .map(id => FOOTBALL_LEAGUE_MAPPING[id])
        .filter((id): id is string => id !== undefined);
    } else {
      // Default: fetch all major leagues
      leagueIds = [
        LEAGUE_IDS.BUNDESLIGA,
        LEAGUE_IDS.PREMIER_LEAGUE,
        LEAGUE_IDS.LA_LIGA,
        LEAGUE_IDS.SERIE_A,
        LEAGUE_IDS.LIGUE_1,
      ];
    }

    console.log(`Fetching football events for season ${season}, leagues:`, leagueIds);

    // Fetch events from all requested leagues
    const events = await theSportsDBService.getFootballEventsMultipleLeagues(leagueIds, season);

    const transformedEvents = events.map(event => ({
      id: event.idEvent,
      title: `${event.strHomeTeam} vs ${event.strAwayTeam}`,
      sport: 'football',
      startsAt: `${event.dateEvent} ${event.strTime || '00:00:00'}`,
      name: event.strEvent,
      homeTeam: event.strHomeTeam,
      awayTeam: event.strAwayTeam,
      homeTeamId: event.idHomeTeam,
      awayTeamId: event.idAwayTeam,
      homeScore: event.intHomeScore,
      awayScore: event.intAwayScore,
      status: event.strStatus,
      date: event.dateEvent,
      time: event.strTime,
      timestamp: event.strTimestamp,
      venue: event.strVenue,
      league: event.strLeague,
    }));

    console.log(`Returning ${transformedEvents.length} football events`);

    res.json({ success: true, events: transformedEvents, season, leagues: leagueIds });
  } catch (error) {
    console.error('Error fetching football events:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch football events' 
    });
  }
});

export default sportsRouter;

