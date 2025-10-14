import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { calendarSyncApi } from '../../lib/api';

interface CalendarSyncStatus {
  isPremium: boolean;
  canSync: boolean;
  totalEvents: number;
  upcomingEvents: number;
  lastSync: string;
  syncUrl: string;
  settings: {
    includePastEvents: boolean;
    includeFutureEvents: boolean;
    eventReminders: number[];
    defaultEventDuration: number;
    includeScores: boolean;
    includeTeamLogos: boolean;
    sports: string[];
    timezone: string;
  };
}

interface SyncInstructions {
  google: string;
  outlook: string;
  apple: string;
  general: string;
}

const CalendarSync: React.FC = () => {
  const { user } = useAuthStore();
  const [syncStatus, setSyncStatus] = useState<CalendarSyncStatus | null>(null);
  const [instructions, setInstructions] = useState<SyncInstructions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  // const [selectedFormat, setSelectedFormat] = useState<'ics' | 'json' | 'csv'>('ics');

  const loadSyncStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      // Loading sync status
      
      // First test if the API endpoint is available
      try {
        const testResponse = await fetch('/api/calendar-sync/test');
        await testResponse.json();
        // Test endpoint response
      } catch (testError) {
        // Test endpoint failed
      }
      
      const response = await calendarSyncApi.getSyncStatus();
      // Sync status response
      setSyncStatus(response.data);
    } catch (error: unknown) {
      // Failed to load sync status
      
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      // const errorResponse = error && typeof error === 'object' && 'response' in error ? (error as any).response : null;
      
      // Error details logged
      setError(`Fehler beim Laden der Kalender-Sync-Status: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]); // Add dependencies for useCallback

  useEffect(() => {
    if (user?.id) {
      loadSyncStatus();
    }
  }, [user?.id]); // loadSyncStatus entfernt um Infinite Loop zu vermeiden

  const handleExport = async (format: 'ics' | 'json' | 'csv') => {
    try {
      const response = await calendarSyncApi.exportCalendar(format);
      
      // Create download link
      const blob = new Blob([response.data], { 
        type: format === 'ics' ? 'text/calendar' : 
              format === 'json' ? 'application/json' : 'text/csv'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sportskalendar.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: unknown) {
      // Export failed
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      setError(`Export fehlgeschlagen: ${errorMessage}`);
    }
  };

  const handleGetSyncUrl = async () => {
    try {
      // Starting sync URL generation
      const response = await calendarSyncApi.getSyncUrl();
      // Sync URL response
      
      setInstructions(response.data.instructions);
      setSyncStatus(prev => prev ? { ...prev, syncUrl: response.data.syncUrl } : null);
      setShowInstructions(true);
      
      // Sync URL generated successfully
    } catch (error: unknown) {
      // Failed to get sync URL
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      // const errorResponse = error && typeof error === 'object' && 'response' in error ? (error as any).response : null;
      
      // Error details logged
      
      setError(`Fehler beim Generieren der Sync-URL: ${errorMessage}`);
    }
  };

  const copyToClipboard = async (text: string, button?: HTMLButtonElement) => {
    try {
      await navigator.clipboard.writeText(text);
      // Show success message
      if (button) {
        const originalText = button.textContent;
        button.textContent = 'Kopiert!';
        setTimeout(() => {
          button.textContent = originalText;
        }, 2000);
      }
    } catch (error: unknown) {
      // Failed to copy
      // const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      // Copy to clipboard failed
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Lade Kalender-Sync-Status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Fehler</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <button
            onClick={loadSyncStatus}
            className="btn btn-primary flex items-center gap-2"
          >
            🔄 Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  if (!syncStatus) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 dark:text-gray-300 text-6xl mb-4">📅</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Keine Daten</h2>
          <p className="text-gray-600 dark:text-gray-300">Kalender-Sync-Status konnte nicht geladen werden.</p>
        </div>
      </div>
    );
  }

  if (!syncStatus.isPremium) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="text-yellow-500 text-6xl mb-4">👑</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Premium erforderlich</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Kalender-Sync ist ein Premium-Feature. Upgrade dein Konto, um deine Lieblings-Teams 
            mit deinem Kalender zu synchronisieren.
          </p>
          <a
            href="/premium"
            className="bg-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-yellow-600 font-semibold"
          >
            Jetzt upgraden
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="heading-sport text-4xl font-bold mb-4">📅 Kalender-Sync</h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Synchronisiere deine Lieblings-Teams mit deinem Kalender
          </p>
        </div>

        {/* Status Overview */}
        <div className="card p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Sync-Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{syncStatus.totalEvents}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Gesamt Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{syncStatus.upcomingEvents}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Bevorstehende</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {new Date(syncStatus.lastSync).toLocaleDateString('de-DE')}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Letzter Sync</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {syncStatus.canSync ? '✅' : '❌'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Sync aktiv</div>
            </div>
          </div>
        </div>

        {/* Export Options */}
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">📥 Kalender exportieren</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Lade deine Sport-Events als Datei herunter und importiere sie in deinen Kalender.
          </p>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleExport('ics')}
              className="btn btn-primary flex items-center gap-2 group"
            >
              <span className="text-lg group-hover:scale-110 transition-transform duration-300">📅</span>
              <span className="font-semibold">iCal (.ics)</span>
            </button>
            <button
              onClick={() => handleExport('json')}
              className="btn btn-accent flex items-center gap-2 group"
            >
              <span className="text-lg group-hover:scale-110 transition-transform duration-300">📄</span>
              <span className="font-semibold">JSON</span>
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="btn btn-secondary flex items-center gap-2 group"
            >
              <span className="text-lg group-hover:scale-110 transition-transform duration-300">📊</span>
              <span className="font-semibold">CSV</span>
            </button>
          </div>
        </div>

        {/* Live Sync */}
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">🔄 Live-Synchronisation</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Abonniere deinen Kalender für automatische Updates in deinen Kalender-Apps.
          </p>
          
          <button
            onClick={handleGetSyncUrl}
            className="btn btn-primary text-lg px-8 py-4 flex items-center gap-3 group"
          >
            <span className="text-2xl group-hover:rotate-12 transition-transform duration-300">🔄</span>
            <span className="font-bold">Sync-URL generieren</span>
          </button>

          {showInstructions && syncStatus.syncUrl && (
            <div className="mt-6 p-6 card">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <span className="text-xl">🔗</span>
                Sync-URL:
              </h3>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={syncStatus.syncUrl}
                  readOnly
                  className="flex-1 p-3 border border-cyan-500/30 rounded-lg bg-dark-800 text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300"
                />
                <button
                  onClick={(e) => copyToClipboard(syncStatus.syncUrl, e.currentTarget)}
                  className="btn btn-primary px-4 py-2 flex items-center gap-2 group"
                >
                  <span className="group-hover:scale-110 transition-transform duration-300">📋</span>
                  <span className="font-semibold">Kopieren</span>
                </button>
              </div>

              {instructions && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="text-xl">📖</span>
                    Anleitungen:
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="card p-4 hover:shadow-xl transition-all duration-300 group">
                      <h5 className="font-semibold text-cyan-600 mb-2 flex items-center gap-2 group-hover:text-cyan-500 transition-colors">
                        <span className="text-xl">📱</span>
                        Google Calendar
                      </h5>
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{instructions.google}</p>
                    </div>
                    <div className="card p-4 hover:shadow-xl transition-all duration-300 group">
                      <h5 className="font-semibold text-orange-600 mb-2 flex items-center gap-2 group-hover:text-orange-500 transition-colors">
                        <span className="text-xl">📧</span>
                        Outlook
                      </h5>
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{instructions.outlook}</p>
                    </div>
                    <div className="card p-4 hover:shadow-xl transition-all duration-300 group">
                      <h5 className="font-semibold text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2 flex items-center gap-2 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors">
                        <span className="text-xl">🍎</span>
                        Apple Calendar
                      </h5>
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{instructions.apple}</p>
                    </div>
                    <div className="card p-4 hover:shadow-xl transition-all duration-300 group">
                      <h5 className="font-semibold text-lime-600 mb-2 flex items-center gap-2 group-hover:text-lime-500 transition-colors">
                        <span className="text-xl">🌐</span>
                        Andere Apps
                      </h5>
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{instructions.general}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">⚙️ Sync-Einstellungen</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Event-Einstellungen</h3>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={syncStatus.settings.includePastEvents}
                    className="mr-2"
                    readOnly
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Vergangene Events einschließen</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={syncStatus.settings.includeFutureEvents}
                    className="mr-2"
                    readOnly
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Zukünftige Events einschließen</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={syncStatus.settings.includeScores}
                    className="mr-2"
                    readOnly
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Ergebnisse einschließen</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={syncStatus.settings.includeTeamLogos}
                    className="mr-2"
                    readOnly
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Team-Logos einschließen</span>
                </label>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Benachrichtigungen</h3>
              <div className="space-y-2">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Erinnerungen:</span> {syncStatus.settings.eventReminders.join(', ')} Minuten vorher
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Standard-Dauer:</span> {syncStatus.settings.defaultEventDuration} Minuten
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Zeitzone:</span> {syncStatus.settings.timezone}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Sportarten:</span> {syncStatus.settings.sports.join(', ')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarSync;
