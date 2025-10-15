/**
 * STORYBOOK STORY: LiveEntry
 * 
 * Documentation and testing for the LiveEntry component.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { LiveEntry } from '../components/Live/LiveEntry';

const meta: Meta<typeof LiveEntry> = {
  title: 'Live/LiveEntry',
  component: LiveEntry,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Displays a single live event entry with sport icon, team info, score, and status.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    entry: {
      description: 'Live event data',
      control: 'object'
    },
    sport: {
      description: 'Sport type for icon display',
      control: 'select',
      options: ['football', 'nfl', 'f1', 'nba', 'nhl', 'mlb', 'tennis']
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

// Sample data
const footballEntry = {
  id: '1',
  name: 'Bayern Munich vs Borussia Dortmund',
  status: 'Live',
  score: '2-1',
  time: '67\'',
  teams: 'Bayern Munich vs Borussia Dortmund'
};

const f1Entry = {
  id: '2',
  name: 'Monaco Grand Prix',
  status: 'Live',
  score: 'Lap 45/78',
  time: '1:23:45',
  circuit: 'Circuit de Monaco'
};

const nflEntry = {
  id: '3',
  name: 'New England Patriots vs Buffalo Bills',
  status: 'Live',
  score: '21-14',
  time: 'Q3 8:45',
  teams: 'Patriots vs Bills'
};

const finishedEntry = {
  id: '4',
  name: 'Lakers vs Warriors',
  status: 'Finished',
  score: '108-95',
  time: 'Final',
  teams: 'Lakers vs Warriors'
};

const upcomingEntry = {
  id: '5',
  name: 'Tennis Championship',
  status: 'Upcoming',
  time: '14:30',
  teams: 'Djokovic vs Nadal'
};

// Stories
export const FootballLive: Story = {
  args: {
    entry: footballEntry,
    sport: 'football'
  }
};

export const F1Live: Story = {
  args: {
    entry: f1Entry,
    sport: 'f1'
  }
};

export const NFLLive: Story = {
  args: {
    entry: nflEntry,
    sport: 'nfl'
  }
};

export const Finished: Story = {
  args: {
    entry: finishedEntry,
    sport: 'nba'
  }
};

export const Upcoming: Story = {
  args: {
    entry: upcomingEntry,
    sport: 'tennis'
  }
};

export const AllSports: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <LiveEntry entry={footballEntry} sport="football" />
      <LiveEntry entry={f1Entry} sport="f1" />
      <LiveEntry entry={nflEntry} sport="nfl" />
      <LiveEntry entry={finishedEntry} sport="nba" />
      <LiveEntry entry={upcomingEntry} sport="tennis" />
    </div>
  )
};
