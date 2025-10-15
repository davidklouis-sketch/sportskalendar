/**
 * TEAM SELECTOR COMPONENT
 * 
 * Handles team selection for different sports.
 * Extracted from Calendar.tsx for better maintainability.
 */

import { useState, useEffect, memo } from 'react';
import { userApi } from '../../lib/api';
import { FOOTBALL_LEAGUES, FOOTBALL_TEAMS, F1_DRIVERS, NFL_TEAMS, NBA_TEAMS, NHL_TEAMS, MLB_TEAMS } from '../../data/teams';

interface Team {
  sport: string;
  teamName: string;
  teamId?: string;
  leagueId?: number;
}

interface TeamSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onTeamsUpdate: (teams: Team[]) => void;
  currentTeams: Team[];
}

export const TeamSelector = memo(function TeamSelector({
  isOpen,
  onClose,
  onTeamsUpdate,
  currentTeams
}: TeamSelectorProps) {
  const [selectedSportTab, setSelectedSportTab] = useState<'football' | 'nfl' | 'f1' | 'nba' | 'nhl' | 'mlb' | 'tennis'>('football');
  const [selectedTeams, setSelectedTeams] = useState<Team[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize selected teams when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedTeams([...currentTeams]);
    }
  }, [isOpen, currentTeams]);

  const getTeamsForSport = (sport: string): any[] => {
    switch (sport) {
      case 'football':
        return Array.isArray(FOOTBALL_TEAMS) ? FOOTBALL_TEAMS : [];
      case 'f1':
        return Array.isArray(F1_DRIVERS) ? F1_DRIVERS : [];
      case 'nfl':
        return Array.isArray(NFL_TEAMS) ? NFL_TEAMS : [];
      case 'nba':
        return Array.isArray(NBA_TEAMS) ? NBA_TEAMS : [];
      case 'nhl':
        return Array.isArray(NHL_TEAMS) ? NHL_TEAMS : [];
      case 'mlb':
        return Array.isArray(MLB_TEAMS) ? MLB_TEAMS : [];
      case 'tennis':
        return []; // Tennis teams are handled differently
      default:
        return [];
    }
  };

  const getLeaguesForSport = (sport: string) => {
    switch (sport) {
      case 'football':
        return FOOTBALL_LEAGUES;
      default:
        return [];
    }
  };

  const handleTeamToggle = (team: any) => {
    const teamData: Team = {
      sport: selectedSportTab,
      teamName: team.name,
      teamId: team.id,
      leagueId: team.leagueId
    };

    setSelectedTeams(prev => {
      const isSelected = prev.some(t => 
        t.sport === teamData.sport && 
        t.teamName === teamData.teamName
      );

      if (isSelected) {
        return prev.filter(t => 
          !(t.sport === teamData.sport && t.teamName === teamData.teamName)
        );
      } else {
        return [...prev, teamData];
      }
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await userApi.updateTeams(selectedTeams);
      onTeamsUpdate(selectedTeams);
      onClose();
    } catch (error) {
      console.error('Error saving teams:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const isTeamSelected = (teamName: string) => {
    return selectedTeams.some(t => 
      t.sport === selectedSportTab && t.teamName === teamName
    );
  };

  if (!isOpen) return null;

  const teams = getTeamsForSport(selectedSportTab);
  const leagues = getLeaguesForSport(selectedSportTab);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Teams auswählen
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Sport Tabs */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {(['football', 'nfl', 'f1', 'nba', 'nhl', 'mlb', 'tennis'] as const).map((sport) => (
              <button
                key={sport}
                onClick={() => setSelectedSportTab(sport)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedSportTab === sport
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {sport === 'football' ? 'Fußball' : 
                 sport === 'nfl' ? 'NFL' :
                 sport === 'f1' ? 'F1' :
                 sport === 'nba' ? 'NBA' :
                 sport === 'nhl' ? 'NHL' :
                 sport === 'mlb' ? 'MLB' :
                 sport === 'tennis' ? 'Tennis' : sport}
              </button>
            ))}
          </div>
        </div>

        {/* Teams List */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {selectedSportTab === 'football' && leagues.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Ligen
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {leagues.map((league) => (
                  <div key={league.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {league.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {league.country}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {teams.map((team: any) => (
              <button
                key={team.id}
                onClick={() => handleTeamToggle(team)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  isTeamSelected(team.name)
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  {team.badge && (
                    <img
                      src={team.badge}
                      alt={team.name}
                      className="w-8 h-8 object-contain"
                    />
                  )}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {team.name}
                    </h4>
                    {team.shortName && team.shortName !== team.name && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {team.shortName}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {teams.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">
                Keine Teams für {selectedSportTab} verfügbar.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {selectedTeams.length} Teams ausgewählt
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? 'Speichern...' : 'Fertig'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
