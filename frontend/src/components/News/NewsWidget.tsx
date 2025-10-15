/**
 * NEWS WIDGET COMPONENT
 * 
 * Compact news widget for homepage integration.
 * Shows a preview of the latest sports news for selected teams.
 */

import { useState, useEffect } from 'react';
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

export function NewsWidget({ 
  className = '', 
  maxArticles = 3, 
  showViewAll = true,
  onViewAll
}: NewsWidgetProps) {
  const { user } = useAuthStore();
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load news when component mounts
  useEffect(() => {
    const loadNews = async () => {
      if (!user?.selectedTeams || user.selectedTeams.length === 0) {
        return;
      }

      setIsLoading(true);

      try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('News request timeout')), 8000);
        });
        
        const response = await Promise.race([
          newsApi.getNews(user.selectedTeams),
          timeoutPromise
        ]);
        const newsData = response.data.news || [];
        setNews(newsData.slice(0, maxArticles));
      } catch (error) {
        console.error('Failed to load news widget:', error);
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
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <span className="text-lg">📰</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white ml-2">
              Aktuelle News
            </h3>
          </div>
          
          {showViewAll && onViewAll && (
            <button
              onClick={onViewAll}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              Alle anzeigen
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Lädt...</span>
          </div>
        )}

        {!isLoading && news.length === 0 && (
          <div className="text-center py-6">
            <div className="text-3xl mb-2">📰</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Keine aktuellen Nachrichten
            </p>
          </div>
        )}

        {!isLoading && news.length > 0 && (
          <div className="space-y-3">
            {news.map((article) => (
              <article
                key={article.id}
                className="group cursor-pointer flex gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                onClick={() => handleArticleClick(article.url)}
              >
                {/* Article Image */}
                <div className="flex-shrink-0 w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-lg overflow-hidden">
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
                      <span className="text-lg text-gray-400 dark:text-gray-500">📰</span>
                    </div>
                  )}
                </div>

                {/* Article Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {article.title}
                  </h4>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{formatPublishedDate(article.publishedAt)}</span>
                    <span>•</span>
                    <span className="truncate">{article.source}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
