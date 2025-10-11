import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { calendarApi, userApi, highlightsApi } from '../../lib/api';
import { format } from 'date-fns';
import { FOOTBALL_LEAGUES, FOOTBALL_TEAMS, F1_DRIVERS, NFL_TEAMS, NBA_TEAMS, NHL_TEAMS, MLB_TEAMS } from '../../data/teams';
import { LiveData } from '../LiveData';
import { SportsKalendarBanner, SportsKalendarSquare } from '../Ads/AdManager';

interface Event {
  id: string;
  title: string;
  sport: string;
  startsAt: string;
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

export function Calendar() {
  const { user, setUser } = useAuthStore();
  const [footballEvents, setFootballEvents] = useState<Event[]>([]);
  const [f1Events, setF1Events] = useState<Event[]>([]);
  const [nflEvents, setNflEvents] = useState<Event[]>([]);
  const [_nbaEvents, _setNbaEvents] = useState<Event[]>([]);
  const [_nhlEvents, _setNhlEvents] = useState<Event[]>([]);
  const [_mlbEvents, _setMlbEvents] = useState<Event[]>([]);
  const [_tennisEvents, _setTennisEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Debug state changes
  useEffect(() => {
    console.log('📊 Football events changed:', footballEvents.length, footballEvents);
  }, [footballEvents]);
  
  useEffect(() => {
    console.log('🔄 Loading state changed:', isLoading);
  }, [isLoading]);
  const [selectedSport, setSelectedSport] = useState<'football' | 'nfl' | 'f1' | 'nba' | 'nhl' | 'mlb' | 'tennis' | null>(null);
  const [showTeamSelector, setShowTeamSelector] = useState(false);
  const [selectedSportTab, setSelectedSportTab] = useState<'football' | 'nfl' | 'f1' | 'nba' | 'nhl' | 'mlb' | 'tennis'>('football');
  // Local teams state to ensure UI updates work
  const [localTeams, setLocalTeams] = useState<Array<{ sport: string; teamName: string; teamId?: string; leagueId?: number }>>([]);
  // Highlights state
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [isLoadingHighlights, setIsLoadingHighlights] = useState(false);
  
  // Ref to prevent multiple simultaneous loads
  const isLoadingRef = useRef(false);

  // Load all events separately for better organization
  const loadAllEvents = async (teams: Array<{ sport: string; teamName: string; teamId?: string; leagueId?: number }>) => {
    console.log('🔄 loadAllEvents called with teams:', teams);
    console.log('🔄 isLoadingRef.current:', isLoadingRef.current);
    
    // Prevent multiple simultaneous loads
    if (isLoadingRef.current) {
      console.log('⚠️ Already loading, skipping...');
      return;
    }
    
    isLoadingRef.current = true;
    setIsLoading(true);
    console.log('🔄 Starting to load events...');
    
    try {
      // Reset all events first
      console.log('🔄 Resetting all events...');
      setFootballEvents([]);
      setF1Events([]);
      setNflEvents([]);
      
      // Load Football Events
      const footballTeams = teams.filter(t => t.sport === 'football');
      console.log('⚽ Football teams:', footballTeams);
      if (footballTeams.length > 0) {
        try {
          const leagues = footballTeams.map(t => t.leagueId).filter(Boolean) as number[];
          console.log('⚽ Loading football events for leagues:', leagues);
          const response = await calendarApi.getEvents('football', leagues);
          let events = (response.data as Event[]) || [];
          console.log('⚽ Raw football events from API:', events.length, events);
          
          // Filter events for selected teams
          const teamNames = footballTeams.map(t => t.teamName.toLowerCase());
          console.log('⚽ Filtering for team names:', teamNames);
          events = events.filter(event => {
            const eventTitle = event.title.toLowerCase();
            
            // Enhanced matching with team name variations
            const matches = teamNames.some(teamName => {
              // Direct match
              if (eventTitle.includes(teamName)) return true;
              
              // Team name variations mapping
              const teamVariations: Record<string, string[]> = {
                'bayern munich': ['fc bayern', 'bayern münchen', 'fc bayern münchen', 'bayern'],
                'borussia dortmund': ['bvb', 'borussia', 'bvb dortmund', 'dortmund'],
                'bayer leverkusen': ['bayer 04', 'leverkusen', 'bayer', 'werkself'],
                'rb leipzig': ['rb', 'leipzig'],
                'vfl wolfsburg': ['wolfsburg', 'vfl'],
                'vfb stuttgart': ['stuttgart', 'vfb'],
                'eintracht frankfurt': ['frankfurt', 'eintracht'],
                'borussia mönchengladbach': ['mönchengladbach', 'gladbach', 'borussia'],
                '1. fsv mainz 05': ['mainz', 'mainz 05', 'fsv mainz'],
                'tsg hoffenheim': ['hoffenheim', 'tsg'],
                'sc freiburg': ['freiburg', 'sc'],
                'fc augsburg': ['augsburg', 'fc augsburg'],
                '1. fc köln': ['köln', 'fc köln', '1. fc köln'],
                '1. fc union berlin': ['union berlin', 'fc union', 'union'],
                'sv werder bremen': ['werder bremen', 'werder', 'bremen'],
                '1. fc heidenheim 1846': ['heidenheim', 'fc heidenheim'],
                'fc st. pauli': ['st. pauli', 'pauli', 'st pauli'],
                'hamburger sv': ['hamburg', 'hsv', 'hamburger']
              };
              
              // Check variations
              const variations = teamVariations[teamName] || [];
              return variations.some(variation => eventTitle.includes(variation));
            });
            
            console.log(`⚽ Event "${event.title}" matches teams:`, matches);
            return matches;
          });
          console.log('⚽ Filtered football events:', events.length, events);
          
          setFootballEvents(events);
        } catch (error) {
          console.error('Failed to load football events:', error);
          setFootballEvents([]);
        }
      }
      
      // Load F1 Events
      const f1Teams = teams.filter(t => t.sport === 'f1');
      if (f1Teams.length > 0) {
        try {
          const response = await calendarApi.getEvents('f1', []);
          let events = (response.data as Event[]) || [];
          
          // Filter events for selected drivers
          const driverNames = f1Teams.map(t => t.teamName.toLowerCase());
          events = events.filter(event => {
            const eventTitle = event.title.toLowerCase();
            return driverNames.some(driverName => eventTitle.includes(driverName));
          });
          
          setF1Events(events);
        } catch (error) {
          console.error('Failed to load F1 events:', error);
          setF1Events([]);
        }
      }
      
      // Load NFL Events
      const nflTeams = teams.filter(t => t.sport === 'nfl');
      if (nflTeams.length > 0) {
        try {
          const response = await calendarApi.getEvents('nfl', []);
          let events = (response.data as Event[]) || [];
          
          // Filter events for selected teams
          const teamNames = nflTeams.map(t => t.teamName.toLowerCase());
          events = events.filter(event => {
            const eventTitle = event.title.toLowerCase();
            return teamNames.some(teamName => eventTitle.includes(teamName));
          });
          
          setNflEvents(events);
        } catch (error) {
          console.error('Failed to load NFL events:', error);
          setNflEvents([]);
        }
      }
      
    } catch (error) {
      console.error('❌ Failed to load events:', error);
    } finally {
      console.log('✅ loadAllEvents completed, setting loading to false');
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  };

  // Load highlights for selected sport
  const loadHighlights = async () => {
    if (!selectedSport) return;
    
    setIsLoadingHighlights(true);
    try {
      const sportMapping: Record<string, string> = {
        football: 'Fußball',
        nfl: 'NFL',
        f1: 'F1',
      };

      // Get current values from state
      const currentTeam = localTeams.find(t => t.sport === selectedSport);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 15000); // 15 second timeout
      });
      
      const fetchPromise = highlightsApi.getHighlights(sportMapping[selectedSport], currentTeam?.teamName);
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      let allHighlights = response.data.items || [];
      
      // Additional frontend filtering if needed (backend should handle most filtering now)
      if (currentTeam?.teamName && allHighlights.length > 0) {
        allHighlights = allHighlights.filter((highlight: Highlight) => {
          const searchText = (highlight.title + ' ' + (highlight.description || '')).toLowerCase();
          
          // Use the same team variations as backend
          const teamVariations = getTeamVariations(currentTeam.teamName);
          return teamVariations.some(variation => searchText.includes(variation));
        });
      }
      
      setHighlights(allHighlights);
    } catch (error) {
      console.error('Failed to load highlights:', error);
      setHighlights([]);
    } finally {
      setIsLoadingHighlights(false);
    }
  };

  // Get team name variations for better matching (same as backend)
  const getTeamVariations = (teamName: string): string[] => {
    const normalized = teamName.toLowerCase().trim();
    const variations: string[] = [normalized];
    
    const mappings: Record<string, string[]> = {
      'bayern munich': ['fc bayern', 'bayern münchen', 'fc bayern münchen', 'bayern', 'fc bayern münchen'],
      'borussia dortmund': ['bvb', 'borussia', 'bvb dortmund', 'dortmund'],
      'bayer leverkusen': ['bayer 04', 'leverkusen', 'bayer', 'werkself'],
      'max verstappen': ['verstappen', 'max'],
      'lewis hamilton': ['hamilton', 'lewis'],
      'charles leclerc': ['leclerc', 'charles'],
      'lando norris': ['norris', 'lando']
    };
    
    for (const [key, values] of Object.entries(mappings)) {
      if (normalized.includes(key)) {
        variations.push(...values);
        break;
      }
    }
    
    return variations;
  };

  // Load user teams and events on mount - with ref to prevent loops
  const lastTeamsRef = useRef<string>('');
  
  useEffect(() => {
    const teams = user?.selectedTeams || [];
    const teamsString = JSON.stringify(teams.sort((a, b) => a.teamName.localeCompare(b.teamName)));
    
    console.log('👤 User teams changed:', teams);
    console.log('👤 Last teams string:', lastTeamsRef.current);
    console.log('👤 New teams string:', teamsString);
    
    if (teams.length > 0) {
      // Only load if teams actually changed
      if (lastTeamsRef.current !== teamsString) {
        console.log('👤 Teams actually changed, loading events...');
        lastTeamsRef.current = teamsString;
        setLocalTeams(teams);
        // Auto-select first sport if not selected
        if (!selectedSport) {
          console.log('👤 Auto-selecting first sport:', teams[0].sport);
          setSelectedSport(teams[0].sport as 'football' | 'nfl' | 'f1' | 'nba' | 'nhl' | 'mlb' | 'tennis');
        }
        // Load events for teams
        loadAllEvents(teams);
      } else {
        console.log('👤 Teams unchanged, skipping load...');
      }
    } else {
      console.log('👤 No teams, stopping loading...');
      lastTeamsRef.current = '';
      // No teams = stop loading immediately
      setIsLoading(false);
      setFootballEvents([]);
      setF1Events([]);
      setNflEvents([]);
    }
  }, [user?.selectedTeams]);

  // Load highlights when sport selection changes (but only if we have teams)
  useEffect(() => {
    if (selectedSport && localTeams.length > 0) {
      loadHighlights();
    }
  }, [selectedSport]);

  const handleAddTeam = async (sport: string, teamName: string, teamId?: string, leagueId?: number) => {
    if (!user) return;

    try {
      const newTeam = { sport: sport as 'football' | 'f1' | 'nfl' | 'nba' | 'nhl' | 'mlb' | 'tennis', teamName, teamId, leagueId };
      const updatedTeams = [...(user.selectedTeams || []), newTeam];
      
      await userApi.updateTeams(updatedTeams);
      setUser({ ...user, selectedTeams: updatedTeams });
      setLocalTeams(updatedTeams);
      setShowTeamSelector(false);
    } catch (error) {
      console.error('Failed to add team:', error);
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
      console.error('Failed to remove team:', error);
    }
  };

  const exportCalendar = async () => {
    try {
      await calendarApi.exportICS();
    } catch (error) {
      console.error('Failed to export calendar:', error);
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
              DEIN SPORTKALENDAR
            </h1>
            <p className="text-xl text-cyan-100 max-w-2xl mx-auto leading-relaxed">
              Verwalte alle Spiele deiner Lieblingsteams, verfolge Live-Events und entdecke die besten Highlights
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Live Events - Flowing Design */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-pink-600 rounded-3xl blur opacity-75"></div>
              <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-3"></div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Live Events</h2>
                  </div>
                  <div className="space-y-4">
                    <LiveData />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
                    Automatische Aktualisierung alle 30 Sekunden
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
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Meine Teams</h2>
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
                      <p className="text-gray-500 dark:text-gray-400 mb-4">Noch keine Teams hinzugefügt</p>
                      <button
                        onClick={() => setShowTeamSelector(true)}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                      >
                        + Team hinzufügen
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
            + Team hinzufügen
          </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* Sport Selection - Floating Pills */}
            {localTeams.length > 0 && (
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                {['football', 'f1', 'nfl'].map((sport) => {
                  const hasTeams = localTeams.some(t => t.sport === sport);
                  if (!hasTeams) return null;
                  
                  return (
                    <button
                      key={sport}
                      onClick={() => setSelectedSport(sport as 'football' | 'f1' | 'nfl')}
                      className={`group relative px-6 py-3 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                        selectedSport === sport
                          ? `bg-gradient-to-r ${getSportColor(sport)} text-white shadow-xl`
                          : 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 shadow-lg backdrop-blur-sm'
                      }`}
                    >
                      <span className="text-lg mr-2">{getSportIcon(sport)}</span>
                      {sport === 'football' ? 'Fußball' : sport.toUpperCase()}
                      {selectedSport === sport && (
                        <div className="absolute -inset-1 bg-gradient-to-r from-white/20 to-white/10 rounded-2xl blur opacity-75"></div>
                      )}
                    </button>
                  );
                })}
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
                          {selectedSport === 'football' ? 'Fußball Events' : `${selectedSport.toUpperCase()} Events`}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                          {(() => {
                            const events = selectedSport === 'football' ? footballEvents : 
                                         selectedSport === 'f1' ? f1Events : nflEvents;
                            return `${events.length} kommende Spiele`;
                          })()}
                        </p>
                      </div>
              </div>
                    
                    <div className="space-y-4">
                      {isLoading ? (
                        <div className="text-center py-12">
                          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                          <p className="mt-4 text-gray-500 dark:text-gray-400">Lade Events...</p>
            </div>
                      ) : (() => {
                        const events = selectedSport === 'football' ? footballEvents : 
                                     selectedSport === 'f1' ? f1Events : nflEvents;
                        
                        if (events.length === 0) {
                          return (
                            <div className="text-center py-12">
                              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
          </div>
                              <p className="text-gray-500 dark:text-gray-400">Keine Events verfügbar</p>
      </div>
                          );
                        }
                        
                        return events.slice(0, 5).map((event) => (
                          <div key={event.id} className="group/event flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-700 rounded-2xl hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-600 dark:hover:to-gray-600 transition-all duration-200 transform hover:scale-[1.02]">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mr-4">
                                <span className="text-lg">{getSportIcon(selectedSport)}</span>
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-white">{event.title}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {format(new Date(event.startsAt), 'dd.MM.yyyy HH:mm')} Uhr
              </p>
            </div>
                            </div>
                            <div className="opacity-0 group-hover/event:opacity-100 transition-opacity duration-200">
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                      </div>
                        ));
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
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Highlights & News</h2>
                        <p className="text-gray-600 dark:text-gray-400">Aktuelle Highlights für deine Teams</p>
                      </div>
                    </div>
                    
                    {isLoadingHighlights ? (
                      <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                        <p className="mt-4 text-gray-500 dark:text-gray-400">Lade Highlights...</p>
                      </div>
                    ) : highlights.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
                          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">Keine Highlights verfügbar</p>
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
                          {FOOTBALL_TEAMS[league.id]?.map((team: any) => (
                            <button
                              key={team.id}
                              onClick={() => handleAddTeam('football', team.name, team.id, league.id)}
                              disabled={localTeams.some(t => t.teamName === team.name)}
                              className="w-full text-left px-4 py-3 text-sm rounded-xl hover:bg-white dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-sm"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-900 dark:text-white">{team.name}</span>
                                {localTeams.some(t => t.teamName === team.name) && (
                                  <div className="flex items-center text-green-600 dark:text-green-400">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            </button>
                          ))}
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
                    {NFL_TEAMS.map((team) => (
                      <button
                        key={team.id}
                        onClick={() => handleAddTeam('nfl', team.name, team.id)}
                        disabled={localTeams.some(t => t.teamName === team.name)}
                        className="relative p-4 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600 hover:shadow-md group"
                      >
                        <div className="flex flex-col items-center text-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <span className="text-lg">🏈</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white leading-tight">{team.name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{team.division}</span>
                        </div>
                        {localTeams.some(t => t.teamName === team.name) && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
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
                    {F1_DRIVERS.map((driver) => (
                      <button
                        key={driver.id}
                        onClick={() => handleAddTeam('f1', driver.name, driver.id)}
                        disabled={localTeams.some(t => t.teamName === driver.name)}
                        className="relative p-4 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-600 hover:shadow-md group"
                      >
                        <div className="flex flex-col items-center text-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-600 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <span className="text-lg">🏎️</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white leading-tight">{driver.name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{driver.team}</span>
                        </div>
                        {localTeams.some(t => t.teamName === driver.name) && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
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
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {NBA_TEAMS.map((team) => (
                      <button
                        key={team.id}
                        onClick={() => handleAddTeam('nba', team.name, team.id)}
                        disabled={localTeams.some(t => t.teamName === team.name)}
                        className="relative p-4 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600 hover:shadow-md group"
                      >
                        <div className="flex flex-col items-center text-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <span className="text-lg">🏀</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white leading-tight">{team.name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{team.division}</span>
                        </div>
                        {localTeams.some(t => t.teamName === team.name) && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
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
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {NHL_TEAMS.map((team) => (
                      <button
                        key={team.id}
                        onClick={() => handleAddTeam('nhl', team.name, team.id)}
                        disabled={localTeams.some(t => t.teamName === team.name)}
                        className="relative p-4 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md group"
                      >
                        <div className="flex flex-col items-center text-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <span className="text-lg">🏒</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white leading-tight">{team.name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{team.division}</span>
                        </div>
                        {localTeams.some(t => t.teamName === team.name) && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
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
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {MLB_TEAMS.map((team) => (
                      <button
                        key={team.id}
                        onClick={() => handleAddTeam('mlb', team.name, team.id)}
                        disabled={localTeams.some(t => t.teamName === team.name)}
                        className="relative p-4 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md group"
                      >
                        <div className="flex flex-col items-center text-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <span className="text-lg">⚾</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white leading-tight">{team.name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{team.division}</span>
                        </div>
                        {localTeams.some(t => t.teamName === team.name) && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
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
                    {[
                      { id: 'atp', name: 'ATP Tour', description: 'Männliche Profis', icon: '🎾' },
                      { id: 'wta', name: 'WTA Tour', description: 'Weibliche Profis', icon: '🎾' },
                      { id: 'grandslams', name: 'Grand Slams', description: 'Australian Open, French Open, Wimbledon, US Open', icon: '🏆' }
                    ].map((tour) => (
                      <button
                        key={tour.id}
                        onClick={() => handleAddTeam('tennis', tour.name, tour.id)}
                        disabled={localTeams.some(t => t.teamName === tour.name)}
                        className="relative p-6 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 hover:shadow-lg group"
                      >
                        <div className="flex flex-col items-center text-center">
                          <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <span className="text-2xl">{tour.icon}</span>
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{tour.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{tour.description}</p>
                        </div>
                        {localTeams.some(t => t.teamName === tour.name) && (
                          <div className="absolute top-4 right-4 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {localTeams.length} Team{localTeams.length !== 1 ? 's' : ''} ausgewählt
                </div>
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
      )}
    </div>
  );
}