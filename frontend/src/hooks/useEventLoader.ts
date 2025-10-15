import { useState, useCallback, useRef } from 'react';
import { calendarApi } from '../lib/api';

interface Event {
  id: string;
  title: string;
  sport: string;
  startsAt: string;
  homeTeam?: string;
  awayTeam?: string;
  homeTeamBadge?: string;
  awayTeamBadge?: string;
  homeScore?: string | null;
  awayScore?: string | null;
  status?: string;
}

interface Team {
  sport: string;
  teamName: string;
  teamId?: string;
  leagueId?: number;
}

export function useEventLoader() {
  const [footballEvents, setFootballEvents] = useState<Event[]>([]);
  const [f1Events, setF1Events] = useState<Event[]>([]);
  const [nflEvents, setNflEvents] = useState<Event[]>([]);
  const [nbaEvents, setNbaEvents] = useState<Event[]>([]);
  const [nhlEvents, setNhlEvents] = useState<Event[]>([]);
  const [mlbEvents, setMlbEvents] = useState<Event[]>([]);
  const [tennisEvents, setTennisEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const isLoadingRef = useRef(false);
  const debounceTimeoutRef = useRef<number | undefined>(undefined);

  const loadAllEvents = useCallback(async (teams: Team[]) => {
    // PERFORMANCE FIX: Prevent multiple simultaneous loads
    if (isLoadingRef.current) {
      console.log('[useEventLoader] Already loading, skipping duplicate request');
      return;
    }
    
    isLoadingRef.current = true;
    setIsLoading(true);
    console.log('[useEventLoader] Starting to load events for teams:', teams.length);
    
    // PERFORMANCE FIX: Add global timeout to prevent hanging
    const globalTimeout = setTimeout(() => {
      console.log('[useEventLoader] Global timeout reached, stopping load');
      isLoadingRef.current = false;
      setIsLoading(false);
    }, 8000); // 8 seconds timeout
    
    try {
      // Reset all events first
      setFootballEvents([]);
      setF1Events([]);
      setNflEvents([]);
      setNbaEvents([]);
      setNhlEvents([]);
      setMlbEvents([]);
      setTennisEvents([]);
      
      // Load Football Events
      const footballTeams = teams.filter(t => t.sport === 'football');
      if (footballTeams.length > 0) {
        try {
          const leagues = footballTeams.map(t => t.leagueId).filter(Boolean) as number[];
          let events: Event[] = [];
          
          try {
            const leaguesParam = leagues.join(',');
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            
            const directResponse = await fetch(`/api/sports/football/events?leagues=${leaguesParam}`, {
              signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (directResponse.ok) {
              const directData = await directResponse.json();
              events = directData.events || [];
            }
          } catch {
            const response = await calendarApi.getEvents('football', leagues);
            events = (response.data as Event[]) || [];
          }
          
          const teamNames = footballTeams.map(t => t.teamName.toLowerCase());
          events = events.filter(event => {
            const eventTitle = event.title.toLowerCase();
            return teamNames.some(teamName => eventTitle.includes(teamName));
          });
          
          setFootballEvents(events);
        } catch {
          setFootballEvents([]);
        }
      }
      
      // Load F1 Events
      const f1Teams = teams.filter(t => t.sport === 'f1');
      if (f1Teams.length > 0) {
        try {
          const response = await calendarApi.getEvents('f1', []);
          const events = (response.data as Event[]) || [];
          setF1Events(events);
        } catch {
          setF1Events([]);
        }
      }
      
      // Load NFL Events
      const nflTeams = teams.filter(t => t.sport === 'nfl');
      if (nflTeams.length > 0) {
        try {
          const response = await calendarApi.getEvents('nfl', []);
          let events = (response.data as Event[]) || [];
          
          const teamNames = nflTeams.map(t => t.teamName.toLowerCase());
          events = events.filter(event => {
            const eventTitle = event.title.toLowerCase();
            return teamNames.some(teamName => eventTitle.includes(teamName));
          });
          
          setNflEvents(events);
        } catch {
          setNflEvents([]);
        }
      }
      
      // Load NBA Events
      const nbaTeams = teams.filter(t => t.sport === 'nba');
      if (nbaTeams.length > 0) {
        try {
          const response = await calendarApi.getEvents('nba', []);
          let events = (response.data as Event[]) || [];
          
          if (events.length === 0) {
            try {
              const directResponse = await fetch('/api/sports/nba/events');
              if (directResponse.ok) {
                const directData = await directResponse.json();
                events = directData.events || [];
              }
            } catch {
              // Fallback failed
            }
          }
          
          const teamNames = nbaTeams.map(t => t.teamName.toLowerCase());
          events = events.filter(event => {
            const eventTitle = event.title.toLowerCase();
            return teamNames.some(teamName => eventTitle.includes(teamName));
          });
          
          setNbaEvents(events);
        } catch {
          setNbaEvents([]);
        }
      }
      
      // Load NHL Events
      const nhlTeams = teams.filter(t => t.sport === 'nhl');
      if (nhlTeams.length > 0) {
        try {
          const response = await calendarApi.getEvents('nhl', []);
          let events = (response.data as Event[]) || [];
          
          const teamNames = nhlTeams.map(t => t.teamName.toLowerCase());
          events = events.filter(event => {
            const eventTitle = event.title.toLowerCase();
            return teamNames.some(teamName => eventTitle.includes(teamName));
          });
          
          setNhlEvents(events);
        } catch {
          setNhlEvents([]);
        }
      }
      
      // Load MLB Events
      const mlbTeams = teams.filter(t => t.sport === 'mlb');
      if (mlbTeams.length > 0) {
        try {
          const response = await calendarApi.getEvents('mlb', []);
          let events = (response.data as Event[]) || [];
          
          const teamNames = mlbTeams.map(t => t.teamName.toLowerCase());
          events = events.filter(event => {
            const eventTitle = event.title.toLowerCase();
            return teamNames.some(teamName => eventTitle.includes(teamName));
          });
          
          setMlbEvents(events);
        } catch {
          setMlbEvents([]);
        }
      }
      
      // Load Tennis Events
      const tennisTeams = teams.filter(t => t.sport === 'tennis');
      if (tennisTeams.length > 0) {
        try {
          const response = await calendarApi.getEvents('tennis', []);
          const events = (response.data as Event[]) || [];
          setTennisEvents(events);
        } catch {
          setTennisEvents([]);
        }
      }
      
      clearTimeout(globalTimeout);
    } catch (error) {
      console.error('[useEventLoader] Error loading events:', error);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  const debouncedLoadAllEvents = useCallback((teams: Team[]) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = window.setTimeout(() => {
      loadAllEvents(teams);
    }, 300);
  }, [loadAllEvents]);

  return {
    footballEvents,
    f1Events,
    nflEvents,
    nbaEvents,
    nhlEvents,
    mlbEvents,
    tennisEvents,
    isLoading,
    loadAllEvents,
    debouncedLoadAllEvents
  };
}

