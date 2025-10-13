import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { CalendarSyncService } from '../services/calendar-sync.service';
import { Request, Response } from 'express';

export const calendarSyncRouter = Router();

// Helper function for authentication
async function authenticateRequest(req: Request, res: Response): Promise<{success: boolean, userId?: string, status?: number, error?: any}> {
  try {
    const authHeader = req.headers.authorization || '';
    let token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      token = (req as any).cookies?.['access_token'] || null;
    }
    
    if (!token) {
      return {
        success: false,
        status: 401,
        error: { 
          error: 'Authentication required',
          message: 'No valid token provided' 
        }
      };
    }
    
    // Use the existing requireAuth logic
    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET;
    if (!secret || secret === 'dev_secret_change_me') {
      return {
        success: false,
        status: 500,
        error: { 
          error: 'Server configuration error',
          message: 'Authentication service unavailable' 
        }
      };
    }
    
    const payload = jwt.verify(token, secret, {
      issuer: 'sportskalendar',
      audience: 'sportskalendar-users'
    });
    
    if (!payload.id || !payload.email) {
      return {
        success: false,
        status: 401,
        error: { 
          error: 'Invalid token',
          message: 'Token payload is invalid' 
        }
      };
    }
    
    return {
      success: true,
      userId: payload.id
    };
  } catch (error) {
    return {
      success: false,
      status: 401,
      error: { 
        error: 'Invalid token',
        message: 'Token verification failed' 
      }
    };
  }
}

// Test endpoint without authentication
calendarSyncRouter.get('/test', (req, res) => {
  console.log('[Calendar Sync] Test endpoint called');
  res.json({ 
    status: 'OK', 
    message: 'Calendar Sync API is working',
    timestamp: new Date().toISOString(),
    endpoint: 'test',
    note: 'This endpoint works without authentication'
  });
});

// Additional test endpoint for debugging
calendarSyncRouter.get('/debug', (req, res) => {
  console.log('[Calendar Sync] Debug endpoint called');
  res.json({ 
    status: 'OK', 
    message: 'Calendar Sync Debug Info',
    timestamp: new Date().toISOString(),
    endpoint: 'debug',
    headers: {
      authorization: req.headers.authorization || 'none',
      cookie: req.headers.cookie || 'none',
      userAgent: req.headers['user-agent'] || 'none'
    },
    note: 'This endpoint works without authentication'
  });
});

// Debug endpoint to check user's selected teams (requires auth)
calendarSyncRouter.get('/debug-user', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    console.log(`[Calendar Sync] Debug user endpoint called for user ${userId}`);
    
    // Get user data from database
    const { UserRepository } = await import('../database/repositories/userRepository');
    const user = await UserRepository.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        userId: userId
      });
    }
    
    // Try to get events for this user
    const calendarSyncService = new CalendarSyncService();
    const events = await calendarSyncService.getCalendarEvents(userId);
    
    res.json({
      status: 'OK',
      userId: userId,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        isPremium: user.isPremium,
        selectedTeams: user.selectedTeams || [],
        selectedTeamsCount: user.selectedTeams?.length || 0
      },
      events: {
        count: events.length,
        sample: events.slice(0, 3) // First 3 events as sample
      },
                  environment: {
                    FOOTBALL_DATA_KEY: process.env.FOOTBALL_DATA_KEY ? 'SET' : 'NOT_SET',
                    API_FOOTBALL_KEY: process.env.API_FOOTBALL_KEY ? 'SET' : 'NOT_SET',
                    THESPORTSDB_API_KEY: process.env.THESPORTSDB_API_KEY ? 'SET' : 'NOT_SET'
                  }
    });
  } catch (error) {
    console.error('[Calendar Sync] Debug user error:', error);
    res.status(500).json({ 
      error: 'Debug failed', 
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Extended debug endpoint to test individual API calls
calendarSyncRouter.get('/debug-apis', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    console.log(`[Calendar Sync] Debug APIs endpoint called for user ${userId}`);
    
    // Get user data from database
    const { UserRepository } = await import('../database/repositories/userRepository');
    const user = await UserRepository.findById(userId);
    
    if (!user || !user.selectedTeams) {
      return res.status(404).json({ 
        error: 'User not found or no selected teams',
        userId: userId
      });
    }
    
    const results: any = {
      userId: userId,
      user: {
        id: user.id,
        email: user.email,
        selectedTeams: user.selectedTeams
      },
      apiTests: {}
    };
    
    // Test each team's API individually
    for (const team of user.selectedTeams) {
      console.log(`[Calendar Sync] Testing API for team: ${team.sport} - ${team.teamName}`);
      
      try {
        if (team.sport === 'football') {
          // Test Football APIs
          results.apiTests[`${team.sport}_${team.teamName}`] = await testFootballAPIs(team);
        } else if (team.sport === 'nba') {
          // Test NBA API
          results.apiTests[`${team.sport}_${team.teamName}`] = await testNBAAPI(team);
        } else if (team.sport === 'f1') {
          // Test F1 API
          results.apiTests[`${team.sport}_${team.teamName}`] = await testF1API(team);
        }
      } catch (error) {
        results.apiTests[`${team.sport}_${team.teamName}`] = {
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
    
    res.json(results);
  } catch (error) {
    console.error('[Calendar Sync] Debug APIs error:', error);
    res.status(500).json({ 
      error: 'Debug APIs failed', 
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper function to test Football APIs
async function testFootballAPIs(team: any) {
  const results: any = {
    team: team.teamName,
    leagueId: team.leagueId,
    tests: {}
  };
  
  // Test TheSportsDB directly (same as Calendar-Sync)
  try {
    const { TheSportsDBService } = await import('../services/thesportsdb.service');
    const theSportsDBService = new TheSportsDBService();
    
    // Use EXACT same season logic as Calendar-Sync
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
    
    console.log(`[Debug Football] Using season: ${season} (same as Calendar-Sync)`);
    const footballEvents = await theSportsDBService.getFootballEventsMultipleLeagues([team.leagueId], season);
    
    results.tests.theSportsDB = {
      season: season,
      eventCount: footballEvents.length,
      sampleEvents: footballEvents.slice(0, 3)
    };
  } catch (error) {
    results.tests.theSportsDB = {
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
  
  // Test API-FOOTBALL
  try {
    const apiFootballKey = process.env.API_FOOTBALL_KEY;
    if (apiFootballKey && apiFootballKey !== 'your_api_football_key') {
      const headers = { 'x-apisports-key': apiFootballKey };
      const url = `https://v3.football.api-sports.io/fixtures?league=${team.leagueId}&next=50&timezone=Europe/Berlin`;
      
      const response = await fetch(url, { headers });
      const data = await response.json();
      
      results.tests.apiFootball = {
        status: response.status,
        url: url,
        fixtureCount: data?.response?.length || 0,
        sampleFixtures: data?.response?.slice(0, 3) || []
      };
    }
  } catch (error) {
    results.tests.apiFootball = {
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
  
  return results;
}

// Helper function to test NBA API
async function testNBAAPI(team: any) {
  try {
    const { TheSportsDBService } = await import('../services/thesportsdb.service');
    const theSportsDBService = new TheSportsDBService();
    
    // Use EXACT same season logic as Calendar-Sync
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
    
    console.log(`[Debug NBA] Using season: ${season} (same as Calendar-Sync)`);
    const nbaEvents = await theSportsDBService.getNBAEvents(season);
    
    return {
      team: team.teamName,
      season: season,
      totalEvents: nbaEvents.length,
      sampleEvents: nbaEvents.slice(0, 3),
      teamMatches: nbaEvents.filter(event => {
        const homeTeam = event.strHomeTeam?.toLowerCase() || '';
        const awayTeam = event.strAwayTeam?.toLowerCase() || '';
        const selectedTeam = team.teamName.toLowerCase();
        return homeTeam.includes(selectedTeam) || awayTeam.includes(selectedTeam);
      }).length
    };
  } catch (error) {
    return {
      team: team.teamName,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Helper function to test F1 API
async function testF1API(team: any) {
  try {
    const currentYear = new Date().getFullYear();
    const response = await fetch(`https://api.jolpi.ca/ergast/f1/${currentYear}.json`);
    
    if (!response.ok) {
      throw new Error(`F1 API responded with status ${response.status}`);
    }
    
    const data = await response.json();
    const races = data.MRData?.RaceTable?.Races || [];
    
    return {
      team: team.teamName,
      totalRaces: races.length,
      sampleRaces: races.slice(0, 3),
      currentYear: currentYear
    };
  } catch (error) {
    return {
      team: team.teamName,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Simple ICS test endpoint without authentication
calendarSyncRouter.get('/test.ics', (req, res) => {
  console.log('[Calendar Sync] Test ICS endpoint called');
  
  const testICS = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//SportsKalendar//Test Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:SportsKalendar Test
X-WR-CALDESC:Test calendar for SportsKalendar
X-WR-TIMEZONE:Europe/Berlin
BEGIN:VEVENT
UID:test-event@sportskalendar.de
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${new Date(Date.now() + 24*60*60*1000).toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${new Date(Date.now() + 24*60*60*1000 + 2*60*60*1000).toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:Test Event - SportsKalendar
DESCRIPTION:This is a test event to verify calendar sync functionality
STATUS:CONFIRMED
SEQUENCE:0
TRANSP:OPAQUE
CLASS:PUBLIC
PRIORITY:5
END:VEVENT
END:VCALENDAR`;

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes
  res.send(testICS);
});

// OPTIONS endpoint for CORS preflight requests
calendarSyncRouter.options('/export', (req, res) => {
  console.log('[Calendar Sync] OPTIONS preflight request');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  res.status(200).end();
});

// Generate iCal/ICS file for user's selected teams
// Supports both authenticated requests (with cookies) and token-based requests (for calendar apps)
calendarSyncRouter.get('/export', async (req, res) => {
  try {
    let userId: string;
    let format = req.query.format as string || 'ics'; // ics, json, csv
    
    // Check for token-based authentication (for calendar apps)
    const token = req.query.token as string;
    if (token) {
      console.log(`[Calendar Sync] Token-based export request, token: ${token.substring(0, 10)}...`);
      // Validate token and extract user ID
      const calendarSyncService = new CalendarSyncService();
      const validatedUserId = await calendarSyncService.validateSyncToken(token);
      if (!validatedUserId) {
        return res.status(401).json({ 
          error: 'Invalid sync token',
          message: 'The provided sync token is invalid or expired' 
        });
      }
      userId = validatedUserId;
    } else {
      // Fallback to cookie-based authentication (for web app)
      console.log(`[Calendar Sync] Cookie-based export request`);
      const authResult = await authenticateRequest(req, res);
      if (!authResult.success) {
        return res.status(authResult.status || 401).json(authResult.error || { error: 'Authentication failed' });
      }
      userId = authResult.userId || '';
    }
    
    console.log(`[Calendar Sync] Export request from user ${userId}, format: ${format}`);
    
    const calendarSyncService = new CalendarSyncService();
    const result = await calendarSyncService.generateCalendarExport(userId, format);
    
    if (format === 'ics') {
      // Calendar apps expect specific headers for ICS files
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=1800'); // Cache for 30 minutes
      res.setHeader('Access-Control-Allow-Origin', '*'); // Allow cross-origin requests
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Type, Cache-Control');
      
      // Add calendar-specific headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      
      // Don't set Content-Disposition for calendar sync - apps expect inline content
      res.send(result);
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="sportskalendar-${userId}.json"`);
      res.json(result);
    } else if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="sportskalendar-${userId}.csv"`);
      res.send(result);
    } else {
      res.status(400).json({ error: 'Unsupported format. Use: ics, json, or csv' });
    }
    
    console.log(`[Calendar Sync] Export completed for user ${userId}`);
  } catch (error: unknown) {
    console.error('[Calendar Sync] Export error:', error);
    res.status(500).json({ error: 'Failed to generate calendar export' });
  }
});

// Get calendar sync URL for external calendar apps (Google Calendar, Outlook, etc.)
calendarSyncRouter.get('/url', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    
    console.log(`[Calendar Sync] URL request from user ${userId}`);
    console.log(`[Calendar Sync] Request headers:`, req.headers);
    console.log(`[Calendar Sync] Request cookies:`, req.cookies);
    
    const calendarSyncService = new CalendarSyncService();
    const syncUrl = await calendarSyncService.generateSyncUrl(userId);
    
    console.log(`[Calendar Sync] Generated sync URL:`, syncUrl);
    
    const response = { 
      syncUrl,
      instructions: {
        google: 'Copy the URL and add it to Google Calendar as a new calendar by URL',
        outlook: 'Copy the URL and add it to Outlook as a new calendar subscription',
        apple: 'Copy the URL and add it to Apple Calendar as a new calendar subscription',
        general: 'Use this URL to subscribe to your sports calendar in any calendar app'
      }
    };
    
    console.log(`[Calendar Sync] Response data:`, response);
    res.json(response);
    
    console.log(`[Calendar Sync] Sync URL generated successfully for user ${userId}`);
  } catch (error: unknown) {
    console.error('[Calendar Sync] URL generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to generate sync URL', details: errorMessage });
  }
});

// Get calendar sync status and settings
calendarSyncRouter.get('/status', requireAuth, async (req, res) => {
  try {
    console.log('[Calendar Sync] Status request received');
    console.log('[Calendar Sync] Headers:', req.headers);
    console.log('[Calendar Sync] Cookies:', req.headers.cookie);
    console.log('[Calendar Sync] User from auth:', (req as any).user);
    
    const userId = (req as any).user?.id;
    
    if (!userId) {
      console.error('[Calendar Sync] No user ID found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    console.log(`[Calendar Sync] Status request from user ${userId}`);
    
    const calendarSyncService = new CalendarSyncService();
    const status = await calendarSyncService.getSyncStatus(userId);
    
    console.log('[Calendar Sync] Status generated successfully:', status);
    res.json(status);
  } catch (error: unknown) {
    console.error('[Calendar Sync] Status error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to get sync status', details: errorMessage });
  }
});

// Update calendar sync settings
calendarSyncRouter.post('/settings', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const settings = req.body;
    
    console.log(`[Calendar Sync] Settings update from user ${userId}:`, settings);
    
    const calendarSyncService = new CalendarSyncService();
    await calendarSyncService.updateSyncSettings(userId, settings);
    
    res.json({ success: true, message: 'Calendar sync settings updated' });
  } catch (error: unknown) {
    console.error('[Calendar Sync] Settings update error:', error);
    res.status(500).json({ error: 'Failed to update sync settings' });
  }
});

// Get calendar events for specific date range
calendarSyncRouter.get('/events', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const startDate = req.query.start as string;
    const endDate = req.query.end as string;
    const sport = req.query.sport as string;
    
    console.log(`[Calendar Sync] Events request from user ${userId}, range: ${startDate} to ${endDate}, sport: ${sport}`);
    
    const calendarSyncService = new CalendarSyncService();
    const events = await calendarSyncService.getCalendarEvents(userId, startDate, endDate, sport);
    
    res.json({ events });
  } catch (error: unknown) {
    console.error('[Calendar Sync] Events error:', error);
    res.status(500).json({ error: 'Failed to get calendar events' });
  }
});
