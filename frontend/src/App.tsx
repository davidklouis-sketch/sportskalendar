import { useEffect, useState } from 'react';
import { useAuthStore } from './store/useAuthStore';
import { useThemeStore } from './store/useThemeStore';
import { userApi } from './lib/api';
import { Login } from './components/Auth/Login';
import { Register } from './components/Auth/Register';
import { Header } from './components/Layout/Header';
import { Calendar } from './components/Pages/Calendar';
import { Live } from './components/Pages/Live';
import { Highlights } from './components/Pages/Highlights';
import { Admin } from './components/Pages/Admin';
import { Settings } from './components/Pages/Settings';

type AuthView = 'login' | 'register';
type Page = 'calendar' | 'live' | 'highlights' | 'admin' | 'settings';

function App() {
  const { user, isAuthenticated, setUser, setLoading } = useAuthStore();
  const { setTheme } = useThemeStore();
  const [authView, setAuthView] = useState<AuthView>('login');
  const [currentPage, setCurrentPage] = useState<Page>('calendar');
  const [isInitializing, setIsInitializing] = useState(true);

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

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (isAuthenticated && user) {
        try {
          // Refresh user profile to get latest data
          const { data } = await userApi.getProfile();
          setUser(data.user);
        } catch (error) {
          console.error('Failed to load user profile:', error);
          // Keep existing user data if refresh fails
        }
      }
      setLoading(false);
      setIsInitializing(false);
    };

    checkAuth();
  }, []);

  const handleLoginSuccess = () => {
    setCurrentPage('calendar');
  };

  const handleRegisterSuccess = () => {
    setAuthView('login');
  };

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

  // Require authentication for all pages
  if (!isAuthenticated || !user) {
  return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full">
          {authView === 'login' ? (
            <Login
              onSwitchToRegister={() => setAuthView('register')}
              onSuccess={handleLoginSuccess}
            />
          ) : (
            <Register
              onSwitchToLogin={() => setAuthView('login')}
              onSuccess={handleRegisterSuccess}
            />
          )}
        </div>
    </div>
  );
}

  return (
    <div className="min-h-screen">
      <Header currentPage={currentPage} onNavigate={setCurrentPage} />
      
      <main className="container mx-auto px-4 py-8">
        {currentPage === 'calendar' && <Calendar />}
        {currentPage === 'live' && <Live />}
        {currentPage === 'highlights' && <Highlights />}
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
        {currentPage === 'settings' && <Settings />}
      </main>

      <footer className="mt-16 py-8 border-t border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>© 2025 SportsKalender. Alle Rechte vorbehalten.</p>
      </div>
      </footer>
    </div>
  );
}

export default App;
