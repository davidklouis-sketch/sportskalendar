import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { calendarApi, userApi, highlightsApi } from '../../lib/api';
import { format } from 'date-fns';
import { FOOTBALL_LEAGUES, FOOTBALL_TEAMS, F1_DRIVERS, NFL_TEAMS } from '../../data/teams';
import { LiveData } from '../LiveData';

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
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSport, setSelectedSport] = useState<'football' | 'nfl' | 'f1' | null>(null);
  const [showTeamSelector, setShowTeamSelector] = useState(false);
  // Local teams state to ensure UI updates work
  const [localTeams, setLocalTeams] = useState<Array<{ sport: string; teamName: string; teamId?: string; leagueId?: number }>>([]);
  // Highlights state
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [isLoadingHighlights, setIsLoadingHighlights] = useState(false);

  // Load all events separately for better organization
  const loadAllEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const teams = localTeams || [];
      console.log('🔄 Loading events for teams:', teams);
      
      // Load Football Events
          const footballTeams = teams.filter(t => t.sport === 'football');
          if (footballTeams.length > 0) {
        const leagues = footballTeams.map(t => t.leagueId).filter(Boolean) as number[];
        const response = await calendarApi.getEvents('football', leagues);
        let events = (response.data as Event[]) || [];
        
        // Filter events by selected teams using improved matching
        const normalizeTeamName = (name: string): string[] => {
          const normalized = name.toLowerCase().trim();
          const variations: string[] = [normalized];
          
          const mappings: Record<string, string[]> = {
            'bayern munich': ['fc bayern', 'bayern münchen', 'fc bayern münchen', 'bayern'],
            'borussia dortmund': ['bvb', 'borussia', 'bvb dortmund', 'dortmund'],
            'bayer leverkusen': ['bayer 04', 'leverkusen', 'bayer', 'werkself'],
            'schalke 04': ['schalke', 's04', 'schalke 04'],
            'eintracht frankfurt': ['eintracht', 'frankfurt', 'sg eintracht'],
            'vfl wolfsburg': ['wolfsburg', 'vfl', 'vfl wolfsburg'],
            'borussia mönchengladbach': ['gladbach', 'borussia mönchengladbach', 'bmg'],
            'tsg hoffenheim': ['hoffenheim', 'tsg', 'tsg hoffenheim'],
            '1. fc union berlin': ['union berlin', 'union', '1. fc union'],
            'sc freiburg': ['freiburg', 'sc freiburg'],
            '1. fc köln': ['köln', '1. fc köln', 'fc köln'],
            'hertha bsc': ['hertha', 'hertha bsc', 'hertha berlin'],
            'vfb stuttgart': ['stuttgart', 'vfb', 'vfb stuttgart'],
            'werder bremen': ['bremen', 'werder', 'werder bremen'],
            '1. fsv mainz 05': ['mainz', '1. fsv mainz', 'mainz 05'],
            'fc augsburg': ['augsburg', 'fc augsburg'],
            'arminia bielefeld': ['bielefeld', 'arminia', 'arminia bielefeld'],
            'greuther fürth': ['fürth', 'greuther', 'greuther fürth'],
            'bochum': ['bochum', 'vfl bochum'],
            'darmstadt': ['darmstadt', 'sv darmstadt']
          };
          
          for (const [key, values] of Object.entries(mappings)) {
            if (normalized.includes(key)) {
              variations.push(...values);
              break;
            }
          }
          return variations;
        };
        
        events = events.filter((event: Event) => {
          const matches = footballTeams.some(team => {
                const eventTitle = event.title.toLowerCase();
            const teamVariations = normalizeTeamName(team.teamName);
            const match = teamVariations.some(variation => eventTitle.includes(variation));
            if (match) {
              console.log(`✅ Event "${event.title}" matches team "${team.teamName}"`);
            }
            return match;
          });
          return matches;
        });
        
        setFootballEvents(events);
      }
      
      // Load F1 Events
      const f1Teams = teams.filter(t => t.sport === 'f1');
      if (f1Teams.length > 0) {
        const response = await calendarApi.getEvents('f1', []);
        const events = (response.data as Event[]) || [];
        setF1Events(events);
      }
      
      // Load NFL Events
      const nflTeams = teams.filter(t => t.sport === 'nfl');
      if (nflTeams.length > 0) {
        const response = await calendarApi.getEvents('nfl', []);
        const events = (response.data as Event[]) || [];
        setNflEvents(events);
      }
      
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setIsLoading(false);
    }
  }, [localTeams]);

  // Load highlights for selected sport
  const loadHighlights = useCallback(async () => {
    if (!selectedSport) return;
    
    setIsLoadingHighlights(true);
    try {
      const sportMapping: Record<string, string> = {
        football: 'Fußball',
        nfl: 'NFL',
        f1: 'F1',
      };

      const currentTeam = user?.selectedTeams?.find(t => t.sport === selectedSport);
      console.log(`[Highlights Frontend] Loading highlights for ${selectedSport} (${sportMapping[selectedSport]})${currentTeam ? ` for team "${currentTeam.teamName}"` : ''}`);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 15000); // 15 second timeout
      });
      
      const fetchPromise = highlightsApi.getHighlights(sportMapping[selectedSport], currentTeam?.teamName);
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      let allHighlights = response.data.items || [];
      console.log(`[Highlights Frontend] Got ${allHighlights.length} highlights from API`);
      
      // Additional frontend filtering if needed (backend should handle most filtering now)
      if (currentTeam?.teamName && allHighlights.length > 0) {
        const beforeFilter = allHighlights.length;
        allHighlights = allHighlights.filter((highlight: Highlight) => {
          const searchText = (highlight.title + ' ' + (highlight.description || '')).toLowerCase();
          
          // Use the same team variations as backend
          const teamVariations = getTeamVariations(currentTeam.teamName);
          return teamVariations.some(variation => searchText.includes(variation));
        });
        console.log(`[Highlights Frontend] Additional filtering: ${beforeFilter} -> ${allHighlights.length} highlights for team "${currentTeam.teamName}"`);
      }
      
      setHighlights(allHighlights);
    } catch (error) {
      console.error('Failed to load highlights:', error);
      setHighlights([]);
    } finally {
      setIsLoadingHighlights(false);
    }
  }, [selectedSport, user]);

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

  // Load user teams on mount
  useEffect(() => {
    if (user?.selectedTeams) {
      setLocalTeams(user.selectedTeams);
    }
  }, [user?.selectedTeams]);

  // Load events when teams change
  useEffect(() => {
    if (localTeams.length > 0) {
      loadAllEvents();
    }
  }, [localTeams, loadAllEvents]);

  // Load highlights when sport selection changes
  useEffect(() => {
    if (selectedSport) {
      loadHighlights();
    }
  }, [selectedSport, loadHighlights]);

  // Auto-select first sport if available
  useEffect(() => {
    if (user?.selectedTeams?.length && !selectedSport) {
      setSelectedSport(user.selectedTeams[0].sport as 'football' | 'nfl' | 'f1');
    }
  }, [user?.selectedTeams, selectedSport]);

  const handleAddTeam = async (sport: string, teamName: string, teamId?: string, leagueId?: number) => {
    if (!user) return;

    try {
    const newTeam = { sport: sport as 'football' | 'f1' | 'nfl', teamName, teamId, leagueId };
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
      default: return '🏆';
    }
  };

  const getSportColor = (sport: string) => {
    switch (sport) {
      case 'football': return 'from-green-500 to-emerald-600';
      case 'nfl': return 'from-orange-500 to-red-600';
      case 'f1': return 'from-red-500 to-pink-600';
      default: return 'from-blue-500 to-indigo-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 opacity-95"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Dein Sportkalender
            </h1>
            <p className="text-xl text-indigo-100 max-w-2xl mx-auto">
              Verwalte alle Spiele deiner Lieblingsteams, verfolge Live-Events und entdecke Highlights
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Live Data */}
          <div className="lg:col-span-1 space-y-6">
            {/* Live Events */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-red-500 to-pink-600 p-6 text-white">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse mr-3"></div>
                  <h2 className="text-xl font-bold">Live Events</h2>
                </div>
                <p className="text-red-100 text-sm mt-1">Aktuelle Live-Spiele</p>
              </div>
              <div className="p-6">
                <LiveData />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
                  Automatische Aktualisierung alle 30 Sekunden
                </p>
              </div>
            </div>

            {/* My Teams */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h2 className="text-xl font-bold">Meine Teams</h2>
                  </div>
            <button
                    onClick={exportCalendar}
                    className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            >
                    <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Sync
            </button>
                </div>
        </div>

              <div className="p-6">
                {localTeams.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">Noch keine Teams hinzugefügt</p>
                    <button
                      onClick={() => setShowTeamSelector(true)}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-2 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                    >
                      + Team hinzufügen
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {localTeams.map((team, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">{getSportIcon(team.sport)}</span>
              <div>
                            <p className="font-medium text-gray-900 dark:text-white">{team.teamName}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{team.sport}</p>
                          </div>
              </div>
              <button
                onClick={() => handleRemoveTeam(index)}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium text-sm"
              >
                Entfernen
              </button>
            </div>
          ))}

          <button
            onClick={() => setShowTeamSelector(true)}
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            + Team hinzufügen
          </button>
              </div>
            )}
            </div>
          </div>
      </div>

          {/* Right Column - Events & Highlights */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Sport Navigation */}
            {localTeams.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sport auswählen</h3>
                <div className="flex flex-wrap gap-3">
                  {['football', 'f1', 'nfl'].map((sport) => {
                    const hasTeams = localTeams.some(t => t.sport === sport);
                    if (!hasTeams) return null;
                    
                return (
                      <button
                        key={sport}
                        onClick={() => setSelectedSport(sport as 'football' | 'f1' | 'nfl')}
                        className={`flex items-center px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                          selectedSport === sport
                            ? `bg-gradient-to-r ${getSportColor(sport)} text-white shadow-lg transform scale-105`
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        <span className="text-xl mr-2">{getSportIcon(sport)}</span>
                        {sport === 'football' ? 'Fußball' : sport.toUpperCase()}
                      </button>
                );
              })}
            </div>
          </div>
        )}

            {/* Events */}
            {selectedSport && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                <div className={`bg-gradient-to-r ${getSportColor(selectedSport)} p-6 text-white`}>
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{getSportIcon(selectedSport)}</span>
                    <div>
                      <h2 className="text-xl font-bold">
                        {selectedSport === 'football' ? 'Fußball Events' : `${selectedSport.toUpperCase()} Events`}
              </h2>
                      <p className="text-white/80">
                        {(() => {
                          const events = selectedSport === 'football' ? footballEvents : 
                                       selectedSport === 'f1' ? f1Events : nflEvents;
                          return `${events.length} kommende Spiele`;
                        })()}
              </p>
            </div>
                  </div>
                </div>
                
                <div className="p-6">
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                      <p className="mt-4 text-gray-500 dark:text-gray-400">Lade Events...</p>
                    </div>
                  ) : (() => {
                    const events = selectedSport === 'football' ? footballEvents : 
                                 selectedSport === 'f1' ? f1Events : nflEvents;
                    
                    if (events.length === 0) {
                      return (
                        <div className="text-center py-8">
                          <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-gray-500 dark:text-gray-400">Keine Events verfügbar</p>
                        </div>
                      );
                    }
                    
                    return (
            <div className="space-y-3">
                        {events.slice(0, 5).map((event) => (
                          <div key={event.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                            <div className="flex items-center">
                              <span className="text-xl mr-3">{getSportIcon(selectedSport)}</span>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">{event.title}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {format(new Date(event.startsAt), 'dd.MM.yyyy HH:mm')} Uhr
                        </p>
                      </div>
                            </div>
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                    </div>
                        ))}
                  </div>
                );
                  })()}
            </div>
          </div>
        )}

            {/* Highlights */}
            {selectedSport && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6 text-white">
                  <div className="flex items-center">
                    <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <h2 className="text-xl font-bold">Highlights & News</h2>
                      <p className="text-white/80">Aktuelle Highlights für deine Teams</p>
                      </div>
                    </div>
                  </div>
                
                <div className="p-6">
                  {isLoadingHighlights ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                      <p className="mt-4 text-gray-500 dark:text-gray-400">Lade Highlights...</p>
                    </div>
                  ) : highlights.length === 0 ? (
                    <div className="text-center py-8">
                      <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <p className="text-gray-500 dark:text-gray-400">Keine Highlights verfügbar</p>
            </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {highlights.slice(0, 4).map((highlight) => (
                        <a
                          key={highlight.id}
                          href={highlight.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group block p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 transform hover:scale-105"
                        >
                          {highlight.thumbnail && (
                            <div className="aspect-video bg-gray-200 dark:bg-gray-600 rounded-lg mb-3 overflow-hidden">
                              <img
                                src={highlight.thumbnail}
                                alt={highlight.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
          </div>
        )}
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                            {highlight.title}
                          </h3>
                          {highlight.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
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
        )}
          </div>
        </div>
      </div>

      {/* Team Selector Modal */}
      {showTeamSelector && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Team hinzufügen</h2>
                <button
                  onClick={() => setShowTeamSelector(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="space-y-6">
                {/* Football Teams */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <span className="text-2xl mr-2">⚽</span>
                    Fußball
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {FOOTBALL_LEAGUES.map((league) => (
                      <div key={league.id} className="mb-3">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{league.name}</h4>
                        <div className="space-y-1">
                          {FOOTBALL_TEAMS[league.id]?.map((team: any) => (
                            <button
                              key={team.id}
                              onClick={() => handleAddTeam('football', team.name, team.id, league.id)}
                              disabled={localTeams.some(t => t.teamName === team.name)}
                              className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {team.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* F1 Drivers */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <span className="text-2xl mr-2">🏎️</span>
                    Formel 1
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {F1_DRIVERS.map((driver) => (
                      <button
                        key={driver.id}
                        onClick={() => handleAddTeam('f1', driver.name, driver.id)}
                        disabled={localTeams.some(t => t.teamName === driver.name)}
                        className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {driver.name} - {driver.team}
                      </button>
                    ))}
                  </div>
      </div>

                {/* NFL Teams */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <span className="text-2xl mr-2">🏈</span>
                    NFL
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {NFL_TEAMS.map((team) => (
                      <button
                        key={team.id}
                        onClick={() => handleAddTeam('nfl', team.name, team.id)}
                        disabled={localTeams.some(t => t.teamName === team.name)}
                        className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {team.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}