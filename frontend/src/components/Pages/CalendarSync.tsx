import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    loadSyncStatus();
  }, [user]);

  const loadSyncStatus = async () => {
    try {
      setIsLoading(true);
      console.log('[Calendar Sync Frontend] Loading sync status...');
      
      // First test if the API endpoint is available
      try {
        const testResponse = await fetch('/api/calendar-sync/test');
        const testData = await testResponse.json();
        console.log('[Calendar Sync Frontend] Test endpoint response:', testData);
      } catch (testError) {
        console.error('[Calendar Sync Frontend] Test endpoint failed:', testError);
      }
      
      const response = await calendarSyncApi.getSyncStatus();
      console.log('[Calendar Sync Frontend] Sync status response:', response.data);
      setSyncStatus(response.data);
    } catch (error: any) {
      console.error('[Calendar Sync Frontend] Failed to load sync status:', error);
      console.error('[Calendar Sync Frontend] Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      setError(`Fehler beim Laden der Kalender-Sync-Status: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

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
    } catch (error) {
      console.error('Export failed:', error);
      setError('Export fehlgeschlagen');
    }
  };

  const handleGetSyncUrl = async () => {
    try {
      const response = await calendarSyncApi.getSyncUrl();
      setInstructions(response.data.instructions);
      setSyncStatus(prev => prev ? { ...prev, syncUrl: response.data.syncUrl } : null);
      setShowInstructions(true);
    } catch (error) {
      console.error('Failed to get sync URL:', error);
      setError('Fehler beim Generieren der Sync-URL');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Show success message
      const button = event?.target as HTMLButtonElement;
      const originalText = button.textContent;
      button.textContent = 'Kopiert!';
      setTimeout(() => {
        button.textContent = originalText;
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Kalender-Sync-Status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Fehler</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadSyncStatus}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  if (!syncStatus) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-6xl mb-4">📅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Keine Daten</h2>
          <p className="text-gray-600">Kalender-Sync-Status konnte nicht geladen werden.</p>
        </div>
      </div>
    );
  }

  if (!syncStatus.isPremium) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="text-yellow-500 text-6xl mb-4">👑</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Premium erforderlich</h2>
          <p className="text-gray-600 mb-6">
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📅 Kalender-Sync</h1>
          <p className="text-gray-600">
            Synchronisiere deine Lieblings-Teams mit deinem Kalender
          </p>
        </div>

        {/* Status Overview */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Sync-Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{syncStatus.totalEvents}</div>
              <div className="text-sm text-gray-600">Gesamt Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{syncStatus.upcomingEvents}</div>
              <div className="text-sm text-gray-600">Bevorstehende</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {new Date(syncStatus.lastSync).toLocaleDateString('de-DE')}
              </div>
              <div className="text-sm text-gray-600">Letzter Sync</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {syncStatus.canSync ? '✅' : '❌'}
              </div>
              <div className="text-sm text-gray-600">Sync aktiv</div>
            </div>
          </div>
        </div>

        {/* Export Options */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">📥 Kalender exportieren</h2>
          <p className="text-gray-600 mb-4">
            Lade deine Sport-Events als Datei herunter und importiere sie in deinen Kalender.
          </p>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleExport('ics')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              📅 iCal (.ics)
            </button>
            <button
              onClick={() => handleExport('json')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              📄 JSON
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              📊 CSV
            </button>
          </div>
        </div>

        {/* Live Sync */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">🔄 Live-Synchronisation</h2>
          <p className="text-gray-600 mb-4">
            Abonniere deinen Kalender für automatische Updates in deinen Kalender-Apps.
          </p>
          
          <button
            onClick={handleGetSyncUrl}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            🔗 Sync-URL generieren
          </button>

          {showInstructions && syncStatus.syncUrl && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Sync-URL:</h3>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={syncStatus.syncUrl}
                  readOnly
                  className="flex-1 p-2 border rounded-lg bg-white"
                />
                <button
                  onClick={() => copyToClipboard(syncStatus.syncUrl)}
                  className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700"
                >
                  Kopieren
                </button>
              </div>

              {instructions && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Anleitungen:</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-3 bg-white rounded border">
                      <h5 className="font-medium text-blue-600 mb-2">📱 Google Calendar</h5>
                      <p className="text-sm text-gray-600">{instructions.google}</p>
                    </div>
                    <div className="p-3 bg-white rounded border">
                      <h5 className="font-medium text-orange-600 mb-2">📧 Outlook</h5>
                      <p className="text-sm text-gray-600">{instructions.outlook}</p>
                    </div>
                    <div className="p-3 bg-white rounded border">
                      <h5 className="font-medium text-gray-600 mb-2">🍎 Apple Calendar</h5>
                      <p className="text-sm text-gray-600">{instructions.apple}</p>
                    </div>
                    <div className="p-3 bg-white rounded border">
                      <h5 className="font-medium text-green-600 mb-2">🌐 Andere Apps</h5>
                      <p className="text-sm text-gray-600">{instructions.general}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">⚙️ Sync-Einstellungen</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Event-Einstellungen</h3>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={syncStatus.settings.includePastEvents}
                    className="mr-2"
                    readOnly
                  />
                  <span className="text-sm text-gray-700">Vergangene Events einschließen</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={syncStatus.settings.includeFutureEvents}
                    className="mr-2"
                    readOnly
                  />
                  <span className="text-sm text-gray-700">Zukünftige Events einschließen</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={syncStatus.settings.includeScores}
                    className="mr-2"
                    readOnly
                  />
                  <span className="text-sm text-gray-700">Ergebnisse einschließen</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={syncStatus.settings.includeTeamLogos}
                    className="mr-2"
                    readOnly
                  />
                  <span className="text-sm text-gray-700">Team-Logos einschließen</span>
                </label>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Benachrichtigungen</h3>
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Erinnerungen:</span> {syncStatus.settings.eventReminders.join(', ')} Minuten vorher
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Standard-Dauer:</span> {syncStatus.settings.defaultEventDuration} Minuten
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Zeitzone:</span> {syncStatus.settings.timezone}
                </div>
                <div className="text-sm text-gray-600">
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
