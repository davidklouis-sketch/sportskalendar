import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SelectedTeam {
  sport: 'football' | 'nfl' | 'f1';
  teamId?: string;
  teamName: string;
  leagueId?: number;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  isPremium: boolean;
  selectedTeams: SelectedTeam[];
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
      setLoading: (loading) => set({ isLoading: loading }),
      logout: () => set({ user: null, isAuthenticated: false, isLoading: false }),
      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null,
      })),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

