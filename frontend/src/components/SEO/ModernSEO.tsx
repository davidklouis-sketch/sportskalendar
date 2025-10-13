import { useEffect } from 'react';

interface SEOConfig {
  // Core SEO
  title: string;
  description: string;
  keywords?: string;
  canonical: string;
  
  // Open Graph
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product' | 'profile';
  ogUrl?: string;
  
  // Twitter
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterSite?: string;
  twitterCreator?: string;
  
  // Additional Meta
  robots?: string;
  author?: string;
  publisher?: string;
  language?: string;
  geoRegion?: string;
  geoPosition?: string;
  
  // Structured Data
  structuredData?: any;
  
  // Performance & UX
  themeColor?: string;
  
  // No Index
  noIndex?: boolean;
  noFollow?: boolean;
  
  // Page Specific
  articlePublishedTime?: string;
  articleModifiedTime?: string;
  articleAuthor?: string;
  articleSection?: string;
  articleTags?: string[];
}

interface ModernSEOProps extends SEOConfig {
  // Dynamic content
  user?: any;
  dynamicContent?: {
    teamCount?: number;
    sportTypes?: string[];
    upcomingEvents?: number;
  };
}

export function ModernSEO({
  title,
  description,
  keywords,
  canonical,
  ogTitle,
  ogDescription,
  ogImage = 'https://sportskalendar.de/og-image.png',
  ogType = 'website',
  ogUrl,
  twitterCard = 'summary_large_image',
  twitterTitle,
  twitterDescription,
  twitterImage,
  twitterSite = '@sportskalendar',
  twitterCreator = '@sportskalendar',
  robots,
  author = 'Sportskalendar Team',
  publisher = 'Sportskalendar',
  language = 'de',
  geoRegion = 'DE',
  geoPosition,
  structuredData,
  themeColor = '#4f46e5',
  noIndex = false,
  noFollow = false,
  articlePublishedTime,
  articleModifiedTime,
  articleAuthor,
  articleSection,
  articleTags,
  user,
  dynamicContent
}: ModernSEOProps) {
  
  useEffect(() => {
    // Enhanced title with dynamic content
    let enhancedTitle = title;
    if (dynamicContent?.teamCount) {
      enhancedTitle = `${title} - ${dynamicContent.teamCount} Teams verfolgen`;
    }
    
    // Enhanced description with user context
    let enhancedDescription = description;
    if (user?.selectedTeams?.length) {
      const teamNames = user.selectedTeams.map((t: any) => t.teamName).join(', ');
      enhancedDescription = `${description} Verfolge ${teamNames} und mehr!`;
    }
    
    // Update document title
    document.title = enhancedTitle;
    
    // Core Meta Tags
    updateMetaTag('name', 'description', enhancedDescription);
    updateMetaTag('name', 'keywords', keywords || '');
    updateMetaTag('name', 'author', author);
    updateMetaTag('name', 'publisher', publisher);
    updateMetaTag('name', 'language', language);
    updateMetaTag('name', 'geo.region', geoRegion);
    if (geoPosition) {
      updateMetaTag('name', 'geo.position', geoPosition);
    }
    
    // Robots meta tag with modern directives
    const robotsContent = noIndex 
      ? 'noindex, nofollow, noarchive, nosnippet, noimageindex'
      : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1, max-video-preview:-1';
    updateMetaTag('name', 'robots', robotsContent);
    
    // Open Graph Meta Tags
    updateMetaTag('property', 'og:type', ogType);
    updateMetaTag('property', 'og:title', ogTitle || enhancedTitle);
    updateMetaTag('property', 'og:description', ogDescription || enhancedDescription);
    updateMetaTag('property', 'og:url', ogUrl || canonical);
    updateMetaTag('property', 'og:site_name', 'Sportskalendar');
    updateMetaTag('property', 'og:image', ogImage);
    updateMetaTag('property', 'og:image:width', '1200');
    updateMetaTag('property', 'og:image:height', '630');
    updateMetaTag('property', 'og:image:alt', `${enhancedTitle} - Sportskalendar`);
    updateMetaTag('property', 'og:locale', 'de_DE');
    updateMetaTag('property', 'og:updated_time', new Date().toISOString());
    
    // Twitter Card Meta Tags
    updateMetaTag('name', 'twitter:card', twitterCard);
    updateMetaTag('name', 'twitter:site', twitterSite);
    updateMetaTag('name', 'twitter:creator', twitterCreator);
    updateMetaTag('name', 'twitter:title', twitterTitle || enhancedTitle);
    updateMetaTag('name', 'twitter:description', twitterDescription || enhancedDescription);
    updateMetaTag('name', 'twitter:image', twitterImage || ogImage);
    updateMetaTag('name', 'twitter:image:alt', `${enhancedTitle} - Sportskalendar`);
    
    // Article specific meta tags
    if (ogType === 'article') {
      if (articlePublishedTime) {
        updateMetaTag('property', 'article:published_time', articlePublishedTime);
      }
      if (articleModifiedTime) {
        updateMetaTag('property', 'article:modified_time', articleModifiedTime);
      }
      if (articleAuthor) {
        updateMetaTag('property', 'article:author', articleAuthor);
      }
      if (articleSection) {
        updateMetaTag('property', 'article:section', articleSection);
      }
      if (articleTags) {
        articleTags.forEach(tag => {
          addMetaTag('property', 'article:tag', tag);
        });
      }
    }
    
    // Canonical URL
    updateCanonicalUrl(canonical);
    
    // Theme color
    updateMetaTag('name', 'theme-color', themeColor);
    
    // Structured Data
    if (structuredData) {
      addStructuredData(structuredData);
    }
    
    // Performance hints
    addPerformanceHints();
    
  }, [
    title, description, keywords, canonical, ogTitle, ogDescription, ogImage, ogType, ogUrl,
    twitterCard, twitterTitle, twitterDescription, twitterImage, twitterSite, twitterCreator,
    robots, author, publisher, language, geoRegion, geoPosition, structuredData, themeColor,
    noIndex, noFollow, articlePublishedTime, articleModifiedTime, articleAuthor, articleSection,
    articleTags, user, dynamicContent
  ]);
  
  return null;
}

// Helper functions
function updateMetaTag(attribute: string, value: string, content: string) {
  if (!content) return;
  
  let metaTag = document.querySelector(`meta[${attribute}="${value}"]`);
  
  if (!metaTag) {
    metaTag = document.createElement('meta');
    metaTag.setAttribute(attribute, value);
    document.head.appendChild(metaTag);
  }
  
  metaTag.setAttribute('content', content);
}

function addMetaTag(attribute: string, value: string, content: string) {
  if (!content) return;
  
  const metaTag = document.createElement('meta');
  metaTag.setAttribute(attribute, value);
  metaTag.setAttribute('content', content);
  document.head.appendChild(metaTag);
}

function updateCanonicalUrl(url: string) {
  let canonicalTag = document.querySelector('link[rel="canonical"]');
  
  if (!canonicalTag) {
    canonicalTag = document.createElement('link');
    canonicalTag.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalTag);
  }
  
  canonicalTag.setAttribute('href', url);
}

function addStructuredData(data: any) {
  // Remove existing structured data
  const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
  existingScripts.forEach(script => {
    if (script.getAttribute('data-seo') === 'dynamic') {
      script.remove();
    }
  });
  
  // Add new structured data
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute('data-seo', 'dynamic');
  script.textContent = JSON.stringify(data, null, 2);
  document.head.appendChild(script);
}

function addPerformanceHints() {
  // Add performance hints for better Core Web Vitals
  const hints = [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true },
    { rel: 'dns-prefetch', href: 'https://api.sportskalendar.de' },
    { rel: 'dns-prefetch', href: 'https://r2.thesportsdb.com' },
    { rel: 'dns-prefetch', href: 'https://api.jolpi.ca' }
  ];
  
  hints.forEach(hint => {
    let link = document.querySelector(`link[rel="${hint.rel}"][href="${hint.href}"]`);
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', hint.rel);
      link.setAttribute('href', hint.href);
      if (hint.crossorigin) {
        link.setAttribute('crossorigin', 'anonymous');
      }
      document.head.appendChild(link);
    }
  });
}

export default ModernSEO;
