// AdSense Debug Component

export function AdDebug() {
  const admobClientId = import.meta.env.VITE_ADMOB_CLIENT_ID;
  const bannerSlot = import.meta.env.VITE_ADMOB_BANNER_SLOT;
  const squareSlot = import.meta.env.VITE_ADMOB_SQUARE_SLOT;
  const leaderboardSlot = import.meta.env.VITE_ADMOB_LEADERBOARD_SLOT;
  const interstitialSlot = import.meta.env.VITE_ADMOB_INTERSTITIAL_SLOT;
  const mode = import.meta.env.MODE;
  
  // Check if AdSense script is loaded
  const isAdSenseLoaded = typeof window !== 'undefined' && !!(window as any).adsbygoogle;
  const adSenseArrayLength = typeof window !== 'undefined' && (window as any).adsbygoogle ? (window as any).adsbygoogle.length : 0;
  
  // Check if user is premium (ads are hidden for premium users)
  const { user } = useAuthStore();
  const isPremium = user?.isPremium;

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-3">
        🔍 AdSense Debug Information
      </h3>
      
      <div className="space-y-2 text-sm">
        {/* Legende */}
        <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-800/50 rounded border border-gray-200 dark:border-gray-700">
          <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Farb-Legende:</div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-2 py-1 rounded bg-green-100 text-green-800">✅ Konfiguriert</span>
            <span className="px-2 py-1 rounded bg-blue-100 text-blue-800">ℹ️ Standard-Wert</span>
            <span className="px-2 py-1 rounded bg-red-100 text-red-800">❌ Nicht gesetzt</span>
          </div>
        </div>
        <div>
          <span className="font-medium">Mode:</span> 
          <span className={`ml-2 px-2 py-1 rounded text-xs ${
            mode === 'production' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
          }`}>
            {mode}
          </span>
        </div>
        
        <div>
          <span className="font-medium">AdSense Script:</span>
          <span className={`ml-2 px-2 py-1 rounded text-xs ${
            isAdSenseLoaded ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {isAdSenseLoaded ? '✅ Geladen' : '❌ Nicht geladen'}
          </span>
        </div>
        
        <div>
          <span className="font-medium">AdSense Array:</span>
          <span className={`ml-2 px-2 py-1 rounded text-xs ${
            adSenseArrayLength > 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
            {adSenseArrayLength} Einträge
          </span>
        </div>
        
        <div>
          <span className="font-medium">User Status:</span>
          <span className={`ml-2 px-2 py-1 rounded text-xs ${
            isPremium ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
          }`}>
            {isPremium ? '⭐ Premium (Ads versteckt)' : '👤 Standard (Ads sichtbar)'}
          </span>
        </div>
        
        <div>
          <span className="font-medium">AdSense Publisher ID:</span>
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
          <span className={`ml-2 px-2 py-1 rounded text-xs ${
            bannerSlot && bannerSlot !== '7002462664' 
              ? 'bg-green-100 text-green-800' 
              : bannerSlot 
                ? 'bg-blue-100 text-blue-800'
                : 'bg-red-100 text-red-800'
          }`}>
            {bannerSlot || 'NICHT GESETZT'}
          </span>
        </div>
        
        <div>
          <span className="font-medium">Square Slot:</span>
          <span className={`ml-2 px-2 py-1 rounded text-xs ${
            squareSlot && squareSlot !== '5008646728' 
              ? 'bg-green-100 text-green-800' 
              : squareSlot 
                ? 'bg-blue-100 text-blue-800'
                : 'bg-red-100 text-red-800'
          }`}>
            {squareSlot || 'NICHT GESETZT'}
          </span>
        </div>
        
        <div>
          <span className="font-medium">Leaderboard Slot:</span>
          <span className={`ml-2 px-2 py-1 rounded text-xs ${
            leaderboardSlot && leaderboardSlot !== '4384038187' 
              ? 'bg-green-100 text-green-800' 
              : leaderboardSlot 
                ? 'bg-blue-100 text-blue-800'
                : 'bg-red-100 text-red-800'
          }`}>
            {leaderboardSlot || 'NICHT GESETZT'}
          </span>
        </div>
        
        <div>
          <span className="font-medium">Interstitial Slot:</span>
          <span className={`ml-2 px-2 py-1 rounded text-xs ${
            interstitialSlot && interstitialSlot !== '9901880755' 
              ? 'bg-green-100 text-green-800' 
              : interstitialSlot 
                ? 'bg-blue-100 text-blue-800'
                : 'bg-red-100 text-red-800'
          }`}>
            {interstitialSlot || 'NICHT GESETZT'}
          </span>
        </div>
      </div>
      
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
        <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">📋 AdSense Problem-Diagnose:</h4>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>1. <strong>GitHub Secrets prüfen:</strong> VITE_ADMOB_CLIENT_ID muss in GitHub gesetzt sein</li>
          <li>2. <strong>Domain genehmigt:</strong> sportskalendar.de muss in AdSense genehmigt sein</li>
          <li>3. <strong>AdBlocker deaktivieren:</strong> Kann AdSense blockieren</li>
          <li>4. <strong>Browser-Cache leeren:</strong> Ctrl+F5 für Hard Refresh</li>
        </ul>
        
        <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
          <h5 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">🔧 Beispiel .env.local (AdSense):</h5>
          <pre className="text-xs text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded overflow-x-auto">
{`VITE_ADMOB_CLIENT_ID=ca-pub-1234567890123456
VITE_ADMOB_BANNER_SLOT=7002462664
VITE_ADMOB_SQUARE_SLOT=5008646728
VITE_ADMOB_LEADERBOARD_SLOT=4384038187
VITE_ADMOB_INTERSTITIAL_SLOT=9901880755`}
          </pre>
        </div>
      </div>
    </div>
  );
}
