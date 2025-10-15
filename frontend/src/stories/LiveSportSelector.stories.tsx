/**
 * STORYBOOK STORY: LiveSportSelector
 * 
 * Documentation and testing for the LiveSportSelector component.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { LiveSportSelector } from '../components/Live/LiveSportSelector';
import { useState } from 'react';

const meta: Meta<typeof LiveSportSelector> = {
  title: 'Live/LiveSportSelector',
  component: LiveSportSelector,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Sport selector for live data with availability states and visual feedback.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    selectedSport: {
      description: 'Currently selected sport',
      control: 'select',
      options: ['football', 'nfl', 'f1', 'nba', 'nhl', 'mlb', 'tennis', null]
    },
    onSportChange: {
      description: 'Callback when sport selection changes',
      action: 'sportChanged'
    },
    availableSports: {
      description: 'Array of available sports',
      control: 'object'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

// Interactive wrapper for stories
const InteractiveWrapper = ({ availableSports }: { availableSports: string[] }) => {
  const [selectedSport, setSelectedSport] = useState<'football' | 'nfl' | 'f1' | 'nba' | 'nhl' | 'mlb' | 'tennis' | null>(null);
  
  return (
    <LiveSportSelector
      selectedSport={selectedSport}
      onSportChange={setSelectedSport}
      availableSports={availableSports}
    />
  );
};

// Stories
export const AllAvailable: Story = {
  render: () => (
    <InteractiveWrapper availableSports={['football', 'nfl', 'f1', 'nba', 'nhl', 'mlb', 'tennis']} />
  )
};

export const LimitedSports: Story = {
  render: () => (
    <InteractiveWrapper availableSports={['football', 'f1', 'nba']} />
  )
};

export const SingleSport: Story = {
  render: () => (
    <InteractiveWrapper availableSports={['football']} />
  )
};

export const NoSports: Story = {
  render: () => (
    <InteractiveWrapper availableSports={[]} />
  )
};

export const WithSelection: Story = {
  args: {
    selectedSport: 'football',
    availableSports: ['football', 'nfl', 'f1', 'nba', 'nhl', 'mlb', 'tennis'],
    onSportChange: () => {}
  }
};
