import { useState } from 'react';
import { authApi, userApi } from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';

interface LoginProps {
  onSwitchToRegister: () => void;
  onSuccess: () => void;
}

export function Login({ onSwitchToRegister, onSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keepLoggedIn, setKeepLoggedIn] = useState(true); // Default: angemeldet bleiben
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const setUser = useAuthStore((state) => state.setUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
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
      
      onSuccess();
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Login fehlgeschlagen');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="card p-8">
        <h2 className="text-2xl font-bold text-center mb-6">Login</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
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
            <label className="block text-sm font-medium mb-2">Passwort</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="keepLoggedIn"
              checked={keepLoggedIn}
              onChange={(e) => setKeepLoggedIn(e.target.checked)}
              className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label htmlFor="keepLoggedIn" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
              Angemeldet bleiben (30 Tage)
            </label>
          </div>

          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary w-full disabled:opacity-50"
          >
            {isLoading ? 'Wird angemeldet...' : 'Anmelden'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Noch kein Account?{' '}
            <button
              onClick={onSwitchToRegister}
              className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
            >
              Jetzt registrieren
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

