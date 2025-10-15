import { useState, useEffect, useCallback, memo } from 'react';
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
import { useEventLoader } from '../../hooks/useEventLoader';
import { useNextEvent } from '../../hooks/useNextEvent';
import { SportTabs } from '../Calendar/SportTabs';
import { EventList } from '../Calendar/EventList';

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

interface CalendarProps {
  onNavigate?: (page: string) => void;
}

export const Calendar = memo(function Calendar({ onNavigate }: CalendarProps = {}) {
  const { user, setUser } = useAuthStore();
  useLanguage(); // Trigger re-render on language change
  
  // Use custom hooks for event loading
  const {
    footballEvents,
    f1Events,
    nflEvents,
    nbaEvents,
    nhlEvents,
    mlbEvents,
    tennisEvents,
    isLoading,
    debouncedLoadAllEvents
  } = useEventLoader();
  
  // Calculate next event
  const nextEvent = useNextEvent(
    footballEvents,
    f1Events,
    nflEvents,
    nbaEvents,
    nhlEvents,
    mlbEvents,
    tennisEvents
  );
  
  const [selectedSport, setSelectedSport] = useState<'football' | 'nfl' | 'f1' | 'nba' | 'nhl' | 'mlb' | 'tennis' | null>(null);
  const [showTeamSelector, setShowTeamSelector] = useState(false);
  const [selectedSportTab, setSelectedSportTab] = useState<'football' | 'nfl' | 'f1' | 'nba' | 'nhl' | 'mlb' | 'tennis'>('football');
  const [localTeams, setLocalTeams] = useState<Array<{ sport: string; teamName: string; teamId?: string; leagueId?: number }>>([]);
  
  // Highlights state
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [isLoadingHighlights, setIsLoadingHighlights] = useState(false);
  
  // API Teams state (with images)
  const [nbaTeamsFromApi, setNbaTeamsFromApi] = useState<ApiTeam[]>([]);
  const [nhlTeamsFromApi, setNhlTeamsFromApi] = useState<ApiTeam[]>([]);
  const [mlbTeamsFromApi, setMlbTeamsFromApi] = useState<ApiTeam[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);

  // Load teams from API
  const loadTeamsFromApi = useCallback(async () => {
    setIsLoadingTeams(true);
    try {
      // Load NBA teams
      try {
        const nbaResponse = await sportsApi.getNBATeams();
        setNbaTeamsFromApi(nbaResponse.data.teams || []);
      } catch {
        setNbaTeamsFromApi([]);
      }

      // Load NHL teams
      try {
        const nhlResponse = await sportsApi.getNHLTeams();
        setNhlTeamsFromApi(nhlResponse.data.teams || []);
      } catch {
        setNhlTeamsFromApi([]);
      }

      // Load MLB teams
      try {
        const mlbResponse = await sportsApi.getMLBTeams();
        setMlbTeamsFromApi(mlbResponse.data.teams || []);
      } catch {
        setMlbTeamsFromApi([]);
      }
    } finally {
      setIsLoadingTeams(false);
    }
  }, []);

  // Load teams when modal opens
  useEffect(() => {
    if (showTeamSelector && (nbaTeamsFromApi.length === 0 || nhlTeamsFromApi.length === 0 || mlbTeamsFromApi.length === 0)) {
      loadTeamsFromApi();
    }
  }, [showTeamSelector, nbaTeamsFromApi.length, nhlTeamsFromApi.length, mlbTeamsFromApi.length, loadTeamsFromApi]);

  // Load highlights for selected sport
  const loadHighlights = useCallback(async () => {
    if (!selectedSport) return;
    
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

      const currentTeam = localTeams.find(t => t.sport === selectedSport);
      const fallbackTeam = !currentTeam && user?.selectedTeams 
        ? user.selectedTeams.find(t => t.sport === selectedSport)
        : currentTeam;
      
      try {
        const response = await highlightsApi.getHighlights(sportMapping[selectedSport], fallbackTeam?.teamName);
        setHighlights(response.data.items || []);
      } catch {
        setHighlights([]);
      }
    } finally {
      setIsLoadingHighlights(false);
    }
  }, [selectedSport, localTeams, user?.selectedTeams]);

  // Load user teams and events on mount
  useEffect(() => {
    const teams = user?.selectedTeams || [];
    setLocalTeams(teams);

    if (teams.length > 0) {
      const firstSport = teams[0].sport as 'football' | 'f1' | 'nfl' | 'nba' | 'nhl' | 'mlb' | 'tennis';
      setSelectedSport(firstSport);
      debouncedLoadAllEvents(teams);
    }
  }, [user?.selectedTeams, debouncedLoadAllEvents]);

  // Load highlights when sport changes
  useEffect(() => {
    if (selectedSport) {
      loadHighlights();
    }
  }, [selectedSport, loadHighlights]);

  const handleAddTeam = async (sport: string, teamName: string, teamId?: string, leagueId?: number) => {
    if (!user) return;

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
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } };
      if (err.response?.status === 403) {
        alert('Premium erforderlich: Du kannst als kostenloser Nutzer nur ein Team auswählen. Upgrade auf Premium für mehrere Teams!');
      } else if (err.response?.status === 400) {
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
    } catch {
      // Failed to remove team
    }
  };

  const exportCalendar = async () => {
    try {
      await calendarApi.exportICS();
    } catch {
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

  const getEventsBySport = () => {
    switch (selectedSport) {
      case 'football': return footballEvents;
      case 'f1': return f1Events;
      case 'nfl': return nflEvents;
      case 'nba': return nbaEvents;
      case 'nhl': return nhlEvents;
      case 'mlb': return mlbEvents;
      case 'tennis': return tennisEvents;
      default: return [];
    }
  };

  const getSportName = (sport: string) => {
    const sportNames: Record<string, string> = {
      'football': t('football'),
      'f1': t('formula1'),
      'nfl': t('nfl'),
      'nba': t('nba'),
      'nhl': t('nhl'),
      'mlb': t('mlb'),
      'tennis': t('tennis')
    };
    return sportNames[sport] || sport.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            
            {/* Live Events */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('live')} Events</h2>
                </div>
                <LiveData />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                  {t('automaticUpdate')}
                </p>
              </div>
            </div>

            {/* Ad Banner */}
            <div className="relative">
              <SportsKalendarBanner />
            </div>

            {/* My Teams */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('myTeams')}</h2>
                  </div>
                  <button
                    onClick={exportCalendar}
                    className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
                    title="Export Calendar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>

                {localTeams.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">{t('noTeamsAdded')}</p>
                    <button
                      onClick={() => setShowTeamSelector(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                    >
                      + {t('addTeam')}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {localTeams.map((team, index) => (
                      <div key={index} className="group/team flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{getSportIcon(team.sport)}</span>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">{team.teamName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{team.sport}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveTeam(index)}
                          className="opacity-0 group-hover/team:opacity-100 p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-opacity"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}

                    <button
                      onClick={() => setShowTeamSelector(true)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                    >
                      + {t('addTeam')}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* News Widget */}
            <NewsWidget 
              className="mt-6"
              maxArticles={3}
              showViewAll={true}
              onViewAll={() => {
                if (onNavigate) {
                  onNavigate('news');
                }
              }}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* Sport Selection - Floating Pills */}
            {localTeams.length > 0 && (
              <SportTabs
                teams={localTeams}
                selectedSport={selectedSport}
                onSelectSport={setSelectedSport}
                getSportIcon={getSportIcon}
                getSportColor={getSportColor}
                t={t}
              />
            )}

            {/* Events Section */}
            {selectedSport && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-5">
                    <span className="text-2xl">{getSportIcon(selectedSport)}</span>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {getSportName(selectedSport)} Events
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {getEventsBySport().length} {getEventsBySport().length === 1 ? 'Event' : 'Events'}
                      </p>
                    </div>
                  </div>
                  
                  <EventList
                    events={getEventsBySport()}
                    isLoading={isLoading}
                    selectedSport={selectedSport}
                    user={user}
                    getSportIcon={getSportIcon}
                    t={t}
                  />
                </div>
              </div>
            )}

            {/* Highlights Section */}
            {selectedSport && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-5">
                    <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('highlightsNews')}</h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('currentHighlights')}</p>
                    </div>
                  </div>
                    
                  {isLoadingHighlights ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
                      <p className="mt-3 text-gray-500 dark:text-gray-400 text-sm">{t('loading')}</p>
                    </div>
                  ) : highlights.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400 text-sm">{t('noEventsAvailable')}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {highlights.slice(0, 4).map((highlight) => (
                        <a
                          key={highlight.id}
                          href={highlight.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group/highlight block p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          {highlight.thumbnail && (
                            <div className="aspect-video bg-gray-200 dark:bg-gray-600 rounded-lg mb-3 overflow-hidden">
                              <img
                                src={highlight.thumbnail}
                                alt={highlight.title}
                                className="w-full h-full object-cover"
                              />
                              </div>
                            )}
                          <h3 className="font-medium text-gray-900 dark:text-white mb-1 line-clamp-2 text-sm">
                            {highlight.title}
                          </h3>
                          {highlight.description && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                              {highlight.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>{format(new Date(highlight.createdAt), 'dd.MM.yyyy')}</span>
                            {highlight.views && (
                              <span>{highlight.views >= 1000000 ? `${(highlight.views / 1000000).toFixed(1)}M` :
                               highlight.views >= 1000 ? `${(highlight.views / 1000).toFixed(1)}K` :
                               highlight.views.toString()} views</span>
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
                    onClick={() => setSelectedSportTab(sport.id as 'football' | 'nfl' | 'f1' | 'nba' | 'nhl' | 'mlb' | 'tennis')}
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
                            const localTeamNames = new Set(localTeams.map(t => t.teamName));
                            return FOOTBALL_TEAMS[league.id]?.map((team: { id: string; name: string }) => {
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
                <button
                  onClick={() => setShowTeamSelector(false)}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-2 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
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
});
