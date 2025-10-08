import { useState, useEffect, useCallback, useRef } from 'react';
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
  const { user, updateUser, setUser } = useAuthStore();
  const [footballEvents, setFootballEvents] = useState<Event[]>([]);
  const [f1Events, setF1Events] = useState<Event[]>([]);
  const [nflEvents, setNflEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSport, setSelectedSport] = useState<'football' | 'nfl' | 'f1' | null>(null);
  const [showTeamSelector, setShowTeamSelector] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState<number | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
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
      const footballLeagues = teams
        .filter(t => t.sport === 'football' && t.leagueId)
        .map(t => t.leagueId!);
      
      if (footballLeagues.length > 0) {
        try {
          const { data: footballData } = await calendarApi.getEvents('football', footballLeagues);
          let footballEvents = footballData || [];
          
          // Filter football events by selected teams
          const footballTeams = teams.filter(t => t.sport === 'football');
          
          if (footballTeams.length > 0) {
            footballEvents = footballEvents.filter((event: Event) => {
              return footballTeams.some(team => {
                const teamName = team.teamName.toLowerCase();
                const eventTitle = event.title.toLowerCase();
                return eventTitle.includes(teamName);
              });
            });
          }
          
          setFootballEvents(footballEvents);
        } catch (error) {
          console.error('Failed to load football events:', error);
          setFootballEvents([]);
        }
      } else {
        setFootballEvents([]);
      }
      
      // Load F1 Events - Only show F1 races if user has selected F1 drivers
      const f1Teams = teams.filter(t => t.sport === 'f1');
      if (f1Teams.length > 0) {
        try {
          const { data: f1Data } = await calendarApi.getEvents('f1');
          setF1Events(f1Data || []);
        } catch (error) {
          console.error('Failed to load F1 events:', error);
          // Don't set empty array immediately - keep previous data if available
          // This prevents clearing F1 events when API is temporarily unavailable
          if (f1Events.length === 0) {
            setF1Events([]);
          }
        }
      } else {
        setF1Events([]);
      }
      
      // Load NFL Events
      const nflTeams = teams.filter(t => t.sport === 'nfl');
      if (nflTeams.length > 0) {
        try {
          const { data: nflData } = await calendarApi.getEvents('nfl');
          let nflEvents = nflData || [];
          
          // Filter NFL events by selected teams
          nflEvents = nflEvents.filter((event: Event) => {
            return nflTeams.some(team => {
              const teamName = team.teamName.toLowerCase();
              const eventTitle = event.title.toLowerCase();
              return eventTitle.includes(teamName);
            });
          });
          
          setNflEvents(nflEvents);
        } catch (error) {
          console.error('Failed to load NFL events:', error);
          setNflEvents([]);
        }
      } else {
        setNflEvents([]);
      }
      
    } catch (error) {
      console.error('❌ Failed to load events:', error);
    } finally {
      setIsLoading(false);
    }
  }, [localTeams]); // Include localTeams dependency to load events when teams change

  useEffect(() => {
    // Always update local teams when user teams change
    if (user?.selectedTeams) {
      setLocalTeams(user.selectedTeams);
    }
  }, [user?.selectedTeams]); // Only depend on selectedTeams, not selectedSport

  // Load events when localTeams change - use a ref to prevent loops
  const teamsLengthRef = useRef(0);
  useEffect(() => {
    if (localTeams && localTeams.length > 0 && localTeams.length !== teamsLengthRef.current) {
      teamsLengthRef.current = localTeams.length;
      loadAllEvents();
    }
  }, [localTeams.length]);

  // Separate effect for initial sport selection
  useEffect(() => {
    // Set initial sport from user's selected teams only if no sport is currently selected
    if (user?.selectedTeams?.length && !selectedSport) {
      setSelectedSport(user.selectedTeams[0].sport);
    }
  }, [user?.selectedTeams?.length]); // Only depend on length to avoid overriding manual selection

  // Load highlights for selected teams
  const loadHighlights = useCallback(async () => {
    if (!localTeams || localTeams.length === 0) {
      setHighlights([]);
      return;
    }

    // Prevent multiple simultaneous requests
    if (isLoadingHighlights) {
      return;
    }

    setIsLoadingHighlights(true);
    try {
      const allHighlights: Highlight[] = [];
      
      // Load highlights for each sport that user has teams in
      const uniqueSports = [...new Set(localTeams.map(t => t.sport))];
      
      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Highlights request timeout')), 10000)
      );
      
      for (const sport of uniqueSports) {
        const sportMapping: Record<string, string> = {
          football: 'Fußball',
          nfl: 'NFL',
          f1: 'F1',
        };
        
        try {
          const highlightsPromise = highlightsApi.getHighlights(sportMapping[sport]);
          const { data } = await Promise.race([highlightsPromise, timeoutPromise]);
          
          let sportHighlights = data.items || [];
          
          // Filter highlights by team names for this sport
          const teamsForSport = localTeams.filter(t => t.sport === sport);
          if (teamsForSport.length > 0) {
            sportHighlights = sportHighlights.filter((highlight: Highlight) => {
              const searchText = (highlight.title + ' ' + (highlight.description || '')).toLowerCase();
              return teamsForSport.some(team => searchText.includes(team.teamName.toLowerCase()));
            });
          }
          
          allHighlights.push(...sportHighlights);
        } catch (error) {
          console.error(`Failed to load ${sport} highlights:`, error);
          // Continue with other sports even if one fails
        }
      }
      
      // Sort by date, newest first
      allHighlights.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // Limit to 6 highlights for the preview
      setHighlights(allHighlights.slice(0, 6));
    } catch (error) {
      console.error('Failed to load highlights:', error);
      setHighlights([]);
    } finally {
      setIsLoadingHighlights(false);
    }
  }, [localTeams, isLoadingHighlights]);

  // Load highlights when teams change - with debouncing to prevent API spam
  useEffect(() => {
    if (!localTeams || localTeams.length === 0) {
      setHighlights([]);
      return;
    }

    // Debounce highlights loading to prevent API spam
    const timeoutId = setTimeout(() => {
      loadHighlights();
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [localTeams.length]); // Only depend on length, not the entire loadHighlights function

  // Events are now loaded automatically when localTeams change

  const formatViews = (views?: number) => {
    if (!views) return '';
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const handleAddTeam = async () => {
    if (!selectedSport) return;

    let teamName = '';
    let teamId: string | undefined = undefined;
    let leagueId: number | undefined = undefined;

    // Validation and get team info based on sport
    if (selectedSport === 'football') {
      if (!selectedLeague) {
        alert('Bitte wähle eine Liga aus');
        return;
      }
      if (!selectedTeamId) {
        alert('Bitte wähle ein Team aus');
        return;
      }
      const team = FOOTBALL_TEAMS[selectedLeague]?.find(t => t.id === selectedTeamId);
      teamName = team?.name || 'Unbekannt';
      teamId = selectedTeamId;
      leagueId = selectedLeague;
    } else if (selectedSport === 'f1') {
      if (!selectedTeamId) {
        alert('Bitte wähle einen Fahrer aus');
        return;
      }
      const driver = F1_DRIVERS.find(d => d.id === selectedTeamId);
      teamName = driver?.name || 'Unbekannt';
      teamId = selectedTeamId;
    } else if (selectedSport === 'nfl') {
      if (!selectedTeamId) {
        alert('Bitte wähle ein Team aus');
        return;
      }
      const team = NFL_TEAMS.find(t => t.id === selectedTeamId);
      teamName = team?.name || 'Unbekannt';
      teamId = selectedTeamId;
    }

    // Build team object - only include defined values
    const newTeam: {
      sport: 'football' | 'nfl' | 'f1';
      teamName: string;
      teamId?: string;
      leagueId?: number;
    } = {
      sport: selectedSport,
      teamName,
    };

    // Only add teamId if it exists
    if (teamId) {
      newTeam.teamId = teamId;
    }

    // Only add leagueId if it exists (for football)
    if (leagueId !== undefined) {
      newTeam.leagueId = leagueId;
    }

    // Ensure we always work with a clean array
    const existingTeams = Array.isArray(user?.selectedTeams) ? user.selectedTeams : [];
    const updatedTeams = [...existingTeams];
    
    // Check if free user tries to add more than one team
    if (!user?.isPremium && updatedTeams.length >= 1) {
      alert('Upgrade zu Premium für mehrere Teams!');
      return;
    }

    updatedTeams.push(newTeam);

    // Ensure it's a proper array before sending
    const teamsArray = Array.from(updatedTeams);
    console.log('Sending teams to API:', JSON.stringify(teamsArray, null, 2));

    try {
      const response = await userApi.updateTeams(teamsArray);
      console.log('🔍 Debug - API call successful, response:', response);
      console.log('🔍 Debug - UpdateTeams response data:', JSON.stringify(response.data, null, 2));
      console.log('🔍 Debug - UpdateTeams response selectedTeams:', JSON.stringify(response.data.selectedTeams, null, 2));
      
      // Update local teams state immediately for UI
      if (response.data.selectedTeams) {
        setLocalTeams(response.data.selectedTeams);
      }
      
      // Also update user state
      if (user && response.data.selectedTeams) {
        const updatedUser = { ...user, selectedTeams: response.data.selectedTeams };
        setUser(updatedUser);
      }
      
      // Still try profile refresh for other user data, but don't rely on it for teams
      try {
        const profileResponse = await userApi.getProfile();
        console.log('🔍 Debug - Profile refresh successful:', profileResponse.data);
        console.log('🔍 Debug - Profile response selectedTeams:', JSON.stringify(profileResponse.data.user.selectedTeams, null, 2));
        
        // Only update non-team data from profile, keep teams from updateTeams response
        if (user && response.data.selectedTeams) {
          const updatedUser = { 
            ...profileResponse.data.user, 
            selectedTeams: response.data.selectedTeams // Keep teams from updateTeams response
          };
          setUser(updatedUser);
          console.log('🔍 Debug - User updated with profile data + teams from response:', updatedUser);
        }
      } catch (profileError) {
        console.log('🔍 Debug - Profile refresh failed, but teams are already set from response:', profileError);
      }
      
      setShowTeamSelector(false);
      setSelectedTeamId('');
      setSelectedLeague(null);
      // Don't reset selectedSport - keep it to show events for the added team
      // setSelectedSport(null);
      // Force reload events after team addition
      setTimeout(() => {
        console.log('🔍 Debug - Team added successfully');
        console.log('🔍 Debug - Updated teams:', response.data.selectedTeams || updatedTeams);
        // Events will be loaded automatically when localTeams state updates
      }, 100);
    } catch (error) {
      const err = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
      if (err.response?.status === 403) {
        alert('Premium erforderlich für mehrere Teams!');
      } else {
        console.error('Error adding team:', error);
        console.error('Error response:', err.response?.data);
        alert('Fehler beim Hinzufügen des Teams: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleRemoveTeam = async (index: number) => {
    const updatedTeams = user?.selectedTeams?.filter((_, i) => i !== index) || [];
    try {
      await userApi.updateTeams(updatedTeams);
      updateUser({ selectedTeams: updatedTeams });
      // Events will be loaded automatically when localTeams state updates
    } catch (err) {
      console.error('Failed to remove team:', err);
      alert('Fehler beim Entfernen des Teams');
    }
  };

  const handleUpgradePremium = async () => {
    try {
      await userApi.upgradePremium();
      updateUser({ isPremium: true });
      alert('Erfolgreich zu Premium upgraded! 🎉');
    } catch (err) {
      console.error('Failed to upgrade premium:', err);
      alert('Fehler beim Premium-Upgrade');
    }
  };

  const handleExportCalendar = async () => {
    try {
      await calendarApi.exportICS();
      alert('✅ Kalender erfolgreich exportiert! Die Datei wurde heruntergeladen und kann jetzt in deine Kalender-App importiert werden.');
    } catch (err) {
      console.error('Failed to export calendar:', err);
      alert('Fehler beim Exportieren des Kalenders. Bitte stelle sicher, dass du Teams ausgewählt hast.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Live Data Section - Show at top if there are live games */}
      <LiveData className="mb-6" />

      {/* Highlights Section - Show at top if user has teams selected */}
      {localTeams && localTeams.length > 0 && highlights.length > 0 && (
        <div className="card p-6 mb-6">
          <div className="mb-4">
            <h2 className="text-2xl font-bold mb-2">🎥 Highlights & News</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Aktuelle Highlights für deine Teams
            </p>
          </div>
          
          {isLoadingHighlights ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Lade Highlights...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {highlights.map((highlight) => (
                <a
                  key={highlight.id}
                  href={highlight.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group card p-0 overflow-hidden hover:shadow-lg transition-all"
                >
                  {/* Thumbnail */}
                  {highlight.thumbnail ? (
                    <div className="relative aspect-video bg-gray-200 dark:bg-gray-700">
                      <img
                        src={highlight.thumbnail}
                        alt={highlight.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {highlight.duration && (
                        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 text-white text-xs rounded">
                          {highlight.duration}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                      <svg className="w-12 h-12 text-white opacity-50" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                      </svg>
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-3">
                    <h3 className="font-semibold text-sm mb-1 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {highlight.title}
                    </h3>

                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>{new Date(highlight.createdAt).toLocaleDateString('de-DE')}</span>
                      {highlight.views && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                          {formatViews(highlight.views)}
                        </span>
                      )}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Team Selection Section */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Meine Teams</h2>
          <div className="flex gap-2">
            {localTeams && localTeams.length > 0 && (
              <button
                onClick={handleExportCalendar}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
                title="Kalender exportieren und in Google Calendar, Outlook, Apple Calendar etc. importieren"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Kalender Sync
              </button>
            )}
            {!user?.isPremium && (
              <button
                onClick={handleUpgradePremium}
                className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Upgrade zu Premium
              </button>
            )}
          </div>
        </div>

        {/* Selected Teams */}
        <div className="space-y-2 mb-4">
          {localTeams?.map((team, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg"
            >
              <div>
                <span className="font-medium">{team.teamName}</span>
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                  ({team.sport === 'football' ? '⚽ Fußball' : team.sport === 'nfl' ? '🏈 NFL' : '🏎️ F1'})
                </span>
              </div>
              <button
                onClick={() => handleRemoveTeam(index)}
                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                Entfernen
              </button>
            </div>
          ))}

          {(!localTeams || localTeams.length === 0) && (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              Noch keine Teams ausgewählt. Füge jetzt dein erstes Team hinzu!
            </p>
          )}
        </div>

        {/* Premium Limit Info */}
        {!user?.isPremium && localTeams && localTeams.length >= 1 && (
          <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 rounded-lg text-sm mb-4">
            Free-Account: Nur 1 Team möglich. Upgrade zu Premium für unbegrenzte Teams!
          </div>
        )}

        {/* Add Team Button/Form */}
        {!showTeamSelector ? (
          <button
            onClick={() => setShowTeamSelector(true)}
            disabled={!user?.isPremium && (localTeams?.length || 0) >= 1}
            className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + Team hinzufügen
          </button>
        ) : (
          <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div>
              <label className="block text-sm font-medium mb-2">Sportart</label>
              <select
                value={selectedSport || ''}
                onChange={(e) => {
                  setSelectedSport(e.target.value as 'football' | 'nfl' | 'f1');
                  setSelectedLeague(null);
                  setSelectedTeamId('');
                }}
                className="input"
              >
                <option value="">Sportart wählen...</option>
                <option value="football">⚽ Fußball</option>
                <option value="nfl">🏈 NFL</option>
                <option value="f1">🏎️ Formel 1</option>
              </select>
            </div>

            {selectedSport === 'football' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Liga</label>
                  <select
                    value={selectedLeague || ''}
                    onChange={(e) => {
                      setSelectedLeague(Number(e.target.value));
                      setSelectedTeamId('');
                    }}
                    className="input"
                  >
                    <option value="">Liga wählen...</option>
                    {FOOTBALL_LEAGUES.map((league) => (
                      <option key={league.id} value={league.id}>
                        {league.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedLeague && FOOTBALL_TEAMS[selectedLeague] && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Team</label>
                    <select
                      value={selectedTeamId}
                      onChange={(e) => setSelectedTeamId(e.target.value)}
                      className="input"
                    >
                      <option value="">Team wählen...</option>
                      {FOOTBALL_TEAMS[selectedLeague].map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}

            {selectedSport === 'f1' && (
              <div>
                <label className="block text-sm font-medium mb-2">Fahrer</label>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="input"
                >
                  <option value="">Fahrer wählen...</option>
                  {F1_DRIVERS.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name} ({driver.team})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedSport === 'nfl' && (
              <div>
                <label className="block text-sm font-medium mb-2">Team</label>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="input"
                >
                  <option value="">Team wählen...</option>
                  {NFL_TEAMS.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleAddTeam}
                disabled={
                  !selectedSport ||
                  (selectedSport === 'football' && (!selectedLeague || !selectedTeamId)) ||
                  ((selectedSport === 'f1' || selectedSport === 'nfl') && !selectedTeamId)
                }
                className="btn btn-primary flex-1 disabled:opacity-50"
              >
                Hinzufügen
              </button>
              <button
                onClick={() => {
                  setShowTeamSelector(false);
                  setSelectedLeague(null);
                  setSelectedTeamId('');
                  setSelectedSport(null);
                }}
                className="btn btn-secondary flex-1"
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Events List - Separated by Sport */}
      <div className="space-y-6">
        {/* Football Events */}
        {footballEvents.length > 0 && (
          <div className="card p-6">
            <div className="mb-4">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                ⚽ Fußball Events
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {footballEvents.length} kommende Spiele
              </p>
            </div>
            <div className="space-y-3">
              {footballEvents.map((event) => {
                const eventDate = new Date(event.startsAt);
                return (
                  <div
                    key={event.id}
                    className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{event.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {format(eventDate, "dd.MM.yyyy HH:mm")} Uhr
                        </p>
                      </div>
                      <span className="ml-4 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                        ⚽ Fußball
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* F1 Events - Show for all users */}
        {f1Events.length > 0 && (
          <div className="card p-6">
            <div className="mb-4">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                🏎️ Formel 1 Events
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {f1Events.length} kommende Rennen für ausgewählte Fahrer
              </p>
            </div>
            <div className="space-y-3">
              {f1Events.map((event) => {
                const eventDate = new Date(event.startsAt);
                return (
                  <div
                    key={event.id}
                    className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{event.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {format(eventDate, "dd.MM.yyyy HH:mm")} Uhr
                        </p>
                      </div>
                      <span className="ml-4 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm font-medium">
                        🏎️ F1
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* NFL Events */}
        {nflEvents.length > 0 && (
          <div className="card p-6">
            <div className="mb-4">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                🏈 NFL Events
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {nflEvents.length} kommende Spiele
              </p>
            </div>
            <div className="space-y-3">
              {nflEvents.map((event) => {
                const eventDate = new Date(event.startsAt);
                return (
                  <div
                    key={event.id}
                    className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{event.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {format(eventDate, "dd.MM.yyyy HH:mm")} Uhr
                        </p>
                      </div>
                      <span className="ml-4 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm font-medium">
                        🏈 NFL
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No Events Message */}
        {!isLoading && footballEvents.length === 0 && f1Events.length === 0 && nflEvents.length === 0 && (
          <div className="card p-12 text-center">
            <h2 className="text-2xl font-bold mb-4">Keine Events gefunden</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {user?.selectedTeams?.length ? 
                'Keine kommenden Events für deine ausgewählten Teams.' : 
                'Füge Teams hinzu, um Events zu sehen!'
              }
            </p>
            {!user?.selectedTeams?.length && (
              <p className="text-sm text-blue-600 dark:text-blue-400">
                💡 Tipp: Wähle Teams aus verschiedenen Sportarten aus, um deren Events zu sehen!
              </p>
            )}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="card p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">Lade Events...</p>
          </div>
        )}
      </div>

      {/* Removed Highlights Preview - not used anymore */}
    </div>
  );
}

