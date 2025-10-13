// Advanced Structured Data Components for better SEO

export interface EventStructuredData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  homeTeam: string;
  awayTeam: string;
  sport: string;
  league?: string;
}

export interface TeamStructuredData {
  name: string;
  sport: string;
  league: string;
  description?: string;
  logo?: string;
  website?: string;
}

export interface OrganizationStructuredData {
  name: string;
  url: string;
  logo: string;
  description: string;
  contactPoint?: {
    contactType: string;
    email?: string;
    availableLanguage: string[];
  };
  sameAs?: string[];
}

// Generate Event structured data
export function generateEventStructuredData(events: EventStructuredData[]): any {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': 'Sportveranstaltungen',
    'description': 'Liste aller Sportveranstaltungen',
    'numberOfItems': events.length,
    'itemListElement': events.map((event, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'item': {
        '@type': 'SportsEvent',
        'name': `${event.homeTeam} vs ${event.awayTeam}`,
        'description': event.description,
        'startDate': event.startDate,
        'endDate': event.endDate,
        'location': {
          '@type': 'Place',
          'name': event.location
        },
        'sport': event.sport,
        'homeTeam': {
          '@type': 'SportsTeam',
          'name': event.homeTeam
        },
        'awayTeam': {
          '@type': 'SportsTeam',
          'name': event.awayTeam
        },
        'organizer': {
          '@type': 'Organization',
          'name': event.league || 'Sport League'
        }
      }
    }))
  };
}

// Generate Team structured data
export function generateTeamStructuredData(teams: TeamStructuredData[]): any {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': 'Sportteams',
    'description': 'Liste aller verfolgten Sportteams',
    'numberOfItems': teams.length,
    'itemListElement': teams.map((team, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'item': {
        '@type': 'SportsTeam',
        'name': team.name,
        'sport': team.sport,
        'description': team.description,
        'logo': team.logo,
        'url': team.website,
        'memberOf': {
          '@type': 'SportsOrganization',
          'name': team.league
        }
      }
    }))
  };
}

// Generate Organization structured data
export function generateOrganizationStructuredData(org: OrganizationStructuredData): any {
  const structuredData: any = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': org.name,
    'url': org.url,
    'logo': {
      '@type': 'ImageObject',
      'url': org.logo,
      'width': 200,
      'height': 200
    },
    'description': org.description,
    'foundingDate': '2025-01-01',
    'founder': {
      '@type': 'Organization',
      'name': 'Sportskalendar Team'
    }
  };

  if (org.contactPoint) {
    structuredData.contactPoint = {
      '@type': 'ContactPoint',
      'contactType': org.contactPoint.contactType,
      'availableLanguage': org.contactPoint.availableLanguage
    };
    
    if (org.contactPoint.email) {
      structuredData.contactPoint.email = org.contactPoint.email;
    }
  }

  if (org.sameAs) {
    structuredData.sameAs = org.sameAs;
  }

  return structuredData;
}

// Generate Breadcrumb structured data
export function generateBreadcrumbStructuredData(items: Array<{ name: string; url: string }>): any {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': items.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.name,
      'item': item.url
    }))
  };
}

// Generate FAQ structured data
export function generateFAQStructuredData(faqs: Array<{ question: string; answer: string }>): any {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqs.map(faq => ({
      '@type': 'Question',
      'name': faq.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': faq.answer
      }
    }))
  };
}

// Generate WebSite structured data with search action
export function generateWebSiteStructuredData(siteName: string, siteUrl: string, searchUrl?: string): any {
  const structuredData: any = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': siteName,
    'url': siteUrl,
    'description': 'Dein digitaler Sportkalender für alle Sportarten',
    'inLanguage': 'de',
    'copyrightYear': '2025',
    'creator': {
      '@type': 'Organization',
      'name': 'Sportskalendar Team'
    }
  };

  if (searchUrl) {
    structuredData.potentialAction = {
      '@type': 'SearchAction',
      'target': {
        '@type': 'EntryPoint',
        'urlTemplate': `${searchUrl}?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    };
  }

  return structuredData;
}

// Generate LocalBusiness structured data (if applicable)
export function generateLocalBusinessStructuredData(business: {
  name: string;
  description: string;
  url: string;
  telephone?: string;
  email?: string;
  address?: {
    streetAddress: string;
    addressLocality: string;
    postalCode: string;
    addressCountry: string;
  };
  openingHours?: string[];
  sameAs?: string[];
}): any {
  const structuredData: any = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    'name': business.name,
    'description': business.description,
    'url': business.url
  };

  if (business.telephone) {
    structuredData.telephone = business.telephone;
  }

  if (business.email) {
    structuredData.email = business.email;
  }

  if (business.address) {
    structuredData.address = {
      '@type': 'PostalAddress',
      'streetAddress': business.address.streetAddress,
      'addressLocality': business.address.addressLocality,
      'postalCode': business.address.postalCode,
      'addressCountry': business.address.addressCountry
    };
  }

  if (business.openingHours) {
    structuredData.openingHours = business.openingHours;
  }

  if (business.sameAs) {
    structuredData.sameAs = business.sameAs;
  }

  return structuredData;
}

export default {
  generateEventStructuredData,
  generateTeamStructuredData,
  generateOrganizationStructuredData,
  generateBreadcrumbStructuredData,
  generateFAQStructuredData,
  generateWebSiteStructuredData,
  generateLocalBusinessStructuredData
};
