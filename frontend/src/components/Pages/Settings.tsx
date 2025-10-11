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
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'premium'>('profile');

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 opacity-90"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            {/* App Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-6">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            
            <h1 className="text-4xl font-bold text-white mb-4">
              Dein Profil
            </h1>
            <p className="text-xl text-indigo-100 max-w-2xl mx-auto">
              Verwalte deine Account-Einstellungen, Sicherheit und Premium-Features
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* User Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden mb-8">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white">
            <div className="flex items-center space-x-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                {user?.isPremium && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">⭐</span>
                  </div>
                )}
              </div>
              
              {/* User Info */}
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">{user?.displayName}</h2>
                <p className="text-indigo-100 text-lg mb-4">{user?.email}</p>
                
                {/* Status Badges */}
                <div className="flex flex-wrap gap-3">
                  {user?.role === 'admin' && (
                    <span className="inline-flex items-center px-4 py-2 bg-purple-500/30 backdrop-blur-sm text-white text-sm font-semibold rounded-full border border-purple-300/30">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                      </svg>
                      ADMIN
                    </span>
                  )}
                  
                  {user?.isPremium ? (
                    <span className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-semibold rounded-full shadow-lg">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      PREMIUM
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-4 py-2 bg-gray-500/30 backdrop-blur-sm text-white text-sm font-semibold rounded-full border border-gray-300/30">
                      FREE ACCOUNT
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-all ${
                  activeTab === 'profile'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profil
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('security')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-all ${
                  activeTab === 'security'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Sicherheit
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('premium')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-all ${
                  activeTab === 'premium'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Premium
                </div>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'profile' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Profil-Informationen</h3>
                  
                  {/* Account Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-2xl border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center">
                        <div className="p-3 bg-blue-500 rounded-xl">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Teams verfolgt</p>
                          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{user?.selectedTeams?.length || 0}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-2xl border border-green-200 dark:border-green-800">
                      <div className="flex items-center">
                        <div className="p-3 bg-green-500 rounded-xl">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-green-600 dark:text-green-400">Account-Status</p>
                          <p className="text-lg font-bold text-green-900 dark:text-green-100">Aktiv</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-2xl border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center">
                        <div className="p-3 bg-purple-500 rounded-xl">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Premium-Features</p>
                          <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
                            {user?.isPremium ? 'Unbegrenzt' : 'Eingeschränkt'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Selected Teams */}
                  {user?.selectedTeams && user.selectedTeams.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Deine Teams</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {user.selectedTeams.map((team, index) => (
                          <div key={index} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                            <div className="flex items-center">
                              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                <span className="text-2xl">
                                  {team.sport === 'football' ? '⚽' : team.sport === 'nfl' ? '🏈' : team.sport === 'f1' ? '🏎️' : team.sport === 'nba' ? '🏀' : team.sport === 'nhl' ? '🏒' : team.sport === 'mlb' ? '⚾' : team.sport === 'tennis' ? '🎾' : '🏆'}
                                </span>
                              </div>
                              <div className="ml-3">
                                <p className="font-medium text-gray-900 dark:text-white">{team.teamName}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{team.sport}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Sicherheits-Einstellungen</h3>
                  
                  {/* Password Change Form */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-8">
                    <div className="flex items-center mb-6">
                      <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                        <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <h4 className="text-xl font-semibold text-gray-900 dark:text-white">Passwort ändern</h4>
                        <p className="text-gray-600 dark:text-gray-400">Aktualisiere dein Passwort für mehr Sicherheit</p>
                      </div>
                    </div>

                    <form onSubmit={handleChangePassword} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                            Aktuelles Passwort
                          </label>
                          <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            placeholder="••••••••"
                            autoComplete="current-password"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                            Neues Passwort
                          </label>
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            placeholder="••••••••"
                            autoComplete="new-password"
                            minLength={8}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                          Neues Passwort bestätigen
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                          placeholder="••••••••"
                          autoComplete="new-password"
                          minLength={8}
                        />
                      </div>

                      {message && (
                        <div
                          className={`p-4 rounded-xl text-sm font-medium ${
                            message.type === 'success'
                              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
                              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                          }`}
                        >
                          <div className="flex items-center">
                            {message.type === 'success' ? (
                              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            )}
                            {message.text}
                          </div>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                            Wird gespeichert...
                          </div>
                        ) : (
                          'Passwort ändern'
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'premium' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Premium-Features</h3>
                  
                  {user?.isPremium ? (
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl p-8 border border-yellow-200 dark:border-yellow-800">
                      <div className="text-center">
                        <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                          <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </div>
                        <h4 className="text-2xl font-bold text-yellow-900 dark:text-yellow-100 mb-4">Premium aktiv!</h4>
                        <p className="text-lg text-yellow-700 dark:text-yellow-300 mb-6">
                          Du genießt bereits alle Premium-Features
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-8 border border-indigo-200 dark:border-indigo-800">
                      <div className="text-center">
                        <div className="w-20 h-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                          <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </div>
                        <h4 className="text-2xl font-bold text-indigo-900 dark:text-indigo-100 mb-4">Upgrade zu Premium</h4>
                        <p className="text-lg text-indigo-700 dark:text-indigo-300 mb-6">
                          Entdecke alle Premium-Features und genieße die beste Sportskalendar-Erfahrung
                        </p>
                        <button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg">
                          Jetzt upgraden
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Premium Features List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center mb-4">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                          <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <h5 className="text-lg font-semibold text-gray-900 dark:text-white ml-3">Kalender-Sync</h5>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">Synchronisiere deine Spieltermine mit allen wichtigen Kalender-Apps</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center mb-4">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 1 0-15 0v5h5l-5 5-5-5h5v-5a10 10 0 1 1 20 0v5z" />
                          </svg>
                        </div>
                        <h5 className="text-lg font-semibold text-gray-900 dark:text-white ml-3">Werbefrei</h5>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">Genieße eine werbefreie Nutzung ohne Unterbrechungen</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center mb-4">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                          <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <h5 className="text-lg font-semibold text-gray-900 dark:text-white ml-3">Priorisierter Support</h5>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">Erhalte schnelle Hilfe und Priorität beim Support</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center mb-4">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                          <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <h5 className="text-lg font-semibold text-gray-900 dark:text-white ml-3">Exklusive Statistiken</h5>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">Zugang zu detaillierten Statistiken und Analysen</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}