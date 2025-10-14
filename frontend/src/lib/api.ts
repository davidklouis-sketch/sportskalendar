/**
 * API CLIENT (Axios)
 * 
 * Zentrale API-Client-Konfiguration für alle Backend-Requests.
 * Verwendet Axios mit Interceptors für automatisches Token-Refresh.
 * 
 * Features:
 * - Automatisches JWT Token Refresh bei 401 Errors
 * - Cookie-basierte Authentication (httpOnly Cookies)
 * - 30 Sekunden Timeout
 * - Type-Safe API Calls
 * - Automatic Logout bei Auth-Fehlern
 * - Request Deduplication für Live-API
 * - Rate Limiting Protection
 * 
 * Backend URL:
 * - Production: https://api.sportskalendar.de/api
 * - Development: Über VITE_API_URL Environment Variable konfigurierbar
 */

import axios from 'axios';

// Request cache for deduplication
const requestCache = new Map<string, { promise: Promise<any>; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds cache for live API calls

// API Base URL aus Environment Variable oder Production Default
const API_URL = import.meta.env.VITE_API_URL || 'https://api.sportskalendar.de/api';

/**
 * Axios Instance
 * 
 * Konfiguriert mit:
 * - withCredentials: true (für httpOnly Cookies)
 * - timeout: 30000ms (30 Sekunden)
 * - Content-Type: application/json
 * - Custom transformRequest für Array-Serialisierung
 */
export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Wichtig für Cookie-basierte Auth
  timeout: 30000, // 30 Sekunden Timeout
  headers: {
    'Content-Type': 'application/json',
  },
  transformRequest: [(data) => {
    // Arrays korrekt serialisieren (verhindert Array-zu-Object Konvertierung)
    return JSON.stringify(data);
  }],
});

/**
 * AXIOS RESPONSE INTERCEPTOR
 * 
 * Automatisches Token-Refresh bei 401 Unauthorized Errors.
 * 
 * Flow:
 * 1. Request schlägt mit 401 fehl
 * 2. Interceptor versucht Token-Refresh via /auth/refresh
 * 3. Bei Erfolg: Original Request wiederholen
 * 4. Bei Fehler: User ausloggen
 * 
 * Wichtig: Verhindert Infinite Loops durch _retry Flag und /auth/refresh Ausschluss
 */
api.interceptors.response.use(
  (response) => response, // Erfolgreiche Responses durchlassen
  async (error) => {
    const originalRequest = error.config;
    
    // NIEMALS bei Rate Limiting (429) abmelden
    if (error.response?.status === 429) {
      console.warn('⚠️ Rate limit reached, but NOT logging out user');
      return Promise.reject(error);
    }
    
    // Nur bei 401 und wenn nicht bereits retried und nicht der Refresh-Endpoint selbst
    // Live-API-Endpoints sollten nicht das Token-Refresh auslösen
    if (error.response?.status === 401 && !originalRequest._retry && 
        !originalRequest.url?.includes('/auth/refresh') && 
        !originalRequest.url?.includes('/live/')) {
      originalRequest._retry = true; // Verhindert Infinite Loop
      
      try {
        console.log('🔄 Token expired, attempting refresh...');
        await authApi.refresh(); // Refresh Token verwenden
        console.log('✅ Token refreshed successfully');
        return api(originalRequest); // Original Request wiederholen
      } catch (refreshError) {
        console.log('❌ Token refresh failed:', refreshError);
        // Nur bei echten Auth-Fehlern ausloggen (NIEMALS bei Rate Limiting!)
        if ((refreshError as any).response?.status === 401 || (refreshError as any).response?.status === 403) {
          console.log('🔒 Authentication failed, logging out user');
          // Tokens aus localStorage entfernen
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          // User über Auth Store ausloggen - SYNCHRON um Infinite Loops zu vermeiden
          const { useAuthStore } = await import('../store/useAuthStore');
          useAuthStore.getState().logout();
        }
        // WICHTIG: Original Request NICHT wiederholen nach fehlgeschlagenem Refresh
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

/**
 * AUTH API
 * 
 * Authentifizierungs-Endpoints.
 * Verwendet httpOnly Cookies für Token-Speicherung (sicherer als localStorage).
 */
export const authApi = {
  // User registrieren
  register: (data: { email: string; password: string; displayName: string }) =>
    api.post('/auth/register', data),
  
  // User einloggen (setzt httpOnly Cookie mit JWT)
  login: (data: { email: string; password: string; keepLoggedIn?: boolean }) =>
    api.post('/auth/login', data),
  
  // User ausloggen (löscht httpOnly Cookie)
  logout: () => api.post('/auth/logout'),
  
  // Token refresh (verwendet httpOnly Refresh Token Cookie)
  refresh: () => api.post('/auth/refresh'),
};

/**
 * USER API
 * 
 * User-bezogene Endpoints.
 */
export const userApi = {
  // User-Profil abrufen (inkl. isPremium, selectedTeams)
  getProfile: () => api.get('/user/profile'),
  
  // User-Daten abrufen (Alternative zu getProfile)
  getMe: () => api.get('/user/me'),
  
  // Ausgewählte Teams aktualisieren
  updateTeams: (teams: Array<{ sport: string; teamId?: string; teamName: string; leagueId?: number }>) =>
    api.post('/user/teams', { teams: Array.from(teams) }),
  
  // Zu Premium upgraden (Legacy - wird nicht mehr verwendet, Stripe stattdessen)
  upgradePremium: () => api.post('/user/upgrade-premium'),
  
  // Passwort ändern
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/user/change-password', data),
};

/**
 * ADMIN API
 * 
 * Admin-Panel Endpoints.
 * Nur für User mit role='admin' zugänglich.
 */
export const adminApi = {
  // Alle User abrufen
  getUsers: () => api.get('/admin/users'),
  
  // User zu Admin promoten
  promoteUser: (userId: string) => api.post('/admin/promote-user', { userId }),
  
  // Admin zu User demoten
  demoteUser: (userId: string) => api.post('/admin/demote-user', { userId }),
  
  // Premium-Status togglen (manuelles Upgrade/Downgrade)
  togglePremium: (userId: string) => api.post('/admin/toggle-premium', { userId }),
};

/**
 * CALENDAR API
 * 
 * Kalender und Event-Endpoints.
 */
export const calendarApi = {
  // Events abrufen (optional gefiltert nach Sport und Ligen)
  getEvents: (sport?: string, leagues?: number[]) => {
    const params = new URLSearchParams();
    if (sport) params.append('sport', sport);
    if (leagues?.length) params.append('leagues', leagues.join(','));
    return api.get(`/calendar?${params.toString()}`);
  },
  
  // Erinnerungen abrufen
  getReminders: () => api.get('/calendar/reminder'),
  
  // Erinnerung hinzufügen
  addReminder: (eventId: string) => api.post('/calendar/reminder', { eventId }),
  
  // Erinnerung entfernen
  removeReminder: (eventId: string) => api.delete('/calendar/reminder', { data: { eventId } }),
  
  // Kalender als ICS-Datei exportieren (für Google Calendar, Outlook, etc.)
  exportICS: async () => {
    // ICS-Datei vom Backend abrufen
    const response = await api.get('/calendar/export.ics', {
      responseType: 'blob',
      headers: {
        'Accept': 'text/calendar',
      }
    });
    
    // Download-Link erstellen und automatisch klicken
    const blob = new Blob([response.data], { type: 'text/calendar; charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sportskalendar.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return response;
  },
};

/**
 * DEDUPLICATED REQUEST HELPER
 * 
 * Verhindert mehrfache gleichzeitige Requests zur gleichen URL.
 * Cached Requests für CACHE_DURATION Millisekunden.
 */
function deduplicatedRequest(url: string): Promise<any> {
  const now = Date.now();
  const cached = requestCache.get(url);
  
  // Return cached promise if still valid
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    console.log(`🔄 Using cached request for ${url}`);
    return cached.promise;
  }
  
  // Create new request
  console.log(`🚀 Making new request to ${url}`);
  const promise = api.get(url).catch(error => {
    // Remove from cache on error to allow retry
    requestCache.delete(url);
    throw error;
  });
  
  // Cache the promise
  requestCache.set(url, { promise, timestamp: now });
  
  // Clean up cache after request completes
  promise.finally(() => {
    setTimeout(() => {
      const entry = requestCache.get(url);
      if (entry && (Date.now() - entry.timestamp) >= CACHE_DURATION) {
        requestCache.delete(url);
      }
    }, CACHE_DURATION);
  });
  
  return promise;
}

/**
 * LIVE API
 * 
 * Live-Daten Endpoints für verschiedene Sportarten.
 * Verwendet Request Deduplication um Rate Limiting zu vermeiden.
 */
export const liveApi = {
  // Formel 1 Live-Daten
  getF1: () => deduplicatedRequest('/live/f1'),
  
  // NFL Live-Daten
  getNFL: () => deduplicatedRequest('/live/nfl'),
  
  // Fußball Live-Daten
  getSoccer: () => deduplicatedRequest('/live/soccer'),
  
  // NBA Live-Daten
  getNBA: () => deduplicatedRequest('/live/nba'),
  
  // NHL Live-Daten
  getNHL: () => deduplicatedRequest('/live/nhl'),
  
  // MLB Live-Daten
  getMLB: () => deduplicatedRequest('/live/mlb'),
  
  // Tennis Live-Daten
  getTennis: () => deduplicatedRequest('/live/tennis'),
};

/**
 * HIGHLIGHTS API
 * 
 * Highlights und News Endpoints.
 */
export const highlightsApi = {
  // Highlights abrufen (optional gefiltert nach Sport und Team)
  getHighlights: (sport?: string, team?: string) => {
    const params = new URLSearchParams();
    if (sport) params.append('sport', sport);
    if (team) params.append('team', team);
    const queryString = params.toString();
    return api.get(`/highlights${queryString ? `?${queryString}` : ''}`);
  },
};

/**
 * CALENDAR SYNC API
 * 
 * Calendar Sync Endpoints für Premium-Nutzer.
 */
export const calendarSyncApi = {
  // Sync-Status abrufen
  getSyncStatus: () => api.get('/calendar-sync/status'),
  
  // Sync-URL generieren für externe Kalender-Apps
  getSyncUrl: () => api.get('/calendar-sync/url'),
  
  // Kalender exportieren (ICS, JSON, CSV)
  exportCalendar: (format: 'ics' | 'json' | 'csv') => api.get(`/calendar-sync/export?format=${format}`, { responseType: 'blob' }),
  
  // Sync-Einstellungen aktualisieren
  updateSettings: (settings: any) => api.post('/calendar-sync/settings', settings),
  
  // Kalender-Events abrufen
  getEvents: (startDate?: string, endDate?: string, sport?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start', startDate);
    if (endDate) params.append('end', endDate);
    if (sport) params.append('sport', sport);
    return api.get(`/calendar-sync/events?${params.toString()}`);
  }
};

/**
 * STRIPE API
 * 
 * Stripe Payment Endpoints für Premium-Subscriptions.
 */
export const stripeApi = {
  // Stripe Checkout Session erstellen (für Premium-Upgrade)
  createCheckoutSession: () => api.post('/stripe/create-checkout-session'),
  
  // Premium-Features abrufen (für Pricing-Seite)
  getPremiumFeatures: () => api.get('/stripe/premium-features'),
  
  // User manuell zu Premium upgraden (Admin-Funktion)
  upgradeUser: (email: string) => api.post('/stripe/admin/upgrade-user', { email }),
  
  // User manuell von Premium downgraden (Admin-Funktion)
  downgradeUser: (email: string) => api.post('/stripe/admin/downgrade-user', { email }),
};

/**
 * SPORTS API
 * 
 * TheSportsDB API Endpoints für Team-Daten.
 */
export const sportsApi = {
  // NBA Teams abrufen
  getNBATeams: () => api.get('/sports/nba/teams'),
  
  // NHL Teams abrufen
  getNHLTeams: () => api.get('/sports/nhl/teams'),
  
  // MLB Teams abrufen
  getMLBTeams: () => api.get('/sports/mlb/teams'),
};
