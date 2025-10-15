/**
 * NEWS SECTION COMPONENT
 * 
 * Displays sports news filtered by user's selected teams.
 * Integrates with NewsAPI to provide real-time sports news.
 */

import { useState, useEffect, memo } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { newsApi } from '../../lib/api';

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

interface NewsSectionProps {
  className?: string;
  maxArticles?: number;
  showHeader?: boolean;
}

export const NewsSection = memo(function NewsSection({ 
  className = '', 
  maxArticles = 6, 
  showHeader = true 
}: NewsSectionProps) {
  const { user } = useAuthStore();
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load news when component mounts or user teams change
  useEffect(() => {
    const loadNews = async () => {
      if (!user?.selectedTeams || user.selectedTeams.length === 0) {
        setNews([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await newsApi.getNews(user.selectedTeams);
        const newsData = response.data.news || [];
        
        // Limit articles based on maxArticles prop
        const limitedNews = newsData.slice(0, maxArticles);
        setNews(limitedNews);
        
        console.log(`[News] Loaded ${limitedNews.length} news articles for ${user.selectedTeams.length} teams`);
      } catch (error) {
        console.error('Failed to load news:', error);
        
        // Handle different error types
        if ((error as any).response?.status === 429) {
          setError('Zu viele Anfragen. Bitte versuche es später erneut.');
        } else if ((error as any).response?.status === 401) {
          setError('Anmeldung erforderlich.');
        } else {
          setError('Fehler beim Laden der Nachrichten.');
        }
        
        setNews([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadNews();
  }, [user?.selectedTeams, maxArticles]);

  // Format published date
  const formatPublishedDate = (publishedAt: string) => {
    try {
      const date = new Date(publishedAt);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime())) / (1000 * 60 * 60);
      
      if (diffInHours < 1) {
        return 'Vor wenigen Minuten';
      } else if (diffInHours < 24) {
        return `Vor ${Math.floor(diffInHours)} Stunden`;
      } else {
        return date.toLocaleDateString('de-DE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      }
    } catch {
      return 'Heute';
    }
  };

  // Handle article click - open in new tab
  const handleArticleClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Show message if no teams selected
  if (!user?.selectedTeams || user.selectedTeams.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        {showHeader && (
          <div className="flex items-center mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <span className="text-2xl">📰</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white ml-3">
              Sport-Nachrichten
            </h3>
          </div>
        )}
        
        <div className="text-center py-8">
          <div className="text-6xl mb-4">📰</div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Keine Teams ausgewählt
          </h4>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Wähle deine Lieblingsteams in den Einstellungen aus, um personalisierte Sport-Nachrichten zu erhalten.
          </p>
          <button 
            onClick={() => {
              // Navigate to settings page - this would need to be passed as prop or use router
              console.log('Navigate to settings');
            }}
            className="btn btn-primary"
          >
            Teams auswählen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}>
      {showHeader && (
        <div className="p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
                <span className="text-2xl text-white">📰</span>
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Sport-Nachrichten
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Aktuelle News für deine {user.selectedTeams.length} ausgewählten Team{user.selectedTeams.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            {!isLoading && news.length > 0 && (
              <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
                {news.length} Artikel
              </div>
            )}
          </div>
        </div>
      )}

      <div className="p-6 pt-4">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Lade Nachrichten...</span>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">⚠️</div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Fehler beim Laden
            </h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="btn btn-secondary"
            >
              Erneut versuchen
            </button>
          </div>
        )}

        {!isLoading && !error && news.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center">
              <span className="text-4xl text-white">📰</span>
            </div>
            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              Keine aktuellen Nachrichten
            </h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
              Es sind momentan keine neuen Nachrichten für deine Teams verfügbar.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 max-w-md mx-auto">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                💡 Die News werden regelmäßig aktualisiert. Versuche es in ein paar Minuten erneut.
              </p>
            </div>
          </div>
        )}

        {!isLoading && !error && news.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map((article) => (
              <article
                key={article.id}
                className="group cursor-pointer bg-white dark:bg-gray-700/50 rounded-2xl border border-gray-200 dark:border-gray-600 overflow-hidden hover:shadow-xl transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-500 hover:-translate-y-1"
                onClick={() => handleArticleClick(article.url)}
              >
                {/* Article Image */}
                <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 relative overflow-hidden">
                  {article.imageUrl ? (
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        // Fallback to placeholder if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-5xl text-white">📰</span>
                    </div>
                  )}
                  
                  {/* Source badge */}
                  <div className="absolute top-3 right-3 bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-white text-xs px-3 py-1 rounded-full font-medium">
                    {article.source}
                  </div>
                  
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                {/* Article Content */}
                <div className="p-5">
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-2 mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {article.title}
                  </h4>
                  
                  <p className="text-gray-600 dark:text-gray-400 text-xs line-clamp-3 mb-4">
                    {article.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span className="bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded-full">
                      {formatPublishedDate(article.publishedAt)}
                    </span>
                    {article.author && (
                      <span className="truncate max-w-[120px] text-gray-400 dark:text-gray-500">
                        {article.author}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
