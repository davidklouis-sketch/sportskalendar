import { useState, useCallback, useRef, useEffect } from 'react';
import { authApi } from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';
import { FormErrorBoundary } from './FormErrorBoundary';

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
  
  // Use refs to avoid infinite loops in useCallback
  const formDataRef = useRef({ email, password, keepLoggedIn });
  
  // Update ref when state changes
  useEffect(() => {
    formDataRef.current = { email, password, keepLoggedIn };
  }, [email, password, keepLoggedIn]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data: loginData } = await authApi.login({ 
        email: formDataRef.current.email, 
        password: formDataRef.current.password, 
        keepLoggedIn: formDataRef.current.keepLoggedIn 
      });
      
      // Login response now includes premium status and selectedTeams
      setUser(loginData.user);
      
      // Store keepLoggedIn preference in localStorage
      if (formDataRef.current.keepLoggedIn) {
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
  }, [setUser, onSuccess]); // Remove state variables to prevent infinite loops

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="card p-8">
        <h2 className="text-2xl font-bold text-center mb-6">Login</h2>
        
        <FormErrorBoundary>
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
              data-lpignore="false"
              data-1p-ignore="false"
              data-bwignore="false"
              name="email"
              id="login-email"
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
              data-lpignore="false"
              data-1p-ignore="false"
              data-bwignore="false"
              name="password"
              id="login-password"
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
        </FormErrorBoundary>

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

