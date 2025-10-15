/**
 * UNIT TESTS: useLiveData Hook
 * 
 * Tests for the useLiveData custom hook functionality.
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useLiveData } from '../useLiveData';

// Mock the API
vi.mock('../../lib/api', () => ({
  liveApi: {
    getF1: vi.fn(),
    getNFL: vi.fn(),
    getNBA: vi.fn(),
    getNHL: vi.fn(),
    getMLB: vi.fn(),
    getTennis: vi.fn(),
    getSoccer: vi.fn()
  }
}));

describe('useLiveData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with null liveData and false isLoading', () => {
    const { result } = renderHook(() => useLiveData());
    
    expect(result.current.liveData).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(typeof result.current.loadLiveData).toBe('function');
  });

  it('loads F1 data successfully', async () => {
    const mockF1Data = {
      entries: [
        { id: '1', name: 'Monaco Grand Prix', status: 'Live', score: 'Lap 45/78' }
      ]
    };
    
    const { liveApi } = await import('../../lib/api');
    vi.mocked(liveApi.getF1).mockResolvedValue({ data: mockF1Data });
    
    const { result } = renderHook(() => useLiveData());
    
    await act(async () => {
      await result.current.loadLiveData('f1');
    });
    
    expect(liveApi.getF1).toHaveBeenCalled();
    expect(result.current.liveData).toEqual(mockF1Data);
    expect(result.current.isLoading).toBe(false);
  });

  it('loads Football data successfully', async () => {
    const mockFootballData = {
      entries: [
        { id: '1', name: 'Bayern vs Dortmund', status: 'Live', score: '2-1' }
      ]
    };
    
    const { liveApi } = await import('../../lib/api');
    vi.mocked(liveApi.getSoccer).mockResolvedValue({ data: mockFootballData });
    
    const { result } = renderHook(() => useLiveData());
    
    await act(async () => {
      await result.current.loadLiveData('football');
    });
    
    expect(liveApi.getSoccer).toHaveBeenCalled();
    expect(result.current.liveData).toEqual(mockFootballData);
  });

  it('filters entries by team name when provided', async () => {
    const mockData = {
      entries: [
        { id: '1', name: 'Bayern Munich vs Dortmund', status: 'Live' },
        { id: '2', name: 'Real Madrid vs Barcelona', status: 'Live' }
      ]
    };
    
    const { liveApi } = await import('../../lib/api');
    vi.mocked(liveApi.getSoccer).mockResolvedValue({ data: mockData });
    
    const { result } = renderHook(() => useLiveData());
    
    await act(async () => {
      await result.current.loadLiveData('football', 'Bayern');
    });
    
    expect(result.current.liveData?.entries).toHaveLength(1);
    expect(result.current.liveData?.entries[0].name).toBe('Bayern Munich vs Dortmund');
  });

  it('handles API errors gracefully', async () => {
    const { liveApi } = await import('../../lib/api');
    vi.mocked(liveApi.getF1).mockRejectedValue(new Error('API Error'));
    
    const { result } = renderHook(() => useLiveData());
    
    await act(async () => {
      await result.current.loadLiveData('f1');
    });
    
    expect(result.current.liveData).toEqual({
      entries: [],
      error: 'Fehler beim Laden der Live-Daten'
    });
    expect(result.current.isLoading).toBe(false);
  });

  it('does not make API call when sport is empty', async () => {
    const { result } = renderHook(() => useLiveData());
    
    await act(async () => {
      await result.current.loadLiveData('');
    });
    
    const { liveApi } = await import('../../lib/api');
    expect(liveApi.getF1).not.toHaveBeenCalled();
    expect(liveApi.getNFL).not.toHaveBeenCalled();
    expect(liveApi.getNBA).not.toHaveBeenCalled();
    expect(liveApi.getNHL).not.toHaveBeenCalled();
    expect(liveApi.getMLB).not.toHaveBeenCalled();
    expect(liveApi.getTennis).not.toHaveBeenCalled();
    expect(liveApi.getSoccer).not.toHaveBeenCalled();
  });
});