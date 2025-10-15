/**
 * SPORT TABS COMPONENT
 * 
 * Handles sport tab navigation and display.
 * Extracted from Calendar.tsx for better maintainability.
 */

import { memo } from 'react';

interface SportTabsProps {
  selectedSport: 'football' | 'nfl' | 'f1' | 'nba' | 'nhl' | 'mlb' | 'tennis' | null;
  onSportChange: (sport: 'football' | 'nfl' | 'f1' | 'nba' | 'nhl' | 'mlb' | 'tennis') => void;
  eventCounts: {
    football: number;
    nfl: number;
    f1: number;
    nba: number;
    nhl: number;
    mlb: number;
    tennis: number;
  };
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

export const SportTabs = memo(function SportTabs({
  selectedSport,
  onSportChange,
  eventCounts
}: SportTabsProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {SPORTS.map((sport) => {
        const isSelected = selectedSport === sport.key;
        const eventCount = eventCounts[sport.key];
        
        return (
          <button
            key={sport.key}
            onClick={() => onSportChange(sport.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              isSelected
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <span className="text-lg">{sport.icon}</span>
            <span>{sport.label}</span>
            {eventCount > 0 && (
              <span className={`px-2 py-1 text-xs rounded-full ${
                isSelected
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
              }`}>
                {eventCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
});
