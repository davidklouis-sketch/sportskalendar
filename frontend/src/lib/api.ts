import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.sportskalendar.de/api';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
  transformRequest: [(data) => {
    // Ensure arrays stay arrays
    return JSON.stringify(data);
  }],
});

// Add response interceptor for automatic token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Don't retry refresh requests to avoid infinite loops
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh')) {
      originalRequest._retry = true;
      
      try {
        console.log('🔄 Token expired, attempting refresh...');
        await authApi.refresh();
        console.log('✅ Token refreshed successfully');
        return api(originalRequest);
      } catch (refreshError) {
        console.log('❌ Token refresh failed, redirecting to login');
        // Clear any stored tokens and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  register: (data: { email: string; password: string; displayName: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
};

// User
export const userApi = {
  getProfile: () => api.get('/user/profile'),
  getMe: () => api.get('/user/me'),
  updateTeams: (teams: Array<{ sport: string; teamId?: string; teamName: string; leagueId?: number }>) =>
    api.post('/user/teams', { teams: Array.from(teams) }),
  upgradePremium: () => api.post('/user/upgrade-premium'),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/user/change-password', data),
};

// Admin
export const adminApi = {
  getUsers: () => api.get('/admin/users'),
  promoteUser: (userId: string) => api.post('/admin/promote-user', { userId }),
  demoteUser: (userId: string) => api.post('/admin/demote-user', { userId }),
  togglePremium: (userId: string) => api.post('/admin/toggle-premium', { userId }),
};

// Calendar
export const calendarApi = {
  getEvents: (sport?: string, leagues?: number[]) => {
    const params = new URLSearchParams();
    if (sport) params.append('sport', sport);
    if (leagues?.length) params.append('leagues', leagues.join(','));
    return api.get(`/calendar?${params.toString()}`);
  },
  getReminders: () => api.get('/calendar/reminder'),
  addReminder: (eventId: string) => api.post('/calendar/reminder', { eventId }),
  removeReminder: (eventId: string) => api.delete('/calendar/reminder', { data: { eventId } }),
};

// Live
export const liveApi = {
  getF1: () => api.get('/live/f1'),
  getNFL: () => api.get('/live/nfl'),
  getSoccer: () => api.get('/live/soccer'),
};

// Highlights
export const highlightsApi = {
  getHighlights: (sport?: string) => {
    const params = sport ? `?sport=${sport}` : '';
    return api.get(`/highlights${params}`);
  },
};
