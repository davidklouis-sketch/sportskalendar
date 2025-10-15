import { memo } from 'react';
import { format } from 'date-fns';
import type { Translations } from '../../lib/i18n';

interface Event {
  id: string;
  title: string;
  sport: string;
  startsAt: string;
  homeTeam?: string;
  awayTeam?: string;
  homeTeamBadge?: string;
  awayTeamBadge?: string;
  homeScore?: string | null;
  awayScore?: string | null;
  status?: string;
}

interface User {
  isPremium?: boolean;
}

interface EventListProps {
  events: Event[];
  isLoading: boolean;
  selectedSport: string;
  user: User | null;
  getSportIcon: (sport: string) => string;
  t: (key: keyof Translations) => string;
}

export const EventList = memo(function EventList({
  events,
  isLoading,
  selectedSport,
  user,
  getSportIcon,
  t
}: EventListProps) {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        <p className="mt-4 text-white/80">{t('loadingEvents')}</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-white/80">{t('noEventsAvailable')}</p>
      </div>
    );
  }

  const now = new Date();
  const filteredEvents = user?.isPremium 
    ? events 
    : events.filter(event => new Date(event.startsAt) > now);

  const eventsWithDates = filteredEvents.map(event => ({
    ...event,
    parsedDate: new Date(event.startsAt),
    isFuture: new Date(event.startsAt) > now
  }));

  let hasPastEvents = false;
  for (const e of events) {
    if (new Date(e.startsAt) <= now) {
      hasPastEvents = true;
      break;
    }
  }

  const sortedEvents = eventsWithDates.sort((a, b) => {
    if (a.isFuture === b.isFuture) {
      if (a.isFuture) {
        return a.parsedDate.getTime() - b.parsedDate.getTime();
      } else {
        return b.parsedDate.getTime() - a.parsedDate.getTime();
      }
    }
    return a.isFuture ? -1 : 1;
  });

  return (
    <>
      <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
        <div className="space-y-3 pr-2">
          {sortedEvents.map((event) => {
            const isFuture = event.isFuture;
            const hasScore = event.homeScore !== null && event.homeScore !== undefined && 
                            event.awayScore !== null && event.awayScore !== undefined;

            return (
              <div key={event.id} className="group/event flex items-center justify-between p-4 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all duration-200">
                <div className="flex items-center flex-1">
                  {user?.isPremium && (event.homeTeamBadge || event.awayTeamBadge) ? (
                    <div className="flex items-center gap-2 mr-4">
                      {event.homeTeamBadge && (
                        <div className="w-10 h-10 bg-white rounded-lg p-1 flex items-center justify-center shadow-sm">
                          <img 
                            src={event.homeTeamBadge} 
                            alt={event.homeTeam || 'Home'} 
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.parentElement!.innerHTML = `<span class="text-lg">${getSportIcon(selectedSport)}</span>`;
                            }}
                          />
                        </div>
                      )}
                      <span className="text-white/60 font-bold">vs</span>
                      {event.awayTeamBadge && (
                        <div className="w-10 h-10 bg-white rounded-lg p-1 flex items-center justify-center shadow-sm">
                          <img 
                            src={event.awayTeamBadge} 
                            alt={event.awayTeam || 'Away'} 
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.parentElement!.innerHTML = `<span class="text-lg">${getSportIcon(selectedSport)}</span>`;
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-white/30 rounded-lg flex items-center justify-center mr-4">
                      <span className="text-lg">{getSportIcon(selectedSport)}</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-white">{event.title}</p>
                    <p className="text-sm text-white/80">
                      {format(event.parsedDate, 'dd.MM.yyyy HH:mm')} Uhr
                      {!isFuture && hasScore && (
                        <span className="ml-2 text-xs font-semibold text-yellow-300">
                          {event.homeScore}:{event.awayScore} (Beendet)
                        </span>
                      )}
                      {!isFuture && !hasScore && (
                        <span className="ml-2 text-xs text-yellow-300">(Beendet)</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="opacity-0 group-hover/event:opacity-100 transition-opacity duration-200">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {!user?.isPremium && hasPastEvents && (
        <div className="mt-4 p-4 bg-white/30 backdrop-blur-sm rounded-xl border border-white/40">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-yellow-300 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-semibold text-white">
                Premium Feature
              </h3>
              <p className="mt-1 text-sm text-white/90">
                Vergangene Events mit Ergebnissen sind nur für Premium-Mitglieder verfügbar. Upgrade jetzt für Zugriff auf alle vergangenen Spiele!
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

