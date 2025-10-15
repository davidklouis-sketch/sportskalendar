/**
 * EVENT LIST COMPONENT
 * 
 * Displays events for a specific sport.
 * Extracted from Calendar.tsx for better maintainability.
 */

import { memo } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Event {
  id: string;
  title: string;
  sport: string;
  startsAt: string;
  homeTeam?: string;
  awayTeam?: string;
  league?: string;
  venue?: string;
}

interface EventListProps {
  events: Event[];
  sport: string;
  isLoading?: boolean;
}

export const EventList = memo(function EventList({
  events,
  sport,
  isLoading = false
}: EventListProps) {
  const formatEventDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd.MM.yyyy HH:mm', { locale: de });
    } catch {
      return 'Unbekannt';
    }
  };

  const getSportIcon = (sportName: string) => {
    switch (sportName) {
      case 'football': return '⚽';
      case 'nfl': return '🏈';
      case 'f1': return '🏎️';
      case 'nba': return '🏀';
      case 'nhl': return '🏒';
      case 'mlb': return '⚾';
      case 'tennis': return '🎾';
      default: return '🏆';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">{getSportIcon(sport)}</div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Keine Events gefunden
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Es sind momentan keine Events für {sport} verfügbar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <div
          key={event.id}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{getSportIcon(event.sport)}</span>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {event.title}
                </h3>
              </div>
              
              {event.homeTeam && event.awayTeam && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {event.homeTeam}
                  </span>
                  <span className="text-gray-500">vs</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {event.awayTeam}
                  </span>
                </div>
              )}
              
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{formatEventDate(event.startsAt)}</span>
                </div>
                
                {event.venue && (
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{event.venue}</span>
                  </div>
                )}
                
                {event.league && (
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span>{event.league}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});
