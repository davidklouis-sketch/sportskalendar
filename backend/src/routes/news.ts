/**
 * NEWS ROUTES
 * 
 * Handles news API endpoints for fetching sports news
 * based on user's selected teams.
 */

import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { parseString } from 'xml2js';

const newsRouter = Router();

// NewsAPI configuration
const NEWS_API_KEY = process.env.NEWS_API_KEY || '';
const NEWS_API_BASE_URL = 'https://newsapi.org/v2/everything';

// Cache for news requests to prevent duplicate API calls
const newsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

// Cache for RSS feeds to avoid rate limiting
const rssCache = new Map<string, { data: any[]; timestamp: number }>();
const RSS_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes cache for RSS

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
  'dailymail.co.uk/sport',
  'sportbild.de',
  'spox.com',
  'ran.de',
  'sport.de',
  'eurosport.de',
  'welt.de/sport',
  'spiegel.de/sport',
  'faz.net/sport',
  'zeit.de/sport'
];

// RSS Feed sources as fallback
const RSS_FEEDS = [
  {
    name: 'Kicker.de',
    url: 'https://newsfeed.kicker.de/news/aktuell',
    sport: 'Fußball'
  },
  {
    name: 'Sport1.de',
    url: 'https://www.sport1.de/rss.xml',
    sport: 'Allgemein'
  },
  {
    name: 'ESPN',
    url: 'https://www.espn.com/espn/rss/news',
    sport: 'Allgemein'
  },
  {
    name: 'Sky Sports',
    url: 'https://feeds.skynews.com/feeds/rss/sports.xml',
    sport: 'Allgemein'
  }
];

// Helper function to fetch RSS feed with caching
async function fetchRSSFeed(feed: typeof RSS_FEEDS[0]): Promise<any[]> {
  // Check cache first
  const cached = rssCache.get(feed.url);
  if (cached && Date.now() - cached.timestamp < RSS_CACHE_DURATION) {
    console.log(`[RSS] Using cached data for ${feed.name}`);
    return cached.data;
  }

  try {
    const response = await fetch(feed.url);
    if (!response.ok) return [];
    
    const xmlText = await response.text();
    
    return new Promise((resolve) => {
      parseString(xmlText, (err, result) => {
        if (err) {
          console.error(`Error parsing RSS feed ${feed.name}:`, err);
          resolve([]);
          return;
        }
        
        const items = result?.rss?.channel?.[0]?.item || [];
        const articles = items.slice(0, 5).map((item: any) => ({
          title: item.title?.[0] || '',
          description: item.description?.[0] || item.title?.[0] || '',
          url: item.link?.[0] || '',
          publishedAt: item.pubDate?.[0] || new Date().toISOString(),
          source: feed.name,
          urlToImage: null
        }));
        
        // Cache the result
        rssCache.set(feed.url, {
          data: articles,
          timestamp: Date.now()
        });
        
        resolve(articles);
      });
    });
  } catch (error) {
    console.error(`Error fetching RSS feed ${feed.name}:`, error);
    return [];
  }
}

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

    console.log(`[News API] User: ${user.email}, SelectedTeams:`, selectedTeams);

    if (!selectedTeams || !Array.isArray(selectedTeams) || selectedTeams.length === 0) {
      console.log('[News API] No teams selected, returning 400');
      return res.status(400).json({
        error: 'No teams selected',
        message: 'Please select teams to get news'
      });
    }

    // Create cache key based on selected teams
    const cacheKey = `news_${user.id}_${JSON.stringify(selectedTeams)}`;
    const cached = newsCache.get(cacheKey);
    
    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`[News API] Returning cached data for user ${user.email}`);
      return res.json(cached.data);
    }

    // Check if NewsAPI key is configured
    console.log(`[News API] NEWS_API_KEY configured: ${NEWS_API_KEY ? 'YES' : 'NO'}`);
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

    // Combine all search terms - make it more flexible
    const allSearchTerms = [...searchQueries, ...sportTerms].filter(term => term && term.trim());
    const searchQuery = allSearchTerms.join(' OR ');
    
    // If no specific terms, use general sports terms
    const fallbackQuery = searchQuery || 'sport OR football OR basketball OR tennis';

    console.log(`[News] Fetching news for user ${user.email} with query: ${searchQuery}`);

    // Try multiple search strategies
    let newsData: any = { articles: [] };
    
    // Strategy 1: Search with specific domains (more restrictive)
    try {
      const newsApiUrl = new URL(NEWS_API_BASE_URL);
      newsApiUrl.searchParams.set('q', searchQuery || fallbackQuery);
      newsApiUrl.searchParams.set('domains', SPORTS_DOMAINS.slice(0, 10).join(',')); // Limit domains to avoid URL too long
      newsApiUrl.searchParams.set('language', 'de,en');
      newsApiUrl.searchParams.set('sortBy', 'publishedAt');
      newsApiUrl.searchParams.set('pageSize', '10');
      newsApiUrl.searchParams.set('apiKey', NEWS_API_KEY);

      console.log(`[News API] Making request to: ${newsApiUrl.toString().replace(NEWS_API_KEY, '***')}`);
      const response = await fetch(newsApiUrl.toString());
      
      if (response.ok) {
        newsData = await response.json();
        console.log(`[News API] Received ${newsData.articles?.length || 0} articles from NewsAPI with domains`);
      } else {
        const errorText = await response.text();
        console.error(`NewsAPI error: ${response.status} - ${errorText}`);
        
        if (response.status === 429) {
          console.log('[News API] Rate limit exceeded, trying fallback...');
        }
      }
    } catch (error) {
      console.error('[News API] Error with domains search:', error);
    }
    
    // Strategy 2: If no articles found with domains, try broader search without domains
    if (!newsData.articles || newsData.articles.length === 0) {
      console.log('[News API] No articles found with specific domains, trying broader search...');
      
      try {
        const broaderUrl = new URL(NEWS_API_BASE_URL);
        broaderUrl.searchParams.set('q', searchQuery || fallbackQuery);
        broaderUrl.searchParams.set('language', 'de,en');
        broaderUrl.searchParams.set('sortBy', 'publishedAt');
        broaderUrl.searchParams.set('pageSize', '15');
        broaderUrl.searchParams.set('apiKey', NEWS_API_KEY);
        
        const broaderResponse = await fetch(broaderUrl.toString());
        if (broaderResponse.ok) {
          newsData = await broaderResponse.json();
          console.log(`[News API] Broader search returned ${newsData.articles?.length || 0} articles`);
        } else {
          console.error(`[News API] Broader search failed: ${broaderResponse.status}`);
        }
      } catch (error) {
        console.error('[News API] Error with broader search:', error);
      }
    }
    
    // Strategy 3: If still no articles, try very general sports search
    if (!newsData.articles || newsData.articles.length === 0) {
      console.log('[News API] No articles found with team search, trying general sports search...');
      
      try {
        const generalUrl = new URL(NEWS_API_BASE_URL);
        generalUrl.searchParams.set('q', 'sport OR football OR basketball OR f1');
        generalUrl.searchParams.set('language', 'de,en');
        generalUrl.searchParams.set('sortBy', 'publishedAt');
        generalUrl.searchParams.set('pageSize', '10');
        generalUrl.searchParams.set('apiKey', NEWS_API_KEY);
        
        const generalResponse = await fetch(generalUrl.toString());
        if (generalResponse.ok) {
          newsData = await generalResponse.json();
          console.log(`[News API] General sports search returned ${newsData.articles?.length || 0} articles`);
        }
      } catch (error) {
        console.error('[News API] Error with general search:', error);
      }
    }

    // Filter and format news articles
    const formattedNews = (newsData.articles || [])
      .filter((article: any) => {
        // More lenient filtering - only require title and url
        return article.title && 
               article.url && 
               article.publishedAt;
      })
      .map((article: any) => ({
        id: article.url, // Use URL as unique ID
        title: article.title,
        description: article.description || article.title, // Use title as fallback for description
        url: article.url,
        imageUrl: article.urlToImage || null, // Allow null images
        publishedAt: article.publishedAt,
        source: article.source?.name || 'Unknown',
        author: article.author || null,
        content: article.content || null
      }))
      .slice(0, 10); // Limit to 10 most relevant articles

    console.log(`[News] Successfully fetched ${formattedNews.length} news articles for user ${user.email}`);

    // If no articles found from NewsAPI, try RSS feeds as fallback
    if (formattedNews.length === 0) {
      console.log('[News] No articles found from NewsAPI, trying RSS feeds as fallback...');
      
      try {
        const rssPromises = RSS_FEEDS.map(feed => fetchRSSFeed(feed));
        const rssResults = await Promise.all(rssPromises);
        const rssArticles = rssResults.flat();
        
        // Filter RSS articles by team names if possible
        const filteredRssArticles = rssArticles.filter(article => {
          const searchText = (article.title + ' ' + article.description).toLowerCase();
          return allSearchTerms.some(term => 
            searchText.includes(term.toLowerCase())
          );
        });
        
        // If no filtered articles, use general sports articles
        const finalRssArticles = filteredRssArticles.length > 0 ? filteredRssArticles : rssArticles;
        
        const formattedRssNews = finalRssArticles.slice(0, 10).map((article: any) => ({
          id: article.url,
          title: article.title,
          description: article.description,
          url: article.url,
          imageUrl: article.urlToImage,
          publishedAt: article.publishedAt,
          source: article.source,
          author: null,
          content: null
        }));
        
        if (formattedRssNews.length > 0) {
          console.log(`[News] RSS fallback returned ${formattedRssNews.length} articles`);
          return res.json({
            success: true,
            news: formattedRssNews,
            totalResults: formattedRssNews.length,
            query: searchQuery,
            source: 'RSS'
          });
        }
      } catch (error) {
        console.error('[News] Error fetching RSS feeds:', error);
      }
      
      console.log('[News] No articles found after all search strategies including RSS');
      return res.json({
        success: true,
        news: [],
        totalResults: 0,
        query: searchQuery,
        message: 'Keine aktuellen Nachrichten für deine Teams gefunden. Versuche es später erneut.'
      });
    }

    const responseData = {
      success: true,
      news: formattedNews,
      totalResults: newsData.totalResults || formattedNews.length,
      query: searchQuery
    };

    // Cache the response
    newsCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });

    // Clean up old cache entries
    if (newsCache.size > 100) {
      const now = Date.now();
      for (const [key, value] of newsCache.entries()) {
        if (now - value.timestamp > CACHE_DURATION) {
          newsCache.delete(key);
        }
      }
    }

    res.json(responseData);

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
