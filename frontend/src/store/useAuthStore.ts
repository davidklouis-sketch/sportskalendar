/**
 * AUTHENTICATION STORE (Zustand)
 * 
 * Globaler State für Authentifizierung und User-Daten.
 * Verwendet Zustand mit Persist-Middleware für localStorage-Persistierung.
 * 
 * Features:
 * - User-Daten (id, email, displayName, role, isPremium, selectedTeams)
 * - Authentifizierungs-Status
 * - Automatische localStorage-Synchronisation
 * - Type-Safe mit TypeScript
 * 
 * Wichtig: Dieser Store wird in App.tsx initialisiert und in der gesamten App verwendet.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Interface für ausgewählte Teams
 * 
 * Unterstützte Sportarten:
 * - football (Fußball)
 * - nfl (American Football)
 * - f1 (Formel 1)
 * - nba (Basketball)
 * - nhl (Eishockey)
 * - mlb (Baseball)
 * - tennis (Tennis)
 */
export interface SelectedTeam {
  sport: 'football' | 'nfl' | 'f1' | 'nba' | 'nhl' | 'mlb' | 'tennis';
  teamId?: string; // Optional: Team ID von der API
  teamName: string; // Display Name des Teams
  leagueId?: number; // Optional: League ID für API-Calls
}

/**
 * User Interface
 * 
 * Repräsentiert einen authentifizierten Benutzer.
 */
export interface User {
  id: string; // Eindeutige User-ID aus der Datenbank
  email: string; // E-Mail-Adresse
  displayName: string; // Anzeigename
  role: 'user' | 'admin'; // Benutzerrolle (admin hat Zugriff auf Admin-Panel)
  isPremium: boolean; // Premium-Status (keine Werbung, mehr Teams)
  selectedTeams: SelectedTeam[]; // Liste der ausgewählten Teams
}

/**
 * Auth Store State Interface
 */
interface AuthState {
  user: User | null; // Aktuell eingeloggter User (null = nicht eingeloggt)
  isAuthenticated: boolean; // Authentifizierungs-Status
  isLoading: boolean; // Loading-State für Auth-Operationen
  
  // Actions
  setUser: (user: User | null) => void; // User setzen (Login)
  setLoading: (loading: boolean) => void; // Loading-State setzen
  logout: () => void; // User ausloggen
  updateUser: (updates: Partial<User>) => void; // User-Daten aktualisieren (z.B. nach Team-Auswahl)
}

/**
 * Auth Store
 * 
 * Zustand Store mit Persist-Middleware.
 * Speichert User und isAuthenticated in localStorage unter 'auth-storage'.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial State
      user: null,
      isAuthenticated: false,
      isLoading: false,
      
      // User setzen und Auth-Status aktualisieren
      setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
      
      // Loading-State setzen
      setLoading: (loading) => set({ isLoading: loading }),
      
      // Logout: User und Auth-Status clearen
      logout: () => set({ user: null, isAuthenticated: false, isLoading: false }),
      
      // User-Daten aktualisieren (z.B. selectedTeams, isPremium)
      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null,
      })),
    }),
    {
      name: 'auth-storage', // localStorage Key
      // Nur user und isAuthenticated persistieren (isLoading nicht)
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
