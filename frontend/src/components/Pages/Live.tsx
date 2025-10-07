import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { liveApi } from '../../lib/api';

interface LiveEntry {
  position: number;
  name: string;
  info?: string;
  meta?: string;
  score?: string;
  minute?: number;
  league?: string;
  lap?: number;
  totalLaps?: number;
}

interface LiveData {
  entries: LiveEntry[];
  message?: string;
  error?: string;
  nextEvent?: {
    name: string;
    date: string;
    teams?: string;
    circuit?: string;
  };
}

export function Live() {
  const { user } = useAuthStore();
  const [liveData, setLiveData] = useState<LiveData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState<'football' | 'nfl' | 'f1' | null>(null);

  useEffect(() => {
    // Set initial sport from user's selected teams
    if (user?.selectedTeams?.length) {
      setSelectedSport(user.selectedTeams[0].sport);
    }
  }, [user]);

  useEffect(() => {
    if (selectedSport) {
      loadLiveData();
      // Auto-refresh every 30 seconds
      const interval = setInterval(loadLiveData, 30000);
      return () => clearInterval(interval);
    }
  }, [selectedSport]);

  const loadLiveData = async () => {
    if (!selectedSport) return;

    setIsLoading(true);
    try {
      let response;
      if (selectedSport === 'f1') {
        response = await liveApi.getF1();
      } else if (selectedSport === 'nfl') {
        response = await liveApi.getNFL();
      } else {
        response = await liveApi.getSoccer();
      }
      
      let liveDataResult = response.data;
      
      // Filter entries by selected team name
      const currentTeam = user?.selectedTeams?.find(t => t.sport === selectedSport);
      if (currentTeam?.teamName && liveDataResult.entries) {
        liveDataResult.entries = liveDataResult.entries.filter(entry => 
          entry.name.toLowerCase().includes(currentTeam.teamName.toLowerCase())
        );
      }
      
      setLiveData(liveDataResult);
    } catch (error) {
      console.error('Failed to load live data:', error);
      setLiveData({ entries: [], error: 'Fehler beim Laden der Live-Daten' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user?.selectedTeams?.length) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="card p-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Keine Teams ausgewählt</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Wähle zuerst ein Team im Kalender aus, um Live-Daten zu sehen.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            Zum Kalender
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Sport Selector */}
      {user.selectedTeams.length > 1 && (
        <div className="card p-4 mb-6">
          <label className="block text-sm font-medium mb-2">Team auswählen</label>
          <select
            value={selectedSport || ''}
            onChange={(e) => setSelectedSport(e.target.value as any)}
            className="input"
          >
            {user.selectedTeams.map((team, index) => (
              <option key={index} value={team.sport}>
                {team.teamName} ({team.sport === 'football' ? '⚽' : team.sport === 'nfl' ? '🏈' : '🏎️'})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Live Data */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span className="inline-block w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              Live
            </h2>
            {user?.selectedTeams?.find(t => t.sport === selectedSport) && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Team: <span className="font-semibold">
                  {user.selectedTeams.find(t => t.sport === selectedSport)?.teamName}
                </span>
              </p>
            )}
          </div>
          <button
            onClick={loadLiveData}
            disabled={isLoading}
            className="btn btn-secondary text-sm"
          >
            {isLoading ? 'Aktualisiert...' : '🔄 Aktualisieren'}
          </button>
        </div>

        {isLoading && !liveData ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">Lade Live-Daten...</p>
          </div>
        ) : liveData?.error ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">{liveData.error}</p>
          </div>
        ) : liveData?.message ? (
          <div className="space-y-4">
            <div className="p-4 bg-blue-100 dark:bg-blue-900/30 border border-blue-400 dark:border-blue-700 text-blue-800 dark:text-blue-200 rounded-lg">
              {liveData.message}
            </div>
            {liveData.nextEvent && (
              <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Nächstes Event</h3>
                <p className="text-xl font-bold mb-1">{liveData.nextEvent.name}</p>
                {liveData.nextEvent.teams && (
                  <p className="text-gray-700 dark:text-gray-300 mb-1">{liveData.nextEvent.teams}</p>
                )}
                {liveData.nextEvent.circuit && (
                  <p className="text-gray-700 dark:text-gray-300 mb-1">{liveData.nextEvent.circuit}</p>
                )}
                <p className="text-gray-500 dark:text-gray-400">{liveData.nextEvent.date}</p>
              </div>
            )}
          </div>
        ) : liveData?.entries && liveData.entries.length > 0 ? (
          <div className="space-y-2">
            {liveData.entries.map((entry) => (
              <div
                key={entry.position}
                className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                    <span className="text-xl font-bold text-primary-700 dark:text-primary-300">
                      {entry.position}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{entry.name}</h3>
                    {entry.info && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{entry.info}</p>
                    )}
                    {entry.meta && (
                      <p className="text-sm text-gray-500 dark:text-gray-500">{entry.meta}</p>
                    )}
                  </div>
                  {entry.score && (
                    <div className="flex-shrink-0 text-2xl font-bold text-primary-600 dark:text-primary-400">
                      {entry.score}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              Keine Live-Daten verfügbar
            </p>
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
          Automatische Aktualisierung alle 30 Sekunden
        </div>
      </div>
    </div>
  );
}

