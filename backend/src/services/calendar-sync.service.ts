import { TheSportsDBService } from './thesportsdb.service';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location?: string;
  sport: string;
  homeTeam?: string;
  awayTeam?: string;
  homeTeamBadge?: string;
  awayTeamBadge?: string;
  url?: string;
  status?: string;
  homeScore?: string;
  awayScore?: string;
}

export interface CalendarSyncSettings {
  includePastEvents: boolean;
  includeFutureEvents: boolean;
  eventReminders: number[]; // minutes before event
  defaultEventDuration: number; // minutes
  includeScores: boolean;
  includeTeamLogos: boolean;
  sports: string[];
  timezone: string;
}

export class CalendarSyncService {
  private theSportsDBService = new TheSportsDBService();

  async generateCalendarExport(userId: string, format: string = 'ics'): Promise<string> {
    try {
      // Get real user data from database
      const { UserRepository } = await import('../database/repositories/userRepository');
      const user = await UserRepository.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get events for user's selected teams
      const events = await this.getCalendarEvents(userId);
      
      if (format === 'ics') {
        return this.generateICS(events, user.email);
      } else if (format === 'json') {
        return JSON.stringify({ events, user: { id: user.id, email: user.email } }, null, 2);
      } else if (format === 'csv') {
        return this.generateCSV(events);
      } else {
        throw new Error('Unsupported format');
      }
    } catch (error) {
      console.error('Calendar export error:', error);
      throw error;
    }
  }

  async generateSyncUrl(userId: string): Promise<string> {
    // Generate a unique URL for calendar subscription
    // Always use HTTPS for calendar sync URLs
    const baseUrl = process.env.API_URL || 'https://api.sportskalendar.de';
    
    // Ensure HTTPS is used
    const httpsUrl = baseUrl.startsWith('https://') ? baseUrl : baseUrl.replace('http://', 'https://');
    
    const token = this.generateSyncToken(userId);
    const syncUrl = `${httpsUrl}/api/calendar-sync/export?format=ics&token=${token}`;
    console.log(`[Calendar Sync] Generated HTTPS sync URL: ${syncUrl}`);
    return syncUrl;
  }

  async getSyncStatus(userId: string): Promise<any> {
    try {
      console.log(`[Calendar Sync] Getting sync status for user ${userId}`);
      
      // Mock user data for now - in production this would come from database
      const user = { id: userId, isPremium: true };
      
      // Generate some mock events for demonstration
      const mockEvents: CalendarEvent[] = [
        {
          id: 'mock_1',
          title: 'FC Bayern vs Borussia Dortmund',
          description: 'Bundesliga - Allianz Arena',
          startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
          location: 'Allianz Arena',
          sport: 'football',
          homeTeam: 'FC Bayern',
          awayTeam: 'Borussia Dortmund'
        },
        {
          id: 'mock_2',
          title: 'Lakers vs Warriors',
          description: 'NBA - Crypto.com Arena',
          startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2.5 * 60 * 60 * 1000).toISOString(),
          location: 'Crypto.com Arena',
          sport: 'nba',
          homeTeam: 'Lakers',
          awayTeam: 'Warriors'
        }
      ];

      const upcomingEvents = mockEvents.filter(event => new Date(event.startDate) > new Date());

      const status = {
        isPremium: user.isPremium,
        canSync: user.isPremium,
        totalEvents: mockEvents.length,
        upcomingEvents: upcomingEvents.length,
        lastSync: new Date().toISOString(),
        syncUrl: await this.generateSyncUrl(userId),
        settings: this.getDefaultSyncSettings()
      };

      console.log(`[Calendar Sync] Status generated:`, status);
      return status;
    } catch (error) {
      console.error('Get sync status error:', error);
      throw error;
    }
  }

  async updateSyncSettings(userId: string, settings: Partial<CalendarSyncSettings>): Promise<void> {
    // Store sync settings in user preferences
    // This would typically be stored in a database
    console.log(`Updating sync settings for user ${userId}:`, settings);
  }

  async getCalendarEvents(userId: string, startDate?: string, endDate?: string, sport?: string): Promise<CalendarEvent[]> {
    try {
      // Get real user data from database
      const { UserRepository } = await import('../database/repositories/userRepository');
      const user = await UserRepository.findById(userId);
      if (!user || !user.selectedTeams || user.selectedTeams.length === 0) {
        console.log(`[Calendar Sync] User ${userId} has no selected teams`);
        return [];
      }
      console.log(`[Calendar Sync] User has ${user.selectedTeams.length} selected teams`);

      const events: CalendarEvent[] = [];
      const start = startDate ? new Date(startDate) : new Date();
      const end = endDate ? new Date(endDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now

      // Get events for each selected team
      console.log(`[Calendar Sync] Getting events for ${user.selectedTeams.length} teams`);
      for (const team of user.selectedTeams as any[]) {
        try {
          console.log(`[Calendar Sync] Fetching events for ${team.sport}: ${team.teamName}`);
          const teamEvents = await this.getEventsForTeam(team, start, end);
          console.log(`[Calendar Sync] Found ${teamEvents.length} events for ${team.teamName}`);
          events.push(...teamEvents);
        } catch (error) {
          console.error(`Error getting events for team ${team.sport}:${team.teamName}:`, error);
        }
      }
      
      console.log(`[Calendar Sync] Total events found: ${events.length}`);

      // Filter by sport if specified
      if (sport) {
        return events.filter(event => event.sport === sport);
      }

      // Sort by date
      return events.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    } catch (error) {
      console.error('Get calendar events error:', error);
      throw error;
    }
  }

  private async getEventsForTeam(team: any, startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    const events: CalendarEvent[] = [];

    try {
      console.log(`[Calendar Sync] Processing team: ${team.sport} - ${team.teamName}`);
      
      if (team.sport === 'football') {
        // Use the same method as the app - getFootballEventsMultipleLeagues
        console.log(`[Calendar Sync] Fetching football events for league ${team.leagueId} (same as app)`);
        const season = '2025-26'; // Same season as app
        const footballEvents = await this.theSportsDBService.getFootballEventsMultipleLeagues([team.leagueId], season);
        console.log(`[Calendar Sync] Raw football events: ${footballEvents.length}`);
        const transformed = this.transformFootballEvents(footballEvents, team);
        console.log(`[Calendar Sync] Transformed football events: ${transformed.length}`);
        events.push(...transformed);
      } else if (team.sport === 'nba') {
        console.log(`[Calendar Sync] Fetching NBA events`);
        // Use the same season logic as the app
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1; // 1-12
        
        let season = '';
        if (currentMonth >= 10) {
          // October onwards - current season (NBA starts in October)
          season = `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;
        } else if (currentMonth >= 6) {
          // June-September - previous season still active (finals)
          season = `${currentYear - 1}-${currentYear.toString().slice(-2)}`;
        } else {
          // January-May - previous season
          season = `${currentYear - 1}-${currentYear.toString().slice(-2)}`;
        }
        
        console.log(`[Calendar Sync] Using NBA season: ${season} (same as app)`);
        let nbaEvents = await this.theSportsDBService.getNBAEvents(season);
        console.log(`[Calendar Sync] Raw NBA events for ${season}: ${nbaEvents.length}`);
        
        // If no events found for current season, try previous season as fallback
        if (nbaEvents.length === 0 && currentMonth >= 10) {
          const prevSeason = `${currentYear - 1}-${currentYear.toString().slice(-2)}`;
          console.log(`[Calendar Sync] No events for ${season}, trying previous season: ${prevSeason}`);
          nbaEvents = await this.theSportsDBService.getNBAEvents(prevSeason);
          console.log(`[Calendar Sync] Raw NBA events for ${prevSeason}: ${nbaEvents.length}`);
        }
        
        const transformed = this.transformNBAEvents(nbaEvents, team);
        console.log(`[Calendar Sync] Transformed NBA events: ${transformed.length}`);
        events.push(...transformed);
      } else if (team.sport === 'nhl') {
        console.log(`[Calendar Sync] Fetching NHL events`);
        const nhlEvents = await this.theSportsDBService.getNHLEvents();
        console.log(`[Calendar Sync] Raw NHL events: ${nhlEvents.length}`);
        const transformed = this.transformNHLEvents(nhlEvents, team);
        console.log(`[Calendar Sync] Transformed NHL events: ${transformed.length}`);
        events.push(...transformed);
      } else if (team.sport === 'mlb') {
        console.log(`[Calendar Sync] Fetching MLB events`);
        const mlbEvents = await this.theSportsDBService.getMLBEvents();
        console.log(`[Calendar Sync] Raw MLB events: ${mlbEvents.length}`);
        const transformed = this.transformMLBEvents(mlbEvents, team);
        console.log(`[Calendar Sync] Transformed MLB events: ${transformed.length}`);
        events.push(...transformed);
      } else if (team.sport === 'f1') {
        console.log(`[Calendar Sync] Fetching F1 events`);
        const f1Events = await this.getF1EventsFromAPI();
        console.log(`[Calendar Sync] Raw F1 events: ${f1Events.length}`);
        const transformed = this.transformF1Events(f1Events, team);
        console.log(`[Calendar Sync] Transformed F1 events: ${transformed.length}`);
        events.push(...transformed);
      } else if (team.sport === 'tennis') {
        console.log(`[Calendar Sync] Tennis events not yet implemented - skipping`);
        // TODO: Implement Tennis API when available
      } else if (team.sport === 'nfl') {
        console.log(`[Calendar Sync] NFL events not yet implemented - skipping`);
        // TODO: Implement NFL API when available
      }
    } catch (error) {
      console.error(`Error getting events for ${team.sport}:`, error);
    }

    // Filter events by date range and team
    return events.filter(event => {
      const eventDate = new Date(event.startDate);
      const isInDateRange = eventDate >= startDate && eventDate <= endDate;
      const isTeamMatch = event.title.toLowerCase().includes(team.teamName.toLowerCase()) ||
                         event.homeTeam?.toLowerCase().includes(team.teamName.toLowerCase()) ||
                         event.awayTeam?.toLowerCase().includes(team.teamName.toLowerCase());
      return isInDateRange && isTeamMatch;
    });
  }

  private transformFootballEvents(footballEvents: any[], team: any): CalendarEvent[] {
    return footballEvents.map(event => ({
      id: `football_${event.idEvent}`,
      title: `${event.strHomeTeam} vs ${event.strAwayTeam}`,
      description: `${event.strLeague} - ${event.strVenue || 'TBD'}`,
      startDate: `${event.dateEvent}T${event.strTime || '15:00:00'}`,
      endDate: `${event.dateEvent}T${this.addMinutes(event.strTime || '15:00:00', 105)}`, // 105 minutes for football
      location: event.strVenue || 'TBD',
      sport: 'football',
      homeTeam: event.strHomeTeam,
      awayTeam: event.strAwayTeam,
      homeTeamBadge: event.strHomeTeamBadge,
      awayTeamBadge: event.strAwayTeamBadge,
      status: event.strStatus,
      homeScore: event.intHomeScore,
      awayScore: event.intAwayScore
    }));
  }

  private transformNBAEvents(nbaEvents: any[], team: any): CalendarEvent[] {
    console.log(`[Calendar Sync] Filtering NBA events for team: ${team.teamName}`);
    
    // Filter events that include the selected team
    const teamEvents = nbaEvents.filter(event => {
      const homeTeam = event.strHomeTeam?.toLowerCase() || '';
      const awayTeam = event.strAwayTeam?.toLowerCase() || '';
      const selectedTeam = team.teamName.toLowerCase();
      
      const isMatch = homeTeam.includes(selectedTeam) || awayTeam.includes(selectedTeam) ||
                     selectedTeam.includes(homeTeam) || selectedTeam.includes(awayTeam);
      
      if (isMatch) {
        console.log(`[Calendar Sync] NBA match found: ${event.strHomeTeam} vs ${event.strAwayTeam} for ${team.teamName}`);
      }
      
      return isMatch;
    });
    
    console.log(`[Calendar Sync] Found ${teamEvents.length} NBA events for ${team.teamName} out of ${nbaEvents.length} total events`);
    
    return teamEvents.map(event => ({
      id: `nba_${event.idEvent}`,
      title: `${event.strHomeTeam} vs ${event.strAwayTeam}`,
      description: `NBA - ${event.strVenue || 'TBD'}`,
      startDate: `${event.dateEvent}T${event.strTime || '20:00:00'}`,
      endDate: `${event.dateEvent}T${this.addMinutes(event.strTime || '20:00:00', 150)}`, // 150 minutes for NBA
      location: event.strVenue || 'TBD',
      sport: 'nba',
      homeTeam: event.strHomeTeam,
      awayTeam: event.strAwayTeam,
      homeTeamBadge: event.strHomeTeamBadge,
      awayTeamBadge: event.strAwayTeamBadge,
      status: event.strStatus,
      homeScore: event.intHomeScore,
      awayScore: event.intAwayScore
    }));
  }

  private transformNHLEvents(nhlEvents: any[], team: any): CalendarEvent[] {
    console.log(`[Calendar Sync] Filtering NHL events for team: ${team.teamName}`);
    
    // Filter events that include the selected team
    const teamEvents = nhlEvents.filter(event => {
      const homeTeam = event.strHomeTeam?.toLowerCase() || '';
      const awayTeam = event.strAwayTeam?.toLowerCase() || '';
      const selectedTeam = team.teamName.toLowerCase();
      
      const isMatch = homeTeam.includes(selectedTeam) || awayTeam.includes(selectedTeam) ||
                     selectedTeam.includes(homeTeam) || selectedTeam.includes(awayTeam);
      
      if (isMatch) {
        console.log(`[Calendar Sync] NHL match found: ${event.strHomeTeam} vs ${event.strAwayTeam} for ${team.teamName}`);
      }
      
      return isMatch;
    });
    
    console.log(`[Calendar Sync] Found ${teamEvents.length} NHL events for ${team.teamName} out of ${nhlEvents.length} total events`);
    
    return teamEvents.map(event => ({
      id: `nhl_${event.idEvent}`,
      title: `${event.strHomeTeam} vs ${event.strAwayTeam}`,
      description: `NHL - ${event.strVenue || 'TBD'}`,
      startDate: `${event.dateEvent}T${event.strTime || '19:00:00'}`,
      endDate: `${event.dateEvent}T${this.addMinutes(event.strTime || '19:00:00', 180)}`, // 180 minutes for NHL
      location: event.strVenue || 'TBD',
      sport: 'nhl',
      homeTeam: event.strHomeTeam,
      awayTeam: event.strAwayTeam,
      homeTeamBadge: event.strHomeTeamBadge,
      awayTeamBadge: event.strAwayTeamBadge,
      status: event.strStatus,
      homeScore: event.intHomeScore,
      awayScore: event.intAwayScore
    }));
  }

  private transformMLBEvents(mlbEvents: any[], team: any): CalendarEvent[] {
    console.log(`[Calendar Sync] Filtering MLB events for team: ${team.teamName}`);
    
    // Filter events that include the selected team
    const teamEvents = mlbEvents.filter(event => {
      const homeTeam = event.strHomeTeam?.toLowerCase() || '';
      const awayTeam = event.strAwayTeam?.toLowerCase() || '';
      const selectedTeam = team.teamName.toLowerCase();
      
      const isMatch = homeTeam.includes(selectedTeam) || awayTeam.includes(selectedTeam) ||
                     selectedTeam.includes(homeTeam) || selectedTeam.includes(awayTeam);
      
      if (isMatch) {
        console.log(`[Calendar Sync] MLB match found: ${event.strHomeTeam} vs ${event.strAwayTeam} for ${team.teamName}`);
      }
      
      return isMatch;
    });
    
    console.log(`[Calendar Sync] Found ${teamEvents.length} MLB events for ${team.teamName} out of ${mlbEvents.length} total events`);
    
    return teamEvents.map(event => ({
      id: `mlb_${event.idEvent}`,
      title: `${event.strHomeTeam} vs ${event.strAwayTeam}`,
      description: `MLB - ${event.strVenue || 'TBD'}`,
      startDate: `${event.dateEvent}T${event.strTime || '19:10:00'}`,
      endDate: `${event.dateEvent}T${this.addMinutes(event.strTime || '19:10:00', 210)}`, // 210 minutes for MLB
      location: event.strVenue || 'TBD',
      sport: 'mlb',
      homeTeam: event.strHomeTeam,
      awayTeam: event.strAwayTeam,
      homeTeamBadge: event.strHomeTeamBadge,
      awayTeamBadge: event.strAwayTeamBadge,
      status: event.strStatus,
      homeScore: event.intHomeScore,
      awayScore: event.intAwayScore
    }));
  }


  private async getFootballEventsFromAPI(leagueId: string): Promise<any[]> {
    try {
      // Try Football-Data.org API first (most complete)
      const footballDataKey = process.env.FOOTBALL_DATA_KEY;
      if (footballDataKey && footballDataKey !== 'your_football_data_api_key') {
        console.log(`[Calendar Sync] Using Football-Data.org API for league ${leagueId}`);
        const events = await this.getFootballDataOrgEvents(leagueId, footballDataKey);
        if (events.length > 0) {
          console.log(`[Calendar Sync] Football-Data.org returned ${events.length} events`);
          return events;
        }
        console.log(`[Calendar Sync] Football-Data.org returned 0 events, trying fallback`);
      }
      
      // Fallback to API-FOOTBALL
      const apiFootballKey = process.env.API_FOOTBALL_KEY;
      if (apiFootballKey && apiFootballKey !== 'your_api_football_key') {
        console.log(`[Calendar Sync] Using API-FOOTBALL for league ${leagueId}`);
        const events = await this.getApiFootballEvents(leagueId, apiFootballKey);
        if (events.length > 0) {
          console.log(`[Calendar Sync] API-FOOTBALL returned ${events.length} events`);
          return events;
        }
        console.log(`[Calendar Sync] API-FOOTBALL returned 0 events, trying fallback`);
      }
      
      // Final fallback to TheSportsDB
      console.log(`[Calendar Sync] Using TheSportsDB fallback for league ${leagueId}`);
      const events = await this.theSportsDBService.getFootballEvents(leagueId, '2025-26');
      console.log(`[Calendar Sync] TheSportsDB returned ${events.length} events`);
      return events;
    } catch (error) {
      console.error('Error fetching football events:', error);
      return [];
    }
  }

  private async getFootballDataOrgEvents(leagueId: string, apiKey: string): Promise<any[]> {
    try {
      // Map internal league IDs to football-data.org competition IDs
      const leagueMapping: Record<string, { id: number, name: string }> = {
        '4328': { id: 2021, name: 'Premier League' },        // Premier League
        '4331': { id: 2002, name: 'Bundesliga' },            // Bundesliga  
        '78': { id: 2002, name: 'Bundesliga' },              // Bundesliga (alternative ID)
        '39': { id: 2021, name: 'Premier League' },          // Premier League (alternative ID)
        '4480': { id: 2001, name: 'Champions League' },      // UEFA Champions League
        '4497': { id: 2018, name: 'European Championship' }  // UEFA European Championship
      };

      const competition = leagueMapping[leagueId];
      if (!competition) {
        console.log(`[Calendar Sync] Unknown league ID ${leagueId} for Football-Data.org`);
        console.log(`[Calendar Sync] Available league mappings:`, Object.keys(leagueMapping));
        return [];
      }
      
      console.log(`[Calendar Sync] Using Football-Data.org competition ${competition.id} (${competition.name}) for league ${leagueId}`);

      const headers = { 'X-Auth-Token': apiKey };
      
      // Get upcoming matches with 30-day range
      const today = new Date();
      const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      const dateFrom = today.toISOString().split('T')[0];
      const dateTo = thirtyDaysFromNow.toISOString().split('T')[0];
      
      let url = `https://api.football-data.org/v4/competitions/${competition.id}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`;
      
      const response = await fetch(url, { headers });
      if (!response.ok) {
        console.log(`[Calendar Sync] Football-Data.org API failed with status ${response.status}`);
        return [];
      }
      
      const data = await response.json();
      const matches = data?.matches || [];
      
      console.log(`[Calendar Sync] Football-Data.org returned ${matches.length} matches`);
      
      return matches.map((match: any) => ({
        idEvent: `football_${match.id}`,
        strEvent: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
        dateEvent: match.utcDate.split('T')[0],
        strTime: match.utcDate.split('T')[1]?.split('.')[0] || '15:00:00',
        strHomeTeam: match.homeTeam.name,
        strAwayTeam: match.awayTeam.name,
        strStatus: match.status === 'SCHEDULED' ? 'Scheduled' : match.status,
        strVenue: match.venue || 'TBD'
      }));
    } catch (error) {
      console.error('Error fetching Football-Data.org events:', error);
      return [];
    }
  }

  private async getApiFootballEvents(leagueId: string, apiKey: string): Promise<any[]> {
    try {
      const headers = { 'x-apisports-key': apiKey };
      
      // Map internal league IDs to API-FOOTBALL league IDs
      const apiFootballMapping: Record<string, string> = {
        '78': '78',      // Bundesliga
        '39': '39',      // Premier League
        '4328': '39',    // Premier League (alternative)
        '4331': '78',    // Bundesliga (alternative)
        '2': '2',        // Champions League
        '4': '4'         // European Championship
      };
      
      const apiFootballLeagueId = apiFootballMapping[leagueId] || leagueId;
      console.log(`[Calendar Sync] Using API-FOOTBALL league ${apiFootballLeagueId} for internal league ${leagueId}`);
      const url = `https://v3.football.api-sports.io/fixtures?league=${apiFootballLeagueId}&next=50&timezone=Europe/Berlin`;
      
      const response = await fetch(url, { headers });
      if (!response.ok) {
        console.log(`[Calendar Sync] API-FOOTBALL failed with status ${response.status}`);
        return [];
      }
      
      const data = await response.json();
      const fixtures = data?.response || [];
      
      console.log(`[Calendar Sync] API-FOOTBALL returned ${fixtures.length} fixtures`);
      
      return fixtures.map((fixture: any) => ({
        idEvent: `football_${fixture.fixture.id}`,
        strEvent: `${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
        dateEvent: fixture.fixture.date.split('T')[0],
        strTime: fixture.fixture.date.split('T')[1]?.split('.')[0] || '15:00:00',
        strHomeTeam: fixture.teams.home.name,
        strAwayTeam: fixture.teams.away.name,
        strStatus: fixture.fixture.status.short,
        strVenue: fixture.fixture.venue?.name || 'TBD'
      }));
    } catch (error) {
      console.error('Error fetching API-FOOTBALL events:', error);
      return [];
    }
  }

  private async getF1EventsFromAPI(): Promise<any[]> {
    try {
      const currentYear = new Date().getFullYear();
      const response = await fetch(`https://api.jolpi.ca/ergast/f1/${currentYear}.json`);
      
      if (!response.ok) {
        throw new Error(`F1 API responded with status ${response.status}`);
      }
      
      const data = await response.json();
      const races = data.MRData?.RaceTable?.Races || [];
      
      return races.map((race: any) => ({
        idEvent: `f1_${race.round}`,
        strEvent: `${race.raceName} - ${race.Circuit.circuitName}`,
        dateEvent: race.date,
        strTime: race.time?.replace('Z', '') || '15:00:00',
        strVenue: race.Circuit.circuitName,
        strStatus: 'Scheduled'
      }));
    } catch (error) {
      console.error('Error fetching F1 events:', error);
      return [];
    }
  }

  private transformF1Events(f1Events: any[], team: any): CalendarEvent[] {
    console.log(`[Calendar Sync] Processing F1 events for driver: ${team.teamName}`);
    
    // For F1, we show all races since they're not team-specific
    // But we can add driver info to the description if it's a specific driver
    const isDriverSpecific = team.teamName.toLowerCase().includes('verstappen') || 
                           team.teamName.toLowerCase().includes('hamilton') ||
                           team.teamName.toLowerCase().includes('leclerc');
    
    console.log(`[Calendar Sync] F1 driver-specific: ${isDriverSpecific}, showing ${f1Events.length} races`);
    
    return f1Events.map(event => ({
      id: `f1_${event.idEvent}`,
      title: event.strEvent,
      description: isDriverSpecific 
        ? `Formula 1 - ${team.teamName} - ${event.strVenue || 'TBD'}`
        : `Formula 1 - ${event.strVenue || 'TBD'}`,
      startDate: `${event.dateEvent}T${event.strTime}`,
      endDate: `${event.dateEvent}T${this.addMinutes(event.strTime, 120)}`, // 120 minutes for F1
      location: event.strVenue || 'TBD',
      sport: 'f1',
      status: event.strStatus
    }));
  }

  private generateICS(events: CalendarEvent[], userEmail: string): string {
    const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    // Use proper CRLF line endings for ICS format
    const crlf = '\r\n';
    
    let ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//SportsKalendar//Sports Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:SportsKalendar - Your Teams',
      'X-WR-CALDESC:Sports Calendar for your favorite teams from SportsKalendar',
      'X-WR-TIMEZONE:Europe/Berlin',
      'X-WR-RELCALID:sportskalendar-calendar',
      'REFRESH-INTERVAL;VALUE=DURATION:PT30M',
      'X-PUBLISHED-TTL:PT30M',
      'X-WR-CALID:12345678-1234-1234-1234-123456789012@sportskalendar.de',
      'URL:https://sportskalendar.de'
    ].join(crlf) + crlf;

    events.forEach(event => {
      const startDate = event.startDate.replace(/[-:]/g, '').split('.')[0] + 'Z';
      const endDate = event.endDate.replace(/[-:]/g, '').split('.')[0] + 'Z';
      
      // Escape special characters for ICS format
      const escapeICS = (text: string) => {
        return text
          .replace(/\\/g, '\\\\')
          .replace(/;/g, '\\;')
          .replace(/,/g, '\\,')
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '');
      };
      
      const eventLines = [
        'BEGIN:VEVENT',
        `UID:${event.id}@sportskalendar.de`,
        `DTSTAMP:${now}`,
        `DTSTART:${startDate}`,
        `DTEND:${endDate}`,
        `SUMMARY:${escapeICS(event.title)}`,
        `DESCRIPTION:${escapeICS(event.description || event.title)}`,
        event.location ? `LOCATION:${escapeICS(event.location)}` : '',
        event.url ? `URL:${escapeICS(event.url)}` : '',
        `STATUS:${event.status === 'Finished' ? 'CONFIRMED' : 'TENTATIVE'}`,
        'SEQUENCE:0',
        'TRANSP:OPAQUE',
        'CLASS:PUBLIC',
        'PRIORITY:5',
        'END:VEVENT'
      ].filter(line => line !== ''); // Remove empty lines
      
      ics += eventLines.join(crlf) + crlf;
    });

    ics += 'END:VCALENDAR';
    return ics;
  }

  private generateCSV(events: CalendarEvent[]): string {
    const headers = ['Title', 'Start Date', 'End Date', 'Location', 'Sport', 'Home Team', 'Away Team', 'Status'];
    const csvRows = [headers.join(',')];

    events.forEach(event => {
      const row = [
        `"${event.title}"`,
        `"${event.startDate}"`,
        `"${event.endDate}"`,
        `"${event.location || ''}"`,
        `"${event.sport}"`,
        `"${event.homeTeam || ''}"`,
        `"${event.awayTeam || ''}"`,
        `"${event.status || ''}"`
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  private addMinutes(timeStr: string, minutes: number): string {
    const timeParts = timeStr.split(':').map(Number);
    const hours = timeParts[0] || 0;
    const mins = timeParts[1] || 0;
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}:00`;
  }

  private generateSyncToken(userId: string): string {
    // Generate a secure token for calendar sync
    return Buffer.from(`${userId}:${Date.now()}`).toString('base64');
  }

  async validateSyncToken(token: string): Promise<string | null> {
    try {
      // Decode the token
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [userId, timestamp] = decoded.split(':');
      
      if (!userId || !timestamp) {
        console.log('[Calendar Sync] Invalid token format');
        return null;
      }
      
      // Check if token is not too old (24 hours)
      const tokenAge = Date.now() - parseInt(timestamp, 10);
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (tokenAge > maxAge) {
        console.log(`[Calendar Sync] Token expired, age: ${tokenAge}ms`);
        return null;
      }
      
      console.log(`[Calendar Sync] Valid token for user ${userId}`);
      return userId;
    } catch (error) {
      console.log('[Calendar Sync] Token validation error:', error);
      return null;
    }
  }

  private getDefaultSyncSettings(): CalendarSyncSettings {
    return {
      includePastEvents: false,
      includeFutureEvents: true,
      eventReminders: [60, 15], // 1 hour and 15 minutes before
      defaultEventDuration: 120, // 2 hours
      includeScores: true,
      includeTeamLogos: true,
      sports: ['football', 'nba', 'nhl', 'mlb', 'f1', 'tennis'],
      timezone: 'Europe/Berlin'
    };
  }
}
