import React, { useEffect } from 'react';

interface AdSquareProps {
  slotId: string;
  style?: React.CSSProperties;
  className?: string;
}

export function AdSquare({ slotId, style, className }: AdSquareProps) {
  const defaultStyle: React.CSSProperties = {
    display: 'block',
    width: '300px',
    height: '250px',
    margin: '0 auto',
    ...style
  };

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch (error) {
      console.error('AdSense initialization error:', error);
    }
  }, []);

  // Temporär: Immer echte AdSense-Anzeige anzeigen für Debugging
  const clientId = 'ca-pub-2481184858901580'; // Hardcoded für Debugging
  
  // Debug: Zeige Environment Variable Status
  console.log('AdSquare Debug:', {
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
        data-ad-format="rectangle"
        data-full-width-responsive="false"
      />
    </div>
  );
}
