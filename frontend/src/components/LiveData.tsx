import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { liveApi } from '../lib/api';

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

interface LiveDataProps {
  className?: string;
}

export function LiveData({ className = '' }: LiveDataProps) {
  const { user } = useAuthStore();
  const [liveData, setLiveData] = useState<LiveData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLiveData, setHasLiveData] = useState(false);

  const loadLiveData = useCallback(async () => {
    if (!user?.selectedTeams?.length) {
      setHasLiveData(false);
      return;
    }

    setIsLoading(true);
    try {
      const allLiveData: LiveData[] = [];
      
      // Check each selected team for live data
      for (const team of user.selectedTeams) {
        try {
          let response;
          if (team.sport === 'f1') {
            response = await liveApi.getF1();
          } else if (team.sport === 'nfl') {
            response = await liveApi.getNFL();
          } else if (team.sport === 'football') {
            response = await liveApi.getSoccer();
          } else {
            continue;
          }
          
          const teamLiveData = response.data;
          
          // Filter entries by team name
          if (teamLiveData.entries) {
            const filteredEntries = teamLiveData.entries.filter((entry: LiveEntry) => 
              entry.name.toLowerCase().includes(team.teamName.toLowerCase())
            );
            
            if (filteredEntries.length > 0) {
              allLiveData.push({
                ...teamLiveData,
                entries: filteredEntries
              });
            }
          }
        } catch (error) {
          console.error(`Failed to load live data for ${team.teamName}:`, error);
          // Don't fail completely if one team's live data fails
          // Continue with other teams
        }
      }
      
      // Combine all live data
      if (allLiveData.length > 0) {
        const combinedEntries = allLiveData.flatMap(data => data.entries);
        setLiveData({
          entries: combinedEntries,
          message: allLiveData[0].message,
          nextEvent: allLiveData[0].nextEvent
        });
        setHasLiveData(true);
      } else {
        setHasLiveData(false);
        setLiveData(null);
      }
    } catch (error) {
      console.error('Failed to load live data:', error);
      setHasLiveData(false);
      setLiveData(null);
    } finally {
      setIsLoading(false);
    }
  }, [user?.selectedTeams]);

  useEffect(() => {
    loadLiveData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadLiveData, 30000);
    return () => clearInterval(interval);
  }, [loadLiveData]);

  // Don't render if no live data or no teams selected
  if (!hasLiveData || !user?.selectedTeams?.length) {
    return null;
  }

  return (
    <div className={`bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-l-4 border-red-500 ${className}`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
            <h3 className="text-lg font-bold text-red-800 dark:text-red-200">
              🔴 LIVE
            </h3>
          </div>
          <button
            onClick={loadLiveData}
            disabled={isLoading}
            className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 transition-colors"
          >
            {isLoading ? 'Aktualisiert...' : '🔄'}
          </button>
        </div>

        {liveData?.entries && liveData.entries.length > 0 ? (
          <div className="space-y-2">
            {liveData.entries.slice(0, 3).map((entry, index) => (
              <div
                key={`${entry.position}-${index}`}
                className="flex items-center gap-3 p-3 bg-white/70 dark:bg-gray-800/70 rounded-lg backdrop-blur-sm"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-red-700 dark:text-red-300">
                    {entry.position}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-red-900 dark:text-red-100 truncate">
                    {entry.name}
                  </h4>
                  {entry.info && (
                    <p className="text-xs text-red-700 dark:text-red-300 truncate">
                      {entry.info}
                    </p>
                  )}
                  {entry.meta && (
                    <p className="text-xs text-red-600 dark:text-red-400 truncate">
                      {entry.meta}
                    </p>
                  )}
                </div>
                {entry.score && (
                  <div className="flex-shrink-0 text-lg font-bold text-red-800 dark:text-red-200">
                    {entry.score}
                  </div>
                )}
                {entry.minute && (
                  <div className="flex-shrink-0 text-sm font-medium text-red-700 dark:text-red-300">
                    {entry.minute}'
                  </div>
                )}
              </div>
            ))}
            {liveData.entries.length > 3 && (
              <p className="text-xs text-red-600 dark:text-red-400 text-center">
                +{liveData.entries.length - 3} weitere Live-Events
              </p>
            )}
          </div>
        ) : liveData?.message ? (
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 border border-blue-400 dark:border-blue-700 text-blue-800 dark:text-blue-200 rounded-lg">
            {liveData.message}
          </div>
        ) : null}

        <div className="mt-2 text-xs text-red-600 dark:text-red-400 text-center">
          Automatische Aktualisierung alle 30 Sekunden
        </div>
      </div>
    </div>
  );
}
