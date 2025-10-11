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
    // AdSense Script ist bereits in index.html geladen
    // Hier nur sicherstellen, dass adsbygoogle Array existiert
    if (typeof window !== 'undefined') {
      (window as any).adsbygoogle = (window as any).adsbygoogle || [];
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
    return null;
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
    return null;
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
    return null;
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
