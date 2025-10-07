import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { calendarApi, userApi } from '../../lib/api';
import { format } from 'date-fns';
import { FOOTBALL_LEAGUES, FOOTBALL_TEAMS, F1_DRIVERS, NFL_TEAMS } from '../../data/teams';

interface Event {
  id: string;
  title: string;
  sport: string;
  startsAt: string;
}

// Removed Highlight interface - not used anymore

export function Calendar() {
  const { user, updateUser, setUser } = useAuthStore();
  const [events, setEvents] = useState<Event[]>([]);
  // Removed highlights state - not used anymore
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSport, setSelectedSport] = useState<'football' | 'nfl' | 'f1' | null>(null);
  const [showTeamSelector, setShowTeamSelector] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState<number | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  // Local teams state to ensure UI updates work
  const [localTeams, setLocalTeams] = useState<any[]>([]);

  useEffect(() => {
    // Set initial sport from user's selected teams
    if (user?.selectedTeams?.length) {
      setSelectedSport(user.selectedTeams[0].sport);
      setLocalTeams(user.selectedTeams);
    }
  }, [user?.selectedTeams?.length]); // Only depend on the length, not the entire user object

  const loadEvents = useCallback(async () => {
    if (!selectedSport) {
      console.log('🔍 Debug - No selectedSport, skipping loadEvents');
      return;
    }
    
    console.log('🔍 Debug - Starting loadEvents for sport:', selectedSport);
    setIsLoading(true);
    try {
      const teams = localTeams || [];
      const leagues = selectedSport === 'football' 
        ? teams
            .filter(t => t.sport === 'football' && t.leagueId)
            .map(t => t.leagueId!)
        : undefined;

      console.log('🔍 Debug - Making API call to calendar with leagues:', leagues);
      console.log('🔍 Debug - Teams for sport football:', teams.filter(t => t.sport === 'football'));
      const { data } = await calendarApi.getEvents(selectedSport, leagues);
      let allEvents = data || [];
      
      console.log('🔍 Debug - API response received:', allEvents.length, 'events');
      
      // Filter events by ALL selected teams for the current sport
      const sportTeams = teams.filter(t => t.sport === selectedSport);
      
      if (sportTeams.length > 0) {
        const beforeFilter = allEvents.length;
        allEvents = allEvents.filter((event: Event) => 
          sportTeams.some(team => {
            const teamName = team.teamName.toLowerCase();
            const eventTitle = event.title.toLowerCase();
            
            // For F1, also check for last name only (e.g., "Verstappen" instead of "Max Verstappen")
            if (selectedSport === 'f1' && teamName.includes(' ')) {
              const lastName = teamName.split(' ').pop() || '';
              return eventTitle.includes(teamName) || eventTitle.includes(lastName);
            }
            
            return eventTitle.includes(teamName);
          })
        );
        console.log('🔍 Debug - Filtered events:', beforeFilter, '->', allEvents.length, 'for teams:', sportTeams.map(t => t.teamName));
        console.log('🔍 Debug - Sample event titles:', allEvents.slice(0, 3).map(e => e.title));
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
  }, [selectedSport, localTeams]);

  // Removed loadHighlights - not used anymore

  // Manual load function - only called when needed
  const manualLoadEvents = useCallback((teamsOverride?: any[]) => {
    console.log('🔍 Debug - Manual load events triggered');
    if (selectedSport) {
      // Use override teams if provided, otherwise use local teams
      const teamsToUse = teamsOverride || localTeams || [];
      console.log('🔍 Debug - Using teams:', teamsToUse);
      
      // Direct API call with teams
      const leagues = selectedSport === 'football' 
        ? teamsToUse
            .filter(t => t.sport === 'football' && t.leagueId)
            .map(t => t.leagueId!)
        : undefined;
      
      console.log('🔍 Debug - Direct API call with leagues:', leagues);
      calendarApi.getEvents(selectedSport, leagues).then(({ data }) => {
        let allEvents = data || [];
        console.log('🔍 Debug - Direct API response:', allEvents.length, 'events');
        
        // Filter events by ALL selected teams for the current sport
        const sportTeams = teamsToUse.filter(t => t.sport === selectedSport);
        if (sportTeams.length > 0) {
          const beforeFilter = allEvents.length;
          allEvents = allEvents.filter((event: Event) => 
            sportTeams.some(team => {
              const teamName = team.teamName.toLowerCase();
              const eventTitle = event.title.toLowerCase();
              
              // For F1, also check for last name only (e.g., "Verstappen" instead of "Max Verstappen")
              if (selectedSport === 'f1' && teamName.includes(' ')) {
                const lastName = teamName.split(' ').pop() || '';
                return eventTitle.includes(teamName) || eventTitle.includes(lastName);
              }
              
              return eventTitle.includes(teamName);
            })
          );
          console.log('🔍 Debug - Filtered events:', beforeFilter, '->', allEvents.length, 'for teams:', sportTeams.map(t => t.teamName));
          console.log('🔍 Debug - Sample event titles:', allEvents.slice(0, 3).map(e => e.title));
        }
        
        setEvents(allEvents);
        setIsLoading(false);
      }).catch(error => {
        console.error('❌ Direct API call failed:', error);
        setEvents([]);
        setIsLoading(false);
      });
    }
  }, [selectedSport, localTeams]);

  // Removed formatViews - not used anymore

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
        console.log('🔍 Debug - Manual reload after team addition');
        console.log('🔍 Debug - Updated teams:', response.data.selectedTeams || updatedTeams);
        manualLoadEvents(response.data.selectedTeams || updatedTeams);
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

        {/* Removed debug logs that were causing infinite loop */}
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

      {/* Removed Highlights Preview - not used anymore */}
    </div>
  );
}

