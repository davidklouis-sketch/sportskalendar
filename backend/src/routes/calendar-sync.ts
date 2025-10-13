import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { CalendarSyncService } from '../services/calendar-sync.service';

export const calendarSyncRouter = Router();

// Test endpoint without authentication
calendarSyncRouter.get('/test', (req, res) => {
  console.log('[Calendar Sync] Test endpoint called');
  res.json({ 
    status: 'OK', 
    message: 'Calendar Sync API is working',
    timestamp: new Date().toISOString(),
    headers: req.headers
  });
});

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
calendarSyncRouter.get('/export', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const format = req.query.format as string || 'ics'; // ics, json, csv
    
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
