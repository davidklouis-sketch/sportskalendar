/**
 * NEWS WIDGET COMPONENT
 * 
 * Compact news widget for homepage integration.
 * Shows a preview of the latest sports news for selected teams.
 */

import { useState, useEffect, useRef, memo } from 'react';
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
}

interface NewsWidgetProps {
  className?: string;
  maxArticles?: number;
  showViewAll?: boolean;
  onViewAll?: () => void;
}

export const NewsWidget = memo(function NewsWidget({ 
  className = '', 
  maxArticles = 3, 
  showViewAll = true,
  onViewAll
}: NewsWidgetProps) {
  const { user } = useAuthStore();
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const lastLoadTime = useRef<number>(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load news function
  const loadNews = async () => {
    if (!user?.selectedTeams || user.selectedTeams.length === 0) {
      return;
    }

    // Prevent too frequent requests (minimum 30 seconds between requests)
    const now = Date.now();
    if (now - lastLoadTime.current < 30000) {
      console.log('[News Widget] Skipping load - too frequent requests');
      return;
    }

    setIsLoading(true);
    lastLoadTime.current = now;

    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('News request timeout')), 8000);
      });
      
      const response = await Promise.race([
        newsApi.getNews(user.selectedTeams),
        timeoutPromise
      ]) as any;
      const newsData = response.data.news || [];
      setNews(newsData.slice(0, maxArticles));
    } catch (error) {
      console.error('Failed to load news widget:', error);
      
      // Handle rate limiting gracefully
      if ((error as any).response?.status === 429) {
        console.log('[News Widget] Rate limit exceeded, will retry later');
      }
      
      setNews([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load news when component mounts or teams change
  useEffect(() => {
    loadNews();
  }, [user?.selectedTeams, maxArticles]);

  // Set up retry mechanism only once
  useEffect(() => {
    if (!user?.selectedTeams || user.selectedTeams.length === 0) {
      return;
    }

    // Clear any existing timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    // Set up retry after 5 minutes if no news
    const scheduleRetry = () => {
      retryTimeoutRef.current = setTimeout(() => {
        setNews(currentNews => {
          if (currentNews.length === 0 && !isLoading) {
            console.log('[News Widget] Retrying news load after timeout...');
            loadNews();
          }
          return currentNews;
        });
        scheduleRetry(); // Schedule next retry
      }, 5 * 60 * 1000); // 5 minutes
    };

    scheduleRetry();

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [user?.selectedTeams, maxArticles]);

  // Format published date
  const formatPublishedDate = (publishedAt: string) => {
    try {
      const date = new Date(publishedAt);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime())) / (1000 * 60 * 60);
      
      if (diffInHours < 1) {
        return 'Gerade eben';
      } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)}h`;
      } else {
        return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
      }
    } catch {
      return 'Heute';
    }
  };

  // Handle article click
  const handleArticleClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Don't show widget if no teams selected or loading failed
  if (!user?.selectedTeams || user.selectedTeams.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <span className="text-lg text-white">📰</span>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Aktuelle News
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Für deine Teams
              </p>
            </div>
          </div>
          
          {showViewAll && onViewAll && (
            <button
              onClick={onViewAll}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
            >
              Alle anzeigen
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Lädt...</span>
          </div>
        )}

        {!isLoading && news.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <span className="text-2xl text-white">📰</span>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Keine aktuellen Nachrichten
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Es sind momentan keine neuen Nachrichten für deine Teams verfügbar.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Die News werden regelmäßig aktualisiert
            </p>
          </div>
        )}

        {!isLoading && news.length > 0 && (
          <div className="space-y-4">
            {news.map((article) => (
              <article
                key={article.id}
                className="group cursor-pointer flex gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-200 hover:shadow-md"
                onClick={() => handleArticleClick(article.url)}
              >
                {/* Article Image */}
                <div className="flex-shrink-0 w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl overflow-hidden">
                  {article.imageUrl ? (
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-2xl text-white">📰</span>
                    </div>
                  )}
                </div>

                {/* Article Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {article.title}
                  </h4>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full font-medium">
                      {article.source}
                    </span>
                    <span>•</span>
                    <span>{formatPublishedDate(article.publishedAt)}</span>
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
