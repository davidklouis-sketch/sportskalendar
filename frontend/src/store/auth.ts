import { create } from 'zustand';
import { api } from '../lib/api';

type User = { id: string; email: string; displayName: string; role?: 'user' | 'admin' } | null;

type AuthState = {
  user: User;
  token: string | null; // no longer used for auth; kept for compatibility
  isHydrating: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
};

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: null,
  isHydrating: true,
  async login(email, password) {
    console.log('🔐 Attempting login for:', email);
    const body = new URLSearchParams({ email, password });
    const res = await api.post('/auth/login', body.toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    const { user } = res.data;
    console.log('✅ Login successful:', user);
    set({ user });
  },
  async register(email, password, displayName) {
    const body = new URLSearchParams({ email, password, displayName });
    await api.post('/auth/register', body.toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
  },
  async logout() {
    localStorage.removeItem('token');
    await api.post('/auth/logout');
    set({ token: null, user: null });
  },
  async hydrate() {
    console.log('🔄 Hydrating auth state...');
    set({ isHydrating: true });
    try {
      const res = await api.get('/user/me');
      console.log('✅ Auth hydrate successful:', res.data);
      set({ user: res.data.user, isHydrating: false });
    } catch (error) {
      console.log('❌ Auth hydrate failed:', error);
      set({ token: null, user: null, isHydrating: false });
    }
  },
}));


