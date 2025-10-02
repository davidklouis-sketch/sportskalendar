import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useEffect, type ReactNode, type FormEvent } from 'react';
import './App.css';
import { useAuth } from './store/auth';
import Scoreboard from './components/Scoreboard';
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
  }
  // hydrate theme once
  if (typeof document !== 'undefined') {
    const stored = localStorage.getItem('theme');
    if (stored) document.documentElement.setAttribute('data-theme', stored);
  }
  return (
    <nav className="topnav">
      <div className="container inner">
        <a href="#top" className="logo">SportsKalender</a>
        <div className="links">
          <a href="#scoreboard">Scoreboard</a>
          <a href="#ticker">Ticker</a>
          <a href="#highlights">Highlights</a>
          <a href="#calendar">Kalender</a>
          <a href="#community">Community</a>
          {user && <Link to="/profile">Profil</Link>}
          {user?.role === 'admin' && <Link to="/admin">Admin</Link>}
        </div>
        <div className="theme-toggle">
          <button className="btn secondary" onClick={toggleTheme}>Theme</button>
          {user ? (
            <button className="btn secondary" onClick={handleLogout}>Logout</button>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
}

function HeaderScoreboard() {
  return (
    <header id="scoreboard" className="header hero">
      <h1>Live-Ranking / Scoreboard</h1>
      <Scoreboard />
    </header>
  );
}

function LiveTicker() {
  return (
    <section id="ticker" className="ticker container">
      <h2>Live-Stats-Ticker</h2>
      <LiveTickerWidget />
    </section>
  );
}

function HighlightsSection() {
  return (
    <section id="highlights" className="highlights container">
      <h2>Highlights</h2>
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
      <h2>Community-Stream</h2>
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
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get('email'));
    const password = String(form.get('password'));
    await login(email, password);
    window.location.href = '/';
  }
  return (
    <div className="auth-page">
      <h2>Login</h2>
      <form onSubmit={onSubmit}>
        <input name="email" type="email" placeholder="E-Mail" required />
        <input name="password" type="password" placeholder="Passwort" required />
        <button type="submit">Einloggen</button>
      </form>
      <p>
        Kein Konto? <Link to="/register">Registrieren</Link>
      </p>
    </div>
  );
}

function RegisterPage() {
  const { register } = useAuth();
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get('email'));
    const password = String(form.get('password'));
    const displayName = String(form.get('displayName'));
    await register(email, password, displayName);
    window.location.href = '/login';
  }
  return (
    <div className="auth-page">
      <h2>Registrieren</h2>
      <form onSubmit={onSubmit}>
        <input name="displayName" placeholder="Anzeigename" required />
        <input name="email" type="email" placeholder="E-Mail" required />
        <input name="password" type="password" placeholder="Passwort" required />
        <button type="submit">Account erstellen</button>
      </form>
      <p>
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

