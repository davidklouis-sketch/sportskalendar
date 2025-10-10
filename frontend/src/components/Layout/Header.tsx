import { useState } from 'react';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { authApi } from '../../lib/api';

interface HeaderProps {
  currentPage: 'calendar' | 'live' | 'highlights' | 'premium' | 'admin' | 'settings' | 'privacy' | 'contact';
  onNavigate: (page: 'calendar' | 'live' | 'highlights' | 'premium' | 'admin' | 'settings' | 'privacy' | 'contact') => void;
  onShowLogin?: () => void;
  onShowRegister?: () => void;
}

export function Header({ currentPage, onNavigate, onShowLogin, onShowRegister }: HeaderProps) {
  const { isDark, toggleTheme } = useThemeStore();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    logout();
  };

  // Navigation items - Live und Highlights nur für angemeldete Benutzer
  const navigationItems = [
    { key: 'calendar', label: 'Kalender', icon: '📅', requiresAuth: false },
    { key: 'live', label: 'Live', icon: '🔴', requiresAuth: true },
    { key: 'highlights', label: 'Highlights', icon: '🎬', requiresAuth: true },
    { key: 'premium', label: 'Premium', icon: '⭐', requiresAuth: false }
  ];

  // Filter navigation items based on authentication status
  const visibleNavigationItems = navigationItems.filter(item => 
    !item.requiresAuth || isAuthenticated
  );

  const getPageIcon = (page: string) => {
    switch (page) {
      case 'calendar': return '📅';
      case 'live': return '🔴';
      case 'highlights': return '🎬';
      case 'premium': return '⭐';
      case 'admin': return '⚙️';
      case 'settings': return '👤';
      default: return '🏠';
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Background with blur effect */}
      <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-white/20 dark:border-gray-700/50"></div>
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-sport-400 to-energy-400 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative w-10 h-10 rounded-2xl overflow-hidden flex items-center justify-center bg-white dark:bg-gray-800 shadow-lg">
                <img 
                  src="/logo.png" 
                  alt="Sportskalendar Logo" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // Fallback to text if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <div className="w-full h-full bg-gradient-to-r from-sport-400 to-energy-400 rounded-2xl flex items-center justify-center hidden">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
              </div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Sportskalendar
              </h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {visibleNavigationItems.map((item) => (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key as any)}
                className={`group relative px-4 py-2 rounded-2xl font-medium transition-all duration-300 transform hover:scale-105 ${
                  currentPage === item.key
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
                {currentPage === item.key && (
                  <div className="absolute -inset-1 bg-gradient-to-r from-white/20 to-white/10 rounded-2xl blur opacity-75"></div>
                )}
              </button>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="group relative p-2 rounded-2xl bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 backdrop-blur-sm border border-white/20 dark:border-gray-700/50"
              aria-label="Toggle dark mode"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl blur opacity-0 group-hover:opacity-50 transition duration-300"></div>
              <div className="relative">
                {isDark ? (
                  <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </div>
            </button>

            {/* Authentication Section */}
            {isAuthenticated && user ? (
              <>
                {/* Premium Badge */}
                {user.isPremium && (
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                    <div className="relative px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-2xl shadow-lg">
                      PREMIUM
                    </div>
                  </div>
                )}

                {/* User Dropdown */}
                <div className="hidden md:flex items-center gap-3">
                  <div className="relative group">
                    <button className="flex items-center gap-3 p-2 rounded-2xl bg-white/10 dark:bg-gray-800/30 hover:bg-white/20 dark:hover:bg-gray-800/50 transition-all duration-300 backdrop-blur-sm border border-white/20 dark:border-gray-700/30">
                      {/* User Avatar */}
                      <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-sm">
                          {user.displayName?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      
                      {/* User Info */}
                      <div className="text-left">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                          {user.displayName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                          {user.email}
                        </p>
                      </div>
                      
                      {/* Dropdown Arrow */}
                      <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {/* Dropdown Menu */}
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-50">
                      <div className="p-4">
                        {/* User Status */}
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold">
                              {user.displayName?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 dark:text-white">{user.displayName}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {user.isPremium ? (
                                <span className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-lg">
                                  ⭐ Premium
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-lg">
                                  Standard
                                </span>
                              )}
                              {user.role === 'admin' && (
                                <span className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-lg">
                                  👑 Admin
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Menu Items */}
                        <div className="space-y-2">
                          {user.role === 'admin' && (
                            <button
                              onClick={() => onNavigate('admin')}
                              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                                currentPage === 'admin'
                                  ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg'
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                            >
                              <span className="text-lg">{getPageIcon('admin')}</span>
                              <span>Admin Panel</span>
                            </button>
                          )}
                          
                          <button
                            onClick={() => onNavigate('settings')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                              currentPage === 'settings'
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>Einstellungen</span>
                          </button>
                          
                          <div className="border-t border-gray-200 dark:border-gray-700 my-3"></div>
                          
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Abmelden</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Login/Register for non-authenticated users */}
                <button
                  onClick={onShowLogin}
                  className="group relative px-4 py-2 bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 text-sm font-medium rounded-2xl transition-all duration-300 transform hover:scale-105 backdrop-blur-sm border border-white/20 dark:border-gray-700/50"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-gray-400 to-gray-600 rounded-2xl blur opacity-0 group-hover:opacity-50 transition duration-300"></div>
                  <span className="relative">Anmelden</span>
                </button>
                <button
                  onClick={onShowRegister}
                  className="group relative px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-medium rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-indigo-500/25"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl blur opacity-0 group-hover:opacity-50 transition duration-300"></div>
                  <span className="relative">Registrieren</span>
                </button>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden group relative p-2 rounded-2xl bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 backdrop-blur-sm border border-white/20 dark:border-gray-700/50"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-0 group-hover:opacity-50 transition duration-300"></div>
              <div className="relative">
                <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden">
            <div className="absolute top-full left-0 right-0 mt-2 mx-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
              <div className="p-4 space-y-2">
                
                {/* Main Navigation */}
                <div className="space-y-1">
                  {visibleNavigationItems.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => {
                        onNavigate(item.key as any);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center px-4 py-3 rounded-2xl font-medium transition-all duration-300 ${
                        currentPage === item.key
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <span className="mr-3 text-lg">{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* User Section */}
                {isAuthenticated && user && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                    <div className="flex items-center gap-3 px-4 py-2 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {user.displayName?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{user.displayName}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                      </div>
                    </div>
                    
                    {user.isPremium && (
                      <div className="px-4 mb-3">
                        <span className="inline-flex px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-2xl">
                          PREMIUM
                        </span>
                      </div>
                    )}

                    <div className="space-y-1">
                      {user.role === 'admin' && (
                        <button
                          onClick={() => {
                            onNavigate('admin');
                            setIsMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center px-4 py-3 rounded-2xl font-medium transition-all duration-300 ${
                            currentPage === 'admin'
                              ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          <span className="mr-3">{getPageIcon('admin')}</span>
                          Admin
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          onNavigate('settings');
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center px-4 py-3 rounded-2xl font-medium transition-all duration-300 ${
                          currentPage === 'settings'
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <span className="mr-3">{getPageIcon('settings')}</span>
                        Einstellungen
                      </button>
                      
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center px-4 py-3 rounded-2xl font-medium bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700 transition-all duration-300"
                      >
                        <span className="mr-3">🚪</span>
                        Abmelden
                      </button>
                    </div>
                  </div>
                )}

                {/* Footer Links */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  <div className="flex justify-center gap-6 text-sm">
                    <button
                      onClick={() => {
                        onNavigate('privacy');
                        setIsMobileMenuOpen(false);
                      }}
                      className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    >
                      Datenschutz
                    </button>
                    <button
                      onClick={() => {
                        onNavigate('contact');
                        setIsMobileMenuOpen(false);
                      }}
                      className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    >
                      Kontakt
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}