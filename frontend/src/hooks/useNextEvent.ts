import { useState, useEffect } from 'react';

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

export function useNextEvent(
  footballEvents: Event[],
  f1Events: Event[],
  nflEvents: Event[],
  nbaEvents: Event[],
  nhlEvents: Event[],
  mlbEvents: Event[],
  tennisEvents: Event[]
) {
  const [nextEvent, setNextEvent] = useState<Event | null>(null);

  useEffect(() => {
    const allEvents = [
      ...footballEvents,
      ...f1Events,
      ...nflEvents,
      ...nbaEvents,
      ...nhlEvents,
      ...mlbEvents,
      ...tennisEvents
    ];

    if (allEvents.length === 0) {
      setNextEvent(null);
      return;
    }

    const now = new Date();
    const futureEvents = allEvents.filter(event => new Date(event.startsAt) > now);

    if (futureEvents.length === 0) {
      setNextEvent(null);
      return;
    }

    const sorted = futureEvents.sort((a, b) => 
      new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
    );

    setNextEvent(sorted[0]);
  }, [footballEvents, f1Events, nflEvents, nbaEvents, nhlEvents, mlbEvents, tennisEvents]);

  return nextEvent;
}

