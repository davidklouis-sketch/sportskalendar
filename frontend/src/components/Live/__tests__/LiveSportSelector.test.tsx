/**
 * UNIT TESTS: LiveSportSelector Component
 * 
 * Tests for the LiveSportSelector component functionality.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LiveSportSelector } from '../LiveSportSelector';

describe('LiveSportSelector', () => {
  const mockOnSportChange = vi.fn();

  const defaultProps = {
    selectedSport: null,
    onSportChange: mockOnSportChange,
    availableSports: ['football', 'nfl', 'f1', 'nba', 'nhl', 'mlb', 'tennis']
  };

  beforeEach(() => {
    mockOnSportChange.mockClear();
  });

  it('renders all sport buttons', () => {
    render(<LiveSportSelector {...defaultProps} />);
    
    expect(screen.getByText('Fußball')).toBeInTheDocument();
    expect(screen.getByText('NFL')).toBeInTheDocument();
    expect(screen.getByText('F1')).toBeInTheDocument();
    expect(screen.getByText('NBA')).toBeInTheDocument();
    expect(screen.getByText('NHL')).toBeInTheDocument();
    expect(screen.getByText('MLB')).toBeInTheDocument();
    expect(screen.getByText('Tennis')).toBeInTheDocument();
  });

  it('displays correct sport icons', () => {
    render(<LiveSportSelector {...defaultProps} />);
    
    expect(screen.getByText('⚽')).toBeInTheDocument(); // Football
    expect(screen.getByText('🏈')).toBeInTheDocument(); // NFL
    expect(screen.getByText('🏎️')).toBeInTheDocument(); // F1
    expect(screen.getByText('🏀')).toBeInTheDocument(); // NBA
    expect(screen.getByText('🏒')).toBeInTheDocument(); // NHL
    expect(screen.getByText('⚾')).toBeInTheDocument(); // MLB
    expect(screen.getByText('🎾')).toBeInTheDocument(); // Tennis
  });

  it('calls onSportChange when sport button is clicked', () => {
    render(<LiveSportSelector {...defaultProps} />);
    
    const footballButton = screen.getByText('Fußball');
    fireEvent.click(footballButton);
    
    expect(mockOnSportChange).toHaveBeenCalledWith('football');
  });

  it('calls onSportChange when F1 button is clicked', () => {
    render(<LiveSportSelector {...defaultProps} />);
    
    const f1Button = screen.getByText('F1');
    fireEvent.click(f1Button);
    
    expect(mockOnSportChange).toHaveBeenCalledWith('f1');
  });

  it('highlights selected sport', () => {
    render(<LiveSportSelector {...defaultProps} selectedSport="football" />);
    
    const footballButton = screen.getByRole('button', { name: /Fußball/ });
    expect(footballButton).toHaveClass('bg-blue-600', 'text-white');
  });

  it('disables unavailable sports', () => {
    const limitedProps = {
      ...defaultProps,
      availableSports: ['football', 'f1']
    };
    
    render(<LiveSportSelector {...limitedProps} />);
    
    const nflButton = screen.getByRole('button', { name: /NFL/ });
    expect(nflButton).toBeDisabled();
    expect(nflButton).toHaveClass('cursor-not-allowed');
  });

  it('shows "Nicht verfügbar" for unavailable sports', () => {
    const limitedProps = {
      ...defaultProps,
      availableSports: ['football', 'f1']
    };
    
    render(<LiveSportSelector {...limitedProps} />);
    
    expect(screen.getAllByText('(Nicht verfügbar)')).toHaveLength(5);
  });

  it('handles empty available sports array', () => {
    const emptyProps = {
      ...defaultProps,
      availableSports: []
    };
    
    render(<LiveSportSelector {...emptyProps} />);
    
    // All buttons should be disabled
    const footballButton = screen.getByRole('button', { name: /Fußball/ });
    expect(footballButton).toBeDisabled();
  });

  it('handles single available sport', () => {
    const singleProps = {
      ...defaultProps,
      availableSports: ['football']
    };
    
    render(<LiveSportSelector {...singleProps} />);
    
    const footballButton = screen.getByRole('button', { name: /Fußball/ });
    expect(footballButton).not.toBeDisabled();
    
    const nflButton = screen.getByRole('button', { name: /NFL/ });
    expect(nflButton).toBeDisabled();
  });

  it('applies correct styling for available sports', () => {
    render(<LiveSportSelector {...defaultProps} />);
    
    const footballButton = screen.getByRole('button', { name: /Fußball/ });
    expect(footballButton).toHaveClass('bg-gray-100', 'dark:bg-gray-700');
  });

  it('applies correct styling for unavailable sports', () => {
    const limitedProps = {
      ...defaultProps,
      availableSports: ['football']
    };
    
    render(<LiveSportSelector {...limitedProps} />);
    
    const nflButton = screen.getByRole('button', { name: /NFL/ });
    expect(nflButton).toHaveClass('bg-gray-50', 'dark:bg-gray-800');
  });
});
