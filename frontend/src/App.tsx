/**
 * SPORTSKALENDAR - MAIN APP COMPONENT
 * 
 * Hauptkomponente der Sportskalendar-Anwendung.
 * Verwaltet Routing, Authentifizierung, Theme und globale App-Zustände.
 * 
 * Features:
 * - Single Page Application (SPA) mit client-side routing
 * - Authentifizierung mit JWT und Refresh Tokens
 * - Dark/Light Theme Support mit System-Präferenz
 * - SEO-optimiert mit dynamischen Meta-Tags
 * - Ad-Management für Premium/Standard Nutzer
 * - Responsive Design mit Tailwind CSS
 */

import { useEffect, useState } from 'react';
import { useAuthStore } from './store/useAuthStore';
import { useThemeStore } from './store/useThemeStore';
import { userApi } from './lib/api';

// Authentication Components
import { AuthModal } from './components/Auth/AuthModal';

// Layout Components
import { Header } from './components/Layout/Header';
import { Footer } from './components/Layout/Footer';
import { CookieBanner } from './components/Layout/CookieBanner';

// SEO Components
import { SEOProvider, useSEO } from './components/SEO/SEOProvider';

// Page Components
import { Calendar } from './components/Pages/Calendar';
import { Live } from './components/Pages/Live';
import { Highlights } from './components/Pages/Highlights';
import { Premium } from './components/Pages/Premium';
import { Admin } from './components/Pages/Admin';
import { Settings } from './components/Pages/Settings';
import CalendarSync from './components/Pages/CalendarSync';
import { LandingPage } from './components/Pages/LandingPage';
import Privacy from './components/Pages/Privacy';
import Contact from './components/Pages/Contact';

// SEO & Ads
import { PageSEO } from './components/SEO/PageSEO';
import { AdManager, useAdTrigger, SportsKalendarInterstitial } from './components/Ads/AdManager';

// Type Definitions
type AuthView = 'login' | 'register' | null; // Auth Modal Ansicht (Login, Register oder geschlossen)
type Page = 'calendar' | 'live' | 'highlights' | 'premium' | 'admin' | 'settings' | 'calendar-sync' | 'privacy' | 'contact'; // Verfügbare Seiten

function AppContent() {
  // Global State Management
  const { user, isAuthenticated, setUser, setLoading } = useAuthStore(); // Authentifizierungs-State aus Zustand Store
  const { setTheme } = useThemeStore(); // Theme (Dark/Light Mode) aus Zustand Store
  const { updateSEO } = useSEO(); // SEO Hook für dynamische Meta-Tags
  
  // Local Component State
  const [authView, setAuthView] = useState<AuthView | null>(null); // Aktuell angezeigte Auth-Ansicht
  const [currentPage, setCurrentPage] = useState<Page>('calendar'); // Aktuell angezeigte Seite (Client-side Routing)
  const [isInitializing, setIsInitializing] = useState(true); // Loading State während Initialisierung
  const { interstitialTrigger } = useAdTrigger(); // Hook für Interstitial Ads (Vollbild-Werbung)

  /**
   * EFFECT: Theme Initialisierung
   * 
   * Lädt das gespeicherte Theme aus localStorage oder verwendet System-Präferenz.
   * Wird nur einmal beim Mount ausgeführt.
   * 
   * Priorität:
   * 1. Gespeichertes Theme aus localStorage
   * 2. System-Präferenz (prefers-color-scheme)
   */
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme-storage');
    if (savedTheme) {
      try {
        const { state } = JSON.parse(savedTheme);
        setTheme(state.isDark);
      } catch {
        // Fallback zu System-Präferenz bei Parse-Fehler
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark);
      }
    } else {
      // Kein gespeichertes Theme -> System-Präferenz verwenden
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark);
    }
  }, [setTheme]);

  /**
   * EFFECT: Authentifizierungs-Check beim App-Start
   * 
   * Überprüft beim Mount, ob der User noch authentifiziert ist und lädt aktuelle Profildaten.
   * Blockiert die App NICHT - läuft im Hintergrund.
   * 
   * Flow:
   * 1. Wenn User im Store vorhanden -> Profil vom Backend laden
   * 2. Bei Fehler -> User ausloggen (Token ungültig)
   * 3. Loading State beenden
   * 
   * Wichtig: Verwendet Refresh Token automatisch über Axios Interceptor
   */
  useEffect(() => {
    const checkAuth = async () => {
      // Nur beim ersten Laden prüfen, nicht bei jedem User-Update
      if (isInitializing && isAuthenticated && user) {
        try {
          // Aktuelles Profil vom Backend laden (inkl. isPremium, selectedTeams)
          const { data } = await userApi.getProfile();
          setUser(data.user);
        } catch (error) {
          console.error('Failed to load user profile:', error);
          // Profil konnte nicht geladen werden, aber User bleibt eingeloggt
          // Nur bei echten Auth-Fehlern (401/403) ausloggen, nicht bei Netzwerk-Fehlern
          if (error && typeof error === 'object' && 'response' in error) {
            const status = (error as any).response?.status;
            if (status === 401 || status === 403) {
              setUser(null);
            }
          }
        }
      }
      setLoading(false);
      setIsInitializing(false);
    };

    checkAuth();
  }, [isInitializing, setLoading, setUser]); // Entfernt isAuthenticated und user aus Dependencies

  /**
   * EFFECT: Navigation nach erfolgreichem Login
   * 
   * Navigiert zur Calendar-Seite, wenn User sich erfolgreich anmeldet.
   * Besonders wichtig für Mobile Devices, wo die Navigation manchmal nicht funktioniert.
   * Nur ausführen wenn User auf einer nicht-authentifizierten Seite ist.
   */
  useEffect(() => {
    if (isAuthenticated && user && !isInitializing && currentPage === 'calendar') {
      // User ist eingeloggt und auf Calendar-Seite -> alles OK
      return;
    }
    
    if (isAuthenticated && user && !isInitializing && !authView) {
      // User ist eingeloggt, kein Auth-Modal offen, aber nicht auf Calendar-Seite
      // Nur navigieren wenn es sich um eine Authentifizierung handelt, nicht um normale Navigation
      const isAuthPage = currentPage === 'calendar' || currentPage === 'live' || currentPage === 'highlights' || currentPage === 'settings' || currentPage === 'calendar-sync';
      if (!isAuthPage) {
        setCurrentPage('calendar');
      }
    }
  }, [isAuthenticated, user, isInitializing, authView, currentPage]);

  /**
   * EFFECT: SEO Update
   * 
   * Aktualisiert SEO-Meta-Tags basierend auf aktueller Seite und User-Daten.
   * Dynamische SEO-Optimierung für bessere Suchmaschinen-Rankings.
   */
  useEffect(() => {
    const dynamicContent = {
      teamCount: user?.selectedTeams?.length || 0,
      sportTypes: user?.selectedTeams?.map((t: any) => t.sport) || [],
      upcomingEvents: 0 // Could be calculated from actual events
    };

    updateSEO(currentPage, user, dynamicContent);
  }, [currentPage, user, updateSEO]);

  /**
   * RENDER: Loading Screen
   * 
   * Zeigt einen Spinner während der App-Initialisierung.
   * Wird nur beim ersten Laden angezeigt.
   */
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Lädt...</p>
        </div>
      </div>
    );
  }

  /**
   * RENDER: Auth Modal View
   * 
   * Zeigt die Landing Page mit Login/Register Modal.
   * Wird angezeigt wenn User auf "Anmelden" oder "Registrieren" klickt.
   */
  if (authView === 'login' || authView === 'register') {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full">
            <LandingPage 
              onShowLogin={() => setAuthView('login')} 
              onShowRegister={() => setAuthView('register')} 
            />
          </div>
        </div>
        <AuthModal
          onClose={() => setAuthView(null)}
          onSuccess={() => {
            // After successful login, close auth modal
            setAuthView(null);
            // Don't force navigation - let the useEffect handle it
          }}
          initialMode={authView}
        />
      </>
    );
  }

  /**
   * RENDER: Main App Layout
   * 
   * Hauptlayout der Anwendung mit:
   * - AdManager für Werbeverwaltung (Premium-Nutzer sehen keine Ads)
   * - Header mit Navigation
   * - Main Content Area mit Client-Side Routing
   * - Footer mit Links
   * - Cookie Banner (DSGVO)
   * - Interstitial Ads für Standard-Nutzer
   * 
   * Routing Logic:
   * - Authentifizierte Seiten (Calendar, Live, Highlights, Settings): Zeigen Landing Page für nicht-eingeloggte User
   * - Admin: Nur für User mit role='admin'
   * - Premium, Privacy, Contact: Für alle zugänglich
   */
  return (
    <AdManager>
      <div className="min-h-screen flex flex-col">
        {/* Dynamische SEO Meta-Tags für aktuelle Seite */}
        <PageSEO page={currentPage} user={user} />
        
        {/* Header mit Navigation und Auth-Buttons */}
        <Header 
          currentPage={currentPage as any} 
          onNavigate={setCurrentPage as any}
          onShowLogin={() => setAuthView('login')}
          onShowRegister={() => setAuthView('register')}
        />
        
        {/* Main Content Area - Client-Side Routing */}
        <main className="flex-1">
          {/* Calendar Page - Auth Required */}
          {currentPage === 'calendar' && (user ? <Calendar /> : <LandingPage onShowLogin={() => setAuthView('login')} onShowRegister={() => setAuthView('register')} />)}
          
          {/* Live Page - Auth Required */}
          {currentPage === 'live' && (user ? <Live /> : <LandingPage onShowLogin={() => setAuthView('login')} onShowRegister={() => setAuthView('register')} />)}
          
          {/* Highlights Page - Auth Required */}
          {currentPage === 'highlights' && (user ? <Highlights /> : <LandingPage onShowLogin={() => setAuthView('login')} onShowRegister={() => setAuthView('register')} />)}
          
          {/* Premium Page - Public */}
          {currentPage === 'premium' && <Premium onNavigate={setCurrentPage} />}
          
          {/* Admin Page - Admin Role Required */}
          {currentPage === 'admin' && user?.role === 'admin' ? (
            <Admin />
          ) : currentPage === 'admin' ? (
            <div className="card p-12 text-center">
              <h2 className="text-2xl font-bold mb-4">🔒 Zugriff verweigert</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Nur Administratoren können auf diese Seite zugreifen.
              </p>
              <button 
                onClick={() => setCurrentPage('calendar')}
                className="btn btn-primary"
              >
                Zurück zum Kalender
              </button>
            </div>
          ) : null}
          
          {/* Settings Page - Auth Required */}
          {currentPage === 'settings' && user ? <Settings /> : currentPage === 'settings' ? (
            <div className="card p-12 text-center">
              <h2 className="text-2xl font-bold mb-4">🔒 Anmeldung erforderlich</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Bitte melden Sie sich an, um auf die Einstellungen zuzugreifen.
              </p>
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={() => setAuthView('login')}
                  className="btn btn-primary"
                >
                  Anmelden
                </button>
                <button 
                  onClick={() => setCurrentPage('calendar')}
                  className="btn btn-secondary"
                >
                  Zurück zum Kalender
                </button>
              </div>
            </div>
          ) : null}
          
          {/* Calendar Sync Page - Premium Required */}
          {currentPage === 'calendar-sync' && user ? <CalendarSync /> : currentPage === 'calendar-sync' ? (
            <div className="card p-12 text-center">
              <h2 className="text-2xl font-bold mb-4">🔒 Anmeldung erforderlich</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Bitte melden Sie sich an, um auf die Kalender-Sync-Funktion zuzugreifen.
              </p>
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={() => setAuthView('login')}
                  className="btn btn-primary"
                >
                  Anmelden
                </button>
                <button 
                  onClick={() => setCurrentPage('calendar')}
                  className="btn btn-secondary"
                >
                  Zurück zum Kalender
                </button>
              </div>
            </div>
          ) : null}
          
          {/* Privacy Page - Public */}
          {currentPage === 'privacy' && <Privacy />}
          
          {/* Contact Page - Public */}
          {currentPage === 'contact' && <Contact />}
        </main>

        {/* Footer mit Links zu Privacy, Contact, etc. */}
        <Footer onNavigate={setCurrentPage} />
        
        {/* Cookie Banner für DSGVO-Compliance */}
        <CookieBanner onNavigate={setCurrentPage} />
        
        {/* Interstitial Ad (Vollbild-Werbung) - Nur für Standard-Nutzer */}
        <SportsKalendarInterstitial trigger={interstitialTrigger} />
      </div>
    </AdManager>
  );
}

/**
 * MAIN APP COMPONENT
 * 
 * Wrapper-Komponente, die das SEO-Provider umhüllt.
 * Ermöglicht SEO-Updates in der gesamten App.
 */
function App() {
  return (
    <SEOProvider>
      <AppContent />
    </SEOProvider>
  );
}

export default App;
