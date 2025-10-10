// AdMob Debug Component

export function AdDebug() {
  const admobClientId = import.meta.env.VITE_ADMOB_CLIENT_ID;
  const bannerSlot = import.meta.env.VITE_ADMOB_BANNER_SLOT;
  const squareSlot = import.meta.env.VITE_ADMOB_SQUARE_SLOT;
  const leaderboardSlot = import.meta.env.VITE_ADMOB_LEADERBOARD_SLOT;
  const interstitialSlot = import.meta.env.VITE_ADMOB_INTERSTITIAL_SLOT;
  const mode = import.meta.env.MODE;

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-3">
        🔍 AdMob Debug Information
      </h3>
      
      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium">Mode:</span> 
          <span className={`ml-2 px-2 py-1 rounded text-xs ${
            mode === 'production' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
          }`}>
            {mode}
          </span>
        </div>
        
        <div>
          <span className="font-medium">AdMob Client ID:</span>
          <span className={`ml-2 px-2 py-1 rounded text-xs ${
            admobClientId && admobClientId !== 'ca-pub-xxxxxxxxxxxxxxxx' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {admobClientId || 'NICHT GESETZT'}
          </span>
        </div>
        
        <div>
          <span className="font-medium">Banner Slot:</span>
          <span className="ml-2 px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">
            {bannerSlot || 'NICHT GESETZT'}
          </span>
        </div>
        
        <div>
          <span className="font-medium">Square Slot:</span>
          <span className="ml-2 px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">
            {squareSlot || 'NICHT GESETZT'}
          </span>
        </div>
        
        <div>
          <span className="font-medium">Leaderboard Slot:</span>
          <span className="ml-2 px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">
            {leaderboardSlot || 'NICHT GESETZT'}
          </span>
        </div>
        
        <div>
          <span className="font-medium">Interstitial Slot:</span>
          <span className="ml-2 px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">
            {interstitialSlot || 'NICHT GESETZT'}
          </span>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
        <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">📋 Nächste Schritte:</h4>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>1. Erstellen Sie eine <code>.env.local</code> Datei im frontend/ Ordner</li>
          <li>2. Fügen Sie Ihre echte AdMob Publisher ID hinzu</li>
          <li>3. Starten Sie den Development Server neu</li>
          <li>4. Oder konfigurieren Sie GitHub Secrets für Production</li>
        </ul>
      </div>
    </div>
  );
}
