/**
 * LIVE SPORT SELECTOR COMPONENT
 * 
 * Handles sport selection for live data.
 * Extracted from Live.tsx for better maintainability.
 */

import { memo } from 'react';

interface LiveSportSelectorProps {
  selectedSport: 'football' | 'nfl' | 'f1' | 'nba' | 'nhl' | 'mlb' | 'tennis' | null;
  onSportChange: (sport: 'football' | 'nfl' | 'f1' | 'nba' | 'nhl' | 'mlb' | 'tennis') => void;
  availableSports: string[];
}

const SPORTS = [
  { key: 'football' as const, label: 'Fußball', icon: '⚽' },
  { key: 'nfl' as const, label: 'NFL', icon: '🏈' },
  { key: 'f1' as const, label: 'F1', icon: '🏎️' },
  { key: 'nba' as const, label: 'NBA', icon: '🏀' },
  { key: 'nhl' as const, label: 'NHL', icon: '🏒' },
  { key: 'mlb' as const, label: 'MLB', icon: '⚾' },
  { key: 'tennis' as const, label: 'Tennis', icon: '🎾' }
] as const;

export const LiveSportSelector = memo(function LiveSportSelector({
  selectedSport,
  onSportChange,
  availableSports
}: LiveSportSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {SPORTS.map((sport) => {
        const isAvailable = availableSports.includes(sport.key);
        const isSelected = selectedSport === sport.key;
        
        return (
          <button
            key={sport.key}
            onClick={() => onSportChange(sport.key)}
            disabled={!isAvailable}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              isSelected
                ? 'bg-blue-600 text-white shadow-lg'
                : isAvailable
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                : 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
            }`}
          >
            <span className="text-lg">{sport.icon}</span>
            <span>{sport.label}</span>
            {!isAvailable && (
              <span className="text-xs opacity-75">(Nicht verfügbar)</span>
            )}
          </button>
        );
      })}
    </div>
  );
});
