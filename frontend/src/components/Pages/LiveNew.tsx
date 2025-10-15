/**
 * LIVE PAGE COMPONENT (REFACTORED)
 * 
 * Live sports data page with improved structure.
 * Split into smaller, manageable components and hooks.
 */

import { useState, useEffect, memo } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useLiveData } from '../../hooks/useLiveData';
import { LiveSportSelector } from '../Live/LiveSportSelector';
import { LiveEntry } from '../Live/LiveEntry';

export const Live = memo(function Live() {
  const { user } = useAuthStore();
  const { liveData, isLoading, loadLiveData } = useLiveData();
  
  const [selectedSport, setSelectedSport] = useState<'football' | 'nfl' | 'f1' | 'nba' | 'nhl' | 'mlb' | 'tennis' | null>(null);

  // Set initial sport from user's selected teams
  useEffect(() => {
    if (user?.selectedTeams?.length) {
      const firstSport = user.selectedTeams[0].sport as 'football' | 'nfl' | 'f1' | 'nba' | 'nhl' | 'mlb' | 'tennis';
      setSelectedSport(firstSport);
    }
  }, [user]);

  // Load live data when sport changes
  useEffect(() => {
    if (selectedSport) {
      const currentTeam = user?.selectedTeams?.find(t => t.sport === selectedSport);
      loadLiveData(selectedSport, currentTeam?.teamName);
    }
  }, [selectedSport, user?.selectedTeams, loadLiveData]);

  // Get available sports from user's selected teams
  const availableSports = user?.selectedTeams?.map(t => t.sport) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl">
              <span className="text-3xl text-white">🔴</span>
            </div>
            <div className="ml-4">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Live Sports
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Echtzeitdaten von Spielen und Events
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {user?.selectedTeams?.length === 0 ? (
          // No teams selected state
          <div className="text-center py-16">
            <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-red-500 to-orange-600 rounded-3xl flex items-center justify-center">
              <span className="text-6xl text-white">🔴</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Keine Teams ausgewählt
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Wähle deine Lieblingsteams aus, um Live-Daten zu sehen.
            </p>
          </div>
        ) : (
          // Teams selected - show live data
          <>
            {/* Sport Selector */}
            <LiveSportSelector
              selectedSport={selectedSport}
              onSportChange={setSelectedSport}
              availableSports={availableSports}
            />

            {/* Live Data */}
            {selectedSport && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedSport === 'football' ? 'Fußball' : 
                     selectedSport === 'nfl' ? 'NFL' :
                     selectedSport === 'f1' ? 'F1' :
                     selectedSport === 'nba' ? 'NBA' :
                     selectedSport === 'nhl' ? 'NHL' :
                     selectedSport === 'mlb' ? 'MLB' :
                     selectedSport === 'tennis' ? 'Tennis' : selectedSport} Live
                  </h2>
                  {liveData?.entries && (
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {liveData.entries.length} Events
                    </span>
                  )}
                </div>

                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="bg-gray-200 dark:bg-gray-700 rounded-xl p-4">
                          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : liveData?.error ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">⚠️</div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Fehler beim Laden
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {liveData.error}
                    </p>
                  </div>
                ) : !liveData?.entries || liveData.entries.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🔴</div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Keine Live-Events
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Es sind momentan keine Live-Events für {selectedSport} verfügbar.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {liveData.entries.map((entry) => (
                      <LiveEntry
                        key={entry.id}
                        entry={entry}
                        sport={selectedSport}
                      />
                    ))}
                  </div>
                )}

                {/* Live Message */}
                {liveData?.message && (
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <p className="text-blue-700 dark:text-blue-300 text-sm">
                      {liveData.message}
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
});
