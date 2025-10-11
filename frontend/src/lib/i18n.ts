// Internationalization (i18n) system for Sportskalendar

export type Language = 'de' | 'en';

export interface Translations {
  // Navigation
  calendar: string;
  live: string;
  highlights: string;
  premium: string;
  settings: string;
  admin: string;
  
  // Auth
  login: string;
  register: string;
  logout: string;
  email: string;
  password: string;
  displayName: string;
  keepLoggedIn: string;
  
  // Calendar
  myTeams: string;
  addTeam: string;
  noTeamsAdded: string;
  upcomingGames: string;
  noEventsAvailable: string;
  loadingEvents: string;
  highlightsNews: string;
  currentHighlights: string;
  premiumUsersNoAds: string;
  automaticUpdate: string;
  
  // Sports
  football: string;
  formula1: string;
  nfl: string;
  nba: string;
  nhl: string;
  mlb: string;
  tennis: string;
  
  // Premium
  upgradeToPremium: string;
  premiumFeatures: string;
  adFreeExperience: string;
  advancedStatistics: string;
  prioritySupport: string;
  exclusiveFeatures: string;
  extendedCalendarFeatures: string;
  premiumHighlights: string;
  
  // Settings
  myAccount: string;
  selectedTeams: string;
  premiumStatus: string;
  changePassword: string;
  deleteAccount: string;
  
  // Admin
  adminDashboard: string;
  userManagement: string;
  premiumRequired: string;
  freeUsersOneTeam: string;
  upgradeToPremiumForMultiple: string;
  
  // Common
  loading: string;
  error: string;
  success: string;
  cancel: string;
  confirm: string;
  save: string;
  delete: string;
  edit: string;
  done: string;
  close: string;
}

export const translations: Record<Language, Translations> = {
  de: {
    // Navigation
    calendar: 'Kalender',
    live: 'Live',
    highlights: 'Highlights',
    premium: 'Premium',
    settings: 'Einstellungen',
    admin: 'Admin',
    
    // Auth
    login: 'Anmelden',
    register: 'Registrieren',
    logout: 'Abmelden',
    email: 'E-Mail',
    password: 'Passwort',
    displayName: 'Anzeigename',
    keepLoggedIn: 'Angemeldet bleiben',
    
    // Calendar
    myTeams: 'Meine Teams',
    addTeam: 'Team hinzufügen',
    noTeamsAdded: 'Noch keine Teams hinzugefügt',
    upcomingGames: 'kommende Spiele',
    noEventsAvailable: 'Keine Events verfügbar',
    loadingEvents: 'Lade Events...',
    highlightsNews: 'Highlights & News',
    currentHighlights: 'Aktuelle Highlights für deine Teams',
    premiumUsersNoAds: 'Premium-Nutzer sehen keine Werbung',
    automaticUpdate: 'Automatische Aktualisierung alle 30 Sekunden',
    
    // Sports
    football: 'Fußball',
    formula1: 'Formel 1',
    nfl: 'NFL',
    nba: 'NBA',
    nhl: 'NHL',
    mlb: 'MLB',
    tennis: 'Tennis',
    
    // Premium
    upgradeToPremium: 'Auf Premium upgraden',
    premiumFeatures: 'Premium-Features',
    adFreeExperience: 'Werbefreie Erfahrung',
    advancedStatistics: 'Erweiterte Statistiken',
    prioritySupport: 'Prioritäts-Support',
    exclusiveFeatures: 'Exklusive Features',
    extendedCalendarFeatures: 'Erweiterte Kalender-Features',
    premiumHighlights: 'Premium-Highlights',
    
    // Settings
    myAccount: 'Mein Konto',
    selectedTeams: 'Ausgewählte Teams',
    premiumStatus: 'Premium-Status',
    changePassword: 'Passwort ändern',
    deleteAccount: 'Konto löschen',
    
    // Admin
    adminDashboard: 'Admin Dashboard',
    userManagement: 'User-Verwaltung',
    premiumRequired: 'Premium erforderlich',
    freeUsersOneTeam: 'Du kannst als kostenloser Nutzer nur ein Team auswählen',
    upgradeToPremiumForMultiple: 'Möchtest du zu Premium upgraden?',
    
    // Common
    loading: 'Lädt...',
    error: 'Fehler',
    success: 'Erfolgreich',
    cancel: 'Abbrechen',
    confirm: 'Bestätigen',
    save: 'Speichern',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    done: 'Fertig',
    close: 'Schließen',
  },
  
  en: {
    // Navigation
    calendar: 'Calendar',
    live: 'Live',
    highlights: 'Highlights',
    premium: 'Premium',
    settings: 'Settings',
    admin: 'Admin',
    
    // Auth
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    email: 'Email',
    password: 'Password',
    displayName: 'Display Name',
    keepLoggedIn: 'Keep me logged in',
    
    // Calendar
    myTeams: 'My Teams',
    addTeam: 'Add Team',
    noTeamsAdded: 'No teams added yet',
    upcomingGames: 'upcoming games',
    noEventsAvailable: 'No events available',
    loadingEvents: 'Loading events...',
    highlightsNews: 'Highlights & News',
    currentHighlights: 'Current highlights for your teams',
    premiumUsersNoAds: 'Premium users see no ads',
    automaticUpdate: 'Automatic update every 30 seconds',
    
    // Sports
    football: 'Football',
    formula1: 'Formula 1',
    nfl: 'NFL',
    nba: 'NBA',
    nhl: 'NHL',
    mlb: 'MLB',
    tennis: 'Tennis',
    
    // Premium
    upgradeToPremium: 'Upgrade to Premium',
    premiumFeatures: 'Premium Features',
    adFreeExperience: 'Ad-free experience',
    advancedStatistics: 'Advanced statistics',
    prioritySupport: 'Priority support',
    exclusiveFeatures: 'Exclusive features',
    extendedCalendarFeatures: 'Extended calendar features',
    premiumHighlights: 'Premium highlights',
    
    // Settings
    myAccount: 'My Account',
    selectedTeams: 'Selected Teams',
    premiumStatus: 'Premium Status',
    changePassword: 'Change Password',
    deleteAccount: 'Delete Account',
    
    // Admin
    adminDashboard: 'Admin Dashboard',
    userManagement: 'User Management',
    premiumRequired: 'Premium required',
    freeUsersOneTeam: 'You can only select one team as a free user',
    upgradeToPremiumForMultiple: 'Would you like to upgrade to Premium?',
    
    // Common
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    done: 'Done',
    close: 'Close',
  },
};

// Language detection and storage
const getStoredLanguage = (): Language => {
  if (typeof window === 'undefined') return 'de';
  const stored = localStorage.getItem('sportskalendar-language');
  return (stored as Language) || 'de';
};

const setStoredLanguage = (language: Language): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('sportskalendar-language', language);
};

// Current language state
let currentLanguage: Language = getStoredLanguage();

// Translation function
export const t = (key: keyof Translations): string => {
  return translations[currentLanguage][key];
};

// Language management
export const setLanguage = (language: Language): void => {
  currentLanguage = language;
  setStoredLanguage(language);
  
  // Trigger language change event
  window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language } }));
};

export const getCurrentLanguage = (): Language => {
  return currentLanguage;
};

// Initialize language on load
if (typeof window !== 'undefined') {
  currentLanguage = getStoredLanguage();
}
