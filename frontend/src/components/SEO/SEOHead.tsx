import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  structuredData?: object;
  noIndex?: boolean;
}

export function SEOHead({
  title = 'Sportskalendar - Dein digitaler Sportkalender für alle Sportarten',
  description = 'Verwalte alle Spiele deiner Lieblingsteams mit Sportskalendar. Live-Ticker, Highlights, Kalender-Sync und Community-Features. Bundesliga, NFL, F1 und mehr!',
  keywords = 'Sportkalender, Sport, Bundesliga, NFL, F1, Fußball, Basketball, Live-Ticker, Highlights, Kalender-Sync, Sportskalendar, sportskalendar.de',
  canonical,
  ogImage = 'https://sportskalendar.de/icon-512.png',
  ogType = 'website',
  structuredData,
  noIndex = false
}: SEOHeadProps) {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Update meta description
    updateMetaTag('name', 'description', description);
    updateMetaTag('property', 'og:description', description);
    updateMetaTag('name', 'twitter:description', description);

    // Update meta keywords
    updateMetaTag('name', 'keywords', keywords);

    // Update title tags
    updateMetaTag('property', 'og:title', title);
    updateMetaTag('name', 'twitter:title', title);

    // Update canonical URL
    if (canonical) {
      updateCanonicalUrl(canonical);
    }

    // Update Open Graph image
    updateMetaTag('property', 'og:image', ogImage);
    updateMetaTag('name', 'twitter:image', ogImage);

    // Update Open Graph type
    updateMetaTag('property', 'og:type', ogType);

    // Update robots meta tag
    updateMetaTag('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

    // Add structured data
    if (structuredData) {
      addStructuredData(structuredData);
    }

    // Update Open Graph URL
    if (canonical) {
      updateMetaTag('property', 'og:url', canonical);
    }

  }, [title, description, keywords, canonical, ogImage, ogType, structuredData, noIndex]);

  return null;
}

function updateMetaTag(attribute: string, value: string, content: string) {
  let metaTag = document.querySelector(`meta[${attribute}="${value}"]`);
  
  if (!metaTag) {
    metaTag = document.createElement('meta');
    metaTag.setAttribute(attribute, value);
    document.head.appendChild(metaTag);
  }
  
  metaTag.setAttribute('content', content);
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

function addStructuredData(data: object) {
  // Remove existing structured data script
  const existingScript = document.querySelector('script[type="application/ld+json"]');
  if (existingScript) {
    existingScript.remove();
  }

  // Add new structured data script
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

