/**
 * CUSTOM HOOK: useNextEvent
 * 
 * Finds and manages the next upcoming event.
 * Extracted from Calendar.tsx for better maintainability.
 */

import { useState, useCallback } from 'react';

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

interface UseNextEventReturn {
  nextEvent: Event | null;
  findNextEvent: (events: Event[], selectedTeams: Array<{ sport: string; teamName: string }>) => void;
}

export function useNextEvent(): UseNextEventReturn {
  const [nextEvent, setNextEvent] = useState<Event | null>(null);

  const filterFutureEvents = useCallback((events: Event[]) => {
    const now = new Date();
    return events.filter(event => {
      try {
        const eventDate = new Date(event.startsAt);
        return eventDate > now;
      } catch {
        return false;
      }
    });
  }, []);

  const findNextEvent = useCallback((events: Event[], selectedTeams: Array<{ sport: string; teamName: string }>) => {
    if (!events || events.length === 0 || !selectedTeams || selectedTeams.length === 0) {
      setNextEvent(null);
      return;
    }

    // Create a set of team names for efficient lookup
    const teamNames = new Set(selectedTeams.map(team => team.teamName.toLowerCase()));
    const sportNames = new Set(selectedTeams.map(team => team.sport.toLowerCase()));

    // Filter events that match selected teams
    const relevantEvents = events.filter(event => {
      const eventSport = event.sport.toLowerCase();
      const eventTitle = event.title.toLowerCase();
      const homeTeam = event.homeTeam?.toLowerCase() || '';
      const awayTeam = event.awayTeam?.toLowerCase() || '';

      // Check if sport matches
      if (!sportNames.has(eventSport)) {
        return false;
      }

      // Check if any team name matches
      for (const teamName of teamNames) {
        if (eventTitle.includes(teamName) || 
            homeTeam.includes(teamName) || 
            awayTeam.includes(teamName)) {
          return true;
        }
      }

      return false;
    });

    if (relevantEvents.length === 0) {
      setNextEvent(null);
      return;
    }

    const upcomingEvents = filterFutureEvents(relevantEvents);

    if (upcomingEvents.length > 0) {
      // Sort by date and get the earliest
      const sortedEvents = upcomingEvents.sort((a, b) => 
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
      );
      setNextEvent(sortedEvents[0]);
    } else {
      setNextEvent(null);
    }
  }, [filterFutureEvents]);

  return {
    nextEvent,
    findNextEvent
  };
}
