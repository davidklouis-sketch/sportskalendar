import { useState } from 'react';
import { userApi } from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';

export function Settings() {
  const { user } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: 'Bitte fülle alle Felder aus' });
      return;
    }

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Das neue Passwort muss mindestens 8 Zeichen lang sein' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Die Passwörter stimmen nicht überein' });
      return;
    }

    setIsLoading(true);
    try {
      await userApi.changePassword({ currentPassword, newPassword });
      setMessage({ type: 'success', text: 'Passwort erfolgreich geändert!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: unknown) {
      console.error('Failed to change password:', error);
      const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error === 'Invalid current password'
        ? 'Das aktuelle Passwort ist falsch'
        : 'Fehler beim Ändern des Passworts';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card p-6">
        <h2 className="text-2xl font-bold mb-6">Einstellungen</h2>

        {/* User Info */}
        <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <h3 className="font-semibold mb-3">Account-Informationen</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Name:</span>
              <span className="font-medium">{user?.displayName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Email:</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Rolle:</span>
              <span className="font-medium">
                {user?.role === 'admin' ? (
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold rounded">
                    ADMIN
                  </span>
                ) : (
                  'User'
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Account-Typ:</span>
              <span className="font-medium">
                {user?.isPremium ? (
                  <span className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded">
                    PREMIUM
                  </span>
                ) : (
                  'Free'
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Password Change Form */}
        <div>
          <h3 className="font-semibold mb-4">Passwort ändern</h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Aktuelles Passwort
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Neues Passwort
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                autoComplete="new-password"
                minLength={8}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Mindestens 8 Zeichen
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Neues Passwort bestätigen
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                autoComplete="new-password"
                minLength={8}
              />
            </div>

            {message && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  message.type === 'success'
                    ? 'bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-800 text-green-700 dark:text-green-300'
                    : 'bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300'
                }`}
              >
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full disabled:opacity-50"
            >
              {isLoading ? 'Wird gespeichert...' : 'Passwort ändern'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

