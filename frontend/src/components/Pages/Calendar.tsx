import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { calendarApi, userApi, highlightsApi, sportsApi } from '../../lib/api';
import { format } from 'date-fns';
import { FOOTBALL_LEAGUES, FOOTBALL_TEAMS, F1_DRIVERS, NFL_TEAMS, NBA_TEAMS, NHL_TEAMS, MLB_TEAMS } from '../../data/teams';
import { LiveData } from '../LiveData';
import { SportsKalendarBanner, SportsKalendarSquare } from '../Ads/AdManager';
import { t, getCurrentLanguage } from '../../lib/i18n';
import { useLanguage } from '../../hooks/useLanguage';
import { EventCountdown } from '../EventCountdown';
import { NewsWidget } from '../News/NewsWidget';

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

interface Highlight {
  id: string;
  title: string;
  url: string;
  sport: string;
  description?: string;
  createdAt: string;
  thumbnail?: string;
  duration?: string;
  views?: number;
}

interface ApiTeam {
  id: string;
  name: string;
  shortName?: string;
  badge?: string;
  logo?: string;
  stadium?: string;
  division?: string;
}

export function Calendar() {
  const { user, setUser } = useAuthStore();
  useLanguage(); // Trigger re-render on language change
  const [footballEvents, setFootballEvents] = useState<Event[]>([]);
  const [f1Events, setF1Events] = useState<Event[]>([]);
  const [nflEvents, setNflEvents] = useState<Event[]>([]);
  const [nbaEvents, setNbaEvents] = useState<Event[]>([]);
  const [nhlEvents, setNhlEvents] = useState<Event[]>([]);
  const [mlbEvents, setMlbEvents] = useState<Event[]>([]);
  const [tennisEvents, setTennisEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedSport, setSelectedSport] = useState<'football' | 'nfl' | 'f1' | 'nba' | 'nhl' | 'mlb' | 'tennis' | null>(null);
  const [showTeamSelector, setShowTeamSelector] = useState(false);
  const [selectedSportTab, setSelectedSportTab] = useState<'football' | 'nfl' | 'f1' | 'nba' | 'nhl' | 'mlb' | 'tennis'>('football');
  // Local teams state to ensure UI updates work
  const [localTeams, setLocalTeams] = useState<Array<{ sport: string; teamName: string; teamId?: string; leagueId?: number }>>([]);
  // Highlights state
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [isLoadingHighlights, setIsLoadingHighlights] = useState(false);
  
  // API Teams state (with images)
  const [nbaTeamsFromApi, setNbaTeamsFromApi] = useState<ApiTeam[]>([]);
  const [nhlTeamsFromApi, setNhlTeamsFromApi] = useState<ApiTeam[]>([]);
  const [mlbTeamsFromApi, setMlbTeamsFromApi] = useState<ApiTeam[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  
  // Ref to prevent multiple simultaneous loads
  const isLoadingRef = useRef(false);
  
  // Next event for countdown
  const [nextEvent, setNextEvent] = useState<Event | null>(null);

  // Load all events separately for better organization
  const loadAllEvents = useCallback(async (teams: Array<{ sport: string; teamName: string; teamId?: string; leagueId?: number }>) => {
    // PERFORMANCE FIX: Prevent multiple simultaneous loads
    if (isLoadingRef.current) {
      console.log('[Calendar] Already loading, skipping duplicate request');
      return;
    }
    
    isLoadingRef.current = true;
    setIsLoading(true);
    console.log('[Calendar] Starting to load events for teams:', teams.length);
    
    // PERFORMANCE FIX: Add global timeout to prevent hanging
    const globalTimeout = setTimeout(() => {
      console.log('[Calendar] Global timeout reached, stopping load');
      isLoadingRef.current = false;
      setIsLoading(false);
    }, 15000); // 15 second global timeout
    
    try {
      // Reset all events first
      setFootballEvents([]);
      setF1Events([]);
      setNflEvents([]);
      setNbaEvents([]);
      setNhlEvents([]);
      setMlbEvents([]);
      setTennisEvents([]);
      
      // PERFORMANCE FIX: Load all events but with proper error handling and timeouts
      console.log('[Calendar] Loading events for all teams with optimized performance...');
      
      // Load Football Events
      const footballTeams = teams.filter(t => t.sport === 'football');
      if (footballTeams.length > 0) {
        console.log('[Calendar] Loading football events...');
        try {
          const leagues = footballTeams.map(t => t.leagueId).filter(Boolean) as number[];
          
          // Try new sports API first (like NBA) with timeout
          let events: Event[] = [];
          try {
            const leaguesParam = leagues.join(',');
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
            
            const directResponse = await fetch(`/api/sports/football/events?leagues=${leaguesParam}`, {
              signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (directResponse.ok) {
              const directData = await directResponse.json();
              events = directData.events || [];
            }
          } catch (directError) {
            // Fallback to old calendar API
            const response = await calendarApi.getEvents('football', leagues);
            events = (response.data as Event[]) || [];
          }
          
          // PERFORMANCE FIX: Simplified filtering to prevent nested loops
          const teamNames = footballTeams.map(t => t.teamName.toLowerCase());
          
          // Simple team name matching without complex variations
          events = events.filter(event => {
            const eventTitle = event.title.toLowerCase();
            
            // Simple direct team name matching only
            return teamNames.some(teamName => eventTitle.includes(teamName));
          });
          
          setFootballEvents(events);
        } catch (error) {
          setFootballEvents([]);
        }
      }
      
      // Load F1 Events - Show all upcoming races when any driver is selected
      const f1Teams = teams.filter(t => t.sport === 'f1');
      if (f1Teams.length > 0) {
        try {
          const response = await calendarApi.getEvents('f1', []);
          let events = (response.data as Event[]) || [];
          
          // Show ALL upcoming races when any driver is selected (don't filter by driver)
          setF1Events(events);
        } catch (error) {
          setF1Events([]);
        }
      }
      
      // Load NFL Events
      const nflTeams = teams.filter(t => t.sport === 'nfl');
      if (nflTeams.length > 0) {
        try {
          const response = await calendarApi.getEvents('nfl', []);
          let events = (response.data as Event[]) || [];
          
          // PERFORMANCE FIX: Simplified filtering
          const teamNames = nflTeams.map(t => t.teamName.toLowerCase());
          events = events.filter(event => {
            const eventTitle = event.title.toLowerCase();
            return teamNames.some(teamName => eventTitle.includes(teamName));
          });
          
          setNflEvents(events);
        } catch (error) {
          setNflEvents([]);
        }
      }
      
      // Load NBA Events
      const nbaTeams = teams.filter(t => t.sport === 'nba');
      if (nbaTeams.length > 0) {
        try {
          const response = await calendarApi.getEvents('nba', []);
          let events = (response.data as Event[]) || [];
          
          // If calendar API doesn't have NBA events, try sports API
          if (events.length === 0) {
            try {
              const directResponse = await fetch('/api/sports/nba/events');
              if (directResponse.ok) {
                const directData = await directResponse.json();
                events = directData.events || [];
              }
            } catch (sportsError) {
              // Failed to load NBA events from sports API
            }
          }
          
          // PERFORMANCE FIX: Simplified filtering
          const teamNames = nbaTeams.map(t => t.teamName.toLowerCase());
          const filteredEvents = events.filter(event => {
            const eventTitle = event.title.toLowerCase();
            return teamNames.some(teamName => eventTitle.includes(teamName));
          });
          
          setNbaEvents(filteredEvents);
        } catch (error) {
          // Failed to load NBA events
          setNbaEvents([]);
        }
      } else {
        // Load all NBA events for next event calculation even if no teams selected
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
            } catch (sportsError) {
              // Failed to load NBA events from sports API
            }
          }
          
          setNbaEvents(events);
        } catch (error) {
          // Failed to load NBA events
          setNbaEvents([]);
        }
      }
      
      // Load NHL Events
      const nhlTeams = teams.filter(t => t.sport === 'nhl');
      if (nhlTeams.length > 0) {
        try {
          let events: Event[] = [];
          
          try {
            const directResponse = await fetch('/api/sports/nhl/events');
            if (directResponse.ok) {
              const directData = await directResponse.json();
              events = directData.events || [];
            }
          } catch (directError) {
            // Failed to load NHL events from sports API
          }
          
          // Filter events for selected teams
          const teamNames = nhlTeams.map(t => t.teamName.toLowerCase());
          const filteredEvents = events.filter(event => {
            const eventTitle = event.title.toLowerCase();
            for (const teamName of teamNames) {
              if (eventTitle.includes(teamName)) return true;
            }
            return false;
          });
          
          setNhlEvents(filteredEvents);
        } catch (error) {
          // Failed to load NHL events
          setNhlEvents([]);
        }
      } else {
        // Load all NHL events for next event calculation even if no teams selected
        try {
          let events: Event[] = [];
          
          try {
            const directResponse = await fetch('/api/sports/nhl/events');
            if (directResponse.ok) {
              const directData = await directResponse.json();
              events = directData.events || [];
            }
          } catch (directError) {
            // Failed to load NHL events from sports API
          }
          
          setNhlEvents(events);
        } catch (error) {
          // Failed to load NHL events
          setNhlEvents([]);
        }
      }
      
      // Load MLB Events
      const mlbTeams = teams.filter(t => t.sport === 'mlb');
      if (mlbTeams.length > 0) {
        try {
          let events: Event[] = [];
          
          try {
            const directResponse = await fetch('/api/sports/mlb/events');
            if (directResponse.ok) {
              const directData = await directResponse.json();
              events = directData.events || [];
            }
          } catch (directError) {
            // Failed to load MLB events from sports API
          }
          
          // Filter events for selected teams
          const teamNames = mlbTeams.map(t => t.teamName.toLowerCase());
          const filteredEvents = events.filter(event => {
            const eventTitle = event.title.toLowerCase();
            for (const teamName of teamNames) {
              if (eventTitle.includes(teamName)) return true;
            }
            return false;
          });
          
          setMlbEvents(filteredEvents);
        } catch (error) {
          // Failed to load MLB events
          setMlbEvents([]);
        }
      } else {
        // Load all MLB events for next event calculation even if no teams selected
        try {
          let events: Event[] = [];
          
          try {
            const directResponse = await fetch('/api/sports/mlb/events');
            if (directResponse.ok) {
              const directData = await directResponse.json();
              events = directData.events || [];
            }
          } catch (directError) {
            // Failed to load MLB events from sports API
          }
          
          setMlbEvents(events);
        } catch (error) {
          // Failed to load MLB events
          setMlbEvents([]);
        }
      }
      
      // Load Tennis Events
      const tennisTeams = teams.filter(t => t.sport === 'tennis');
      if (tennisTeams.length > 0) {
        try {
          let events: Event[] = [];
          
          try {
            const directResponse = await fetch('/api/sports/tennis/atp');
            if (directResponse.ok) {
              const directData = await directResponse.json();
              events = directData.events || [];
            }
          } catch (directError) {
            // Failed to load Tennis events from sports API
          }
          
          // PERFORMANCE FIX: Simplified filtering
          const tourNames = tennisTeams.map(t => t.teamName.toLowerCase());
          const filteredEvents = events.filter(event => {
            const eventTitle = event.title.toLowerCase();
            return tourNames.some(tourName => eventTitle.includes(tourName));
          });
          
          setTennisEvents(filteredEvents);
        } catch (error) {
          // Failed to load Tennis events
          setTennisEvents([]);
        }
      } else {
        // Load all Tennis events for next event calculation even if no teams selected
        try {
          let events: Event[] = [];
          
          try {
            const directResponse = await fetch('/api/sports/tennis/atp');
            if (directResponse.ok) {
              const directData = await directResponse.json();
              events = directData.events || [];
            }
          } catch (directError) {
            // Failed to load Tennis events from sports API
          }
          
          setTennisEvents(events);
        } catch (error) {
          // Failed to load Tennis events
          setTennisEvents([]);
        }
      }
      
    } catch (error) {
      console.error('[Calendar] Error loading events:', error);
      // Failed to load events
    } finally {
      // PERFORMANCE FIX: Clear global timeout
      clearTimeout(globalTimeout);
      
      setIsLoading(false);
      isLoadingRef.current = false;
      
      // Find next upcoming event for countdown
      findNextEvent();
    }
  }, []); // Leere Dependencies um Infinite Loops zu vermeiden

  // Helper function to filter events by future dates
  const filterFutureEvents = (events: Event[]) => {
    const now = new Date();
    
    return events
      .map(event => {
        // Try multiple date parsing methods
        let eventDate: Date;
        
        try {
          // Method 1: Direct parsing
          eventDate = new Date(event.startsAt);
          
          // Method 2: If invalid, try parsing different formats
          if (isNaN(eventDate.getTime())) {
            // Try parsing as YYYY-MM-DD HH:mm:ss format
            const parts = event.startsAt.split(' ');
            if (parts.length === 2) {
              const [datePart, timePart] = parts;
              const [year, month, day] = datePart.split('-');
              const [hour, minute, second] = timePart.split(':');
              eventDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second) || 0);
            }
            
            // Method 3: Try DD.MM.YYYY HH:mm format (German format)
            if (isNaN(eventDate.getTime()) && event.startsAt.includes('.')) {
              const germanDateMatch = event.startsAt.match(/(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})/);
              if (germanDateMatch) {
                const [, day, month, year, hour, minute] = germanDateMatch;
                eventDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
              }
            }
          }
          
          const isFuture = eventDate > now;
          const timeDiff = eventDate.getTime() - now.getTime();
          const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
          
          return {
            ...event,
            parsedDate: eventDate,
            isFuture,
            daysDiff
          };
        } catch (error) {
          // Error parsing date for event
          return null;
        }
      })
      .filter(event => event && event.isFuture)
      .sort((a, b) => a!.parsedDate.getTime() - b!.parsedDate.getTime());
  };

  // Find the next upcoming event from all loaded events
  const findNextEvent = useCallback(() => {
    // Only include events from user's selected teams, not all events
    const userSelectedSports = user?.selectedTeams?.map((team: any) => team.sport) || [];
    
    const relevantEvents = [];
    
    // Only add events from sports that the user has teams selected for
    if (userSelectedSports.includes('football')) {
      relevantEvents.push(...footballEvents);
    }
    if (userSelectedSports.includes('f1')) {
      relevantEvents.push(...f1Events);
    }
    if (userSelectedSports.includes('nfl')) {
      relevantEvents.push(...nflEvents);
    }
    if (userSelectedSports.includes('nba')) {
      relevantEvents.push(...nbaEvents);
    }
    if (userSelectedSports.includes('nhl')) {
      relevantEvents.push(...nhlEvents);
    }
    if (userSelectedSports.includes('mlb')) {
      relevantEvents.push(...mlbEvents);
    }
    if (userSelectedSports.includes('tennis')) {
      relevantEvents.push(...tennisEvents);
    }

    if (relevantEvents.length === 0) {
      setNextEvent(null);
      return;
    }

    const upcomingEvents = filterFutureEvents(relevantEvents);

    if (upcomingEvents.length > 0) {
      const nextEvent = upcomingEvents[0]!;
      setNextEvent(nextEvent);
    } else {
      setNextEvent(null);
    }
  }, []); // Leere Dependencies um Infinite Loops zu vermeiden - wird manuell aufgerufen

  // Load highlights for selected sport
  const loadHighlights = useCallback(async () => {
    if (!selectedSport) {
      return;
    }
    
    
    setIsLoadingHighlights(true);
    try {
      const sportMapping: Record<string, string> = {
        football: 'Fußball',
        nfl: 'NFL',
        f1: 'F1',
        nba: 'Basketball',
        nhl: 'NHL',
        mlb: 'MLB',
        tennis: 'Tennis',
      };

      // Get current values from state
      const currentTeam = localTeams.find(t => t.sport === selectedSport);
      
      // If no team found in localTeams, try to get from user.selectedTeams
      const fallbackTeam = !currentTeam && user?.selectedTeams 
        ? user.selectedTeams.find(t => t.sport === selectedSport)
        : currentTeam;
      
      let allHighlights: Highlight[] = [];
      try {
        const response = await highlightsApi.getHighlights(sportMapping[selectedSport], fallbackTeam?.teamName);
        allHighlights = response.data.items || [];
      } catch (apiError) {
        // Calendar Highlights API call failed
        throw apiError;
      }
      
      // Backend should handle team filtering, so we don't need additional frontend filtering
      setHighlights(allHighlights);
    } catch (error) {
      // Calendar Highlights failed to load
      setHighlights([]);
    } finally {
      setIsLoadingHighlights(false);
    }
  }, [selectedSport]); // Only selectedSport as dependency to avoid infinite loops


  // Load user teams and events on mount - with ref to prevent loops
  const lastTeamsLengthRef = useRef<number>(0);
  const lastTeamsHashRef = useRef<string>('');
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  useEffect(() => {
    const teams = user?.selectedTeams || [];
    const teamsLength = teams.length;
    
    // Create a simple hash of teams to detect actual changes
    const teamsHash = teams.map(t => `${t.sport}-${t.teamName}`).join(',');
    
    // PERFORMANCE FIX: Debounce team changes to prevent rapid API calls
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      if (teamsLength > 0) {
        // Always update local teams state
        setLocalTeams(teams);
        
        // Only load if teams actually changed OR if we don't have events yet
        const hasEvents = footballEvents.length > 0 || f1Events.length > 0 || nbaEvents.length > 0 || 
                         nflEvents.length > 0 || nhlEvents.length > 0 || mlbEvents.length > 0 || tennisEvents.length > 0;
        
        const teamsChanged = lastTeamsLengthRef.current !== teamsLength || lastTeamsHashRef.current !== teamsHash;
        
        if (teamsChanged || !hasEvents) {
          console.log('[Calendar] Teams changed, loading events...');
          lastTeamsLengthRef.current = teamsLength;
          lastTeamsHashRef.current = teamsHash;
          
          // Auto-select first sport if not selected
          if (!selectedSport) {
            const firstSport = teams[0].sport as 'football' | 'nfl' | 'f1' | 'nba' | 'nhl' | 'mlb' | 'tennis';
            setSelectedSport(firstSport);
            setSelectedSportTab(firstSport);
          }
          
          // Load events for teams
          loadAllEvents(teams);
        }
      } else {
        lastTeamsLengthRef.current = 0;
        lastTeamsHashRef.current = '';
        setLocalTeams([]);
        // No teams = stop loading immediately
        setIsLoading(false);
        setFootballEvents([]);
        setF1Events([]);
        setNflEvents([]);
        setNbaEvents([]);
        setNhlEvents([]);
        setMlbEvents([]);
        setTennisEvents([]);
      }
    }, 300); // 300ms debounce
    
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [user?.selectedTeams?.length, user?.selectedTeams]); // Include both length and content for proper change detection

  // Load highlights when sport selection changes - but only if we have teams
  useEffect(() => {
    if (selectedSport && localTeams.length > 0) {
      loadHighlights();
    }
  }, [selectedSport, localTeams.length]); // Only load if sport changes AND we have teams

  // Initialize selectedSportTab based on user's first team - but only once
  useEffect(() => {
    if (user?.selectedTeams?.length && selectedSportTab === 'football') {
      const firstSport = user.selectedTeams[0].sport as 'football' | 'nfl' | 'f1' | 'nba' | 'nhl' | 'mlb' | 'tennis';
      if (firstSport !== 'football') {
        setSelectedSportTab(firstSport);
      }
    }
  }, [user?.selectedTeams?.length]); // Only trigger when teams count changes, not content

  // PERFORMANCE FIX: Removed this useEffect to prevent infinite loops
  // selectedSport and selectedSportTab are now managed independently
  // This was causing the hanging issue

  // Load teams from API when modal opens
  const loadTeamsFromApi = useCallback(async () => {
    setIsLoadingTeams(true);
    try {
      const [nbaResponse, nhlResponse, mlbResponse] = await Promise.all([
        sportsApi.getNBATeams(),
        sportsApi.getNHLTeams(),
        sportsApi.getMLBTeams(),
      ]);

      if (nbaResponse.data.success && nbaResponse.data.teams) {
        setNbaTeamsFromApi(nbaResponse.data.teams);
      }
      if (nhlResponse.data.success && nhlResponse.data.teams) {
        setNhlTeamsFromApi(nhlResponse.data.teams);
      }
      if (mlbResponse.data.success && mlbResponse.data.teams) {
        setMlbTeamsFromApi(mlbResponse.data.teams);
      }
    } catch (error) {
      // Failed to load teams from API
    } finally {
      setIsLoadingTeams(false);
    }
  }, []);

  // Load teams when modal opens
  useEffect(() => {
    if (showTeamSelector && (nbaTeamsFromApi.length === 0 || nhlTeamsFromApi.length === 0 || mlbTeamsFromApi.length === 0)) {
      loadTeamsFromApi();
    }
  }, [showTeamSelector]); // Nur showTeamSelector als Dependency um Infinite Loops zu vermeiden

  // PERFORMANCE FIX: findNextEvent is now called directly in loadAllEvents
  // No need for separate useEffect that could cause infinite loops

  // CRITICAL FIX: Remove this useEffect to prevent infinite loops
  // The main useEffect already handles loading events when teams change
  // This was causing the hanging issue

  const handleAddTeam = async (sport: string, teamName: string, teamId?: string, leagueId?: number) => {
    if (!user) return;

    // Check if user already has a team and is not premium
    if (!user.isPremium && (user.selectedTeams?.length || 0) >= 1) {
      const confirmed = confirm('Premium erforderlich: Du kannst als kostenloser Nutzer nur ein Team auswählen. Möchtest du zu Premium upgraden?');
      if (confirmed) {
        setShowTeamSelector(false);
        window.location.href = '/premium';
      }
      return;
    }

    try {
      const newTeam = { sport: sport as 'football' | 'f1' | 'nfl' | 'nba' | 'nhl' | 'mlb' | 'tennis', teamName, teamId, leagueId };
      const updatedTeams = [...(user.selectedTeams || []), newTeam];
      
      await userApi.updateTeams(updatedTeams);
      setUser({ ...user, selectedTeams: updatedTeams });
      setLocalTeams(updatedTeams);
      setShowTeamSelector(false);
    } catch (error: any) {
      // Failed to add team
      
      // Handle specific error cases
      if (error.response?.status === 403) {
        alert('Premium erforderlich: Du kannst als kostenloser Nutzer nur ein Team auswählen. Upgrade auf Premium für mehrere Teams!');
      } else if (error.response?.status === 400) {
        alert('Fehler beim Hinzufügen des Teams. Bitte versuche es erneut.');
      } else {
        alert('Ein Fehler ist aufgetreten. Bitte versuche es später erneut.');
      }
    }
  };

  const handleRemoveTeam = async (index: number) => {
    if (!user) return;

    try {
      const updatedTeams = user.selectedTeams?.filter((_, i) => i !== index) || [];
      await userApi.updateTeams(updatedTeams);
      setUser({ ...user, selectedTeams: updatedTeams });
      setLocalTeams(updatedTeams);
    } catch (error) {
      // Failed to remove team
    }
  };

  const exportCalendar = async () => {
    try {
      await calendarApi.exportICS();
    } catch (error) {
      // Failed to export calendar
    }
  };

  const getSportIcon = (sport: string) => {
    switch (sport) {
      case 'football': return '⚽';
      case 'nfl': return '🏈';
      case 'f1': return '🏎️';
      case 'nba': return '🏀';
      case 'nhl': return '🏒';
      case 'mlb': return '⚾';
      case 'tennis': return '🎾';
      default: return '🏆';
    }
  };

  const getSportColor = (sport: string) => {
    switch (sport) {
      case 'football': return 'from-emerald-500 to-green-600';
      case 'nfl': return 'from-orange-500 to-red-600';
      case 'f1': return 'from-red-500 to-pink-600';
      case 'nba': return 'from-orange-500 to-orange-600';
      case 'nhl': return 'from-blue-500 to-cyan-600';
      case 'mlb': return 'from-blue-600 to-indigo-600';
      case 'tennis': return 'from-green-600 to-teal-600';
      default: return 'from-blue-500 to-indigo-600';
    }
  };


  return (
    <div className="min-h-screen hero-gradient">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Logo-inspired geometric shapes */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-cyan-500/10 rotate-45 rounded-lg animate-float"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-lime-500/10 rotate-45 rounded-lg animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/3 left-10 w-16 h-16 bg-orange-500/10 rotate-45 rounded-lg animate-float" style={{animationDelay: '2s'}}></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="relative group mx-auto mb-8">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto shadow-xl border border-cyan-400/30">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <h1 className="text-5xl font-bold heading-sport mb-6">
              {getCurrentLanguage() === 'de' ? 'DEIN SPORTKALENDAR' : 'YOUR SPORTS CALENDAR'}
            </h1>
            <p className="text-xl text-cyan-100 max-w-2xl mx-auto leading-relaxed">
              {getCurrentLanguage() === 'de' 
                ? 'Verwalte alle Spiele deiner Lieblingsteams, verfolge Live-Events und entdecke die besten Highlights'
                : 'Manage all games of your favorite teams, track live events and discover the best highlights'
              }
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Next Event Countdown */}
            {nextEvent && localTeams.length > 0 && (
              <EventCountdown
                eventTitle={nextEvent.title}
                eventDate={nextEvent.startsAt}
                sport={nextEvent.sport}
              />
            )}
            
            {/* Live Events - Flowing Design */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-pink-600 rounded-3xl blur opacity-75"></div>
              <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-3"></div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('live')} Events</h2>
                  </div>
                  <div className="space-y-4">
                    <LiveData />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
{t('automaticUpdate')}
                  </p>
                </div>
              </div>
            </div>

            {/* Ad Banner */}
            <div className="relative">
              <SportsKalendarBanner />
            </div>

            {/* My Teams - Elegant Card */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
              <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('myTeams')}</h2>
                    </div>
            <button
                      onClick={exportCalendar}
                      className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-xl text-white transition-all duration-200 transform hover:scale-105"
            >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
            </button>
        </div>

                  {localTeams.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">{t('noTeamsAdded')}</p>
                      <button
                        onClick={() => setShowTeamSelector(true)}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                      >
                        + {t('addTeam')}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {localTeams.map((team, index) => (
                        <div key={index} className="group/team flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-700 rounded-2xl hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-600 dark:hover:to-gray-600 transition-all duration-200">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mr-3">
                              <span className="text-sm">{getSportIcon(team.sport)}</span>
                            </div>
              <div>
                              <p className="font-medium text-gray-900 dark:text-white">{team.teamName}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{team.sport}</p>
                            </div>
              </div>
              <button
                onClick={() => handleRemoveTeam(index)}
                            className="opacity-0 group-hover/team:opacity-100 p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-all duration-200"
              >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
              </button>
            </div>
          ))}

          <button
            onClick={() => setShowTeamSelector(true)}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            + {t('addTeam')}
          </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* News Widget */}
            <NewsWidget 
              className="mt-6"
              maxArticles={3}
              showViewAll={true}
              onViewAll={() => {
                // TODO: Navigate to full news page when implemented
                console.log('Navigate to full news page');
              }}
            />
            </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* Sport Selection - Floating Pills */}
            {localTeams.length > 0 && (
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                {(() => {
                  // PERFORMANCE FIX: Create Set for O(1) lookups
                  const sportsWithTeams = new Set(localTeams.map(t => t.sport));
                  return ['football', 'f1', 'nfl', 'nba', 'nhl', 'mlb', 'tennis'].map((sport) => {
                    const hasTeams = sportsWithTeams.has(sport);
                    if (!hasTeams) return null;
                  
                  const sportNames: Record<string, string> = {
                    'football': t('football'),
                    'f1': t('formula1'),
                    'nfl': t('nfl'),
                    'nba': t('nba'),
                    'nhl': t('nhl'),
                    'mlb': t('mlb'),
                    'tennis': t('tennis')
                  };
                  
                  return (
                    <button
                      key={sport}
                      onClick={() => setSelectedSport(sport as 'football' | 'f1' | 'nfl' | 'nba' | 'nhl' | 'mlb' | 'tennis')}
                      className={`group relative px-6 py-3 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                        selectedSport === sport
                          ? `bg-gradient-to-r ${getSportColor(sport)} text-white shadow-xl`
                          : 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 shadow-lg backdrop-blur-sm'
                      }`}
                    >
                      <span className="text-lg mr-2">{getSportIcon(sport)}</span>
                      {sportNames[sport]}
                      {selectedSport === sport && (
                        <div className="absolute -inset-1 bg-gradient-to-r from-white/20 to-white/10 rounded-2xl blur opacity-75"></div>
                      )}
                    </button>
                  );
                  });
                })()}
              </div>
            )}

            {/* Events Section - Flowing Layout */}
            {selectedSport && (
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-green-600 rounded-3xl blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
                <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden">
                  <div className="p-8">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mr-4">
                        <span className="text-xl">{getSportIcon(selectedSport)}</span>
                      </div>
              <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                          {(() => {
                            const sportNames: Record<string, string> = {
                              'football': `${t('football')} Events`,
                              'f1': `${t('formula1')} Events`,
                              'nfl': `${t('nfl')} Events`,
                              'nba': `${t('nba')} Events`,
                              'nhl': `${t('nhl')} Events`,
                              'mlb': `${t('mlb')} Events`,
                              'tennis': `${t('tennis')} Events`
                            };
                            return sportNames[selectedSport] || `${selectedSport.toUpperCase()} Events`;
                          })()}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                          {(() => {
                            const events = selectedSport === 'football' ? footballEvents : 
                                         selectedSport === 'f1' ? f1Events : 
                                         selectedSport === 'nfl' ? nflEvents :
                                         selectedSport === 'nba' ? nbaEvents :
                                         selectedSport === 'nhl' ? nhlEvents :
                                         selectedSport === 'mlb' ? mlbEvents :
                                         selectedSport === 'tennis' ? tennisEvents : [];
                            return `${events.length} ${events.length === 1 ? 'Event' : 'Events'}`;
                          })()}
                        </p>
                      </div>
              </div>
                    
                    <div className="space-y-4">
                      {isLoading ? (
                        <div className="text-center py-12">
                          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                          <p className="mt-4 text-gray-500 dark:text-gray-400">{t('loadingEvents')}</p>
            </div>
                      ) : (() => {
                        const events = selectedSport === 'football' ? footballEvents : 
                                     selectedSport === 'f1' ? f1Events : 
                                     selectedSport === 'nfl' ? nflEvents :
                                     selectedSport === 'nba' ? nbaEvents :
                                     selectedSport === 'nhl' ? nhlEvents :
                                     selectedSport === 'mlb' ? mlbEvents :
                                     selectedSport === 'tennis' ? tennisEvents : [];
                        
                        // For now, show all events regardless of date to avoid blocking NBA preseason games
                        // TODO: Implement proper future/past event filtering when API provides future events
                        
                        if (events.length === 0) {
                          return (
                            <div className="text-center py-12">
                              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
          </div>
                              <p className="text-gray-500 dark:text-gray-400">{t('noEventsAvailable')}</p>
      </div>
                          );
                        }
                        
                        // Filter events based on Premium status
                        // Non-Premium users only see future events
                        const now = new Date();
                        const filteredEvents = user?.isPremium 
                          ? events 
                          : events.filter(event => new Date(event.startsAt) > now);
                        
                        // Sort events: future events first (by date), then past events (newest first)
                        // PERFORMANCE FIX: Pre-calculate dates to avoid creating new Date() in every comparison
                        const eventsWithDates = filteredEvents.map(event => ({
                          ...event,
                          parsedDate: new Date(event.startsAt),
                          isFuture: new Date(event.startsAt) > now
                        }));
                        
                        // Pre-calculate hasPastEvents for Premium hint
                        // PERFORMANCE FIX: Use for loop instead of .some() to avoid render loop issues
                        let hasPastEvents = false;
                        for (const e of events) {
                          if (new Date(e.startsAt) <= now) {
                            hasPastEvents = true;
                            break;
                          }
                        }
                        
                        const sortedEvents = eventsWithDates.sort((a, b) => {
                          const isFutureA = a.isFuture;
                          const isFutureB = b.isFuture;
                          
                          // If both are future or both are past, sort by date
                          if (isFutureA === isFutureB) {
                            if (isFutureA) {
                              // Future events: earliest first
                              return a.parsedDate.getTime() - b.parsedDate.getTime();
                            } else {
                              // Past events: newest first
                              return b.parsedDate.getTime() - a.parsedDate.getTime();
                            }
                          }
                          
                          // Future events come before past events
                          return isFutureA ? -1 : 1;
                        });

                        return (
                          <>
                            <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                              <div className="space-y-3 pr-2">
                                {(() => {
                                  const now = new Date(); // Create once outside map to prevent infinite loops
                                  return sortedEvents.map((event) => {
                                  // Check if event is in the future for styling
                                  const eventDate = new Date(event.startsAt);
                                  const isFuture = eventDate > now;
                                
                                // Check if we have score data
                                const hasScore = event.homeScore !== null && event.homeScore !== undefined && 
                                                event.awayScore !== null && event.awayScore !== undefined;
                                
                                return (
                                <div key={event.id} className="group/event flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-700 rounded-2xl hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-600 dark:hover:to-gray-600 transition-all duration-200 transform hover:scale-[1.02]">
                                  <div className="flex items-center flex-1">
                                    {/* Premium Feature: Team Logos */}
                                    {user?.isPremium && (event.homeTeamBadge || event.awayTeamBadge) ? (
                                      <div className="flex items-center gap-2 mr-4">
                                        {event.homeTeamBadge && (
                                          <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl p-1 flex items-center justify-center shadow-sm">
                                            <img 
                                              src={event.homeTeamBadge} 
                                              alt={event.homeTeam || 'Home'} 
                                              className="w-full h-full object-contain"
                                              onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                e.currentTarget.parentElement!.innerHTML = `<span class="text-lg">${getSportIcon(selectedSport)}</span>`;
                                              }}
                                            />
                                          </div>
                                        )}
                                        <span className="text-gray-400 dark:text-gray-500 font-bold">vs</span>
                                        {event.awayTeamBadge && (
                                          <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl p-1 flex items-center justify-center shadow-sm">
                                            <img 
                                              src={event.awayTeamBadge} 
                                              alt={event.awayTeam || 'Away'} 
                                              className="w-full h-full object-contain"
                                              onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                e.currentTarget.parentElement!.innerHTML = `<span class="text-lg">${getSportIcon(selectedSport)}</span>`;
                                              }}
                                            />
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mr-4">
                                        <span className="text-lg">{getSportIcon(selectedSport)}</span>
                                      </div>
                                    )}
                                    <div className="flex-1">
                                      <p className="font-semibold text-gray-900 dark:text-white">{event.title}</p>
                                      <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {format(new Date(event.startsAt), 'dd.MM.yyyy HH:mm')} Uhr
                                        {!isFuture && hasScore && (
                                          <span className="ml-2 text-xs font-semibold text-orange-600 dark:text-orange-400">
                                            {event.homeScore}:{event.awayScore} (Beendet)
                                          </span>
                                        )}
                                        {!isFuture && !hasScore && (
                                          <span className="ml-2 text-xs text-orange-500">(Beendet)</span>
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="opacity-0 group-hover/event:opacity-100 transition-opacity duration-200">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </div>
                                </div>
                                );
                              });
                                })()}
                            </div>
                          </div>
                          
                          {/* Premium Hint for Non-Premium Users */}
                          {!user?.isPremium && hasPastEvents && (
                            <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-200 dark:border-amber-800">
                              <div className="flex items-start">
                                <div className="flex-shrink-0">
                                  <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                </div>
                                <div className="ml-3 flex-1">
                                  <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                                    Premium Feature
                                  </h3>
                                  <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                                    Vergangene Events mit Ergebnissen sind nur für Premium-Mitglieder verfügbar. Upgrade jetzt für Zugriff auf alle vergangenen Spiele!
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                        );
                      })()}
                    </div>
                  </div>
            </div>
          </div>
        )}

            {/* Highlights Section - Modern Grid */}
            {selectedSport && (
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-600 rounded-3xl blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
                <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden">
                  <div className="p-8">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('highlightsNews')}</h2>
                        <p className="text-gray-600 dark:text-gray-400">{t('currentHighlights')}</p>
                      </div>
                    </div>
                    
                    {isLoadingHighlights ? (
                      <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                        <p className="mt-4 text-gray-500 dark:text-gray-400">{t('loading')}</p>
                      </div>
                    ) : highlights.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
                          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">{t('noEventsAvailable')}</p>
            </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {highlights.slice(0, 4).map((highlight) => (
                          <a
                            key={highlight.id}
                            href={highlight.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group/highlight block p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-700 rounded-2xl hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-600 dark:hover:to-gray-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                          >
                            {highlight.thumbnail && (
                              <div className="aspect-video bg-gray-200 dark:bg-gray-600 rounded-xl mb-4 overflow-hidden">
                                <img
                                  src={highlight.thumbnail}
                                  alt={highlight.title}
                                  className="w-full h-full object-cover group-hover/highlight:scale-110 transition-transform duration-500"
                                />
                              </div>
                            )}
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover/highlight:text-purple-600 dark:group-hover/highlight:text-purple-400 transition-colors">
                              {highlight.title}
                            </h3>
                            {highlight.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                                {highlight.description}
                              </p>
                            )}
                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                              <span>{format(new Date(highlight.createdAt), 'dd.MM.yyyy')}</span>
                              {highlight.views && (
                                <span className="flex items-center">
                                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                  </svg>
                                  {highlight.views >= 1000000 ? `${(highlight.views / 1000000).toFixed(1)}M` :
                                   highlight.views >= 1000 ? `${(highlight.views / 1000).toFixed(1)}K` :
                                   highlight.views.toString()}
                                </span>
                              )}
                            </div>
                          </a>
                        ))}
                      </div>
                    )}
                      </div>
                    </div>
                  </div>
            )}

            {/* Ad Square */}
            <div className="relative">
              <SportsKalendarSquare />
            </div>
          </div>
            </div>
          </div>

      {/* Team Selector Modal */}
      {showTeamSelector && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">Team hinzufügen</h2>
                    <p className="text-white/80 text-sm">Wähle deine Lieblings-Teams aus</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTeamSelector(false)}
                  className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-xl"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Sport Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="flex overflow-x-auto">
                {[
                  { id: 'football', name: 'Fußball', icon: '⚽', color: 'from-green-500 to-emerald-600' },
                  { id: 'nfl', name: 'NFL', icon: '🏈', color: 'from-orange-500 to-red-600' },
                  { id: 'f1', name: 'Formel 1', icon: '🏎️', color: 'from-red-500 to-pink-600' },
                  { id: 'nba', name: 'NBA', icon: '🏀', color: 'from-orange-500 to-orange-600' },
                  { id: 'nhl', name: 'NHL', icon: '🏒', color: 'from-blue-500 to-cyan-600' },
                  { id: 'mlb', name: 'MLB', icon: '⚾', color: 'from-blue-600 to-indigo-600' },
                  { id: 'tennis', name: 'Tennis', icon: '🎾', color: 'from-green-600 to-teal-600' }
                ].map((sport) => (
                  <button
                    key={sport.id}
                    onClick={() => setSelectedSportTab(sport.id as any)}
                    className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-all duration-200 border-b-2 ${
                      selectedSportTab === sport.id
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-900'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <span className="text-lg">{sport.icon}</span>
                    <span>{sport.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {selectedSportTab === 'football' && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <span className="text-3xl">⚽</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Fußball Teams</h3>
                    <p className="text-gray-600 dark:text-gray-400">Wähle aus den wichtigsten Ligen</p>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {FOOTBALL_LEAGUES.map((league) => (
                      <div key={league.id} className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                          <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></div>
                          {league.name}
                          <span className="ml-auto text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">
                            {FOOTBALL_TEAMS[league.id]?.length || 0} Teams
                          </span>
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                          {(() => {
                            // PERFORMANCE FIX: Create Set for O(1) lookups instead of O(n) .some() calls
                            const localTeamNames = new Set(localTeams.map(t => t.teamName));
                            return FOOTBALL_TEAMS[league.id]?.map((team: any) => {
                              const isSelected = localTeamNames.has(team.name);
                              return (
                            <button
                              key={team.id}
                              onClick={() => handleAddTeam('football', team.name, team.id, league.id)}
                              disabled={isSelected}
                              className="w-full text-left px-4 py-3 text-sm rounded-xl hover:bg-white dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-sm"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-900 dark:text-white">{team.name}</span>
                                {isSelected && (
                                  <div className="flex items-center text-green-600 dark:text-green-400">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            </button>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedSportTab === 'nfl' && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <span className="text-3xl">🏈</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">NFL Teams</h3>
                    <p className="text-gray-600 dark:text-gray-400">Alle 32 NFL Teams</p>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {(() => {
                      // PERFORMANCE FIX: Create Set for O(1) lookups
                      const localTeamNames = new Set(localTeams.map(t => t.teamName));
                      return NFL_TEAMS.map((team) => {
                        const isSelected = localTeamNames.has(team.name);
                        return (
                      <button
                        key={team.id}
                        onClick={() => handleAddTeam('nfl', team.name, team.id)}
                        disabled={isSelected}
                        className="relative p-4 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600 hover:shadow-md group"
                      >
                        <div className="flex flex-col items-center text-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <span className="text-lg">🏈</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white leading-tight">{team.name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{team.division}</span>
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </button>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

              {selectedSportTab === 'f1' && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <span className="text-3xl">🏎️</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Formel 1 Fahrer</h3>
                    <p className="text-gray-600 dark:text-gray-400">Alle F1 Fahrer der aktuellen Saison</p>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {(() => {
                      // PERFORMANCE FIX: Create Set for O(1) lookups
                      const localTeamNames = new Set(localTeams.map(t => t.teamName));
                      return F1_DRIVERS.map((driver) => {
                        const isSelected = localTeamNames.has(driver.name);
                        return (
                      <button
                        key={driver.id}
                        onClick={() => handleAddTeam('f1', driver.name, driver.id)}
                        disabled={isSelected}
                        className="relative p-4 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-600 hover:shadow-md group"
                      >
                        <div className="flex flex-col items-center text-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-600 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <span className="text-lg">🏎️</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white leading-tight">{driver.name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{driver.team}</span>
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </button>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

              {selectedSportTab === 'nba' && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <span className="text-3xl">🏀</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">NBA Teams</h3>
                    <p className="text-gray-600 dark:text-gray-400">Alle 30 NBA Teams</p>
                  </div>
                  
                  {isLoadingTeams ? (
                    <div className="text-center py-12">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
                      <p className="mt-4 text-gray-500 dark:text-gray-400">Teams werden geladen...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {(() => {
                        // PERFORMANCE FIX: Create Set for O(1) lookups
                        const localTeamNames = new Set(localTeams.map(t => t.teamName));
                        return (nbaTeamsFromApi.length > 0 ? nbaTeamsFromApi : NBA_TEAMS).map((team) => {
                          const teamName = team.name;
                          const teamId = team.id;
                          const teamBadge = 'badge' in team ? team.badge : undefined;
                          const teamLogo = 'logo' in team ? team.logo : undefined;
                          const teamDivision = team.division;
                          const isSelected = localTeamNames.has(teamName);
                          
                          return (
                            <button
                              key={teamId}
                              onClick={() => handleAddTeam('nba', teamName, teamId)}
                              disabled={isSelected}
                            className="relative p-4 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600 hover:shadow-md group"
                          >
                            <div className="flex flex-col items-center text-center">
                              {(teamBadge || teamLogo) ? (
                                <div className="w-16 h-16 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                  <img 
                                    src={teamBadge || teamLogo} 
                                    alt={teamName}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                      // Fallback to emoji icon if image fails to load
                                      e.currentTarget.style.display = 'none';
                                      e.currentTarget.parentElement!.innerHTML = '<span class="text-2xl">🏀</span>';
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                  <span className="text-lg">🏀</span>
                                </div>
                              )}
                              <span className="text-sm font-medium text-gray-900 dark:text-white leading-tight">{teamName}</span>
                              {teamDivision && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{teamDivision}</span>
                              )}
                            </div>
                            {isSelected && (
                              <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </button>
                        );
                      });
                    })()}
                    </div>
                  )}
                </div>
              )}

              {selectedSportTab === 'nhl' && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <span className="text-3xl">🏒</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">NHL Teams</h3>
                    <p className="text-gray-600 dark:text-gray-400">Alle 32 NHL Teams</p>
                  </div>
                  
                  {isLoadingTeams ? (
                    <div className="text-center py-12">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                      <p className="mt-4 text-gray-500 dark:text-gray-400">Teams werden geladen...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {(() => {
                        // PERFORMANCE FIX: Create Set for O(1) lookups
                        const localTeamNames = new Set(localTeams.map(t => t.teamName));
                        return (nhlTeamsFromApi.length > 0 ? nhlTeamsFromApi : NHL_TEAMS).map((team) => {
                          const teamName = team.name;
                          const teamId = team.id;
                          const teamBadge = 'badge' in team ? team.badge : undefined;
                          const teamLogo = 'logo' in team ? team.logo : undefined;
                          const teamDivision = team.division;
                          const isSelected = localTeamNames.has(teamName);
                          
                          return (
                            <button
                              key={teamId}
                              onClick={() => handleAddTeam('nhl', teamName, teamId)}
                              disabled={isSelected}
                            className="relative p-4 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md group"
                          >
                            <div className="flex flex-col items-center text-center">
                              {(teamBadge || teamLogo) ? (
                                <div className="w-16 h-16 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                  <img 
                                    src={teamBadge || teamLogo} 
                                    alt={teamName}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                      // Fallback to emoji icon if image fails to load
                                      e.currentTarget.style.display = 'none';
                                      e.currentTarget.parentElement!.innerHTML = '<span class="text-2xl">🏒</span>';
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                  <span className="text-lg">🏒</span>
                                </div>
                              )}
                              <span className="text-sm font-medium text-gray-900 dark:text-white leading-tight">{teamName}</span>
                              {teamDivision && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{teamDivision}</span>
                              )}
                            </div>
                            {isSelected && (
                              <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </button>
                        );
                      });
                    })()}
                    </div>
                  )}
                </div>
              )}

              {selectedSportTab === 'mlb' && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <span className="text-3xl">⚾</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">MLB Teams</h3>
                    <p className="text-gray-600 dark:text-gray-400">Alle 30 MLB Teams</p>
                  </div>
                  
                  {isLoadingTeams ? (
                    <div className="text-center py-12">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                      <p className="mt-4 text-gray-500 dark:text-gray-400">Teams werden geladen...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {(() => {
                        // PERFORMANCE FIX: Create Set for O(1) lookups
                        const localTeamNames = new Set(localTeams.map(t => t.teamName));
                        return (mlbTeamsFromApi.length > 0 ? mlbTeamsFromApi : MLB_TEAMS).map((team) => {
                          const teamName = team.name;
                          const teamId = team.id;
                          const teamBadge = 'badge' in team ? team.badge : undefined;
                          const teamLogo = 'logo' in team ? team.logo : undefined;
                          const teamDivision = 'division' in team ? team.division : undefined;
                          const isSelected = localTeamNames.has(teamName);
                          
                          return (
                            <button
                              key={teamId}
                              onClick={() => handleAddTeam('mlb', teamName, teamId)}
                              disabled={isSelected}
                            className="relative p-4 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md group"
                          >
                            <div className="flex flex-col items-center text-center">
                              {(teamBadge || teamLogo) ? (
                                <div className="w-16 h-16 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                  <img 
                                    src={teamBadge || teamLogo} 
                                    alt={teamName}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                      // Fallback to emoji icon if image fails to load
                                      e.currentTarget.style.display = 'none';
                                      e.currentTarget.parentElement!.innerHTML = '<span class="text-2xl">⚾</span>';
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                  <span className="text-lg">⚾</span>
                                </div>
                              )}
                              <span className="text-sm font-medium text-gray-900 dark:text-white leading-tight">{teamName}</span>
                              {teamDivision && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{teamDivision}</span>
                              )}
                            </div>
                            {isSelected && (
                              <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </button>
                        );
                      });
                    })()}
                    </div>
                  )}
                </div>
              )}

              {selectedSportTab === 'tennis' && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <span className="text-3xl">🎾</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Tennis</h3>
                    <p className="text-gray-600 dark:text-gray-400">ATP, WTA und Grand Slams</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(() => {
                      // PERFORMANCE FIX: Create Set for O(1) lookups
                      const localTeamNames = new Set(localTeams.map(t => t.teamName));
                      return [
                        { id: 'atp', name: 'ATP Tour', description: 'Männliche Profis', icon: '🎾' },
                        { id: 'wta', name: 'WTA Tour', description: 'Weibliche Profis', icon: '🎾' },
                        { id: 'grandslams', name: 'Grand Slams', description: 'Australian Open, French Open, Wimbledon, US Open', icon: '🏆' }
                      ].map((tour) => {
                        const isSelected = localTeamNames.has(tour.name);
                        
                        return (
                          <button
                            key={tour.id}
                            onClick={() => handleAddTeam('tennis', tour.name, tour.id)}
                            disabled={isSelected}
                        className="relative p-6 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 hover:shadow-lg group"
                      >
                        <div className="flex flex-col items-center text-center">
                          <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <span className="text-2xl">{tour.icon}</span>
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{tour.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{tour.description}</p>
                        </div>
                        {isSelected && (
                          <div className="absolute top-4 right-4 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </button>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {localTeams.length} Team{localTeams.length !== 1 ? 's' : ''} ausgewählt
                  {!user?.isPremium && localTeams.length >= 1 && (
                    <span className="ml-2 text-orange-600 dark:text-orange-400 font-medium">
                      (Premium für mehr Teams)
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  {!user?.isPremium && localTeams.length >= 1 && (
                    <button
                      onClick={() => {
                        setShowTeamSelector(false);
                        // Navigate to premium page
                        window.location.href = '/premium';
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium transition-all duration-200 text-sm"
                    >
                      🚀 Premium
                    </button>
                  )}
                  <button
                    onClick={() => setShowTeamSelector(false)}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
                  >
                    Fertig
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}