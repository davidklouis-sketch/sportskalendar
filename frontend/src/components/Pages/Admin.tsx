import { useState, useEffect } from 'react';
import { adminApi } from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';

interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  isPremium: boolean;
  selectedTeams: Array<{
    sport: string;
    teamName: string;
    leagueId?: number;
  }>;
}

export function Admin() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const { data } = await adminApi.getUsers();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
      alert('Fehler beim Laden der User-Liste');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromoteUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      await adminApi.promoteUser(userId);
      await loadUsers();
      alert('User wurde zum Admin befördert!');
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      console.error('Failed to promote user:', err);
      alert('Fehler: ' + (error.response?.data?.message || 'Konnte User nicht befördern'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDemoteUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      await adminApi.demoteUser(userId);
      await loadUsers();
      alert('Admin wurde zum User zurückgestuft!');
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      console.error('Failed to demote user:', err);
      alert('Fehler: ' + (error.response?.data?.message || 'Konnte User nicht zurückstufen'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleTogglePremium = async (userId: string) => {
    setActionLoading(userId);
    try {
      await adminApi.togglePremium(userId);
      await loadUsers();
      alert('Premium-Status wurde geändert!');
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      console.error('Failed to toggle premium:', err);
      alert('Fehler: ' + (error.response?.data?.message || 'Konnte Premium-Status nicht ändern'));
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="card p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Admin Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400">
            User-Verwaltung und Übersicht
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">Lade User...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Keine User gefunden</p>
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{user.displayName}</h3>
                      <div className="flex gap-2">
                        {user.role === 'admin' && (
                          <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold rounded">
                            ADMIN
                          </span>
                        )}
                        {user.isPremium && (
                          <span className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded">
                            PREMIUM
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {user.email}
                    </p>
                    
                    {user.selectedTeams && user.selectedTeams.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Ausgewählte Teams:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {user.selectedTeams.map((team, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs rounded"
                            >
                              {team.teamName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {user.id !== currentUser?.id && (
                    <div className="flex flex-col gap-2">
                      {user.role === 'admin' ? (
                        <button
                          onClick={() => handleDemoteUser(user.id)}
                          disabled={actionLoading === user.id}
                          className="px-3 py-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-900 dark:text-gray-100 text-sm rounded transition-colors disabled:opacity-50"
                        >
                          {actionLoading === user.id ? '...' : '↓ Zu User'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePromoteUser(user.id)}
                          disabled={actionLoading === user.id}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors disabled:opacity-50"
                        >
                          {actionLoading === user.id ? '...' : '↑ Zu Admin'}
                        </button>
                      )}

                      <button
                        onClick={() => handleTogglePremium(user.id)}
                        disabled={actionLoading === user.id}
                        className={`px-3 py-1 text-sm rounded transition-colors disabled:opacity-50 ${
                          user.isPremium
                            ? 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-900 dark:text-gray-100'
                            : 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white'
                        }`}
                      >
                        {actionLoading === user.id ? '...' : user.isPremium ? '⭐ Premium entfernen' : '⭐ Premium geben'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold mb-2">Statistik</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {users.length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Gesamt User</p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {users.filter(u => u.role === 'admin').length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Admins</p>
            </div>
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {users.filter(u => u.isPremium).length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Premium User</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

