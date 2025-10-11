import axios from 'axios';

const THESPORTSDB_API_KEY = process.env.THESPORTSDB_API_KEY || '3';
const BASE_URL = 'https://www.thesportsdb.com/api/v1/json';

// League IDs from TheSportsDB
export const LEAGUE_IDS = {
  NBA: '4387',
  NHL: '4380',
  MLB: '4424',
  ATP: '4420', // Tennis ATP Tour
  WTA: '4421', // Tennis WTA Tour
  // Add more as needed
};

export interface TheSportsDBTeam {
  idTeam: string;
  strTeam: string;
  strTeamShort?: string;
  strAlternate?: string;
  strLeague: string;
  strStadium?: string;
  strDescriptionEN?: string;
  strTeamBadge?: string;
  strTeamLogo?: string;
}

export interface TheSportsDBEvent {
  idEvent: string;
  strEvent: string;
  strEventAlternate?: string;
  strHomeTeam: string;
  strAwayTeam: string;
  idHomeTeam: string;
  idAwayTeam: string;
  intHomeScore?: string;
  intAwayScore?: string;
  strStatus?: string;
  dateEvent: string;
  strTime?: string;
  strTimestamp?: string;
  strVenue?: string;
  strLeague: string;
  strSeason: string;
}

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

  // Sport-specific helper methods

  /**
   * Get NBA teams
   */
  async getNBATeams(): Promise<TheSportsDBTeam[]> {
    return this.getTeamsByLeague(LEAGUE_IDS.NBA);
  }

  /**
   * Get NHL teams
   */
  async getNHLTeams(): Promise<TheSportsDBTeam[]> {
    return this.getTeamsByLeague(LEAGUE_IDS.NHL);
  }

  /**
   * Get MLB teams
   */
  async getMLBTeams(): Promise<TheSportsDBTeam[]> {
    return this.getTeamsByLeague(LEAGUE_IDS.MLB);
  }

  /**
   * Get NBA events for current season
   */
  async getNBAEvents(season: string = '2024-2025'): Promise<TheSportsDBEvent[]> {
    return this.getEventsBySeason(LEAGUE_IDS.NBA, season);
  }

  /**
   * Get NHL events for current season
   */
  async getNHLEvents(season: string = '2024-2025'): Promise<TheSportsDBEvent[]> {
    return this.getEventsBySeason(LEAGUE_IDS.NHL, season);
  }

  /**
   * Get MLB events for current season
   */
  async getMLBEvents(season: string = '2024'): Promise<TheSportsDBEvent[]> {
    return this.getEventsBySeason(LEAGUE_IDS.MLB, season);
  }

  /**
   * Get Tennis ATP events
   */
  async getATPEvents(season: string = '2024'): Promise<TheSportsDBEvent[]> {
    return this.getEventsBySeason(LEAGUE_IDS.ATP, season);
  }

  /**
   * Get Tennis WTA events
   */
  async getWTAEvents(season: string = '2024'): Promise<TheSportsDBEvent[]> {
    return this.getEventsBySeason(LEAGUE_IDS.WTA, season);
  }
}

// Singleton instance
export const theSportsDBService = new TheSportsDBService();

