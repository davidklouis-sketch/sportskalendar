import { memo } from 'react';
import type { Translations } from '../../lib/i18n';

interface SportTabsProps {
  teams: Array<{ sport: string; teamName: string; teamId?: string; leagueId?: number }>;
  selectedSport: 'football' | 'f1' | 'nfl' | 'nba' | 'nhl' | 'mlb' | 'tennis' | null;
  onSelectSport: (sport: 'football' | 'f1' | 'nfl' | 'nba' | 'nhl' | 'mlb' | 'tennis') => void;
  getSportIcon: (sport: string) => string;
  getSportColor: (sport: string) => string;
  t: (key: keyof Translations) => string;
}

export const SportTabs = memo(function SportTabs({
  teams,
  selectedSport,
  onSelectSport,
  getSportIcon,
  getSportColor,
  t
}: SportTabsProps) {
  if (teams.length === 0) return null;

  const sportsWithTeams = new Set(teams.map(t => t.sport));
  const sports: Array<'football' | 'f1' | 'nfl' | 'nba' | 'nhl' | 'mlb' | 'tennis'> = [
    'football', 'f1', 'nfl', 'nba', 'nhl', 'mlb', 'tennis'
  ];

  const sportNames: Record<string, string> = {
    'football': t('football'),
    'f1': t('formula1'),
    'nfl': t('nfl'),
    'nba': t('nba'),
    'nhl': t('nhl'),
    'mlb': t('mlb'),
    'tennis': t('tennis')
  };

  return (
    <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
      {sports.map((sport) => {
        const hasTeams = sportsWithTeams.has(sport);
        if (!hasTeams) return null;

        return (
          <button
            key={sport}
            onClick={() => onSelectSport(sport)}
            className={`group relative px-6 py-3 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 ${
              selectedSport === sport
                ? `bg-gradient-to-r ${getSportColor(sport)} text-white shadow-xl`
                : 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 shadow-lg backdrop-blur-sm'
            }`}
          >
            <span className="text-lg mr-2">{getSportIcon(sport)}</span>
            {sportNames[sport]}
            {selectedSport === sport && (
              <div className="absolute -inset-1 bg-gradient-to-r from-white/20 to-white/10 rounded-2xl blur opacity-75"></div>
            )}
          </button>
        );
      })}
    </div>
  );
});

