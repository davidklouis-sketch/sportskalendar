import { useEffect, useState } from 'react';
import { useAuthStore } from './store/useAuthStore';
import { useThemeStore } from './store/useThemeStore';
import { userApi } from './lib/api';
import { AuthModal } from './components/Auth/AuthModal';
import { Header } from './components/Layout/Header';
import { Footer } from './components/Layout/Footer';
import { CookieBanner } from './components/Layout/CookieBanner';
import { Calendar } from './components/Pages/Calendar';
import { Live } from './components/Pages/Live';
import { PageSEO } from './components/SEO/PageSEO';
import { Highlights } from './components/Pages/Highlights';
import { Admin } from './components/Pages/Admin';
import { Settings } from './components/Pages/Settings';
import { Premium } from './components/Pages/Premium';
import { LandingPage } from './components/Pages/LandingPage';
import Privacy from './components/Pages/Privacy';
import Contact from './components/Pages/Contact';

type AuthView = 'login' | 'register' | null;
type Page = 'calendar' | 'live' | 'highlights' | 'admin' | 'settings' | 'premium' | 'privacy' | 'contact';

function App() {
  const { user, isAuthenticated, setUser, setLoading } = useAuthStore();
  const { setTheme } = useThemeStore();
  const [authView, setAuthView] = useState<AuthView | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('calendar');
  const [isInitializing, setIsInitializing] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme-storage');
    if (savedTheme) {
      try {
        const { state } = JSON.parse(savedTheme);
        setTheme(state.isDark);
      } catch {
        // Fallback to system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark);
      }
    } else {
      // Use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark);
    }
  }, [setTheme]);

  // Check authentication on mount - but don't block the app
  useEffect(() => {
    const checkAuth = async () => {
      if (isAuthenticated && user) {
        try {
          // Refresh user profile to get latest data
          const { data } = await userApi.getProfile();
          setUser(data.user);
        } catch (error) {
          console.error('Failed to load user profile:', error);
          // If profile fails to load, user is not actually authenticated
          // Clear the auth state but don't block the app
          setUser(null);
        }
      }
      setLoading(false);
      setIsInitializing(false);
    };

    checkAuth();
  }, [isAuthenticated, setLoading, setUser, user]);


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

  // Show auth modal if user wants to authenticate
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
          initialMode={authView}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* SEO Head for current page */}
      <PageSEO page={currentPage} user={user} />
      
      <Header 
        currentPage={currentPage} 
        onNavigate={setCurrentPage}
        onShowLogin={() => setAuthView('login')}
        onShowRegister={() => setAuthView('register')}
      />
      
      <main className="flex-1">
        {currentPage === 'calendar' && (user ? <Calendar /> : <LandingPage onShowLogin={() => setAuthView('login')} onShowRegister={() => setAuthView('register')} />)}
        {currentPage === 'live' && (user ? <Live /> : <LandingPage onShowLogin={() => setAuthView('login')} onShowRegister={() => setAuthView('register')} />)}
        {currentPage === 'highlights' && (user ? <Highlights /> : <LandingPage onShowLogin={() => setAuthView('login')} onShowRegister={() => setAuthView('register')} />)}
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
        {currentPage === 'premium' && user ? <Premium /> : currentPage === 'premium' ? (
          <div className="card p-12 text-center">
            <h2 className="text-2xl font-bold mb-4">🔒 Anmeldung erforderlich</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Bitte melden Sie sich an, um Premium-Features zu entdecken.
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
        {currentPage === 'privacy' && <Privacy />}
        {currentPage === 'contact' && <Contact />}
      </main>

      <Footer onNavigate={setCurrentPage} />
      <CookieBanner onNavigate={setCurrentPage} />
    </div>
  );
}

export default App;
