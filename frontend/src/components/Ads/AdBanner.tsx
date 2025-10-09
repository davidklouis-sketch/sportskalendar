import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';

interface AdBannerProps {
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
  className?: string;
  style?: React.CSSProperties;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export function AdBanner({ slot, format = 'auto', className = '', style = {} }: AdBannerProps) {
  const { user } = useAuthStore();
  const adRef = useRef<HTMLModElement>(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);

  // Don't show ads for premium users
  if (user?.isPremium) {
    return null;
  }

  useEffect(() => {
    // Only load ads if AdSense script is available and user is not premium
    if (window.adsbygoogle && adRef.current && !adLoaded && !user?.isPremium) {
      try {
        // Push ad to AdSense queue
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        setAdLoaded(true);
      } catch (error) {
        console.error('AdSense error:', error);
        setAdError(true);
      }
    }
  }, [adLoaded, user?.isPremium]);

  // Don't render if premium user or ad error
  if (user?.isPremium || adError) {
    return null;
  }

  return (
    <div className={`ad-container ${className}`} style={style}>
      <div className="text-xs text-gray-400 text-center mb-1">Werbung</div>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{
          display: 'block',
          textAlign: 'center',
          ...style
        }}
        data-ad-client={import.meta.env.VITE_ADMOB_CLIENT_ID || 'ca-pub-0000000000000000'}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}

// Specific banner components for common use cases
export function BannerAd({ className = '' }: { className?: string }) {
  return (
    <AdBanner
      slot={import.meta.env.VITE_ADMOB_BANNER_SLOT || '0000000000'}
      format="horizontal"
      className={className}
      style={{ minHeight: '90px' }}
    />
  );
}

export function SquareAd({ className = '' }: { className?: string }) {
  return (
    <AdBanner
      slot={import.meta.env.VITE_ADMOB_SQUARE_SLOT || '0000000001'}
      format="rectangle"
      className={className}
      style={{ minHeight: '250px', minWidth: '250px' }}
    />
  );
}

export function LeaderboardAd({ className = '' }: { className?: string }) {
  return (
    <AdBanner
      slot={import.meta.env.VITE_ADMOB_LEADERBOARD_SLOT || '0000000002'}
      format="horizontal"
      className={className}
      style={{ minHeight: '90px' }}
    />
  );
}

