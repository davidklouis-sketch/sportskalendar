/**
 * NEWS ROUTES
 * 
 * Handles news API endpoints for fetching sports news
 * based on user's selected teams.
 */

import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';

const newsRouter = Router();

// NewsAPI configuration
const NEWS_API_KEY = process.env.NEWS_API_KEY || '';
const NEWS_API_BASE_URL = 'https://newsapi.org/v2/everything';

// Sports news domains for better filtering
const SPORTS_DOMAINS = [
  'kicker.de',
  'sport1.de', 
  'sport.de',
  'transfermarkt.de',
  'bundesliga.com',
  'premierleague.com',
  'nfl.com',
  'nba.com',
  'espn.com',
  'bbc.com/sport',
  'skysports.com',
  'goal.com',
  'football365.com',
  'theguardian.com/football',
  'telegraph.co.uk/sport',
  'independent.co.uk/sport',
  'dailymail.co.uk/sport'
];

/**
 * GET /news - Fetch news for user's selected teams
 * 
 * Fetches sports news from NewsAPI based on user's selected teams.
 * Only returns news from reputable sports sources.
 */
newsRouter.get('/', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user as { id: string; email: string };
    const { selectedTeams } = req.query;

    if (!selectedTeams || !Array.isArray(selectedTeams) || selectedTeams.length === 0) {
      return res.status(400).json({
        error: 'No teams selected',
        message: 'Please select teams to get news'
      });
    }

    // Check if NewsAPI key is configured
    if (!NEWS_API_KEY) {
      console.warn('NEWS_API_KEY not configured, returning empty news array');
      return res.json({
        success: true,
        news: [],
        message: 'News API not configured'
      });
    }

    // Build search query from selected teams
    const searchQueries = (selectedTeams as string[]).map(team => {
      try {
        const teamData = JSON.parse(team);
        return teamData.teamName || teamData.name || team;
      } catch {
        return team;
      }
    });

    // Create search terms for each sport type
    const sportTerms = (selectedTeams as string[]).map(team => {
      try {
        const teamData = JSON.parse(team);
        return teamData.sport || 'sport';
      } catch {
        return 'sport';
      }
    });

    // Combine all search terms
    const allSearchTerms = [...searchQueries, ...sportTerms].filter(term => term && term.trim());
    const searchQuery = allSearchTerms.join(' OR ');

    console.log(`[News] Fetching news for user ${user.email} with query: ${searchQuery}`);

    // Build NewsAPI URL
    const newsApiUrl = new URL(NEWS_API_BASE_URL);
    newsApiUrl.searchParams.set('q', searchQuery);
    newsApiUrl.searchParams.set('domains', SPORTS_DOMAINS.join(','));
    newsApiUrl.searchParams.set('language', 'de,en');
    newsApiUrl.searchParams.set('sortBy', 'publishedAt');
    newsApiUrl.searchParams.set('pageSize', '20');
    newsApiUrl.searchParams.set('apiKey', NEWS_API_KEY);

    // Fetch news from NewsAPI
    const response = await fetch(newsApiUrl.toString());
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`NewsAPI error: ${response.status} - ${errorText}`);
      
      if (response.status === 429) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: 'Too many requests to news API. Please try again later.'
        });
      }
      
      return res.status(response.status).json({
        error: 'News API error',
        message: 'Failed to fetch news from external API'
      });
    }

    const newsData = await response.json();

    // Filter and format news articles
    const formattedNews = (newsData.articles || [])
      .filter((article: any) => {
        // Filter out articles without required fields
        return article.title && 
               article.description && 
               article.url && 
               article.publishedAt &&
               article.urlToImage;
      })
      .map((article: any) => ({
        id: article.url, // Use URL as unique ID
        title: article.title,
        description: article.description,
        url: article.url,
        imageUrl: article.urlToImage,
        publishedAt: article.publishedAt,
        source: article.source?.name || 'Unknown',
        author: article.author,
        content: article.content
      }))
      .slice(0, 10); // Limit to 10 most relevant articles

    console.log(`[News] Successfully fetched ${formattedNews.length} news articles for user ${user.email}`);

    res.json({
      success: true,
      news: formattedNews,
      totalResults: newsData.totalResults || 0,
      query: searchQuery
    });

  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch news'
    });
  }
});

/**
 * GET /news/sources - Get available news sources
 * 
 * Returns list of supported news sources for the news feature.
 */
newsRouter.get('/sources', requireAuth, async (req, res) => {
  try {
    res.json({
      success: true,
      sources: SPORTS_DOMAINS.map(domain => ({
        domain,
        name: domain.replace(/\.(com|de|co\.uk)$/, '').replace(/\./g, ' ').toUpperCase()
      }))
    });
  } catch (error) {
    console.error('Error fetching news sources:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch news sources'
    });
  }
});

export { newsRouter };
