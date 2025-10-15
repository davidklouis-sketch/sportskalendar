/**
 * CUSTOM HOOK: useEventLoader
 * 
 * Handles all event loading logic for different sports.
 * Extracted from Calendar.tsx for better maintainability.
 */

import { useState, useRef, useCallback } from 'react';
import { calendarApi } from '../lib/api';

interface Event {
  id: string;
  title: string;
  sport: string;
  startsAt: string;
  homeTeam?: string;
  awayTeam?: string;
  league?: string;
  venue?: string;
}

interface UseEventLoaderReturn {
  // Event states
  footballEvents: Event[];
  f1Events: Event[];
  nflEvents: Event[];
  nbaEvents: Event[];
  nhlEvents: Event[];
  mlbEvents: Event[];
  tennisEvents: Event[];
  
  // Loading state
  isLoading: boolean;
  
  // Functions
  loadAllEvents: (teams: Array<{ sport: string; teamName: string; teamId?: string; leagueId?: number }>) => Promise<void>;
  debouncedLoadAllEvents: (teams: Array<{ sport: string; teamName: string; teamId?: string; leagueId?: number }>) => void;
}

export function useEventLoader(): UseEventLoaderReturn {
  // Event states
  const [footballEvents, setFootballEvents] = useState<Event[]>([]);
  const [f1Events, setF1Events] = useState<Event[]>([]);
  const [nflEvents, setNflEvents] = useState<Event[]>([]);
  const [nbaEvents, setNbaEvents] = useState<Event[]>([]);
  const [nhlEvents, setNhlEvents] = useState<Event[]>([]);
  const [mlbEvents, setMlbEvents] = useState<Event[]>([]);
  const [tennisEvents, setTennisEvents] = useState<Event[]>([]);
  
  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  
  // Refs for performance
  const isLoadingRef = useRef(false);
  const debounceTimeoutRef = useRef<number | null>(null);

  // Debounced version of loadAllEvents to prevent excessive API calls
  const debouncedLoadAllEvents = useCallback((teams: Array<{ sport: string; teamName: string; teamId?: string; leagueId?: number }>) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      loadAllEvents(teams);
    }, 300); // 300ms debounce
  }, []);

  const loadAllEvents = useCallback(async (teams: Array<{ sport: string; teamName: string; teamId?: string; leagueId?: number }>) => {
    // PERFORMANCE FIX: Prevent multiple simultaneous loads
    if (isLoadingRef.current) {
      console.log('[EventLoader] Already loading, skipping duplicate request');
      return;
    }

    if (!teams || teams.length === 0) {
      console.log('[EventLoader] No teams selected, skipping load');
      return;
    }
    
    isLoadingRef.current = true;
    setIsLoading(true);
    console.log('[EventLoader] Starting to load events for teams:', teams.length);
    
    // PERFORMANCE FIX: Add global timeout to prevent hanging
    const globalTimeout = setTimeout(() => {
      console.log('[EventLoader] Global timeout reached, stopping load');
      isLoadingRef.current = false;
      setIsLoading(false);
    }, 8000); // Reduced to 8 seconds for better performance
    
    try {
      // Reset all events first
      setFootballEvents([]);
      setF1Events([]);
      setNflEvents([]);
      setNbaEvents([]);
      setNhlEvents([]);
      setMlbEvents([]);
      setTennisEvents([]);

      // Group teams by sport for efficient loading
      const sportGroups = new Map<string, Array<{ sport: string; teamName: string; teamId?: string; leagueId?: number }>>();
      
      teams.forEach(team => {
        if (!sportGroups.has(team.sport)) {
          sportGroups.set(team.sport, []);
        }
        sportGroups.get(team.sport)!.push(team);
      });

      // Load events for each sport in parallel
      const loadPromises: Promise<void>[] = [];

      // Football events
      if (sportGroups.has('football')) {
        const footballTeams = sportGroups.get('football')!;
        loadPromises.push(loadFootballEvents(footballTeams));
      }

      // F1 events
      if (sportGroups.has('f1')) {
        const f1Teams = sportGroups.get('f1')!;
        loadPromises.push(loadF1Events(f1Teams));
      }

      // NFL events
      if (sportGroups.has('nfl')) {
        const nflTeams = sportGroups.get('nfl')!;
        loadPromises.push(loadNFLEvents(nflTeams));
      }

      // NBA events
      if (sportGroups.has('nba')) {
        const nbaTeams = sportGroups.get('nba')!;
        loadPromises.push(loadNBAEvents(nbaTeams));
      }

      // NHL events
      if (sportGroups.has('nhl')) {
        const nhlTeams = sportGroups.get('nhl')!;
        loadPromises.push(loadNHLEvents(nhlTeams));
      }

      // MLB events
      if (sportGroups.has('mlb')) {
        const mlbTeams = sportGroups.get('mlb')!;
        loadPromises.push(loadMLBEvents(mlbTeams));
      }

      // Tennis events
      if (sportGroups.has('tennis')) {
        const tennisTeams = sportGroups.get('tennis')!;
        loadPromises.push(loadTennisEvents(tennisTeams));
      }

      // Wait for all events to load
      await Promise.all(loadPromises);
      
      console.log('[EventLoader] All events loaded successfully');
    } catch (error) {
      console.error('[EventLoader] Error loading events:', error);
    } finally {
      clearTimeout(globalTimeout);
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  // Individual sport loading functions
  const loadFootballEvents = async (teams: Array<{ sport: string; teamName: string; teamId?: string; leagueId?: number }>) => {
    try {
      const leagues = teams.map(t => t.leagueId).filter(Boolean) as number[];
      const response = await calendarApi.getEvents('football', leagues);
      const events = response.data as Event[];
      
      // Filter events by team names
      const teamNames = new Set(teams.map(t => t.teamName.toLowerCase()));
      const filteredEvents = events.filter(event => {
        const title = event.title.toLowerCase();
        const homeTeam = event.homeTeam?.toLowerCase() || '';
        const awayTeam = event.awayTeam?.toLowerCase() || '';
        
        for (const teamName of teamNames) {
          if (title.includes(teamName) || homeTeam.includes(teamName) || awayTeam.includes(teamName)) {
            return true;
          }
        }
        return false;
      });
      
      setFootballEvents(filteredEvents);
    } catch (error) {
      console.error('[EventLoader] Error loading football events:', error);
      setFootballEvents([]);
    }
  };

  const loadF1Events = async (teams: Array<{ sport: string; teamName: string; teamId?: string; leagueId?: number }>) => {
    try {
      const response = await calendarApi.getEvents('f1');
      const events = response.data as Event[];
      
      // Filter events by driver names
      const driverNames = new Set(teams.map(t => t.teamName.toLowerCase()));
      const filteredEvents = events.filter(event => {
        const title = event.title.toLowerCase();
        for (const driverName of driverNames) {
          if (title.includes(driverName)) {
            return true;
          }
        }
        return false;
      });
      
      setF1Events(filteredEvents);
    } catch (error) {
      console.error('[EventLoader] Error loading F1 events:', error);
      setF1Events([]);
    }
  };

  const loadNFLEvents = async (teams: Array<{ sport: string; teamName: string; teamId?: string; leagueId?: number }>) => {
    try {
      const response = await calendarApi.getEvents('nfl');
      const events = response.data as Event[];
      
      // Filter events by team names
      const teamNames = new Set(teams.map(t => t.teamName.toLowerCase()));
      const filteredEvents = events.filter(event => {
        const title = event.title.toLowerCase();
        const homeTeam = event.homeTeam?.toLowerCase() || '';
        const awayTeam = event.awayTeam?.toLowerCase() || '';
        
        for (const teamName of teamNames) {
          if (title.includes(teamName) || homeTeam.includes(teamName) || awayTeam.includes(teamName)) {
            return true;
          }
        }
        return false;
      });
      
      setNflEvents(filteredEvents);
    } catch (error) {
      console.error('[EventLoader] Error loading NFL events:', error);
      setNflEvents([]);
    }
  };

  const loadNBAEvents = async (teams: Array<{ sport: string; teamName: string; teamId?: string; leagueId?: number }>) => {
    try {
      const response = await calendarApi.getEvents('nba');
      const events = response.data as Event[];
      
      // Filter events by team names
      const teamNames = new Set(teams.map(t => t.teamName.toLowerCase()));
      const filteredEvents = events.filter(event => {
        const title = event.title.toLowerCase();
        const homeTeam = event.homeTeam?.toLowerCase() || '';
        const awayTeam = event.awayTeam?.toLowerCase() || '';
        
        for (const teamName of teamNames) {
          if (title.includes(teamName) || homeTeam.includes(teamName) || awayTeam.includes(teamName)) {
            return true;
          }
        }
        return false;
      });
      
      setNbaEvents(filteredEvents);
    } catch (error) {
      console.error('[EventLoader] Error loading NBA events:', error);
      setNbaEvents([]);
    }
  };

  const loadNHLEvents = async (teams: Array<{ sport: string; teamName: string; teamId?: string; leagueId?: number }>) => {
    try {
      const response = await calendarApi.getEvents('nhl');
      const events = response.data as Event[];
      
      // Filter events by team names
      const teamNames = new Set(teams.map(t => t.teamName.toLowerCase()));
      const filteredEvents = events.filter(event => {
        const title = event.title.toLowerCase();
        const homeTeam = event.homeTeam?.toLowerCase() || '';
        const awayTeam = event.awayTeam?.toLowerCase() || '';
        
        for (const teamName of teamNames) {
          if (title.includes(teamName) || homeTeam.includes(teamName) || awayTeam.includes(teamName)) {
            return true;
          }
        }
        return false;
      });
      
      setNhlEvents(filteredEvents);
    } catch (error) {
      console.error('[EventLoader] Error loading NHL events:', error);
      setNhlEvents([]);
    }
  };

  const loadMLBEvents = async (teams: Array<{ sport: string; teamName: string; teamId?: string; leagueId?: number }>) => {
    try {
      const response = await calendarApi.getEvents('mlb');
      const events = response.data as Event[];
      
      // Filter events by team names
      const teamNames = new Set(teams.map(t => t.teamName.toLowerCase()));
      const filteredEvents = events.filter(event => {
        const title = event.title.toLowerCase();
        const homeTeam = event.homeTeam?.toLowerCase() || '';
        const awayTeam = event.awayTeam?.toLowerCase() || '';
        
        for (const teamName of teamNames) {
          if (title.includes(teamName) || homeTeam.includes(teamName) || awayTeam.includes(teamName)) {
            return true;
          }
        }
        return false;
      });
      
      setMlbEvents(filteredEvents);
    } catch (error) {
      console.error('[EventLoader] Error loading MLB events:', error);
      setMlbEvents([]);
    }
  };

  const loadTennisEvents = async (teams: Array<{ sport: string; teamName: string; teamId?: string; leagueId?: number }>) => {
    try {
      let events: Event[] = [];
      
      try {
        const directResponse = await fetch('/api/sports/tennis/atp');
        if (directResponse.ok) {
          const directData = await directResponse.json();
          events = directData.events || [];
        }
      } catch {
        // Failed to load Tennis events from sports API
      }
      
      // PERFORMANCE FIX: Optimized filtering with early exit
      const tourNames = new Set(teams.map(t => t.teamName.toLowerCase()));
      const filteredEvents = events.filter(event => {
        const eventTitle = event.title.toLowerCase();
        for (const tourName of tourNames) {
          if (eventTitle.includes(tourName)) return true;
        }
        return false;
      });
      
      setTennisEvents(filteredEvents);
    } catch (error) {
      console.error('[EventLoader] Error loading Tennis events:', error);
      setTennisEvents([]);
    }
  };

  return {
    // Event states
    footballEvents,
    f1Events,
    nflEvents,
    nbaEvents,
    nhlEvents,
    mlbEvents,
    tennisEvents,
    
    // Loading state
    isLoading,
    
    // Functions
    loadAllEvents,
    debouncedLoadAllEvents
  };
}
