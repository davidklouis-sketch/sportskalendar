import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useEffect, useState, type ReactNode, type FormEvent } from 'react';
import './App.css';
import { useAuth } from './store/auth';
import { HeaderScoreboard } from './components/Scoreboard';
import LiveTickerWidget from './components/LiveTicker';
import Highlights from './components/Highlights';
import CalendarWidget from './components/Calendar';
import CommunityStream from './components/Community';
import AdminPage from './pages/Admin';
import ProfilePage from './pages/Profile';
import logoImage from './assets/logo.png';

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isHydrating } = useAuth();
  if (isHydrating) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, isHydrating } = useAuth();
  if (isHydrating) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function TopNav() {
  const { user, logout } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  console.log('🔍 TopNav - User state:', user);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  async function handleLogout() {
    await logout();
    window.location.href = '/login';
  }
  
  function toggleTheme() {
    const root = document.documentElement;
    const current = root.getAttribute('data-theme');
    const next = current === 'dark' ? '' : 'dark';
    if (next) root.setAttribute('data-theme', next); else root.removeAttribute('data-theme');
    localStorage.setItem('theme', next);
    setIsDarkMode(next === 'dark');
  }
  
  // Hydrate theme once
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const stored = localStorage.getItem('theme');
      const isDark = stored === 'dark';
      if (isDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.classList.add('dark');
      }
      setIsDarkMode(isDark);
    }
  }, []);
  
  const navItems = [
    { href: '#scoreboard', label: 'Scoreboard', icon: '🏆', priority: 'high' },
    { href: '#calendar', label: 'Kalender', icon: '📅', priority: 'high' },
    { href: '#ticker', label: 'Live Ticker', icon: '📰', priority: 'medium' },
    { href: '#highlights', label: 'Highlights', icon: '🎥', priority: 'medium' },
    { href: '#community', label: 'Community', icon: '💬', priority: 'low' }
  ];

  return (
    <nav style={{
      background: isDarkMode 
        ? 'rgba(15, 23, 42, 0.75)'
        : 'rgba(255, 255, 255, 0.75)',
      borderBottom: `1px solid ${isDarkMode ? 'rgba(71, 85, 105, 0.2)' : 'rgba(226, 232, 240, 0.6)'}`,
      boxShadow: isDarkMode 
        ? '0 1px 3px rgba(0, 0, 0, 0.12)'
        : '0 1px 3px rgba(0, 0, 0, 0.05)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      backdropFilter: 'blur(12px) saturate(180%)',
      WebkitBackdropFilter: 'blur(12px) saturate(180%)'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px'
      }}>
        {/* Logo */}
        <a 
          href="#top" 
          className="logo"
          onClick={(e) => {
            e.preventDefault();
            if (window.location.pathname !== '/') {
              window.location.href = '/';
            } else {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
            color: 'inherit',
            fontSize: '20px',
            fontWeight: '700',
            transition: 'opacity 0.2s',
            position: 'relative'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: isDarkMode 
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(59, 130, 246, 0.08)',
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(59, 130, 246, 0.12)'}`,
            transition: 'all 0.2s'
          }}>
            <img 
              src={logoImage} 
              alt="SportsKalender Logo"
              style={{
                width: '28px',
                height: '28px',
                objectFit: 'contain'
              }}
            />
          </div>
          <span style={{
            color: isDarkMode ? '#f1f5f9' : '#0f172a',
            letterSpacing: '-0.025em'
          }}>
            SportsKalender
          </span>
        </a>
        
        {/* Desktop Navigation */}
        <div className="desktop-nav" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px'
        }}>
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                if (window.location.pathname !== '/') {
                  window.location.href = `/${item.href}`;
                } else {
                  const element = document.querySelector(item.href) as HTMLElement;
                  if (element) {
                    const offsetTop = element.offsetTop - 64;
                    window.scrollTo({
                      top: offsetTop,
                      behavior: 'smooth'
                    });
                  }
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '8px',
                textDecoration: 'none',
                color: isDarkMode ? '#cbd5e1' : '#64748b',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.15s ease',
                cursor: 'pointer',
                background: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isDarkMode 
                  ? 'rgba(255, 255, 255, 0.06)'
                  : 'rgba(0, 0, 0, 0.04)';
                e.currentTarget.style.color = isDarkMode ? '#f1f5f9' : '#0f172a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = isDarkMode ? '#cbd5e1' : '#64748b';
              }}
            >
              <span style={{ fontSize: '16px' }}>
                {item.icon}
              </span>
              <span style={{ whiteSpace: 'nowrap' }}>
                {item.label}
              </span>
            </a>
          ))}
        </div>
        
        {/* User Actions */}
        <div className="user-actions" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: 'none',
              background: isDarkMode 
                ? 'rgba(255, 255, 255, 0.06)'
                : 'rgba(0, 0, 0, 0.04)',
              color: isDarkMode ? '#f1f5f9' : '#0f172a',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              fontSize: '18px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDarkMode 
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isDarkMode 
                ? 'rgba(255, 255, 255, 0.06)'
                : 'rgba(0, 0, 0, 0.04)';
            }}
            title={isDarkMode ? 'Zu Light Mode wechseln' : 'Zu Dark Mode wechseln'}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
          
          {/* User Actions */}
          {user ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {/* User Info */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px 6px 6px',
                borderRadius: '8px',
                background: isDarkMode 
                  ? 'rgba(255, 255, 255, 0.06)'
                  : 'rgba(0, 0, 0, 0.04)',
                border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`
              }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'white'
                }}>
                  {user.displayName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1px' }}>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: '500',
                    color: isDarkMode ? '#f1f5f9' : '#0f172a',
                    lineHeight: '1.2'
                  }}>
                    {user.displayName || 'User'}
                  </span>
                  <span style={{
                    fontSize: '10px',
                    color: isDarkMode ? '#94a3b8' : '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {user.role === 'admin' ? 'Admin' : 'User'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                {/* Profile Button */}
                <Link
                  to="/profile"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    background: isDarkMode 
                      ? 'rgba(255, 255, 255, 0.06)'
                      : 'rgba(0, 0, 0, 0.04)',
                    color: isDarkMode ? '#cbd5e1' : '#64748b',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = isDarkMode 
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(0, 0, 0, 0.08)';
                    e.currentTarget.style.color = isDarkMode ? '#f1f5f9' : '#0f172a';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isDarkMode 
                      ? 'rgba(255, 255, 255, 0.06)'
                      : 'rgba(0, 0, 0, 0.04)';
                    e.currentTarget.style.color = isDarkMode ? '#cbd5e1' : '#64748b';
                  }}
                  title="Profil"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </Link>

                {/* Admin Button */}
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      background: 'rgba(220, 38, 38, 0.1)',
                      color: '#dc2626',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(220, 38, 38, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(220, 38, 38, 0.1)';
                    }}
                    title="Admin Portal"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <path d="M9 9h6v6H9z"/>
                    </svg>
                  </Link>
                )}

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isDarkMode 
                      ? 'rgba(255, 255, 255, 0.06)'
                      : 'rgba(0, 0, 0, 0.04)',
                    color: isDarkMode ? '#cbd5e1' : '#64748b',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = isDarkMode 
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(0, 0, 0, 0.08)';
                    e.currentTarget.style.color = isDarkMode ? '#f1f5f9' : '#0f172a';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isDarkMode 
                      ? 'rgba(255, 255, 255, 0.06)'
                      : 'rgba(0, 0, 0, 0.04)';
                    e.currentTarget.style.color = isDarkMode ? '#cbd5e1' : '#64748b';
                  }}
                  title="Logout"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16,17 21,12 16,7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <Link
              to="/login"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                textDecoration: 'none',
                background: '#3b82f6',
                color: 'white',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#2563eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#3b82f6';
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10,17 15,12 10,7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
              Login
            </Link>
          )}
        </div>
        
        
        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          style={{
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            border: 'none',
            background: isDarkMode ? '#374151' : '#f3f4f6',
            color: isDarkMode ? '#f9fafb' : '#374151',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            fontSize: '18px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = isDarkMode ? '#4b5563' : '#e5e7eb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = isDarkMode ? '#374151' : '#f3f4f6';
          }}
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div style={{
          background: isDarkMode ? '#1f2937' : '#ffffff',
          borderTop: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                setIsMobileMenuOpen(false);
                // Always go to main page first, then scroll to section
                if (window.location.pathname !== '/') {
                  window.location.href = `/${item.href}`;
                } else {
                  const element = document.querySelector(item.href) as HTMLElement;
                  if (element) {
                    const offsetTop = element.offsetTop - 80; // Account for sticky nav height
                    window.scrollTo({
                      top: offsetTop,
                      behavior: 'smooth'
                    });
                  }
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px 20px',
                borderRadius: '12px',
                textDecoration: 'none',
                color: isDarkMode ? '#f9fafb' : '#374151',
                fontSize: '16px',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                background: 'transparent',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isDarkMode ? '#374151' : '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{ fontSize: '20px' }}>{item.icon}</span>
              {item.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}


function LiveTicker() {
  return (
    <section id="ticker" className="ticker container" style={{
      background: 'rgba(59, 130, 246, 0.02)',
      borderRadius: '24px',
      padding: '32px',
      border: '1px solid rgba(59, 130, 246, 0.1)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        height: '4px',
        background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)',
        borderRadius: '24px 24px 0 0'
      }} />
      <LiveTickerWidget />
    </section>
  );
}

function HighlightsSection() {
  return (
    <section id="highlights" className="highlights container" style={{
      background: 'rgba(236, 72, 153, 0.02)',
      borderRadius: '24px',
      padding: '32px',
      border: '1px solid rgba(236, 72, 153, 0.1)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        height: '4px',
        background: 'linear-gradient(90deg, #ec4899, #f97316, #eab308)',
        borderRadius: '24px 24px 0 0'
      }} />
      <Highlights />
    </section>
  );
}

function Calendar() {
  return (
    <section id="calendar" className="calendar container" style={{
      background: 'rgba(34, 197, 94, 0.02)',
      borderRadius: '24px',
      padding: '32px',
      border: '1px solid rgba(34, 197, 94, 0.1)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        height: '4px',
        background: 'linear-gradient(90deg, #22c55e, #10b981, #059669)',
        borderRadius: '24px 24px 0 0'
      }} />
      <h2 style={{
        fontSize: '28px',
        fontWeight: '800',
        color: '#22c55e',
        marginBottom: '24px',
        textAlign: 'center',
        letterSpacing: '-0.02em'
      }}>
        📅 Interaktiver Kalender
      </h2>
      <CalendarWidget />
    </section>
  );
}

function Community() {
  return (
    <section id="community" className="community container" style={{
      background: 'rgba(168, 85, 247, 0.02)',
      borderRadius: '24px',
      padding: '32px',
      border: '1px solid rgba(168, 85, 247, 0.1)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        height: '4px',
        background: 'linear-gradient(90deg, #a855f7, #8b5cf6, #7c3aed)',
        borderRadius: '24px 24px 0 0'
      }} />
      <CommunityStream />
    </section>
  );
}

function Footer() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const stored = localStorage.getItem('theme');
      const isDark = stored === 'dark';
      setIsDarkMode(isDark);
    }
  }, []);

  return (
    <footer className="footer container" style={{
      background: isDarkMode 
        ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))'
        : 'linear-gradient(135deg, rgba(248, 250, 252, 0.95), rgba(241, 245, 249, 0.95))',
      borderTop: `1px solid ${isDarkMode ? 'rgba(71, 85, 105, 0.3)' : 'rgba(229, 231, 235, 0.5)'}`,
      padding: '48px 32px',
      marginTop: '64px',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '32px',
        alignItems: 'center'
      }}>
        {/* Logo Section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: isDarkMode 
              ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))'
              : 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.05))',
            boxShadow: isDarkMode 
              ? '0 4px 16px rgba(0, 0, 0, 0.2)'
              : '0 4px 16px rgba(59, 130, 246, 0.15)',
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(59, 130, 246, 0.2)'}`
          }}>
            <img 
              src={logoImage} 
              alt="SportsKalender Logo"
              style={{
                width: '32px',
                height: '32px',
                objectFit: 'contain',
                filter: isDarkMode ? 'brightness(1.1)' : 'none'
              }}
            />
          </div>
          <div>
            <h3 style={{
              margin: '0',
              fontSize: '18px',
              fontWeight: '700',
              color: isDarkMode ? '#f8fafc' : '#1e293b',
              letterSpacing: '-0.01em'
            }}>
              SportsKalender
            </h3>
            <p style={{
              margin: '4px 0 0 0',
              fontSize: '14px',
              color: isDarkMode ? '#94a3b8' : '#64748b',
              lineHeight: '1.4'
            }}>
              Dein digitaler Sportkalender
            </p>
          </div>
        </div>

        {/* Links Section */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <h4 style={{
            margin: '0 0 8px 0',
            fontSize: '16px',
            fontWeight: '600',
            color: isDarkMode ? '#e2e8f0' : '#475569'
          }}>
            Rechtliches
          </h4>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <Link 
              to="/datenschutz" 
              style={{
                color: isDarkMode ? '#94a3b8' : '#64748b',
                textDecoration: 'none',
                fontSize: '14px',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = isDarkMode ? '#e2e8f0' : '#475569';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = isDarkMode ? '#94a3b8' : '#64748b';
              }}
            >
              Datenschutz
            </Link>
            <Link 
              to="/impressum" 
              style={{
                color: isDarkMode ? '#94a3b8' : '#64748b',
                textDecoration: 'none',
                fontSize: '14px',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = isDarkMode ? '#e2e8f0' : '#475569';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = isDarkMode ? '#94a3b8' : '#64748b';
              }}
            >
              Impressum
            </Link>
            <Link 
              to="/faq" 
              style={{
                color: isDarkMode ? '#94a3b8' : '#64748b',
                textDecoration: 'none',
                fontSize: '14px',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = isDarkMode ? '#e2e8f0' : '#475569';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = isDarkMode ? '#94a3b8' : '#64748b';
              }}
            >
              FAQ
            </Link>
          </div>
        </div>

        {/* Partner Section */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <h4 style={{
            margin: '0 0 8px 0',
            fontSize: '16px',
            fontWeight: '600',
            color: isDarkMode ? '#e2e8f0' : '#475569'
          }}>
            Partner
          </h4>
          <p style={{
            margin: '0',
            fontSize: '14px',
            color: isDarkMode ? '#94a3b8' : '#64748b',
            lineHeight: '1.4'
          }}>
            Werde Partner und erweitere deine Reichweite im Sportbereich.
          </p>
        </div>
      </div>
      
      {/* Copyright */}
      <div style={{
        marginTop: '32px',
        paddingTop: '24px',
        borderTop: `1px solid ${isDarkMode ? 'rgba(71, 85, 105, 0.3)' : 'rgba(229, 231, 235, 0.5)'}`,
        textAlign: 'center'
      }}>
        <p style={{
          margin: '0',
          fontSize: '14px',
          color: isDarkMode ? '#64748b' : '#94a3b8'
        }}>
          © 2025 SportsKalender. Alle Rechte vorbehalten.
        </p>
      </div>
    </footer>
  );
}

function LoginPage() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const form = new FormData(e.currentTarget);
      const email = String(form.get('email'));
      const password = String(form.get('password'));
      
      await login(email, password);
      
      setSuccess('✅ Login erfolgreich! Weiterleitung...');
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || err.message || 'Login fehlgeschlagen. Bitte prüfen Sie Ihre Anmeldedaten.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="auth-page">
      {/* Logo Section */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: '32px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '80px',
          height: '80px',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.05))',
          boxShadow: '0 8px 32px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          marginBottom: '16px'
        }}>
          <img 
            src="/logo.png" 
            alt="SportsKalender Logo"
            style={{
              width: '56px',
              height: '56px',
              objectFit: 'contain'
            }}
          />
        </div>
        <h1 style={{
          margin: '0',
          fontSize: '28px',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '-0.02em'
        }}>
          SportsKalender
        </h1>
        <p style={{
          margin: '8px 0 0 0',
          fontSize: '16px',
          color: '#64748b',
          textAlign: 'center'
        }}>
          Dein digitaler Sportkalender
        </p>
      </div>
      
      <h2>Login</h2>
      
      {error && (
        <div style={{
          background: '#fee2e2',
          color: '#dc2626',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '16px',
          border: '1px solid #fecaca'
        }}>
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div style={{
          background: '#d1fae5',
          color: '#059669',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '16px',
          border: '1px solid #a7f3d0'
        }}>
          {success}
        </div>
      )}

      <form onSubmit={onSubmit}>
        <input 
          name="email" 
          type="email" 
          placeholder="E-Mail" 
          required 
          disabled={isLoading}
        />
        <input 
          name="password" 
          type="password" 
          placeholder="Passwort" 
          required 
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Wird eingeloggt...' : 'Einloggen'}
        </button>
      </form>
      
      <div style={{ marginTop: '16px', fontSize: '14px', color: '#6b7280' }}>
        <strong>Demo-Benutzer:</strong><br />
        <strong>Admin:</strong> admin@sportskalender.local / admin123<br />
        <strong>User:</strong> demo@sportskalender.local / password
      </div>

      <p style={{ marginTop: '20px' }}>
        Kein Konto? <Link to="/register">Registrieren</Link>
      </p>
    </div>
  );
}

function RegisterPage() {
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const form = new FormData(e.currentTarget);
      const email = String(form.get('email'));
      const password = String(form.get('password'));
      const displayName = String(form.get('displayName'));
      
      await register(email, password, displayName);
      
      setSuccess('✅ Registrierung erfolgreich! Weiterleitung zum Login...');
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || err.message || 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="auth-page">
      {/* Logo Section */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: '32px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '80px',
          height: '80px',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.05))',
          boxShadow: '0 8px 32px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          marginBottom: '16px'
        }}>
          <img 
            src="/logo.png" 
            alt="SportsKalender Logo"
            style={{
              width: '56px',
              height: '56px',
              objectFit: 'contain'
            }}
          />
        </div>
        <h1 style={{
          margin: '0',
          fontSize: '28px',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '-0.02em'
        }}>
          SportsKalender
        </h1>
        <p style={{
          margin: '8px 0 0 0',
          fontSize: '16px',
          color: '#64748b',
          textAlign: 'center'
        }}>
          Dein digitaler Sportkalender
        </p>
      </div>
      
      <h2>Registrieren</h2>
      
      {error && (
        <div style={{
          background: '#fee2e2',
          color: '#dc2626',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '16px',
          border: '1px solid #fecaca'
        }}>
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div style={{
          background: '#d1fae5',
          color: '#059669',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '16px',
          border: '1px solid #a7f3d0'
        }}>
          {success}
        </div>
      )}

      <form onSubmit={onSubmit}>
        <input 
          name="displayName" 
          placeholder="Anzeigename" 
          required 
          disabled={isLoading}
        />
        <input 
          name="email" 
          type="email" 
          placeholder="E-Mail" 
          required 
          disabled={isLoading}
        />
        <input 
          name="password" 
          type="password" 
          placeholder="Passwort (mindestens 8 Zeichen)" 
          required 
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Wird registriert...' : 'Account erstellen'}
        </button>
      </form>
      
      <p style={{ marginTop: '20px' }}>
        Bereits Konto? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}

function DebugPage() {
  const { user, isHydrating, login, logout, hydrate } = useAuth();
  const [testEmail, setTestEmail] = useState('admin@sportskalender.local');
  const [testPassword, setTestPassword] = useState('admin123');

  const handleTestLogin = async () => {
    try {
      await login(testEmail, testPassword);
    } catch (error) {
      console.error('Test login failed:', error);
    }
  };

  const handleTestLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Test logout failed:', error);
    }
  };

  const handleTestHydrate = async () => {
    try {
      await hydrate();
    } catch (error) {
      console.error('Test hydrate failed:', error);
    }
  };

  return (
    <div className="container" style={{ padding: '20px' }}>
      <h1>🔧 Debug Auth System</h1>
      
      <div style={{ marginBottom: '20px', padding: '16px', background: '#f3f4f6', borderRadius: '8px' }}>
        <h3>Auth State:</h3>
        <pre>{JSON.stringify({ user, isHydrating }, null, 2)}</pre>
      </div>

      <div style={{ marginBottom: '20px', padding: '16px', background: '#e5f3ff', borderRadius: '8px' }}>
        <h3>Test Login:</h3>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="Email"
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <input
            type="password"
            value={testPassword}
            onChange={(e) => setTestPassword(e.target.value)}
            placeholder="Password"
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleTestLogin} style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px' }}>
            Test Login
          </button>
          <button onClick={handleTestLogout} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px' }}>
            Test Logout
          </button>
          <button onClick={handleTestHydrate} style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px' }}>
            Test Hydrate
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '20px', padding: '16px', background: '#fef3c7', borderRadius: '8px' }}>
        <h3>API Test:</h3>
        <button 
          onClick={async () => {
            try {
              const response = await fetch('https://api.dlouis.ddnss.de/api/debug/users');
              const data = await response.json();
              console.log('API Debug Users:', data);
              alert('Check console for API response');
            } catch (error) {
              console.error('API Test failed:', error);
              alert('API Test failed - check console');
            }
          }}
          style={{ padding: '8px 16px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Test API Connection
        </button>
      </div>

      <div style={{ padding: '16px', background: '#d1fae5', borderRadius: '8px' }}>
        <h3>Instructions:</h3>
        <ol>
          <li>Check browser console for debug logs</li>
          <li>Try "Test Login" with admin credentials</li>
          <li>Check if user state updates</li>
          <li>Try "Test API Connection" to verify backend</li>
        </ol>
      </div>
    </div>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="layout">
      <TopNav />
      {children}
      <Footer />
    </div>
  );
}

function ScoreboardSection() {
  return (
    <section id="scoreboard" className="scoreboard container" style={{
      background: 'rgba(220, 38, 38, 0.02)',
      borderRadius: '24px',
      padding: '32px',
      border: '1px solid rgba(220, 38, 38, 0.1)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        height: '4px',
        background: 'linear-gradient(90deg, #dc2626, #ef4444, #f97316)',
        borderRadius: '24px 24px 0 0'
      }} />
      <HeaderScoreboard />
    </section>
  );
}

function Home() {
  return (
    <div id="top" className="container" style={{ 
      padding: '24px 0', 
      display: 'grid', 
      gap: '32px',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      {/* High Priority - Core Sports Data */}
      <ScoreboardSection />
      <Calendar />
      
      {/* Medium Priority - Live Updates & Media */}
      <LiveTicker />
      <HighlightsSection />
      
      {/* Low Priority - Social Features */}
      <Community />
    </div>
  );
}

export default function App() {
  const { hydrate } = useAuth();
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/debug" element={<DebugPage />} />
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/community" element={<Layout><Community /></Layout>} />
        <Route path="/stats" element={<Layout><div className="page">Statistik</div></Layout>} />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <Layout>
                <AdminPage />
              </Layout>
            </RequireAdmin>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <Layout>
                <ProfilePage />
              </Layout>
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

