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
    { href: '#scoreboard', label: 'Scoreboard', icon: '🏆' },
    { href: '#ticker', label: 'Ticker', icon: '📰' },
    { href: '#highlights', label: 'Highlights', icon: '🎥' },
    { href: '#calendar', label: 'Kalender', icon: '📅' },
    { href: '#community', label: 'Community', icon: '💬' }
  ];
  
  return (
    <nav style={{
      background: isDarkMode 
        ? 'linear-gradient(135deg, #1f2937, #111827)'
        : 'linear-gradient(135deg, #ffffff, #f8fafc)',
      borderBottom: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
      boxShadow: isDarkMode 
        ? '0 4px 20px rgba(0,0,0,0.3)'
        : '0 4px 20px rgba(0,0,0,0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '70px'
      }}>
        {/* Logo */}
        <a 
          href="#top" 
          className="logo"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
            color: 'inherit',
            fontSize: '24px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <span style={{ fontSize: '28px' }}>🏆</span>
          SportsKalender
        </a>
        
        {/* Desktop Navigation */}
        <div className="desktop-nav" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                const element = document.querySelector(item.href);
                if (element) {
                  const offsetTop = element.offsetTop - 80; // Account for sticky nav height
                  window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                  });
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                borderRadius: '10px',
                textDecoration: 'none',
                color: isDarkMode ? '#f9fafb' : '#374151',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isDarkMode ? '#374151' : '#f3f4f6';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              {item.label}
            </a>
          ))}
        </div>
        
        {/* User Actions */}
        <div className="user-actions" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            style={{
              display: 'flex',
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
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isDarkMode ? '#374151' : '#f3f4f6';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            title={isDarkMode ? 'Zu Light Mode wechseln' : 'Zu Dark Mode wechseln'}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
          
          {/* User Menu */}
          {user ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {/* Profile Link */}
              <Link
                to="/profile"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  color: isDarkMode ? '#f9fafb' : '#374151',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  background: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDarkMode ? '#374151' : '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <span style={{ fontSize: '16px' }}>👤</span>
                Profil
              </Link>
              
              {/* Admin Link - Nur für Admins sichtbar */}
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                    border: '1px solid #dc2626',
                    boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #b91c1c, #991b1b)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(220, 38, 38, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #dc2626, #b91c1c)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(220, 38, 38, 0.2)';
                  }}
                >
                  <span style={{ fontSize: '16px' }}>🛡️</span>
                  Admin Portal
                </Link>
              )}
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span style={{ fontSize: '16px' }}>🚪</span>
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                borderRadius: '10px',
                textDecoration: 'none',
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span style={{ fontSize: '16px' }}>🔑</span>
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
                const element = document.querySelector(item.href);
                if (element) {
                  const offsetTop = element.offsetTop - 80; // Account for sticky nav height
                  window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                  });
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
    <section id="ticker" className="ticker container">
      <LiveTickerWidget />
    </section>
  );
}

function HighlightsSection() {
  return (
    <section id="highlights" className="highlights container">
      <Highlights />
    </section>
  );
}

function Calendar() {
  return (
    <section id="calendar" className="calendar container">
      <h2>Interaktiver Kalender</h2>
      <CalendarWidget />
    </section>
  );
}

function Community() {
  return (
    <section id="community" className="community container">
      <CommunityStream />
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer container">
      <div>Partner</div>
      <div>
        <Link to="/datenschutz">Datenschutz</Link> | <Link to="/impressum">Impressum</Link> | <Link to="/faq">FAQ</Link>
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

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="layout">
      <TopNav />
      {children}
      <Footer />
    </div>
  );
}

function Home() {
  return (
    <div id="top" className="container" style={{ padding: '16px 0', display: 'grid', gap: 16 }}>
      <HeaderScoreboard />
      <LiveTicker />
      <HighlightsSection />
      <Calendar />
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

