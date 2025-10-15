/**
 * CALENDAR PAGE COMPONENT (REFACTORED)
 * 
 * Main calendar page with improved structure and performance.
 * Split into smaller, manageable components and hooks.
 */

import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { highlightsApi } from '../../lib/api';
import { useLanguage } from '../../hooks/useLanguage';
import { useEventLoader } from '../../hooks/useEventLoader';
import { useNextEvent } from '../../hooks/useNextEvent';
import { LiveData } from '../LiveData';
import { SportsKalendarBanner } from '../Ads/AdManager';
import { NewsWidget } from '../News/NewsWidget';
import { TeamSelector } from '../Calendar/TeamSelector';
import { SportTabs } from '../Calendar/SportTabs';
import { EventList } from '../Calendar/EventList';

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

export const Calendar = memo(function Calendar() {
  const { user, setUser } = useAuthStore();
  useLanguage(); // Trigger re-render on language change
  
  // Event loading hook
  const {
    footballEvents,
    f1Events,
    nflEvents,
    nbaEvents,
    nhlEvents,
    mlbEvents,
    tennisEvents,
    isLoading,
    debouncedLoadAllEvents
  } = useEventLoader();

  // Next event hook
  const { nextEvent, findNextEvent } = useNextEvent();

  // UI state
  const [selectedSport, setSelectedSport] = useState<'football' | 'nfl' | 'f1' | 'nba' | 'nhl' | 'mlb' | 'tennis' | null>(null);
  const [showTeamSelector, setShowTeamSelector] = useState(false);
  const [localTeams, setLocalTeams] = useState<Array<{ sport: string; teamName: string; teamId?: string; leagueId?: number }>>([]);
  
  // Highlights state
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [isLoadingHighlights, setIsLoadingHighlights] = useState(false);

  // Refs for performance
  const lastTeamsLengthRef = useRef<number>(0);
  const lastTeamsHashRef = useRef<string>('');

  // Load user teams and events on mount
  useEffect(() => {
    const teams = user?.selectedTeams || [];
    const teamsLength = teams.length;
    
    // Create a simple hash of teams to detect actual changes
    const teamsHash = JSON.stringify(teams.map(t => ({ sport: t.sport, teamName: t.teamName })));
    
    // Only reload if teams actually changed
    if (teamsLength !== lastTeamsLengthRef.current || teamsHash !== lastTeamsHashRef.current) {
      lastTeamsLengthRef.current = teamsLength;
      lastTeamsHashRef.current = teamsHash;
      
      setLocalTeams(teams);
      
      if (teams.length > 0) {
        // Set initial sport from first team
        const firstSport = teams[0].sport as 'football' | 'nfl' | 'f1' | 'nba' | 'nhl' | 'mlb' | 'tennis';
        if (firstSport) {
          setSelectedSport(firstSport);
        }
        
        // Load events for teams
        debouncedLoadAllEvents(teams);
      } else {
        setSelectedSport(null);
      }
    }
  }, [user?.selectedTeams, debouncedLoadAllEvents]);

  // Find next event when events change
  useEffect(() => {
    if (localTeams.length > 0) {
      const allEvents = [
        ...footballEvents,
        ...f1Events,
        ...nflEvents,
        ...nbaEvents,
        ...nhlEvents,
        ...mlbEvents,
        ...tennisEvents
      ];
      findNextEvent(allEvents, localTeams);
    }
  }, [footballEvents, f1Events, nflEvents, nbaEvents, nhlEvents, mlbEvents, tennisEvents, localTeams, findNextEvent]);

  // Load highlights for selected sport
  const loadHighlights = useCallback(async () => {
    if (!selectedSport) {
      return;
    }
    
    setIsLoadingHighlights(true);
    try {
      const sportMapping: Record<string, string> = {
        football: 'Fußball',
        nfl: 'NFL',
        f1: 'F1',
        nba: 'Basketball',
        nhl: 'NHL',
        mlb: 'MLB',
        tennis: 'Tennis',
      };

      const currentTeam = localTeams.find(t => t.sport === selectedSport);
      
      // PERFORMANCE FIX: Reduce timeout to 5 seconds
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 5000); // 5 second timeout
      });
      
      const fetchPromise = highlightsApi.getHighlights(sportMapping[selectedSport], currentTeam?.teamName);
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      const highlightsData = response.data || [];
      setHighlights(highlightsData);
    } catch (error) {
      console.error('Failed to load highlights:', error);
      setHighlights([]);
    } finally {
      setIsLoadingHighlights(false);
    }
  }, [selectedSport, localTeams]);

  // Load highlights when sport changes
  useEffect(() => {
    if (selectedSport) {
      loadHighlights();
    }
  }, [selectedSport, loadHighlights]);

  // Handle team updates
  const handleTeamsUpdate = useCallback((teams: Array<{ sport: string; teamName: string; teamId?: string; leagueId?: number }>) => {
    setLocalTeams(teams);
    setUser({ ...user!, selectedTeams: teams as any });
    debouncedLoadAllEvents(teams);
  }, [user, setUser, debouncedLoadAllEvents]);

  // Get current events based on selected sport
  const getCurrentEvents = () => {
    switch (selectedSport) {
      case 'football': return footballEvents;
      case 'f1': return f1Events;
      case 'nfl': return nflEvents;
      case 'nba': return nbaEvents;
      case 'nhl': return nhlEvents;
      case 'mlb': return mlbEvents;
      case 'tennis': return tennisEvents;
      default: return [];
    }
  };

  // Get event counts for tabs
  const eventCounts = {
    football: footballEvents.length,
    nfl: nflEvents.length,
    f1: f1Events.length,
    nba: nbaEvents.length,
    nhl: nhlEvents.length,
    mlb: mlbEvents.length,
    tennis: tennisEvents.length
  };

  const currentEvents = getCurrentEvents();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
                <span className="text-3xl text-white">📅</span>
              </div>
              <div className="ml-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Sportkalender
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Alle Spiele deiner Lieblingsteams an einem Ort
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowTeamSelector(true)}
              className="btn btn-primary btn-lg"
            >
              Teams verwalten
            </button>
          </div>

          {/* Next Event Countdown */}
          {nextEvent && (
            <div className="mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">Nächstes Event</h3>
                <p className="text-xl font-bold">{nextEvent.title}</p>
                <p className="text-sm opacity-90">
                  {new Date(nextEvent.startsAt).toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          )}

          {/* Live Data */}
          <div className="mb-6">
            <LiveData />
          </div>

          {/* News Widget */}
          <div className="mb-6">
            <NewsWidget />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {localTeams.length === 0 ? (
          // No teams selected state
          <div className="text-center py-16">
            <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center">
              <span className="text-6xl text-white">📅</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Keine Teams ausgewählt
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Wähle deine Lieblingsteams aus, um personalisierte Spieltermine und Events zu sehen.
            </p>
            <button
              onClick={() => setShowTeamSelector(true)}
              className="btn btn-primary btn-lg"
            >
              Teams auswählen
            </button>
          </div>
        ) : (
          // Teams selected - show calendar
          <>
            {/* Sport Tabs */}
            <SportTabs
              selectedSport={selectedSport}
              onSportChange={setSelectedSport}
              eventCounts={eventCounts}
            />

            {/* Events */}
            {selectedSport && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedSport === 'football' ? 'Fußball' : 
                     selectedSport === 'nfl' ? 'NFL' :
                     selectedSport === 'f1' ? 'F1' :
                     selectedSport === 'nba' ? 'NBA' :
                     selectedSport === 'nhl' ? 'NHL' :
                     selectedSport === 'mlb' ? 'MLB' :
                     selectedSport === 'tennis' ? 'Tennis' : selectedSport} Events
                  </h2>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {currentEvents.length} Events
                  </span>
                </div>
                
                <EventList
                  events={currentEvents}
                  sport={selectedSport}
                  isLoading={isLoading}
                />
              </div>
            )}

            {/* Highlights */}
            {selectedSport && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Highlights
                </h2>
                
                {isLoadingHighlights ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="bg-gray-200 dark:bg-gray-700 rounded-lg aspect-video"></div>
                      </div>
                    ))}
                  </div>
                ) : highlights.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {highlights.map((highlight) => (
                      <div
                        key={highlight.id}
                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
                      >
                        {highlight.thumbnail && (
                          <div className="aspect-video bg-gray-200 dark:bg-gray-700">
                            <img
                              src={highlight.thumbnail}
                              alt={highlight.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                            {highlight.title}
                          </h3>
                          {highlight.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                              {highlight.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>{highlight.sport}</span>
                            {highlight.duration && <span>{highlight.duration}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🎥</div>
                    <p className="text-gray-600 dark:text-gray-400">
                      Keine Highlights für {selectedSport} verfügbar.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Ads */}
            <div className="mt-12">
              <SportsKalendarBanner />
            </div>
          </>
        )}
      </div>

      {/* Team Selector Modal */}
      <TeamSelector
        isOpen={showTeamSelector}
        onClose={() => setShowTeamSelector(false)}
        onTeamsUpdate={handleTeamsUpdate}
        currentTeams={localTeams}
      />
    </div>
  );
});
