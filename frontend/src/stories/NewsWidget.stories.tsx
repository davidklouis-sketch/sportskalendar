/**
 * STORYBOOK STORY: NewsWidget
 * 
 * Documentation and testing for the NewsWidget component.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { NewsWidget } from '../components/News/NewsWidget';
import { vi } from 'vitest';

// Mock the auth store
const mockUser = {
  id: '1',
  email: 'test@example.com',
  selectedTeams: [
    { sport: 'football', teamName: 'Bayern Munich', teamId: '157', leagueId: 78 },
    { sport: 'f1', teamName: 'Max Verstappen', teamId: 'verstappen' }
  ]
};

// Mock the API
vi.mock('../lib/api', () => ({
  newsApi: {
    getNews: vi.fn().mockResolvedValue({
      data: {
        news: [
          {
            id: '1',
            title: 'Bayern Munich gewinnt Champions League',
            description: 'Die Münchner feiern einen historischen Sieg...',
            url: 'https://example.com/news1',
            imageUrl: 'https://via.placeholder.com/400x200',
            publishedAt: '2024-01-15T10:00:00Z',
            source: 'Kicker.de',
            author: 'Sport Reporter'
          },
          {
            id: '2',
            title: 'Verstappen dominiert Monaco Grand Prix',
            description: 'Der niederländische Fahrer zeigt eine beeindruckende Leistung...',
            url: 'https://example.com/news2',
            imageUrl: 'https://via.placeholder.com/400x200',
            publishedAt: '2024-01-15T09:30:00Z',
            source: 'ESPN',
            author: 'F1 Reporter'
          },
          {
            id: '3',
            title: 'Bundesliga: Spannende Rückrunde erwartet',
            description: 'Die zweite Saisonhälfte verspricht viele Überraschungen...',
            url: 'https://example.com/news3',
            imageUrl: 'https://via.placeholder.com/400x200',
            publishedAt: '2024-01-15T08:15:00Z',
            source: 'Sport1.de',
            author: 'Bundesliga Expert'
          }
        ]
      }
    })
  }
}));

// Mock the auth store
vi.mock('../store/useAuthStore', () => ({
  useAuthStore: () => ({ user: mockUser })
}));

const meta: Meta<typeof NewsWidget> = {
  title: 'News/NewsWidget',
  component: NewsWidget,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Compact news widget for homepage integration with loading states and error handling.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      description: 'Additional CSS classes',
      control: 'text'
    },
    maxArticles: {
      description: 'Maximum number of articles to display',
      control: { type: 'number', min: 1, max: 10 }
    },
    showViewAll: {
      description: 'Show "View All" button',
      control: 'boolean'
    },
    onViewAll: {
      description: 'Callback when "View All" is clicked',
      action: 'viewAllClicked'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

// Stories
export const Default: Story = {
  args: {}
};

export const TwoArticles: Story = {
  args: {
    maxArticles: 2
  }
};

export const FiveArticles: Story = {
  args: {
    maxArticles: 5
  }
};

export const NoViewAll: Story = {
  args: {
    showViewAll: false
  }
};

export const WithCustomClass: Story = {
  args: {
    className: 'border-2 border-blue-500 rounded-lg p-4'
  }
};

export const LoadingState: Story = {
  render: () => {
    // Mock loading state - use require for synchronous access
    const { newsApi } = require('../lib/api');
    vi.mocked(newsApi.getNews).mockImplementation(
      () => new Promise(() => {}) // Never resolves to simulate loading
    );
    
    return <NewsWidget />;
  }
};

export const ErrorState: Story = {
  render: () => {
    // Mock error state - use require for synchronous access
    const { newsApi } = require('../lib/api');
    vi.mocked(newsApi.getNews).mockRejectedValue(
      new Error('API Error')
    );
    
    return <NewsWidget />;
  }
};

export const NoUser: Story = {
  render: () => {
    // Mock no user state - use require for synchronous access
    const { useAuthStore } = require('../store/useAuthStore');
    vi.mocked(useAuthStore).mockReturnValue({
      user: null
    });
    
    return <NewsWidget />;
  }
};

export const NoTeams: Story = {
  render: () => {
    // Mock user with no teams - use require for synchronous access
    const { useAuthStore } = require('../store/useAuthStore');
    vi.mocked(useAuthStore).mockReturnValue({
      user: { ...mockUser, selectedTeams: [] }
    });
    
    return <NewsWidget />;
  }
};
