import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';

interface InterstitialAdProps {
  onClose: () => void;
  showAfterSeconds?: number;
}

export function InterstitialAd({ onClose, showAfterSeconds = 3 }: InterstitialAdProps) {
  const { user } = useAuthStore();
  const [countdown, setCountdown] = useState(showAfterSeconds);
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanClose(true);
    }
  }, [countdown]);

  // Don't show for premium users
  if (user?.isPremium) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full mx-4 p-6 relative">
        {/* Close button - only shown after countdown */}
        {canClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Schließen"
          >
            ×
          </button>
        )}

        {/* Countdown indicator */}
        {!canClose && (
          <div className="absolute top-4 right-4 bg-primary-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
            {countdown}
          </div>
        )}

        {/* Ad content */}
        <div className="text-center">
          <div className="text-xs text-gray-400 mb-4">Gesponserte Werbung</div>
          
          {/* AdSense Interstitial */}
          <ins
            className="adsbygoogle"
            style={{
              display: 'block',
              minHeight: '400px',
              width: '100%'
            }}
            data-ad-client={import.meta.env.VITE_ADMOB_CLIENT_ID || 'ca-pub-4197809086839786'}
            data-ad-slot={import.meta.env.VITE_ADMOB_INTERSTITIAL_SLOT || '1234567893'}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />

          {/* Upgrade to Premium CTA */}
          <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              🌟 Keine Werbung mit Premium
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              Upgrade jetzt und genieße werbefreie Nutzung + unbegrenzte Teams!
            </p>
            <a
              href="#premium"
              className="inline-block px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              onClick={(e) => {
                e.preventDefault();
                onClose();
                // Navigate to premium page
                window.location.hash = 'premium';
              }}
            >
              Jetzt upgraden für €9.99/Monat
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

