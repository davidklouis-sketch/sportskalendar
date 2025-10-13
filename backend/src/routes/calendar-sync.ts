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

// Generate iCal/ICS file for user's selected teams
calendarSyncRouter.get('/export', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const format = req.query.format as string || 'ics'; // ics, json, csv
    
    console.log(`[Calendar Sync] Export request from user ${userId}, format: ${format}`);
    
    const calendarSyncService = new CalendarSyncService();
    const result = await calendarSyncService.generateCalendarExport(userId, format);
    
    if (format === 'ics') {
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="sportskalendar-${userId}.ics"`);
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
  } catch (error) {
    console.error('[Calendar Sync] Export error:', error);
    res.status(500).json({ error: 'Failed to generate calendar export' });
  }
});

// Get calendar sync URL for external calendar apps (Google Calendar, Outlook, etc.)
calendarSyncRouter.get('/url', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    
    console.log(`[Calendar Sync] URL request from user ${userId}`);
    
    const calendarSyncService = new CalendarSyncService();
    const syncUrl = await calendarSyncService.generateSyncUrl(userId);
    
    res.json({ 
      syncUrl,
      instructions: {
        google: 'Copy the URL and add it to Google Calendar as a new calendar by URL',
        outlook: 'Copy the URL and add it to Outlook as a new calendar subscription',
        apple: 'Copy the URL and add it to Apple Calendar as a new calendar subscription',
        general: 'Use this URL to subscribe to your sports calendar in any calendar app'
      }
    });
    
    console.log(`[Calendar Sync] Sync URL generated for user ${userId}`);
  } catch (error) {
    console.error('[Calendar Sync] URL generation error:', error);
    res.status(500).json({ error: 'Failed to generate sync URL' });
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
  } catch (error) {
    console.error('[Calendar Sync] Status error:', error);
    res.status(500).json({ error: 'Failed to get sync status', details: error.message });
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
  } catch (error) {
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
  } catch (error) {
    console.error('[Calendar Sync] Events error:', error);
    res.status(500).json({ error: 'Failed to get calendar events' });
  }
});
