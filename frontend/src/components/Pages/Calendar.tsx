import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { calendarApi, userApi, highlightsApi } from '../../lib/api';
import { format } from 'date-fns';
import { FOOTBALL_LEAGUES, FOOTBALL_TEAMS, F1_DRIVERS, NFL_TEAMS } from '../../data/teams';

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
  const { user, updateUser } = useAuthStore();
  const [events, setEvents] = useState<Event[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState<'football' | 'nfl' | 'f1' | null>(null);
  const [showTeamSelector, setShowTeamSelector] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState<number | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');

  useEffect(() => {
    // Set initial sport from user's selected teams
    if (user?.selectedTeams?.length) {
      setSelectedSport(user.selectedTeams[0].sport);
    }
  }, [user]);

  const loadEvents = useCallback(async () => {
    if (!selectedSport) {
      console.log('🔍 Debug - No selectedSport, skipping loadEvents');
      return;
    }
    
    console.log('🔍 Debug - Starting loadEvents for sport:', selectedSport);
    setIsLoading(true);
    try {
      const teams = user?.selectedTeams || [];
      const leagues = selectedSport === 'football' 
        ? teams
            .filter(t => t.sport === 'football' && t.leagueId)
            .map(t => t.leagueId!)
        : undefined;

      console.log('🔍 Debug - Making API call to calendar with leagues:', leagues);
      const { data } = await calendarApi.getEvents(selectedSport, leagues);
      let allEvents = data || [];
      
      console.log('🔍 Debug - API response received:', allEvents.length, 'events');
      
      // Filter events by selected team name
      const currentTeam = teams.find(t => t.sport === selectedSport);
      
      if (currentTeam?.teamName) {
        const beforeFilter = allEvents.length;
        allEvents = allEvents.filter((event: Event) => 
          event.title.toLowerCase().includes(currentTeam.teamName.toLowerCase())
        );
        console.log('🔍 Debug - Filtered events:', beforeFilter, '->', allEvents.length, 'for team:', currentTeam.teamName);
      }
      
      setEvents(allEvents);
      console.log('🔍 Debug - Events state updated:', allEvents.length, 'events');
    } catch (error) {
      console.error('❌ Failed to load events:', error);
      const err = error as { message?: string; response?: { status?: number; data?: any } };
      console.error('❌ Error details:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data
      });
      setEvents([]);
    } finally {
      console.log('🔍 Debug - Setting isLoading to false');
      setIsLoading(false);
    }
  }, [selectedSport, user?.selectedTeams]);

  const loadHighlights = useCallback(async () => {
    if (!selectedSport) return;

    try {
      const sportMapping: Record<string, string> = {
        football: 'Fußball',
        nfl: 'NFL',
        f1: 'F1',
      };

      const { data } = await highlightsApi.getHighlights(sportMapping[selectedSport]);
      let allHighlights = data.items || [];
      
      // Filter highlights by selected team name
      const teams = user?.selectedTeams || [];
      const currentTeam = teams.find(t => t.sport === selectedSport);
      if (currentTeam?.teamName) {
        allHighlights = allHighlights.filter((highlight: Highlight) => {
          const searchText = (highlight.title + ' ' + (highlight.description || '')).toLowerCase();
          return searchText.includes(currentTeam.teamName.toLowerCase());
        });
      }
      
      setHighlights(allHighlights.slice(0, 3)); // Only show top 3 on calendar page
    } catch (error) {
      console.error('Failed to load highlights:', error);
      setHighlights([]);
    }
  }, [selectedSport, user?.selectedTeams]);

  // Load events when sport or teams change - but only once
  useEffect(() => {
    console.log('🔍 Debug - useEffect triggered, selectedSport:', selectedSport);
    if (selectedSport) {
      loadEvents();
      loadHighlights();
    }
  }, [selectedSport, user?.selectedTeams?.length]);

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
      await userApi.updateTeams(teamsArray);
      updateUser({ selectedTeams: updatedTeams });
      setShowTeamSelector(false);
      setSelectedTeamId('');
      setSelectedLeague(null);
      // Don't reset selectedSport - keep it to show events for the added team
      // setSelectedSport(null);
      // Force reload events after team addition
      setTimeout(() => {
        loadEvents();
        loadHighlights();
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
      loadEvents();
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

  return (
    <div className="max-w-7xl mx-auto">
      {/* Team Selection Section */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Meine Teams</h2>
          {!user?.isPremium && (
            <button
              onClick={handleUpgradePremium}
              className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Upgrade zu Premium
            </button>
          )}
        </div>

        {/* Selected Teams */}
        <div className="space-y-2 mb-4">
          {user?.selectedTeams?.map((team, index) => (
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

          {(!user?.selectedTeams || user.selectedTeams.length === 0) && (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              Noch keine Teams ausgewählt. Füge jetzt dein erstes Team hinzu!
            </p>
          )}
        </div>

        {/* Premium Limit Info */}
        {!user?.isPremium && user?.selectedTeams && user.selectedTeams.length >= 1 && (
          <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 rounded-lg text-sm mb-4">
            Free-Account: Nur 1 Team möglich. Upgrade zu Premium für unbegrenzte Teams!
          </div>
        )}

        {/* Add Team Button/Form */}
        {!showTeamSelector ? (
          <button
            onClick={() => setShowTeamSelector(true)}
            disabled={!user?.isPremium && (user?.selectedTeams?.length || 0) >= 1}
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

      {/* Events List */}
      <div className="card p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Kommende Events</h2>
          {user?.selectedTeams?.find(t => t.sport === selectedSport) && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Zeige Events für: <span className="font-semibold">
                {user.selectedTeams.find(t => t.sport === selectedSport)?.teamName}
              </span>
            </p>
          )}
        </div>

        {(() => {
          console.log('🔍 Debug - UI Render - isLoading:', isLoading, 'events.length:', events.length, 'events:', events);
          return null;
        })()}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">Lade Events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              Keine Events gefunden. Füge ein Team hinzu, um Events zu sehen.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => {
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
                    <span className="ml-4 px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium">
                      {event.sport}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Highlights Preview */}
      {highlights.length > 0 && (
        <div className="card p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Aktuelle Highlights</h2>
            <a
              href="#highlights"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                // Trigger navigation to highlights page through parent
              }}
              className="text-primary-600 dark:text-primary-400 hover:underline text-sm font-medium"
            >
              Alle ansehen →
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {highlights.map((highlight) => (
              <a
                key={highlight.id}
                href={highlight.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group card p-0 overflow-hidden hover:shadow-lg transition-all"
              >
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

                <div className="p-3">
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {highlight.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{new Date(highlight.createdAt).toLocaleDateString('de-DE')}</span>
                    {highlight.views && (
                      <span>{formatViews(highlight.views)}</span>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

