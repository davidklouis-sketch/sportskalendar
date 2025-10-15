import { SEOHead } from './SEOHead';

interface PageSEOProps {
  page: 'calendar' | 'live' | 'highlights' | 'news' | 'settings' | 'premium' | 'privacy' | 'contact' | 'admin' | 'calendar-sync';
  user?: any;
}

export function PageSEO({ page, user }: PageSEOProps) {
  const seoConfig = {
    calendar: {
      title: 'Kalender - Sportskalendar | Alle Spieltermine deiner Teams',
      description: 'Verwalte alle Spieltermine deiner Lieblingsteams in einem übersichtlichen Kalender. Bundesliga, NFL, F1 und mehr - nie wieder ein Spiel verpassen!',
      keywords: 'Sportkalender, Spieltermine, Bundesliga Termine, NFL Schedule, F1 Kalender, Fußball Termine, Sport Termine',
      canonical: 'https://sportskalendar.de/calendar',
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        'name': 'Sportkalender - Spieltermine',
        'description': 'Übersichtliche Darstellung aller Spieltermine deiner Lieblingsteams',
        'url': 'https://sportskalendar.de/calendar',
        'mainEntity': {
          '@type': 'SportsEvent',
          'name': 'Sportveranstaltungen',
          'description': 'Sammlung aller Sportveranstaltungen und Spieltermine'
        }
      }
    },
    live: {
      title: 'Live-Ticker - Sportskalendar | Live-Spiele verfolgen',
      description: 'Verfolge alle Live-Spiele deiner Teams in Echtzeit. Live-Ticker, Ergebnisse und Statistiken für Bundesliga, NFL, F1 und mehr!',
      keywords: 'Live-Ticker, Live-Spiele, Bundesliga Live, NFL Live, F1 Live, Sport Live, Live Ergebnisse',
      canonical: 'https://sportskalendar.de/live',
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        'name': 'Live-Ticker - Sport Live',
        'description': 'Live-Verfolgung aller Sportveranstaltungen',
        'url': 'https://sportskalendar.de/live',
        'mainEntity': {
          '@type': 'LiveBlogPosting',
          'name': 'Sport Live-Ticker',
          'description': 'Live-Updates zu allen Sportveranstaltungen'
        }
      }
    },
    highlights: {
      title: 'Highlights - Sportskalendar | Die besten Sportmomente',
      description: 'Entdecke die besten Highlights und Nachrichten aus der Sportwelt. Videos, Zusammenfassungen und Top-Momente aus Bundesliga, NFL, F1 und mehr!',
      keywords: 'Sport Highlights, Bundesliga Highlights, NFL Highlights, F1 Highlights, Sport Videos, Sport Nachrichten',
      canonical: 'https://sportskalendar.de/highlights',
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        'name': 'Sport Highlights',
        'description': 'Die besten Momente aus der Sportwelt',
        'url': 'https://sportskalendar.de/highlights',
        'mainEntity': {
          '@type': 'VideoObject',
          'name': 'Sport Highlights',
          'description': 'Sammlung der besten Sportmomente und Highlights'
        }
      }
    },
    news: {
      title: 'Sport-Nachrichten - Sportskalendar | Aktuelle News',
      description: 'Bleib auf dem Laufenden mit aktuellen Sport-Nachrichten. News zu deinen Teams aus Bundesliga, NFL, F1 und mehr - alles an einem Ort!',
      keywords: 'Sport News, Bundesliga News, NFL News, F1 News, Sport Nachrichten, Fußball News, Live News',
      canonical: 'https://sportskalendar.de/news',
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        'name': 'Sport-Nachrichten',
        'description': 'Aktuelle Nachrichten aus der Sportwelt',
        'url': 'https://sportskalendar.de/news',
        'mainEntity': {
          '@type': 'NewsArticle',
          'name': 'Sport News',
          'description': 'Sammlung aktueller Sportnachrichten'
        }
      }
    },
    settings: {
      title: 'Einstellungen - Sportskalendar | Account verwalten',
      description: 'Verwalte deine Sportskalendar-Einstellungen. Account-Details, Sicherheit, Premium-Features und mehr personalisieren.',
      keywords: 'Sportskalendar Einstellungen, Account verwalten, Premium Features, Sicherheit',
      canonical: 'https://sportskalendar.de/settings',
      noIndex: true // Don't index user settings pages
    },
    privacy: {
      title: 'Datenschutz - Sportskalendar | Privacy Policy',
      description: 'Datenschutzerklärung von Sportskalendar. Erfahre, wie wir deine Daten schützen und verarbeiten.',
      keywords: 'Datenschutz, Privacy Policy, Sportskalendar Datenschutz, DSGVO',
      canonical: 'https://sportskalendar.de/privacy',
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        'name': 'Datenschutzerklärung',
        'description': 'Datenschutzerklärung und Privacy Policy von Sportskalendar',
        'url': 'https://sportskalendar.de/privacy'
      }
    },
    contact: {
      title: 'Kontakt - Sportskalendar | Support & Feedback',
      description: 'Kontaktiere das Sportskalendar-Team für Support, Feedback oder Fragen. Wir helfen gerne weiter!',
      keywords: 'Kontakt, Support, Feedback, Sportskalendar Hilfe, Kundenservice',
      canonical: 'https://sportskalendar.de/contact',
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        'name': 'Kontakt - Sportskalendar',
        'description': 'Kontaktmöglichkeiten für Support und Feedback',
        'url': 'https://sportskalendar.de/contact'
      }
    },
    premium: {
      title: 'Premium - Sportskalendar | Upgrade zu Premium',
      description: 'Upgrade zu Premium und genieße unbegrenzte Teams, erweiterte Features und mehr!',
      keywords: 'Premium, Upgrade, Sportskalendar Premium, unbegrenzte Teams, erweiterte Features',
      canonical: 'https://sportskalendar.de/premium',
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'Product',
        'name': 'Sportskalendar Premium',
        'description': 'Premium-Abonnement für erweiterte Sportskalendar-Features',
        'offers': {
          '@type': 'Offer',
          'price': '9.99',
          'priceCurrency': 'EUR',
          'priceValidUntil': '2025-12-31'
        }
      }
    },
    admin: {
      title: 'Admin - Sportskalendar | Verwaltung',
      description: 'Administrationsbereich für Sportskalendar-Betreuer.',
      keywords: 'Admin, Verwaltung, Sportskalendar Admin',
      canonical: 'https://sportskalendar.de/admin',
      noIndex: true // Don't index admin pages
    },
    'calendar-sync': {
      title: 'Kalender-Sync - Sportskalendar | Synchronisiere deine Teams',
      description: 'Synchronisiere deine Lieblings-Teams mit Google Calendar, Outlook oder Apple Calendar. Premium-Feature für automatische Kalender-Updates.',
      keywords: 'Kalender-Sync, Google Calendar, Outlook, Apple Calendar, Team-Synchronisation, Premium-Feature',
      canonical: 'https://sportskalendar.de/calendar-sync',
      noIndex: true // Don't index calendar-sync pages (requires login)
    }
  };

  const config = seoConfig[page];

  // Add user-specific information if available
  if (user && page !== 'settings') {
    config.title = `${config.title} - ${user.displayName}`;
    config.description = `${config.description} Personalisiert für ${user.displayName}.`;
  }

  return <SEOHead {...config} />;
}
