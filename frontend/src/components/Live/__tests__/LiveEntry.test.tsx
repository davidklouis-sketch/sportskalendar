/**
 * UNIT TESTS: LiveEntry Component
 * 
 * Tests for the LiveEntry component functionality.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LiveEntry } from '../LiveEntry';

describe('LiveEntry', () => {
  const mockEntry = {
    id: '1',
    name: 'Bayern Munich vs Borussia Dortmund',
    status: 'Live',
    score: '2-1',
    time: '67\'',
    teams: 'Bayern Munich vs Borussia Dortmund'
  };

  it('renders entry information correctly', () => {
    render(<LiveEntry entry={mockEntry} sport="football" />);
    
    expect(screen.getByRole('heading', { name: 'Bayern Munich vs Borussia Dortmund' })).toBeInTheDocument();
    expect(screen.getByText('2-1')).toBeInTheDocument();
    expect(screen.getByText('67\'')).toBeInTheDocument();
    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  it('displays correct sport icon for football', () => {
    render(<LiveEntry entry={mockEntry} sport="football" />);
    
    expect(screen.getByText('⚽')).toBeInTheDocument();
  });

  it('displays correct sport icon for F1', () => {
    render(<LiveEntry entry={mockEntry} sport="f1" />);
    
    expect(screen.getByText('🏎️')).toBeInTheDocument();
  });

  it('displays correct sport icon for NFL', () => {
    render(<LiveEntry entry={mockEntry} sport="nfl" />);
    
    expect(screen.getByText('🏈')).toBeInTheDocument();
  });

  it('displays correct sport icon for NBA', () => {
    render(<LiveEntry entry={mockEntry} sport="nba" />);
    
    expect(screen.getByText('🏀')).toBeInTheDocument();
  });

  it('displays correct sport icon for NHL', () => {
    render(<LiveEntry entry={mockEntry} sport="nhl" />);
    
    expect(screen.getByText('🏒')).toBeInTheDocument();
  });

  it('displays correct sport icon for MLB', () => {
    render(<LiveEntry entry={mockEntry} sport="mlb" />);
    
    expect(screen.getByText('⚾')).toBeInTheDocument();
  });

  it('displays correct sport icon for tennis', () => {
    render(<LiveEntry entry={mockEntry} sport="tennis" />);
    
    expect(screen.getByText('🎾')).toBeInTheDocument();
  });

  it('displays default sport icon for unknown sport', () => {
    render(<LiveEntry entry={mockEntry} sport="unknown" />);
    
    expect(screen.getByText('🏆')).toBeInTheDocument();
  });

  it('renders circuit information for F1', () => {
    const f1Entry = {
      ...mockEntry,
      circuit: 'Circuit de Monaco'
    };
    
    render(<LiveEntry entry={f1Entry} sport="f1" />);
    
    expect(screen.getByText('Circuit de Monaco')).toBeInTheDocument();
  });

  it('applies correct status color for live status', () => {
    render(<LiveEntry entry={mockEntry} sport="football" />);
    
    const statusElement = screen.getByText('Live');
    expect(statusElement).toHaveClass('text-red-600', 'dark:text-red-400');
  });

  it('applies correct status color for finished status', () => {
    const finishedEntry = {
      ...mockEntry,
      status: 'Finished'
    };
    
    render(<LiveEntry entry={finishedEntry} sport="football" />);
    
    const statusElement = screen.getByText('Finished');
    expect(statusElement).toHaveClass('text-gray-600', 'dark:text-gray-400');
  });

  it('applies correct status color for upcoming status', () => {
    const upcomingEntry = {
      ...mockEntry,
      status: 'Upcoming'
    };
    
    render(<LiveEntry entry={upcomingEntry} sport="football" />);
    
    const statusElement = screen.getByText('Upcoming');
    expect(statusElement).toHaveClass('text-blue-600', 'dark:text-blue-400');
  });

  it('handles missing optional fields gracefully', () => {
    const minimalEntry = {
      id: '1',
      name: 'Test Event',
      status: 'Live'
    };
    
    render(<LiveEntry entry={minimalEntry} sport="football" />);
    
    expect(screen.getByText('Test Event')).toBeInTheDocument();
    expect(screen.getByText('Live')).toBeInTheDocument();
  });
});
