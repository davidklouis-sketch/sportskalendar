/**
 * LIVE ENTRY COMPONENT
 * 
 * Displays a single live event entry.
 * Extracted from Live.tsx for better maintainability.
 */

import { memo } from 'react';

interface LiveEntry {
  id: string;
  name: string;
  status: string;
  score?: string;
  time?: string;
  teams?: string;
  circuit?: string;
}

interface LiveEntryProps {
  entry: LiveEntry;
  sport: string;
}

export const LiveEntry = memo(function LiveEntry({ entry, sport }: LiveEntryProps) {
  const getSportIcon = (sportName: string) => {
    switch (sportName) {
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'live':
      case 'ongoing':
        return 'text-red-600 dark:text-red-400';
      case 'finished':
      case 'completed':
        return 'text-gray-600 dark:text-gray-400';
      case 'upcoming':
      case 'scheduled':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{getSportIcon(sport)}</div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {entry.name}
            </h3>
            {entry.teams && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {entry.teams}
              </p>
            )}
            {entry.circuit && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {entry.circuit}
              </p>
            )}
          </div>
        </div>
        
        <div className="text-right">
          {entry.score && (
            <div className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              {entry.score}
            </div>
          )}
          {entry.time && (
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              {entry.time}
            </div>
          )}
          <div className={`text-sm font-medium ${getStatusColor(entry.status)}`}>
            {entry.status}
          </div>
        </div>
      </div>
    </div>
  );
});
