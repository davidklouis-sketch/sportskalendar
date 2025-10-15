/**
 * NEWS PAGE COMPONENT
 * 
 * Full news page showing all sports news for user's selected teams.
 * Provides detailed view with filtering and search capabilities.
 */

import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { newsApi } from '../../lib/api';
// import { t } from '../../lib/i18n'; // Unused for now

interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl: string;
  publishedAt: string;
  source: string;
  author?: string;
  content?: string;
}

interface NewsPageProps {
  className?: string;
}

export function News({ className = '' }: NewsPageProps) {
  const { user } = useAuthStore();
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [sources, setSources] = useState<Array<{ domain: string; name: string }>>([]);

  // Load news and sources when component mounts
  useEffect(() => {
    const loadData = async () => {
      if (!user?.selectedTeams || user.selectedTeams.length === 0) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Load news and sources in parallel
        const [newsResponse, sourcesResponse] = await Promise.all([
          newsApi.getNews(user.selectedTeams),
          newsApi.getSources()
        ]);

        const newsData = newsResponse.data.news || [];
        const sourcesData = sourcesResponse.data.sources || [];
        
        setNews(newsData);
        setSources(sourcesData);
        
        console.log(`[News Page] Loaded ${newsData.length} news articles and ${sourcesData.length} sources`);
      } catch (error) {
        console.error('Failed to load news page data:', error);
        
        if ((error as any).response?.status === 429) {
          setError('Zu viele Anfragen. Bitte versuche es später erneut.');
        } else if ((error as any).response?.status === 401) {
          setError('Anmeldung erforderlich.');
        } else {
          setError('Fehler beim Laden der Nachrichten.');
        }
        
        setNews([]);
        setSources([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user?.selectedTeams]);

  // Filter news based on search term and selected source
  const filteredNews = news.filter(article => {
    const matchesSearch = !searchTerm || 
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSource = selectedSource === 'all' || 
      article.source.toLowerCase().includes(selectedSource.toLowerCase());
    
    return matchesSearch && matchesSource;
  });

  // Format published date
  const formatPublishedDate = (publishedAt: string) => {
    try {
      const date = new Date(publishedAt);
      return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unbekannt';
    }
  };

  // Handle article click
  const handleArticleClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Get source logo URL
  const getSourceLogo = (source: string) => {
    const logos: Record<string, string> = {
      'kicker.de': 'https://derivates.kicker.de/image/upload/c_crop,x_0,y_12,w_3910,h_2198/w_200,q_auto/v1/rkn/kicker-applogos/kicker-logo.png',
      'sport1.de': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Sport1_2021_logo.svg/200px-Sport1_2021_logo.svg.png',
      'sportschau.de': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/ARD_Sportschau_2019_logo.svg/200px-ARD_Sportschau_2019_logo.svg.png',
      'ran.de': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Ran_logo_2017.svg/200px-Ran_logo_2017.svg.png',
      'bild.de': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Bild_Logo.svg/200px-Bild_Logo.svg.png',
      'espn.com': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/ESPN_wordmark.svg/200px-ESPN_wordmark.svg.png',
      'skysport.de': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Sky_Sports_logo_2020.svg/200px-Sky_Sports_logo_2020.svg.png',
      'default': '📰'
    };
    
    const sourceLower = source.toLowerCase();
    for (const [key, logo] of Object.entries(logos)) {
      if (sourceLower.includes(key)) {
        return logo;
      }
    }
    return logos.default;
  };

  // Show message if no teams selected
  if (!user?.selectedTeams || user.selectedTeams.length === 0) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pt-20 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">
            <div className="text-8xl mb-6">📰</div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Sport-Nachrichten
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Wähle deine Lieblingsteams aus, um personalisierte Sport-Nachrichten zu erhalten.
            </p>
            <button 
              onClick={() => {
                // Navigate to settings page
                console.log('Navigate to settings');
              }}
              className="btn btn-primary btn-lg"
            >
              Teams auswählen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pt-20 ${className}`}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center mb-6">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl">
              <span className="text-3xl text-white">📰</span>
            </div>
            <div className="ml-4">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Sport-Nachrichten
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Aktuelle News für deine {user.selectedTeams.length} ausgewählten Team{user.selectedTeams.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Nachrichten durchsuchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Source Filter */}
            <div className="sm:w-48">
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Alle Quellen</option>
                {sources.map((source) => (
                  <option key={source.domain} value={source.domain}>
                    {source.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-4 text-lg text-gray-600 dark:text-gray-400">Lade Nachrichten...</span>
          </div>
        )}

        {error && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Fehler beim Laden
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="btn btn-primary"
            >
              Erneut versuchen
            </button>
          </div>
        )}

        {!isLoading && !error && filteredNews.length === 0 && (
          <div className="text-center py-16">
            <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center">
              <span className="text-6xl text-white">
                {searchTerm || selectedSource !== 'all' ? '🔍' : '📰'}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {searchTerm || selectedSource !== 'all' ? 'Keine Ergebnisse' : 'Keine aktuellen Nachrichten'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {searchTerm || selectedSource !== 'all' 
                ? 'Versuche andere Suchbegriffe oder Filter.'
                : 'Es sind momentan keine neuen Nachrichten für deine Teams verfügbar.'
              }
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 max-w-md mx-auto">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                💡 {searchTerm || selectedSource !== 'all' 
                  ? 'Verwende allgemeinere Suchbegriffe oder entferne Filter.'
                  : 'Die News werden regelmäßig aktualisiert. Versuche es später erneut.'
                }
              </p>
            </div>
          </div>
        )}

        {!isLoading && !error && filteredNews.length > 0 && (
          <>
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-400">
                {filteredNews.length} von {news.length} Artikeln angezeigt
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNews.map((article) => (
                <article
                  key={article.id}
                  className="group cursor-pointer bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-500"
                  onClick={() => handleArticleClick(article.url)}
                >
                  {/* Article Image */}
                  <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 relative overflow-hidden">
                    {article.imageUrl ? (
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            const fallback = document.createElement('div');
                            fallback.className = 'w-full h-full flex items-center justify-center';
                            fallback.innerHTML = '<span class="text-6xl text-white">📰</span>';
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-6xl text-white">📰</span>
                      </div>
                    )}
                    
                    {/* Source logo badge */}
                    <div className="absolute top-3 left-3 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg flex items-center gap-2">
                      {getSourceLogo(article.source) !== '📰' ? (
                        <img 
                          src={getSourceLogo(article.source)} 
                          alt={article.source}
                          className="h-4 object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              const fallback = document.createElement('span');
                              fallback.textContent = '📰';
                              parent.appendChild(fallback);
                            }
                          }}
                        />
                      ) : (
                        <span className="text-sm">📰</span>
                      )}
                      <span className="text-xs font-medium text-gray-900 dark:text-white">{article.source}</span>
                    </div>
                  </div>

                  {/* Article Content */}
                  <div className="p-6">
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg line-clamp-2 mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {article.title}
                    </h3>
                    
                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 mb-4">
                      {article.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>{formatPublishedDate(article.publishedAt)}</span>
                      {article.author && (
                        <span className="truncate max-w-[150px]">
                          {article.author}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
