import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { highlightsApi } from '../../lib/api';

interface Highlight {
  id: string;
  title: string;
  url: string;
  sport: string;
  description?: string;
  createdAt: string;
  thumbnail?: string;
  duration?: string;
  views?: number;
}

export function Highlights() {
  const { user } = useAuthStore();
  const [highlights, setHighlights] = useState<Highlight[]>([]);
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
      loadHighlights();
    }
  }, [selectedSport]);

  const loadHighlights = async () => {
    if (!selectedSport) return;

    setIsLoading(true);
    try {
      const sportMapping: Record<string, string> = {
        football: 'Fußball',
        nfl: 'NFL',
        f1: 'F1',
      };

      const { data } = await highlightsApi.getHighlights(sportMapping[selectedSport]);
      let allHighlights = data.items || [];
      
      // Filter highlights by selected team name
      const currentTeam = user?.selectedTeams?.find(t => t.sport === selectedSport);
      if (currentTeam?.teamName) {
        allHighlights = allHighlights.filter((highlight: Highlight) => {
          const searchText = (highlight.title + ' ' + (highlight.description || '')).toLowerCase();
          return searchText.includes(currentTeam.teamName.toLowerCase());
        });
      }
      
      setHighlights(allHighlights);
    } catch (error) {
      console.error('Failed to load highlights:', error);
      setHighlights([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatViews = (views?: number) => {
    if (!views) return '';
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  if (!user?.selectedTeams?.length) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="card p-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Keine Teams ausgewählt</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Wähle zuerst ein Team im Kalender aus, um Highlights zu sehen.
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

      {/* Highlights Grid */}
      <div className="card p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Highlights & News</h2>
          {user?.selectedTeams?.find(t => t.sport === selectedSport) && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Highlights für: <span className="font-semibold">
                {user.selectedTeams.find(t => t.sport === selectedSport)?.teamName}
              </span>
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">Lade Highlights...</p>
          </div>
        ) : highlights.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              Keine Highlights verfügbar
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {highlights.map((highlight) => (
              <a
                key={highlight.id}
                href={highlight.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group card p-0 overflow-hidden hover:shadow-lg transition-all"
              >
                {/* Thumbnail */}
                {highlight.thumbnail ? (
                  <div className="relative aspect-video bg-gray-200 dark:bg-gray-700">
                    <img
                      src={highlight.thumbnail}
                      alt={highlight.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {highlight.duration && (
                      <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 text-white text-xs rounded">
                        {highlight.duration}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                    <svg className="w-16 h-16 text-white opacity-50" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                    </svg>
                  </div>
                )}

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {highlight.title}
                  </h3>

                  {highlight.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {highlight.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{new Date(highlight.createdAt).toLocaleDateString('de-DE')}</span>
                    {highlight.views && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                        {formatViews(highlight.views)}
                      </span>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

