import { useState, useEffect, useCallback } from 'react';
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

  const loadHighlights = useCallback(async () => {
    if (!selectedSport) return;

    setIsLoading(true);
    try {
      const sportMapping: Record<string, string> = {
        football: 'Fußball',
        nfl: 'NFL',
        f1: 'F1',
      };

      const currentTeam = user?.selectedTeams?.find(t => t.sport === selectedSport);
      console.log(`[Highlights Frontend] Loading highlights for ${selectedSport} (${sportMapping[selectedSport]})${currentTeam ? ` for team "${currentTeam.teamName}"` : ''}`);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 15000); // 15 second timeout
      });
      
      const fetchPromise = highlightsApi.getHighlights(sportMapping[selectedSport], currentTeam?.teamName);
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      let allHighlights = response.data.items || [];
      console.log(`[Highlights Frontend] Got ${allHighlights.length} highlights from API`);
      
      // Additional frontend filtering if needed (backend should handle most filtering now)
      if (currentTeam?.teamName && allHighlights.length > 0) {
        const beforeFilter = allHighlights.length;
        allHighlights = allHighlights.filter((highlight: Highlight) => {
          const searchText = (highlight.title + ' ' + (highlight.description || '')).toLowerCase();
          
          // Use the same team variations as backend
          const teamVariations = getTeamVariations(currentTeam.teamName);
          return teamVariations.some(variation => searchText.includes(variation));
        });
        console.log(`[Highlights Frontend] Additional filtering: ${beforeFilter} -> ${allHighlights.length} highlights for team "${currentTeam.teamName}"`);
      }
      
      setHighlights(allHighlights);
    } catch (error) {
      console.error('Failed to load highlights:', error);
      setHighlights([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSport, user]);

  // Get team name variations for better matching (same as backend)
  const getTeamVariations = (teamName: string): string[] => {
    const normalized = teamName.toLowerCase().trim();
    const variations: string[] = [normalized];
    
    const mappings: Record<string, string[]> = {
      'bayern munich': ['fc bayern', 'bayern münchen', 'fc bayern münchen', 'bayern', 'fc bayern münchen'],
      'borussia dortmund': ['bvb', 'borussia', 'bvb dortmund', 'dortmund'],
      'bayer leverkusen': ['bayer 04', 'leverkusen', 'bayer', 'werkself'],
      'max verstappen': ['verstappen', 'max'],
      'lewis hamilton': ['hamilton', 'lewis'],
      'charles leclerc': ['leclerc', 'charles'],
      'lando norris': ['norris', 'lando']
    };
    
    for (const [key, values] of Object.entries(mappings)) {
      if (normalized.includes(key)) {
        variations.push(...values);
        break;
      }
    }
    
    return variations;
  };

  useEffect(() => {
    if (selectedSport) {
      loadHighlights();
    }
  }, [selectedSport]); // Remove loadHighlights from dependencies to prevent loop

  const formatViews = (views?: number) => {
    if (!views) return '';
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  if (!user?.selectedTeams?.length) {
    return (
      <div className="min-h-screen hero-gradient pt-24">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="card p-12 text-center">
            <h2 className="text-2xl font-bold mb-4 text-white">Keine Teams ausgewählt</h2>
            <p className="text-dark-300 mb-6">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen hero-gradient pt-24">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="relative group mx-auto mb-6">
            <div className="w-16 h-16 bg-orange-500/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto shadow-xl border border-orange-400/30">
              <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold heading-sport mb-4">
            📺 HIGHLIGHTS
          </h1>
          <p className="text-xl text-cyan-400 mb-8">
            Die besten Momente deiner Teams
          </p>
        </div>

        {/* Sport Selector */}
        {user.selectedTeams.length > 1 && (
          <div className="card-sport p-4 mb-6">
            <label className="block text-sm font-medium text-cyan-400 mb-2">Team auswählen</label>
            <select
              value={selectedSport || ''}
              onChange={(e) => setSelectedSport(e.target.value as 'football' | 'nfl' | 'f1')}
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
        <div className="card-sport p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2 text-white">Highlights & News</h2>
            {user?.selectedTeams?.find(t => t.sport === selectedSport) && (
              <p className="text-sm text-cyan-400">
                Highlights für: <span className="font-semibold text-lime-400">
                  {user.selectedTeams.find(t => t.sport === selectedSport)?.teamName}
                </span>
              </p>
            )}
          </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            <p className="mt-4 text-dark-300">Lade Highlights...</p>
          </div>
        ) : highlights.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-dark-300">
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
                className="group card p-0 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                {/* Thumbnail */}
                {highlight.thumbnail ? (
                  <div className="relative aspect-video bg-dark-700">
                    <img
                      src={highlight.thumbnail}
                      alt={highlight.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {highlight.duration && (
                      <div className="absolute bottom-2 right-2 px-2 py-1 bg-dark-900/80 text-white text-xs rounded">
                        {highlight.duration}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-video bg-sport-gradient flex items-center justify-center">
                    <svg className="w-16 h-16 text-white opacity-50" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                    </svg>
                  </div>
                )}

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2 text-white group-hover:text-cyan-400 transition-colors">
                    {highlight.title}
                  </h3>

                  {highlight.description && (
                    <p className="text-sm text-dark-300 mb-3 line-clamp-2">
                      {highlight.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-dark-400">
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
    </div>
  );
}

