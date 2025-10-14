// Centralized SEO Configuration for all pages
export interface SEOConfig {
  title: string;
  description: string;
  keywords: string;
  canonical: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product' | 'profile';
  structuredData?: any;
  noIndex?: boolean;
  priority?: number;
}

export const SEO_CONFIGS: Record<string, SEOConfig> = {
  // Landing Page
  landing: {
    title: 'Sportskalendar - Dein digitaler Sportkalender für alle Sportarten',
    description: 'Verwalte alle Spiele deiner Lieblingsteams mit Sportskalendar. Live-Ticker, Highlights, Kalender-Sync und Community-Features. Bundesliga, NFL, F1 und mehr!',
    keywords: 'Sportkalender, Sport, Bundesliga, NFL, F1, Fußball, Basketball, Live-Ticker, Highlights, Kalender-Sync, Sportskalendar, sportskalendar.de',
    canonical: 'https://sportskalendar.de/',
    ogImage: 'https://sportskalendar.de/og-homepage.png',
    ogType: 'website',
    priority: 1,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'Sportskalendar',
      'alternateName': ['SportsKalender', 'Sports Kalender'],
      'url': 'https://sportskalendar.de',
      'description': 'Dein digitaler Sportkalender für alle Sportarten. Verwalte Spiele, verfolge Live-Ticker, schaue Highlights und synchronisiere mit deinen Kalender-Apps.',
      'applicationCategory': 'SportsApplication',
      'operatingSystem': 'Web Browser',
      'browserRequirements': 'Requires JavaScript. Requires HTML5.',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'EUR',
        'availability': 'https://schema.org/InStock',
        'validFrom': '2025-01-01'
      },
      'creator': {
        '@type': 'Organization',
        'name': 'Sportskalendar Team',
        'url': 'https://sportskalendar.de',
        'logo': 'https://sportskalendar.de/logo.png'
      },
      'featureList': [
        'Live-Ticker für alle Sportarten',
        'Highlights und Nachrichten',
        'Kalender-Synchronisation',
        'Community-Features',
        'Premium-Account mit erweiterten Features',
        'Team-Management',
        'Multi-Sport Support'
      ],
      'screenshot': 'https://sportskalendar.de/screenshot.png',
      'softwareVersion': '2.0.0',
      'datePublished': '2025-01-01',
      'dateModified': new Date().toISOString(),
      'inLanguage': 'de',
      'isAccessibleForFree': true,
      'publisher': {
        '@type': 'Organization',
        'name': 'Sportskalendar',
        'url': 'https://sportskalendar.de'
      }
    }
  },

  // Calendar Page
  calendar: {
    title: 'Kalender - Sportskalendar | Alle Spieltermine deiner Teams',
    description: 'Verwalte alle Spieltermine deiner Lieblingsteams in einem übersichtlichen Kalender. Bundesliga, NFL, F1 und mehr - nie wieder ein Spiel verpassen!',
    keywords: 'Sportkalender, Spieltermine, Bundesliga Termine, NFL Schedule, F1 Kalender, Fußball Termine, Sport Termine, Team Kalender',
    canonical: 'https://sportskalendar.de/calendar',
    ogImage: 'https://sportskalendar.de/og-calendar.png',
    ogType: 'website',
    priority: 2,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      'name': 'Sportkalender - Spieltermine',
      'description': 'Übersichtliche Darstellung aller Spieltermine deiner Lieblingsteams',
        'url': 'http://localhost:5173/calendar',
      'mainEntity': {
        '@type': 'ItemList',
        'name': 'Sportveranstaltungen',
        'description': 'Sammlung aller Sportveranstaltungen und Spieltermine',
        'numberOfItems': 'unlimited'
      },
      'breadcrumb': {
        '@type': 'BreadcrumbList',
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'Home',
            'item': 'http://localhost:5173/'
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': 'Kalender',
            'item': 'http://localhost:5173/calendar'
          }
        ]
      }
    }
  },

  // Live Page
  live: {
    title: 'Live-Ticker - Sportskalendar | Live-Spiele verfolgen',
    description: 'Verfolge alle Live-Spiele deiner Teams in Echtzeit. Live-Ticker, Ergebnisse und Statistiken für Bundesliga, NFL, F1 und mehr!',
    keywords: 'Live-Ticker, Live-Spiele, Bundesliga Live, NFL Live, F1 Live, Sport Live, Live Ergebnisse, Live Score',
    canonical: 'https://sportskalendar.de/live',
    ogImage: 'https://sportskalendar.de/og-live.png',
    ogType: 'website',
    priority: 2,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      'name': 'Live-Ticker - Sport Live',
      'description': 'Live-Verfolgung aller Sportveranstaltungen',
        'url': 'http://localhost:5173/live',
      'mainEntity': {
        '@type': 'LiveBlogPosting',
        'name': 'Sport Live-Ticker',
        'description': 'Live-Updates zu allen Sportveranstaltungen'
      }
    }
  },

  // Highlights Page
  highlights: {
    title: 'Highlights - Sportskalendar | Die besten Sportmomente',
    description: 'Entdecke die besten Highlights und Momente aus Bundesliga, NFL, F1 und mehr. Videos, Nachrichten und aktuelle Berichte!',
    keywords: 'Sport Highlights, Fußball Highlights, NFL Highlights, F1 Highlights, Sport Videos, Sport Nachrichten',
    canonical: 'https://sportskalendar.de/highlights',
    ogImage: 'https://sportskalendar.de/og-highlights.png',
    ogType: 'website',
    priority: 2,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      'name': 'Sport Highlights',
      'description': 'Die besten Sportmomente und Highlights',
        'url': 'http://localhost:5173/highlights',
      'mainEntity': {
        '@type': 'VideoObject',
        'name': 'Sport Highlights Sammlung',
        'description': 'Sammlung der besten Sportmomente'
      }
    }
  },

  // Premium Page
  premium: {
    title: 'Premium - Sportskalendar | Upgrade zu Premium',
    description: 'Upgrade zu Premium und genieße unbegrenzte Teams, erweiterte Features, Kalender-Sync und mehr! Jetzt Premium werden!',
    keywords: 'Premium, Upgrade, Sportskalendar Premium, unbegrenzte Teams, erweiterte Features, Premium Features',
    canonical: 'https://sportskalendar.de/premium',
    ogImage: 'https://sportskalendar.de/og-premium.png',
    ogType: 'product',
    priority: 3,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      'name': 'Sportskalendar Premium',
      'description': 'Premium-Abonnement für erweiterte Sportskalendar-Features',
      'brand': {
        '@type': 'Brand',
        'name': 'Sportskalendar'
      },
      'offers': {
        '@type': 'Offer',
        'price': '9.99',
        'priceCurrency': 'EUR',
        'priceValidUntil': '2025-12-31',
        'availability': 'https://schema.org/InStock',
        'url': 'https://sportskalendar.de/premium'
      },
      'category': 'Software',
      'audience': {
        '@type': 'Audience',
        'audienceType': 'Sports Fans'
      }
    }
  },

  // Settings Page (No Index)
  settings: {
    title: 'Einstellungen - Sportskalendar',
    description: 'Passe deine Sportskalendar-Einstellungen an. Teams verwalten, Benachrichtigungen einstellen und mehr!',
    keywords: 'Einstellungen, Settings, Teams verwalten, Benachrichtigungen',
    canonical: 'https://sportskalendar.de/settings',
    noIndex: true
  },

  // Privacy Page
  privacy: {
    title: 'Datenschutz - Sportskalendar | Schutz deiner Privatsphäre',
    description: 'Erfahre, wie Sportskalendar deine Daten schützt. Unsere Datenschutzerklärung und Transparenz in der Datenverarbeitung.',
    keywords: 'Datenschutz, Privacy, Datenschutzerklärung, Privatsphäre, DSGVO',
    canonical: 'https://sportskalendar.de/privacy',
    ogImage: 'https://sportskalendar.de/og-privacy.png',
    ogType: 'article',
    priority: 4,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      'name': 'Datenschutzerklärung',
      'description': 'Informationen zum Datenschutz bei Sportskalendar',
        'url': 'http://localhost:5173/privacy',
      'mainEntity': {
        '@type': 'Article',
        'headline': 'Datenschutzerklärung',
        'author': {
          '@type': 'Organization',
          'name': 'Sportskalendar'
        },
        'datePublished': '2025-01-01',
        'dateModified': new Date().toISOString()
      }
    }
  },

  // Contact Page
  contact: {
    title: 'Kontakt - Sportskalendar | Support & Feedback',
    description: 'Kontaktiere das Sportskalendar-Team für Support, Feedback oder Fragen. Wir helfen gerne weiter!',
    keywords: 'Kontakt, Support, Feedback, Sportskalendar Hilfe, Kundenservice, Support Team',
    canonical: 'https://sportskalendar.de/contact',
    ogImage: 'https://sportskalendar.de/og-contact.png',
    ogType: 'website',
    priority: 4,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      'name': 'Kontakt - Sportskalendar',
      'description': 'Kontaktmöglichkeiten für Support und Feedback',
        'url': 'http://localhost:5173/contact',
      'mainEntity': {
        '@type': 'Organization',
        'name': 'Sportskalendar Support',
        'contactPoint': {
          '@type': 'ContactPoint',
          'contactType': 'customer service',
          'availableLanguage': 'German'
        }
      }
    }
  },

  // Admin Page (No Index)
  admin: {
    title: 'Admin - Sportskalendar | Verwaltung',
    description: 'Administrationsbereich für Sportskalendar-Betreuer.',
    keywords: 'Admin, Verwaltung, Sportskalendar Admin',
    canonical: 'https://sportskalendar.de/admin',
    noIndex: true
  },

  // Calendar Sync Page (No Index - Requires Login)
  'calendar-sync': {
    title: 'Kalender-Sync - Sportskalendar | Synchronisiere deine Teams',
    description: 'Synchronisiere deine Lieblings-Teams mit Google Calendar, Outlook oder Apple Calendar. Premium-Feature für automatische Kalender-Updates.',
    keywords: 'Kalender-Sync, Google Calendar, Outlook, Apple Calendar, Team-Synchronisation, Premium-Feature',
    canonical: 'https://sportskalendar.de/calendar-sync',
    noIndex: true
  }
};

// Dynamic SEO generation based on user data
export function generateDynamicSEO(page: string, user?: any, dynamicContent?: any): SEOConfig {
  const baseConfig = SEO_CONFIGS[page];
  if (!baseConfig) return SEO_CONFIGS.landing;

  // Create a copy to avoid mutating the original
  const config = { ...baseConfig };

  // Add user-specific enhancements
  if (user?.selectedTeams?.length) {
    const teamNames = user.selectedTeams.map((t: any) => t.teamName).join(', ');
    
    // Enhance title
    config.title = `${config.title} - Verfolge ${teamNames}`;
    
    // Enhance description
    config.description = `${config.description} Aktuell verfolgst du: ${teamNames}.`;
    
    // Add team-specific keywords
    const teamKeywords = user.selectedTeams.map((t: any) => `${t.teamName} Termine, ${t.teamName} Spiele`).join(', ');
    config.keywords = `${config.keywords}, ${teamKeywords}`;
  }

  // Add dynamic content enhancements
  if (dynamicContent) {
    if (dynamicContent.teamCount) {
      config.title = `${config.title} - ${dynamicContent.teamCount} Teams`;
    }
    
    if (dynamicContent.upcomingEvents) {
      config.description = `${config.description} ${dynamicContent.upcomingEvents} kommende Events.`;
    }
    
    if (dynamicContent.sportTypes?.length) {
      const sportKeywords = dynamicContent.sportTypes.map((sport: string) => `${sport} Termine`).join(', ');
      config.keywords = `${config.keywords}, ${sportKeywords}`;
    }
  }

  return config;
}

export default SEO_CONFIGS;
