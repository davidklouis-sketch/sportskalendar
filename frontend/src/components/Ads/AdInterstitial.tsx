import { useEffect } from 'react';

interface AdInterstitialProps {
  slotId: string;
  trigger?: boolean;
  onAdLoaded?: () => void;
  onAdFailed?: (error: any) => void;
}

export function AdInterstitial({ slotId, trigger = false, onAdLoaded, onAdFailed }: AdInterstitialProps) {
  useEffect(() => {
    // Nur in Production laden
    if (import.meta.env.MODE !== 'production') {
      if (trigger) {
        onAdLoaded?.();
      }
      return;
    }

    // AdSense Script laden falls noch nicht geladen
    const loadAdSense = () => {
      if (typeof window !== 'undefined' && !(window as any).adsbygoogle) {
        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
        script.crossOrigin = 'anonymous';
        script.setAttribute('data-ad-client', import.meta.env.VITE_ADMOB_CLIENT_ID);
        document.head.appendChild(script);
      }
    };

    loadAdSense();

    // Interstitial Ad anzeigen wenn trigger true ist
    if (trigger) {
      const showInterstitial = () => {
        try {
          // AdSense Interstitial wird automatisch geladen und angezeigt
          // Hier können wir zusätzliche Logik hinzufügen
          onAdLoaded?.();
        } catch (error) {
          // Fehler beim Laden des Interstitial Ads
          onAdFailed?.(error);
        }
      };

      // Kurze Verzögerung um sicherzustellen dass AdSense geladen ist
      setTimeout(showInterstitial, 1000);
    }
  }, [slotId, trigger, onAdLoaded, onAdFailed]);

  // Interstitial Ads werden nicht als DOM-Element gerendert
  return null;
}
