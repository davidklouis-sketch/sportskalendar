import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { authApi } from '../../lib/api';

interface HeaderProps {
  currentPage: 'calendar' | 'live' | 'highlights' | 'admin' | 'settings';
  onNavigate: (page: 'calendar' | 'live' | 'highlights' | 'admin' | 'settings') => void;
}

export function Header({ currentPage, onNavigate }: HeaderProps) {
  const { isDark, toggleTheme } = useThemeStore();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    logout();
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <h1 className="text-xl font-bold">SportsKalender</h1>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            <button
              onClick={() => onNavigate('calendar')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                currentPage === 'calendar'
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Kalender
            </button>
            <button
              onClick={() => onNavigate('live')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                currentPage === 'live'
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Live
            </button>
            <button
              onClick={() => onNavigate('highlights')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                currentPage === 'highlights'
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Highlights
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={() => onNavigate('admin')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  currentPage === 'admin'
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Admin
              </button>
            )}
            <button
              onClick={() => onNavigate('settings')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                currentPage === 'settings'
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Premium Badge */}
            {user?.isPremium && (
              <span className="hidden sm:inline-flex px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full">
                PREMIUM
              </span>
            )}

            {/* User Info */}
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium">{user?.displayName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDark ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="btn btn-secondary text-sm"
            >
              Abmelden
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden flex flex-col gap-2 pb-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => onNavigate('calendar')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentPage === 'calendar'
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Kalender
            </button>
            <button
              onClick={() => onNavigate('live')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentPage === 'live'
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Live
            </button>
            <button
              onClick={() => onNavigate('highlights')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentPage === 'highlights'
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Highlights
            </button>
          </div>
          <div className="flex items-center gap-1">
            {user?.role === 'admin' && (
              <button
                onClick={() => onNavigate('admin')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentPage === 'admin'
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Admin
              </button>
            )}
            <button
              onClick={() => onNavigate('settings')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentPage === 'settings'
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Einstellungen
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}

