import React, { useEffect } from 'react';

interface AdBannerProps {
  slotId: string;
  style?: React.CSSProperties;
  className?: string;
  format?: 'auto' | 'rectangle' | 'vertical' | 'horizontal';
}

export function AdBanner({ slotId, style, className, format = 'auto' }: AdBannerProps) {
  const defaultStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    height: 'auto',
    minHeight: '90px',
    ...style
  };

  useEffect(() => {
    try {
      // AdSense Initialisierung für diese spezifische Ad
      if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        console.log('AdSense Banner initialisiert für Slot:', slotId);
      }
    } catch (error) {
      console.error('AdSense Banner initialization error:', error);
    }
  }, [slotId]);

  // Temporär: Immer echte AdSense-Anzeige anzeigen für Debugging
  const clientId = import.meta.env.VITE_ADMOB_CLIENT_ID || 'ca-pub-2481184858901580';
  
  // Debug: Zeige Environment Variable Status
  console.log('AdBanner Debug:', {
    clientId,
    slotId,
    hasClientId: !!import.meta.env.VITE_ADMOB_CLIENT_ID,
    envClientId: import.meta.env.VITE_ADMOB_CLIENT_ID
  });

  return (
    <div className={className} style={defaultStyle}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={clientId}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
