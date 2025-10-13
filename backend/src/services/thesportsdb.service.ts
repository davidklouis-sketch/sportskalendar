/**
 * THESPORTSDB API SERVICE
 * 
 * Service für Integration mit TheSportsDB API (https://www.thesportsdb.com/).
 * Bietet Zugriff auf Sport-Daten für NBA, NHL, MLB, Tennis (ATP/WTA) und mehr.
 * 
 * Features:
 * - Team-Daten abrufen
 * - Event-Daten abrufen (Spiele, Matches)
 * - Saison-basierte Abfragen
 * - Team-spezifische nächste/letzte Events
 * - Datum-basierte Event-Suche
 * - Sport-spezifische Helper-Methoden
 * 
 * API Key:
 * - Test Key: '3' (kostenlos, limitiert)
 * - Production Key: Über THESPORTSDB_API_KEY Environment Variable
 * 
 * API Dokumentation: https://www.thesportsdb.com/api.php
 * 
 * Unterstützte Sportarten:
 * - NBA (Basketball)
 * - NHL (Eishockey)
 * - MLB (Baseball)
 * - ATP/WTA (Tennis)
 * - Weitere Sportarten können über LEAGUE_IDS hinzugefügt werden
 */

import axios from 'axios';

// API Key aus Environment Variable oder Test Key '3'
const THESPORTSDB_API_KEY = process.env.THESPORTSDB_API_KEY || '3';
const BASE_URL = 'https://www.thesportsdb.com/api/v1/json';

/**
 * LEAGUE IDS
 * 
 * Offizielle League IDs von TheSportsDB.
 * Diese IDs werden für API-Calls verwendet.
 */
export const LEAGUE_IDS = {
  NBA: '4387',      // National Basketball Association
  NHL: '4380',      // National Hockey League
  MLB: '4424',      // Major League Baseball
  ATP: '4420',      // Tennis ATP Tour (Herren)
  WTA: '4421',      // Tennis WTA Tour (Damen)
  // Football/Soccer Leagues
  BUNDESLIGA: '4331',           // German Bundesliga
  PREMIER_LEAGUE: '4328',       // English Premier League
  LA_LIGA: '4335',              // Spanish La Liga
  SERIE_A: '4332',              // Italian Serie A
  LIGUE_1: '4334',              // French Ligue 1
  CHAMPIONS_LEAGUE: '4480',     // UEFA Champions League
  EUROPA_LEAGUE: '4481',        // UEFA Europa League
  // Weitere Ligen können hier hinzugefügt werden
};

/**
 * TheSportsDB Team Interface
 * 
 * Repräsentiert ein Team von TheSportsDB API.
 */
export interface TheSportsDBTeam {
  idTeam: string;               // Eindeutige Team-ID
  strTeam: string;              // Team-Name
  strTeamShort?: string;        // Kurz-Name (z.B. "LAL" für Lakers)
  strAlternate?: string;        // Alternativer Name
  strLeague: string;            // Liga-Name
  strStadium?: string;          // Stadion-Name
  strDescriptionEN?: string;    // Team-Beschreibung (Englisch)
  strTeamBadge?: string;        // Team-Logo URL
  strTeamLogo?: string;         // Team-Logo URL (Alternative)
}

/**
 * TheSportsDB Event Interface
 * 
 * Repräsentiert ein Event (Spiel, Match) von TheSportsDB API.
 */
export interface TheSportsDBEvent {
  idEvent: string;              // Eindeutige Event-ID
  strEvent: string;             // Event-Name (z.B. "Lakers vs Celtics")
  strEventAlternate?: string;   // Alternativer Event-Name
  strHomeTeam: string;          // Heim-Team Name
  strAwayTeam: string;          // Auswärts-Team Name
  idHomeTeam: string;           // Heim-Team ID
  idAwayTeam: string;           // Auswärts-Team ID
  intHomeScore?: string;        // Heim-Team Score
  intAwayScore?: string;        // Auswärts-Team Score
  strStatus?: string;           // Event-Status (z.B. "Not Started", "In Progress", "Finished")
  dateEvent: string;            // Event-Datum (YYYY-MM-DD)
  strTime?: string;             // Event-Zeit (HH:MM:SS)
  strTimestamp?: string;        // Unix Timestamp
  strVenue?: string;            // Veranstaltungsort
  strLeague: string;            // Liga-Name
  strSeason: string;            // Saison (z.B. "2024-2025")
}

/**
 * TheSportsDB Service Class
 * 
 * Singleton Service für TheSportsDB API Calls.
 */
export class TheSportsDBService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = THESPORTSDB_API_KEY;
    this.baseUrl = `${BASE_URL}/${this.apiKey}`;
    console.log('🏀 TheSportsDB Service initialized with API key:', this.apiKey === '3' ? 'Test Key (3)' : 'Custom Key');
  }

  /**
   * Get all teams in a league
   * 
   * @param leagueId - League ID (siehe LEAGUE_IDS)
   * @returns Array von Teams
   * 
   * API Endpoint: lookup_all_teams.php?id={leagueId}
   */
  async getTeamsByLeague(leagueId: string): Promise<TheSportsDBTeam[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/lookup_all_teams.php?id=${leagueId}`
      );
      return response.data.teams || [];
    } catch (error) {
      console.error(`Error fetching teams for league ${leagueId}:`, error);
      return [];
    }
  }

  /**
   * Search teams by league name
   * 
   * @param leagueName - Liga-Name (z.B. "NBA", "NHL")
   * @returns Array von Teams
   * 
   * API Endpoint: search_all_teams.php?l={leagueName}
   */
  async searchTeamsByLeagueName(leagueName: string): Promise<TheSportsDBTeam[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/search_all_teams.php?l=${encodeURIComponent(leagueName)}`
      );
      return response.data.teams || [];
    } catch (error) {
      console.error(`Error searching teams in league ${leagueName}:`, error);
      return [];
    }
  }

  /**
   * Get events for a season
   * 
   * @param leagueId - League ID (siehe LEAGUE_IDS)
   * @param season - Saison (z.B. "2024-2025" für NBA/NHL, "2024" für MLB/Tennis)
   * @returns Array von Events
   * 
   * API Endpoint: eventsseason.php?id={leagueId}&s={season}
   */
  async getEventsBySeason(leagueId: string, season: string): Promise<TheSportsDBEvent[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/eventsseason.php?id=${leagueId}&s=${season}`
      );
      return response.data.events || [];
    } catch (error) {
      console.error(`Error fetching events for league ${leagueId}, season ${season}:`, error);
      return [];
    }
  }

  /**
   * Get next 5 events for a team
   * 
   * @param teamId - Team ID
   * @returns Array von nächsten 5 Events
   * 
   * API Endpoint: eventsnext.php?id={teamId}
   */
  async getNextEventsByTeam(teamId: string): Promise<TheSportsDBEvent[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/eventsnext.php?id=${teamId}`
      );
      return response.data.events || [];
    } catch (error) {
      console.error(`Error fetching next events for team ${teamId}:`, error);
      return [];
    }
  }

  /**
   * Get last 5 events for a team
   * 
   * @param teamId - Team ID
   * @returns Array von letzten 5 Events
   * 
   * API Endpoint: eventslast.php?id={teamId}
   */
  async getLastEventsByTeam(teamId: string): Promise<TheSportsDBEvent[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/eventslast.php?id=${teamId}`
      );
      return response.data.events || [];
    } catch (error) {
      console.error(`Error fetching last events for team ${teamId}:`, error);
      return [];
    }
  }

  /**
   * Get events on a specific date
   * 
   * @param date - Datum (YYYY-MM-DD)
   * @param sport - Optional: Sport-Name (z.B. "Basketball")
   * @param leagueName - Optional: Liga-Name (z.B. "NBA")
   * @returns Array von Events an diesem Datum
   * 
   * API Endpoint: eventsday.php?d={date}&s={sport}&l={leagueName}
   */
  async getEventsByDate(date: string, sport?: string, leagueName?: string): Promise<TheSportsDBEvent[]> {
    try {
      let url = `${this.baseUrl}/eventsday.php?d=${date}`;
      if (sport) {
        url += `&s=${encodeURIComponent(sport)}`;
      }
      if (leagueName) {
        url += `&l=${encodeURIComponent(leagueName)}`;
      }
      
      const response = await axios.get(url);
      return response.data.events || [];
    } catch (error) {
      console.error(`Error fetching events for date ${date}:`, error);
      return [];
    }
  }

  /**
   * Search for events by name
   * 
   * @param query - Suchbegriff (z.B. "Lakers Celtics")
   * @returns Array von Events
   * 
   * API Endpoint: searchevents.php?e={query}
   */
  async searchEvents(query: string): Promise<TheSportsDBEvent[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/searchevents.php?e=${encodeURIComponent(query)}`
      );
      return response.data.event || [];
    } catch (error) {
      console.error(`Error searching events for query ${query}:`, error);
      return [];
    }
  }

  /**
   * Get team details by ID
   * 
   * @param teamId - Team ID
   * @returns Team-Details oder null
   * 
   * API Endpoint: lookupteam.php?id={teamId}
   */
  async getTeamById(teamId: string): Promise<TheSportsDBTeam | null> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/lookupteam.php?id=${teamId}`
      );
      const teams = response.data.teams || [];
      return teams.length > 0 ? teams[0] : null;
    } catch (error) {
      console.error(`Error fetching team ${teamId}:`, error);
      return null;
    }
  }

  /**
   * Get event details by ID
   * 
   * @param eventId - Event ID
   * @returns Event-Details oder null
   * 
   * API Endpoint: lookupevent.php?id={eventId}
   */
  async getEventById(eventId: string): Promise<TheSportsDBEvent | null> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/lookupevent.php?id=${eventId}`
      );
      const events = response.data.events || [];
      return events.length > 0 ? events[0] : null;
    } catch (error) {
      console.error(`Error fetching event ${eventId}:`, error);
      return null;
    }
  }

  /**
   * ========================================
   * SPORT-SPECIFIC HELPER METHODS
   * ========================================
   * 
   * Diese Methoden sind Wrapper für die generischen Methoden oben
   * und verwenden die vordefinierten LEAGUE_IDS.
   */

  /**
   * Get NBA teams
   * 
   * @returns Array von NBA Teams
   */
  async getNBATeams(): Promise<TheSportsDBTeam[]> {
    return this.getTeamsByLeague(LEAGUE_IDS.NBA);
  }

  /**
   * Get NHL teams
   * 
   * @returns Array von NHL Teams
   */
  async getNHLTeams(): Promise<TheSportsDBTeam[]> {
    return this.getTeamsByLeague(LEAGUE_IDS.NHL);
  }

  /**
   * Get MLB teams
   * 
   * @returns Array von MLB Teams
   */
  async getMLBTeams(): Promise<TheSportsDBTeam[]> {
    return this.getTeamsByLeague(LEAGUE_IDS.MLB);
  }

  /**
   * Get NBA events for current season
   * 
   * @param season - Saison (default: "2024-2025")
   * @returns Array von NBA Events
   */
  async getNBAEvents(season: string = '2024-2025'): Promise<TheSportsDBEvent[]> {
    return this.getEventsBySeason(LEAGUE_IDS.NBA, season);
  }

  /**
   * Get NHL events for current season
   * 
   * @param season - Saison (default: "2024-2025")
   * @returns Array von NHL Events
   */
  async getNHLEvents(season: string = '2024-2025'): Promise<TheSportsDBEvent[]> {
    return this.getEventsBySeason(LEAGUE_IDS.NHL, season);
  }

  /**
   * Get MLB events for current season
   * 
   * @param season - Saison (default: "2024")
   * @returns Array von MLB Events
   */
  async getMLBEvents(season: string = '2024'): Promise<TheSportsDBEvent[]> {
    return this.getEventsBySeason(LEAGUE_IDS.MLB, season);
  }

  /**
   * Get Tennis ATP events
   * 
   * @param season - Saison (default: "2024")
   * @returns Array von ATP Tennis Events
   */
  async getATPEvents(season: string = '2024'): Promise<TheSportsDBEvent[]> {
    return this.getEventsBySeason(LEAGUE_IDS.ATP, season);
  }

  /**
   * Get Tennis WTA events
   * 
   * @param season - Saison (default: "2024")
   * @returns Array von WTA Tennis Events
   */
  async getWTAEvents(season: string = '2024'): Promise<TheSportsDBEvent[]> {
    return this.getEventsBySeason(LEAGUE_IDS.WTA, season);
  }

  /**
   * Get Football/Soccer events for a specific league
   * 
   * @param leagueId - League ID (siehe LEAGUE_IDS für Football Ligen)
   * @param season - Saison (z.B. "2024-2025")
   * @returns Array von Football Events
   */
  async getFootballEvents(leagueId: string, season: string): Promise<TheSportsDBEvent[]> {
    return this.getEventsBySeason(leagueId, season);
  }

  /**
   * Get Bundesliga events
   * 
   * @param season - Saison (default: "2024-2025")
   * @returns Array von Bundesliga Events
   */
  async getBundesligaEvents(season: string = '2024-2025'): Promise<TheSportsDBEvent[]> {
    return this.getEventsBySeason(LEAGUE_IDS.BUNDESLIGA, season);
  }

  /**
   * Get Premier League events
   * 
   * @param season - Saison (default: "2024-2025")
   * @returns Array von Premier League Events
   */
  async getPremierLeagueEvents(season: string = '2024-2025'): Promise<TheSportsDBEvent[]> {
    return this.getEventsBySeason(LEAGUE_IDS.PREMIER_LEAGUE, season);
  }

  /**
   * Get La Liga events
   * 
   * @param season - Saison (default: "2024-2025")
   * @returns Array von La Liga Events
   */
  async getLaLigaEvents(season: string = '2024-2025'): Promise<TheSportsDBEvent[]> {
    return this.getEventsBySeason(LEAGUE_IDS.LA_LIGA, season);
  }

  /**
   * Get Serie A events
   * 
   * @param season - Saison (default: "2024-2025")
   * @returns Array von Serie A Events
   */
  async getSerieAEvents(season: string = '2024-2025'): Promise<TheSportsDBEvent[]> {
    return this.getEventsBySeason(LEAGUE_IDS.SERIE_A, season);
  }

  /**
   * Get Ligue 1 events
   * 
   * @param season - Saison (default: "2024-2025")
   * @returns Array von Ligue 1 Events
   */
  async getLigue1Events(season: string = '2024-2025'): Promise<TheSportsDBEvent[]> {
    return this.getEventsBySeason(LEAGUE_IDS.LIGUE_1, season);
  }

  /**
   * Get Champions League events
   * 
   * @param season - Saison (default: "2024-2025")
   * @returns Array von Champions League Events
   */
  async getChampionsLeagueEvents(season: string = '2024-2025'): Promise<TheSportsDBEvent[]> {
    return this.getEventsBySeason(LEAGUE_IDS.CHAMPIONS_LEAGUE, season);
  }

  /**
   * Get Europa League events
   * 
   * @param season - Saison (default: "2024-2025")
   * @returns Array von Europa League Events
   */
  async getEuropaLeagueEvents(season: string = '2024-2025'): Promise<TheSportsDBEvent[]> {
    return this.getEventsBySeason(LEAGUE_IDS.EUROPA_LEAGUE, season);
  }

  /**
   * Get Football events for multiple leagues
   * Combines events from multiple football leagues
   * 
   * @param leagueIds - Array of league IDs
   * @param season - Saison (default: "2024-2025")
   * @returns Array von Football Events from all leagues
   */
  async getFootballEventsMultipleLeagues(leagueIds: string[], season: string = '2024-2025'): Promise<TheSportsDBEvent[]> {
    const allEvents: TheSportsDBEvent[] = [];
    
    for (const leagueId of leagueIds) {
      try {
        const events = await this.getEventsBySeason(leagueId, season);
        allEvents.push(...events);
      } catch (error) {
        console.error(`Failed to fetch events for league ${leagueId}:`, error);
      }
    }
    
    return allEvents;
  }
}

/**
 * SINGLETON INSTANCE
 * 
 * Exportiert eine Singleton-Instanz des TheSportsDBService.
 * Diese Instanz sollte in der gesamten App verwendet werden.
 * 
 * Usage:
 * import { theSportsDBService } from './services/thesportsdb.service';
 * const teams = await theSportsDBService.getNBATeams();
 */
export const theSportsDBService = new TheSportsDBService();
