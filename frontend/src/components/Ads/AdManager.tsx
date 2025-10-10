import React, { useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { AdBanner } from './AdBanner';
import { AdSquare } from './AdSquare';
import { AdLeaderboard } from './AdLeaderboard';
import { AdInterstitial } from './AdInterstitial';

interface AdManagerProps {
  children: React.ReactNode;
}

export function AdManager({ children }: AdManagerProps) {
  useEffect(() => {
    // AdSense Script laden
    if (import.meta.env.MODE === 'production') {
      const loadAdSense = () => {
        if (typeof window !== 'undefined' && !(window as any).adsbygoogle) {
          const script = document.createElement('script');
          script.async = true;
          script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
          script.crossOrigin = 'anonymous';
          script.setAttribute('data-ad-client', import.meta.env.VITE_ADMOB_CLIENT_ID);
          document.head.appendChild(script);
          
          script.onload = () => {
            console.log('AdSense Script geladen');
            // Ads initialisieren
            try {
              ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
            } catch (error) {
              console.error('Fehler beim Initialisieren von AdSense:', error);
            }
          };
        }
      };

      loadAdSense();
    }
  }, []);

  return <>{children}</>;
}

// Hook für Ad-Trigger
export function useAdTrigger() {
  const [interstitialTrigger, setInterstitialTrigger] = React.useState(false);

  const triggerInterstitial = () => {
    setInterstitialTrigger(true);
    // Reset nach kurzer Zeit
    setTimeout(() => setInterstitialTrigger(false), 100);
  };

  return { interstitialTrigger, triggerInterstitial };
}

// Vordefinierte Ad-Komponenten mit Ihren Slot-IDs
export function SportsKalendarBanner() {
  const { user } = useAuthStore();
  
  // Verstecke Ads für Premium-Nutzer
  if (user?.isPremium) {
    return (
      <div className="my-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
        <div className="text-center">
          <div className="text-2xl mb-2">⭐</div>
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Premium-Nutzer sehen keine Werbung
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <AdBanner 
      slotId={import.meta.env.VITE_ADMOB_BANNER_SLOT || '7002462664'}
      className="my-4"
    />
  );
}

export function SportsKalendarSquare() {
  const { user } = useAuthStore();
  
  // Verstecke Ads für Premium-Nutzer
  if (user?.isPremium) {
    return (
      <div className="my-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
        <div className="text-center">
          <div className="text-2xl mb-2">⭐</div>
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Premium-Nutzer sehen keine Werbung
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <AdSquare 
      slotId={import.meta.env.VITE_ADMOB_SQUARE_SLOT || '5008646728'}
      className="my-4"
    />
  );
}

export function SportsKalendarLeaderboard() {
  const { user } = useAuthStore();
  
  // Verstecke Ads für Premium-Nutzer
  if (user?.isPremium) {
    return (
      <div className="my-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
        <div className="text-center">
          <div className="text-2xl mb-2">⭐</div>
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Premium-Nutzer sehen keine Werbung
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <AdLeaderboard 
      slotId={import.meta.env.VITE_ADMOB_LEADERBOARD_SLOT || '4384038187'}
      className="my-4"
    />
  );
}

export function SportsKalendarInterstitial({ trigger }: { trigger: boolean }) {
  const { user } = useAuthStore();
  
  // Verstecke Interstitial Ads für Premium-Nutzer
  if (user?.isPremium) {
    return null;
  }
  
  return (
    <AdInterstitial 
      slotId={import.meta.env.VITE_ADMOB_INTERSTITIAL_SLOT || '9901880755'}
      trigger={trigger}
    />
  );
}
