import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale/de';

interface CountdownTimerProps {
  eventTitle: string;
  eventDate: string;
  sport: string;
  compact?: boolean;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isLive: boolean;
  isPast: boolean;
}

export function EventCountdown({ eventTitle, eventDate, sport, compact = false }: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isLive: false,
    isPast: false,
  });

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const eventTime = new Date(eventDate).getTime();
      const difference = eventTime - now;

      // Event is in the past
      if (difference < -3600000) { // More than 1 hour past
        setTimeRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isLive: false,
          isPast: true,
        });
        return;
      }

      // Event is live (within 1 hour before to 3 hours after)
      if (difference >= -3600000 && difference <= 10800000) {
        setTimeRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isLive: true,
          isPast: false,
        });
        return;
      }

      // Event is upcoming
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeRemaining({
        days,
        hours,
        minutes,
        seconds,
        isLive: false,
        isPast: false,
      });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [eventDate]);

  const getSportIcon = (sport: string) => {
    switch (sport) {
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

  const getSportColor = (sport: string) => {
    switch (sport) {
      case 'football': return 'from-emerald-500 to-green-600';
      case 'nfl': return 'from-orange-500 to-red-600';
      case 'f1': return 'from-red-500 to-pink-600';
      case 'nba': return 'from-orange-500 to-orange-600';
      case 'nhl': return 'from-blue-500 to-cyan-600';
      case 'mlb': return 'from-blue-600 to-indigo-600';
      case 'tennis': return 'from-green-600 to-teal-600';
      default: return 'from-blue-500 to-indigo-600';
    }
  };

  if (compact) {
    if (timeRemaining.isLive) {
      return (
        <div className="flex items-center space-x-2 text-red-500 animate-pulse">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span className="text-sm font-bold">LIVE</span>
        </div>
      );
    }

    if (timeRemaining.isPast) {
      return null;
    }

    return (
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {timeRemaining.days > 0 && `${timeRemaining.days}d `}
        {timeRemaining.hours}h {timeRemaining.minutes}m
      </div>
    );
  }

  return (
    <div className="relative group">
      <div className={`absolute -inset-1 bg-gradient-to-r ${getSportColor(sport)} rounded-3xl blur opacity-75 group-hover:opacity-100 transition duration-1000`}></div>
      <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 bg-gradient-to-r ${getSportColor(sport)} rounded-2xl flex items-center justify-center`}>
                <span className="text-2xl">{getSportIcon(sport)}</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Nächstes Event</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {format(new Date(eventDate), 'dd. MMM yyyy, HH:mm', { locale: de })} Uhr
                </p>
              </div>
            </div>
            {timeRemaining.isLive && (
              <div className="flex items-center space-x-2 text-red-500 animate-pulse">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm font-bold">LIVE</span>
              </div>
            )}
          </div>

          {/* Event Title */}
          <div className="mb-6">
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white line-clamp-2">
              {eventTitle}
            </h4>
          </div>

          {/* Countdown */}
          {!timeRemaining.isLive && !timeRemaining.isPast && (
            <div className="grid grid-cols-4 gap-3">
              {/* Days */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {String(timeRemaining.days).padStart(2, '0')}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                  Tage
                </div>
              </div>

              {/* Hours */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {String(timeRemaining.hours).padStart(2, '0')}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                  Stunden
                </div>
              </div>

              {/* Minutes */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {String(timeRemaining.minutes).padStart(2, '0')}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                  Minuten
                </div>
              </div>

              {/* Seconds */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {String(timeRemaining.seconds).padStart(2, '0')}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                  Sekunden
                </div>
              </div>
            </div>
          )}

          {/* Live Status */}
          {timeRemaining.isLive && (
            <div className="text-center py-8">
              <div className="inline-flex items-center space-x-3 px-6 py-3 bg-red-500 rounded-2xl">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                <span className="text-white font-bold text-lg">EVENT LÄUFT JETZT!</span>
              </div>
            </div>
          )}

          {/* Past Status */}
          {timeRemaining.isPast && (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              Event ist vorbei
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

