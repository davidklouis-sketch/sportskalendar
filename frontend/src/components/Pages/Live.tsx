import { useState, useEffect, useCallback } from 'react';
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
  const [selectedSport, setSelectedSport] = useState<'football' | 'nfl' | 'f1' | 'nba' | 'nhl' | 'mlb' | 'tennis' | null>(null);

  const loadLiveData = useCallback(async () => {
    if (!selectedSport) return;

    setIsLoading(true);
    try {
      let response;
      if (selectedSport === 'f1') {
        response = await liveApi.getF1();
      } else if (selectedSport === 'nfl') {
        response = await liveApi.getNFL();
      } else if (selectedSport === 'nba') {
        response = await liveApi.getNBA();
      } else if (selectedSport === 'nhl') {
        response = await liveApi.getNHL();
      } else if (selectedSport === 'mlb') {
        response = await liveApi.getMLB();
      } else if (selectedSport === 'tennis') {
        response = await liveApi.getTennis();
      } else {
        response = await liveApi.getSoccer();
      }
      
      const liveDataResult = response.data;
      
      // Filter entries by selected team name
      const currentTeam = user?.selectedTeams?.find(t => t.sport === selectedSport);
      if (currentTeam?.teamName && liveDataResult.entries) {
        liveDataResult.entries = liveDataResult.entries.filter((entry: LiveEntry) => 
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
  }, [selectedSport, user?.selectedTeams]);

  useEffect(() => {
    // Set initial sport from user's selected teams
    if (user?.selectedTeams?.length) {
      setSelectedSport(user.selectedTeams[0].sport);
    }
  }, [user]);

  useEffect(() => {
    if (selectedSport) {
      loadLiveData();
      // Auto-refresh every 10 minutes (further reduced to avoid rate limiting)
      const interval = setInterval(loadLiveData, 600000);
      return () => clearInterval(interval);
    }
  }, [selectedSport]); // Entfernt loadLiveData aus Dependencies um Infinite Loop zu vermeiden

  if (!user?.selectedTeams?.length) {
    return (
      <div className="min-h-screen hero-gradient pt-24 flex items-center justify-center">
        <div className="max-w-2xl mx-auto px-4">
          <div className="card p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold mb-4 text-white">Keine Teams ausgewählt</h2>
            <p className="text-dark-300 mb-8 text-lg">
              Wähle zuerst ein Team im Kalender aus, um Live-Daten zu sehen.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary text-lg px-8 py-4"
            >
              Zum Kalender
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen hero-gradient pt-24">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="relative group mx-auto mb-6">
            <div className="w-16 h-16 bg-red-500/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto shadow-xl border border-red-400/30">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold heading-sport mb-4">
            🔴 LIVE
          </h1>
          <p className="text-xl text-cyan-400 mb-8">
            Verfolge deine Teams in Echtzeit
          </p>
        </div>

        {/* Sport Selector */}
        {user.selectedTeams.length > 1 && (
          <div className="card-sport p-4 mb-6">
            <label className="block text-sm font-medium text-cyan-400 mb-2">Team auswählen</label>
            <select
              value={selectedSport || ''}
              onChange={(e) => setSelectedSport(e.target.value as 'football' | 'nfl' | 'f1' | 'nba' | 'nhl' | 'mlb' | 'tennis')}
              className="input"
            >
              {user.selectedTeams.map((team, index) => (
                <option key={index} value={team.sport}>
                  {team.teamName} ({team.sport === 'football' ? '⚽' : team.sport === 'nfl' ? '🏈' : team.sport === 'f1' ? '🏎️' : team.sport === 'nba' ? '🏀' : team.sport === 'nhl' ? '🏒' : team.sport === 'mlb' ? '⚾' : team.sport === 'tennis' ? '🎾' : '🏆'})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Live Data */}
        <div className="card-sport p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <span className="inline-block w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                Live
              </h2>
              {user?.selectedTeams?.find(t => t.sport === selectedSport) && (
                <p className="text-sm text-cyan-400 mt-1">
                  Team: <span className="font-semibold text-lime-400">
                    {user.selectedTeams.find(t => t.sport === selectedSport)?.teamName}
                  </span>
                </p>
              )}
            </div>
            <button
              onClick={loadLiveData}
              disabled={isLoading}
              className="btn btn-accent text-sm"
            >
              {isLoading ? 'Aktualisiert...' : '🔄 Aktualisieren'}
            </button>
          </div>

        {isLoading && !liveData ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
            <p className="mt-4 text-dark-300">Lade Live-Daten...</p>
          </div>
        ) : liveData?.error ? (
          <div className="text-center py-12">
            <p className="text-red-400">{liveData.error}</p>
          </div>
        ) : liveData?.message ? (
          <div className="space-y-4">
            <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-lg">
              {liveData.message}
            </div>
            {liveData.nextEvent && (
              <div className="p-6 bg-dark-700/50 rounded-lg">
                <h3 className="font-semibold text-lg mb-2 text-white">Nächstes Event</h3>
                <p className="text-xl font-bold mb-1 text-lime-400">{liveData.nextEvent.name}</p>
                {liveData.nextEvent.teams && (
                  <p className="text-dark-300 mb-1">{liveData.nextEvent.teams}</p>
                )}
                {liveData.nextEvent.circuit && (
                  <p className="text-dark-300 mb-1">{liveData.nextEvent.circuit}</p>
                )}
                <p className="text-dark-400">{liveData.nextEvent.date}</p>
              </div>
            )}
          </div>
        ) : liveData?.entries && liveData.entries.length > 0 ? (
          <div className="space-y-2">
            {liveData.entries.map((entry) => (
              <div
                key={entry.position}
                className="p-4 bg-dark-700/50 rounded-lg hover:bg-dark-600/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-xl font-bold text-cyan-400">
                      {entry.position}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-white">{entry.name}</h3>
                    {entry.info && (
                      <p className="text-sm text-dark-300">{entry.info}</p>
                    )}
                    {entry.meta && (
                      <p className="text-sm text-dark-400">{entry.meta}</p>
                    )}
                  </div>
                  {entry.score && (
                    <div className="flex-shrink-0 text-2xl font-bold text-lime-400">
                      {entry.score}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-dark-300">
              Keine Live-Daten verfügbar
            </p>
          </div>
        )}

        <div className="mt-4 text-xs text-dark-400 text-center">
          Automatische Aktualisierung alle 30 Sekunden
        </div>
      </div>
      </div>
    </div>
  );
}

