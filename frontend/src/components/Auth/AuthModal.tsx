import { useState } from 'react';
import { authApi, userApi } from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';

interface AuthModalProps {
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export function AuthModal({ onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const setUser = useAuthStore((state) => state.setUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await authApi.login({ email, password, keepLoggedIn });
        
        // Get user profile with premium status
        const { data } = await userApi.getProfile();
        setUser(data.user);
        
        // Store keepLoggedIn preference in localStorage
        if (keepLoggedIn) {
          localStorage.setItem('keepLoggedIn', 'true');
        } else {
          localStorage.removeItem('keepLoggedIn');
        }
      } else {
        await authApi.register({ email, password, displayName });
      }
      onClose();
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || `${mode === 'login' ? 'Login' : 'Registrierung'} fehlgeschlagen`);
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setEmail('');
    setPassword('');
    setDisplayName('');
    setKeepLoggedIn(true);
  };

  return (
    <div className="fixed inset-0 bg-dark-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="card w-full max-w-md transform transition-all duration-300 scale-100">
        {/* Header with sport gradient */}
        <div className="bg-sport-gradient rounded-t-2xl p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="text-center">
            <div className="relative group mx-auto mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto shadow-xl border border-cyan-400/30">
                <div className="text-2xl font-bold heading-sport">S</div>
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2 heading-sport">
              {mode === 'login' ? 'Willkommen zurück!' : 'Jetzt starten'}
            </h2>
            <p className="text-cyan-100">
              {mode === 'login' 
                ? 'Melde dich in deinem Sportskalendar an' 
                : 'Erstelle deinen kostenlosen Account'
              }
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-cyan-400 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="input"
                  placeholder="Dein Name"
                  required
                  minLength={2}
                  autoComplete="name"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-cyan-400 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="deine@email.de"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-400 mb-2">
                Passwort
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                required
                minLength={8}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              {mode === 'register' && (
                <p className="text-xs text-dark-400 mt-1">
                  Mindestens 8 Zeichen
                </p>
              )}
            </div>

            {/* Keep logged in checkbox - only show in login mode */}
            {mode === 'login' && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="keepLoggedInModal"
                  checked={keepLoggedIn}
                  onChange={(e) => setKeepLoggedIn(e.target.checked)}
                  className="w-4 h-4 text-cyan-500 bg-dark-800 border-dark-600 rounded focus:ring-cyan-500 focus:ring-2"
                />
                <label htmlFor="keepLoggedInModal" className="ml-2 text-sm font-medium text-dark-300">
                  Angemeldet bleiben (30 Tage)
                </label>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-900/20 border border-red-500/30 text-red-400 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  {mode === 'login' ? 'Wird angemeldet...' : 'Wird registriert...'}
                </div>
              ) : (
                mode === 'login' ? 'Anmelden' : 'Registrieren'
              )}
            </button>
          </form>

          {/* Switch mode */}
          <div className="mt-6 text-center">
            <p className="text-sm text-dark-400">
              {mode === 'login' ? 'Noch kein Account?' : 'Bereits registriert?'}{' '}
              <button
                onClick={switchMode}
                className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
              >
                {mode === 'login' ? 'Jetzt registrieren' : 'Jetzt anmelden'}
              </button>
            </p>
          </div>

          {/* Premium badge */}
          {mode === 'register' && (
            <div className="mt-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
              <div className="flex items-center justify-center mb-2">
                <span className="text-2xl mr-2">⭐</span>
                <span className="font-semibold text-orange-400">Premium Features</span>
              </div>
              <p className="text-sm text-orange-300 text-center">
                Erhalte sofortigen Zugang zu allen Premium-Features mit deinem kostenlosen Account!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}