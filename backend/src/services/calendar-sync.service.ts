// import { userApi } from '../lib/database';
import { TheSportsDBService } from './thesportsdb.service';
// import { FootballDataService } from './football-data.service';
// import { ErgastService } from './ergast.service';

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
  // private footballDataService = new FootballDataService();
  // private ergastService = new ErgastService();

  async generateCalendarExport(userId: string, format: string = 'ics'): Promise<string> {
    try {
      // Get user data (mock for now)
      const user = { id: userId, email: 'user@example.com' };
      // const user = await userApi.getUser(userId);
      // if (!user) {
      //   throw new Error('User not found');
      // }

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
    const baseUrl = process.env.FRONTEND_URL || 'https://sportskalendar.de';
    const syncUrl = `${baseUrl}/api/calendar-sync/export?user=${userId}&format=ics&token=${this.generateSyncToken(userId)}`;
    return syncUrl;
  }

  async getSyncStatus(userId: string): Promise<any> {
    try {
      // Mock user data for now
      const user = { id: userId, isPremium: true };
      // const user = await userApi.getUser(userId);
      // if (!user) {
      //   throw new Error('User not found');
      // }

      const events = await this.getCalendarEvents(userId);
      const upcomingEvents = events.filter(event => new Date(event.startDate) > new Date());

      return {
        isPremium: user.isPremium,
        canSync: user.isPremium,
        totalEvents: events.length,
        upcomingEvents: upcomingEvents.length,
        lastSync: new Date().toISOString(),
        syncUrl: await this.generateSyncUrl(userId),
        settings: this.getDefaultSyncSettings()
      };
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
      // Mock user data for now
      const user = { id: userId, selectedTeams: [] };
      // const user = await userApi.getUser(userId);
      // if (!user || !user.selectedTeams) {
      //   return [];
      // }

      const events: CalendarEvent[] = [];
      const start = startDate ? new Date(startDate) : new Date();
      const end = endDate ? new Date(endDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now

      // Get events for each selected team
      for (const team of user.selectedTeams as any[]) {
        try {
          const teamEvents = await this.getEventsForTeam(team, start, end);
          events.push(...teamEvents);
        } catch (error) {
          console.error(`Error getting events for team ${team.sport}:${team.teamName}:`, error);
        }
      }

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
      if (team.sport === 'football') {
        // Get football events from TheSportsDB or Football-Data API
        const footballEvents = await this.theSportsDBService.getFootballEvents(team.leagueId);
        events.push(...this.transformFootballEvents(footballEvents, team));
      } else if (team.sport === 'nba') {
        const nbaEvents = await this.theSportsDBService.getNBAEvents('2025-26');
        events.push(...this.transformNBAEvents(nbaEvents, team));
      } else if (team.sport === 'nhl') {
        const nhlEvents = await this.theSportsDBService.getNHLEvents();
        events.push(...this.transformNHLEvents(nhlEvents, team));
      } else if (team.sport === 'mlb') {
        const mlbEvents = await this.theSportsDBService.getMLBEvents();
        events.push(...this.transformMLBEvents(mlbEvents, team));
      } else if (team.sport === 'f1') {
        // const f1Events = await this.ergastService.getF1Events();
        // events.push(...this.transformF1Events(f1Events, team));
        // Mock F1 events for now
        events.push({
          id: `f1_mock_${Date.now()}`,
          title: 'F1 Race - Mock Event',
          description: 'Mock F1 Race',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
          sport: 'f1',
          location: 'Mock Circuit'
        });
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
    return nbaEvents.map(event => ({
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
    return nhlEvents.map(event => ({
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
    return mlbEvents.map(event => ({
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

  // private transformF1Events(f1Events: any[], team: any): CalendarEvent[] {
  //   return f1Events.map(event => ({
  //     id: `f1_${event.idEvent}`,
  //     title: event.strEvent,
  //     description: `Formula 1 - ${event.strVenue || 'TBD'}`,
  //     startDate: `${event.dateEvent}T${event.strTime || '15:00:00'}`,
  //     endDate: `${event.dateEvent}T${this.addMinutes(event.strTime || '15:00:00', 120)}`, // 120 minutes for F1
  //     location: event.strVenue || 'TBD',
  //     sport: 'f1',
  //     status: event.strStatus
  //   }));
  // }

  private generateICS(events: CalendarEvent[], userEmail: string): string {
    const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    let ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//SportsKalendar//Sports Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:SportsKalendar
X-WR-CALDESC:Sports Calendar for your favorite teams
X-WR-TIMEZONE:Europe/Berlin
`;

    events.forEach(event => {
      const startDate = event.startDate.replace(/[-:]/g, '').split('.')[0] + 'Z';
      const endDate = event.endDate.replace(/[-:]/g, '').split('.')[0] + 'Z';
      
      ics += `BEGIN:VEVENT
UID:${event.id}@sportskalendar.de
DTSTAMP:${now}
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${event.title}
DESCRIPTION:${event.description || ''}
LOCATION:${event.location || ''}
URL:${event.url || ''}
STATUS:${event.status === 'Finished' ? 'CONFIRMED' : 'TENTATIVE'}
END:VEVENT
`;
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
