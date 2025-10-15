/**
 * CUSTOM HOOK: useLiveData
 * 
 * Handles live data loading for different sports.
 * Extracted from Live.tsx for better maintainability.
 */

import { useState, useCallback } from 'react';
import { liveApi } from '../lib/api';

interface LiveEntry {
  id: string;
  name: string;
  status: string;
  score?: string;
  time?: string;
  teams?: string;
  circuit?: string;
}

interface LiveData {
  entries: LiveEntry[];
  message?: string;
  nextEvent?: any;
  error?: string;
}

interface UseLiveDataReturn {
  liveData: LiveData | null;
  isLoading: boolean;
  loadLiveData: (sport: string, teamName?: string) => Promise<void>;
}

export function useLiveData(): UseLiveDataReturn {
  const [liveData, setLiveData] = useState<LiveData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadLiveData = useCallback(async (sport: string, teamName?: string) => {
    if (!sport) return;

    setIsLoading(true);
    try {
      let response;
      
      // Map sport to API call
      switch (sport) {
        case 'f1':
          response = await liveApi.getF1();
          break;
        case 'nfl':
          response = await liveApi.getNFL();
          break;
        case 'nba':
          response = await liveApi.getNBA();
          break;
        case 'nhl':
          response = await liveApi.getNHL();
          break;
        case 'mlb':
          response = await liveApi.getMLB();
          break;
        case 'tennis':
          response = await liveApi.getTennis();
          break;
        case 'football':
        default:
          response = await liveApi.getSoccer();
          break;
      }
      
      const liveDataResult = response.data;
      
      // Filter entries by team name if provided
      if (teamName && liveDataResult.entries) {
        liveDataResult.entries = liveDataResult.entries.filter((entry: LiveEntry) => 
          entry.name.toLowerCase().includes(teamName.toLowerCase())
        );
      }
      
      setLiveData(liveDataResult);
    } catch (error) {
      console.error('Failed to load live data:', error);
      setLiveData({ entries: [], error: 'Fehler beim Laden der Live-Daten' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    liveData,
    isLoading,
    loadLiveData
  };
}
